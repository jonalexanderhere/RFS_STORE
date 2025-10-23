-- ═══════════════════════════════════════════════════════════════════
-- RFS_STORE x InspiraProject - PRODUCTION DATABASE
-- Complete Setup with Admin Users & Auto-Invoice System
-- ═══════════════════════════════════════════════════════════════════

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ═══════════════════════════════════════════════════════════════════
-- DROP EXISTING (Idempotent)
-- ═══════════════════════════════════════════════════════════════════

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS on_order_completed ON public.orders;
DROP TRIGGER IF EXISTS set_updated_at_orders ON public.orders;
DROP TRIGGER IF EXISTS set_updated_at_invoices ON public.invoices;
DROP TRIGGER IF EXISTS set_updated_at_profiles ON public.profiles;

DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.handle_updated_at() CASCADE;
DROP FUNCTION IF EXISTS public.handle_order_completed() CASCADE;

DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Authenticated users can create profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own orders" ON public.orders;
DROP POLICY IF EXISTS "Users can create orders" ON public.orders;
DROP POLICY IF EXISTS "Admins can view all orders" ON public.orders;
DROP POLICY IF EXISTS "Admins can update orders" ON public.orders;
DROP POLICY IF EXISTS "Users can view own invoices" ON public.invoices;
DROP POLICY IF EXISTS "Admins can manage invoices" ON public.invoices;
DROP POLICY IF EXISTS "Users can view own payments" ON public.payments;
DROP POLICY IF EXISTS "Users can create payments" ON public.payments;
DROP POLICY IF EXISTS "Admins can manage payments" ON public.payments;
DROP POLICY IF EXISTS "Public can view services" ON public.services;
DROP POLICY IF EXISTS "Admins can manage services" ON public.services;

DROP INDEX IF EXISTS idx_orders_user_id;
DROP INDEX IF EXISTS idx_orders_status;
DROP INDEX IF EXISTS idx_orders_created_at;
DROP INDEX IF EXISTS idx_orders_completed;
DROP INDEX IF EXISTS idx_invoices_order_id;
DROP INDEX IF EXISTS idx_invoices_status;
DROP INDEX IF EXISTS idx_invoices_verified;
DROP INDEX IF EXISTS idx_payments_invoice_id;
DROP INDEX IF EXISTS idx_payments_status;
DROP INDEX IF EXISTS idx_notifications_user_id;
DROP INDEX IF EXISTS idx_notifications_created_at;
DROP INDEX IF EXISTS idx_notifications_is_read;
DROP INDEX IF EXISTS idx_profiles_email;
DROP INDEX IF EXISTS idx_profiles_telegram_id;
DROP INDEX IF EXISTS idx_audit_logs_user_id;
DROP INDEX IF EXISTS idx_audit_logs_created_at;

DROP TABLE IF EXISTS public.audit_logs CASCADE;
DROP TABLE IF EXISTS public.notifications CASCADE;
DROP TABLE IF EXISTS public.payments CASCADE;
DROP TABLE IF EXISTS public.invoices CASCADE;
DROP TABLE IF EXISTS public.orders CASCADE;
DROP TABLE IF EXISTS public.services CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

DO $$ BEGIN
    DROP TYPE IF EXISTS order_status CASCADE;
    DROP TYPE IF EXISTS invoice_status CASCADE;
    DROP TYPE IF EXISTS payment_status CASCADE;
    DROP TYPE IF EXISTS service_category CASCADE;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- ═══════════════════════════════════════════════════════════════════
-- CREATE ENUMS
-- ═══════════════════════════════════════════════════════════════════

CREATE TYPE order_status AS ENUM ('pending', 'processing', 'completed', 'cancelled');
CREATE TYPE invoice_status AS ENUM ('unpaid', 'pending', 'paid', 'cancelled');
CREATE TYPE payment_status AS ENUM ('pending', 'verified', 'rejected');
CREATE TYPE service_category AS ENUM ('academic', 'design', 'rental', 'website', 'other');

-- ═══════════════════════════════════════════════════════════════════
-- CREATE TABLES
-- ═══════════════════════════════════════════════════════════════════

