-- ============================================
-- PROMOTE SPECIFIC USERS TO ADMIN
-- Auto-generated for user promotion
-- ============================================

-- Promote User 1
UPDATE public.profiles 
SET 
    role = 'admin',
    full_name = COALESCE(full_name, 'Admin User 1'),
    whatsapp = COALESCE(whatsapp, phone),
    updated_at = NOW()
WHERE id = 'd875e73a-3949-4bfb-8f49-e442eb1a879a';

-- Promote User 2
UPDATE public.profiles 
SET 
    role = 'admin',
    full_name = COALESCE(full_name, 'Admin User 2'),
    whatsapp = COALESCE(whatsapp, phone),
    updated_at = NOW()
WHERE id = '80efaa74-e5dc-46db-84e1-e9df3215f60c';

-- Verify the updates
SELECT 
    p.id,
    u.email,
    p.full_name,
    p.role,
    p.phone,
    p.whatsapp,
    p.telegram_id,
    p.created_at
FROM public.profiles p
JOIN auth.users u ON p.id = u.id
WHERE p.id IN (
    'd875e73a-3949-4bfb-8f49-e442eb1a879a',
    '80efaa74-e5dc-46db-84e1-e9df3215f60c'
)
ORDER BY p.created_at;

-- Show all admins
SELECT * FROM get_all_admins();

