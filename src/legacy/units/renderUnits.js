// Common legacy helpers used across modules
const esc = (value) => String(value ?? '').replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
const js = (value) => String(value ?? '').replace(/\\/g, '\\\\').replace(/'/g, "\\'");
const sb = () => window.__AIMEASY_SUPABASE__;
const todayKeyDb = (date = new Date()) => date.toISOString().slice(0, 10);
const pctFromCgpa = (cgpa) => Math.max(0, Math.min(100, Number(cgpa || 0) * 9.5));

export async function renderUnits(subj) {
  const grid = document.getElementById('units-grid');
  if (!grid) return;
  grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:3rem;color:var(--text3);"><div style="font-size:3rem;margin-bottom:1rem;">⏳</div><div style="font-weight:700;font-size:1rem;">Loading units...</div></div>';

  let units = [];
  const rawSubjectId = subj.rawId || subj.id.toString().replace('custom_', '');

  if (window.aimeasyFetchUnits) {
    const { data, error } = await window.aimeasyFetchUnits(rawSubjectId);
    if (!error && data) {
      units = data;
    }
  }

  if (!units.length) {
    grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:3rem;color:var(--text3);"><div style="font-size:2.5rem;margin-bottom:0.8rem;">\u{1F4CB}</div><div style="font-weight:700;">No units defined yet</div><div style="font-size:0.82rem;margin-top:4px;">The Sub Admin has not created units for this subject yet.</div></div>';
    return;
  }

  const branch = subj.branch || APP.user?.branch || APP.user?.branch_name || '';
  // Legacy completed topics cache removed – fetching from Supabase directly

  grid.innerHTML = units.map((u, i) => {
    // In Supabase architecture, we don't fetch all nested counts synchronously to keep the list fast
    // These will be detailed inside the unit content view
    const topicCount = 0;
    const vidCount = 0;
    const noteCount = 0;
    const completedCount = 0;
    const pct = 0;
    const firstTopic = 'Click to view content';
    const contentTotal = 'View';

    // Fallbacks for the unit UI structure
    const sortOrder = u.sort_order || (i + 1);
    const title = window.aimeasyUnitLabel ? window.aimeasyUnitLabel(u, sortOrder) : `Unit - ${sortOrder}`;

    return '<div class="unit-card" onclick="openUnit(' + sortOrder + ',\'' + subj.id + '\')" style="animation-delay:' + (i * 0.07) + 's">'
      + '<div class="unit-num">' + sortOrder + '</div>'
      + '<div class="unit-name">' + title + '</div>'
      + '<div class="unit-topics">' + firstTopic + '</div>'
      + '<div style="display:flex;gap:6px;justify-content:center;margin-bottom:10px;flex-wrap:wrap;">'
      + '<span class="badge badge-primary">View Content</span>'
      + '</div>'
      + '<div class="unit-progress-wrap">'
      + '<div style="display:flex;justify-content:space-between;margin-bottom:4px;">'
      + '<span style="font-size:0.72rem;color:var(--text3);">Content</span>'
      + '<span style="font-size:0.72rem;font-weight:700;color:var(--primary);">' + contentTotal + '</span>'
      + '</div>'
      + '<div class="progress-bar"><div class="progress-fill" style="width:' + pct + '%"></div></div>'
      + '</div></div>';
  }).join('');
}
