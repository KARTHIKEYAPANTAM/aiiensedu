import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || '';
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function check() {
  // Check tables
  const { data: tables, error: tablesErr } = await supabase.rpc('get_tables');
  // Wait, if get_tables doesn't exist, let's try querying information_schema
  const { data: cols, error: colsErr } = await supabase
    .from('subjects')
    .select('*')
    .limit(1);
  
  console.log('subjects sample:', cols);

  // Let's try to query other tables to see if they exist
  const checkTable = async (name) => {
    try {
      const { data, error } = await supabase.from(name).select('*').limit(1);
      if (error) {
        console.log(`Table ${name} check failed:`, error.message);
      } else {
        console.log(`Table ${name} columns:`, Object.keys(data[0] || {}), 'row count:', data.length);
      }
    } catch (e) {
      console.log(`Table ${name} error:`, e.message);
    }
  };

  await checkTable('sub_admin_accounts');
  await checkTable('skills');
  await checkTable('files');
  await checkTable('subjects');
  await checkTable('content_items');
  await checkTable('topics');
  await checkTable('topic_videos');
  await checkTable('profiles');
}
check();
