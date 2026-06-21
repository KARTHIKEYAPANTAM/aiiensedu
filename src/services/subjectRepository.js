import { supabase } from './supabase.service.js';

export async function getSubjects(filters = {}) {
    let query = supabase.from('subjects').select('*');

    // Apply filters if they are provided
    if (filters.created_by_subadmin_id) {
        query = query.eq('created_by_subadmin_id', filters.created_by_subadmin_id);
    }
    if (filters.branch) {
        query = query.eq('branch', filters.branch);
    }
    if (filters.semester) {
        query = query.eq('semester', filters.semester);
    }
    if (filters.regulation_code) {
        query = query.eq('regulation_code', filters.regulation_code);
    }
    if (filters.university_name) {
        query = query.eq('university_name', filters.university_name);
    }
    if (filters.status) {
        query = query.eq('status', filters.status);
    }

    // Apply a default, consistent ordering
    query = query.order('name', { ascending: true });

    const { data, error } = await query;

    if (error) {
        console.error('Error fetching subjects:', error);
        // Return a standard object to avoid breaking destructuring on the caller side
        return { data: [], error };
    }
    
    // Ensure data is always an array
    return { data: data || [], error: null };
}


export async function getSubjectById(id) {
  const { data, error } = await supabase.from('subjects').select('*').eq('id', id).single();
  if (error) {
    console.error(`Error fetching subject with id ${id}:`, error);
    return null;
  }
  return data;
}

export async function createSubject(subjectData) {
  const { data, error } = await supabase.from('subjects').insert(subjectData).select().single();
  if (error) {
    console.error('Error creating subject:', error);
    return null;
  }
  return data;
}

export async function updateSubject(id, subjectData) {
  const { data, error } = await supabase.from('subjects').update(subjectData).eq('id', id).select().single();
  if (error) {
    console.error(`Error updating subject with id ${id}:`, error);
    return null;
  }
  return data;
}

export async function deleteSubject(id) {
  const { error } = await supabase.from('subjects').delete().eq('id', id);
  if (error) {
    console.error(`Error deleting subject with id ${id}:`, error);
    return false;
  }
  return true;
}
