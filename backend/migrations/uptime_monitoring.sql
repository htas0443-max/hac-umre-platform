-- ============================================
-- Migration: SLA Monitoring + Uptime Logs
-- ============================================

CREATE TABLE IF NOT EXISTS uptime_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  checked_at TIMESTAMPTZ DEFAULT NOW(),
  status TEXT NOT NULL CHECK (status IN ('ok', 'error')),
  response_time_ms INTEGER,
  db_ok BOOLEAN DEFAULT FALSE,
  auth_ok BOOLEAN DEFAULT FALSE,
  error_message TEXT,
  consecutive_failures INTEGER DEFAULT 0
);

-- Index for fast SLA queries
CREATE INDEX IF NOT EXISTS idx_uptime_logs_checked_at ON uptime_logs (checked_at DESC);
CREATE INDEX IF NOT EXISTS idx_uptime_logs_status ON uptime_logs (status);
