-- =====================================================
-- OPERATOR REVIEWS (FİRMA DEĞERLENDİRMELERİ)
-- =====================================================
-- Kullanıcılar tur operatörleri hakkında yorum ve puan bırakabilir
-- Güven artırıcı özellik - sadece onaylanmış yorumlar gösterilir

-- Drop existing table (cascade drops policies too)
DROP TABLE IF EXISTS public.operator_reviews CASCADE;

-- Create operator_reviews table
CREATE TABLE public.operator_reviews (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- İlişkiler
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    operator_name VARCHAR(255) NOT NULL,  -- Firma adı (tours.operator ile eşleşir)
    tour_id BIGINT REFERENCES public.tours(id) ON DELETE SET NULL,  -- Opsiyonel: hangi tur için
    
    -- Değerlendirme
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),  -- 1-5 yıldız
    title VARCHAR(100),  -- Yorum başlığı (opsiyonel)
    comment TEXT,  -- Yorum metni (opsiyonel)
    
    -- Moderasyon
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    rejection_reason TEXT,
    moderated_at TIMESTAMPTZ,
    moderated_by UUID REFERENCES public.users(id),
    
    -- Meta
    is_verified_purchase BOOLEAN DEFAULT false,  -- Gerçekten bu turdan alım yaptı mı?
    helpful_count INTEGER DEFAULT 0,  -- Kaç kişi faydalı buldu
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Bir kullanıcı bir operatöre sadece bir yorum bırakabilir
    UNIQUE(user_id, operator_name)
);

-- Indexes
CREATE INDEX idx_operator_reviews_operator ON public.operator_reviews(operator_name);
CREATE INDEX idx_operator_reviews_status ON public.operator_reviews(status);
CREATE INDEX idx_operator_reviews_rating ON public.operator_reviews(rating);
CREATE INDEX idx_operator_reviews_user ON public.operator_reviews(user_id);

-- Enable RLS
ALTER TABLE public.operator_reviews ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Herkes onaylanmış yorumları görebilir
CREATE POLICY "Anyone can view approved reviews"
    ON public.operator_reviews FOR SELECT
    USING (status = 'approved');

-- Kullanıcılar kendi yorumlarını görebilir (pending dahil)
CREATE POLICY "Users can view own reviews"
    ON public.operator_reviews FOR SELECT
    USING (auth.uid() = user_id);

-- Giriş yapan kullanıcılar yorum ekleyebilir
CREATE POLICY "Authenticated users can create reviews"
    ON public.operator_reviews FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Kullanıcılar kendi pending yorumlarını güncelleyebilir
CREATE POLICY "Users can update own pending reviews"
    ON public.operator_reviews FOR UPDATE
    USING (auth.uid() = user_id AND status = 'pending')
    WITH CHECK (auth.uid() = user_id);

-- Kullanıcılar kendi yorumlarını silebilir
CREATE POLICY "Users can delete own reviews"
    ON public.operator_reviews FOR DELETE
    USING (auth.uid() = user_id);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_operator_reviews_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS operator_reviews_updated_at ON public.operator_reviews;
CREATE TRIGGER operator_reviews_updated_at
    BEFORE UPDATE ON public.operator_reviews
    FOR EACH ROW
    EXECUTE FUNCTION update_operator_reviews_updated_at();
