# 🎯 FINAL INTEGRATION GUIDE - RFS_STORE

## ✅ COMPLETE SQL INTEGRATION + UPDATED ADMIN NUMBERS

### **📊 DATABASE SCHEMA - LENGKAP & PRODUCTION READY**

---

## **1. COMPLETE DATABASE SQL**

**File:** `COMPLETE_DATABASE_FINAL.sql`

### **Features:**
- ✅ **7 Tables** - Profiles, Services, Orders, Invoices, Payments, Notifications, Audit Logs
- ✅ **Telegram ID Support** - `profiles.telegram_id` & `profiles.whatsapp_number`
- ✅ **Result Tracking** - `orders.result_url` & `orders.result_message`
- ✅ **Payment Verification** - `invoices.verified_by` & `invoices.verified_at`
- ✅ **19 Optimized Indexes** - For fast queries
- ✅ **Auto-Create Profile Trigger** - Extract telegram_id from metadata
- ✅ **Updated_at Triggers** - Auto-timestamp updates
- ✅ **Sample Data** - 5 services pre-loaded
- ✅ **RLS Disabled** - For easier initial setup (enable for production if needed)

### **Tables:**

#### **profiles**
```sql
id UUID PRIMARY KEY
full_name TEXT
email TEXT
phone TEXT
telegram_id TEXT          -- NEW: For Telegram notifications
whatsapp_number TEXT      -- NEW: For WhatsApp (optional)
role TEXT                 -- 'user' or 'admin'
avatar_url TEXT
created_at TIMESTAMPTZ
updated_at TIMESTAMPTZ
```

#### **orders**
```sql
id UUID PRIMARY KEY
order_number TEXT UNIQUE
user_id UUID
service_id UUID
description TEXT
details JSONB
status order_status
result_url TEXT           -- NEW: URL file hasil jokian
result_message TEXT       -- NEW: Pesan untuk customer
admin_notes TEXT
completed_at TIMESTAMPTZ  -- NEW: Completion timestamp
created_at TIMESTAMPTZ
updated_at TIMESTAMPTZ
```

#### **invoices**
```sql
id UUID PRIMARY KEY
invoice_number TEXT UNIQUE
order_id UUID
amount DECIMAL(10,2)
status invoice_status
payment_method TEXT
payment_details JSONB
due_date TIMESTAMPTZ
paid_at TIMESTAMPTZ
verified_by UUID          -- NEW: Admin who verified
verified_at TIMESTAMPTZ   -- NEW: Verification timestamp
admin_notes TEXT
created_at TIMESTAMPTZ
updated_at TIMESTAMPTZ
```

### **Enums:**
- `order_status`: pending, processing, completed, cancelled
- `invoice_status`: unpaid, pending, paid, cancelled
- `payment_status`: pending, verified, rejected
- `service_category`: academic, design, rental, other

---

## **2. UPDATED EDGE FUNCTIONS (TypeScript)**

### **📱 telegram-webhook/index.ts** - UPDATED

**Admin Numbers:**
```typescript
const ADMIN_WHATSAPP = {
  admin1: '6282181183590',  // NEW
  admin2: '6282176466707'   // NEW
}
```

**Features:**
- ✅ Handle callback queries (verify/reject payment, complete order)
- ✅ Bot commands (/start, /help, /chatid, /status)
- ✅ Send notifications to customer via Telegram & WhatsApp
- ✅ Secret token validation
- ✅ Full error handling
- ✅ Admin WhatsApp reference

**Commands:**
- `/start` - Get Chat ID & welcome message
- `/help` - Show help with admin WhatsApp numbers
- `/chatid` - Get your Chat ID
- `/status` - Check bot status

---

### **💬 send-whatsapp/index.ts** - UPDATED

**Admin Numbers:**
```typescript
const ADMIN_WHATSAPP = {
  admin1: '6282181183590',
  admin2: '6282176466707'
}
```

**Features:**
- ✅ Send to specific phone number
- ✅ Send to admin1, admin2, or all_admins
- ✅ Dual token support (device → account fallback)
- ✅ Auto phone number formatting (62xxx)
- ✅ Media file support
- ✅ Detailed logging

