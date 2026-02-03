-- Supabase migration: Add linked accounts support
-- Run this in Supabase SQL Editor

-- Add shared_with_user_id to users metadata
-- Since users table is managed by Supabase Auth, we store this in user metadata
-- This will be handled via Supabase Admin API instead

-- Create a new table to track account links
CREATE TABLE IF NOT EXISTS account_links (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  primary_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  secondary_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(secondary_user_id) -- A user can only be linked to one primary account
);

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_account_links_primary ON account_links(primary_user_id);
CREATE INDEX IF NOT EXISTS idx_account_links_secondary ON account_links(secondary_user_id);

-- Enable RLS
ALTER TABLE account_links ENABLE ROW LEVEL SECURITY;

-- Policy: Users can see links where they are either primary or secondary
CREATE POLICY "Users can view their own account links"
  ON account_links FOR SELECT
  USING (
    auth.uid() = primary_user_id OR 
    auth.uid() = secondary_user_id
  );

-- Policy: Only primary users can create links
CREATE POLICY "Primary users can create links"
  ON account_links FOR INSERT
  WITH CHECK (auth.uid() = primary_user_id);

-- Policy: Only primary users can delete links
CREATE POLICY "Primary users can delete links"
  ON account_links FOR DELETE
  USING (auth.uid() = primary_user_id);
