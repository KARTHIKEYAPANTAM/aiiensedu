// Common legacy helpers used across modules
const esc = (value) => String(value ?? '').replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
const js = (value) => String(value ?? '').replace(/\\/g, '\\\\').replace(/'/g, "\\'");
const sb = () => window.__AIMEASY_SUPABASE__;
const todayKeyDb = (date = new Date()) => date.toISOString().slice(0, 10);
const pctFromCgpa = (cgpa) => Math.max(0, Math.min(100, Number(cgpa || 0) * 9.5));

export async function renderPYQ(filterYear, subjectId, unitNum) {
  const listEl = document.getElementById('pyq-list');
  if (!listEl) return;
  listEl.innerHTML = '<div style="text-align:center;padding:3rem;color:var(--text3);"><div style="font-size:3rem;margin-bottom:1rem;">⏳</div><div style="font-weight:600;">Loading questions...</div></div>';

  const subjectName = APP.currentSubject?.name || '';
  const uNum = unitNum || APP.currentUnit || 1;
  const subject = APP.currentSubject;
  let customPYQs = [];

  if (window.aimeasyFetchUnitRoadmap && window.aimeasyListContent && subject) {
    const ctx = await window.aimeasyFetchUnitRoadmap({
      subject,
      unit: { id: uNum, name: `Unit ${uNum}`, dbUnitId: subject?.dbUnitIds?.[uNum] },
    });
    if (ctx?.data?.subjectId && ctx?.data?.unitId) {
      const { data } = await window.aimeasyListContent({ subjectId: ctx.data.subjectId, unitId: ctx.data.unitId, contentType: 'pyq' });
      if (data) {
        customPYQs = data.map(p => {
          const meta = p.metadata || {};
          return {
            q: p.title || p.body || 'Untitled Question',
            year: String(meta.year || '2024'),
            count: parseInt(meta.count) || 1,
            ans: meta.answer || p.body || 'Answer not provided.',
            isAdmin: true
          };
        });
      }
    }
  }

  // Build year filter dynamically
  const years = [...new Set(customPYQs.map(p => p.year))].sort((a, b) => b - a);
  const filtersEl = document.getElementById('pyq-filters');
  if (filtersEl) {
    filtersEl.innerHTML = years.length > 0 ?
      `<div class="pyq-filter ${!filterYear || filterYear === 'all' ? 'active' : ''}" onclick="filterPYQ(this,'all')">All Years</div>` +
      years.map(y => `<div class="pyq-filter ${filterYear === y ? 'active' : ''}" onclick="filterPYQ(this,'${y}')">${y}</div>`).join('') :
      '';
  }

  const data = filterYear && filterYear !== 'all' ? customPYQs.filter(p => p.year === filterYear) : customPYQs;

  listEl.innerHTML = data.length ? data.map((p, i) => `
    <div class="pyq-item" id="pyq-${i}">
      <div class="pyq-header" onclick="togglePYQ(${i})">
        <div class="pyq-q">Q${i + 1}. ${p.q} <span style="font-size:0.65rem;background:var(--teal);color:#fff;padding:1px 7px;border-radius:50px;vertical-align:middle;">SUPABASE</span></div>
        <div class="pyq-meta">
          <span class="pyq-year">📅 ${p.year}</span>
          <span class="pyq-count">× ${p.count} times</span>
        </div>
      </div>
      <div class="pyq-answer">${p.ans}</div>
    </div>`).join('') :
    `<div style="text-align:center;padding:3rem;color:var(--text3);">
      <div style="font-size:3rem;margin-bottom:1rem;">📝</div>
      <div style="font-weight:600;">No content available yet</div>
      <div style="font-size:0.82rem;margin-top:4px;">Creator will upload questions for this unit</div>
    </div>`;
}

export function togglePYQ(i) {
  document.getElementById('pyq-' + i)?.classList.toggle('expanded');
}

export function filterPYQ(el, year) {
  document.querySelectorAll('.pyq-filter').forEach(f => f.classList.remove('active'));
  el.classList.add('active');
  renderPYQ(year);
}
