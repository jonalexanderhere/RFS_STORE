# 🚀 Setup Local - RFS_STORE

## ✅ Step 1: Install Dependencies

Buka terminal di folder RFS dan jalankan:

```bash
npm install
```

Tunggu sampai selesai (sekitar 2-3 menit).

---

## ⚙️ Step 2: Buat File .env

Buat file baru bernama `.env` di root folder (sejajar dengan package.json)

**Copy paste ini ke file .env:**

```env
# Supabase Configuration
# IMPORTANT: Anda HARUS isi ini dengan credentials Supabase Anda!
# Cara dapat: https://supabase.com/dashboard → Settings → API
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Telegram Bot Configuration (SUDAH DIISI)
VITE_TELEGRAM_BOT_TOKEN=8464163003:AAHLj8X0p7dY2_mHH7y8GH02uXU--B8fXXM
VITE_TELEGRAM_CHAT_ID=6478150893
TELEGRAM_SECRET_TOKEN=rfsstore_secret_2025

# WhatsApp Gateway (OPSIONAL - bisa diisi nanti)
WHATSAPP_API_KEY=
WHATSAPP_API_URL=https://api.fonnte.com/send

# Admin
VITE_ADMIN_EMAIL=admin@rfsstore.com
```

**CATATAN PENTING:** 
- Telegram sudah dikonfigurasi ✅
- Chat ID backup: 5788748857 (jika yang pertama tidak bekerja)
- **Supabase WAJIB diisi** - tanpa ini aplikasi tidak akan jalan!

---

## 🗄️ Step 3: Setup Supabase Database

### 3.1 Buat Project Supabase

1. Buka https://supabase.com/dashboard
2. Login atau Sign Up (gratis)
3. Klik **"New Project"**
4. Isi:
   - Name: `rfs-store-dev`
   - Database Password: (generate password kuat)
   - Region: **Southeast Asia (Singapore)**
5. Klik **"Create new project"**
6. Tunggu 2 menit

### 3.2 Dapatkan API Credentials

