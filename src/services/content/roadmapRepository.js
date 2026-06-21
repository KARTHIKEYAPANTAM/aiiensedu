import { supabase } from '../supabase/client.js';

/**
 * Fetch roadmap topics for a given subject.
 * Returns an array of rows from `content_items` where content_type = 'roadmap'.
 */
export async function fetchRoadmapBySubject(subjectId, createdBySubadminId = null) {
  if (!supabase) return { data: [], error: new Error('Supabase not configured') };

  let q = supabase
    .from('content_items')
    .select('*')
    .eq('subject_id', subjectId)
    .eq('content_type', 'roadmap');

  // Sub-admin isolation: only return roadmap items created by the same sub-admin.
  if (createdBySubadminId) {
    q = q.eq('created_by_subadmin_id', createdBySubadminId);
  }

  const { data, error } = await q.order('created_at', { ascending: false });
  return { data, error };
}

