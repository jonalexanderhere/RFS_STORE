# 📱 Panduan Notifikasi Otomatis RFS Store

## 🎯 Fitur

Sistem ini akan **OTOMATIS** mengirim pesan ke pengguna saat:
- ✅ Order selesai dikerjakan (COMPLETED)
- ⏳ Order mulai diproses (PROCESSING)
- ❌ Order dibatalkan (CANCELLED)

Pesan otomatis dikirim ke:
- 📱 **WhatsApp** (Prioritas 1)
- 💬 **Telegram** (Prioritas 2)

---

## 📋 Cara Instalasi

### Step 1: Install Sistem Notifikasi Database

1. Buka **Supabase Dashboard**
2. Masuk ke **SQL Editor**
3. Copy isi file `notification-system.sql`
4. Paste dan jalankan
5. Tunggu sampai muncul pesan sukses

✅ **Hasil**: Tabel dan trigger notifikasi sudah terpasang!

---

### Step 2: Setup WhatsApp API

Ada 3 pilihan provider WhatsApp (pilih salah satu):

#### **PILIHAN A: Fonnte.com** (Recommended - Mudah & Murah)

1. **Daftar di Fonnte.com**
   - Buka https://fonnte.com
   - Daftar akun baru (GRATIS trial)
   - Login ke dashboard

2. **Hubungkan WhatsApp**
   - Scan QR Code dengan WhatsApp Anda
   - Tunggu sampai terkoneksi

3. **Dapatkan Token**
   - Masuk ke menu "Device"
   - Copy **Token** Anda
   - Simpan untuk step berikutnya

**Harga Fonnte:**
- GRATIS 100 pesan pertama
- Paket Regular: Rp 150.000/bulan (unlimited)
- Paket Premium: Rp 350.000/bulan (multi-device)

#### **PILIHAN B: Wablas.com** (Alternatif)

1. Daftar di https://wablas.com
2. Hubungkan WhatsApp
3. Dapatkan API Token
4. Copy token untuk digunakan

#### **PILIHAN C: WhatsApp Business API** (Official - Mahal)

1. Daftar di Meta Business
2. Setup WhatsApp Business API
3. Dapatkan Access Token & Phone Number ID
4. Verifikasi business account

---

### Step 3: Setup Telegram Bot (Opsional)

1. **Buat Bot Telegram**
   - Buka Telegram, cari **@BotFather**
   - Kirim perintah: `/newbot`
   - Beri nama bot: `RFS Store Bot`
   - Beri username: `rfs_store_bot` (harus unik)

2. **Dapatkan Token**
   - BotFather akan kirim **Bot Token**
   - Simpan token ini (contoh: `123456789:ABCdefGHIjklMNOpqrsTUVwxyz`)

3. **Test Bot**
   - Cari bot Anda di Telegram
   - Klik Start
   - Kirim pesan untuk test

4. **Dapatkan Chat ID User**
   - User harus start bot dulu
   - Simpan Chat ID di kolom `telegram_id` di tabel `profiles`

---

### Step 4: Deploy Edge Functions ke Supabase

#### A. Install Supabase CLI

```bash
# Windows (PowerShell)
scoop install supabase

# Atau download manual dari:
# https://github.com/supabase/cli/releases
```

#### B. Login ke Supabase

```bash
supabase login
```

#### C. Link Project

```bash
# Ganti PROJECT_REF dengan ref project Anda
supabase link --project-ref YOUR_PROJECT_REF
```

#### D. Buat Structure Folder

```bash
# Di folder project Anda
mkdir -p supabase/functions/send-whatsapp
mkdir -p supabase/functions/send-telegram
mkdir -p supabase/functions/process-notifications
```

#### E. Copy Files

1. Copy isi `supabase-edge-function-whatsapp.ts` ke:
   ```
   supabase/functions/send-whatsapp/index.ts
   ```

2. Copy isi `supabase-edge-function-telegram.ts` ke:
   ```
   supabase/functions/send-telegram/index.ts
   ```

3. Copy isi `notification-webhook-processor.ts` ke:
   ```
   supabase/functions/process-notifications/index.ts
   ```

#### F. Set Environment Variables

```bash
# Set secrets untuk API keys
supabase secrets set FONNTE_TOKEN="token_fonnte_anda"
supabase secrets set TELEGRAM_BOT_TOKEN="token_telegram_anda"

# Atau untuk Wablas
supabase secrets set WABLAS_TOKEN="token_wablas_anda"

# Atau untuk WhatsApp Business API
supabase secrets set WHATSAPP_TOKEN="token_whatsapp_anda"
supabase secrets set WHATSAPP_PHONE_NUMBER_ID="phone_number_id"
```

#### G. Deploy Functions

```bash
# Deploy satu per satu
supabase functions deploy send-whatsapp
supabase functions deploy send-telegram
supabase functions deploy process-notifications
```

---

### Step 5: Setup Webhook/Cron Job

Ada 2 cara untuk memproses notifikasi pending:

