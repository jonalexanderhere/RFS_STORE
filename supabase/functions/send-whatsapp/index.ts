// Supabase Edge Function: Send WhatsApp Message
// Deploy: supabase functions deploy send-whatsapp

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
    const { phone, message } = await req.json()

    if (!phone || !message) {
      throw new Error('Phone number and message are required')
    }

    // Get WhatsApp API credentials from environment
    const WHATSAPP_API_KEY = Deno.env.get('WHATSAPP_API_KEY')
    const WHATSAPP_API_URL = Deno.env.get('WHATSAPP_API_URL') || 'https://api.fonnte.com/send'

    if (!WHATSAPP_API_KEY) {
      throw new Error('WhatsApp API key not configured')
    }

    // Send message via Fonnte (or your preferred WhatsApp gateway)
    const response = await fetch(WHATSAPP_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': WHATSAPP_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        target: phone,
        message: message,
        countryCode: '62'
      })
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.reason || 'Failed to send WhatsApp message')
    }

    return new Response(
      JSON.stringify({ success: true, data }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    )
  }
})

