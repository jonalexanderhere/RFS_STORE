// ============================================
// SUPABASE EDGE FUNCTION - Telegram Sender
// File: supabase/functions/send-telegram/index.ts
// ============================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface NotificationRequest {
  notification_id: string
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Get request body
    const { notification_id } = await req.json() as NotificationRequest

    // Get notification details from database
    const { data: notification, error: fetchError } = await supabaseClient
      .from('notification_logs')
      .select('*')
      .eq('id', notification_id)
      .single()

    if (fetchError || !notification) {
      throw new Error('Notification not found')
    }

    // Skip if already sent
    if (notification.status === 'sent') {
      return new Response(
        JSON.stringify({ message: 'Already sent', notification_id }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      )
    }

    // Get Telegram Bot Token
    const telegram_token = Deno.env.get('TELEGRAM_BOT_TOKEN')

    if (!telegram_token) {
      throw new Error('Telegram bot token not configured')
    }

    // Convert markdown-style message to Telegram format
    const telegramMessage = notification.message
      .replace(/\*([^*]+)\*/g, '<b>$1</b>') // Bold
      .replace(/_([^_]+)_/g, '<i>$1</i>')   // Italic

    // Send message via Telegram Bot API
    const response = await fetch(
      `https://api.telegram.org/bot${telegram_token}/sendMessage`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          chat_id: notification.recipient_number,
          text: telegramMessage,
          parse_mode: 'HTML',
          disable_web_page_preview: false
        })
      }
    )

    const result = await response.json()

    if (response.ok && result.ok) {
      // Update notification status to sent
      await supabaseClient
        .from('notification_logs')
        .update({
          status: 'sent',
          sent_at: new Date().toISOString()
        })
        .eq('id', notification_id)

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Telegram notification sent successfully',
          notification_id,
          result 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      )
    } else {
      throw new Error(result.description || 'Failed to send Telegram message')
    }

  } catch (error) {
    console.error('Error sending Telegram notification:', error)

    // Update notification status to failed
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { notification_id } = await req.json().catch(() => ({}))
    
    if (notification_id) {
      await supabaseClient
        .from('notification_logs')
        .update({
          status: 'failed',
          error_message: error.message
        })
        .eq('id', notification_id)
    }

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

