// Common legacy helpers used across modules
const esc = (value) => String(value ?? '').replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
const js = (value) => String(value ?? '').replace(/\\/g, '\\\\').replace(/'/g, "\\'");
const sb = () => window.__AIMEASY_SUPABASE__;
const todayKeyDb = (date = new Date()) => date.toISOString().slice(0, 10);
const pctFromCgpa = (cgpa) => Math.max(0, Math.min(100, Number(cgpa || 0) * 9.5));

export async function renderNotes(subjectId, unitNum) {
  const listEl = document.getElementById('notes-list');
  if (!listEl) return;
  listEl.innerHTML = '<div style="text-align:center;padding:3rem;color:var(--text3);"><div style="font-size:3rem;margin-bottom:1rem;">⏳</div><div style="font-weight:600;">Loading notes...</div></div>';

  const subject = APP.currentSubject;
  const unitId = unitNum || APP.currentUnit || 1;
  let customNotes = [];

  if (window.aimeasyFetchUnitRoadmap && window.aimeasyListContent && subject) {
    const ctx = await window.aimeasyFetchUnitRoadmap({
      subject,
      unit: { id: unitId, name: `Unit ${unitId}`, dbUnitId: subject?.dbUnitIds?.[unitId] },
    });
    if (ctx?.data?.subjectId && ctx?.data?.unitId) {
      const result = await window.aimeasyListContent({ subjectId: ctx.data.subjectId, unitId: ctx.data.unitId, contentType: 'note' });
      
      console.log('---Deep Runtime Investigation---');
      console.log('FULL RESULT', result);
      console.log('RESULT KEYS', Object.keys(result || {}));
      console.log('DATA VALUE', result?.data);
      console.log('DATA CONSTRUCTOR', result?.data?.constructor?.name);
      console.log('DATA PROTOTYPE', Object.getPrototypeOf(result?.data));
      console.log('DATA MAP FUNCTION', result?.data?.map);
      
      const { data } = result;
      if (data) {
        customNotes = data.map(n => ({
          title: n.title || 'Untitled Note',
          type: n.url?.endsWith('.pdf') ? 'pdf' : (n.url?.endsWith('.doc') || n.url?.endsWith('.docx') ? 'doc' : 'link'),
          link: n.url,
          uploadedAt: n.created_at ? new Date(n.created_at).toLocaleDateString() : 'Recently'
        }));
      }
    }
  }

  listEl.innerHTML = customNotes.length ? customNotes.map(n => `
    <div class="note-row">
      <div class="note-icon">${n.type === 'pdf' ? '📄' : n.type === 'doc' ? '📝' : '🔗'}</div>
      <div class="note-info">
        <div class="note-title">${n.title} <span style="font-size:0.65rem;background:var(--teal);color:#fff;padding:1px 7px;border-radius:50px;vertical-align:middle;">SUPABASE</span></div>
        <div class="note-desc">Uploaded ${n.uploadedAt}</div>
      </div>
      <div class="note-actions">
        ${n.link ? `
          <button class="btn btn-ghost btn-sm" onclick="previewNoteInline('${n.link.replace(/'/g, "\\'")}','${n.title.replace(/'/g, "\\'")}')">👁️ Preview</button>
          <button class="btn btn-primary btn-sm" onclick="downloadNote('${n.link.replace(/'/g, "\\'")}','${n.title.replace(/'/g, "\\'")}')">📥 Download</button>
        ` : `
          <button class="btn btn-ghost btn-sm" onclick="showToast('📄 No file linked','amber')">Preview</button>
          <button class="btn btn-primary btn-sm" onclick="showToast('📥 No download available','amber')">Download</button>
        `}
      </div>
    </div>`).join('') :
    `<div style="text-align:center;padding:3rem;color:var(--text3);">
      <div style="font-size:3rem;margin-bottom:1rem;">📄</div>
      <div style="font-weight:600;">No content available yet</div>
      <div style="font-size:0.82rem;margin-top:4px;">Creator will upload notes for this unit</div>
    </div>`;
}
window.renderNotes = renderNotes;
