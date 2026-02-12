-- ============================================
-- Migration: Soft Ban System
-- Adds 'status' column to profiles table
-- ============================================

-- 1. Add status column (backward compatible — defaults to 'active')
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';

-- 2. Add constraint
ALTER TABLE profiles
  DROP CONSTRAINT IF EXISTS profiles_status_check;

ALTER TABLE profiles
  ADD CONSTRAINT profiles_status_check
  CHECK (status IN ('active', 'suspended'));

-- 3. Sync existing is_active=false rows to suspended
UPDATE profiles
  SET status = 'suspended'
  WHERE is_active = false AND (status IS NULL OR status = 'active');

-- 4. Sync existing active rows
UPDATE profiles
  SET status = 'active'
  WHERE is_active = true AND status IS NULL;
