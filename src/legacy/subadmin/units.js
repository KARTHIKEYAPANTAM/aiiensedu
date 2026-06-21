// Common legacy helpers used across modules
const esc = (value) => String(value ?? '').replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
const js = (value) => String(value ?? '').replace(/\\/g, '\\\\').replace(/'/g, "\\'");
const sb = () => window.__AIMEASY_SUPABASE__;
const todayKeyDb = (date = new Date()) => date.toISOString().slice(0, 10);
const pctFromCgpa = (cgpa) => Math.max(0, Math.min(100, Number(cgpa || 0) * 9.5));

export function saAddUnit(subjId) {
  const name = prompt('Unit name:', 'Unit ' + (JSON.parse(localStorage.getItem('edusync_units_' + subjId) || '[]').length + 1));
  if (!name) return;
  const units = JSON.parse(localStorage.getItem('edusync_units_' + subjId) || '[]');
  const newId = units.length ? Math.max(...units.map(u => u.id)) + 1 : 1;
  units.push({ id: newId, name, topics: [] });
  localStorage.setItem('edusync_units_' + subjId, JSON.stringify(units));
  const subj = JSON.parse(localStorage.getItem('edusync_custom_subjects') || '[]').find(s => s.id === subjId);
  if (subj) renderSAUnitsPage(subj);
  showToast('✅ Unit added!', 'green');
}

export function saEditUnit(subjId, idx) {
  const units = JSON.parse(localStorage.getItem('edusync_units_' + subjId) || '[]');
  if (!units[idx]) return;
  const newName = prompt('Edit unit name:', units[idx].name);
  if (!newName) return;
  units[idx].name = newName;
  localStorage.setItem('edusync_units_' + subjId, JSON.stringify(units));
  const subj = JSON.parse(localStorage.getItem('edusync_custom_subjects') || '[]').find(s => s.id === subjId);
  if (subj) renderSAUnitsPage(subj);
  showToast('✅ Unit updated!', 'green');
}

export function saDeleteUnit(subjId, idx) {
  const units = JSON.parse(localStorage.getItem('edusync_units_' + subjId) || '[]');
  units.splice(idx, 1);
  localStorage.setItem('edusync_units_' + subjId, JSON.stringify(units));
  const subj = JSON.parse(localStorage.getItem('edusync_custom_subjects') || '[]').find(s => s.id === subjId);
  if (subj) renderSAUnitsPage(subj);
  showToast('Unit deleted', 'red');
}
