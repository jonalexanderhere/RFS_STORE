-- RFS_STORE x InspiraProject Database Schema
-- Execute this in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enum types (with error handling)
DO $$ BEGIN
    CREATE TYPE order_status AS ENUM ('pending', 'processing', 'completed', 'cancelled');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE invoice_status AS ENUM ('unpaid', 'pending', 'paid', 'cancelled');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE payment_method AS ENUM ('transfer', 'qris', 'ewallet');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('user', 'staff', 'admin');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create function to handle order status changes
CREATE OR REPLACE FUNCTION public.handle_order_status_change()
RETURNS TRIGGER AS $$
BEGIN
    -- Set completed_at when status changes to 'completed'
    IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
        NEW.completed_at = NOW();
    END IF;
    
    -- Set cancelled_at when status changes to 'cancelled'
    IF NEW.status = 'cancelled' AND OLD.status != 'cancelled' THEN
        NEW.cancelled_at = NOW();
    END IF;
    
    -- Clear completed_at if status changes away from 'completed'
    IF NEW.status != 'completed' AND OLD.status = 'completed' THEN
        NEW.completed_at = NULL;
    END IF;
    
    -- Clear cancelled_at if status changes away from 'cancelled'
    IF NEW.status != 'cancelled' AND OLD.status = 'cancelled' THEN
        NEW.cancelled_at = NULL;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create function to auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name, phone, role)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'),
        COALESCE(NEW.raw_user_meta_data->>'phone', ''),
        'user'
    );
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users(id) PRIMARY KEY,
    full_name TEXT NOT NULL,
    phone TEXT,
    telegram_id TEXT,
    whatsapp TEXT,
    role user_role DEFAULT 'user',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Services table
