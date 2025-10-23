# 🚀 RFS_STORE x InspiraProject

Platform layanan digital dan akademik terpadu dengan **sistem invoice otomatis**, **integrasi Telegram Bot**, dan **WhatsApp Gateway**.

## ✨ Fitur Utama

### 🎯 Untuk Pelanggan
- **Pemesanan Online**: Order layanan dengan mudah melalui website
- **Invoice Digital**: Terima invoice otomatis dengan detail lengkap
- **Upload Bukti Pembayaran**: System upload yang aman dan terverifikasi
- **Notifikasi Real-time**: Update via Telegram & WhatsApp
- **Dashboard Pribadi**: Track semua pesanan dan invoice Anda

### 👨‍💼 Untuk Admin
- **Dashboard Komprehensif**: Statistik lengkap bisnis Anda
- **Manajemen Pesanan**: Kelola semua order dengan mudah
- **Invoice Generator**: Buat invoice dengan cepat
- **Verifikasi Pembayaran**: Panel khusus untuk approve/reject pembayaran
- **Laporan Keuangan**: Export data dalam format CSV
- **Notifikasi Otomatis**: Dapat alert untuk setiap aktivitas penting

### 🤖 Automasi
- **Telegram Bot**: Notifikasi otomatis ke admin & pelanggan
- **WhatsApp Gateway**: Kirim pesan otomatis ke nomor pelanggan
- **Real-time Updates**: Supabase Realtime untuk update instant
- **Edge Functions**: Serverless functions untuk webhook & automasi

## 🛍️ Layanan yang Tersedia

1. 📝 **Jasa Tugas Sekolah & Kuliah**
2. 💻 **Sewa Laptop**
3. 🧠 **Joki Makalah**
4. 🎨 **Jasa Desain Grafis**
5. 📚 **Pembuatan & Laporan PKL**

> Semua harga fleksibel dan ditentukan setelah review pesanan oleh admin.

## 🔧 Tech Stack

- **Frontend**: React 18 + Vite + TailwindCSS + Framer Motion
- **Backend**: Supabase (Database, Auth, Storage, Realtime)
- **Automation**: Telegram Bot API + WhatsApp Gateway (Fonnte)
- **Deployment**: Vercel/Netlify (Frontend) + Supabase Edge Functions
- **Language**: JavaScript/TypeScript

## 📋 Prerequisites

- Node.js 18+ dan npm/yarn
- Akun Supabase (gratis)
- Telegram Bot Token (dari @BotFather)
- WhatsApp Gateway API Key (Fonnte/Wablas/Twilio)
- Git

## 🚀 Instalasi & Setup

### 1. Clone Repository

```bash
git clone <repository-url>
cd RFS
npm install
```

### 2. Setup Supabase

