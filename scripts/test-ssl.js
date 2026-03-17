const { Client } = require('pg');

const connectionString = 'postgresql://postgres:Samir_1155!@aws-0-eu-central-1.pooler.supabase.com:5432/postgres';

async function setupDatabase() {
  const client = new Client({
    connectionString: connectionString,
    ssl: { rejectUnauthorized: false }, // Try with SSL
    connectionTimeoutMillis: 10000,
  });

  try {
    await client.connect();
    console.log('Connected with SSL!');
    // ...
  } catch (err) {
    console.error('Connection failed:', err.message);
  } finally {
    await client.end();
  }
}
setupDatabase();
