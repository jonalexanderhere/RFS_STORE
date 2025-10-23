// Supabase Edge Function: Telegram Webhook Handler
// Deploy: supabase functions deploy telegram-webhook
// Full integration with RFS_STORE notification system

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-telegram-bot-api-secret-token',
}

// Admin WhatsApp numbers
const ADMIN_WHATSAPP = {
  admin1: '6282181183590', // Format: 62xxx
  admin2: '6282176466707'
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Verify webhook secret token
    const secretToken = req.headers.get('X-Telegram-Bot-Api-Secret-Token')
    const TELEGRAM_SECRET = Deno.env.get('TELEGRAM_SECRET_TOKEN')
    
    if (TELEGRAM_SECRET && secretToken !== TELEGRAM_SECRET) {
      console.log('❌ Invalid secret token')
      throw new Error('Invalid secret token')
    }

    const update = await req.json()
    console.log('📱 Telegram update received:', JSON.stringify(update, null, 2))
    
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)
    
    const TELEGRAM_BOT_TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN')!
    const TELEGRAM_API_URL = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}`

    // Helper function to send Telegram message
    const sendTelegramMessage = async (chatId: string, text: string, options = {}) => {
      try {
        const response = await fetch(`${TELEGRAM_API_URL}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: chatId,
            text: text,
            parse_mode: 'HTML',
            ...options
          })
        })
        const data = await response.json()
        if (!data.ok) {
          console.error('Telegram send error:', data)
        }
        return data
      } catch (error) {
        console.error('Telegram API error:', error)
        return null
      }
    }

    // Helper function to send WhatsApp via Fonnte
    const sendWhatsAppMessage = async (phone: string, message: string) => {
      const FONNTE_TOKEN = Deno.env.get('FONNTE_DEVICE_TOKEN') || Deno.env.get('FONNTE_TOKEN')
      if (!FONNTE_TOKEN) {
        console.log('⚠️ Fonnte token not configured')
        return null
      }

      try {
        const response = await fetch('https://api.fonnte.com/send', {
          method: 'POST',
          headers: {
            'Authorization': FONNTE_TOKEN,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            target: phone,
            message: message,
            countryCode: '62'
          })
        })
        const data = await response.json()
        console.log('📱 WhatsApp response:', data)
        return data
      } catch (error) {
        console.error('WhatsApp error:', error)
        return null
      }
    }

    // Handle callback queries (button clicks)
    if (update.callback_query) {
      const callbackQuery = update.callback_query
      const data = callbackQuery.data
      const chatId = callbackQuery.message.chat.id

      console.log('🔘 Callback query:', data)

      // Handle verify payment
      if (data.startsWith('verify_payment_')) {
        const invoiceId = data.replace('verify_payment_', '')
        
        // Get invoice details
        const { data: invoice, error: invoiceError } = await supabase
          .from('invoices')
          .select(`
            *,
            order:orders(
              *,
              user:profiles(*)
            )
          `)
          .eq('id', invoiceId)
          .single()

        if (invoiceError || !invoice) {
          await sendTelegramMessage(chatId, '❌ Error: Invoice tidak ditemukan')
          return new Response(JSON.stringify({ success: false }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200
          })
        }

        // Update invoice status to paid
        const { error: updateError } = await supabase
          .from('invoices')
          .update({ 
            status: 'paid',
            paid_at: new Date().toISOString(),
            verified_by: invoice.order?.user_id,
            verified_at: new Date().toISOString()
          })
          .eq('id', invoiceId)

        if (updateError) {
          console.error('Error verifying payment:', updateError)
          await sendTelegramMessage(chatId, '❌ Error: Gagal verifikasi pembayaran')
        } else {
          await sendTelegramMessage(
            chatId,
            `✅ <b>PEMBAYARAN DIVERIFIKASI</b>\n\n` +
            `Invoice: <code>${invoice.invoice_number}</code>\n` +
            `Amount: Rp ${invoice.amount.toLocaleString('id-ID')}\n` +
            `Customer: ${invoice.order?.user?.full_name}\n\n` +
            `Status diupdate ke PAID. Customer akan menerima notifikasi.`
          )

          // Notify customer via Telegram or WhatsApp
          const customer = invoice.order?.user
          if (customer) {
            const customerMessage = `✅ *PEMBAYARAN DITERIMA*\n\n` +
              `Invoice: ${invoice.invoice_number}\n` +
              `Amount: Rp ${invoice.amount.toLocaleString('id-ID')}\n\n` +
              `Pembayaran Anda telah diverifikasi! Pesanan akan segera diproses.\n\n` +
              `Terima kasih! 🙏`

            if (customer.telegram_id) {
              await sendTelegramMessage(customer.telegram_id, customerMessage)
            }
            if (customer.phone) {
              await sendWhatsAppMessage(customer.phone, customerMessage)
            }
          }
        }
      } 
      
      // Handle reject payment
      else if (data.startsWith('reject_payment_')) {
        const invoiceId = data.replace('reject_payment_', '')
        
        const { data: invoice, error: invoiceError } = await supabase
          .from('invoices')
          .select(`
            *,
            order:orders(
              *,
              user:profiles(*)
            )
          `)
          .eq('id', invoiceId)
          .single()

        if (invoiceError || !invoice) {
          await sendTelegramMessage(chatId, '❌ Error: Invoice tidak ditemukan')
          return new Response(JSON.stringify({ success: false }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200
          })
        }

        // Update invoice status back to unpaid
        const { error: updateError } = await supabase
          .from('invoices')
          .update({ 
            status: 'unpaid',
            admin_notes: 'Bukti pembayaran ditolak. Silakan upload ulang bukti yang valid.'
          })
          .eq('id', invoiceId)

        if (updateError) {
          console.error('Error rejecting payment:', updateError)
          await sendTelegramMessage(chatId, '❌ Error: Gagal reject pembayaran')
        } else {
          await sendTelegramMessage(
            chatId,
            `❌ <b>PEMBAYARAN DITOLAK</b>\n\n` +
            `Invoice: <code>${invoice.invoice_number}</code>\n` +
            `Customer: ${invoice.order?.user?.full_name}\n\n` +
            `Customer akan diminta upload ulang bukti pembayaran yang valid.`
          )

          // Notify customer
          const customer = invoice.order?.user
          if (customer) {
            const customerMessage = `⚠️ *PEMBAYARAN DITOLAK*\n\n` +
              `Invoice: ${invoice.invoice_number}\n\n` +
              `Bukti pembayaran Anda ditolak. Silakan upload ulang bukti yang valid.\n\n` +
              `Pastikan:\n` +
              `• Foto bukti jelas\n` +
              `• Jumlah sesuai invoice\n` +
              `• Rekening tujuan benar`

            if (customer.telegram_id) {
              await sendTelegramMessage(customer.telegram_id, customerMessage)
            }
            if (customer.phone) {
              await sendWhatsAppMessage(customer.phone, customerMessage)
            }
          }
        }
      }
      
      // Handle complete order
      else if (data.startsWith('complete_order_')) {
        const orderId = data.replace('complete_order_', '')
        
        // Update order status to completed
        const { error: updateError } = await supabase
          .from('orders')
          .update({ 
            status: 'completed',
            completed_at: new Date().toISOString()
          })
          .eq('id', orderId)

        if (updateError) {
          console.error('Error completing order:', updateError)
          await sendTelegramMessage(chatId, '❌ Error: Gagal complete order')
        } else {
          await sendTelegramMessage(
            chatId,
            '✅ <b>ORDER COMPLETED</b>\n\n' +
            'Order berhasil di-complete! Customer akan menerima notifikasi.'
          )
        }
      }
      
      // Handle create invoice
      else if (data.startsWith('create_invoice_')) {
        const orderId = data.replace('create_invoice_', '')
        
        await sendTelegramMessage(
          chatId,
          '📝 <b>CREATE INVOICE</b>\n\n' +
          'Silakan buat invoice untuk order ini melalui Admin Panel:\n\n' +
          `🔗 <a href="https://rfs-store.vercel.app/admin/invoices">Admin Panel - Invoices</a>\n\n` +
          `Order ID: <code>${orderId}</code>`
        )
      }

      // Answer callback query
      await fetch(`${TELEGRAM_API_URL}/answerCallbackQuery`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          callback_query_id: callbackQuery.id,
          text: 'Processed!'
        })
      })
    }
    
    // Handle regular messages (commands)
    else if (update.message) {
      const message = update.message
      const chatId = message.chat.id
      const text = message.text || ''

      console.log('💬 Message received:', text, 'from', chatId)

      // Handle /start command
      if (text.startsWith('/start')) {
        await sendTelegramMessage(
          chatId,
          `🎉 <b>Welcome to RFS_STORE Bot!</b>\n\n` +
          `Your Chat ID: <code>${chatId}</code>\n\n` +
          `Bot ini akan mengirimkan notifikasi untuk:\n` +
          `• 🆕 Pesanan baru\n` +
          `• 📄 Invoice baru\n` +
          `• 💰 Pembayaran masuk\n` +
          `• ✅ Status pesanan\n\n` +
          `<b>Simpan Chat ID Anda untuk konfigurasi!</b>\n\n` +
          `Commands:\n` +
          `/help - Show help\n` +
          `/chatid - Get your Chat ID\n` +
          `/status - Check bot status`
        )
      }
      
      // Handle /help command
      else if (text.startsWith('/help')) {
        await sendTelegramMessage(
          chatId,
          `📚 <b>RFS_STORE Bot Commands:</b>\n\n` +
          `/start - Start bot & get Chat ID\n` +
          `/help - Show this help message\n` +
          `/chatid - Get your Chat ID\n` +
          `/status - Check bot status\n\n` +
          `<b>Admin WhatsApp:</b>\n` +
          `• Admin 1: ${ADMIN_WHATSAPP.admin1}\n` +
          `• Admin 2: ${ADMIN_WHATSAPP.admin2}\n\n` +
          `Need help? Contact admin via WhatsApp.`
        )
      }
      
      // Handle /chatid command
      else if (text.startsWith('/chatid')) {
        await sendTelegramMessage(
          chatId,
          `🆔 <b>Your Chat ID</b>\n\n` +
          `<code>${chatId}</code>\n\n` +
          `Use this ID for:\n` +
          `• Registration form (optional)\n` +
          `• Admin configuration\n` +
          `• Receive notifications`
        )
      }
      
      // Handle /status command
      else if (text.startsWith('/status')) {
        const timestamp = new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })
        await sendTelegramMessage(
          chatId,
          `✅ <b>Bot Status: Online</b>\n\n` +
          `Bot is running and ready to send notifications!\n\n` +
          `Server Time: ${timestamp}\n` +
          `Your Chat ID: <code>${chatId}</code>`
        )
      }
      
      // Unknown command
      else {
        await sendTelegramMessage(
          chatId,
          `ℹ️ Unknown command.\n\n` +
          `Type /help to see available commands.`
        )
      }
    }

    return new Response(
      JSON.stringify({ success: true }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )
  } catch (error) {
    console.error('❌ Webhook error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 // Return 200 to avoid Telegram retries
      }
    )
  }
})
