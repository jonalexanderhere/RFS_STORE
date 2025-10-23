// Supabase Edge Function: Send Order Result/Jokian to Customer
// Deploy: supabase functions deploy send-result

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { order_id, result_url, result_message, notify_channels } = await req.json()

    if (!order_id) {
      throw new Error('Order ID is required')
    }

    console.log('Sending result for order:', order_id)

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Get order with user info
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select(`
        *,
        user:profiles(*),
        service:services(*)
      `)
      .eq('id', order_id)
      .single()

    if (orderError || !order) {
      throw new Error('Order not found')
    }

    // Update order with result
    const { error: updateError } = await supabase
      .from('orders')
      .update({
        result_url: result_url,
        result_message: result_message,
        status: 'completed',
        completed_at: new Date().toISOString()
      })
      .eq('id', order_id)

    if (updateError) {
      throw new Error('Failed to update order: ' + updateError.message)
    }

    const TELEGRAM_BOT_TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN')
    const FONNTE_TOKEN = Deno.env.get('FONNTE_TOKEN')
    const notifications: any[] = []

    // Format phone number
    const formatPhone = (phone: string) => {
      let cleaned = phone.replace(/\D/g, '')
      if (cleaned.startsWith('0')) {
        cleaned = '62' + cleaned.substring(1)
      } else if (!cleaned.startsWith('62')) {
        cleaned = '62' + cleaned
      }
      return cleaned
    }

    // Send Telegram notification to customer (if they have telegram_id)
    if (notify_channels?.includes('telegram') && order.user.telegram_id) {
      try {
        const telegramMessage = `
✅ <b>PESANAN SELESAI!</b>

Halo ${order.user.full_name},

Pesanan Anda telah selesai dikerjakan! 🎉

📝 No. Pesanan: <code>${order.order_number}</code>
🛍️ Layanan: ${order.service?.name}

${result_message ? `📄 Pesan Admin:\n${result_message}\n\n` : ''}${result_url ? `📎 Download Hasil:\n${result_url}\n\n` : ''}Terima kasih telah mempercayai RFS_STORE! 🙏

---
RFS_STORE x InspiraProject
        `.trim()

        const response = await fetch(
          `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              chat_id: order.user.telegram_id,
              text: telegramMessage,
              parse_mode: 'HTML'
            })
          }
        )
        
        const result = await response.json()
        notifications.push({ channel: 'telegram', success: result.ok, result })
      } catch (error) {
        notifications.push({ channel: 'telegram', success: false, error: error.message })
      }
    }

    // Send WhatsApp notification to customer
    if (notify_channels?.includes('whatsapp') && order.user.phone) {
      try {
        const phone = formatPhone(order.user.phone)
        
        const whatsappMessage = `
✅ *PESANAN SELESAI!*

Halo ${order.user.full_name},

Pesanan Anda telah selesai dikerjakan! 🎉

📝 No. Pesanan: *${order.order_number}*
🛍️ Layanan: *${order.service?.name}*

${result_message ? `📄 Pesan Admin:\n${result_message}\n\n` : ''}${result_url ? `📎 Download Hasil:\n${result_url}\n\n` : ''}Terima kasih telah mempercayai RFS_STORE! 🙏

---
RFS_STORE x InspiraProject
        `.trim()

        const response = await fetch('https://api.fonnte.com/send', {
          method: 'POST',
          headers: {
            'Authorization': FONNTE_TOKEN,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            target: phone,
            message: whatsappMessage,
            countryCode: '62',
            url: result_url // Send file if provided
          })
        })

        const result = await response.json()
        notifications.push({ channel: 'whatsapp', success: result.status, result })
      } catch (error) {
        notifications.push({ channel: 'whatsapp', success: false, error: error.message })
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Result sent successfully',
        order: order,
        notifications: notifications
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )
  } catch (error) {
    console.error('Send result error:', error)
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

