-- ============================================
-- PROMOTE 2 USERS JADI ADMIN - COPY PASTE INI
-- ============================================

-- Update kedua user jadi admin
UPDATE public.profiles 
SET role = 'admin'
WHERE id IN (
    '88d321ac-b040-4707-8586-218ced262268',
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
    '88d321ac-b040-4707-8586-218ced262268',
    '80efaa74-e5dc-46db-84e1-e9df3215f60c'
);

