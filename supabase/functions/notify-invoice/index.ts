// Supabase Edge Function: Notify New Invoice
// Triggered when a new invoice is created
// Deploy: supabase functions deploy notify-invoice

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

    // Get invoice details with relationships
    const { data: invoice, error } = await supabase
      .from('invoices')
      .select(`
        *,
        user:profiles(*)
      `)
      .eq('id', record.id)
      .single()

    if (error) throw error

    // Send notifications
    await Promise.all([
      sendTelegramToAdmin(invoice),
      sendWhatsAppToCustomer(invoice),
      sendTelegramToCustomer(invoice)
    ])

    return new Response(
      JSON.stringify({ success: true }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )
  } catch (error) {
    console.error('Notify invoice error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )
  }
})

async function sendTelegramToAdmin(invoice: any) {
  const TELEGRAM_BOT_TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN')
  const TELEGRAM_CHAT_ID = Deno.env.get('TELEGRAM_CHAT_ID')
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const message = `
📄 <b>INVOICE BARU DIBUAT</b>

🧾 No. Invoice: <code>${invoice.invoice_number}</code>
👤 Pelanggan: ${invoice.user?.full_name || 'N/A'}
🛍️ Layanan: ${invoice.service_type}

💰 Total: <b>${formatCurrency(invoice.total_amount)}</b>
💳 Metode: ${invoice.payment_method?.toUpperCase() || 'N/A'}

Invoice telah dikirim ke pelanggan.
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

async function sendWhatsAppToCustomer(invoice: any) {
  if (!invoice.user?.phone) return

  const phone = formatPhoneNumber(invoice.user.phone)
  const WHATSAPP_API_KEY = Deno.env.get('WHATSAPP_API_KEY')
  const WHATSAPP_API_URL = Deno.env.get('WHATSAPP_API_URL') || 'https://api.fonnte.com/send'
  const FRONTEND_URL = Deno.env.get('FRONTEND_URL') || 'https://rfsstore.vercel.app'

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const message = `
🧾 *INVOICE BARU*

Halo ${invoice.user.full_name},

Invoice untuk pesanan Anda:

📄 No. Invoice: *${invoice.invoice_number}*
🛍️ Layanan: *${invoice.service_type}*
💰 Total: *${formatCurrency(invoice.total_amount)}*
💳 Metode: ${invoice.payment_method?.toUpperCase() || 'Transfer'}

📝 ${invoice.description}

📱 Upload bukti pembayaran:
${FRONTEND_URL}/invoice/${invoice.id}

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

async function sendTelegramToCustomer(invoice: any) {
  if (!invoice.user?.telegram_id) return

  const TELEGRAM_BOT_TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN')
  const FRONTEND_URL = Deno.env.get('FRONTEND_URL') || 'https://rfsstore.vercel.app'
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const message = `
🧾 <b>INVOICE BARU</b>

Halo ${invoice.user.full_name},

📄 No. Invoice: <code>${invoice.invoice_number}</code>
🛍️ Layanan: ${invoice.service_type}
💰 Total: <b>${formatCurrency(invoice.total_amount)}</b>

Silakan lakukan pembayaran dan upload bukti.
  `.trim()

  const keyboard = {
    inline_keyboard: [
      [{ text: '💳 Lihat Invoice & Bayar', url: `${FRONTEND_URL}/invoice/${invoice.id}` }]
    ]
  }

  await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: invoice.user.telegram_id,
      text: message,
      parse_mode: 'HTML',
      reply_markup: keyboard
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