-- PROFILES TABLE
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    telegram_id TEXT,
    whatsapp_number TEXT,
    role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin')),
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- SERVICES TABLE (NO BASE_PRICE - invoice will be created manually)
CREATE TABLE public.services (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    icon TEXT,
    category service_category DEFAULT 'other',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ORDERS TABLE
CREATE TABLE public.orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_number TEXT NOT NULL UNIQUE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    service_id UUID NOT NULL REFERENCES public.services(id),
    description TEXT NOT NULL,
    details JSONB,
    status order_status DEFAULT 'pending',
    result_url TEXT,
    result_message TEXT,
    admin_notes TEXT,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- INVOICES TABLE (auto-created when order completed)
CREATE TABLE public.invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_number TEXT NOT NULL UNIQUE,
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL,
    status invoice_status DEFAULT 'unpaid',
    payment_method TEXT,
    payment_details JSONB,
    due_date TIMESTAMPTZ,
    paid_at TIMESTAMPTZ,
    verified_by UUID REFERENCES public.profiles(id),
    verified_at TIMESTAMPTZ,
    admin_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- PAYMENTS TABLE
CREATE TABLE public.payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL,
    payment_proof_url TEXT,
    status payment_status DEFAULT 'pending',
    verified_by UUID REFERENCES public.profiles(id),
    verified_at TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- NOTIFICATIONS TABLE
CREATE TABLE public.notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT,
    data JSONB,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- AUDIT LOGS TABLE
CREATE TABLE public.audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id),
    action TEXT NOT NULL,
    table_name TEXT,
    record_id UUID,
    old_data JSONB,
    new_data JSONB,
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════════════════════
-- CREATE INDEXES
-- ═══════════════════════════════════════════════════════════════════

CREATE INDEX idx_profiles_email ON public.profiles(email);
CREATE INDEX idx_profiles_telegram_id ON public.profiles(telegram_id) WHERE telegram_id IS NOT NULL;
CREATE INDEX idx_orders_user_id ON public.orders(user_id);
CREATE INDEX idx_orders_status ON public.orders(status);
CREATE INDEX idx_orders_created_at ON public.orders(created_at DESC);
CREATE INDEX idx_orders_completed ON public.orders(completed_at) WHERE completed_at IS NOT NULL;
CREATE INDEX idx_invoices_order_id ON public.invoices(order_id);
CREATE INDEX idx_invoices_status ON public.invoices(status);
CREATE INDEX idx_invoices_verified ON public.invoices(verified_at) WHERE verified_at IS NOT NULL;
CREATE INDEX idx_payments_invoice_id ON public.payments(invoice_id);
CREATE INDEX idx_payments_status ON public.payments(status);
CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_created_at ON public.notifications(created_at DESC);
CREATE INDEX idx_notifications_is_read ON public.notifications(is_read) WHERE is_read = false;
CREATE INDEX idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX idx_audit_logs_created_at ON public.audit_logs(created_at DESC);

-- ═══════════════════════════════════════════════════════════════════
-- CREATE FUNCTIONS
-- ═══════════════════════════════════════════════════════════════════

-- Function: Handle updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function: Auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (
    id, 
    full_name, 
    phone, 
    telegram_id, 
    email,
    role
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'phone', ''),
    COALESCE(NEW.raw_user_meta_data->>'telegram_id', NULL),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'user')
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = COALESCE(EXCLUDED.full_name, profiles.full_name),
    phone = COALESCE(EXCLUDED.phone, profiles.phone),
    telegram_id = COALESCE(EXCLUDED.telegram_id, profiles.telegram_id),
    email = COALESCE(EXCLUDED.email, profiles.email),
    role = COALESCE(EXCLUDED.role, profiles.role);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Auto-create invoice when order completed
CREATE OR REPLACE FUNCTION public.handle_order_completed()
RETURNS TRIGGER AS $$
DECLARE
    invoice_num TEXT;
    invoice_count INT;
