# 🚀 MULAI DISINI - Setup RFS_STORE

## ✅ Status: Dependencies Sudah Terinstall!

Node.js: **v22.18.0** ✅  
npm: **v10.9.3** ✅  
Dependencies: **437 packages installed** ✅

---

## 📋 LANGKAH SELANJUTNYA

### STEP 1: Setup File Konfigurasi (2 menit)

1. **Buka file:** `CONFIG_ENV.txt` (ada di folder RFS ini)
2. **Copy semua isinya** (Ctrl+A, Ctrl+C)
3. **Buat file baru** dengan nama: `.env` (titik di depan!)
   - Cara: Klik kanan di folder RFS → New → Text Document
   - Rename dari `New Text Document.txt` jadi `.env`
   - Windows akan warning, klik **Yes** untuk continue
4. **Paste** isi yang tadi dicopy ke file `.env`
5. **Save** file tersebut

**PENTING:** File harus bernama `.env` bukan `.env.txt` atau `env` saja!

---

### STEP 2: Setup Supabase Database (5 menit)

#### 2.1 Buat Akun & Project Supabase

1. Buka browser, kunjungi: **https://supabase.com/dashboard**
2. Klik **"Sign Up"** atau **"Start your project"**
3. Login dengan GitHub / Google (yang paling mudah)
4. Setelah login, klik tombol **"New Project"**
5. Isi form:
   ```
   Name: rfs-store-dev
   Database Password: (klik "Generate a password" → Copy password ini!)
   Region: Southeast Asia (Singapore)
   Pricing Plan: Free (sudah cukup untuk development)
   ```
6. Klik **"Create new project"**
7. **TUNGGU 2 MENIT** - project sedang di-setup

#### 2.2 Dapatkan API Credentials

Setelah project selesai dibuat:

1. Di Supabase Dashboard, pastikan project **rfs-store-dev** terbuka
2. Klik icon **⚙️ Settings** di sidebar kiri (paling bawah)
3. Klik **"API"** di menu settings
4. Scroll ke bawah, Anda akan lihat:
   - **Project URL** (contoh: `https://abcxyz123.supabase.co`)
   - **Project API keys**
     - `anon` `public` (ini yang kita butuhkan!)

5. **COPY 2 nilai ini:**
   - Copy **Project URL**
   - Copy **anon public** key (string panjang yang dimulai dengan `eyJ...`)

#### 2.3 Update File .env

1. **Buka file `.env`** yang tadi dibuat
2. **Ganti baris ini:**

   Dari:
   ```
   VITE_SUPABASE_URL=https://your-project-id.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.your-key-here
   ```

   Jadi (paste credentials Anda):
   ```
   VITE_SUPABASE_URL=https://abcxyz123.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZi... (string panjang)
   ```

3. **Save** file (Ctrl+S)

#### 2.4 Setup Database Schema (PENTING!)

Sekarang kita perlu membuat semua tabel di database:

1. Di Supabase Dashboard, klik icon **</>** di sidebar kiri (**SQL Editor**)
2. Klik tombol **"+ New query"**
3. Di project RFS ini, **buka file:** `supabase-schema.sql`
4. **Copy SEMUA isi file tersebut** (Ctrl+A, Ctrl+C)
5. **Kembali ke Supabase** SQL Editor
6. **Paste** di editor (hapus yang ada, paste yang baru)
7. Klik tombol **"Run"** atau tekan **Ctrl + Enter**
8. **TUNGGU 10-15 detik**
9. Harus muncul pesan: ✅ **"Success. No rows returned"**

**Cek apakah berhasil:**
- Klik **🗄️ Table Editor** di sidebar
- Harus muncul tables: `profiles`, `services`, `orders`, `invoices`, dll
- Jika ada, berarti SUKSES! ✅

---

### STEP 3: Jalankan Aplikasi (1 menit)

Sekarang semua sudah siap! Mari jalankan:

1. **Buka Terminal/PowerShell** di folder RFS
   - Cara: Klik di address bar Windows Explorer, ketik `powershell`, Enter
   
