const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://hprjpwfvfviagckihfvv.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhwcmpwd2Z2ZnZpYWdja2loZnZ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMxNDQwNjMsImV4cCI6MjA4ODcyMDA2M30.DvVI9IL09oHpj9W7mLqI1Zs3-Ca9pJtAeXaZ19ESlUE';

const supabase = createClient(supabaseUrl, supabaseKey);

async function seedData() {
  console.log('Inserting/Updating profiles via Supabase API (Port 443)...');

  const profiles = [
    {
      username: 'Adam_Grant',
      full_name: 'Adam Grant',
      avatar_url: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=250',
      cover_url: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=1200',
      bio: 'Organizational psychologist @Wharton. #1 NYT bestselling author of THINK AGAIN and HIDDEN POTENTIAL. TED speaker.',
      work_info: 'Psychologist • Wharton School',
      role: 'Leadership, Psychology, HR',
      followers_count: 1200000,
      posts_count: 42,
      karma: 45000
    },
    {
      username: 'Erica_Rivera',
      full_name: 'Erica Rivera',
      avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=250',
      cover_url: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&q=80&w=1200',
      bio: 'Ex-Google Recruiter. Career Strategist and Talent Acquisition Specialist. Helping thousands land their dream roles.',
      work_info: 'Talent Acquisition • Ex-Google',
      role: 'Recruitment, Coaching, Strategy',
      followers_count: 85000,
      posts_count: 128,
      karma: 12000
    },
    {
      username: 'Samir_Miriyev',
      full_name: 'Samir Miriyev',
      avatar_url: '/profile.png',
      cover_url: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?auto=format&fit=crop&q=80&w=1200',
      bio: 'Software Engineer & Product Maker. Building the future of professional communities at Jobin.',
      work_info: 'Software Engineer • Jobin Corp',
      role: 'Fullstack, React, Next.js',
      followers_count: 4800,
      posts_count: 12,
      karma: 2400
    }
  ];

  for (const profile of profiles) {
    const { data, error } = await supabase
      .from('profiles')
      .upsert(profile, { onConflict: 'username' });

    if (error) {
      console.error(`Error Upserting ${profile.username}:`, error.message);
    } else {
      console.log(`Successfully Updated: ${profile.username}`);
    }
  }

  // Seed default bowl
  const { error: bowlError } = await supabase
    .from('bowls')
    .upsert({ name: 'Salaries in HR', icon_url: 'https://img.naukimg.com/logo_images/groups/v1/4630125.gif' }, { onConflict: 'name' });

  if (bowlError) {
    console.error('Error seeding bowl:', bowlError.message);
  } else {
    console.log('Successfully Seeded: Salaries in HR bowl');
  }
}

seedData();
