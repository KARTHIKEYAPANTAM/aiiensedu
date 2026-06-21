import { createClient } from '@supabase/supabase-js';
import WebSocket from 'ws';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const envFile = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '.env.local');
const TEST_SUBJECT_CODE = 'RLS101';

function parseEnv(filePath) {
  const text = fs.readFileSync(filePath, 'utf8');
  return Object.fromEntries(
    text
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith('#'))
      .map((line) => {
        const [key, ...rest] = line.split('=');
        let value = rest.join('=');
        value = value.trim();
        if ((value.startsWith("'") && value.endsWith("'")) || (value.startsWith('"') && value.endsWith('"'))) {
          value = value.slice(1, -1);
        }
        return [key.trim(), value];
      })
  );
}

const env = parseEnv(envFile);
const url = env.VITE_SUPABASE_URL;
const anonKey = env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(url, anonKey, {
  realtime: { transport: WebSocket },
});

async function main() {
  console.log('--- TESTING ANON SELECT (curriculum read) ---');
  const { data: selectData, error: selectError } = await supabase.from('subjects').select('id').limit(5);
  if (selectError) {
    throw new Error(
      `SELECT failed: ${selectError.message}. Apply supabase/migrations/20260621000000_curriculum_table_grants.sql in Supabase SQL Editor.`,
    );
  }
  console.log('SELECT success:', true);
  console.log('SELECT count:', selectData ? selectData.length : 0);

  console.log('\n--- TESTING ANON INSERT (expect policy/permission block) ---');
  const { error: insertError } = await supabase.from('subjects').insert({
    name: 'RLS Test Subject',
    code: TEST_SUBJECT_CODE,
    semester: '1-2',
    branch: 'CSE',
    regulation_code: 'R23',
    university_name: 'JNTUK',
    created_by: 'student',
  });
  if (insertError) {
    console.log('INSERT blocked as expected for anon:', insertError.message);
  } else {
    await supabase.from('subjects').delete().eq('code', TEST_SUBJECT_CODE);
    console.log('INSERT unexpectedly succeeded for anon');
  }
}

main().catch(console.error);
