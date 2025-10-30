-- ============================================
-- COMPLETE FIX - READY TO RUN
-- Copy & Paste semua SQL ini ke Supabase SQL Editor
-- ============================================

-- PART 1: Create is_admin() function to prevent infinite recursion
-- ============================================
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- PART 2: Drop all existing admin policies (that cause recursion)
-- ============================================
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can manage services" ON public.services;
DROP POLICY IF EXISTS "Admins can view all orders" ON public.orders;
DROP POLICY IF EXISTS "Admins can update all orders" ON public.orders;
DROP POLICY IF EXISTS "Admins can view all invoices" ON public.invoices;
DROP POLICY IF EXISTS "Admins can manage invoices" ON public.invoices;
DROP POLICY IF EXISTS "Admins can view all payment proofs" ON public.payment_proofs;
DROP POLICY IF EXISTS "Admins can verify payment proofs" ON public.payment_proofs;
DROP POLICY IF EXISTS "Admins can view audit logs" ON public.audit_logs;

-- PART 3: Create new policies using is_admin() function
-- ============================================

-- Profiles policies
CREATE POLICY "Admins can view all profiles" ON public.profiles
    FOR SELECT USING (public.is_admin());

CREATE POLICY "Admins can update all profiles" ON public.profiles
    FOR UPDATE USING (public.is_admin());

-- Services policies
CREATE POLICY "Admins can manage services" ON public.services
    FOR ALL USING (public.is_admin());

-- Orders policies
CREATE POLICY "Admins can view all orders" ON public.orders
    FOR SELECT USING (public.is_admin());

CREATE POLICY "Admins can update all orders" ON public.orders
    FOR UPDATE USING (public.is_admin());

-- Invoices policies
CREATE POLICY "Admins can view all invoices" ON public.invoices
    FOR SELECT USING (public.is_admin());

CREATE POLICY "Admins can manage invoices" ON public.invoices
    FOR ALL USING (public.is_admin());

-- Payment proofs policies
CREATE POLICY "Admins can view all payment proofs" ON public.payment_proofs
    FOR SELECT USING (public.is_admin());

CREATE POLICY "Admins can verify payment proofs" ON public.payment_proofs
    FOR UPDATE USING (public.is_admin());

-- Audit logs policies
CREATE POLICY "Admins can view audit logs" ON public.audit_logs
    FOR SELECT USING (public.is_admin());

-- PART 4: Promote 2 users to admin
-- ============================================
UPDATE public.profiles 
SET role = 'admin'
WHERE id IN (
    '88d321ac-b040-4707-8586-218ced262268',
    '80efaa74-e5dc-46db-84e1-e9df3215f60c'
);

-- PART 5: Verification queries
-- ============================================

-- Verify is_admin() function created
SELECT 
    'is_admin() function' AS check_item,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM pg_proc p
            JOIN pg_namespace n ON p.pronamespace = n.oid
            WHERE n.nspname = 'public' AND p.proname = 'is_admin'
        ) 
        THEN 'OK - Function exists' 
        ELSE 'ERROR - Function not found' 
    END AS status;

-- Verify users promoted to admin
SELECT 
    p.id,
    u.email,
    p.full_name,
    p.role,
    CASE 
        WHEN p.role = 'admin' THEN 'OK - Is Admin'
        ELSE 'ERROR - Not Admin'
    END AS admin_status
FROM public.profiles p
JOIN auth.users u ON p.id = u.id
WHERE p.id IN (
    '88d321ac-b040-4707-8586-218ced262268',
    '80efaa74-e5dc-46db-84e1-e9df3215f60c'
);

-- Show all admins in system
SELECT 
    u.email,
    p.full_name,
    p.role,
    p.phone,
    p.whatsapp,
    p.created_at
FROM public.profiles p
JOIN auth.users u ON p.id = u.id
WHERE p.role = 'admin'
ORDER BY p.created_at;

-- Success message
DO $$
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE 'FIX COMPLETE!';
    RAISE NOTICE '========================================';
    RAISE NOTICE '';
    RAISE NOTICE '[OK] is_admin() function created';
    RAISE NOTICE '[OK] All RLS policies updated';
    RAISE NOTICE '[OK] Infinite recursion FIXED';
    RAISE NOTICE '[OK] 2 users promoted to admin';
    RAISE NOTICE '';
    RAISE NOTICE 'NEXT STEPS:';
    RAISE NOTICE '1. Refresh your website (Ctrl+F5)';
    RAISE NOTICE '2. LOGOUT from website';
    RAISE NOTICE '3. LOGIN again';
    RAISE NOTICE '4. Menu Admin will appear!';
    RAISE NOTICE '';
    RAISE NOTICE 'User IDs promoted:';
    RAISE NOTICE '- 88d321ac-b040-4707-8586-218ced262268';
    RAISE NOTICE '- 80efaa74-e5dc-46db-84e1-e9df3215f60c';
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
END $$;

