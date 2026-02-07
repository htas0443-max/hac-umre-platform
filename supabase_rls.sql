-- =============================================
-- HAC & UMRE PLATFORM — Supabase RLS Policies
-- =============================================
-- Bu SQL'i Supabase Dashboard > SQL Editor'da çalıştırın.
-- tours tablosuna RLS politikaları + Ajanta izolasyonu ekler.

-- =============================================
-- BÖLÜM 1: TABLO HAZIRLIĞI
-- =============================================

-- 1a. RLS'yi aç
ALTER TABLE tours ENABLE ROW LEVEL SECURITY;

-- 1b. operator_id kolonu (yoksa ekle)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'tours' AND column_name = 'operator_id'
    ) THEN
        ALTER TABLE tours ADD COLUMN operator_id UUID REFERENCES auth.users(id);
    END IF;
END $$;

-- 1c. Soft-delete kolonu (yoksa ekle)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'tours' AND column_name = 'deleted_at'
    ) THEN
        ALTER TABLE tours ADD COLUMN deleted_at TIMESTAMPTZ DEFAULT NULL;
    END IF;
END $$;

-- 1d. operator_id index (performans)
CREATE INDEX IF NOT EXISTS idx_tours_operator_id ON tours(operator_id);

-- =============================================
-- BÖLÜM 2: ESKİ POLİTİKALARI TEMİZLE
-- =============================================
DROP POLICY IF EXISTS "tours_public_select" ON tours;
DROP POLICY IF EXISTS "tours_authenticated_insert" ON tours;
DROP POLICY IF EXISTS "tours_admin_update" ON tours;
DROP POLICY IF EXISTS "tours_admin_delete" ON tours;
DROP POLICY IF EXISTS "tours_admin_full_access" ON tours;
DROP POLICY IF EXISTS "tours_operator_select_own" ON tours;
DROP POLICY IF EXISTS "tours_operator_insert_own" ON tours;
DROP POLICY IF EXISTS "tours_operator_update_own" ON tours;

-- =============================================
-- BÖLÜM 3: PUBLIC POLİTİKALAR
-- =============================================

-- Herkes (giriş yapmamış dahil) onaylı turları görebilir.
CREATE POLICY "tours_public_select" ON tours
    FOR SELECT
    USING (
        deleted_at IS NULL
        AND status = 'approved'
    );

-- =============================================
-- BÖLÜM 4: ADMIN POLİTİKALARI
-- Admin tüm turları görebilir, ekleyebilir, düzenleyebilir, silebilir.
-- =============================================
CREATE POLICY "tours_admin_full_access" ON tours
    FOR ALL
    TO authenticated
    USING (
        (auth.jwt() ->> 'user_role') = 'admin'
    )
    WITH CHECK (
        (auth.jwt() ->> 'user_role') = 'admin'
    );

-- =============================================
-- BÖLÜM 5: AJANTA (OPERATOR) İZOLASYONU
-- Her ajanta SADECE kendi turlarını görebilir/düzenleyebilir.
-- Başka ajantanın verisine ASLA erişemez.
-- =============================================

-- 5a. Ajanta kendi turlarını okuyabilir (tüm durumlar: draft, pending, rejected dahil)
CREATE POLICY "tours_operator_select_own" ON tours
    FOR SELECT
    TO authenticated
    USING (
        (auth.jwt() ->> 'user_role') = 'operator'
        AND operator_id = auth.uid()
    );

-- 5b. Ajanta sadece kendi adına tur ekleyebilir
CREATE POLICY "tours_operator_insert_own" ON tours
    FOR INSERT
    TO authenticated
    WITH CHECK (
        (auth.jwt() ->> 'user_role') = 'operator'
        AND operator_id = auth.uid()
    );

-- 5c. Ajanta sadece kendi turunu güncelleyebilir
CREATE POLICY "tours_operator_update_own" ON tours
    FOR UPDATE
    TO authenticated
    USING (
        (auth.jwt() ->> 'user_role') = 'operator'
        AND operator_id = auth.uid()
    )
    WITH CHECK (
        (auth.jwt() ->> 'user_role') = 'operator'
        AND operator_id = auth.uid()
    );

-- =============================================
-- NOT: Ajanta DELETE yapamaz. Sadece admin silebilir.
-- NOT: Backend SUPABASE_SERVICE_ROLE_KEY kullandığı için
--      RLS bypass edilir. Bu politikalar doğrudan
--      Supabase client erişimlerini kısıtlar (defense-in-depth).
-- =============================================
