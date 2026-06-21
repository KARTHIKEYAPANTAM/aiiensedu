// Common legacy helpers used across modules
const esc = (value) => String(value ?? '').replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
const js = (value) => String(value ?? '').replace(/\\/g, '\\\\').replace(/'/g, "\\'");
const sb = () => window.__AIMEASY_SUPABASE__;
const todayKeyDb = (date = new Date()) => date.toISOString().slice(0, 10);
const pctFromCgpa = (cgpa) => Math.max(0, Math.min(100, Number(cgpa || 0) * 9.5));

export function switchSemester(val) {


  // UPDATE: rebuild the sem switcher to preserve selection, then render subjects
  buildSemSwitcher(val);
  renderSubjects(val);
  showToast(`Switched to Semester ${val}`, 'blue');
}

export function buildSemSwitcher(selectedOverride) {
  const user = APP.user || {};
  // Subject dashboard always shows ALL 8 semesters regardless of user's year
  const allSems = ['1-1', '1-2', '2-1', '2-2', '3-1', '3-2', '4-1', '4-2'];
  const sw = document.getElementById('sem-switcher');
  if (!sw) return;
  const cur = selectedOverride || user.semester || '3-1';
  sw.innerHTML = allSems.map(s => `<option value="${s}" ${s === cur ? 'selected' : ''}>${s}</option>`).join('');
}
