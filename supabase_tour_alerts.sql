-- =====================================================
-- TOUR ALERTS (TUR ALARM) - Tarih Bazlı Bildirim
-- =====================================================
-- "Bu tarihte tur açılırsa bana haber ver"
-- Kullanıcı belirli bir tarih aralığı için bildirim ister
-- Yeni tur eklendiğinde bu tarihlere uyan kullanıcılara sinyal verilir

-- Drop existing table (cascade drops policies too)
DROP TABLE IF EXISTS public.tour_alerts CASCADE;

-- Create tour_alerts table
CREATE TABLE public.tour_alerts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    
    -- Tarih aralığı (kullanıcının aradığı dönem)
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    
    -- Opsiyonel filtreler
    tour_type VARCHAR(20) DEFAULT 'any', -- 'hac', 'umre', 'any'
    max_price DECIMAL(10, 2) DEFAULT NULL,
    preferred_operator VARCHAR(255) DEFAULT NULL,
    
    -- Durum
    is_active BOOLEAN DEFAULT true,
    notified_count INTEGER DEFAULT 0,
    last_notified_at TIMESTAMPTZ DEFAULT NULL,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT valid_date_range CHECK (end_date >= start_date),
    CONSTRAINT valid_tour_type CHECK (tour_type IN ('hac', 'umre', 'any'))
);

-- Indexes for efficient querying
CREATE INDEX idx_tour_alerts_user_id ON public.tour_alerts(user_id);
CREATE INDEX idx_tour_alerts_dates ON public.tour_alerts(start_date, end_date);
CREATE INDEX idx_tour_alerts_active ON public.tour_alerts(is_active) WHERE is_active = true;

-- Enable RLS
ALTER TABLE public.tour_alerts ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own tour alerts"
    ON public.tour_alerts FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create tour alerts"
    ON public.tour_alerts FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own tour alerts"
    ON public.tour_alerts FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own tour alerts"
    ON public.tour_alerts FOR DELETE
    USING (auth.uid() = user_id);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_tour_alerts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tour_alerts_updated_at ON public.tour_alerts;
CREATE TRIGGER tour_alerts_updated_at
    BEFORE UPDATE ON public.tour_alerts
    FOR EACH ROW
    EXECUTE FUNCTION update_tour_alerts_updated_at();
