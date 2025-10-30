-- ============================================
-- FIX: Infinite Recursion in RLS Policies
-- Error: "infinite recursion detected in policy for relation profiles"
-- ============================================

-- STEP 1: Create helper function to check admin (SECURITY DEFINER)
-- This bypasses RLS to prevent recursion
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- STEP 2: Drop and recreate ALL policies that check for admin role

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
-- VERIFICATION
-- ============================================

-- Test the is_admin function
SELECT public.is_admin() AS "Am I Admin?";

-- Show all policies
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- Success message
DO $$
BEGIN
    RAISE NOTICE '✅ Infinite recursion fixed!';
    RAISE NOTICE '✅ All RLS policies updated to use is_admin() function';
    RAISE NOTICE '✅ SECURITY DEFINER function prevents recursion';
    RAISE NOTICE '';
    RAISE NOTICE 'Test your app now - error should be gone!';
END $$;