CREATE TABLE IF NOT EXISTS public.services (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    icon TEXT,
    category TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Orders table
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    order_number TEXT UNIQUE NOT NULL,
    user_id UUID REFERENCES public.profiles(id) NOT NULL,
    service_id UUID REFERENCES public.services(id) NOT NULL,
    description TEXT NOT NULL,
    details JSONB,
    status order_status DEFAULT 'pending',
    admin_notes TEXT,
    completed_at TIMESTAMP WITH TIME ZONE,
    cancelled_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Invoices table
CREATE TABLE IF NOT EXISTS public.invoices (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    invoice_number TEXT UNIQUE NOT NULL,
    order_id UUID REFERENCES public.orders(id) NOT NULL,
    user_id UUID REFERENCES public.profiles(id) NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    status invoice_status DEFAULT 'unpaid',
    due_date TIMESTAMP WITH TIME ZONE,
    paid_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Payment Proofs table
CREATE TABLE IF NOT EXISTS public.payment_proofs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    invoice_id UUID REFERENCES public.invoices(id) NOT NULL,
    user_id UUID REFERENCES public.profiles(id) NOT NULL,
    payment_method payment_method NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    proof_url TEXT NOT NULL,
    notes TEXT,
    verified BOOLEAN DEFAULT false,
    verified_by UUID REFERENCES public.profiles(id),
    verified_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT,
    is_read BOOLEAN DEFAULT false,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Audit Logs table
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id),
    action TEXT NOT NULL,
    table_name TEXT,
    record_id UUID,
    old_data JSONB,
    new_data JSONB,
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create trigger for auto-creating profile on user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- Create triggers for updated_at
DROP TRIGGER IF EXISTS set_updated_at_profiles ON public.profiles;
CREATE TRIGGER set_updated_at_profiles
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_updated_at_services ON public.services;
CREATE TRIGGER set_updated_at_services
    BEFORE UPDATE ON public.services
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_updated_at_orders ON public.orders;
CREATE TRIGGER set_updated_at_orders
    BEFORE UPDATE ON public.orders
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS handle_order_status_on_update ON public.orders;
CREATE TRIGGER handle_order_status_on_update
    BEFORE UPDATE ON public.orders
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_order_status_change();

DROP TRIGGER IF EXISTS set_updated_at_invoices ON public.invoices;
CREATE TRIGGER set_updated_at_invoices
    BEFORE UPDATE ON public.invoices
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_proofs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Allow new user registration" ON public.profiles;
DROP POLICY IF EXISTS "Authenticated users can create profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Everyone can view active services" ON public.services;
DROP POLICY IF EXISTS "Public can view active services" ON public.services;
DROP POLICY IF EXISTS "Admins can manage services" ON public.services;
DROP POLICY IF EXISTS "Users can view their own orders" ON public.orders;
DROP POLICY IF EXISTS "Users can create their own orders" ON public.orders;
DROP POLICY IF EXISTS "Admins can view all orders" ON public.orders;
DROP POLICY IF EXISTS "Admins can update all orders" ON public.orders;
DROP POLICY IF EXISTS "Users can view their own invoices" ON public.invoices;
DROP POLICY IF EXISTS "Admins can view all invoices" ON public.invoices;
DROP POLICY IF EXISTS "Admins can manage invoices" ON public.invoices;
DROP POLICY IF EXISTS "Users can view their own payment proofs" ON public.payment_proofs;
DROP POLICY IF EXISTS "Users can create their own payment proofs" ON public.payment_proofs;
DROP POLICY IF EXISTS "Admins can view all payment proofs" ON public.payment_proofs;
DROP POLICY IF EXISTS "Admins can verify payment proofs" ON public.payment_proofs;
DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "System can create notifications" ON public.notifications;
DROP POLICY IF EXISTS "Admins can view audit logs" ON public.audit_logs;
DROP POLICY IF EXISTS "System can create audit logs" ON public.audit_logs;

-- ============================================
-- HELPER FUNCTION TO CHECK ADMIN (Prevent Recursion)
-- ============================================

-- Function to check if current user is admin (security definer to bypass RLS)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- RLS Policies for profiles (PERMISSIVE for registration)

-- Allow anyone authenticated to view their own profile
CREATE POLICY "Users can view their own profile" ON public.profiles
    FOR SELECT 
    USING (auth.uid() = id);

-- Allow anyone authenticated to update their own profile
CREATE POLICY "Users can update their own profile" ON public.profiles
    FOR UPDATE 
    USING (auth.uid() = id);

-- PERMISSIVE INSERT: Allow any authenticated user to create their profile
CREATE POLICY "Authenticated users can create profile" ON public.profiles
    FOR INSERT 
    WITH CHECK (auth.uid() IS NOT NULL);

-- Allow admins to view all profiles (using security definer function)
CREATE POLICY "Admins can view all profiles" ON public.profiles
    FOR SELECT 
    USING (public.is_admin());

-- Allow admins to update all profiles (using security definer function)
CREATE POLICY "Admins can update all profiles" ON public.profiles
    FOR UPDATE 
    USING (public.is_admin());

-- RLS Policies for services (PUBLIC ACCESS - no login required)
CREATE POLICY "Public can view active services" ON public.services
    FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage services" ON public.services
    FOR ALL USING (public.is_admin());

-- RLS Policies for orders
CREATE POLICY "Users can view their own orders" ON public.orders
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own orders" ON public.orders
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all orders" ON public.orders
    FOR SELECT USING (public.is_admin());

CREATE POLICY "Admins can update all orders" ON public.orders
    FOR UPDATE USING (public.is_admin());

-- RLS Policies for invoices
CREATE POLICY "Users can view their own invoices" ON public.invoices
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all invoices" ON public.invoices
    FOR SELECT USING (public.is_admin());

CREATE POLICY "Admins can manage invoices" ON public.invoices
    FOR ALL USING (public.is_admin());

-- RLS Policies for payment_proofs
CREATE POLICY "Users can view their own payment proofs" ON public.payment_proofs
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own payment proofs" ON public.payment_proofs
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all payment proofs" ON public.payment_proofs
    FOR SELECT USING (public.is_admin());

CREATE POLICY "Admins can verify payment proofs" ON public.payment_proofs
    FOR UPDATE USING (public.is_admin());

-- RLS Policies for notifications
CREATE POLICY "Users can view their own notifications" ON public.notifications
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications" ON public.notifications
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "System can create notifications" ON public.notifications
    FOR INSERT WITH CHECK (true);

-- RLS Policies for audit_logs
CREATE POLICY "Admins can view audit logs" ON public.audit_logs
    FOR SELECT USING (public.is_admin());

CREATE POLICY "System can create audit logs" ON public.audit_logs
    FOR INSERT WITH CHECK (true);

-- Add missing columns if they don't exist (for existing tables)
DO $$ 
BEGIN
    -- Add is_read to notifications if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'notifications' 
        AND column_name = 'is_read'
    ) THEN
        ALTER TABLE public.notifications ADD COLUMN is_read BOOLEAN DEFAULT false;
    END IF;
    
    -- Add completed_at to orders if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'orders' 
        AND column_name = 'completed_at'
    ) THEN
        ALTER TABLE public.orders ADD COLUMN completed_at TIMESTAMP WITH TIME ZONE;
        RAISE NOTICE 'Added completed_at column to orders table';
    END IF;
    
    -- Add cancelled_at to orders if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'orders' 
        AND column_name = 'cancelled_at'
    ) THEN
        ALTER TABLE public.orders ADD COLUMN cancelled_at TIMESTAMP WITH TIME ZONE;
        RAISE NOTICE 'Added cancelled_at column to orders table';
    END IF;
    
    -- Update existing completed orders with completed_at timestamp
    UPDATE public.orders 
    SET completed_at = updated_at 
    WHERE status = 'completed' AND completed_at IS NULL;
    
    -- Update existing cancelled orders with cancelled_at timestamp
    UPDATE public.orders 
    SET cancelled_at = updated_at 
    WHERE status = 'cancelled' AND cancelled_at IS NULL;
