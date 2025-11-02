-- Add user_email column to startups table for easy identification
-- This is denormalized but makes it much easier to see who owns what in the database

-- Add user_email column to startups table
ALTER TABLE startups ADD COLUMN user_email TEXT;

-- Create index for faster lookups
CREATE INDEX idx_startups_user_email ON startups(user_email);

-- Backfill existing records with email from users table
UPDATE startups 
SET user_email = users.email
FROM users
WHERE startups.user_id = users.id
  AND startups.user_email IS NULL;

-- Add comment for documentation
COMMENT ON COLUMN startups.user_email IS 'Denormalized email for easy identification - synced from users.email';

