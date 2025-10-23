// Supabase Edge Function: Telegram Webhook Handler
// Deploy: supabase functions deploy telegram-webhook

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-telegram-bot-api-secret-token',
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
      console.log('Invalid secret token')
      throw new Error('Invalid secret token')
    }

    const update = await req.json()
    console.log('Telegram update received:', update)
    
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)
    
    const TELEGRAM_BOT_TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN')!

    // Helper function to send Telegram message
    const sendTelegramMessage = async (chatId: string, text: string, options = {}) => {
      const response = await fetch(
        `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: chatId,
            text: text,
            parse_mode: 'HTML',
            ...options
          })
        }
      )
      return response.json()
    }

    // Handle callback queries (button clicks)
    if (update.callback_query) {
      const callbackQuery = update.callback_query
      const data = callbackQuery.data
      const chatId = callbackQuery.message.chat.id

      console.log('Callback query:', data)

      // Handle verify payment
      if (data.startsWith('verify_payment_')) {
        const invoiceId = data.replace('verify_payment_', '')
        
        // Update invoice status to paid
        const { error } = await supabase
          .from('invoices')
          .update({ 
            status: 'paid',
            paid_at: new Date().toISOString()
          })
          .eq('id', invoiceId)

        if (error) {
          console.error('Error verifying payment:', error)
          await sendTelegramMessage(chatId, '❌ Error: Gagal verifikasi pembayaran')
        } else {
          await sendTelegramMessage(
            chatId,
            '✅ Pembayaran berhasil diverifikasi!\n\nInvoice telah diupdate ke status PAID.'
          )
        }
      } 
      
      // Handle reject payment
      else if (data.startsWith('reject_payment_')) {
        const invoiceId = data.replace('reject_payment_', '')
        
        // Update invoice status back to unpaid
        const { error } = await supabase
          .from('invoices')
          .update({ 
            status: 'unpaid',
            admin_notes: 'Bukti pembayaran ditolak. Silakan upload ulang bukti yang valid.'
          })
          .eq('id', invoiceId)

        if (error) {
          console.error('Error rejecting payment:', error)
          await sendTelegramMessage(chatId, '❌ Error: Gagal reject pembayaran')
        } else {
          await sendTelegramMessage(
            chatId,
            '❌ Pembayaran ditolak.\n\nCustomer akan diminta upload ulang bukti pembayaran yang valid.'
          )
        }
      }
      
      // Handle complete order
      else if (data.startsWith('complete_order_')) {
        const orderId = data.replace('complete_order_', '')
        
        // Update order status to completed
        const { error } = await supabase
          .from('orders')
          .update({ 
            status: 'completed',
            completed_at: new Date().toISOString()
          })
          .eq('id', orderId)

        if (error) {
          console.error('Error completing order:', error)
          await sendTelegramMessage(chatId, '❌ Error: Gagal complete order')
        } else {
          await sendTelegramMessage(
            chatId,
            '✅ Order berhasil di-complete!\n\nCustomer akan menerima notifikasi.'
          )
        }
      }
      
      // Handle create invoice
      else if (data.startsWith('create_invoice_')) {
        const orderId = data.replace('create_invoice_', '')
        
        await sendTelegramMessage(
          chatId,
          '📝 Silakan buat invoice untuk order ini melalui Admin Panel:\n\n' +
          `🔗 https://rfs-store.vercel.app/admin/invoices`
        )
      }

      // Answer callback query
      await fetch(
        `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/answerCallbackQuery`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            callback_query_id: callbackQuery.id,
            text: 'Processed!'
          })
        }
      )
    }
    
    // Handle regular messages (commands)
    else if (update.message) {
      const message = update.message
      const chatId = message.chat.id
      const text = message.text || ''

      console.log('Message received:', text)

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
          `Simpan Chat ID Anda untuk konfigurasi admin!`
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
          `Need help? Contact admin.`
        )
      }
      
      // Handle /chatid command
      else if (text.startsWith('/chatid')) {
        await sendTelegramMessage(
          chatId,
          `🆔 Your Chat ID: <code>${chatId}</code>\n\n` +
          `Use this ID for admin configuration.`
        )
      }
      
      // Handle /status command
      else if (text.startsWith('/status')) {
        await sendTelegramMessage(
          chatId,
          `✅ <b>Bot Status: Online</b>\n\n` +
          `Bot is running and ready to send notifications!`
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
    console.error('Webhook error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 // Return 200 to avoid Telegram retries
      }
    )
  }
})
