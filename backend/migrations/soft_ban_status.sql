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
