-- ============================================
-- LİSANS/PAKET SİSTEMİ
-- Subscription & Feature Gating System
-- ============================================

-- 1. Create packages table
CREATE TABLE IF NOT EXISTS public.packages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    display_name TEXT NOT NULL,
    description TEXT,
    price NUMERIC(10, 2) NOT NULL DEFAULT 0,
    currency TEXT DEFAULT 'TRY',
    duration_days INTEGER DEFAULT 30,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create features table
CREATE TABLE IF NOT EXISTS public.features (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    display_name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create package_features junction table
CREATE TABLE IF NOT EXISTS public.package_features (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    package_id UUID REFERENCES public.packages(id) ON DELETE CASCADE,
    feature_name TEXT NOT NULL,
    limit_value INTEGER DEFAULT NULL,  -- NULL means unlimited
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(package_id, feature_name)
);

-- 4. Create user_licenses table
CREATE TABLE IF NOT EXISTS public.user_licenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    package_id UUID REFERENCES public.packages(id) ON DELETE CASCADE,
    starts_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL,
    is_active BOOLEAN DEFAULT true,
    auto_renew BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Create feature_usage tracking
CREATE TABLE IF NOT EXISTS public.feature_usage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    feature_name TEXT NOT NULL,
    usage_count INTEGER DEFAULT 1,
    last_used_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Enable RLS
ALTER TABLE public.packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.features ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.package_features ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_licenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feature_usage ENABLE ROW LEVEL SECURITY;

-- 7. RLS Policies

-- Everyone can view packages
CREATE POLICY "Anyone can view packages"
ON public.packages FOR SELECT
TO authenticated
USING (is_active = true);

-- Everyone can view features
CREATE POLICY "Anyone can view features"
ON public.features FOR SELECT
TO authenticated
USING (true);

-- Users can view their own licenses
CREATE POLICY "Users can view own licenses"
ON public.user_licenses FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Users can view their own usage
CREATE POLICY "Users can view own usage"
ON public.feature_usage FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- 8. Insert default packages
INSERT INTO public.packages (name, display_name, description, price, currency, duration_days) VALUES
('free', 'Ücretsiz', 'Temel özelliklere erişim', 0, 'TRY', 365),
('standard', 'Standart', 'AI özelliklerine sınırlı erişim', 99, 'TRY', 30),
('premium', 'Premium', 'Tüm özelliklere sınırsız erişim', 299, 'TRY', 30),
('operator', 'Tur Şirketi', 'Tur ilanı ve yönetim özellikleri', 499, 'TRY', 30)
ON CONFLICT (name) DO NOTHING;

-- 9. Insert features
INSERT INTO public.features (name, display_name, description) VALUES
('view_tours', 'Turları Görüntüle', 'Onaylı turları görüntüleme'),
('ai_chat', 'AI Chatbot', 'AI ile sohbet etme'),
('ai_compare', 'AI Karşılaştırma', 'Turları AI ile karşılaştırma'),
('create_comparison', 'Karşılaştırma Oluştur', 'Tur karşılaştırması yapma'),
('save_favorites', 'Favoriler', 'Favori turları kaydetme'),
('operator_create_tour', 'Tur İlanı', 'Tur ilanı oluşturma'),
('operator_dashboard', 'Operatör Dashboard', 'İstatistikler ve yönetim'),
('admin_panel', 'Admin Paneli', 'Platform yönetimi')
ON CONFLICT (name) DO NOTHING;

-- 10. Assign features to packages
INSERT INTO public.package_features (package_id, feature_name, limit_value) VALUES
-- Free package
((SELECT id FROM public.packages WHERE name = 'free'), 'view_tours', NULL),

-- Standard package
((SELECT id FROM public.packages WHERE name = 'standard'), 'view_tours', NULL),
((SELECT id FROM public.packages WHERE name = 'standard'), 'ai_chat', 10),
((SELECT id FROM public.packages WHERE name = 'standard'), 'ai_compare', 5),
((SELECT id FROM public.packages WHERE name = 'standard'), 'create_comparison', 10),
((SELECT id FROM public.packages WHERE name = 'standard'), 'save_favorites', NULL),

-- Premium package
((SELECT id FROM public.packages WHERE name = 'premium'), 'view_tours', NULL),
((SELECT id FROM public.packages WHERE name = 'premium'), 'ai_chat', NULL),
((SELECT id FROM public.packages WHERE name = 'premium'), 'ai_compare', NULL),
((SELECT id FROM public.packages WHERE name = 'premium'), 'create_comparison', NULL),
((SELECT id FROM public.packages WHERE name = 'premium'), 'save_favorites', NULL),

-- Operator package
((SELECT id FROM public.packages WHERE name = 'operator'), 'view_tours', NULL),
((SELECT id FROM public.packages WHERE name = 'operator'), 'operator_create_tour', NULL),
((SELECT id FROM public.packages WHERE name = 'operator'), 'operator_dashboard', NULL),
((SELECT id FROM public.packages WHERE name = 'operator'), 'ai_chat', 20),
((SELECT id FROM public.packages WHERE name = 'operator'), 'ai_compare', 10)
ON CONFLICT DO NOTHING;

-- 11. Give all existing users free package
INSERT INTO public.user_licenses (user_id, package_id, expires_at)
SELECT 
    u.id,
    p.id,
    NOW() + INTERVAL '1 year'
FROM public.users u
CROSS JOIN public.packages p
WHERE p.name = 'free'
  AND NOT EXISTS (
    SELECT 1 FROM public.user_licenses ul WHERE ul.user_id = u.id
  );

-- 12. RPC: Check if user can use feature
CREATE OR REPLACE FUNCTION check_user_feature(
    user_id_param UUID,
    feature_name_param TEXT
)
RETURNS TABLE(allowed BOOLEAN, remaining INTEGER, limit_value INTEGER)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    user_license_id UUID;
    package_limit INTEGER;
    current_usage INTEGER := 0;
BEGIN
    -- Get active license
    SELECT ul.id, pf.limit_value
    INTO user_license_id, package_limit
    FROM public.user_licenses ul
    JOIN public.package_features pf ON pf.package_id = ul.package_id
    WHERE ul.user_id = user_id_param
      AND pf.feature_name = feature_name_param
      AND ul.is_active = true
      AND ul.expires_at > NOW()
    ORDER BY ul.expires_at DESC
    LIMIT 1;
    
    -- If no license found, not allowed
    IF user_license_id IS NULL THEN
        RETURN QUERY SELECT false, 0, 0;
        RETURN;
    END IF;
    
    -- If unlimited (NULL limit)
    IF package_limit IS NULL THEN
        RETURN QUERY SELECT true, -1, -1;  -- -1 means unlimited
        RETURN;
    END IF;
    
    -- Check current usage
    SELECT COALESCE(SUM(usage_count), 0)
    INTO current_usage
    FROM public.feature_usage
    WHERE user_id = user_id_param
      AND feature_name = feature_name_param
      AND created_at >= (SELECT starts_at FROM public.user_licenses WHERE id = user_license_id);
    
    -- Check if limit exceeded
    IF current_usage >= package_limit THEN
        RETURN QUERY SELECT false, 0, package_limit;
    ELSE
        RETURN QUERY SELECT true, package_limit - current_usage, package_limit;
    END IF;
END;
$$;

-- 13. RPC: Record feature usage
CREATE OR REPLACE FUNCTION record_feature_usage(
    user_id_param UUID,
    feature_name_param TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Insert or update usage
    INSERT INTO public.feature_usage (user_id, feature_name, usage_count, last_used_at)
    VALUES (user_id_param, feature_name_param, 1, NOW())
    ON CONFLICT (user_id, feature_name) 
    DO UPDATE SET 
        usage_count = feature_usage.usage_count + 1,
        last_used_at = NOW();
    
    RETURN true;
END;
$$;

-- 14. Add unique constraint for feature usage
ALTER TABLE public.feature_usage 
ADD CONSTRAINT unique_user_feature UNIQUE (user_id, feature_name);

-- 15. Create indexes
CREATE INDEX IF NOT EXISTS idx_user_licenses_user_id ON public.user_licenses(user_id);
CREATE INDEX IF NOT EXISTS idx_user_licenses_active ON public.user_licenses(is_active, expires_at);
CREATE INDEX IF NOT EXISTS idx_feature_usage_user_id ON public.feature_usage(user_id);

-- ============================================
-- LİSANS SİSTEMİ COMPLETE
-- ============================================
-- Next: Update backend to check licenses before AI operations
-- ============================================
