
-- 1. Ensure 'follows' table can handle all cross-identity scenarios
DO $$ 
BEGIN 
    ALTER TABLE follows ALTER COLUMN following_id DROP NOT NULL;
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'follows' AND COLUMN_NAME = 'follower_channel_id') THEN
        ALTER TABLE follows ADD COLUMN follower_channel_id UUID REFERENCES channels(id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'follows' AND COLUMN_NAME = 'following_channel_id') THEN
        ALTER TABLE follows ADD COLUMN following_channel_id UUID REFERENCES channels(id);
    END IF;
END $$;

-- 2. TRIGGER FUNCTION: Update Counts for Profiles and Channels
CREATE OR REPLACE FUNCTION update_follow_counts()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'INSERT') THEN
        -- Increment Followers
        IF NEW.following_id IS NOT NULL THEN
            UPDATE profiles SET followers_count = followers_count + 1 WHERE id = NEW.following_id;
        ELSIF NEW.following_channel_id IS NOT NULL THEN
            UPDATE channels SET followers_count = followers_count + 1 WHERE id = NEW.following_channel_id;
        END IF;

        -- Increment Following
        IF NEW.follower_id IS NOT NULL THEN
            UPDATE profiles SET following_count = following_count + 1 WHERE id = NEW.follower_id;
        ELSIF NEW.follower_channel_id IS NOT NULL THEN
            UPDATE channels SET following_count = following_count + 1 WHERE id = NEW.follower_channel_id;
        END IF;

    ELSIF (TG_OP = 'DELETE') THEN
        -- Decrement Followers
        IF OLD.following_id IS NOT NULL THEN
            UPDATE profiles SET followers_count = GREATEST(0, followers_count - 1) WHERE id = OLD.following_id;
        ELSIF OLD.following_channel_id IS NOT NULL THEN
            UPDATE channels SET followers_count = GREATEST(0, followers_count - 1) WHERE id = OLD.following_channel_id;
        END IF;

        -- Decrement Following
        IF OLD.follower_id IS NOT NULL THEN
            UPDATE profiles SET following_count = GREATEST(0, following_count - 1) WHERE id = OLD.follower_id;
        ELSIF OLD.follower_channel_id IS NOT NULL THEN
            UPDATE channels SET following_count = GREATEST(0, following_count - 1) WHERE id = OLD.follower_channel_id;
        END IF;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- 3. APPLY TRIGGER to 'follows' table
DROP TRIGGER IF EXISTS trg_update_follow_counts ON follows;
CREATE TRIGGER trg_update_follow_counts
AFTER INSERT OR DELETE ON follows
FOR EACH ROW EXECUTE FUNCTION update_follow_counts();

-- 4. ENABLE REALTIME for messages
-- Note: This is usually done in the Supabase Dashboard, but this SQL enables it via the pub/sub system
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE messages;
  END IF;
END $$;

-- 5. RE-APPLY RLS POLICIES (Comprehensive)
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE follows ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own messages" ON messages;
CREATE POLICY "Users can view their own messages" ON messages FOR SELECT USING (
    auth.uid() = sender_id OR auth.uid() = receiver_id OR
    sender_channel_id IN (SELECT id FROM channels WHERE owner_id = auth.uid()) OR
    receiver_channel_id IN (SELECT id FROM channels WHERE owner_id = auth.uid())
);

DROP POLICY IF EXISTS "Users can insert their own messages" ON messages;
CREATE POLICY "Users can insert their own messages" ON messages FOR INSERT WITH CHECK (
    (sender_id = auth.uid() AND sender_channel_id IS NULL) OR
    (sender_channel_id IN (SELECT id FROM channels WHERE owner_id = auth.uid()) AND sender_id IS NULL)
);

DROP POLICY IF EXISTS "Follows are publicly viewable" ON follows;
CREATE POLICY "Follows are publicly viewable" ON follows FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can follow" ON follows;
CREATE POLICY "Users can follow" ON follows FOR INSERT WITH CHECK (
    (follower_id = auth.uid() AND follower_channel_id IS NULL) OR
    (follower_channel_id IN (SELECT id FROM channels WHERE owner_id = auth.uid()) AND follower_id IS NULL)
);

DROP POLICY IF EXISTS "Users can unfollow" ON follows;
CREATE POLICY "Users can unfollow" ON follows FOR DELETE USING (
    (follower_id = auth.uid()) OR (follower_channel_id IN (SELECT id FROM channels WHERE owner_id = auth.uid()))
);
