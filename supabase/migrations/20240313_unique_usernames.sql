-- Function to check username uniqueness across profiles and channels (case-insensitive)
CREATE OR REPLACE FUNCTION check_username_across_tables()
RETURNS TRIGGER AS $$
BEGIN
    -- If we are in channels table, check profiles
    IF TG_TABLE_NAME = 'channels' THEN
        IF EXISTS (
            SELECT 1 FROM profiles 
            WHERE LOWER(username) = LOWER(NEW.username)
        ) THEN
            RAISE EXCEPTION 'Username "%" is already taken by a personal profile.', NEW.username;
        END IF;
    END IF;

    -- If we are in profiles table, check channels
    IF TG_TABLE_NAME = 'profiles' THEN
        IF EXISTS (
            SELECT 1 FROM channels 
            WHERE LOWER(username) = LOWER(NEW.username)
        ) THEN
            RAISE EXCEPTION 'Username "%" is already taken by a channel.', NEW.username;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for channels table
DROP TRIGGER IF EXISTS trg_check_channel_username ON channels;
CREATE TRIGGER trg_check_channel_username
BEFORE INSERT OR UPDATE OF username ON channels
FOR EACH ROW EXECUTE FUNCTION check_username_across_tables();

-- Trigger for profiles table
DROP TRIGGER IF EXISTS trg_check_profile_username ON profiles;
CREATE TRIGGER trg_check_profile_username
BEFORE INSERT OR UPDATE OF username ON profiles
FOR EACH ROW EXECUTE FUNCTION check_username_across_tables();

-- Bonus: Ensure case-insensitive uniqueness within each table as well
-- (Postgres default UNIQUE is case-sensitive)
DROP INDEX IF EXISTS idx_profiles_username_lower;
CREATE UNIQUE INDEX idx_profiles_username_lower ON profiles (LOWER(username));

DROP INDEX IF EXISTS idx_channels_username_lower;
CREATE UNIQUE INDEX idx_channels_username_lower ON channels (LOWER(username));
