const { Client } = require('pg');

// Using port 6543 (PgBouncer) which might be more stable in some networks
const connectionString = 'postgresql://postgres:Samir_1155!@aws-0-eu-central-1.pooler.supabase.com:6543/postgres';

async function setupDatabase() {
  const client = new Client({
    connectionString: connectionString,
    connectionTimeoutMillis: 15000,
  });

  try {
    await client.connect();
    console.log('Connected to Supabase PostgreSQL (via PgBouncer)');

    const schemaAndSeed = `
      -- 1. Ensure Profiles table exists with correct columns
      CREATE TABLE IF NOT EXISTS profiles (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        username TEXT UNIQUE NOT NULL,
        full_name TEXT,
        avatar_url TEXT,
        cover_url TEXT,
        bio TEXT,
        work_info TEXT,
        role TEXT DEFAULT 'candidate',
        posts_count INTEGER DEFAULT 0,
        followers_count INTEGER DEFAULT 0,
        following_count INTEGER DEFAULT 0,
        karma INTEGER DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
      );

      -- Add missing columns if they don't exist (safety for manual runs)
      DO $$ 
      BEGIN 
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='cover_url') THEN
          ALTER TABLE profiles ADD COLUMN cover_url TEXT;
        END IF;
      END $$;

      -- 2. Ensure Bowls table exists
      CREATE TABLE IF NOT EXISTS bowls (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT UNIQUE NOT NULL,
        icon_url TEXT,
        members_count INTEGER DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
      );

      -- 3. Ensure Posts table exists
      CREATE TABLE IF NOT EXISTS posts (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        author_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
        bowl_id UUID REFERENCES bowls(id) ON DELETE SET NULL,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        likes_count INTEGER DEFAULT 0,
        comments_count INTEGER DEFAULT 0,
        tags TEXT[],
        created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
      );

      -- 4. Seed perfect profiles
      INSERT INTO profiles (username, full_name, avatar_url, cover_url, bio, work_info, role, followers_count, posts_count, karma)
      VALUES 
      (
        'Adam_Grant', 'Adam Grant', 
        'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=250', 
        'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=1200',
        'Organizational psychologist @Wharton. #1 NYT bestselling author.', 'Psychologist • Wharton School', 'Leadership, Psychology, HR', 1200000, 42, 45000
      ),
      (
        'Erica_Rivera', 'Erica Rivera', 
        'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=250', 
        'https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&q=80&w=1200',
        'Ex-Google Recruiter. Career Strategist and Talent Acquisition Specialist.', 'Talent Acquisition • Ex-Google', 'Recruitment, Coaching, Strategy', 85000, 128, 12000
      ),
      (
        'Samir_Miriyev', 'Samir Miriyev', 
        '/profile.png', 
        'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?auto=format&fit=crop&q=80&w=1200',
        'Software Engineer & Product Maker. Building Jobin.', 'Software Engineer • Jobin Corp', 'Fullstack, React, Next.js', 4800, 12, 2400
      )
      ON CONFLICT (username) DO UPDATE SET
        full_name = EXCLUDED.full_name, avatar_url = EXCLUDED.avatar_url, cover_url = EXCLUDED.cover_url,
        bio = EXCLUDED.bio, work_info = EXCLUDED.work_info, role = EXCLUDED.role,
        followers_count = EXCLUDED.followers_count, posts_count = EXCLUDED.posts_count, karma = EXCLUDED.karma;

      -- Seed a default bowl
      INSERT INTO bowls (name, icon_url)
      VALUES ('Salaries in HR', 'https://img.naukimg.com/logo_images/groups/v1/4630125.gif')
      ON CONFLICT (name) DO NOTHING;
    `;

    await client.query(schemaAndSeed);
    console.log('Database schema ensured and profiles seeded successfully!');

  } catch (err) {
    console.error('Error during setup:', err.message);
  } finally {
    await client.end();
  }
}

setupDatabase();
