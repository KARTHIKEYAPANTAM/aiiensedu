// Common legacy helpers used across modules
const esc = (value) => String(value ?? '').replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
const js = (value) => String(value ?? '').replace(/\\/g, '\\\\').replace(/'/g, "\\'");
const sb = () => window.__AIMEASY_SUPABASE__;
const todayKeyDb = (date = new Date()) => date.toISOString().slice(0, 10);
const pctFromCgpa = (cgpa) => Math.max(0, Math.min(100, Number(cgpa || 0) * 9.5));

export const GRADES = { O: 10, 'A+': 9, A: 8, 'B+': 7, B: 6, C: 5, F: 0 };
const DEFAULT_SUBJECTS = ['Data Structures', 'Operating Systems', 'DBMS', 'Computer Networks', 'Software Engineering'];

export function loadCalcState() {
  try {
    const saved = localStorage.getItem('edusync_cgpa_data');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed && Array.isArray(parsed.calcSemesters) && parsed.calcSemesters.length) {
        APP.calcSemesters = parsed.calcSemesters;
        APP.currentSemId = parsed.currentSemId || parsed.calcSemesters[0].id;
        console.log('CGPA loaded', parsed);
        return true;
      }
    }
  } catch (e) {
    console.warn('Failed to load CGPA calculator state:', e);
  }
  return false;
}
