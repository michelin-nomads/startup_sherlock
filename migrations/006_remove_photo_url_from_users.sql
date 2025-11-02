-- Remove photo_url column from users table
-- Reason: Not needed - we'll use initials avatar instead

ALTER TABLE users DROP COLUMN IF EXISTS photo_url;

-- Add comment for documentation
COMMENT ON TABLE users IS 'User accounts - displayName is set from Firebase auth token';