1. Di Supabase Dashboard, klik project Anda
2. Klik **Settings** (gear icon) → **API**
3. Copy 2 nilai ini:
   - **Project URL** (contoh: https://abcdefgh.supabase.co)
   - **anon public** key (string panjang yang dimulai dengan 'eyJ...')

### 3.3 Update File .env

Buka file `.env` yang tadi dibuat, ganti:
```env
VITE_SUPABASE_URL=https://abcdefgh.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 3.4 Setup Database Schema

1. Di Supabase Dashboard, klik **SQL Editor** (ikon </>)
2. Klik **"New Query"**
3. Buka file `supabase-schema.sql` dari project
4. Copy **SEMUA ISI** file tersebut
5. Paste ke SQL Editor di Supabase
6. Klik **"Run"** atau tekan **Ctrl + Enter**
7. Tunggu sampai selesai (10-15 detik)
8. Harus muncul: ✅ "Success. No rows returned"

---

## 🚀 Step 4: Jalankan Development Server

```bash
npm run dev
```

Tunggu sampai muncul:
```
VITE v5.0.8  ready in 500 ms

➜  Local:   http://localhost:3000/
➜  Press h to show help
```

Buka browser dan akses: **http://localhost:3000**

---

## ✅ Step 5: Test Aplikasi

### 5.1 Register Akun Pertama

1. Klik **"Daftar"** di kanan atas
2. Isi form:
   - Nama Lengkap: (nama Anda)
   - Email: test@example.com
   - Nomor Telepon: 08123456789
   - Password: test1234
   - Konfirmasi Password: test1234
3. Klik **"Daftar"**
4. Akan redirect ke halaman Login

### 5.2 Login

1. Email: test@example.com
2. Password: test1234
3. Klik **"Login"**
4. Seharusnya masuk ke Dashboard

### 5.3 Jadikan Admin

1. Buka Supabase Dashboard
2. Klik **Authentication** (icon 🔐) → **Users**
3. Lihat user yang baru dibuat
4. **Copy User ID** (format: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx)
5. Klik **Table Editor** (icon 📊) → pilih table **profiles**
6. Cari row dengan ID yang sama
7. Di kolom **role**, klik dan ubah dari `user` menjadi `admin`
8. Tekan Enter atau klik di luar cell untuk save
9. Kembali ke website, **Refresh halaman** (F5)
10. Sekarang menu **"Admin"** akan muncul! 🎉

---

## 🧪 Step 6: Test Notifikasi Telegram

### 6.1 Test Pesanan Baru

1. Login sebagai user
2. Klik menu **"Layanan"**
3. Pilih salah satu layanan, klik **"Pesan"**
4. Isi deskripsi: "Test order pertama"
5. Klik **"Kirim Pesanan"**
6. **CEK TELEGRAM** → Bot harus kirim notifikasi ke chat ID: 6478150893

### 6.2 Jika Notifikasi Tidak Masuk

Coba chat ID yang kedua:
1. Stop server (Ctrl+C)
2. Edit file `.env`
3. Ganti:
   ```env
   VITE_TELEGRAM_CHAT_ID=5788748857
   ```
4. Save dan jalankan lagi: `npm run dev`
5. Test buat order lagi

### 6.3 Cara Cek Chat ID yang Benar

1. Kirim pesan apa saja ke bot Telegram Anda
2. Buka browser, paste URL ini (ganti <TOKEN>):
   ```
   https://api.telegram.org/bot8464163003:AAHLj8X0p7dY2_mHH7y8GH02uXU--B8fXXM/getUpdates
   ```
3. Cari `"chat":{"id":123456789}`
4. Angka itu adalah Chat ID yang benar
5. Update di file `.env`

---

## 🎯 Step 7: Test Fitur Admin

1. Login sebagai admin
2. Klik menu **"Admin"**
3. Test semua menu:
   - **Dashboard** - Lihat statistik
   - **Manajemen Pesanan** - Lihat order yang tadi dibuat
   - **Manajemen Invoice** - Buat invoice untuk order
   - **Verifikasi Pembayaran** - (akan ada setelah user upload bukti)
   - **Laporan** - Lihat data keuangan

---

## 🐛 Troubleshooting

### Error: "Cannot find module"
```bash
rm -rf node_modules package-lock.json
npm install
```

### Error: "Supabase connection failed"
- Pastikan file `.env` ada dan terisi dengan benar
- Pastikan `VITE_SUPABASE_URL` dan `VITE_SUPABASE_ANON_KEY` sudah diisi
- Restart server: tutup terminal, buka lagi, jalankan `npm run dev`

### Error: "Failed to execute query"
- Pastikan schema SQL sudah dijalankan di Supabase
- Cek di Supabase → Table Editor, harus ada tables: profiles, services, orders, invoices, dll

### Telegram notifikasi tidak masuk
- Cek bot token benar
- Cek chat ID benar (gunakan getUpdates untuk dapat chat ID yang tepat)
- Pastikan Anda sudah `/start` bot terlebih dahulu
- Coba kedua chat ID yang diberikan

### Menu Admin tidak muncul
- Pastikan role di database sudah diubah ke `admin`
- Logout, lalu login lagi
- Clear cache browser: Ctrl+Shift+Delete
- Hard refresh: Ctrl+F5

---

## 📱 Struktur Folder

```
RFS/
├── .env                    ← File config (BUAT INI DULU!)
├── package.json
├── supabase-schema.sql     ← Jalankan ini di Supabase
├── index.html
├── src/
│   ├── App.jsx
│   ├── main.jsx
│   ├── pages/              ← Halaman-halaman
│   ├── components/         ← Komponen UI
│   └── lib/                ← Utilities (Supabase, Telegram, WhatsApp)
├── QUICK_START.md
└── README.md
```

---

## ✅ Checklist Setup

- [ ] `npm install` selesai
- [ ] File `.env` dibuat dan diisi
- [ ] Supabase project dibuat
- [ ] API credentials diisi di `.env`
- [ ] Database schema dijalankan di Supabase
- [ ] `npm run dev` berhasil
- [ ] Website buka di http://localhost:3000
- [ ] Register akun berhasil
- [ ] Login berhasil
- [ ] User dijadikan admin di database
- [ ] Menu Admin muncul
- [ ] Test buat order
- [ ] Telegram notifikasi masuk ✅

---

## 🎉 Selesai!

Jika semua checklist ✅, aplikasi Anda sudah jalan!

### Fitur yang Sudah Jalan:
- ✅ Frontend running di localhost:3000
- ✅ Database Supabase terhubung
- ✅ Authentication (Login/Register)
- ✅ User Dashboard
- ✅ Admin Panel
- ✅ Telegram notifications

### Yang Belum Jalan (Normal):
- ❌ WhatsApp notifications (perlu setup Fonnte + deploy Edge Functions)
- ❌ Production domain (masih localhost)
- ❌ Automatic notifications via triggers (perlu setup tambahan)

---

## 📞 Butuh Bantuan?

1. Cek error di browser console (F12 → Console)
2. Cek error di terminal tempat `npm run dev` jalan
3. Baca file `QUICK_START.md` untuk panduan detail
4. Baca file `README.md` untuk dokumentasi lengkap

---

**🚀 Happy Coding!**

