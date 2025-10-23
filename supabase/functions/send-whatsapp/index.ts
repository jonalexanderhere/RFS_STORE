// Supabase Edge Function: Send WhatsApp Message
// Deploy: supabase functions deploy send-whatsapp

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

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
    const { phone, message, media_url } = await req.json()

    if (!phone || !message) {
      throw new Error('Phone number and message are required')
    }

    console.log('Sending WhatsApp to:', phone)

    // Get WhatsApp API credentials from environment
    const FONNTE_TOKEN = Deno.env.get('FONNTE_TOKEN')
    const WHATSAPP_API_URL = 'https://api.fonnte.com/send'

    if (!FONNTE_TOKEN) {
      throw new Error('WhatsApp API token not configured')
    }

    // Prepare request body
    const requestBody: any = {
      target: phone,
      message: message,
      countryCode: '62'
    }

    // Add media if provided
    if (media_url) {
      requestBody.url = media_url
      requestBody.filename = 'file.pdf' // Default filename
    }

    // Send message via Fonnte
    const response = await fetch(WHATSAPP_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': FONNTE_TOKEN,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    })

    const data = await response.json()

    console.log('Fonnte response:', data)

    if (!response.ok || !data.status) {
      throw new Error(data.reason || 'Failed to send WhatsApp message')
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        data,
        message: 'WhatsApp message sent successfully'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )
  } catch (error) {
    console.error('WhatsApp error:', error)
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
