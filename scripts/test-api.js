const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://hprjpwfvfviagckihfvv.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhwcmpwd2Z2ZnZpYWdja2loZnZ2Iiwicm9sZSI6Imhwcmpwd2Z2ZnZpYWdja2loZnZ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMxNDQwNjMsImV4cCI6MjA4ODcyMDA2M30.DvVI9IL09oHpj9W7mLqI1Zs3-Ca9pJtAeXaZ19ESlUE';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTables() {
  console.log('Checking visible tables...');
  const { data, error } = await supabase
    .from('profiles')
    .select('username')
    .limit(1);

  if (error) {
    console.error('Error selecting from profiles:', error.message);
  } else {
    console.log('Profiles table is visible. Data:', data);
  }
}

checkTables();
