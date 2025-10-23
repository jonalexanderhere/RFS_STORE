-- ═══════════════════════════════════════════════════════════════════
-- UPDATE SCHEMA: Add Result Fields & Payment Verification
-- ═══════════════════════════════════════════════════════════════════

-- Add result fields to orders table
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS result_url TEXT,
ADD COLUMN IF NOT EXISTS result_message TEXT,
ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;

-- Add admin_verified_by to invoices
ALTER TABLE public.invoices
ADD COLUMN IF NOT EXISTS verified_by UUID REFERENCES public.profiles(id),
ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ;

-- Add telegram_id to profiles for direct messaging
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS telegram_id TEXT,
ADD COLUMN IF NOT EXISTS whatsapp_number TEXT;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_completed ON public.orders(completed_at) WHERE completed_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_invoices_verified ON public.invoices(verified_at) WHERE verified_at IS NOT NULL;

-- ═══════════════════════════════════════════════════════════════════
-- SUCCESS MESSAGE
-- ═══════════════════════════════════════════════════════════════════

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '════════════════════════════════════════════════════════════';
    RAISE NOTICE '          ✅ SCHEMA UPDATED SUCCESSFULLY! ✅';
    RAISE NOTICE '════════════════════════════════════════════════════════════';
    RAISE NOTICE '';
    RAISE NOTICE 'NEW FIELDS ADDED:';
    RAISE NOTICE '  • orders.result_url - URL file hasil jokian';
    RAISE NOTICE '  • orders.result_message - Pesan untuk customer';
    RAISE NOTICE '  • orders.completed_at - Timestamp completion';
    RAISE NOTICE '  • invoices.verified_by - Admin yang verifikasi';
    RAISE NOTICE '  • invoices.verified_at - Timestamp verifikasi';
    RAISE NOTICE '  • profiles.telegram_id - Telegram Chat ID';
    RAISE NOTICE '  • profiles.whatsapp_number - WhatsApp number';
    RAISE NOTICE '';
    RAISE NOTICE 'INDEXES CREATED:';
    RAISE NOTICE '  • idx_orders_status';
    RAISE NOTICE '  • idx_orders_completed';
    RAISE NOTICE '  • idx_invoices_verified';
    RAISE NOTICE '';
    RAISE NOTICE '════════════════════════════════════════════════════════════';
    RAISE NOTICE '';
END $$;

