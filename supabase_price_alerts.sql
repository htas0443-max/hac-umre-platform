-- ============================================
-- PRICE ALERTS TABLE
-- Fiyat düşüşü bildirimi için
-- ============================================

-- 1. Price alerts tablosu
CREATE TABLE IF NOT EXISTS public.price_alerts (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    tour_id BIGINT NOT NULL REFERENCES public.tours(id) ON DELETE CASCADE,
    last_seen_price NUMERIC NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    notified_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (user_id, tour_id)
);

-- 2. Performance indexleri
CREATE INDEX IF NOT EXISTS idx_price_alerts_user_id ON public.price_alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_price_alerts_tour_id ON public.price_alerts(tour_id);
CREATE INDEX IF NOT EXISTS idx_price_alerts_is_active ON public.price_alerts(is_active) WHERE is_active = TRUE;

-- 3. RLS aktif et
ALTER TABLE public.price_alerts ENABLE ROW LEVEL SECURITY;

-- 4. RLS Politikaları
DROP POLICY IF EXISTS "Users can view own price alerts" ON public.price_alerts;
DROP POLICY IF EXISTS "Users can add price alerts" ON public.price_alerts;
DROP POLICY IF EXISTS "Users can update own price alerts" ON public.price_alerts;
DROP POLICY IF EXISTS "Users can delete own price alerts" ON public.price_alerts;

CREATE POLICY "Users can view own price alerts"
ON public.price_alerts FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can add price alerts"
ON public.price_alerts FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own price alerts"
ON public.price_alerts FOR UPDATE
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can delete own price alerts"
ON public.price_alerts FOR DELETE
TO authenticated
USING (user_id = auth.uid());

-- ============================================
-- TAMAMLANDI ✓
-- ============================================
