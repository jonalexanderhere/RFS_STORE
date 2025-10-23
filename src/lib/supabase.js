import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env file.')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
})

// Helper functions for common operations

export const getCurrentUser = async () => {
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error) throw error
  return user
}

export const getUserProfile = async (userId) => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()
  
  if (error) throw error
  return data
}

export const signUp = async (email, password, fullName, phone) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
        phone: phone
      }
    }
  })
  
  if (error) throw error
  
  // Create profile
  if (data.user) {
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: data.user.id,
        full_name: fullName,
        phone: phone,
        role: 'user'
      })
    
    if (profileError) throw profileError
  }
  
  return data
}

export const signIn = async (email, password) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  })
  
  if (error) throw error
  return data
}

export const signOut = async () => {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

export const getServices = async () => {
  const { data, error } = await supabase
    .from('services')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: true })
  
  if (error) throw error
  return data
}

export const createOrder = async (orderData) => {
  const user = await getCurrentUser()
  
  const { data, error } = await supabase
    .from('orders')
    .insert({
      user_id: user.id,
      ...orderData
    })
    .select()
    .single()
  
  if (error) throw error
  return data
}

export const getUserOrders = async (userId) => {
  const { data, error } = await supabase
    .from('orders')
    .select(`
      *,
      service:services(*),
      invoice:invoices(*)
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  
  if (error) throw error
  return data
}

export const getInvoice = async (invoiceId) => {
  const { data, error } = await supabase
    .from('invoices')
    .select(`
      *,
      order:orders(*),
      user:profiles(*),
      payment_proofs(*)
    `)
    .eq('id', invoiceId)
    .single()
  
  if (error) throw error
  return data
}

export const uploadPaymentProof = async (invoiceId, file) => {
  const user = await getCurrentUser()
  const fileName = `${user.id}/${invoiceId}_${Date.now()}_${file.name}`
  
  // Upload file to storage
  const { data: uploadData, error: uploadError } = await supabase.storage
    .from('payment-proofs')
    .upload(fileName, file)
  
  if (uploadError) throw uploadError
  
  // Get public URL
  const { data: { publicUrl } } = supabase.storage
    .from('payment-proofs')
    .getPublicUrl(fileName)
  
  // Create payment proof record
  const { data, error } = await supabase
    .from('payment_proofs')
    .insert({
      invoice_id: invoiceId,
      user_id: user.id,
      file_url: publicUrl,
      file_name: file.name,
      file_size: file.size
    })
    .select()
    .single()
  
  if (error) throw error
  
  // Update invoice proof_url and status
  const { error: updateError } = await supabase
    .from('invoices')
    .update({
      proof_url: publicUrl,
      status: 'pending'
    })
    .eq('id', invoiceId)
  
  if (updateError) throw updateError
  
  return data
}

export const getUserNotifications = async (userId) => {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(50)
  
  if (error) throw error
  return data
}

export const markNotificationAsRead = async (notificationId) => {
  const { error } = await supabase
    .from('notifications')
    .update({ read: true })
    .eq('id', notificationId)
  
  if (error) throw error
}

// Admin functions
export const isAdmin = async () => {
  try {
    const user = await getCurrentUser()
    const profile = await getUserProfile(user.id)
    return profile.role === 'admin' || profile.role === 'staff'
  } catch {
    return false
  }
}

export const getAllOrders = async () => {
  const { data, error } = await supabase
    .from('orders')
    .select(`
      *,
      service:services(*),
      user:profiles(*),
      invoices(*)
    `)
    .order('created_at', { ascending: false })
  
  if (error) throw error
  return data
}

export const getAllInvoices = async () => {
  const { data, error } = await supabase
    .from('invoices')
    .select(`
      *,
      order:orders(*),
      user:profiles(*),
      payment_proofs(*)
    `)
    .order('created_at', { ascending: false })
  
  if (error) throw error
  return data
}

export const createInvoice = async (invoiceData) => {
  const { data, error } = await supabase
    .from('invoices')
    .insert(invoiceData)
    .select()
    .single()
  
  if (error) throw error
  return data
}

export const updateInvoiceStatus = async (invoiceId, status, notes = null) => {
  const updateData = { 
    status,
    admin_notes: notes
  }
  
  if (status === 'paid') {
    updateData.paid_at = new Date().toISOString()
  }
  
  const { data, error } = await supabase
    .from('invoices')
    .update(updateData)
    .eq('id', invoiceId)
    .select()
    .single()
  
  if (error) throw error
  return data
}

export const updateOrderStatus = async (orderId, status, adminNotes = null) => {
  const { data, error } = await supabase
    .from('orders')
    .update({ 
      status,
      admin_notes: adminNotes
    })
    .eq('id', orderId)
    .select()
    .single()
  
  if (error) throw error
  return data
}

export const verifyPaymentProof = async (proofId, verified, notes = null) => {
  const user = await getCurrentUser()
  
  const { data, error } = await supabase
    .from('payment_proofs')
    .update({
      verified,
      verified_by: user.id,
      verified_at: new Date().toISOString(),
      notes
    })
    .eq('id', proofId)
    .select()
    .single()
  
  if (error) throw error
  return data
}

export const getStatistics = async () => {
  try {
    const [ordersData, invoicesData, usersData] = await Promise.all([
      supabase.from('orders').select('status'),
      supabase.from('invoices').select('status, total_amount'),
      supabase.from('profiles').select('id, created_at')
    ])
    
    const stats = {
      totalOrders: ordersData.data?.length || 0,
      activeOrders: ordersData.data?.filter(o => o.status === 'processing').length || 0,
      completedOrders: ordersData.data?.filter(o => o.status === 'completed').length || 0,
      totalRevenue: invoicesData.data
        ?.filter(i => i.status === 'paid')
        .reduce((sum, i) => sum + Number(i.total_amount), 0) || 0,
      pendingPayments: invoicesData.data?.filter(i => i.status === 'pending').length || 0,
      totalUsers: usersData.data?.length || 0,
      newUsersThisMonth: usersData.data?.filter(u => {
        const createdDate = new Date(u.created_at)
        const now = new Date()
        return createdDate.getMonth() === now.getMonth() && 
               createdDate.getFullYear() === now.getFullYear()
      }).length || 0
    }
    
    return stats
  } catch (error) {
    console.error('Error fetching statistics:', error)
    return {
      totalOrders: 0,
      activeOrders: 0,
      completedOrders: 0,
      totalRevenue: 0,
      pendingPayments: 0,
      totalUsers: 0,
      newUsersThisMonth: 0
    }
  }
}

