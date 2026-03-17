-- RLS Policies for Messages
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Fix Follows Table Schema for Channel following
DO $$ 
BEGIN 
    -- Make following_id nullable to allow following channels
    ALTER TABLE follows ALTER COLUMN following_id DROP NOT NULL;
    
    -- Ensure channel columns exist
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'follows' AND COLUMN_NAME = 'follower_channel_id') THEN
        ALTER TABLE follows ADD COLUMN follower_channel_id UUID REFERENCES channels(id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'follows' AND COLUMN_NAME = 'following_channel_id') THEN
        ALTER TABLE follows ADD COLUMN following_channel_id UUID REFERENCES channels(id);
    END IF;
END $$;

DROP POLICY IF EXISTS "Users can view their own messages" ON messages;
CREATE POLICY "Users can view their own messages" ON messages
FOR SELECT USING (
    auth.uid() = sender_id OR 
    auth.uid() = receiver_id OR
    sender_channel_id IN (SELECT id FROM channels WHERE owner_id = auth.uid()) OR
    receiver_channel_id IN (SELECT id FROM channels WHERE owner_id = auth.uid())
);

DROP POLICY IF EXISTS "Users can insert their own messages" ON messages;
CREATE POLICY "Users can insert their own messages" ON messages
FOR INSERT WITH CHECK (
    (sender_id = auth.uid() AND sender_channel_id IS NULL) OR
    (sender_channel_id IN (SELECT id FROM channels WHERE owner_id = auth.uid()) AND sender_id IS NULL)
);

-- RLS Policies for Follows (Fixing for channels)
ALTER TABLE follows ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Follows are publicly viewable" ON follows;
CREATE POLICY "Follows are publicly viewable" ON follows
FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can follow" ON follows;
CREATE POLICY "Users can follow" ON follows
FOR INSERT WITH CHECK (
    (follower_id = auth.uid() AND follower_channel_id IS NULL) OR
    (follower_channel_id IN (SELECT id FROM channels WHERE owner_id = auth.uid()) AND follower_id IS NULL)
);

DROP POLICY IF EXISTS "Users can unfollow" ON follows;
CREATE POLICY "Users can unfollow" ON follows
FOR DELETE USING (
    (follower_id = auth.uid()) OR
    (follower_channel_id IN (SELECT id FROM channels WHERE owner_id = auth.uid()))
);