#### **CARA A: Database Webhook** (Recommended)

1. Buka **Supabase Dashboard** → **Database** → **Webhooks**
2. Klik **Create a new hook**
3. Isi form:
   - **Name**: `process-notifications-webhook`
   - **Table**: `notification_logs`
   - **Events**: `INSERT`
   - **Type**: `HTTP Request`
   - **Method**: `POST`
   - **URL**: `https://YOUR_PROJECT.supabase.co/functions/v1/process-notifications`
   - **Headers**:
     ```
     Authorization: Bearer YOUR_ANON_KEY
     Content-Type: application/json
     ```
4. Save

✅ **Otomatis**: Setiap ada notifikasi baru, langsung diproses!

#### **CARA B: Cron Job** (Alternatif)

Setup cron job di server untuk hit endpoint:

```bash
# Setiap 1 menit
curl -X POST \
  'https://YOUR_PROJECT.supabase.co/functions/v1/process-notifications' \
  -H 'Authorization: Bearer YOUR_ANON_KEY' \
  -H 'Content-Type: application/json'
```

Atau pakai service seperti:
- **cron-job.org** (gratis)
- **EasyCron** (gratis 20 jobs)

---

### Step 6: Update Data User dengan Nomor WhatsApp

Pastikan user punya nomor WhatsApp/Telegram:

```sql
-- Update nomor WhatsApp user
UPDATE profiles 
SET whatsapp = '628123456789'  -- Format: 628xxx (tanpa +)
WHERE id = 'user-id-here';

-- Atau update Telegram ID
UPDATE profiles 
SET telegram_id = '123456789'  -- Chat ID dari Telegram
WHERE id = 'user-id-here';

-- Lihat user yang belum ada kontak
SELECT id, full_name, phone, whatsapp, telegram_id
FROM profiles
WHERE (whatsapp IS NULL OR whatsapp = '')
  AND (telegram_id IS NULL OR telegram_id = '');
```

---

## 🧪 Cara Test Sistem

### Test 1: Update Order Manual

```sql
-- Ambil order ID yang ada
SELECT id, order_number, status FROM orders LIMIT 1;

-- Update status ke completed (akan auto-trigger notifikasi)
UPDATE orders 
SET status = 'completed' 
WHERE id = 'order-id-here';

-- Cek notifikasi yang dibuat
SELECT * FROM notification_logs 
ORDER BY created_at DESC 
LIMIT 5;
```

### Test 2: Kirim Notifikasi Manual

```sql
-- Kirim notifikasi manual untuk order tertentu
SELECT send_manual_notification('order-id-here', 'order_completed');

-- Cek status pengiriman
SELECT * FROM notification_status_view 
ORDER BY created_at DESC 
LIMIT 10;
```

### Test 3: Test Edge Function Langsung

```bash
# Test WhatsApp function
curl -X POST \
  'https://YOUR_PROJECT.supabase.co/functions/v1/send-whatsapp' \
  -H 'Authorization: Bearer YOUR_ANON_KEY' \
  -H 'Content-Type: application/json' \
  -d '{"notification_id": "notification-id-here"}'

# Test Telegram function
curl -X POST \
  'https://YOUR_PROJECT.supabase.co/functions/v1/send-telegram' \
  -H 'Authorization: Bearer YOUR_ANON_KEY' \
  -H 'Content-Type: application/json' \
  -d '{"notification_id": "notification-id-here"}'
```

---

## 📊 Monitoring Notifikasi

### Dashboard Admin - Lihat Status Notifikasi

```sql
-- Lihat semua notifikasi
SELECT * FROM notification_status_view 
ORDER BY created_at DESC 
LIMIT 50;

-- Lihat notifikasi yang gagal
SELECT * FROM notification_logs 
WHERE status = 'failed' 
ORDER BY created_at DESC;

-- Lihat notifikasi yang pending
SELECT * FROM notification_logs 
WHERE status = 'pending' 
ORDER BY created_at ASC;

-- Stats notifikasi
SELECT 
    status,
    service_type,
    COUNT(*) as total,
    COUNT(CASE WHEN DATE(created_at) = CURRENT_DATE THEN 1 END) as today
FROM notification_logs
GROUP BY status, service_type;
```

---

## 🎨 Customize Pesan Notifikasi

Edit fungsi `generate_order_notification_message` di file `notification-system.sql`:

```sql
-- Contoh: Tambah link download
v_message := '🎉 *ORDER SELESAI!*' || E'\n\n' ||
            'Hai ' || v_user_name || '!' || E'\n\n' ||
            '✅ Order Anda sudah selesai!' || E'\n\n' ||
            '📋 *Detail:*' || E'\n' ||
            '• No. Order: ' || v_order_number || E'\n' ||
            '• Layanan: ' || v_service_name || E'\n\n' ||
            '📥 *Download Hasil:*' || E'\n' ||
            'https://yourapp.com/orders/' || v_order_number || E'\n\n' ||
            'Terima kasih! 🙏';
```

Setelah edit, jalankan ulang function di SQL Editor.