END $$;

-- Drop existing indexes if they exist
DROP INDEX IF EXISTS idx_profiles_role;
DROP INDEX IF EXISTS idx_services_active;
DROP INDEX IF EXISTS idx_services_category;
DROP INDEX IF EXISTS idx_orders_user_id;
DROP INDEX IF EXISTS idx_orders_service_id;
DROP INDEX IF EXISTS idx_orders_status;
DROP INDEX IF EXISTS idx_orders_created_at;
DROP INDEX IF EXISTS idx_orders_completed_at;
DROP INDEX IF EXISTS idx_orders_cancelled_at;
DROP INDEX IF EXISTS idx_invoices_user_id;
DROP INDEX IF EXISTS idx_invoices_order_id;
DROP INDEX IF EXISTS idx_invoices_status;
DROP INDEX IF EXISTS idx_payment_proofs_invoice_id;
DROP INDEX IF EXISTS idx_payment_proofs_user_id;
DROP INDEX IF EXISTS idx_payment_proofs_verified;
DROP INDEX IF EXISTS idx_notifications_user_id;
DROP INDEX IF EXISTS idx_notifications_is_read;
DROP INDEX IF EXISTS idx_audit_logs_user_id;
DROP INDEX IF EXISTS idx_audit_logs_table_name;

-- Create indexes for better performance
CREATE INDEX idx_profiles_role ON public.profiles(role);
CREATE INDEX idx_services_active ON public.services(is_active);
CREATE INDEX idx_services_category ON public.services(category);
CREATE INDEX idx_orders_user_id ON public.orders(user_id);
CREATE INDEX idx_orders_service_id ON public.orders(service_id);
CREATE INDEX idx_orders_status ON public.orders(status);
CREATE INDEX idx_orders_created_at ON public.orders(created_at DESC);
CREATE INDEX idx_orders_completed_at ON public.orders(completed_at DESC);
CREATE INDEX idx_orders_cancelled_at ON public.orders(cancelled_at DESC);
CREATE INDEX idx_invoices_user_id ON public.invoices(user_id);
CREATE INDEX idx_invoices_order_id ON public.invoices(order_id);
CREATE INDEX idx_invoices_status ON public.invoices(status);
CREATE INDEX idx_payment_proofs_invoice_id ON public.payment_proofs(invoice_id);
CREATE INDEX idx_payment_proofs_user_id ON public.payment_proofs(user_id);
CREATE INDEX idx_payment_proofs_verified ON public.payment_proofs(verified);
CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_is_read ON public.notifications(is_read);
CREATE INDEX idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX idx_audit_logs_table_name ON public.audit_logs(table_name);