BEGIN
    -- Only trigger when status changes to 'completed'
    IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
        -- Generate invoice number
        SELECT COUNT(*) INTO invoice_count
        FROM public.invoices
        WHERE DATE(created_at) = CURRENT_DATE;
        
        invoice_num := 'INV-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD((invoice_count + 1)::TEXT, 3, '0');
        
        -- Create invoice with placeholder amount (admin will update)
        INSERT INTO public.invoices (
            invoice_number,
            order_id,
            amount,
            status,
            due_date,
            admin_notes
        ) VALUES (
            invoice_num,
            NEW.id,
            0, -- Placeholder, admin will set actual amount
            'unpaid',
            NOW() + INTERVAL '7 days',
            'Invoice auto-created. Admin: please set the amount.'
        );
        
        RAISE NOTICE 'Auto-created invoice: %', invoice_num;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ═══════════════════════════════════════════════════════════════════
-- CREATE TRIGGERS
-- ═══════════════════════════════════════════════════════════════════

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE TRIGGER set_updated_at_profiles
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_orders
  BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_invoices
  BEFORE UPDATE ON public.invoices
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER on_order_completed
  AFTER UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.handle_order_completed();

-- ═══════════════════════════════════════════════════════════════════
-- DISABLE RLS
-- ═══════════════════════════════════════════════════════════════════

ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.services DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs DISABLE ROW LEVEL SECURITY;

-- ═══════════════════════════════════════════════════════════════════
-- INSERT SAMPLE DATA
-- ═══════════════════════════════════════════════════════════════════

-- Services (NO BASE_PRICE - pricing will be in invoice)
INSERT INTO public.services (name, description, icon, category, is_active) VALUES
('Jasa Tugas', 'Pengerjaan tugas kuliah dan sekolah dengan kualitas terbaik', '📝', 'academic', true),
('Sewa Laptop', 'Rental laptop untuk kebutuhan kuliah, kerja, dan event', '💻', 'rental', true),
('Joki Makalah', 'Jasa pembuatan makalah, paper, dan karya ilmiah', '📄', 'academic', true),
('Jasa Desain', 'Desain grafis untuk poster, banner, logo, dan presentasi', '🎨', 'design', true),
('Laporan PKL', 'Pembuatan laporan Praktek Kerja Lapangan lengkap dan rapi', '📊', 'academic', true),
('Jasa Pembuatan Website', 'Pembuatan website profesional untuk bisnis dan personal', '🌐', 'website', true)
ON CONFLICT DO NOTHING;

-- ═══════════════════════════════════════════════════════════════════
-- CREATE ADMIN USERS
-- ═══════════════════════════════════════════════════════════════════

-- Admin 1: admin1@rfsstore.com / Admin@123
-- Admin 2: admin2@rfsstore.com / Admin@123
-- Note: These will be created via auth.users, profiles will be auto-created by trigger

DO $$
DECLARE
    admin1_id UUID;
    admin2_id UUID;
BEGIN
    -- Check if admin1 exists
    SELECT id INTO admin1_id FROM auth.users WHERE email = 'admin1@rfsstore.com';
    
    IF admin1_id IS NULL THEN
        -- Create admin1 in auth.users
        INSERT INTO auth.users (
            instance_id,
            id,
            aud,
            role,
            email,
            encrypted_password,
            email_confirmed_at,
            raw_app_meta_data,
            raw_user_meta_data,
            created_at,
            updated_at,
            confirmation_token,
            recovery_token
        ) VALUES (
            '00000000-0000-0000-0000-000000000000',
            gen_random_uuid(),
            'authenticated',
            'authenticated',
            'admin1@rfsstore.com',
            crypt('Admin@123', gen_salt('bf')),
            NOW(),
            '{"provider":"email","providers":["email"]}',
            '{"full_name":"Admin 1","phone":"082181183590","role":"admin"}',
            NOW(),
            NOW(),
            '',
            ''
        ) RETURNING id INTO admin1_id;
        
        RAISE NOTICE 'Created Admin 1: admin1@rfsstore.com';
    ELSE
        -- Update existing admin1 profile to admin role
        UPDATE public.profiles 
        SET role = 'admin', 
            phone = '082181183590',
            full_name = 'Admin 1'
        WHERE id = admin1_id;
        
        RAISE NOTICE 'Updated Admin 1 profile';
    END IF;
    
    -- Check if admin2 exists
    SELECT id INTO admin2_id FROM auth.users WHERE email = 'admin2@rfsstore.com';
    
    IF admin2_id IS NULL THEN
        -- Create admin2 in auth.users
        INSERT INTO auth.users (
            instance_id,
            id,
            aud,
            role,
            email,
            encrypted_password,
            email_confirmed_at,
            raw_app_meta_data,
            raw_user_meta_data,
            created_at,
            updated_at,
            confirmation_token,
            recovery_token
        ) VALUES (
            '00000000-0000-0000-0000-000000000000',
            gen_random_uuid(),
            'authenticated',
            'authenticated',
            'admin2@rfsstore.com',
            crypt('Admin@123', gen_salt('bf')),
            NOW(),
            '{"provider":"email","providers":["email"]}',
            '{"full_name":"Admin 2","phone":"082176466707","role":"admin"}',
            NOW(),
            NOW(),
            '',
            ''
        ) RETURNING id INTO admin2_id;
        
        RAISE NOTICE 'Created Admin 2: admin2@rfsstore.com';
    ELSE
        -- Update existing admin2 profile to admin role
        UPDATE public.profiles 
        SET role = 'admin',
            phone = '082176466707',
            full_name = 'Admin 2'
        WHERE id = admin2_id;
        
        RAISE NOTICE 'Updated Admin 2 profile';
    END IF;
    