2. **Jalankan command:**
   ```powershell
   npm run dev
   ```

3. **Tunggu** sampai muncul:
   ```
   VITE v5.0.8  ready in 500 ms
   
   ➜  Local:   http://localhost:3000/
   ➜  Network: use --host to expose
   ➜  press h to show help
   ```

4. **Buka browser**, ketik: `http://localhost:3000`

5. **SELAMAT!** Website Anda sudah jalan! 🎉

---

### STEP 4: Buat Akun Admin (2 menit)

#### 4.1 Register Akun Pertama

1. Di website, klik **"Daftar"** di kanan atas
2. Isi form:
   ```
   Nama Lengkap: Admin RFS
   Email: admin@rfsstore.com
   Nomor Telepon: 08123456789
   Password: admin1234
   Konfirmasi Password: admin1234
   ```
3. Klik **"Daftar"**
4. Akan redirect ke halaman Login

#### 4.2 Login

1. Email: `admin@rfsstore.com`
2. Password: `admin1234`
3. Klik **"Login"**
4. Anda akan masuk ke Dashboard (tapi belum jadi admin)

#### 4.3 Jadikan Admin di Database

1. **Kembali ke Supabase Dashboard**
2. Klik **🔐 Authentication** di sidebar
3. Klik **"Users"** 
4. Anda akan lihat user yang baru dibuat
5. **COPY User ID** (format: `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`)

6. Klik **🗄️ Table Editor** di sidebar
7. Pilih table **`profiles`**
8. Cari row dengan **id** yang sama dengan User ID tadi
9. Di kolom **`role`**, klik cell tersebut
10. Ubah dari `user` menjadi **`admin`**
11. Tekan **Enter** atau klik di luar untuk save

#### 4.4 Refresh Website

1. Kembali ke website (localhost:3000)
2. **Refresh** (F5 atau Ctrl+R)
3. **BOOM!** Menu **"Admin"** sekarang muncul! 🎉

---

### STEP 5: Test Fitur (5 menit)

#### Test 1: Buat Pesanan

1. Klik menu **"Layanan"**
2. Pilih salah satu service, misal: **"Jasa Tugas Sekolah & Kuliah"**
3. Klik **"Pesan"**
4. Isi deskripsi: "Test order pertama saya"
5. Klik **"Kirim Pesanan"**
6. ✅ Harus muncul notifikasi sukses
7. **CEK TELEGRAM** → Bot harus kirim notifikasi ke nomor: **6478150893**

#### Test 2: Buat Invoice (Admin)

1. Klik menu **"Admin"** → **"Manajemen Pesanan"**
2. Anda akan lihat order yang tadi dibuat
3. Klik icon **Edit** (pensil)
4. Ubah status jadi **"Processing"**
5. Tambah catatan: "Sedang dikerjakan"
6. Klik **"Simpan Perubahan"**
7. ✅ Status berubah!

8. Sekarang klik menu **"Admin"** → **"Manajemen Invoice"**
9. Klik **"+ Buat Invoice"**
10. Pilih order yang tadi dibuat
11. Isi:
    ```
    Total Pembayaran: 100000
    Metode: Transfer Bank
    ```
12. Klik **"Buat Invoice"**
13. ✅ Invoice berhasil dibuat!

#### Test 3: Upload Bukti Bayar

1. **Logout** dari admin
2. **Login lagi** sebagai user (admin@rfsstore.com / admin1234)
3. Klik **"Pesanan Saya"**
4. Klik **"Lihat Invoice"** pada order tadi
5. Scroll ke **"Upload Bukti Pembayaran"**
6. Pilih gambar (JPG/PNG, max 5MB)
7. Klik **"Upload Bukti Pembayaran"**
8. ✅ Berhasil upload!
9. **CEK TELEGRAM** → Admin dapat notifikasi bukti pembayaran!

#### Test 4: Verifikasi Pembayaran (Admin)

1. Klik menu **"Admin"** → **"Verifikasi Pembayaran"**
2. Anda akan lihat invoice yang pending
3. Klik **"Verifikasi"**
4. Lihat bukti bayar
5. Klik **"Verifikasi & Setujui"**
6. ✅ Status jadi PAID!

