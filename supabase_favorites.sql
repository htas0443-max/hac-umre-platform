-- ============================================
-- HAC & UMRE PLATFORM - FAVORITES TABLE SCHEMA
-- Safe Migration - Mevcut yapıyı düzgün şekilde günceller
-- ============================================
-- Supabase Dashboard → SQL Editor'da çalıştırın
-- ============================================

-- 1. Önce mevcut RLS politikalarını kaldır (varsa)
DROP POLICY IF EXISTS "Users can view own favorites" ON public.favorites;
DROP POLICY IF EXISTS "Users can add favorites" ON public.favorites;
DROP POLICY IF EXISTS "Users can remove own favorites" ON public.favorites;

-- 2. Mevcut tabloyu kaldır (varsa)
DROP TABLE IF EXISTS public.favorites CASCADE;

-- 3. Yeni tabloyu oluştur (önerilen yapı)
CREATE TABLE public.favorites (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    tour_id BIGINT NOT NULL REFERENCES public.tours(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, tour_id)
);

-- 4. Performance için indexler
CREATE INDEX idx_favorites_user_id ON public.favorites(user_id);
CREATE INDEX idx_favorites_tour_id ON public.favorites(tour_id);
CREATE INDEX idx_favorites_created_at ON public.favorites(created_at DESC);

-- 5. Row Level Security aktif et
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;

-- 6. RLS Politikaları
-- Kullanıcılar kendi favorilerini görebilir
CREATE POLICY "Users can view own favorites"
ON public.favorites FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Kullanıcılar favorilere ekleyebilir
CREATE POLICY "Users can add favorites"
ON public.favorites FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- Kullanıcılar kendi favorilerini silebilir
CREATE POLICY "Users can remove own favorites"
ON public.favorites FOR DELETE
TO authenticated
USING (user_id = auth.uid());

-- ============================================
-- TAMAMLANDI ✓
-- ============================================
