// Supabase Edge Function: Notify New Order
// Triggered when a new order is created
// Deploy: supabase functions deploy notify-order

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { record } = await req.json()
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Get order details with relationships
    const { data: order, error } = await supabase
      .from('orders')
      .select(`
        *,
        user:profiles(*),
        service:services(*)
      `)
      .eq('id', record.id)
      .single()

    if (error) throw error

    // Send Telegram notification to admin
    await sendTelegramNotification(order)

    // Send WhatsApp confirmation to customer
    await sendWhatsAppConfirmation(order)

    return new Response(
      JSON.stringify({ success: true }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )
  } catch (error) {
    console.error('Notify order error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )
  }
})

async function sendTelegramNotification(order: any) {
  const TELEGRAM_BOT_TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN')
  const TELEGRAM_CHAT_ID = Deno.env.get('TELEGRAM_CHAT_ID')
  
  const message = `
🆕 <b>PESANAN BARU</b>

📝 No. Pesanan: <code>${order.order_number}</code>
👤 Pelanggan: ${order.user?.full_name || 'N/A'}
📱 Telepon: ${order.user?.phone || 'N/A'}
🛍️ Layanan: ${order.service?.name || 'N/A'}

📄 Deskripsi:
${order.description}

⏰ Waktu: ${new Date(order.created_at).toLocaleString('id-ID')}

Segera buat invoice untuk pesanan ini!
  `.trim()

  await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: TELEGRAM_CHAT_ID,
      text: message,
      parse_mode: 'HTML'
    })
  })
}

async function sendWhatsAppConfirmation(order: any) {
  if (!order.user?.phone) return

  const phone = formatPhoneNumber(order.user.phone)
  const WHATSAPP_API_KEY = Deno.env.get('WHATSAPP_API_KEY')
  const WHATSAPP_API_URL = Deno.env.get('WHATSAPP_API_URL') || 'https://api.fonnte.com/send'

  const message = `
🎉 *PESANAN DITERIMA*

Halo ${order.user.full_name},

Pesanan Anda telah diterima!

📝 No. Pesanan: *${order.order_number}*
🛍️ Layanan: *${order.service?.name}*
📅 Tanggal: ${new Date(order.created_at).toLocaleString('id-ID')}

Admin kami akan segera meninjau pesanan Anda dan membuat invoice.

Terima kasih! 🚀

---
RFS_STORE x InspiraProject
  `.trim()

  await fetch(WHATSAPP_API_URL, {
    method: 'POST',
    headers: {
      'Authorization': WHATSAPP_API_KEY!,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      target: phone,
      message: message,
      countryCode: '62'
    })
  })
}

function formatPhoneNumber(phone: string): string {
  let cleaned = phone.replace(/\D/g, '')
  if (cleaned.startsWith('0')) {
    cleaned = '62' + cleaned.substring(1)
  } else if (!cleaned.startsWith('62')) {
    cleaned = '62' + cleaned
  }
  return cleaned
}

