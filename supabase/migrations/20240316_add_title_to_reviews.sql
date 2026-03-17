
-- Add title column to channel_reviews
ALTER TABLE channel_reviews ADD COLUMN IF NOT EXISTS title TEXT;