**Usage:**
```typescript
// Send to specific number
{ phone: '08123456789', message: '...' }

// Send to admin 1
{ target_type: 'admin1', message: '...' }

// Send to all admins
{ target_type: 'all_admins', message: '...' }
```

---

### **📦 notify-order/index.ts** - NEW!

**Purpose:** Send notifications when new order is created

**Features:**
- ✅ Notify all admin Telegrams
- ✅ Notify all admin WhatsApps
- ✅ Formatted messages for each channel
- ✅ Full error handling
- ✅ Returns notification results

**Flow:**
```
1. New order created
   ↓
2. Call this Edge Function
   ↓
3. Send to Admin 1 & 2 via Telegram
   ↓
4. Send to Admin 1 & 2 via WhatsApp
   ↓
5. Return results
```

---

### **📄 notify-invoice/index.ts** - UPDATED

**Purpose:** Send notifications when new invoice is created

**Features:**
- ✅ Notify all admin Telegrams
- ✅ Notify customer via Telegram (if has telegram_id)
- ✅ Notify customer via WhatsApp
- ✅ Formatted currency (Rp)
- ✅ Include payment details
- ✅ Full error handling

**Flow:**
```
1. New invoice created
   ↓
2. Call this Edge Function
   ↓
3. Send to Admins (Telegram only)
   ↓
4. Send to Customer (Telegram + WhatsApp)
   ↓
5. Return results
```

---

### **📦 send-result/index.ts** - EXISTING

**Purpose:** Send order results to customer

**Features:**
- ✅ Upload result_url & result_message
- ✅ Auto-complete order
- ✅ Send to customer via Telegram & WhatsApp
- ✅ Multi-channel selection

---

## **3. FRONTEND LIBRARIES**

### **src/lib/telegram.js** - UPDATED

**New:**
```javascript
export const ADMIN_WHATSAPP = {
  admin1: '6282181183590',
  admin2: '6282176466707'
}
```

### **src/lib/whatsapp.js** - UPDATED

**New:**
```javascript
export const ADMIN_WHATSAPP = {
  admin1: '6282181183590',
  admin2: '6282176466707'
}

console.log('WhatsApp Config:', {
  deviceTokenExists: !!FONNTE_DEVICE_TOKEN,
  accountTokenExists: !!FONNTE_ACCOUNT_TOKEN,
  adminNumbers: ADMIN_WHATSAPP,  // NEW
  apiUrl: FONNTE_API_URL
})
```

---

## **4. ENVIRONMENT VARIABLES**

### **Local (.env):**
```bash
# Supabase
VITE_SUPABASE_URL=https://lzuqfckzboeqwtlqjfgm.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Telegram
VITE_TELEGRAM_BOT_TOKEN=8464163003:AAHLj8X0p7dY2_mHH7y8GH02uXU--B8fXXM
VITE_TELEGRAM_ADMIN_CHAT_ID=5788748857,6478150893

# WhatsApp (Fonnte)
VITE_FONNTE_DEVICE_TOKEN=zCvpmi9fjxwhyKxTqt22
VITE_FONNTE_TOKEN=hakuNNT3TBPHvGqtcF2QYLXnFaUYQt66Qsg91ndi6

# Admin WhatsApp Numbers (NEW)
VITE_ADMIN_WHATSAPP_1=6282181183590
VITE_ADMIN_WHATSAPP_2=6282176466707
```

### **Vercel Production:**
```
✅ VITE_SUPABASE_URL
✅ VITE_SUPABASE_ANON_KEY
✅ VITE_TELEGRAM_BOT_TOKEN
✅ VITE_TELEGRAM_ADMIN_CHAT_ID
✅ VITE_FONNTE_DEVICE_TOKEN
✅ VITE_ADMIN_WHATSAPP_1 ← NEW
✅ VITE_ADMIN_WHATSAPP_2 ← NEW
```

---

## **5. ADMIN NUMBERS UPDATE**

