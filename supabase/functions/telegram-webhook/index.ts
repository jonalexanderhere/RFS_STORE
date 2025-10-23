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
    
    if (secretToken !== TELEGRAM_SECRET) {
      throw new Error('Invalid secret token')
    }

    const update = await req.json()
    
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Handle callback queries (button clicks)
    if (update.callback_query) {
      const callbackQuery = update.callback_query
      const data = callbackQuery.data
      const chatId = callbackQuery.message.chat.id

      // Handle different callback actions
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

        if (error) throw error

        // Send confirmation message
        await sendTelegramMessage(
          chatId,
          '✅ Pembayaran berhasil diverifikasi!'
        )
      } else if (data.startsWith('reject_payment_')) {
        const invoiceId = data.replace('reject_payment_', '')
        
        // Update invoice status back to unpaid
        const { error } = await supabase
          .from('invoices')
          .update({ status: 'unpaid' })
          .eq('id', invoiceId)

        if (error) throw error

        await sendTelegramMessage(
          chatId,
          '❌ Pembayaran ditolak. Customer akan diminta upload ulang bukti pembayaran.'
        )
      }

      // Answer callback query
      await fetch(
        `https://api.telegram.org/bot${Deno.env.get('TELEGRAM_BOT_TOKEN')}/answerCallbackQuery`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            callback_query_id: callbackQuery.id
          })
        }
      )
    }

    // Handle text messages
    if (update.message && update.message.text) {
      const message = update.message
      const chatId = message.chat.id
      const text = message.text

      // Handle commands
      if (text.startsWith('/start')) {
        await sendTelegramMessage(
          chatId,
          '👋 Selamat datang di RFS_STORE Bot!\n\nBot ini akan mengirimkan notifikasi tentang:\n- Pesanan baru\n- Invoice baru\n- Bukti pembayaran\n- Update status\n\nGunakan tombol di setiap notifikasi untuk aksi cepat!'
        )
      } else if (text.startsWith('/help')) {
        await sendTelegramMessage(
          chatId,
          '📚 Bantuan:\n\n/start - Memulai bot\n/help - Menampilkan bantuan\n/stats - Statistik hari ini\n\nBot ini otomatis mengirim notifikasi untuk setiap aktivitas penting.'
        )
      } else if (text.startsWith('/stats')) {
        // Get today's statistics
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        
        const { data: orders } = await supabase
          .from('orders')
          .select('*')
          .gte('created_at', today.toISOString())

        const { data: invoices } = await supabase
          .from('invoices')
          .select('*')
          .eq('status', 'paid')
          .gte('paid_at', today.toISOString())

        const totalRevenue = invoices?.reduce((sum, inv) => sum + Number(inv.total_amount), 0) || 0

        await sendTelegramMessage(
          chatId,
          `📊 Statistik Hari Ini:\n\n📦 Pesanan Baru: ${orders?.length || 0}\n💰 Total Pendapatan: Rp ${totalRevenue.toLocaleString('id-ID')}\n💳 Transaksi Lunas: ${invoices?.length || 0}`
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
        status: 200 // Return 200 to prevent Telegram from retrying
      }
    )
  }
})

async function sendTelegramMessage(chatId: number, text: string) {
  const TELEGRAM_BOT_TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN')
  
  await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text: text,
      parse_mode: 'HTML'
    })
  })
}

