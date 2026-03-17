const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://hprjpwfvfviagckihfvv.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhwcmpwd2Z2ZnZpYWdja2loZnZ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMxNDQwNjMsImV4cCI6MjA4ODcyMDA2M30.DvVI9IL09oHpj9W7mLqI1Zs3-Ca9pJtAeXaZ19ESlUE';

const supabase = createClient(supabaseUrl, supabaseKey);

async function inspectSchema() {
  console.log('Inspecting profiles table columns...');
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .limit(1);

  if (error) {
    console.error('Error:', error.message);
  } else {
    console.log('Columns found:', data.length > 0 ? Object.keys(data[0]) : 'No data, but table exists');
  }
}

inspectSchema();
