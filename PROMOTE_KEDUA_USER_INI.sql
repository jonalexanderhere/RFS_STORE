-- ============================================
-- PROMOTE 2 USERS JADI ADMIN - COPY PASTE INI
-- ============================================

-- Update kedua user jadi admin
UPDATE public.profiles 
SET role = 'admin'
WHERE id IN (
    'd875e73a-3949-4bfb-8f49-e442eb1a879a',
    '80efaa74-e5dc-46db-84e1-e9df3215f60c'
);

-- Verify hasilnya
SELECT 
    p.id,
    u.email,
    p.full_name,
    p.role,
    p.phone,
    p.whatsapp,
    p.telegram_id
FROM public.profiles p
JOIN auth.users u ON p.id = u.id
WHERE p.id IN (
    'd875e73a-3949-4bfb-8f49-e442eb1a879a',
    '80efaa74-e5dc-46db-84e1-e9df3215f60c'
);

