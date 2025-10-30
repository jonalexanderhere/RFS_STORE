-- ============================================
-- FIX INFINITE RECURSION + PROMOTE USERS
-- JALANKAN FILE INI UNTUK FIX SEMUA MASALAH
-- ============================================

-- PART 1: FIX INFINITE RECURSION
-- ============================================

-- Create helper function to check admin (SECURITY DEFINER prevents recursion)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Drop and recreate ALL policies that cause recursion
-- ============================================
-- PROFILES POLICIES
-- ============================================

DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;

CREATE POLICY "Admins can view all profiles" ON public.profiles
    FOR SELECT 
    USING (public.is_admin());

CREATE POLICY "Admins can update all profiles" ON public.profiles
    FOR UPDATE 
    USING (public.is_admin());

-- ============================================
-- SERVICES POLICIES
-- ============================================

DROP POLICY IF EXISTS "Admins can manage services" ON public.services;

CREATE POLICY "Admins can manage services" ON public.services
    FOR ALL USING (public.is_admin());

-- ============================================
-- ORDERS POLICIES
-- ============================================

DROP POLICY IF EXISTS "Admins can view all orders" ON public.orders;
DROP POLICY IF EXISTS "Admins can update all orders" ON public.orders;

CREATE POLICY "Admins can view all orders" ON public.orders
    FOR SELECT USING (public.is_admin());

CREATE POLICY "Admins can update all orders" ON public.orders
    FOR UPDATE USING (public.is_admin());

-- ============================================
-- INVOICES POLICIES
-- ============================================

DROP POLICY IF EXISTS "Admins can view all invoices" ON public.invoices;
DROP POLICY IF EXISTS "Admins can manage invoices" ON public.invoices;

CREATE POLICY "Admins can view all invoices" ON public.invoices
    FOR SELECT USING (public.is_admin());

CREATE POLICY "Admins can manage invoices" ON public.invoices
    FOR ALL USING (public.is_admin());

-- ============================================
-- PAYMENT PROOFS POLICIES
-- ============================================

DROP POLICY IF EXISTS "Admins can view all payment proofs" ON public.payment_proofs;
DROP POLICY IF EXISTS "Admins can verify payment proofs" ON public.payment_proofs;

CREATE POLICY "Admins can view all payment proofs" ON public.payment_proofs
    FOR SELECT USING (public.is_admin());

CREATE POLICY "Admins can verify payment proofs" ON public.payment_proofs
    FOR UPDATE USING (public.is_admin());

-- ============================================
-- AUDIT LOGS POLICIES
-- ============================================

DROP POLICY IF EXISTS "Admins can view audit logs" ON public.audit_logs;

CREATE POLICY "Admins can view audit logs" ON public.audit_logs
    FOR SELECT USING (public.is_admin());

-- ============================================
-- PART 2: PROMOTE 2 USERS JADI ADMIN
-- ============================================

-- Update kedua user jadi admin
UPDATE public.profiles 
SET role = 'admin'
WHERE id IN (
    '88d321ac-b040-4707-8586-218ced262268',
    '80efaa74-e5dc-46db-84e1-e9df3215f60c'
);

-- ============================================
-- PART 3: VERIFY HASIL
-- ============================================

-- Cek apakah infinite recursion sudah fix
SELECT 
    'is_admin() function' AS component,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM pg_proc p
            JOIN pg_namespace n ON p.pronamespace = n.oid
            WHERE n.nspname = 'public' 
            AND p.proname = 'is_admin'
        ) THEN '✅ CREATED'
        ELSE '❌ MISSING'
    END AS status;

-- Cek kedua user sudah jadi admin
SELECT 
    p.id,
    u.email,
    p.full_name,
    p.role,
    CASE 
        WHEN p.role = 'admin' THEN '✅ ADMIN'
        ELSE '❌ NOT ADMIN'
    END AS admin_status,
    p.phone,
    p.whatsapp,
    p.telegram_id
FROM public.profiles p
JOIN auth.users u ON p.id = u.id
WHERE p.id IN (
    '88d321ac-b040-4707-8586-218ced262268',
    '80efaa74-e5dc-46db-84e1-e9df3215f60c'
);

-- Lihat semua admin
SELECT 
    u.email,
    p.full_name,
    p.role,
    p.created_at
FROM public.profiles p
JOIN auth.users u ON p.id = u.id
WHERE p.role = 'admin'
ORDER BY p.created_at;

-- Success message
DO $$
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE '✅ FIX COMPLETE!';
    RAISE NOTICE '========================================';
    RAISE NOTICE '';
    RAISE NOTICE '✅ Infinite recursion FIXED';
    RAISE NOTICE '✅ is_admin() function created';
    RAISE NOTICE '✅ All RLS policies updated';
    RAISE NOTICE '✅ 2 users promoted to admin';
    RAISE NOTICE '';
    RAISE NOTICE '🔄 NEXT STEPS:';
    RAISE NOTICE '1. LOGOUT dari website';
    RAISE NOTICE '2. LOGIN lagi dengan user tersebut';
    RAISE NOTICE '3. Menu Admin akan muncul!';
    RAISE NOTICE '';
    RAISE NOTICE '⚠️  IMPORTANT: User HARUS logout dan login lagi!';
    RAISE NOTICE '   Session lama tidak otomatis update role.';
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
END $$;

