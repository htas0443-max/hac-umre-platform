-- ============================================
-- Migration: In-App Notifications + Rate Limit Logs + Email Queue + Scheduled Actions
-- Consolidated migration for all platform enhancements
-- ============================================

-- 1. User Notifications (In-App Bell)
CREATE TABLE IF NOT EXISTS user_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT DEFAULT 'info' CHECK (type IN ('info', 'success', 'warning', 'error')),
  is_read BOOLEAN DEFAULT FALSE,
  action_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_user_notif_user ON user_notifications (user_id, is_read, created_at DESC);

-- 2. Rate Limit Logs
CREATE TABLE IF NOT EXISTS rate_limit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_address TEXT NOT NULL,
  endpoint TEXT,
  blocked BOOLEAN DEFAULT FALSE,
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_ratelimit_ip ON rate_limit_logs (ip_address, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ratelimit_blocked ON rate_limit_logs (blocked, created_at DESC);

-- 3. Email Queue
CREATE TABLE IF NOT EXISTS email_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  to_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'retry')),
  attempts INTEGER DEFAULT 0,
  max_attempts INTEGER DEFAULT 3,
  error_message TEXT,
  scheduled_at TIMESTAMPTZ DEFAULT NOW(),
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_email_queue_status ON email_queue (status, scheduled_at);

-- 4. Scheduled Actions
CREATE TABLE IF NOT EXISTS scheduled_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action_type TEXT NOT NULL,
  entity TEXT,
  entity_id TEXT,
  payload JSONB DEFAULT '{}',
  scheduled_at TIMESTAMPTZ NOT NULL,
  executed_at TIMESTAMPTZ,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'executed', 'cancelled', 'failed')),
  created_by UUID,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_scheduled_status ON scheduled_actions (status, scheduled_at);

-- ============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

-- 5. user_notifications — users can only see their own
ALTER TABLE user_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own notifications"
  ON user_notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications"
  ON user_notifications FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Service role full access on user_notifications"
  ON user_notifications FOR ALL
  USING (auth.role() = 'service_role');

-- 6. rate_limit_logs — admin read-only, service role inserts
ALTER TABLE rate_limit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access on rate_limit_logs"
  ON rate_limit_logs FOR ALL
  USING (auth.role() = 'service_role');

-- 7. email_queue — admin read + update (retry), service role full
ALTER TABLE email_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access on email_queue"
  ON email_queue FOR ALL
  USING (auth.role() = 'service_role');

-- 8. scheduled_actions — admin CRUD, service role for execution
ALTER TABLE scheduled_actions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access on scheduled_actions"
  ON scheduled_actions FOR ALL
  USING (auth.role() = 'service_role');
