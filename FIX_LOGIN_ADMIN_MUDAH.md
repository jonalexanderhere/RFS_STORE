# 🔐 Fix Login Admin - Solusi Cepat

## ❌ Masalah:
```
Login gagal: Invalid login credentials
```

## ✅ Solusi (2 Langkah - 2 Menit):

---

## Step 1: Buat User Admin di Supabase Dashboard

### 1.1 Buka Halaman Users
Klik link ini: **https://supabase.com/dashboard/project/YOUR_PROJECT_ID/auth/users**

Atau:
- Buka Supabase Dashboard
- Klik **Authentication** di sidebar
- Klik **Users**

### 1.2 Tambah User Admin

1. Klik tombol **"Add user"** atau **"Invite"**
2. Pilih **"Create new user"**
3. Isi form:

```
Email address: admin1@rfsstore.com
Password: Admin@123
```

4. **PENTING**: Centang/aktifkan **"Auto Confirm User"**
   - Ini penting agar user langsung bisa login tanpa verifikasi email

5. Klik **"Create user"**

✅ User admin sudah dibuat!

---

## Step 2: Promote User ke Admin

### 2.1 Buka SQL Editor
Klik link: **https://supabase.com/dashboard/project/YOUR_PROJECT_ID/sql**

Atau:
- Klik ikon **</>** di sidebar (SQL Editor)

### 2.2 Jalankan Query Ini

Copy dan paste query ini, lalu klik **Run**:

```sql
-- Promote user ke admin
SELECT promote_user_to_admin('admin1@rfsstore.com');
```

### 2.3 Verifikasi (Opsional)

Cek apakah sudah jadi admin:

```sql
-- Lihat semua admin
SELECT * FROM get_all_admins();
```

Harusnya muncul:
- Email: admin1@rfsstore.com
- Full name: (yang diisi saat register)
- Role akan otomatis jadi 'admin'

---

## Step 3: Update Contact Info (Opsional)

Jika ingin update nama dan nomor kontak admin:

```sql
SELECT update_admin_contact(
    'admin1@rfsstore.com',
    'Admin RFS Store 1',
    '082181183590',
    '6282181183590',
    '5788748857'
);
```

---

## 🧪 Test Login

1. Buka website: **https://rfs-store.vercel.app/login**
2. Login dengan:
   ```
   Email: admin1@rfsstore.com
   Password: Admin@123
   ```
3. ✅ **Berhasil!** Menu Admin sekarang muncul

---

## 🔄 Buat Admin Kedua (Opsional)

Ulangi langkah yang sama untuk admin kedua:

### Step 1: Create User
```
Email: admin2@rfsstore.com
Password: Admin@123
✅ Auto Confirm User: YES
```

### Step 2: Promote
```sql
SELECT promote_user_to_admin('admin2@rfsstore.com');
```

### Step 3: Update Contact
```sql
SELECT update_admin_contact(
    'admin2@rfsstore.com',
    'Admin RFS Store 2',
    '082176466707',
    '6282176466707',
    '6478150893'
);
```

---

## 🆘 Troubleshooting

### Problem: User sudah ada tapi tidak bisa login

**Cek apakah email sudah confirmed:**

```sql
-- Cek status user
SELECT 
    email,
    email_confirmed_at,
    confirmed_at
FROM auth.users
WHERE email = 'admin1@rfsstore.com';
```

**Jika NULL**, confirm manual:

```sql
-- Confirm user
UPDATE auth.users
SET 
    email_confirmed_at = NOW(),
    confirmed_at = NOW()
WHERE email = 'admin1@rfsstore.com';
```

### Problem: Login berhasil tapi menu admin tidak muncul

**Cek role:**

```sql
-- Cek role user
SELECT p.role, u.email
FROM profiles p
JOIN auth.users u ON p.id = u.id
WHERE u.email = 'admin1@rfsstore.com';
```

**Jika bukan 'admin', jalankan lagi:**

```sql
SELECT promote_user_to_admin('admin1@rfsstore.com');
```

### Problem: Invalid login credentials

**Reset password di Dashboard:**

1. Buka: Authentication → Users
2. Cari user `admin1@rfsstore.com`
3. Klik "..." (three dots)
4. Klik "Reset Password"
5. Set password baru: `Admin@123`
6. Save

---

## 📝 Helper Functions Available

Setelah run `supabase-schema-fixed.sql`, tersedia functions:

### 1. Promote User ke Admin
```sql
SELECT promote_user_to_admin('user@example.com');
```

### 2. Demote Admin ke User
```sql
SELECT demote_admin_to_user('admin@example.com');
```

### 3. Lihat Semua Admin
```sql
SELECT * FROM get_all_admins();
```

### 4. Update Contact Info
```sql
SELECT update_admin_contact(
    'email@example.com',
    'Full Name',
    'Phone',
    'WhatsApp Number',
    'Telegram ID'
);
```

---

## ✅ Checklist

Setup admin berhasil jika:

- [x] User created di Authentication → Users
- [x] Auto Confirm User: CHECKED
- [x] Query `promote_user_to_admin` berhasil
- [x] `get_all_admins()` menampilkan user
- [x] Login berhasil
- [x] Menu Admin muncul di navbar

---

## 🎯 Quick Commands

Copy-paste langsung di SQL Editor:

```sql
-- Full setup Admin 1
SELECT promote_user_to_admin('admin1@rfsstore.com');
SELECT update_admin_contact('admin1@rfsstore.com', 'Admin RFS Store 1', '082181183590', '6282181183590', '5788748857');

-- Full setup Admin 2
SELECT promote_user_to_admin('admin2@rfsstore.com');
SELECT update_admin_contact('admin2@rfsstore.com', 'Admin RFS Store 2', '082176466707', '6282176466707', '6478150893');

-- Verify
SELECT * FROM get_all_admins();
```

---

**Total Waktu: ~2 menit**  
**Kesulitan: Mudah**  
**Status: ✅ Ready to use**

🎉 **Selesai! Admin sudah bisa login!**

