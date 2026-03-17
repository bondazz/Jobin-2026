-- Add facebook column to channels table
ALTER TABLE channels ADD COLUMN IF NOT EXISTS facebook TEXT;
