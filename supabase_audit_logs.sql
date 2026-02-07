-- =============================================
-- HAC & UMRE PLATFORM — Audit Logs Schema
-- =============================================
-- Bu SQL'i Supabase Dashboard > SQL Editor'da çalıştırın.
-- Tüm kritik işlemleri kaydeden audit_logs tablosu oluşturur.

-- 1. Tablo oluştur
CREATE TABLE IF NOT EXISTS audit_logs (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id),
    role TEXT NOT NULL DEFAULT 'unknown',
    action TEXT NOT NULL,
    entity TEXT,
    entity_id TEXT,
    details JSONB DEFAULT '{}',
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. İndexler (hızlı sorgulama)
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_role ON audit_logs(role);

-- 3. RLS
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Sadece admin okuyabilir
DROP POLICY IF EXISTS "audit_logs_admin_select" ON audit_logs;
CREATE POLICY "audit_logs_admin_select" ON audit_logs
    FOR SELECT
    TO authenticated
    USING ((auth.jwt() ->> 'user_role') = 'admin');

-- Service role (backend) her şeyi yapabilir — RLS bypass
-- Bu yüzden INSERT için ayrı policy gerekmez (backend SERVICE_ROLE kullanır)

-- =============================================
-- NOT: Bu tablo sadece backend tarafından yazılır.
-- Frontend doğrudan erişemez (RLS + service role).
-- =============================================
