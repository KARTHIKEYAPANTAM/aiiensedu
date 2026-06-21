// Common legacy helpers used across modules
const esc = (value) => String(value ?? '').replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
const js = (value) => String(value ?? '').replace(/\\/g, '\\\\').replace(/'/g, "\\'");
const sb = () => window.__AIMEASY_SUPABASE__;
const todayKeyDb = (date = new Date()) => date.toISOString().slice(0, 10);
const pctFromCgpa = (cgpa) => Math.max(0, Math.min(100, Number(cgpa || 0) * 9.5));

export function adminAddFeature() {
  const name = document.getElementById('adm-feature-name')?.value.trim();
  if (!name) { showToast('Enter feature name', 'red'); return; }
  const features = JSON.parse(localStorage.getItem('edusync_features') || '["Videos","Notes","PYQs","Important Questions"]');
  features.push(name);
  localStorage.setItem('edusync_features', JSON.stringify(features));
  document.getElementById('adm-feature-name').value = '';
  renderAdminSection('create');
  showToast('✅ Feature added!', 'green');
}

export function adminDeleteFeature(i) {
  const features = JSON.parse(localStorage.getItem('edusync_features') || '["Videos","Notes","PYQs","Important Questions"]');
  features.splice(i, 1);
  localStorage.setItem('edusync_features', JSON.stringify(features));
  renderAdminSection('create');
  showToast('Feature deleted', 'red');
}

export function adminEditFeature(i) {
  const features = JSON.parse(localStorage.getItem('edusync_features') || '["Videos","Notes","PYQs","Important Questions"]');
  const newName = prompt('Edit feature name:', features[i]);
  if (!newName) return;
  features[i] = newName.trim();
  localStorage.setItem('edusync_features', JSON.stringify(features));
  renderAdminSection('create');
  showToast('✅ Feature updated!', 'green');
}