-- Insert sample services (will only insert if not exists)
INSERT INTO public.services (name, description, icon, category, is_active)
VALUES 
    ('Jasa Tugas', 'Pengerjaan tugas kuliah dan sekolah dengan kualitas terbaik. Dikerjakan oleh tim profesional dengan hasil memuaskan.', '📝', 'Akademik', true),
    ('Sewa Laptop', 'Rental laptop untuk kebutuhan kuliah, kerja, dan event. Spesifikasi tinggi dengan harga terjangkau.', '💻', 'Rental', true),
    ('Joki Makalah', 'Jasa pembuatan makalah, paper, dan karya ilmiah. Dijamin original dan berkualitas tinggi.', '📄', 'Akademik', true),
    ('Jasa Desain', 'Desain grafis untuk poster, banner, logo, dan presentasi. Hasil profesional dan kreatif.', '🎨', 'Desain', true),
    ('Laporan PKL', 'Pembuatan laporan Praktek Kerja Lapangan lengkap dan rapi. Sesuai format institusi Anda.', '📊', 'Akademik', true)
ON CONFLICT DO NOTHING;

-- ============================================
-- HELPER FUNCTIONS FOR ADMIN MANAGEMENT
-- ============================================

-- Function to promote user to admin by email
CREATE OR REPLACE FUNCTION public.promote_user_to_admin(user_email TEXT)
RETURNS TEXT AS $$
DECLARE
    v_user_id UUID;
    v_updated_count INTEGER;
BEGIN
    -- Get user ID from email
    SELECT id INTO v_user_id
    FROM auth.users
    WHERE email = user_email;
    
    IF v_user_id IS NULL THEN
        RETURN '❌ User not found with email: ' || user_email;
    END IF;
    
    -- Update profile to admin
    UPDATE public.profiles
    SET role = 'admin'
    WHERE id = v_user_id;
    
    GET DIAGNOSTICS v_updated_count = ROW_COUNT;
    
    IF v_updated_count > 0 THEN
        RETURN '✅ User ' || user_email || ' promoted to admin successfully!';
    ELSE
        RETURN '⚠️  Profile not found for user: ' || user_email;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to demote admin to user
CREATE OR REPLACE FUNCTION public.demote_admin_to_user(user_email TEXT)
RETURNS TEXT AS $$
DECLARE
    v_user_id UUID;
BEGIN
    SELECT id INTO v_user_id
    FROM auth.users
    WHERE email = user_email;
    
    IF v_user_id IS NULL THEN
        RETURN '❌ User not found';
    END IF;
    
    UPDATE public.profiles
    SET role = 'user'
    WHERE id = v_user_id;
    
    RETURN '✅ User demoted to regular user';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get all admins
