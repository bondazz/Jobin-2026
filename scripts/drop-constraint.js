const { Client } = require('pg');

const connectionString = 'postgresql://postgres:Samir_1155!@aws-0-eu-central-1.pooler.supabase.com:6543/postgres';

async function fixDatabase() {
    const client = new Client({
        connectionString: connectionString,
        connectionTimeoutMillis: 30000,
    });

    try {
        await client.connect();
        console.log('Connected...');
        await client.query('ALTER TABLE channel_reviews DROP CONSTRAINT IF EXISTS channel_reviews_channel_id_author_id_key;');
        console.log('DONE!');
    } catch (err) {
        console.error('ERROR:', err.message);
    } finally {
        await client.end();
    }
}

fixDatabase();
