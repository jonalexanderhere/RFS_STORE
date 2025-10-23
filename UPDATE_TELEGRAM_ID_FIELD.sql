-- ═══════════════════════════════════════════════════════════════════
-- UPDATE: Add Telegram ID Support & Update Trigger
-- ═══════════════════════════════════════════════════════════════════

-- Ensure telegram_id field exists (already added in previous migration)
-- This is idempotent
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'profiles' 
        AND column_name = 'telegram_id'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN telegram_id TEXT;
    END IF;
END $$;

-- Update handle_new_user trigger to include telegram_id from auth metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, phone, telegram_id, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'phone', ''),
    COALESCE(NEW.raw_user_meta_data->>'telegram_id', NULL),
    NEW.email
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = COALESCE(EXCLUDED.full_name, profiles.full_name),
    phone = COALESCE(EXCLUDED.phone, profiles.phone),
    telegram_id = COALESCE(EXCLUDED.telegram_id, profiles.telegram_id),
    email = COALESCE(EXCLUDED.email, profiles.email);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create index for faster telegram_id lookups
CREATE INDEX IF NOT EXISTS idx_profiles_telegram_id ON public.profiles(telegram_id) WHERE telegram_id IS NOT NULL;

-- ═══════════════════════════════════════════════════════════════════
-- SUCCESS MESSAGE
-- ═══════════════════════════════════════════════════════════════════

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '════════════════════════════════════════════════════════════';
    RAISE NOTICE '          ✅ TELEGRAM ID SUPPORT ENABLED! ✅';
    RAISE NOTICE '════════════════════════════════════════════════════════════';
    RAISE NOTICE '';
    RAISE NOTICE 'UPDATES:';
    RAISE NOTICE '  • profiles.telegram_id field ready';
    RAISE NOTICE '  • handle_new_user() trigger updated';
    RAISE NOTICE '  • Auto-extract telegram_id from metadata';
    RAISE NOTICE '  • Index created for faster lookups';
    RAISE NOTICE '';
    RAISE NOTICE 'NOTIFICATION LOGIC:';
    RAISE NOTICE '  1. Check if user has telegram_id';
    RAISE NOTICE '  2. If yes → Send Telegram notification';
    RAISE NOTICE '  3. If no → Send WhatsApp notification';
    RAISE NOTICE '  4. Or send both (configurable)';
    RAISE NOTICE '';
    RAISE NOTICE '════════════════════════════════════════════════════════════';
    RAISE NOTICE '';
END $$;

