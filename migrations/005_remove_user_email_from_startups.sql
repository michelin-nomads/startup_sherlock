-- Remove user_email column from startups table
-- Reason: Denormalized data - email should only be in users table
-- We can always get email via JOIN with users table

-- Drop index first
DROP INDEX IF EXISTS idx_startups_user_email;

-- Drop column
ALTER TABLE startups DROP COLUMN IF EXISTS user_email;

-- Add comment for documentation
COMMENT ON COLUMN startups.user_id IS 'Foreign key to users.id - use JOIN to get user email';

