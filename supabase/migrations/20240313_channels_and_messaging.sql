
-- 1. Create Channels Table if not exists
CREATE TABLE IF NOT EXISTS channels (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id UUID REFERENCES profiles(id) NOT NULL,
    name TEXT NOT NULL,
    username TEXT UNIQUE NOT NULL,
    bio TEXT,
    avatar_url TEXT,
    cover_url TEXT,
    website TEXT,
    linkedin TEXT,
    twitter TEXT,
    instagram TEXT,
    followers_count INTEGER DEFAULT 0,
    following_count INTEGER DEFAULT 0,
    posts_count INTEGER DEFAULT 0,
    is_verified BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS on channels
ALTER TABLE channels ENABLE ROW LEVEL SECURITY;

-- Policies for channels
CREATE POLICY "Public channels are viewable by everyone" ON channels FOR SELECT USING (true);
CREATE POLICY "Users can create channels" ON channels FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Owners can update their channels" ON channels FOR UPDATE USING (auth.uid() = owner_id);

-- 2. Update Posts Table to include channel_id
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'posts' AND COLUMN_NAME = 'channel_id') THEN
        ALTER TABLE posts ADD COLUMN channel_id UUID REFERENCES channels(id);
    END IF;
END $$;

-- 3. Update Follows Table for cross-identity following
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'follows' AND COLUMN_NAME = 'follower_channel_id') THEN
        ALTER TABLE follows ADD COLUMN follower_channel_id UUID REFERENCES channels(id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'follows' AND COLUMN_NAME = 'following_channel_id') THEN
        ALTER TABLE follows ADD COLUMN following_channel_id UUID REFERENCES channels(id);
    END IF;
    -- Make follower_id nullable to allow channel-based following
    ALTER TABLE follows ALTER COLUMN follower_id DROP NOT NULL;
END $$;

-- 4. Unified Messaging Table
CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sender_id UUID REFERENCES profiles(id),
    sender_channel_id UUID REFERENCES channels(id),
    receiver_id UUID REFERENCES profiles(id),
    receiver_channel_id UUID REFERENCES channels(id),
    content TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS on messages
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- 5. RPC Functions
CREATE OR REPLACE FUNCTION increment_channel_posts(chan_id UUID)
RETURNS void AS $$
BEGIN
    UPDATE channels
    SET posts_count = posts_count + 1
    WHERE id = chan_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION decrement_channel_posts(chan_id UUID)
RETURNS void AS $$
BEGIN
    UPDATE channels
    SET posts_count = GREATEST(0, posts_count - 1)
    WHERE id = chan_id;
END;
$$ LANGUAGE plpgsql;