END $$;

-- ═══════════════════════════════════════════════════════════════════
-- SUCCESS MESSAGE
-- ═══════════════════════════════════════════════════════════════════

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '════════════════════════════════════════════════════════════════════';
    RAISE NOTICE '          ✅ PRODUCTION DATABASE SETUP COMPLETE! ✅';
    RAISE NOTICE '════════════════════════════════════════════════════════════════════';
    RAISE NOTICE '';
    RAISE NOTICE '📊 TABLES CREATED: 7';
    RAISE NOTICE '   • profiles (with telegram_id)';
    RAISE NOTICE '   • services (NO base_price - manual invoice)';
    RAISE NOTICE '   • orders (with auto-invoice trigger)';
    RAISE NOTICE '   • invoices (auto-created on order completed)';
    RAISE NOTICE '   • payments';
    RAISE NOTICE '   • notifications';
    RAISE NOTICE '   • audit_logs';
    RAISE NOTICE '';
    RAISE NOTICE '🎯 SERVICES: 6';
    RAISE NOTICE '   • Jasa Tugas ✅';
    RAISE NOTICE '   • Sewa Laptop ✅';
    RAISE NOTICE '   • Joki Makalah ✅';
    RAISE NOTICE '   • Jasa Desain ✅';
    RAISE NOTICE '   • Laporan PKL ✅';
    RAISE NOTICE '   • Jasa Pembuatan Website ✅ (NEW)';
    RAISE NOTICE '';
    RAISE NOTICE '👥 ADMIN USERS: 2';
    RAISE NOTICE '   • admin1@rfsstore.com / Admin@123';
    RAISE NOTICE '     Phone: 082181183590';
    RAISE NOTICE '   • admin2@rfsstore.com / Admin@123';
    RAISE NOTICE '     Phone: 082176466707';
    RAISE NOTICE '';
    RAISE NOTICE '🤖 AUTO-FEATURES:';
    RAISE NOTICE '   • Auto-create profile on signup';
    RAISE NOTICE '   • Auto-create invoice when order completed';
    RAISE NOTICE '   • Auto-extract telegram_id from metadata';
    RAISE NOTICE '   • Updated_at triggers';
    RAISE NOTICE '';
    RAISE NOTICE '🔧 WORKFLOW:';
    RAISE NOTICE '   1. Customer creates order';
    RAISE NOTICE '   2. Admin marks order as "completed"';
    RAISE NOTICE '   3. Invoice auto-created (amount = 0)';
    RAISE NOTICE '   4. Admin updates invoice amount';
    RAISE NOTICE '   5. Customer uploads payment proof';
    RAISE NOTICE '   6. Admin verifies payment';
    RAISE NOTICE '   7. Order result sent to customer';
    RAISE NOTICE '';
    RAISE NOTICE '════════════════════════════════════════════════════════════════════';
    RAISE NOTICE '';
END $$;

