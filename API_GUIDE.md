# 📖 API & Integration Guide - RFS_STORE

Dokumentasi lengkap untuk integrasi Supabase, Telegram Bot, dan WhatsApp Gateway.

## 📑 Table of Contents

1. [Supabase Database API](#supabase-database-api)
2. [Authentication API](#authentication-api)
3. [Telegram Bot Integration](#telegram-bot-integration)
4. [WhatsApp Gateway Integration](#whatsapp-gateway-integration)
5. [Edge Functions](#edge-functions)
6. [Webhook Setup](#webhook-setup)
7. [Real-time Subscriptions](#real-time-subscriptions)

---

## 🗄️ Supabase Database API

### Services

#### Get All Services
```javascript
import { supabase } from './lib/supabase'

const { data, error } = await supabase
  .from('services')
  .select('*')
  .eq('is_active', true)
```

### Orders

#### Create Order
```javascript
const { data, error } = await supabase
  .from('orders')
  .insert({
    user_id: userId,
    service_id: serviceId,
    description: 'Detail pesanan',
    details: {
      deadline: '2025-01-01',
      additionalInfo: 'Info tambahan'
    }
  })
  .select()
```

#### Get User Orders
```javascript
const { data, error } = await supabase
  .from('orders')
  .select(`
    *,
    service:services(*),
    invoice:invoices(*)
  `)
  .eq('user_id', userId)
  .order('created_at', { ascending: false })
```

#### Update Order Status (Admin)
```javascript
const { data, error } = await supabase
  .from('orders')
  .update({ 
    status: 'processing',
    admin_notes: 'Sedang dikerjakan'
  })
  .eq('id', orderId)
```

### Invoices

#### Create Invoice (Admin)
```javascript
const { data, error } = await supabase
  .from('invoices')
  .insert({
    order_id: orderId,
    user_id: userId,
    service_type: 'Jasa Tugas',
    description: 'Detail layanan',
    total_amount: 100000,
    payment_method: 'transfer',
    status: 'unpaid'
  })
  .select()
```

#### Get Invoice by ID
```javascript
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
```

#### Update Invoice Status
```javascript
const { data, error } = await supabase
  .from('invoices')
  .update({ 
    status: 'paid',
    paid_at: new Date().toISOString()
  })
  .eq('id', invoiceId)
```

### Payment Proofs

#### Upload Payment Proof
```javascript
// 1. Upload file to storage
const { data: uploadData, error: uploadError } = await supabase.storage
  .from('payment-proofs')
  .upload(`${userId}/${invoiceId}_${Date.now()}_${file.name}`, file)

// 2. Get public URL
const { data: { publicUrl } } = supabase.storage
  .from('payment-proofs')
  .getPublicUrl(uploadData.path)

// 3. Create payment proof record
const { data, error } = await supabase
  .from('payment_proofs')
  .insert({
    invoice_id: invoiceId,
    user_id: userId,
    file_url: publicUrl,
    file_name: file.name,
    file_size: file.size
  })

// 4. Update invoice
await supabase
  .from('invoices')
  .update({
    proof_url: publicUrl,
    status: 'pending'
  })
  .eq('id', invoiceId)
```

#### Verify Payment (Admin)
```javascript
const { data, error } = await supabase
  .from('payment_proofs')
  .update({
    verified: true,
    verified_by: adminUserId,
    verified_at: new Date().toISOString(),
    notes: 'Pembayaran valid'
  })
  .eq('id', proofId)
```

---

## 🔐 Authentication API

### Sign Up
```javascript
import { supabase } from './lib/supabase'

// 1. Create auth user
const { data: authData, error: authError } = await supabase.auth.signUp({
  email: 'user@example.com',
  password: 'password123',
  options: {
    data: {
      full_name: 'John Doe',
      phone: '08123456789'
    }
  }
})

// 2. Create profile (handled by trigger or manually)
const { error: profileError } = await supabase
  .from('profiles')
  .insert({
    id: authData.user.id,
    full_name: 'John Doe',
    phone: '08123456789',
    role: 'user'
  })
```

### Sign In
```javascript
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'password123'
})
```

### Sign Out
```javascript
const { error } = await supabase.auth.signOut()
```

### Get Current User
```javascript
const { data: { user }, error } = await supabase.auth.getUser()
```

### Get User Profile
```javascript
const { data, error } = await supabase
  .from('profiles')
  .select('*')
  .eq('id', userId)
  .single()
```

---

## 🤖 Telegram Bot Integration

### Send Message to Admin
```javascript
import { sendTelegramMessage } from './lib/telegram'

await sendTelegramMessage('🆕 Pesanan baru masuk!')
```

### Send Message with Inline Keyboard
```javascript
const keyboard = {
  inline_keyboard: [
    [
      { text: '✅ Approve', callback_data: 'approve_123' },
      { text: '❌ Reject', callback_data: 'reject_123' }
    ],
    [
      { text: '👁️ View Details', url: 'https://yoursite.com/order/123' }
    ]
  ]
}

await sendTelegramMessage('Verifikasi pembayaran', { reply_markup: keyboard })
```

### Notify Events

#### New Order
```javascript
import { notifyNewOrder } from './lib/telegram'

await notifyNewOrder(orderObject)
```

#### New Invoice
```javascript
import { notifyNewInvoice } from './lib/telegram'

await notifyNewInvoice(invoiceObject)
```

#### Payment Proof Uploaded
```javascript
import { notifyPaymentProof } from './lib/telegram'

await notifyPaymentProof(invoiceObject)
```

#### Payment Verified/Rejected
```javascript
import { notifyPaymentStatus } from './lib/telegram'

await notifyPaymentStatus(invoiceObject, true) // true = verified, false = rejected
```

### Send Direct Message to User
```javascript
import { sendUserMessage, sendInvoiceToCustomer } from './lib/telegram'

// Requires user's telegram_id in database
await sendInvoiceToCustomer(invoiceObject, userTelegramId)
```

---

## 📱 WhatsApp Gateway Integration

### Send Message
```javascript
import { sendWhatsAppMessage, formatPhoneNumber } from './lib/whatsapp'

const phone = formatPhoneNumber('08123456789') // Returns: 628123456789
await sendWhatsAppMessage(phone, 'Hello from RFS_STORE!')
```

### Notify Events

#### Order Confirmation
```javascript
import { sendOrderConfirmation } from './lib/whatsapp'

await sendOrderConfirmation(orderObject)
```

#### Send Invoice
```javascript
import { sendInvoiceViaWhatsApp } from './lib/whatsapp'

await sendInvoiceViaWhatsApp(invoiceObject)
```

#### Payment Reminder
```javascript
import { sendPaymentReminder } from './lib/whatsapp'

await sendPaymentReminder(invoiceObject)
```

#### Payment Status
```javascript
import { sendPaymentVerificationStatus } from './lib/whatsapp'

await sendPaymentVerificationStatus(invoiceObject, true) // true = approved
```

#### Order Completion
```javascript
import { sendOrderCompletionNotification } from './lib/whatsapp'

await sendOrderCompletionNotification(orderObject)
```

#### Order Status Update
```javascript
import { sendOrderStatusUpdate } from './lib/whatsapp'

await sendOrderStatusUpdate(orderObject)
```

---

## ⚡ Edge Functions

### Send WhatsApp (Edge Function)
```typescript
// supabase/functions/send-whatsapp/index.ts

// Call from frontend
const response = await fetch('/functions/v1/send-whatsapp', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    phone: '628123456789',
    message: 'Your message here'
  })
})
```

### Telegram Webhook Handler
```typescript
// Automatically receives updates from Telegram
// Handles callback queries and commands
// URL: https://your-project.supabase.co/functions/v1/telegram-webhook
```

### Notify Order (Edge Function)
```typescript
// Triggered by database trigger
// Sends notifications to admin and customer
```

### Notify Invoice (Edge Function)
```typescript
// Triggered by database trigger
// Sends invoice to customer via Telegram & WhatsApp
```

---

## 🔗 Webhook Setup

### Setup Telegram Webhook

```bash
curl -X POST "https://api.telegram.org/bot<BOT_TOKEN>/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://your-project.supabase.co/functions/v1/telegram-webhook",
    "secret_token": "your_secret_token",
    "allowed_updates": ["message", "callback_query"]
  }'
```

### Verify Webhook Status

```bash
curl "https://api.telegram.org/bot<BOT_TOKEN>/getWebhookInfo"
```

### Delete Webhook (if needed)

```bash
curl -X POST "https://api.telegram.org/bot<BOT_TOKEN>/deleteWebhook"
```

---

## 🔔 Real-time Subscriptions

### Subscribe to New Orders (Admin)
```javascript
const orderSubscription = supabase
  .channel('orders')
  .on(
    'postgres_changes',
    {
      event: 'INSERT',
      schema: 'public',
      table: 'orders'
    },
    (payload) => {
      console.log('New order:', payload.new)
      // Update UI, play sound, show notification, etc.
    }
  )
  .subscribe()

// Unsubscribe when component unmounts
orderSubscription.unsubscribe()
```

### Subscribe to Invoice Updates
```javascript
const invoiceSubscription = supabase
  .channel('invoices')
  .on(
    'postgres_changes',
    {
      event: 'UPDATE',
      schema: 'public',
      table: 'invoices',
      filter: `user_id=eq.${userId}`
    },
    (payload) => {
      console.log('Invoice updated:', payload.new)
      // Refresh invoice data
    }
  )
  .subscribe()
```

### Subscribe to Notifications
```javascript
const notificationSubscription = supabase
  .channel('notifications')
  .on(
    'postgres_changes',
    {
      event: 'INSERT',
      schema: 'public',
      table: 'notifications',
      filter: `user_id=eq.${userId}`
    },
    (payload) => {
      console.log('New notification:', payload.new)
      // Show toast notification
      toast.success(payload.new.message)
    }
  )
  .subscribe()
```

---

## 🛠️ Helper Functions

### Format Currency (IDR)
```javascript
const formatCurrency = (amount) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0
  }).format(amount)
}

console.log(formatCurrency(100000)) // "Rp100.000"
```

### Format Date (Indonesia)
```javascript
import { format } from 'date-fns'
import { id } from 'date-fns/locale'

const formattedDate = format(
  new Date(), 
  'dd MMMM yyyy, HH:mm', 
  { locale: id }
)

console.log(formattedDate) // "23 Oktober 2025, 14:30"
```

### Generate Order Number
```javascript
// Auto-generated by database trigger
// Format: ORD-RFS-YYYYMM0001
// Example: ORD-RFS-2025100001
```

### Generate Invoice Number
```javascript
// Auto-generated by database trigger
// Format: INV-RFS-YYYYMM0001
// Example: INV-RFS-2025100001
```

---

## 📊 Statistics API

### Get Dashboard Statistics
```javascript
import { getStatistics } from './lib/supabase'

const stats = await getStatistics()

console.log(stats)
// {
//   totalOrders: 150,
//   activeOrders: 25,
//   completedOrders: 120,
//   totalRevenue: 50000000,
//   pendingPayments: 5,
//   totalUsers: 75,
//   newUsersThisMonth: 12
// }
```

---

## 🔒 Security Best Practices

### Row Level Security (RLS)

All tables have RLS enabled. Examples:

```sql
-- Users can only view their own orders
CREATE POLICY "Users can view own orders"
ON orders FOR SELECT
USING (auth.uid() = user_id);

-- Only admins can update invoice status
CREATE POLICY "Admins can update invoices"
ON invoices FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role IN ('admin', 'staff')
  )
);
```

### API Key Security

❌ Never expose API keys in frontend:
```javascript
// BAD - Don't do this
const WHATSAPP_KEY = 'your-api-key' // Visible in browser
```

✅ Use Edge Functions:
```javascript
// GOOD - API key on server
await fetch('/functions/v1/send-whatsapp', {
  method: 'POST',
  body: JSON.stringify({ phone, message })
})
```

### File Upload Validation

```javascript
// Validate file type
const validTypes = ['image/jpeg', 'image/png', 'application/pdf']
if (!validTypes.includes(file.type)) {
  throw new Error('Invalid file type')
}

// Validate file size (max 5MB)
if (file.size > 5 * 1024 * 1024) {
  throw new Error('File too large')
}
```

---

## 🧪 Testing APIs

### Test Telegram Bot
```bash
curl -X POST "https://api.telegram.org/bot<BOT_TOKEN>/sendMessage" \
  -H "Content-Type: application/json" \
  -d '{
    "chat_id": "<CHAT_ID>",
    "text": "Test message from API"
  }'
```

### Test WhatsApp Gateway (Fonnte)
```bash
curl -X POST "https://api.fonnte.com/send" \
  -H "Authorization: <API_KEY>" \
  -H "Content-Type: application/json" \
  -d '{
    "target": "628123456789",
    "message": "Test message",
    "countryCode": "62"
  }'
```

### Test Supabase Edge Function
```bash
curl -X POST "https://your-project.supabase.co/functions/v1/send-whatsapp" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <ANON_KEY>" \
  -d '{
    "phone": "628123456789",
    "message": "Test from Edge Function"
  }'
```

---

## 📚 Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Telegram Bot API](https://core.telegram.org/bots/api)
- [Fonnte API Docs](https://fonnte.com/api)
- [React Query for Supabase](https://tanstack.com/query)
- [Framer Motion Docs](https://www.framer.com/motion/)

---

**Happy Coding! 🚀**

