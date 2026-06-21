import fs from 'node:fs/promises';
import path from 'node:path';
import { createClient } from '@supabase/supabase-js';

const envPath = path.resolve('.env.local');
const raw = await fs.readFile(envPath, 'utf8');
const env = {};
for (const line of raw.split(/\r?\n/)) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) continue;
  const idx = trimmed.indexOf('=');
  if (idx === -1) continue;
  const key = trimmed.slice(0, idx).trim();
  const value = trimmed.slice(idx + 1).trim().replace(/^['\"]|['\"]$/g, '');
  env[key] = value;
}

const client = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);

const testCases = [
  { username: 'sam', password: 'sam@123' },
  { username: 'phani', password: '123456' },
  { username: 'shyam', password: '123456' },
];

for (const { username, password } of testCases) {
  const { data, error } = await client
    .from('sub_admin_accounts')
    .select('username,password,status')
    .eq('username', username)
    .eq('password', password)
    .eq('status', 'active');

  console.log('\n=== TEST CASE username=' + username + ' password=' + password + ' ===');
  console.log('error:', JSON.stringify(error, null, 2));
  console.log('data:', JSON.stringify(data, null, 2));
}

const { data: allRows, error: allError } = await client
  .from('sub_admin_accounts')
  .select('username,password,status');

console.log('\n=== ALL ROWS ===');
console.log('allError:', JSON.stringify(allError, null, 2));
console.log('allRows:', JSON.stringify(allRows, null, 2));

const { data: dupRows, error: dupError } = await client
  .from('sub_admin_accounts')
  .select('username');

console.log('\n=== DUPLICATE CHECK ===');
console.log('dupError:', JSON.stringify(dupError, null, 2));
if (!dupError && dupRows) {
  const counts = new Map();
  for (const row of dupRows) {
    counts.set(row.username, (counts.get(row.username) || 0) + 1);
  }
  console.log(JSON.stringify([...counts.entries()].filter(([, count]) => count > 1), null, 2));
}