### **Previous:**
```
Admin 1: (not specified)
Admin 2: (not specified)
```

### **NEW:**
```
Admin 1: 082181183590 → 6282181183590
Admin 2: 082176466707 → 6282176466707
```

### **Used In:**
- ✅ `telegram-webhook/index.ts` - Reference in /help command
- ✅ `send-whatsapp/index.ts` - Target for admin notifications
- ✅ `notify-order/index.ts` - Send new order notifications
- ✅ `notify-invoice/index.ts` - Send invoice notifications
- ✅ `src/lib/telegram.js` - Frontend reference
- ✅ `src/lib/whatsapp.js` - Frontend usage
- ✅ `.env` - Environment variables
- ✅ Vercel - Production environment

---

## **6. DEPLOYMENT STATUS**

### **GitHub:**
✅ **Commits:**
- `b75e7c1` - Complete SQL + Edge Functions with new admin numbers
- `97aba7e` - Updated notify-invoice Edge Function

### **Vercel:**
✅ **Deployed:** https://rfs-store.vercel.app
✅ **Environment Variables:** All set including new admin WhatsApp
✅ **Build:** Success
✅ **Status:** Live

### **Supabase:**
⚠️ **Database Schema:** Need to run `COMPLETE_DATABASE_FINAL.sql`
⚠️ **Edge Functions:** Need to deploy via Supabase CLI

---

## **7. SETUP INSTRUCTIONS**

### **Step 1: Run SQL in Supabase** ⏰ 2 minutes

```
1. Open: https://supabase.com/dashboard/project/lzuqfckzboeqwtlqjfgm/sql/new
2. Copy entire content from: COMPLETE_DATABASE_FINAL.sql
3. Paste in SQL Editor
4. Click "Run"
5. Wait for success message:
   "✅ DATABASE SETUP COMPLETE!"
```

**This will:**
- ✅ Create all 7 tables
- ✅ Create all indexes
- ✅ Create triggers (auto-profile, updated_at)
- ✅ Insert sample services
- ✅ Disable RLS (for easier setup)

---

### **Step 2: Deploy Edge Functions** ⏰ 5 minutes

```bash
# Install Supabase CLI (if not installed)
npm install -g supabase

# Login
supabase login

# Link project
supabase link --project-ref lzuqfckzboeqwtlqjfgm

# Deploy all functions
supabase functions deploy telegram-webhook
supabase functions deploy send-whatsapp
supabase functions deploy notify-order
supabase functions deploy notify-invoice
supabase functions deploy send-result

# Set environment variables for Edge Functions
supabase secrets set TELEGRAM_BOT_TOKEN=8464163003:AAHLj8X0p7dY2_mHH7y8GH02uXU--B8fXXM
supabase secrets set FONNTE_DEVICE_TOKEN=zCvpmi9fjxwhyKxTqt22
supabase secrets set FONNTE_TOKEN=hakuNNT3TBPHvGqtcF2QYLXnFaUYQt66Qsg91ndi6
```

---

### **Step 3: Test Complete Flow** ⏰ 10 minutes

#### **Test 1: Registration with Telegram ID**
```
1. Open: https://rfs-store.vercel.app/register
2. Fill form:
   - Name: Test User 1
   - Email: test1@example.com
   - Phone: 08123456789
   - Telegram ID: <your_chat_id> (get from @rftore_bot)
   - Password: password123
3. Click "Daftar Sekarang"
4. Verify: Profile created with telegram_id
```

#### **Test 2: Create Order**
```
1. Login with test1@example.com
2. Choose service: "Jasa Tugas"
3. Fill order form
4. Submit
5. Verify notifications:
   ✅ Admin 1 receives Telegram
   ✅ Admin 2 receives Telegram
   ✅ Admin 1 receives WhatsApp (6282181183590)
   ✅ Admin 2 receives WhatsApp (6282176466707)
   ✅ Customer receives Telegram (if has telegram_id)
   ✅ Customer receives WhatsApp
```

