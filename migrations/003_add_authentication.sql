-- Migration: Add Firebase Authentication Support
-- This migration updates the users table to support Firebase and adds userId to startups

-- ============================================================================
-- 1. BACKUP EXISTING DATA (if any)
-- ============================================================================
CREATE TABLE IF NOT EXISTS users_backup AS SELECT * FROM users WHERE 1=0;

-- ============================================================================
-- 2. DROP OLD USERS TABLE AND CREATE NEW ONE
-- ============================================================================
DROP TABLE IF EXISTS users CASCADE;

CREATE TABLE users (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
  firebase_uid TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL UNIQUE,
  display_name TEXT,
  photo_url TEXT,
  role TEXT DEFAULT 'analyst',
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  last_login_at TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX idx_users_firebase_uid ON users(firebase_uid);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);

-- ============================================================================
-- 3. ADD USER_ID TO STARTUPS TABLE
-- ============================================================================
-- Add user_id column if it doesn't exist
ALTER TABLE startups ADD COLUMN IF NOT EXISTS user_id VARCHAR REFERENCES users(id);

-- Create index for foreign key
CREATE INDEX IF NOT EXISTS idx_startups_user_id ON startups(user_id);

-- ============================================================================
-- 4. CREATE TRIGGER TO UPDATE UPDATED_AT
-- ============================================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS update_users_updated_at ON users;

-- Create new trigger
CREATE TRIGGER update_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 5. VERIFICATION
-- ============================================================================
-- Verify tables exist
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users') THEN
    RAISE NOTICE '✅ Users table created successfully';
  ELSE
    RAISE EXCEPTION '❌ Users table creation failed';
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'startups' AND column_name = 'user_id') THEN
    RAISE NOTICE '✅ user_id column added to startups';
  ELSE
    RAISE EXCEPTION '❌ user_id column not added to startups';
  END IF;
END $$;

-- Show table structure
\d users

