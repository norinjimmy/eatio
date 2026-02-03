-- Migration: Add linked accounts support
-- Allows users to share full access to their account with another user

-- Add shared_with_user_id column to track if a user is linked to another account
ALTER TABLE users ADD COLUMN shared_with_user_id TEXT REFERENCES users(id);

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_shared_with ON users(shared_with_user_id);
