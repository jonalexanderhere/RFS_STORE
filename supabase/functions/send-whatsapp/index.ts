// Supabase Edge Function: Send WhatsApp Message
// Deploy: supabase functions deploy send-whatsapp
// Full integration with Fonnte API

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Admin WhatsApp numbers
const ADMIN_WHATSAPP = {
  admin1: '6282181183590',
  admin2: '6282176466707'
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { phone, message, media_url, target_type } = await req.json()

    if (!phone && !target_type) {
      throw new Error('Phone number or target_type is required')
    }

    if (!message) {
      throw new Error('Message is required')
    }

    console.log('📱 Sending WhatsApp:', { phone, target_type, has_media: !!media_url })

    // Get WhatsApp API credentials from environment
    const FONNTE_DEVICE_TOKEN = Deno.env.get('FONNTE_DEVICE_TOKEN')
    const FONNTE_ACCOUNT_TOKEN = Deno.env.get('FONNTE_TOKEN')
    const FONNTE_TOKEN = FONNTE_DEVICE_TOKEN || FONNTE_ACCOUNT_TOKEN
    const WHATSAPP_API_URL = 'https://api.fonnte.com/send'

    if (!FONNTE_TOKEN) {
      throw new Error('WhatsApp API token not configured')
    }

    // Determine target phone number
    let targetPhone = phone
    if (target_type === 'admin1') {
      targetPhone = ADMIN_WHATSAPP.admin1
    } else if (target_type === 'admin2') {
      targetPhone = ADMIN_WHATSAPP.admin2
    } else if (target_type === 'all_admins') {
      // Send to all admins
      const results = []
      
      for (const [key, adminPhone] of Object.entries(ADMIN_WHATSAPP)) {
        try {
          const response = await fetch(WHATSAPP_API_URL, {
            method: 'POST',
            headers: {
              'Authorization': FONNTE_TOKEN,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              target: adminPhone,
              message: message,
              countryCode: '62',
              url: media_url
            })
          })

          const data = await response.json()
          results.push({ 
            admin: key, 
            phone: adminPhone,
            success: data.status,
            data 
          })
          
          console.log(`✅ Sent to ${key} (${adminPhone}):`, data)
        } catch (error) {
          results.push({ 
            admin: key, 
            phone: adminPhone,
            success: false, 
            error: error.message 
          })
          console.error(`❌ Failed to ${key}:`, error)
        }
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Sent to all admins',
          results
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      )
    }

    // Format phone number (ensure 62 prefix)
    let formattedPhone = targetPhone.replace(/\D/g, '')
    if (formattedPhone.startsWith('0')) {
      formattedPhone = '62' + formattedPhone.substring(1)
    } else if (!formattedPhone.startsWith('62')) {
      formattedPhone = '62' + formattedPhone
    }

    console.log('📞 Target phone:', formattedPhone)

    // Prepare request body
    const requestBody: any = {
      target: formattedPhone,
      message: message,
      countryCode: '62'
    }

    // Add media if provided
    if (media_url) {
      requestBody.url = media_url
    }

    // Try device token first, then account token
    let response
    let data

    try {
      console.log('Trying device token...')
      response = await fetch(WHATSAPP_API_URL, {
        method: 'POST',
        headers: {
          'Authorization': FONNTE_DEVICE_TOKEN || FONNTE_TOKEN,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      })

      data = await response.json()
      console.log('Device token response:', data)

      // If device token fails and we have account token, retry
      if (!data.status && FONNTE_ACCOUNT_TOKEN && FONNTE_DEVICE_TOKEN !== FONNTE_ACCOUNT_TOKEN) {
        console.log('Device token failed, trying account token...')
        response = await fetch(WHATSAPP_API_URL, {
          method: 'POST',
          headers: {
            'Authorization': FONNTE_ACCOUNT_TOKEN,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody)
        })
        data = await response.json()
        console.log('Account token response:', data)
      }
    } catch (error) {
      console.error('Fonnte API error:', error)
      throw error
    }

    if (!data.status) {
      throw new Error(data.reason || 'Failed to send WhatsApp message')
    }

    console.log('✅ WhatsApp sent successfully')

    return new Response(
      JSON.stringify({ 
        success: true, 
        data,
        phone: formattedPhone,
        message: 'WhatsApp message sent successfully'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )
  } catch (error) {
    console.error('❌ WhatsApp error:', error)
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
