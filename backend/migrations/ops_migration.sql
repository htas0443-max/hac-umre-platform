-- ============================================
-- Migration: Operational Control Layer
-- 1. Extend audit_logs with previous/new state
-- 2. Create feature_flags table
-- ============================================

-- 1. Extend audit_logs
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS previous_data JSONB DEFAULT '{}';
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS new_data JSONB DEFAULT '{}';
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS is_rollback BOOLEAN DEFAULT FALSE;
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS rollback_of UUID;

-- 2. Feature Flags table
CREATE TABLE IF NOT EXISTS feature_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  enabled BOOLEAN DEFAULT FALSE,
  description TEXT,
  updated_by UUID,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Seed default flags
INSERT INTO feature_flags (key, enabled, description) VALUES
  ('chat_enabled', true, 'Canlı sohbet özelliği'),
  ('price_alerts_enabled', true, 'Fiyat alarmı bildirimleri'),
  ('reviews_enabled', true, 'Kullanıcı yorumları'),
  ('registration_open', true, 'Yeni kayıt açık/kapalı'),
  ('maintenance_banner', false, 'Bakım modu banner göster')
ON CONFLICT (key) DO NOTHING;