---

## 💰 Estimasi Biaya

### Fonnte (WhatsApp)
- ✅ **GRATIS**: 100 pesan pertama
- 💵 **Rp 150.000/bulan**: Unlimited pesan
- No setup fee

### Wablas (WhatsApp)
- 💵 **Rp 250.000/bulan**: 10.000 pesan
- Setup fee: Rp 100.000

### Telegram
- ✅ **100% GRATIS**: Unlimited pesan
- No fees at all

### Supabase Edge Functions
- ✅ **GRATIS**: 500.000 invocations/month (Free tier)
- Upgrade: $25/month untuk 2 juta invocations

**Rekomendasi untuk startup:**
- Gunakan **Telegram** dulu (100% gratis)
- Atau **Fonnte** (murah & mudah setup)
- Budget: ~Rp 150.000/bulan

---

## 🔧 Troubleshooting

### Problem: Notifikasi tidak terkirim

**Cek:**
1. Status di `notification_logs`:
   ```sql
   SELECT * FROM notification_logs 
   WHERE status = 'failed' 
   ORDER BY created_at DESC;
   ```

2. Cek error message:
   ```sql
   SELECT error_message FROM notification_logs 
   WHERE status = 'failed';
   ```

3. Cek Edge Function logs:
   - Buka Supabase Dashboard
   - Edge Functions → Logs
   - Lihat error details

### Problem: User tidak punya nomor WhatsApp/Telegram

**Solusi:**
```sql
-- Update nomor WhatsApp
UPDATE profiles 
SET whatsapp = '628xxx' 
WHERE id = 'user-id';
```

### Problem: Token API expired/invalid

**Solusi:**
```bash
# Update secret
supabase secrets set FONNTE_TOKEN="new_token"
```

### Problem: Webhook tidak jalan

**Cek:**
1. Webhook URL benar
2. Authorization header benar
3. Function sudah di-deploy
4. Check webhook logs di Supabase

---

## 📱 Contoh Format Nomor

### WhatsApp (Fonnte/Wablas)
```
✅ BENAR: 628123456789 (tanpa +, tanpa -)
❌ SALAH: +62-812-3456-789
❌ SALAH: 0812-3456-789
```

### Telegram
```
✅ BENAR: 123456789 (numeric chat ID)
❌ SALAH: @username
```

Cara dapat Chat ID:
1. User start bot Telegram Anda
2. Hit: `https://api.telegram.org/bot{TOKEN}/getUpdates`
3. Cari `chat.id` di response

---

## 🚀 Fitur Advanced (Opsional)

### 1. Kirim dengan File Attachment

Edit Edge Function untuk support file:

```typescript
// Untuk WhatsApp dengan file
body: JSON.stringify({
  target: notification.recipient_number,
  message: notification.message,
  file_url: 'https://your-storage.com/result.pdf',
  filename: 'hasil-order.pdf'
})
```

### 2. Template Pesan dengan Variabel

```sql
-- Simpan template di tabel
CREATE TABLE message_templates (
  id UUID PRIMARY KEY,
  name TEXT,
  template TEXT,
  variables JSONB
);

-- Insert template
INSERT INTO message_templates (name, template, variables)
VALUES (
  'order_completed',
  'Hai {user_name}! Order {order_number} sudah selesai.',
  '["user_name", "order_number"]'::jsonb
);
```

### 3. Retry Logic untuk Notifikasi Gagal

```sql
-- Function untuk retry failed notifications
CREATE OR REPLACE FUNCTION retry_failed_notifications()
RETURNS void AS $$
BEGIN
  UPDATE notification_logs
  SET status = 'pending',
      error_message = NULL
  WHERE status = 'failed'
    AND created_at > NOW() - INTERVAL '1 hour'
    AND (error_message NOT LIKE '%invalid number%');
END;
$$ LANGUAGE plpgsql;

-- Jalankan setiap jam via cron
```

---

## ✅ Checklist Final

Sebelum production, pastikan:

- [ ] Database schema sudah terinstall
- [ ] User sudah punya nomor WhatsApp/Telegram
- [ ] API Token sudah di-set di Supabase Secrets
- [ ] Edge Functions sudah di-deploy
- [ ] Webhook/Cron job sudah jalan
- [ ] Test kirim notifikasi berhasil
- [ ] Monitoring dashboard siap
- [ ] Admin tau cara lihat logs

---

## 🎉 Kesimpulan

Setelah setup lengkap:

1. ✅ User update status order → **OTOMATIS kirim notif**
2. ✅ Tidak perlu manual copy-paste nomor
3. ✅ Tracking lengkap di database
4. ✅ Support WhatsApp & Telegram
5. ✅ Scalable untuk banyak user

**Total waktu setup: ~30-60 menit**

---

**Butuh bantuan?**
- Check logs di Supabase Dashboard
- Review `notification_logs` table
- Test manual dengan fungsi `send_manual_notification`

**Selamat! Sistem notifikasi otomatis Anda siap! 🚀**

