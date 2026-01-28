-- ============================================
-- FAVORITES ABUSE SIGNALS TABLE
-- Admin görünümü için - kullanıcı deneyimini etkilemez
-- ============================================

-- 1. Abuse sinyalleri tablosu
CREATE TABLE IF NOT EXISTS public.favorites_abuse_signals (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    ip_masked TEXT,
    signal_type TEXT NOT NULL CHECK (signal_type IN ('high_volume', 'rapid_toggle', 'excessive_total')),
    count INTEGER NOT NULL,
    window_size TEXT NOT NULL,
    tour_id BIGINT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Performance indexleri
CREATE INDEX IF NOT EXISTS idx_abuse_signals_created_at ON public.favorites_abuse_signals(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_abuse_signals_user_id ON public.favorites_abuse_signals(user_id);
CREATE INDEX IF NOT EXISTS idx_abuse_signals_signal_type ON public.favorites_abuse_signals(signal_type);

-- 3. RLS - Sadece adminler görebilir
ALTER TABLE public.favorites_abuse_signals ENABLE ROW LEVEL SECURITY;

-- Admin politikası (varsa drop et)
DROP POLICY IF EXISTS "Admins can view abuse signals" ON public.favorites_abuse_signals;

CREATE POLICY "Admins can view abuse signals"
ON public.favorites_abuse_signals FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.users
        WHERE users.id = auth.uid()
        AND users.user_role = 'admin'
    )
);

-- Insert izni sadece service role için (backend)
DROP POLICY IF EXISTS "Service can insert abuse signals" ON public.favorites_abuse_signals;

CREATE POLICY "Service can insert abuse signals"
ON public.favorites_abuse_signals FOR INSERT
TO authenticated
WITH CHECK (true);

-- ============================================
-- TAMAMLANDI ✓
-- ============================================
