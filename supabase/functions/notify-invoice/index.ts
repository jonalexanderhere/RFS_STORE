// Supabase Edge Function: Notify New Invoice
// Deploy: supabase functions deploy notify-invoice
// Sends notifications when new invoice is created

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Admin contacts
const ADMIN_TELEGRAM_IDS = ['5788748857', '6478150893']
const ADMIN_WHATSAPP = {
  admin1: '6282181183590',
  admin2: '6282176466707'
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { invoice_id } = await req.json()
    
    if (!invoice_id) {
      throw new Error('invoice_id is required')
    }

    console.log('📄 Notifying new invoice:', invoice_id)

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Get invoice details with relationships
    const { data: invoice, error } = await supabase
      .from('invoices')
      .select(`
        *,
        order:orders(
          *,
          user:profiles(*),
          service:services(*)
        )
      `)
      .eq('id', invoice_id)
      .single()

    if (error || !invoice) {
      throw new Error('Invoice not found')
    }

    const TELEGRAM_BOT_TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN')!
    const FONNTE_TOKEN = Deno.env.get('FONNTE_DEVICE_TOKEN') || Deno.env.get('FONNTE_TOKEN')

    const formatCurrency = (amount: number) => {
      return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0
      }).format(amount)
    }

    // Message for Admin
    const adminTelegramMessage = `
📄 <b>INVOICE BARU DIBUAT</b>

🧾 No. Invoice: <code>${invoice.invoice_number}</code>
📝 No. Order: <code>${invoice.order?.order_number}</code>
👤 Customer: ${invoice.order?.user?.full_name || 'N/A'}
📱 Phone: ${invoice.order?.user?.phone || 'N/A'}
🛍️ Layanan: ${invoice.order?.service?.name || 'N/A'}

💰 Total: <b>${formatCurrency(invoice.amount)}</b>
📅 Due Date: ${invoice.due_date ? new Date(invoice.due_date).toLocaleString('id-ID') : 'N/A'}

Invoice telah dikirim ke customer.
    `.trim()

    const adminWhatsAppMessage = `
📄 *INVOICE BARU DIBUAT*

🧾 No. Invoice: *${invoice.invoice_number}*
📝 No. Order: *${invoice.order?.order_number}*
👤 Customer: ${invoice.order?.user?.full_name || 'N/A'}
📱 Phone: ${invoice.order?.user?.phone || 'N/A'}
🛍️ Layanan: ${invoice.order?.service?.name || 'N/A'}

💰 Total: *${formatCurrency(invoice.amount)}*
📅 Due Date: ${invoice.due_date ? new Date(invoice.due_date).toLocaleString('id-ID') : 'N/A'}

Invoice telah dikirim ke customer.
    `.trim()

    // Message for Customer
    const customerMessage = `
📄 <b>INVOICE READY</b>

Halo ${invoice.order?.user?.full_name},

Invoice untuk pesanan Anda sudah siap!

🧾 No. Invoice: <code>${invoice.invoice_number}</code>
📝 No. Order: <code>${invoice.order?.order_number}</code>
🛍️ Layanan: ${invoice.order?.service?.name}

💰 Total Pembayaran: <b>${formatCurrency(invoice.amount)}</b>
📅 Jatuh Tempo: ${invoice.due_date ? new Date(invoice.due_date).toLocaleString('id-ID') : 'Segera'}

${invoice.payment_details ? `\n📋 Detail Pembayaran:\n${JSON.stringify(invoice.payment_details, null, 2)}\n` : ''}
Silakan lakukan pembayaran dan upload bukti transfer.

Terima kasih! 🙏
    `.trim()

    const customerWhatsAppMessage = customerMessage
      .replace(/<b>/g, '*')
      .replace(/<\/b>/g, '*')
      .replace(/<code>/g, '')
      .replace(/<\/code>/g, '')
      .replace(/<[^>]*>/g, '')

    const notifications = []

    // Send to all admin Telegrams
    if (TELEGRAM_BOT_TOKEN) {
      for (const chatId of ADMIN_TELEGRAM_IDS) {
        try {
          const response = await fetch(
            `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                chat_id: chatId,
                text: adminTelegramMessage,
                parse_mode: 'HTML'
              })
            }
          )
          const data = await response.json()
          notifications.push({ 
            type: 'admin',
            channel: 'telegram', 
            target: chatId,
            success: data.ok 
          })
        } catch (error) {
          notifications.push({ 
            type: 'admin',
            channel: 'telegram', 
            target: chatId,
            success: false, 
            error: error.message 
          })
        }
      }
    }

    // Send to customer Telegram (if has telegram_id)
    if (TELEGRAM_BOT_TOKEN && invoice.order?.user?.telegram_id) {
      try {
        const response = await fetch(
          `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              chat_id: invoice.order.user.telegram_id,
              text: customerMessage,
              parse_mode: 'HTML'
            })
          }
        )
        const data = await response.json()
        notifications.push({ 
          type: 'customer',
          channel: 'telegram', 
          target: invoice.order.user.telegram_id,
          success: data.ok 
        })
      } catch (error) {
        notifications.push({ 
          type: 'customer',
          channel: 'telegram', 
          target: invoice.order.user.telegram_id,
          success: false, 
          error: error.message 
        })
      }
    }

    // Send to customer WhatsApp
    if (FONNTE_TOKEN && invoice.order?.user?.phone) {
      try {
        let phone = invoice.order.user.phone.replace(/\D/g, '')
        if (phone.startsWith('0')) {
          phone = '62' + phone.substring(1)
        } else if (!phone.startsWith('62')) {
          phone = '62' + phone
        }

        const response = await fetch('https://api.fonnte.com/send', {
          method: 'POST',
          headers: {
            'Authorization': FONNTE_TOKEN,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            target: phone,
            message: customerWhatsAppMessage,
            countryCode: '62'
          })
        })
        const data = await response.json()
        notifications.push({ 
          type: 'customer',
          channel: 'whatsapp', 
          target: phone,
          success: data.status 
        })
      } catch (error) {
        notifications.push({ 
          type: 'customer',
          channel: 'whatsapp', 
          target: invoice.order.user.phone,
          success: false, 
          error: error.message 
        })
      }
    }

    console.log('✅ Notifications sent:', notifications)

    return new Response(
      JSON.stringify({ 
        success: true,
        invoice: invoice,
        notifications: notifications
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )
  } catch (error) {
    console.error('❌ Error:', error)
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    )
  }
})
