-- ============================================
-- SETUP ADMIN USERS - FIX LOGIN CREDENTIALS
-- Run this in Supabase SQL Editor
-- ============================================

-- NOTE: Untuk membuat admin users dengan password yang benar,
-- ikuti langkah manual di bawah karena Supabase Auth tidak support
-- direct SQL insert dengan password plaintext

-- ============================================
-- CARA SETUP ADMIN (MANUAL STEPS)
-- ============================================

/*
STEP 1: Buat User Admin via Supabase Dashboard

1. Buka Supabase Dashboard → Authentication → Users
2. Klik "Add user" → "Create new user"
3. Isi data Admin 1:
   - Email: admin1@rfsstore.com
   - Password: Admin@123
   - Auto Confirm User: YES (centang)
4. Klik "Create user"
5. COPY User ID yang dibuat

6. Ulangi untuk Admin 2:
   - Email: admin2@rfsstore.com
   - Password: Admin@123
   - Auto Confirm User: YES (centang)
7. COPY User ID yang dibuat
*/

-- ============================================
-- STEP 2: Update Profile Role ke Admin
-- ============================================

-- Ganti 'USER_ID_ADMIN_1' dengan ID yang di-copy tadi
-- Ganti 'USER_ID_ADMIN_2' dengan ID yang di-copy tadi

-- Update Admin 1
UPDATE profiles 
SET 
    role = 'admin',
    full_name = 'Admin RFS Store 1',
    phone = '082181183590',
    whatsapp = '6282181183590',
    telegram_id = '5788748857'
WHERE id = 'USER_ID_ADMIN_1'; -- GANTI dengan ID asli!

-- Update Admin 2
UPDATE profiles 
SET 
    role = 'admin',
    full_name = 'Admin RFS Store 2',
    phone = '082176466707',
    whatsapp = '6282176466707',
    telegram_id = '6478150893'
WHERE id = 'USER_ID_ADMIN_2'; -- GANTI dengan ID asli!

-- ============================================
-- ALTERNATIF: Cari user by email dan update
-- ============================================

-- Jika sudah ada user dengan email admin1@rfsstore.com atau admin2@rfsstore.com
-- tapi belum jadi admin, jalankan query ini:

-- Update user yang sudah ada jadi admin
UPDATE profiles 
SET role = 'admin',
    full_name = 'Admin RFS Store 1',
    whatsapp = '6282181183590',
    telegram_id = '5788748857'
WHERE id IN (
    SELECT id FROM auth.users WHERE email = 'admin1@rfsstore.com'
);

UPDATE profiles 
SET role = 'admin',
    full_name = 'Admin RFS Store 2',
    whatsapp = '6282176466707',
    telegram_id = '6478150893'
WHERE id IN (
    SELECT id FROM auth.users WHERE email = 'admin2@rfsstore.com'
);

-- ============================================
-- VERIFIKASI: Cek Admin Users
-- ============================================

-- Lihat semua admin
SELECT 
    p.id,
    u.email,
    p.full_name,
    p.phone,
    p.whatsapp,
    p.telegram_id,
    p.role,
    u.created_at,
    u.confirmed_at,
    u.email_confirmed_at
FROM profiles p
JOIN auth.users u ON p.id = u.id
WHERE p.role = 'admin'
ORDER BY p.created_at;

-- ============================================
-- TROUBLESHOOTING: Reset Password Admin
-- ============================================

/*
Jika login masih gagal, reset password via Dashboard:

1. Supabase Dashboard → Authentication → Users
2. Cari user admin1@rfsstore.com
3. Klik "..." (three dots) → "Send password recovery"
4. Atau klik "Reset password" → Set password manual: Admin@123
5. Ulangi untuk admin2@rfsstore.com
*/

-- ============================================
-- FUNGSI: Get Admin Info (Helper)
-- ============================================

CREATE OR REPLACE FUNCTION get_admin_info()
RETURNS TABLE (
    admin_email TEXT,
    admin_name TEXT,
    admin_role user_role,
    whatsapp_number TEXT,
    telegram_id TEXT,
    user_confirmed BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        u.email::TEXT,
        p.full_name::TEXT,
        p.role,
        p.whatsapp::TEXT,
        p.telegram_id::TEXT,
        (u.email_confirmed_at IS NOT NULL) AS user_confirmed
    FROM profiles p
    JOIN auth.users u ON p.id = u.id
    WHERE p.role = 'admin'
    ORDER BY p.created_at;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Cara pakai:
-- SELECT * FROM get_admin_info();

-- ============================================
-- QUICK FIX: Promote Existing User ke Admin
-- ============================================

-- Jika Anda sudah punya user dan ingin jadi admin:
-- Ganti 'user@example.com' dengan email Anda

-- UPDATE profiles 
-- SET role = 'admin'
-- WHERE id IN (
--     SELECT id FROM auth.users WHERE email = 'user@example.com'
-- );

-- ============================================
-- SUCCESS MESSAGE
-- ============================================

DO $$
BEGIN
    RAISE NOTICE '✅ Admin setup script ready!';
    RAISE NOTICE '📝 Follow manual steps above to create admin users';
    RAISE NOTICE '🔐 Default credentials:';
    RAISE NOTICE '   Admin 1: admin1@rfsstore.com / Admin@123';
    RAISE NOTICE '   Admin 2: admin2@rfsstore.com / Admin@123';
    RAISE NOTICE '';
    RAISE NOTICE '💡 Run: SELECT * FROM get_admin_info(); to verify';
END $$;

