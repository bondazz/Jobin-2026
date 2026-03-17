-- Add is_verified column to channels table
ALTER TABLE channels ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT false;
