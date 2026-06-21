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

function failIfError(label, error) {
  if (error) {
    throw new Error(`${label} failed: ${error.message || JSON.stringify(error)}`);
  }
}

async function main() {
  await supabase
    .from('subjects')
    .delete()
    .eq('code', TEST_SUBJECT_CODE);

  try {
    console.log("--- TESTING SELECT ---");
    const { data: selectData, error: selectError } = await supabase
      .from('subjects')
      .select('*');
    failIfError('SELECT', selectError);
    console.log("SELECT success:", true);
    console.log("SELECT count:", selectData ? selectData.length : 0);

    console.log("\n--- TESTING INSERT ---");
    const { data: insertData, error: insertError } = await supabase
      .from('subjects')
      .insert({
        name: 'RLS Test Subject',
        code: TEST_SUBJECT_CODE,
        semester: '1-2',
        branch: 'CSE',
        regulation_code: 'R23',
        university_name: 'JNTUK',
        created_by: 'student'
      })
      .select()
      .single();
    failIfError('INSERT', insertError);
    if (!insertData?.id) throw new Error('INSERT failed: no subject id returned');
    console.log("INSERT success:", true);
    console.log("INSERT data:", insertData);

    console.log("\n--- TESTING UPDATE ---");
    const { data: updateData, error: updateError } = await supabase
      .from('subjects')
      .update({ name: 'RLS Updated' })
      .eq('id', insertData.id)
      .select()
      .single();
    failIfError('UPDATE', updateError);
    if (updateData?.name !== 'RLS Updated') throw new Error('UPDATE failed: test subject was not updated');
    console.log("UPDATE success:", true);
    console.log("UPDATE data:", updateData);

    console.log("\n--- TESTING DELETE ---");
    const { error: deleteError } = await supabase
      .from('subjects')
      .delete()
      .eq('id', insertData.id);
    failIfError('DELETE', deleteError);
    console.log("DELETE success:", true);
  } finally {
    await supabase
      .from('subjects')
      .delete()
      .eq('code', TEST_SUBJECT_CODE);
  }
}

main().catch(console.error);
