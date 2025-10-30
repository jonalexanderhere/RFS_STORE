// ============================================
// SUPABASE EDGE FUNCTION - Create Admin User
// File: supabase/functions/create-admin/index.ts
// ============================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface CreateAdminRequest {
  email: string
  password: string
  full_name?: string
  phone?: string
  whatsapp?: string
  telegram_id?: string
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Check if request has admin authorization
    const authHeader = req.headers.get('Authorization')
    const adminSecret = Deno.env.get('ADMIN_SECRET_KEY')
    
    // Verify admin secret key
    if (!authHeader || !adminSecret || authHeader !== `Bearer ${adminSecret}`) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized. Admin secret key required.' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
          status: 401 
        }
      )
    }

    // Create Supabase Admin Client
    const supabaseAdmin = createClient(
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
    const requestData = await req.json() as CreateAdminRequest

    // Validate required fields
    if (!requestData.email || !requestData.password) {
      return new Response(
        JSON.stringify({ error: 'Email and password are required' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
          status: 400 
        }
      )
    }

    // Create user with admin client (bypasses auth)
    const { data: userData, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: requestData.email,
      password: requestData.password,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        full_name: requestData.full_name || 'Admin User',
        phone: requestData.phone || '',
        role: 'admin'
      }
    })

    if (createError) {
      throw new Error(`Failed to create user: ${createError.message}`)
    }

    if (!userData.user) {
      throw new Error('User creation failed - no user data returned')
    }

    // Wait a bit for profile trigger to create profile
    await new Promise(resolve => setTimeout(resolve, 1000))

    // Update profile to admin role
    const { error: updateError } = await supabaseAdmin
      .from('profiles')
      .update({
        role: 'admin',
        full_name: requestData.full_name || 'Admin User',
        phone: requestData.phone || '',
        whatsapp: requestData.whatsapp || '',
        telegram_id: requestData.telegram_id || ''
      })
      .eq('id', userData.user.id)

    if (updateError) {
      console.error('Error updating profile:', updateError)
      // Don't throw - user is created, just profile update failed
    }

    // Get the complete admin info
    const { data: adminProfile, error: fetchError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', userData.user.id)
      .single()

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Admin user created successfully',
        admin: {
          id: userData.user.id,
          email: userData.user.email,
          full_name: adminProfile?.full_name || requestData.full_name,
          role: adminProfile?.role || 'admin',
          phone: adminProfile?.phone,
          whatsapp: adminProfile?.whatsapp,
          telegram_id: adminProfile?.telegram_id,
          created_at: userData.user.created_at
        }
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
        status: 201 
      }
    )

  } catch (error) {
    console.error('Error creating admin:', error)
    
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