#### **Test 3: Create Invoice**
```
1. Admin login
2. Go to Orders
3. Select an order
4. Create invoice
5. Verify notifications:
   ✅ Admin 1 & 2 receive Telegram
   ✅ Customer receives Telegram (if has telegram_id)
   ✅ Customer receives WhatsApp
```

#### **Test 4: Verify Payment**
```
1. Customer upload payment proof
2. Admin go to Payments
3. Click "Verify"
4. Verify notifications:
   ✅ Customer receives confirmation via Telegram
   ✅ Customer receives confirmation via WhatsApp
```

---

## **8. NOTIFICATION FLOW SUMMARY**

### **New Order:**
```
Customer creates order
   ↓
System sends to:
   → Admin 1 Telegram (5788748857)
   → Admin 2 Telegram (6478150893)
   → Admin 1 WhatsApp (6282181183590)
   → Admin 2 WhatsApp (6282176466707)
   → Customer Telegram (if has telegram_id)
   → Customer WhatsApp (always)
```

### **New Invoice:**
```
Admin creates invoice
   ↓
System sends to:
   → Admin 1 & 2 Telegram (info only)
   → Customer Telegram (if has telegram_id)
   → Customer WhatsApp (always)
```

### **Payment Verified:**
```
Admin verifies payment
   ↓
System sends to:
   → Customer Telegram (if has telegram_id)
   → Customer WhatsApp (always)
```

### **Order Completed:**
```
Admin sends result
   ↓
System sends to:
   → Customer Telegram (if has telegram_id)
   → Customer WhatsApp (always)
```

---

## **9. ADMIN CONTACT INFO**

### **For Bot Commands:**
```
Telegram Bot: @rftore_bot

Commands:
/start - Get Chat ID
/help - Show help (includes admin WhatsApp)
/chatid - Get your Chat ID
/status - Check bot status
```

### **For Direct Contact:**
```
Admin 1:
  • Telegram: 5788748857
  • WhatsApp: 6282181183590

Admin 2:
  • Telegram: 6478150893
  • WhatsApp: 6282176466707
```

---

## **10. TROUBLESHOOTING**

### **Problem: Telegram notifications not received**
**Solution:**
1. Check admin has started bot: `/start` @rftore_bot
2. Verify Chat ID is correct
3. Check bot token in .env

### **Problem: WhatsApp notifications not received**
**Solution:**
1. Check Fonnte device is connected
2. Verify token is valid: https://md.fonnte.com/
3. Check admin WhatsApp numbers are correct (62xxx format)

### **Problem: Customer not receiving notifications**
**Solution:**
1. Check customer has telegram_id in profile (optional)
2. Check customer phone number is correct
3. Verify phone format: 08xxx → 6208xxx

---

## **✅ CHECKLIST**

- [ ] Run `COMPLETE_DATABASE_FINAL.sql` in Supabase
- [ ] Deploy all Edge Functions via Supabase CLI
- [ ] Set Supabase secrets (tokens)
- [ ] Test registration with Telegram ID
- [ ] Test order creation (verify all notifications)
- [ ] Test invoice creation (verify notifications)
- [ ] Test payment verification (verify notifications)
- [ ] Test order completion (verify result sent)
- [ ] Verify admin 1 receives WhatsApp (6282181183590)
- [ ] Verify admin 2 receives WhatsApp (6282176466707)

---

## **🎉 DONE!**

**All SQL integration complete + Edge Functions updated with new admin numbers!**

### **What's Ready:**
✅ Complete database schema with telegram_id support
✅ 5 Edge Functions fully updated
✅ Admin WhatsApp numbers configured
✅ Frontend libraries updated
✅ Environment variables set
✅ Deployed to production

### **Next Steps:**
1. Run SQL in Supabase (2 min)
2. Deploy Edge Functions (5 min)
3. Test complete flow (10 min)

### **Support:**
- GitHub: https://github.com/jonalexanderhere/RFS_STORE
- Vercel: https://rfs-store.vercel.app
- Admin 1 WhatsApp: 6282181183590
- Admin 2 WhatsApp: 6282176466707

---

*Generated: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")*
*Status: SQL Ready | Edge Functions Updated | Deployed*

