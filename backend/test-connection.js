const { Client } = require('pg');
require('dotenv').config();

const originalUrl = process.env.DATABASE_URL;
// Parse URL manually or use URL object
const url = new URL(originalUrl);

const configs = [
  { name: 'Original', connectionString: originalUrl },
  { name: 'Port 6543', connectionString: originalUrl.replace(':5432', ':6543') },
  { name: 'User postgres (Direct)', connectionString: originalUrl.replace('postgres.tytokabhxhhdkogugdok', 'postgres') },
  { name: 'User postgres + Port 6543', connectionString: originalUrl.replace('postgres.tytokabhxhhdkogugdok', 'postgres').replace(':5432', ':6543') }
];

async function test(config) {
  const client = new Client({
    connectionString: config.connectionString,
    ssl: { rejectUnauthorized: false }
  });
  try {
    console.log(`Testing ${config.name}...`);
    await client.connect();
    console.log(`✅ ${config.name} Connected successfully!`);
    await client.end();
    return true;
  } catch (err) {
    console.log(`❌ ${config.name} Failed: ${err.message}`);
    return false;
  }
}

async function run() {
  for (const config of configs) {
    if (await test(config)) break;
  }
}

run();
