-- ============================================
-- SISTEM NOTIFIKASI OTOMATIS RFS STORE
-- Auto-send hasil ke WhatsApp/Telegram user
-- ============================================

-- 1. Tabel untuk menyimpan konfigurasi notifikasi
CREATE TABLE IF NOT EXISTS public.notification_settings (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    service_type TEXT NOT NULL, -- 'whatsapp', 'telegram'
    api_url TEXT NOT NULL,
    api_key TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Tabel untuk tracking notifikasi yang sudah terkirim
CREATE TABLE IF NOT EXISTS public.notification_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    order_id UUID REFERENCES public.orders(id),
    user_id UUID REFERENCES public.profiles(id),
    notification_type TEXT NOT NULL, -- 'order_completed', 'order_processing', 'payment_received', etc
    recipient_number TEXT NOT NULL,
    message TEXT NOT NULL,
    service_type TEXT NOT NULL, -- 'whatsapp', 'telegram'
    status TEXT DEFAULT 'pending', -- 'pending', 'sent', 'failed'
    error_message TEXT,
    sent_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Fungsi untuk membuat pesan notifikasi
CREATE OR REPLACE FUNCTION public.generate_order_notification_message(
    p_order_id UUID,
    p_notification_type TEXT
)
RETURNS TEXT AS $$
DECLARE
    v_message TEXT;
    v_order_number TEXT;
    v_user_name TEXT;
    v_service_name TEXT;
    v_status TEXT;
    v_completed_at TEXT;
BEGIN
    -- Get order details
    SELECT 
        o.order_number,
        p.full_name,
        s.name,
        o.status,
        TO_CHAR(o.completed_at AT TIME ZONE 'Asia/Jakarta', 'DD-MM-YYYY HH24:MI')
    INTO 
        v_order_number,
        v_user_name,
        v_service_name,
        v_status,
        v_completed_at
    FROM orders o
    JOIN profiles p ON o.user_id = p.id
    JOIN services s ON o.service_id = s.id
    WHERE o.id = p_order_id;

    -- Generate message based on type
    IF p_notification_type = 'order_completed' THEN
        v_message := '🎉 *ORDER SELESAI!*' || E'\n\n' ||
                    'Hai ' || v_user_name || '!' || E'\n\n' ||
                    '✅ Order Anda sudah selesai dikerjakan!' || E'\n\n' ||
                    '📋 *Detail Order:*' || E'\n' ||
                    '• No. Order: ' || v_order_number || E'\n' ||
                    '• Layanan: ' || v_service_name || E'\n' ||
                    '• Selesai: ' || v_completed_at || ' WIB' || E'\n\n' ||
                    '📥 *Cara Download Hasil:*' || E'\n' ||
                    '1. Login ke dashboard' || E'\n' ||
                    '2. Masuk ke "Orders Saya"' || E'\n' ||
                    '3. Klik order: ' || v_order_number || E'\n' ||
                    '4. Download hasil pekerjaan' || E'\n\n' ||
                    '🔗 Link: [URL_DASHBOARD_ANDA]' || E'\n\n' ||
                    'Terima kasih sudah mempercayai RFS Store! 🙏' || E'\n\n' ||
                    '_Pesan otomatis dari RFS Store_';
    
    ELSIF p_notification_type = 'order_processing' THEN
        v_message := '⏳ *ORDER DIPROSES*' || E'\n\n' ||
                    'Hai ' || v_user_name || '!' || E'\n\n' ||
                    '📝 Order Anda sedang dalam proses pengerjaan.' || E'\n\n' ||
                    '📋 *Detail:*' || E'\n' ||
                    '• No. Order: ' || v_order_number || E'\n' ||
                    '• Layanan: ' || v_service_name || E'\n\n' ||
                    'Kami akan kirim notifikasi lagi saat order selesai.' || E'\n\n' ||
                    '_RFS Store - Professional Service_';
    
    ELSIF p_notification_type = 'order_cancelled' THEN
        v_message := '❌ *ORDER DIBATALKAN*' || E'\n\n' ||
                    'Hai ' || v_user_name || ',' || E'\n\n' ||
                    'Order berikut telah dibatalkan:' || E'\n' ||
                    '• No. Order: ' || v_order_number || E'\n' ||
                    '• Layanan: ' || v_service_name || E'\n\n' ||
                    'Jika ada pertanyaan, silakan hubungi admin.' || E'\n\n' ||
                    '_RFS Store_';
    
    ELSE
        v_message := 'Update untuk order: ' || v_order_number;
    END IF;

    RETURN v_message;
END;
$$ LANGUAGE plpgsql;

-- 4. Fungsi untuk queue notifikasi (akan diproses oleh webhook/edge function)
CREATE OR REPLACE FUNCTION public.queue_notification(
    p_order_id UUID,
    p_notification_type TEXT
)
RETURNS UUID AS $$
DECLARE
    v_user_id UUID;
    v_phone TEXT;
    v_whatsapp TEXT;
    v_telegram_id TEXT;
    v_message TEXT;
    v_notification_id UUID;
    v_recipient TEXT;
    v_service_type TEXT;
BEGIN
    -- Get user contact info
    SELECT 
        o.user_id,
        p.phone,
        p.whatsapp,
        p.telegram_id
    INTO 
        v_user_id,
        v_phone,
        v_whatsapp,
        v_telegram_id
    FROM orders o
    JOIN profiles p ON o.user_id = p.id
    WHERE o.id = p_order_id;

    -- Generate message
    v_message := public.generate_order_notification_message(p_order_id, p_notification_type);

    -- Prioritas: WhatsApp > Telegram > Phone
    IF v_whatsapp IS NOT NULL AND v_whatsapp != '' THEN
        v_recipient := v_whatsapp;
        v_service_type := 'whatsapp';
    ELSIF v_telegram_id IS NOT NULL AND v_telegram_id != '' THEN
        v_recipient := v_telegram_id;
        v_service_type := 'telegram';
    ELSIF v_phone IS NOT NULL AND v_phone != '' THEN
        v_recipient := v_phone;
        v_service_type := 'whatsapp'; -- fallback to WhatsApp with phone
    ELSE
        -- No contact info, can't send notification
        RAISE NOTICE 'User % has no contact info for notifications', v_user_id;
        RETURN NULL;
    END IF;

    -- Insert notification log
    INSERT INTO public.notification_logs (
        order_id,
        user_id,
        notification_type,
        recipient_number,
        message,
        service_type,
        status
    ) VALUES (
        p_order_id,
        v_user_id,
        p_notification_type,
        v_recipient,
        v_message,
        v_service_type,
        'pending'
    )
    RETURNING id INTO v_notification_id;

    -- Create notification record in notifications table
    INSERT INTO public.notifications (
        user_id,
        title,
        message,
        type,
        metadata
    ) VALUES (
        v_user_id,
        CASE p_notification_type
            WHEN 'order_completed' THEN '🎉 Order Selesai!'
            WHEN 'order_processing' THEN '⏳ Order Diproses'
            WHEN 'order_cancelled' THEN '❌ Order Dibatalkan'
            ELSE 'Update Order'
        END,
        v_message,
        p_notification_type,
        jsonb_build_object(
            'order_id', p_order_id,
            'notification_log_id', v_notification_id,
            'service_type', v_service_type,
            'recipient', v_recipient
        )
    );

    RAISE NOTICE 'Notification queued: % for order %', v_notification_id, p_order_id;
    
    RETURN v_notification_id;
END;
$$ LANGUAGE plpgsql;

-- 5. Trigger function untuk auto-send notification saat status order berubah
CREATE OR REPLACE FUNCTION public.auto_send_order_notification()
RETURNS TRIGGER AS $$
BEGIN
    -- Order completed
    IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
        PERFORM public.queue_notification(NEW.id, 'order_completed');
        RAISE NOTICE 'Auto-sending completion notification for order %', NEW.order_number;
    END IF;

    -- Order processing
    IF NEW.status = 'processing' AND OLD.status = 'pending' THEN
        PERFORM public.queue_notification(NEW.id, 'order_processing');
        RAISE NOTICE 'Auto-sending processing notification for order %', NEW.order_number;
    END IF;

    -- Order cancelled
    IF NEW.status = 'cancelled' AND OLD.status != 'cancelled' THEN
        PERFORM public.queue_notification(NEW.id, 'order_cancelled');
        RAISE NOTICE 'Auto-sending cancellation notification for order %', NEW.order_number;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 6. Create trigger for auto-notification
DROP TRIGGER IF EXISTS auto_notify_order_status_change ON public.orders;
CREATE TRIGGER auto_notify_order_status_change
    AFTER UPDATE ON public.orders
    FOR EACH ROW
    WHEN (OLD.status IS DISTINCT FROM NEW.status)
    EXECUTE FUNCTION public.auto_send_order_notification();

-- 7. Enable RLS for new tables
ALTER TABLE public.notification_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_logs ENABLE ROW LEVEL SECURITY;

-- 8. RLS Policies for notification_settings (Admin only)
CREATE POLICY "Admins can manage notification settings" ON public.notification_settings
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- 9. RLS Policies for notification_logs
CREATE POLICY "Users can view their own notification logs" ON public.notification_logs
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all notification logs" ON public.notification_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "System can insert notification logs" ON public.notification_logs
    FOR INSERT WITH CHECK (true);

CREATE POLICY "System can update notification logs" ON public.notification_logs
    FOR UPDATE USING (true);

-- 10. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_notification_logs_order_id ON public.notification_logs(order_id);
CREATE INDEX IF NOT EXISTS idx_notification_logs_user_id ON public.notification_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_notification_logs_status ON public.notification_logs(status);
CREATE INDEX IF NOT EXISTS idx_notification_logs_created_at ON public.notification_logs(created_at DESC);

-- 11. Insert default notification settings (contoh)
INSERT INTO public.notification_settings (service_type, api_url, is_active)
VALUES 
    ('whatsapp', 'https://api.whatsapp.com/send', true),
    ('telegram', 'https://api.telegram.org/bot', true)
ON CONFLICT DO NOTHING;

-- 12. Function untuk manual trigger notifikasi (jika diperlukan)
CREATE OR REPLACE FUNCTION public.send_manual_notification(
    p_order_id UUID,
    p_notification_type TEXT DEFAULT 'order_completed'
)
RETURNS UUID AS $$
BEGIN
    RETURN public.queue_notification(p_order_id, p_notification_type);
END;
$$ LANGUAGE plpgsql;

-- 13. View untuk monitoring notifikasi
CREATE OR REPLACE VIEW public.notification_status_view AS
SELECT 
    nl.id,
    nl.order_id,
    o.order_number,
    p.full_name AS user_name,
    nl.recipient_number,
    nl.service_type,
    nl.notification_type,
    nl.status,
    nl.sent_at,
    nl.created_at,
    nl.error_message,
    CASE 
        WHEN nl.status = 'sent' THEN '✅ Terkirim'
        WHEN nl.status = 'failed' THEN '❌ Gagal'
        ELSE '⏳ Pending'
    END AS status_display
FROM notification_logs nl
JOIN orders o ON nl.order_id = o.id
JOIN profiles p ON nl.user_id = p.id
ORDER BY nl.created_at DESC;

-- Success message
DO $$
BEGIN
    RAISE NOTICE '✅ Notification system installed successfully!';
    RAISE NOTICE '📱 Auto-send notifications enabled';
    RAISE NOTICE '🔔 Triggers: order_completed, order_processing, order_cancelled';
    RAISE NOTICE '📊 Tables: notification_settings, notification_logs';
    RAISE NOTICE '🎯 Next: Setup WhatsApp/Telegram API integration';
END $$;

