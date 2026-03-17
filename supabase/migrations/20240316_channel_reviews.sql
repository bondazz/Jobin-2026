
-- Create Channel Reviews Table
CREATE TABLE IF NOT EXISTS channel_reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    channel_id UUID REFERENCES channels(id) ON DELETE CASCADE NOT NULL,
    author_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5) NOT NULL,
    content TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(channel_id, author_id) -- One review per user per channel
);

-- Enable RLS
ALTER TABLE channel_reviews ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Reviews are viewable by everyone" ON channel_reviews FOR SELECT USING (true);
CREATE POLICY "Profiles can create reviews" ON channel_reviews FOR INSERT WITH CHECK (
    auth.uid() = author_id AND 
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid())
);
CREATE POLICY "Authors can update their reviews" ON channel_reviews FOR UPDATE USING (auth.uid() = author_id);
CREATE POLICY "Authors can delete their reviews" ON channel_reviews FOR DELETE USING (auth.uid() = author_id);

-- Function to update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_channel_reviews_updated_at
    BEFORE UPDATE ON channel_reviews
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();

-- Add rating columns to channels if they don't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'channels' AND COLUMN_NAME = 'average_rating') THEN
        ALTER TABLE channels ADD COLUMN average_rating DECIMAL(3,2) DEFAULT 0;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'channels' AND COLUMN_NAME = 'reviews_count') THEN
        ALTER TABLE channels ADD COLUMN reviews_count INTEGER DEFAULT 0;
    END IF;
END $$;

-- Function to update channel rating stats
CREATE OR REPLACE FUNCTION update_channel_rating_stats()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'INSERT' OR TG_OP = 'UPDATE') THEN
        UPDATE channels
        SET 
            average_rating = (SELECT AVG(rating) FROM channel_reviews WHERE channel_id = NEW.channel_id),
            reviews_count = (SELECT COUNT(*) FROM channel_reviews WHERE channel_id = NEW.channel_id)
        WHERE id = NEW.channel_id;
    ELSIF (TG_OP = 'DELETE') THEN
        UPDATE channels
        SET 
            average_rating = COALESCE((SELECT AVG(rating) FROM channel_reviews WHERE channel_id = OLD.channel_id), 0),
            reviews_count = (SELECT COUNT(*) FROM channel_reviews WHERE channel_id = OLD.channel_id)
        WHERE id = OLD.channel_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_review_change
    AFTER INSERT OR UPDATE OR DELETE ON channel_reviews
    FOR EACH ROW
    EXECUTE PROCEDURE update_channel_rating_stats();
