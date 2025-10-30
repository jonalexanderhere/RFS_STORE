// ============================================
// SUPABASE EDGE FUNCTION - Notification Processor
// File: supabase/functions/process-notifications/index.ts
// Processes pending notifications and sends them
// ============================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
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

    // Get all pending notifications
    const { data: pendingNotifications, error: fetchError } = await supabaseClient
      .from('notification_logs')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: true })
      .limit(50) // Process max 50 at a time

    if (fetchError) {
      throw new Error(`Failed to fetch notifications: ${fetchError.message}`)
    }

    if (!pendingNotifications || pendingNotifications.length === 0) {
      return new Response(
        JSON.stringify({ 
          message: 'No pending notifications',
          processed: 0
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      )
    }

    // Process each notification
    const results = []
    const supabaseUrl = Deno.env.get('SUPABASE_URL')

    for (const notification of pendingNotifications) {
      try {
        let endpoint = ''
        
        if (notification.service_type === 'whatsapp') {
          endpoint = `${supabaseUrl}/functions/v1/send-whatsapp`
        } else if (notification.service_type === 'telegram') {
          endpoint = `${supabaseUrl}/functions/v1/send-telegram`
        } else {
          console.error(`Unknown service type: ${notification.service_type}`)
          continue
        }

        // Call the appropriate edge function
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`
          },
          body: JSON.stringify({
            notification_id: notification.id
          })
        })

        const result = await response.json()
        
        results.push({
          notification_id: notification.id,
          service_type: notification.service_type,
          recipient: notification.recipient_number,
          success: response.ok,
          result
        })

        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100))

      } catch (error) {
        console.error(`Error processing notification ${notification.id}:`, error)
        
        // Mark as failed
        await supabaseClient
          .from('notification_logs')
          .update({
            status: 'failed',
            error_message: error.message
          })
          .eq('id', notification.id)

        results.push({
          notification_id: notification.id,
          success: false,
          error: error.message
        })
      }
    }

    return new Response(
      JSON.stringify({ 
        message: 'Notifications processed',
        total: pendingNotifications.length,
        processed: results.length,
        results
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )

  } catch (error) {
    console.error('Error processing notifications:', error)
    
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

