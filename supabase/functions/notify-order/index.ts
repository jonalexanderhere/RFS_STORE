// Supabase Edge Function: Notify New Order
// Deploy: supabase functions deploy notify-order
// Sends notifications to admins when new order is created

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
    const { order_id } = await req.json()

    if (!order_id) {
      throw new Error('order_id is required')
    }

    console.log('📦 Notifying new order:', order_id)

    // Initialize Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Get order with relations
    const { data: order, error } = await supabase
      .from('orders')
      .select(`
        *,
        user:profiles(*),
        service:services(*)
      `)
      .eq('id', order_id)
      .single()

    if (error || !order) {
      throw new Error('Order not found')
    }

    const TELEGRAM_BOT_TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN')!
    const FONNTE_TOKEN = Deno.env.get('FONNTE_DEVICE_TOKEN') || Deno.env.get('FONNTE_TOKEN')

    // Format Telegram message
    const telegramMessage = `
🆕 <b>PESANAN BARU</b>

📝 No. Pesanan: <code>${order.order_number}</code>
👤 Customer: ${order.user?.full_name || 'N/A'}
📱 Phone: ${order.user?.phone || 'N/A'}
✉️ Email: ${order.user?.email || 'N/A'}
🛍️ Layanan: ${order.service?.name || 'N/A'}

📄 Deskripsi:
${order.description}

⏰ ${new Date(order.created_at).toLocaleString('id-ID')}

<b>Segera buat invoice!</b>
    `.trim()

    // Format WhatsApp message
    const whatsappMessage = `
🆕 *PESANAN BARU*

📝 No. Pesanan: *${order.order_number}*
👤 Customer: ${order.user?.full_name || 'N/A'}
📱 Phone: ${order.user?.phone || 'N/A'}
✉️ Email: ${order.user?.email || 'N/A'}
🛍️ Layanan: ${order.service?.name || 'N/A'}

📄 Deskripsi:
${order.description}

⏰ ${new Date(order.created_at).toLocaleString('id-ID')}

*Segera buat invoice!*
    `.trim()

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
                text: telegramMessage,
                parse_mode: 'HTML'
              })
            }
          )
          const data = await response.json()
          notifications.push({ 
            channel: 'telegram', 
            target: chatId,
            success: data.ok 
          })
        } catch (error) {
          notifications.push({ 
            channel: 'telegram', 
            target: chatId,
            success: false, 
            error: error.message 
          })
        }
      }
    }

    // Send to all admin WhatsApps
    if (FONNTE_TOKEN) {
      for (const [key, phone] of Object.entries(ADMIN_WHATSAPP)) {
        try {
          const response = await fetch('https://api.fonnte.com/send', {
            method: 'POST',
            headers: {
              'Authorization': FONNTE_TOKEN,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              target: phone,
              message: whatsappMessage,
              countryCode: '62'
            })
          })
          const data = await response.json()
          notifications.push({ 
            channel: 'whatsapp', 
            target: key,
            phone: phone,
            success: data.status 
          })
        } catch (error) {
          notifications.push({ 
            channel: 'whatsapp', 
            target: key,
            phone: phone,
            success: false, 
            error: error.message 
          })
        }
      }
    }

    console.log('✅ Notifications sent:', notifications)

    return new Response(
      JSON.stringify({ 
        success: true,
        order: order,
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
