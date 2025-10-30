# 🚨 FIX INFINITE RECURSION + PROMOTE ADMIN

## ❌ MASALAH SAAT INI:
```
infinite recursion detected in policy for relation "profiles"
```
**Dan kedua user tidak bisa lihat admin panel**

---

## ✅ SOLUSI LENGKAP (2 MENIT):

### **STEP 1: Buka SQL Editor Supabase**

**Klik link ini:**
```
https://supabase.com/dashboard/project/lzuqfckzboeqwtlqjfgm/sql/new
```

---

### **STEP 2: Copy SEMUA isi file `FIX_DAN_PROMOTE_SEKARANG.sql`**

**Atau copy query ini:**

<details>
<summary>👉 KLIK DI SINI UNTUK LIHAT QUERY (Copy semua)</summary>

```sql
-- ============================================
-- FIX INFINITE RECURSION + PROMOTE USERS
-- ============================================

-- PART 1: FIX INFINITE RECURSION
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Update all policies
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;

CREATE POLICY "Admins can view all profiles" ON public.profiles
    FOR SELECT USING (public.is_admin());

CREATE POLICY "Admins can update all profiles" ON public.profiles
    FOR UPDATE USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can manage services" ON public.services;
CREATE POLICY "Admins can manage services" ON public.services
    FOR ALL USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can view all orders" ON public.orders;
DROP POLICY IF EXISTS "Admins can update all orders" ON public.orders;

CREATE POLICY "Admins can view all orders" ON public.orders
    FOR SELECT USING (public.is_admin());

CREATE POLICY "Admins can update all orders" ON public.orders
    FOR UPDATE USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can view all invoices" ON public.invoices;
DROP POLICY IF EXISTS "Admins can manage invoices" ON public.invoices;

CREATE POLICY "Admins can view all invoices" ON public.invoices
    FOR SELECT USING (public.is_admin());

CREATE POLICY "Admins can manage invoices" ON public.invoices
    FOR ALL USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can view all payment proofs" ON public.payment_proofs;
DROP POLICY IF EXISTS "Admins can verify payment proofs" ON public.payment_proofs;

CREATE POLICY "Admins can view all payment proofs" ON public.payment_proofs
    FOR SELECT USING (public.is_admin());

CREATE POLICY "Admins can verify payment proofs" ON public.payment_proofs
    FOR UPDATE USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can view audit logs" ON public.audit_logs;
CREATE POLICY "Admins can view audit logs" ON public.audit_logs
    FOR SELECT USING (public.is_admin());

-- PART 2: PROMOTE USERS
UPDATE public.profiles 
SET role = 'admin'
WHERE id IN (
    '88d321ac-b040-4707-8586-218ced262268',
    '80efaa74-e5dc-46db-84e1-e9df3215f60c'
);

-- VERIFY
SELECT 
    p.id,
    u.email,
    p.full_name,
    p.role
FROM public.profiles p
JOIN auth.users u ON p.id = u.id
WHERE p.id IN (
    '88d321ac-b040-4707-8586-218ced262268',
    '80efaa74-e5dc-46db-84e1-e9df3215f60c'
);
```

</details>

---

### **STEP 3: Paste ke SQL Editor dan Klik "Run"**

1. Paste semua query yang di-copy tadi
2. Klik tombol **"Run"** (atau tekan **Ctrl + Enter**)
3. Tunggu sampai selesai (~10 detik)
4. Harusnya muncul hasil query di bawah

---

### **STEP 4: LOGOUT dan LOGIN LAGI** ⚠️ PENTING!

**Ini WAJIB dilakukan!**

1. Buka website: `https://rfs-store.vercel.app`
2. **Klik "Logout"** di kanan atas
3. **LOGIN lagi** dengan salah satu user tersebut
4. **Menu "Admin" sekarang muncul!** ✅

**CATATAN:** Session lama tidak otomatis update role. User HARUS logout dan login lagi agar role admin ter-apply!

---

## 🧪 VERIFY (Opsional)

Setelah login lagi, cek apakah:
- ✅ Tidak ada error "infinite recursion"
- ✅ Menu "Admin" muncul di navbar
- ✅ Bisa akses halaman admin
- ✅ Bisa lihat semua orders/invoices

---

## 🆘 TROUBLESHOOTING

### Problem: Masih error "infinite recursion"
**Solusi:**
- Pastikan query `FIX_DAN_PROMOTE_SEKARANG.sql` sudah di-run SEMUA
- Refresh browser (Ctrl + F5)
- Clear cache browser

### Problem: Menu admin tidak muncul setelah login
**Solusi:**
1. **LOGOUT** dari website
2. **CLOSE browser** sepenuhnya
3. Buka browser lagi
4. **LOGIN** lagi
5. Menu admin seharusnya muncul

Jika masih tidak muncul, cek di SQL Editor:
```sql
SELECT 
    u.email,
    p.role
FROM public.profiles p
JOIN auth.users u ON p.id = u.id
WHERE u.email = 'email-anda@example.com';
```

Pastikan `role` = `admin`

### Problem: Error lain muncul
**Solusi:**
- Screenshot error nya
- Cek di browser console (F12 → Console tab)
- Pastikan kedua user sudah confirmed email

---

## 📋 CHECKLIST

Sebelum selesai, pastikan:

- [ ] Query `FIX_DAN_PROMOTE_SEKARANG.sql` sudah di-run
- [ ] Tidak ada error saat run query
- [ ] Verify query menunjukkan role = 'admin'
- [ ] **LOGOUT dari website**
- [ ] **LOGIN lagi**
- [ ] Menu "Admin" muncul
- [ ] Bisa akses halaman admin

---

## 🎯 RINGKASAN

**Inti masalahnya:**
1. RLS policy infinite recursion → Fixed dengan `is_admin()` function
2. User belum di-promote → Fixed dengan UPDATE query
3. Session lama masih cache → Fixed dengan logout/login

**Total waktu:** ~2 menit  
**Kesulitan:** Mudah  
**Status:** Ready to fix! ✅

---

**File lengkap ada di:** `FIX_DAN_PROMOTE_SEKARANG.sql`

**Quick link:** https://supabase.com/dashboard/project/lzuqfckzboeqwtlqjfgm/sql/new

🎉 **Setelah ikuti semua langkah, masalah pasti selesai!**

