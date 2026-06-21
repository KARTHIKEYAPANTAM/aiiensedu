// Common legacy helpers used across modules
const esc = (value) => String(value ?? '').replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
const js = (value) => String(value ?? '').replace(/\\/g, '\\\\').replace(/'/g, "\\'");
const sb = () => window.__AIMEASY_SUPABASE__;
const todayKeyDb = (date = new Date()) => date.toISOString().slice(0, 10);
const pctFromCgpa = (cgpa) => Math.max(0, Math.min(100, Number(cgpa || 0) * 9.5));

export async function renderIQ(subjectId, unitNum) {
  const listEl = document.getElementById('iq-list');
  if (!listEl) return;
  listEl.innerHTML = '<div style="text-align:center;padding:3rem;color:var(--text3);"><div style="font-size:3rem;margin-bottom:1rem;">⏳</div><div style="font-weight:600;">Loading questions...</div></div>';

  const subjectName = APP.currentSubject?.name || '';
  const uNum = unitNum || APP.currentUnit || 1;
  const subject = APP.currentSubject;
  let customIQs = [];

  if (window.aimeasyFetchUnitRoadmap && window.aimeasyListContent && subject) {
    const ctx = await window.aimeasyFetchUnitRoadmap({
      subject,
      unit: { id: uNum, name: `Unit ${uNum}`, dbUnitId: subject?.dbUnitIds?.[uNum] },
    });
    if (ctx?.data?.subjectId && ctx?.data?.unitId) {
      const { data } = await window.aimeasyListContent({ subjectId: ctx.data.subjectId, unitId: ctx.data.unitId, contentType: 'iq' });
      if (data) {
        customIQs = data.map(q => {
          const meta = q.metadata || {};
          return {
            q: q.title || q.body || 'Untitled Question',
            priority: meta.priority || 'med',
            tags: (meta.tags || '').split(',').map(t => t.trim()).filter(Boolean),
            isAdmin: true
          };
        });
      }
    }
  }

  listEl.innerHTML = customIQs.length ? customIQs.map((q, i) => `
    <div class="iq-item">
      <div class="iq-header">
        <div class="iq-q">Q${i + 1}. ${q.q} <span style="font-size:0.65rem;background:var(--teal);color:#fff;padding:1px 7px;border-radius:50px;vertical-align:middle;">SUPABASE</span></div>
        <div class="iq-actions">
          <button class="btn-icon" onclick="showToast('🔖 Bookmarked!','amber')" title="Bookmark">🔖</button>
          <button class="btn-icon" onclick="showToast('📋 Copied!','blue')" title="Copy">📋</button>
        </div>
      </div>
      <div class="iq-footer">
        <span class="priority-badge priority-${q.priority}">${q.priority === 'high' ? '🔴 High Priority' : q.priority === 'med' ? '🟡 Medium' : '🟢 Low'}</span>
        ${q.tags.map(t => `<span class="tag">${t}</span>`).join('')}
      </div>
    </div>`).join('') :
    `<div style="text-align:center;padding:3rem;color:var(--text3);">
      <div style="font-size:3rem;margin-bottom:1rem;">⭐</div>
      <div style="font-weight:600;">No content available yet</div>
      <div style="font-size:0.82rem;margin-top:4px;">Creator will add questions for this unit</div>
    </div>`;
}