1. Buat project baru di [Supabase](https://supabase.com)
2. Copy URL dan Anon Key dari Settings > API
3. Jalankan SQL schema:
   - Buka SQL Editor di Supabase Dashboard
   - Copy-paste isi file `supabase-schema.sql`
   - Execute query

### 3. Setup Telegram Bot

1. Chat dengan [@BotFather](https://t.me/BotFather) di Telegram
2. Kirim `/newbot` dan ikuti instruksi
3. Simpan **Bot Token** yang diberikan
4. Dapatkan Chat ID:
   - Kirim pesan ke bot Anda
   - Buka: `https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getUpdates`
   - Copy `chat.id` dari response

### 4. Setup WhatsApp Gateway

**Menggunakan Fonnte:**
1. Daftar di [Fonnte.com](https://fonnte.com)
2. Hubungkan nomor WhatsApp Anda
3. Copy API Key dari dashboard
4. API URL: `https://api.fonnte.com/send`

**Alternatif:** Wablas, Twilio, atau WhatsApp Business API

### 5. Environment Variables

Buat file `.env` di root project:

```env
# Supabase
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Telegram Bot
VITE_TELEGRAM_BOT_TOKEN=your_telegram_bot_token
VITE_TELEGRAM_CHAT_ID=your_admin_chat_id
TELEGRAM_SECRET_TOKEN=your_webhook_secret_token

# WhatsApp Gateway (Fonnte)
WHATSAPP_API_KEY=your_whatsapp_api_key
WHATSAPP_API_URL=https://api.fonnte.com/send

# Admin
VITE_ADMIN_EMAIL=admin@rfsstore.com
```

### 6. Deploy Supabase Edge Functions

```bash
# Install Supabase CLI
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref your-project-ref

# Set environment secrets
supabase secrets set WHATSAPP_API_KEY=your_key
supabase secrets set TELEGRAM_BOT_TOKEN=your_token
supabase secrets set TELEGRAM_CHAT_ID=your_chat_id
supabase secrets set TELEGRAM_SECRET_TOKEN=your_secret
supabase secrets set FRONTEND_URL=your_frontend_url

# Deploy functions
supabase functions deploy send-whatsapp
supabase functions deploy telegram-webhook
supabase functions deploy notify-order
supabase functions deploy notify-invoice
```

### 7. Setup Telegram Webhook

```bash
curl -X POST "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://your-project.supabase.co/functions/v1/telegram-webhook",
    "secret_token": "your_secret_token"
  }'
```

### 8. Setup Database Triggers (Optional - for Auto Notifications)

Jalankan SQL berikut di Supabase SQL Editor:

```sql
-- Trigger untuk notifikasi order baru
CREATE OR REPLACE FUNCTION notify_new_order()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM net.http_post(
    url := 'https://your-project.supabase.co/functions/v1/notify-order',
    headers := '{"Content-Type": "application/json"}'::jsonb,
    body := json_build_object('record', row_to_json(NEW))::jsonb
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_order_created
AFTER INSERT ON public.orders
FOR EACH ROW EXECUTE FUNCTION notify_new_order();

-- Trigger untuk notifikasi invoice baru
CREATE OR REPLACE FUNCTION notify_new_invoice()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM net.http_post(
    url := 'https://your-project.supabase.co/functions/v1/notify-invoice',
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

### 9. Jalankan Development Server

```bash
npm run dev
```

Buka browser: `http://localhost:3000`

## 📦 Build untuk Production

```bash
npm run build
```

Output ada di folder `dist/`

## 🚀 Deployment

### Deploy ke Vercel

```bash
npm install -g vercel
vercel login
vercel
```

Atau:
1. Push code ke GitHub
2. Import repository di [Vercel Dashboard](https://vercel.com)
3. Tambahkan environment variables
4. Deploy!

### Deploy ke Netlify

```bash
npm install -g netlify-cli
netlify login
netlify deploy --prod
```

## 👤 Setup Admin Account

1. Daftar akun baru melalui website
2. Masuk ke Supabase Dashboard > Authentication > Users
3. Copy User ID
4. Buka Table Editor > profiles
5. Update role user menjadi `admin`

```sql
UPDATE profiles SET role = 'admin' WHERE id = 'user-id-here';
```

## 📱 Konfigurasi Nomor WhatsApp & Telegram

### Update Nomor di Footer

Edit `src/components/Footer.jsx`:

```javascript
const whatsappNumber = '628123456789' // Ganti dengan nomor WA admin
const telegramUsername = 'rfsstore_admin' // Ganti dengan username Telegram
```

### Update Nomor Admin WhatsApp

Edit `src/lib/whatsapp.js`:

```javascript
export const sendAdminWhatsAppNotification = async (message) => {
  const adminPhone = '628123456789' // Ganti dengan nomor admin
  return sendWhatsAppMessage(adminPhone, message)
}
```

## 🔒 Keamanan

- ✅ Row Level Security (RLS) aktif pada semua tabel
- ✅ Environment variables untuk kredensial sensitif
- ✅ Telegram webhook dengan secret token
- ✅ File upload terverifikasi (max 5MB)
- ✅ Validasi input di frontend & backend
- ✅ Audit log untuk aktivitas penting

## 📊 Alur Sistem

```
1. User Order Layanan
   ↓
2. Notifikasi ke Admin (Telegram & Dashboard)
   ↓
3. Admin Buat Invoice
   ↓
4. Invoice Dikirim ke User (Telegram & WhatsApp)
   ↓
5. User Upload Bukti Pembayaran
   ↓
6. Notifikasi ke Admin
   ↓
7. Admin Verifikasi Pembayaran
   ↓
8. Konfirmasi ke User (Telegram & WhatsApp)
   ↓
9. Admin Update Status Pesanan
   ↓
10. User Menerima Notifikasi Selesai
```

## 📝 Database Schema

### Tables

- **profiles**: Data pengguna (extends auth.users)
- **services**: Layanan yang tersedia
- **orders**: Pesanan pelanggan
- **invoices**: Invoice pembayaran
- **payment_proofs**: Bukti pembayaran
- **notifications**: Notifikasi user
- **audit_logs**: Log aktivitas sistem

### Storage Buckets

- **payment-proofs**: Menyimpan bukti pembayaran

## 🤝 Support & Contact

- 📧 Email: admin@rfsstore.com
- 💬 Telegram: [@rfsstore_admin](https://t.me/rfsstore_admin)
- 📱 WhatsApp: +62 812-3456-7890

## 📄 License

Copyright © 2025 RFS_STORE x InspiraProject. All rights reserved.

## 🙏 Credits

Built with ❤️ using:
- [React](https://react.dev)
- [Supabase](https://supabase.com)
- [TailwindCSS](https://tailwindcss.com)
- [Framer Motion](https://www.framer.com/motion/)
- [Telegram Bot API](https://core.telegram.org/bots/api)
- [Fonnte WhatsApp API](https://fonnte.com)

---

**Happy Coding! 🚀**

#   R F S _ S T O R E  
 