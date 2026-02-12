-- ============================================
-- Migration: Soft Ban System
-- Adds 'status' column to users table
-- ============================================

-- 1. Add status column (backward compatible — defaults to 'active')
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';

-- 2. Add constraint
ALTER TABLE users
  DROP CONSTRAINT IF EXISTS users_status_check;

ALTER TABLE users
  ADD CONSTRAINT users_status_check
  CHECK (status IN ('active', 'suspended'));

-- 3. Sync existing is_active=false rows to suspended
UPDATE users
  SET status = 'suspended'
  WHERE is_active = false AND (status IS NULL OR status = 'active');

-- 4. Sync existing active rows
UPDATE users
  SET status = 'active'
  WHERE is_active = true AND status IS NULL;
