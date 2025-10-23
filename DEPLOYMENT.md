# 🚀 Panduan Deployment RFS_STORE

Panduan lengkap untuk deploy aplikasi RFS_STORE ke production.

## 📋 Checklist Pre-Deployment

- [ ] Semua environment variables sudah siap
- [ ] Database schema sudah dijalankan di Supabase
- [ ] Telegram bot sudah dibuat dan dikonfigurasi
- [ ] WhatsApp Gateway sudah aktif
- [ ] Supabase Edge Functions sudah di-deploy
- [ ] Admin account sudah dibuat
- [ ] Testing lokal sudah selesai

## 🗄️ Step 1: Setup Supabase Production

### 1.1 Create Project

1. Login ke [Supabase Dashboard](https://supabase.com/dashboard)
2. Klik "New Project"
3. Isi:
   - Project Name: `rfs-store-production`
   - Database Password: (generate password yang kuat)
   - Region: Pilih yang terdekat dengan target user
4. Tunggu project selesai dibuat (~2 menit)

### 1.2 Setup Database

1. Buka **SQL Editor**
2. Copy-paste seluruh isi file `supabase-schema.sql`
3. Klik **Run** untuk execute
4. Pastikan tidak ada error

### 1.3 Configure Storage

1. Buka **Storage**
2. Bucket `payment-proofs` sudah otomatis dibuat via SQL
3. Verifikasi policies sudah aktif

### 1.4 Setup Edge Functions

```bash
# Install Supabase CLI
npm install -g supabase

# Login
supabase login

# Link to production project
supabase link --project-ref your-production-project-ref

# Set secrets
supabase secrets set WHATSAPP_API_KEY=your_production_key
supabase secrets set WHATSAPP_API_URL=https://api.fonnte.com/send
supabase secrets set TELEGRAM_BOT_TOKEN=your_production_bot_token
supabase secrets set TELEGRAM_CHAT_ID=your_admin_chat_id
supabase secrets set TELEGRAM_SECRET_TOKEN=your_webhook_secret
supabase secrets set FRONTEND_URL=https://yourdomain.com

# Deploy all functions
supabase functions deploy send-whatsapp
supabase functions deploy telegram-webhook
supabase functions deploy notify-order
supabase functions deploy notify-invoice
```

### 1.5 Setup Database Triggers

Jalankan SQL berikut untuk auto-notifications:

```sql
-- Enable HTTP extension
CREATE EXTENSION IF NOT EXISTS http WITH SCHEMA net;

-- Function untuk notifikasi order baru
CREATE OR REPLACE FUNCTION notify_new_order()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM net.http_post(
    url := 'https://your-project-ref.supabase.co/functions/v1/notify-order',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer ' || current_setting('request.jwt.claim.sub') || '"}'::jsonb,
    body := json_build_object('record', row_to_json(NEW))::jsonb
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_order_created
AFTER INSERT ON public.orders
FOR EACH ROW EXECUTE FUNCTION notify_new_order();

-- Function untuk notifikasi invoice baru
CREATE OR REPLACE FUNCTION notify_new_invoice()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM net.http_post(
    url := 'https://your-project-ref.supabase.co/functions/v1/notify-invoice',
    headers := '{"Content-Type": "application/json"}'::jsonb,
    body := json_build_object('record', row_to_json(NEW))::jsonb
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_invoice_created
AFTER INSERT ON public.invoices
FOR EACH ROW EXECUTE FUNCTION notify_new_invoice();
```

## 🤖 Step 2: Setup Telegram Bot Production

### 2.1 Create Production Bot

1. Chat dengan [@BotFather](https://t.me/BotFather)
2. Kirim `/newbot`
3. Nama: `RFS Store Production`
4. Username: `rfsstore_production_bot` (atau yang tersedia)
5. Simpan token yang diberikan

### 2.2 Setup Webhook

```bash
curl -X POST "https://api.telegram.org/bot<YOUR_PRODUCTION_BOT_TOKEN>/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://your-project-ref.supabase.co/functions/v1/telegram-webhook",
    "secret_token": "your_production_secret_token"
  }'
```

### 2.3 Get Admin Chat ID

1. Kirim pesan ke bot production Anda
2. Buka: `https://api.telegram.org/bot<TOKEN>/getUpdates`
3. Copy `chat.id`

### 2.4 Test Bot

Kirim `/start` ke bot dan pastikan menerima response.

## 📱 Step 3: Setup WhatsApp Gateway Production

### Fonnte Production

1. Login ke [Fonnte Dashboard](https://fonnte.com)
2. Upgrade paket jika perlu untuk production use
3. Hubungkan nomor WhatsApp bisnis
4. Copy Production API Key
5. Test dengan send message

### Konfigurasi di Supabase

```bash
supabase secrets set WHATSAPP_API_KEY=your_production_api_key
```

## 🌐 Step 4: Deploy Frontend ke Vercel

### 4.1 Prepare Repository

```bash
# Commit semua perubahan
git add .
git commit -m "Production ready"
git push origin main
```

### 4.2 Deploy via Vercel Dashboard

1. Login ke [Vercel](https://vercel.com)
2. Klik **New Project**
3. Import repository dari GitHub
4. Configure:
   - Framework Preset: **Vite**
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm install`

### 4.3 Set Environment Variables

Di Vercel Dashboard > Settings > Environment Variables:

```
VITE_SUPABASE_URL=your_production_supabase_url
VITE_SUPABASE_ANON_KEY=your_production_anon_key
VITE_TELEGRAM_BOT_TOKEN=your_production_bot_token
VITE_TELEGRAM_CHAT_ID=your_admin_chat_id
VITE_ADMIN_EMAIL=admin@yourdomain.com
```

### 4.4 Deploy

Klik **Deploy** dan tunggu hingga selesai.

### 4.5 Setup Custom Domain (Optional)

1. Buka Settings > Domains
2. Tambahkan domain Anda
3. Update DNS records sesuai instruksi
4. Tunggu SSL certificate aktif

## 🔐 Step 5: Security Hardening

### 5.1 Supabase Security

1. Buka **Settings > API**
2. Enable **Email confirmations**
3. Set **Site URL** ke production domain
4. Tambahkan **Redirect URLs** untuk auth

### 5.2 RLS Verification

Pastikan RLS aktif di semua tabel:

```sql
-- Check RLS status
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';
```

Semua harus `true` untuk `rowsecurity`.

### 5.3 Rate Limiting

Di Vercel, enable rate limiting di `vercel.json`:

```json
{
  "headers": [
    {
      "source": "/api/(.*)",
      "headers": [
        {
          "key": "X-RateLimit-Limit",
          "value": "100"
        }
      ]
    }
  ]
}
```

## 👤 Step 6: Create Admin Account

### 6.1 Register First Admin

1. Buka production website
2. Register akun baru dengan email admin

### 6.2 Promote to Admin

Di Supabase Dashboard:

```sql
-- Update user role to admin
UPDATE profiles 
SET role = 'admin' 
WHERE id = 'user-id-from-auth-users';
```

## 🧪 Step 7: Testing Production

### 7.1 Test Checklist

- [ ] Register & Login berhasil
- [ ] Buat pesanan baru
- [ ] Notifikasi Telegram masuk ke admin
- [ ] Notifikasi WhatsApp masuk ke pelanggan
- [ ] Admin bisa buat invoice
- [ ] Invoice dikirim ke pelanggan (Telegram & WhatsApp)
- [ ] Upload bukti pembayaran berhasil
- [ ] Admin dapat notifikasi bukti pembayaran
- [ ] Verifikasi pembayaran berhasil
- [ ] Konfirmasi dikirim ke pelanggan
- [ ] Dashboard menampilkan data dengan benar
- [ ] Export CSV berfungsi

### 7.2 Load Testing

Gunakan tools seperti [k6](https://k6.io) atau [Apache Bench](https://httpd.apache.org/docs/2.4/programs/ab.html) untuk test performa.

## 📊 Step 8: Monitoring & Analytics

### 8.1 Vercel Analytics

1. Buka Vercel Dashboard > Analytics
2. Enable **Web Vitals**
3. Monitor traffic dan performa

### 8.2 Supabase Monitoring

1. Buka Supabase Dashboard
2. Monitor:
   - API requests
   - Database connections
   - Storage usage
   - Function invocations

### 8.3 Error Tracking (Optional)

Integrate [Sentry](https://sentry.io):

```bash
npm install @sentry/react @sentry/vite-plugin
```

Setup di `main.jsx`:

```javascript
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: "your-sentry-dsn",
  integrations: [new Sentry.BrowserTracing()],
  tracesSampleRate: 1.0,
});
```

## 🔄 Step 9: Continuous Deployment

### 9.1 Automatic Deployments

Vercel otomatis deploy setiap push ke `main` branch.

### 9.2 Preview Deployments

Setiap PR akan dapat preview URL otomatis.

### 9.3 Rollback

Jika ada masalah, rollback via Vercel Dashboard > Deployments > Previous Deployment > Promote to Production.

## 📝 Step 10: Documentation

### 10.1 Update Production URLs

Update semua hardcoded URLs di:
- `src/lib/telegram.js`
- `src/lib/whatsapp.js`
- `src/components/Footer.jsx`

### 10.2 Create Admin Guide

Dokumentasikan cara:
- Membuat invoice
- Verifikasi pembayaran
- Manage orders
- Export reports

## ✅ Post-Deployment Checklist

- [ ] Production URL aktif dan accessible
- [ ] SSL certificate valid
- [ ] Custom domain (jika ada) sudah terhubung
- [ ] Semua notifikasi berfungsi
- [ ] Admin account sudah dibuat
- [ ] Backup strategy sudah disiapkan
- [ ] Monitoring tools aktif
- [ ] Error tracking terinstall
- [ ] Documentation lengkap
- [ ] Tim sudah ditraining

## 🆘 Troubleshooting

### Build Failed di Vercel

```bash
# Clear cache dan rebuild
vercel --force
```

### Telegram Webhook Not Working

```bash
# Check webhook status
curl https://api.telegram.org/bot<TOKEN>/getWebhookInfo

# Delete and reset
curl -X POST https://api.telegram.org/bot<TOKEN>/deleteWebhook
# Set again dengan URL yang benar
```

### WhatsApp Messages Not Sending

1. Check API key masih valid
2. Verify nomor WhatsApp masih aktif
3. Check credit balance di Fonnte
4. Test manual via Fonnte dashboard

### Database Connection Issues

1. Check Supabase project status
2. Verify environment variables benar
3. Check RLS policies
4. Monitor database connections

## 📞 Support

Jika ada masalah saat deployment:
- Check logs di Vercel Dashboard
- Check Supabase logs
- Review error di browser console
- Contact support jika perlu

---

**Good luck with your deployment! 🚀**