---

## 🎉 SELESAI! Aplikasi Anda Sudah Jalan!

### Yang Sudah Jalan:
- ✅ Frontend running di localhost:3000
- ✅ Database Supabase connected
- ✅ Authentication (Login/Register)
- ✅ User Dashboard
- ✅ Admin Panel lengkap
- ✅ Order management
- ✅ Invoice system
- ✅ Payment proof upload
- ✅ **Telegram notifications** ke chat ID: **6478150893**

### Yang Belum (Normal, bisa disetup nanti):
- ❌ WhatsApp notifications (perlu setup Fonnte)
- ❌ Production deployment (masih localhost)
- ❌ Auto-notifications via database triggers

---

## 🐛 Troubleshooting

### Website Tidak Bisa Dibuka

**Solusi:**
```powershell
# Stop server (Ctrl+C)
# Jalankan lagi:
npm run dev
```

### Error: "Cannot connect to Supabase"

**Cek:**
1. File `.env` sudah ada?
2. `VITE_SUPABASE_URL` dan `VITE_SUPABASE_ANON_KEY` sudah diisi dengan benar?
3. Copy lagi dari Supabase Dashboard → Settings → API
4. Restart server

### Telegram Notifikasi Tidak Masuk

**Solusi:**
1. **Kirim pesan dulu ke bot** (klik link ini di HP):
   ```
   https://t.me/your_bot_username
   ```
   Kirim `/start`

2. **Cek Chat ID yang benar:**
   - Buka browser, paste URL ini:
   ```
   https://api.telegram.org/bot8464163003:AAHLj8X0p7dY2_mHH7y8GH02uXU--B8fXXM/getUpdates
   ```
   - Lihat `"chat":{"id":123456}`
   - Update di file `.env` jika berbeda

3. **Coba chat ID backup:**
   - Edit `.env`
   - Ganti `VITE_TELEGRAM_CHAT_ID=5788748857`
   - Restart server

### Menu Admin Tidak Muncul

**Solusi:**
1. Pastikan sudah ubah `role` di database jadi `admin`
2. **Logout** dari website
3. **Login lagi**
4. Jika masih tidak muncul:
   - Clear browser cache (Ctrl+Shift+Delete)
   - Hard refresh (Ctrl+F5)
   - Restart server

### Error SQL saat Run Schema

**Solusi:**
1. Pastikan copy **SEMUA** isi `supabase-schema.sql`
2. Pastikan tidak ada bagian yang terpotong
3. Coba run ulang
4. Jika tetap error, run bagian per bagian (table per table)

---

## 📞 Butuh Bantuan?

1. **Cek error di browser:**
   - Tekan F12 → Tab "Console"
   - Screenshot error yang muncul

2. **Cek error di terminal:**
   - Lihat terminal tempat `npm run dev` jalan
   - Copy error message yang muncul

3. **Baca dokumentasi:**
   - `README.md` - Dokumentasi lengkap
   - `QUICK_START.md` - Panduan singkat
   - `API_GUIDE.md` - Referensi API

---

## 🚀 Next Steps (Opsional)

Setelah semua jalan, Anda bisa:

1. **Setup WhatsApp Gateway:**
   - Daftar di https://fonnte.com
   - Dapat API key
   - Isi di `.env`

2. **Deploy ke Production:**
   - Baca file `DEPLOYMENT.md`
   - Deploy frontend ke Vercel
   - Deploy Edge Functions ke Supabase

3. **Customize:**
   - Ubah warna di `tailwind.config.js`
   - Tambah service di Supabase
   - Modifikasi halaman sesuai kebutuhan

---

**🎉 Selamat! Aplikasi RFS_STORE Anda sudah jalan!**

**Bot Token:** `8464163003:AAHLj8X0p7dY2_mHH7y8GH02uXU--B8fXXM`  
**Chat ID:** `6478150893` (backup: `5788748857`)

Happy Coding! 🚀

