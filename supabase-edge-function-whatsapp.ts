// ============================================
// SUPABASE EDGE FUNCTION - WhatsApp Sender
// File: supabase/functions/send-whatsapp/index.ts
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

    // Get WhatsApp API settings
    const { data: settings } = await supabaseClient
      .from('notification_settings')
      .select('*')
      .eq('service_type', 'whatsapp')
      .eq('is_active', true)
      .single()

    if (!settings) {
      throw new Error('WhatsApp settings not configured')
    }

    // Send via WhatsApp API
    // OPTION 1: Using Fonnte.com (Popular di Indonesia)
    const fonnte_token = Deno.env.get('FONNTE_TOKEN') || settings.api_key
    
    if (fonnte_token) {
      const response = await fetch('https://api.fonnte.com/send', {
        method: 'POST',
        headers: {
          'Authorization': fonnte_token,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          target: notification.recipient_number,
          message: notification.message,
          countryCode: '62' // Indonesia
        })
      })

      const result = await response.json()

      if (response.ok && result.status) {
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
            message: 'Notification sent successfully',
            notification_id,
            result 
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        )
      } else {
        throw new Error(result.message || 'Failed to send WhatsApp message')
      }
    }

    // OPTION 2: Using Wablas.com
    const wablas_token = Deno.env.get('WABLAS_TOKEN')
    
    if (wablas_token) {
      const response = await fetch('https://console.wablas.com/api/send-message', {
        method: 'POST',
        headers: {
          'Authorization': wablas_token,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          phone: notification.recipient_number,
          message: notification.message
        })
      })

      const result = await response.json()

      if (response.ok) {
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
            message: 'Notification sent via Wablas',
            notification_id,
            result 
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        )
      }
    }

    // OPTION 3: WhatsApp Business API (Official)
    const whatsapp_token = Deno.env.get('WHATSAPP_TOKEN')
    const phone_number_id = Deno.env.get('WHATSAPP_PHONE_NUMBER_ID')

    if (whatsapp_token && phone_number_id) {
      const response = await fetch(
        `https://graph.facebook.com/v18.0/${phone_number_id}/messages`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${whatsapp_token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            messaging_product: 'whatsapp',
            to: notification.recipient_number,
            type: 'text',
            text: { body: notification.message }
          })
        }
      )

      const result = await response.json()

      if (response.ok) {
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
            message: 'Notification sent via WhatsApp Business API',
            notification_id,
            result 
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        )
      }
    }

    throw new Error('No WhatsApp API configured. Please set FONNTE_TOKEN, WABLAS_TOKEN, or WHATSAPP_TOKEN')

  } catch (error) {
    console.error('Error sending notification:', error)

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

