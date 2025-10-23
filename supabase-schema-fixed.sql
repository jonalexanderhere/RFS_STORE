-- RFS_STORE x InspiraProject Database Schema
-- Execute this in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enum types
CREATE TYPE order_status AS ENUM ('pending', 'processing', 'completed', 'cancelled');
CREATE TYPE invoice_status AS ENUM ('unpaid', 'pending', 'paid', 'cancelled');
CREATE TYPE payment_method AS ENUM ('transfer', 'qris', 'ewallet');
CREATE TYPE user_role AS ENUM ('user', 'staff', 'admin');

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
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Invoices table
CREATE TABLE IF NOT EXISTS public.invoices (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    invoice_number TEXT UNIQUE NOT NULL,
    order_id UUID REFERENCES public.orders(id) NOT NULL,
    user_id UUID REFERENCES public.profiles(id) NOT NULL,
    total_amount DECIMAL(12,2) NOT NULL,
    status invoice_status DEFAULT 'unpaid',
    due_date DATE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Payment proofs table
CREATE TABLE IF NOT EXISTS public.payment_proofs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    invoice_id UUID REFERENCES public.invoices(id) NOT NULL,
    user_id UUID REFERENCES public.profiles(id) NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    payment_method payment_method NOT NULL,
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
    read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Audit logs table
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id),
    action TEXT NOT NULL,
    table_name TEXT,
    record_id UUID,
    old_data JSONB,
    new_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_invoices_user_id ON public.invoices(user_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON public.invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_order_id ON public.invoices(order_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON public.notifications(read);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_proofs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any (to avoid conflicts)
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile on signup" ON public.profiles;

-- RLS Policies for profiles
CREATE POLICY "Public profiles are viewable by everyone"
    ON public.profiles FOR SELECT
    USING (true);

CREATE POLICY "Users can insert own profile on signup"
    ON public.profiles FOR INSERT
    WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id);

-- RLS Policies for services
CREATE POLICY "Services are viewable by everyone"
    ON public.services FOR SELECT
    USING (is_active = true);

CREATE POLICY "Only admins can manage services"
    ON public.services FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- RLS Policies for orders
CREATE POLICY "Users can view own orders"
    ON public.orders FOR SELECT
    USING (auth.uid() = user_id OR 
           EXISTS (
               SELECT 1 FROM public.profiles
               WHERE id = auth.uid() AND role IN ('admin', 'staff')
           ));

CREATE POLICY "Users can create own orders"
    ON public.orders FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can update orders"
    ON public.orders FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role IN ('admin', 'staff')
        )
    );

-- RLS Policies for invoices
CREATE POLICY "Users can view own invoices"
    ON public.invoices FOR SELECT
    USING (auth.uid() = user_id OR 
           EXISTS (
               SELECT 1 FROM public.profiles
               WHERE id = auth.uid() AND role IN ('admin', 'staff')
           ));

CREATE POLICY "Admins can manage invoices"
    ON public.invoices FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role IN ('admin', 'staff')
        )
    );

-- RLS Policies for payment proofs
CREATE POLICY "Users can view own payment proofs"
    ON public.payment_proofs FOR SELECT
    USING (auth.uid() = user_id OR 
           EXISTS (
               SELECT 1 FROM public.profiles
               WHERE id = auth.uid() AND role IN ('admin', 'staff')
           ));

CREATE POLICY "Users can upload payment proofs"
    ON public.payment_proofs FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage payment proofs"
    ON public.payment_proofs FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role IN ('admin', 'staff')
        )
    );

-- RLS Policies for notifications
CREATE POLICY "Users can view own notifications"
    ON public.notifications FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications"
    ON public.notifications FOR UPDATE
    USING (auth.uid() = user_id);

-- RLS Policies for audit logs
CREATE POLICY "Only admins can view audit logs"
    ON public.audit_logs FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Functions for automatic timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_services_updated_at ON public.services;
CREATE TRIGGER update_services_updated_at BEFORE UPDATE ON public.services
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_orders_updated_at ON public.orders;
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON public.orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_invoices_updated_at ON public.invoices;
CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON public.invoices
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to generate order number
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TEXT AS $$
DECLARE
    new_number TEXT;
    year_month TEXT;
    sequence_num INTEGER;
BEGIN
    year_month := TO_CHAR(NOW(), 'YYYYMM');
    
    SELECT COALESCE(MAX(CAST(SUBSTRING(order_number FROM 13) AS INTEGER)), 0) + 1
    INTO sequence_num
    FROM public.orders
    WHERE order_number LIKE 'ORD-RFS-' || year_month || '%';
    
    new_number := 'ORD-RFS-' || year_month || LPAD(sequence_num::TEXT, 4, '0');
    
    RETURN new_number;
END;
$$ LANGUAGE plpgsql;

-- Function to generate invoice number
CREATE OR REPLACE FUNCTION generate_invoice_number()
RETURNS TEXT AS $$
DECLARE
    new_number TEXT;
    year_month TEXT;
    sequence_num INTEGER;
BEGIN
    year_month := TO_CHAR(NOW(), 'YYYYMM');
    
    SELECT COALESCE(MAX(CAST(SUBSTRING(invoice_number FROM 13) AS INTEGER)), 0) + 1
    INTO sequence_num
    FROM public.invoices
    WHERE invoice_number LIKE 'INV-RFS-' || year_month || '%';
    
    new_number := 'INV-RFS-' || year_month || LPAD(sequence_num::TEXT, 4, '0');
    
    RETURN new_number;
END;
$$ LANGUAGE plpgsql;

-- Function to create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, phone)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'full_name', 'User'),
    COALESCE(new.raw_user_meta_data->>'phone', '')
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically create profile on signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Insert sample services
INSERT INTO public.services (name, description, icon, category, is_active) VALUES
('Jasa Pembuatan Tugas Kuliah', 'Kami membantu menyelesaikan tugas kuliah dengan kualitas terbaik', 'file-text', 'academic', true),
('Rental Laptop', 'Sewa laptop untuk kebutuhan kuliah atau kerja', 'laptop', 'rental', true),
('Jasa Pembuatan Makalah', 'Pembuatan makalah dengan referensi lengkap', 'book-open', 'academic', true),
('Jasa Desain Grafis', 'Desain poster, banner, dan materi presentasi', 'palette', 'creative', true),
('Jasa Pembuatan Laporan PKL', 'Bantuan menyusun laporan PKL yang sempurna', 'briefcase', 'academic', true)
ON CONFLICT DO NOTHING;

