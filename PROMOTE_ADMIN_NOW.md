# 🚀 PROMOTE USERS TO ADMIN - INSTANT

## User IDs to Promote:
1. `d875e73a-3949-4bfb-8f49-e442eb1a879a`
2. `80efaa74-e5dc-46db-84e1-e9df3215f60c`

---

## ✅ CARA TERCEPAT (1 Menit)

### Step 1: Buka SQL Editor
**Klik link ini langsung:**
```
https://supabase.com/dashboard/project/lzuqfckzboeqwtlqjfgm/sql/new
```

### Step 2: Copy & Paste Query Ini

```sql
-- Promote kedua user jadi admin
UPDATE public.profiles 
SET role = 'admin'
WHERE id IN (
    'd875e73a-3949-4bfb-8f49-e442eb1a879a',
    '80efaa74-e5dc-46db-84e1-e9df3215f60c'
);

-- Verify
SELECT 
    p.id,
    u.email,
    p.full_name,
    p.role,
    p.created_at
FROM public.profiles p
JOIN auth.users u ON p.id = u.id
WHERE p.id IN (
    'd875e73a-3949-4bfb-8f49-e442eb1a879a',
    '80efaa74-e5dc-46db-84e1-e9df3215f60c'
);
```

### Step 3: Klik "Run" (Ctrl+Enter)

✅ **DONE!** Kedua user sekarang sudah jadi admin!

---

## 🔍 Cek Hasil

Jalankan query ini untuk lihat semua admin:

```sql
SELECT * FROM get_all_admins();
```

---

## 🎯 Update Contact Info (Opsional)

Jika ingin update nomor WhatsApp/Telegram:

### Untuk User 1:
```sql
UPDATE public.profiles
SET 
    full_name = 'Admin RFS Store 1',
    phone = '082181183590',
    whatsapp = '6282181183590',
    telegram_id = '5788748857'
WHERE id = 'd875e73a-3949-4bfb-8f49-e442eb1a879a';
```

### Untuk User 2:
```sql
UPDATE public.profiles
SET 
    full_name = 'Admin RFS Store 2',
    phone = '082176466707',
    whatsapp = '6282176466707',
    telegram_id = '6478150893'
WHERE id = '80efaa74-e5dc-46db-84e1-e9df3215f60c';
```

---

## ✅ Test Login

1. Logout dari website
2. Login dengan kredensial user tersebut
3. Menu **"Admin"** sekarang muncul!

---

**Total waktu: < 1 menit** ⚡