CREATE OR REPLACE FUNCTION public.get_all_admins()
RETURNS TABLE (
    user_id UUID,
    email TEXT,
    full_name TEXT,
    phone TEXT,
    whatsapp TEXT,
    telegram_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        u.email,
        p.full_name,
        p.phone,
        p.whatsapp,
        p.telegram_id,
        p.created_at
    FROM public.profiles p
    JOIN auth.users u ON p.id = u.id
    WHERE p.role = 'admin'
    ORDER BY p.created_at;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update admin contact info
CREATE OR REPLACE FUNCTION public.update_admin_contact(
    p_email TEXT,
    p_full_name TEXT DEFAULT NULL,
    p_phone TEXT DEFAULT NULL,
    p_whatsapp TEXT DEFAULT NULL,
    p_telegram_id TEXT DEFAULT NULL
)
RETURNS TEXT AS $$
DECLARE
    v_user_id UUID;
BEGIN
    SELECT id INTO v_user_id
    FROM auth.users
    WHERE email = p_email;
    
    IF v_user_id IS NULL THEN
        RETURN '❌ User not found';
    END IF;
    
    UPDATE public.profiles
    SET 
        full_name = COALESCE(p_full_name, full_name),
        phone = COALESCE(p_phone, phone),
        whatsapp = COALESCE(p_whatsapp, whatsapp),
        telegram_id = COALESCE(p_telegram_id, telegram_id)
    WHERE id = v_user_id;
    
    RETURN '✅ Admin contact updated successfully';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- AUTO-CREATE ADMIN FUNCTION
-- ============================================

-- Function to automatically create admin user
CREATE OR REPLACE FUNCTION public.auto_create_admin_user(
    p_email TEXT,
    p_password TEXT,
    p_full_name TEXT DEFAULT 'Admin User',
    p_phone TEXT DEFAULT '',
    p_whatsapp TEXT DEFAULT '',
    p_telegram_id TEXT DEFAULT ''
)
RETURNS TEXT AS $$
DECLARE
    v_user_id UUID;
    v_encrypted_password TEXT;
BEGIN
    -- Check if user already exists
    SELECT id INTO v_user_id
    FROM auth.users
    WHERE email = p_email;
    
    IF v_user_id IS NOT NULL THEN
        -- User exists, just promote to admin
        UPDATE public.profiles
        SET role = 'admin',
            full_name = p_full_name,
            phone = p_phone,
            whatsapp = p_whatsapp,
            telegram_id = p_telegram_id
        WHERE id = v_user_id;
        
        RETURN '✅ User already exists. Promoted to admin: ' || p_email;
    END IF;
    
    -- NOTE: Direct user creation with password requires service_role
    -- This function expects to be called after manual user creation
    -- Or use Supabase Dashboard/API to create user first
    
    RETURN '⚠️  User not found. Please create user manually first with email: ' || p_email;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to setup default admin users
CREATE OR REPLACE FUNCTION public.setup_default_admins()
RETURNS TEXT AS $$
DECLARE
    v_result TEXT := '';
    v_admin1_id UUID;
    v_admin2_id UUID;
BEGIN
    -- Check and promote admin1@rfsstore.com
    SELECT id INTO v_admin1_id
    FROM auth.users
    WHERE email = 'admin1@rfsstore.com';
    
    IF v_admin1_id IS NOT NULL THEN
        UPDATE public.profiles
        SET role = 'admin',
            full_name = 'Admin RFS Store 1',
            phone = '082181183590',
            whatsapp = '6282181183590',
            telegram_id = '5788748857'
        WHERE id = v_admin1_id;
        v_result := v_result || '✅ Admin 1 setup complete' || E'\n';
    ELSE
        v_result := v_result || '⚠️  Admin 1 (admin1@rfsstore.com) not found' || E'\n';
    END IF;
    
    -- Check and promote admin2@rfsstore.com
    SELECT id INTO v_admin2_id
    FROM auth.users
    WHERE email = 'admin2@rfsstore.com';
    
    IF v_admin2_id IS NOT NULL THEN
        UPDATE public.profiles
        SET role = 'admin',
            full_name = 'Admin RFS Store 2',
            phone = '082176466707',
            whatsapp = '6282176466707',
            telegram_id = '6478150893'
        WHERE id = v_admin2_id;
        v_result := v_result || '✅ Admin 2 setup complete' || E'\n';
    ELSE
        v_result := v_result || '⚠️  Admin 2 (admin2@rfsstore.com) not found' || E'\n';
    END IF;
    
    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- AUTO-PROMOTE FIRST USER AS ADMIN
-- ============================================

-- Function to auto-promote first registered user as admin
CREATE OR REPLACE FUNCTION public.auto_promote_first_user()
RETURNS TRIGGER AS $$
DECLARE
    v_user_count INTEGER;
BEGIN
    -- Count existing users
    SELECT COUNT(*) INTO v_user_count
    FROM auth.users;
    
    -- If this is the first user (count = 1), make them admin
    IF v_user_count = 1 THEN
        -- Update the profile that was just created
        UPDATE public.profiles
        SET role = 'admin',
            full_name = COALESCE(NEW.raw_user_meta_data->>'full_name', 'First Admin')
        WHERE id = NEW.id;
        
        RAISE NOTICE 'First user auto-promoted to admin: %', NEW.email;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to auto-promote first user
DROP TRIGGER IF EXISTS auto_promote_first_user_trigger ON auth.users;
CREATE TRIGGER auto_promote_first_user_trigger
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.auto_promote_first_user();

-- ============================================
-- INSTANT ADMIN SETUP (if users exist)
-- ============================================

-- Try to setup default admins if they already exist
DO $$
DECLARE
    v_setup_result TEXT;
BEGIN
    SELECT setup_default_admins() INTO v_setup_result;
    RAISE NOTICE '%', v_setup_result;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Admin setup will run after users are created';
END $$;

-- Success message
DO $$
DECLARE
    v_admin_count INTEGER;
BEGIN
    RAISE NOTICE '✅ Database schema created successfully!';
    RAISE NOTICE '📊 Tables: profiles, services, orders, invoices, payment_proofs, notifications, audit_logs';
    RAISE NOTICE '🔒 RLS policies enabled';
    RAISE NOTICE '🎯 Sample services inserted';
    RAISE NOTICE '⏱️  Auto-timestamps: completed_at, cancelled_at added to orders';
    RAISE NOTICE '🚀 Performance indexes created';
    RAISE NOTICE '🔄 Migration scripts included for existing databases';
    RAISE NOTICE '';
    
    -- Check if there are any admins
    SELECT COUNT(*) INTO v_admin_count
    FROM public.profiles
    WHERE role = 'admin';
    
    IF v_admin_count > 0 THEN
        RAISE NOTICE '========================================';
        RAISE NOTICE '👤 ADMIN USERS FOUND: %', v_admin_count;
        RAISE NOTICE '========================================';
        RAISE NOTICE 'Run this to see admins:';
        RAISE NOTICE 'SELECT * FROM get_all_admins();';
    ELSE
        RAISE NOTICE '========================================';
        RAISE NOTICE '🤖 AUTO-ADMIN FEATURES ENABLED';
        RAISE NOTICE '========================================';
        RAISE NOTICE '';
        RAISE NOTICE '✨ OPTION 1: Register First User (AUTO-ADMIN)';
        RAISE NOTICE '   → First user who registers will be AUTO-PROMOTED to admin';
        RAISE NOTICE '   → Just register normally through the app';
        RAISE NOTICE '';
        RAISE NOTICE '✨ OPTION 2: Create Admin in Dashboard';
        RAISE NOTICE '   → Supabase Dashboard → Authentication → Users → Add User';
        RAISE NOTICE '   → Email: admin1@rfsstore.com';
        RAISE NOTICE '   → Password: Admin@123';
        RAISE NOTICE '   → ✅ Auto Confirm User: YES';
        RAISE NOTICE '   → Then run: SELECT setup_default_admins();';
        RAISE NOTICE '';
        RAISE NOTICE '✨ OPTION 3: Promote Existing User';
        RAISE NOTICE '   → SELECT promote_user_to_admin(''user@example.com'');';
        RAISE NOTICE '';
        RAISE NOTICE '========================================';
        RAISE NOTICE '🔐 Recommended Admin Credentials:';
        RAISE NOTICE '   Email: admin1@rfsstore.com';
        RAISE NOTICE '   Password: Admin@123';
        RAISE NOTICE '========================================';
    END IF;
END $$;
