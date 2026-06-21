// Common legacy helpers used across modules
const esc = (value) => String(value ?? '').replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
const js = (value) => String(value ?? '').replace(/\\/g, '\\\\').replace(/'/g, "\\'");
const sb = () => window.__AIMEASY_SUPABASE__;
const todayKeyDb = (date = new Date()) => date.toISOString().slice(0, 10);
const pctFromCgpa = (cgpa) => Math.max(0, Math.min(100, Number(cgpa || 0) * 9.5));

export function uploadIQ() {
  const question = document.getElementById('sa-iqtext').value.trim();
  const priority = document.getElementById('sa-iqpriority').value;
  const tags = document.getElementById('sa-iqtags').value.trim();
  const subject = document.getElementById('sa-iqsubject').value;
  const unit = document.getElementById('sa-iqunit').value;
  if (!question) { showToast('Please enter a question', 'red'); return; }
  const iqs = JSON.parse(localStorage.getItem('edusync_admin_iqs') || '[]');
  iqs.push({ id: Date.now(), question, priority, tags, subject, unit: parseInt(unit) || 0, uploadedAt: new Date().toLocaleString() });
  localStorage.setItem('edusync_admin_iqs', JSON.stringify(iqs));
  document.getElementById('sa-iqtext').value = '';
  document.getElementById('sa-iqtags').value = '';
  showToast('✅ Important question added! Students can now see it.', 'green');
  renderUploadedIQList();
}

export function renderUploadedIQList() {
  const listEl = document.getElementById('sa-iq-list');
  if (!listEl) return;
  const iqs = JSON.parse(localStorage.getItem('edusync_admin_iqs') || '[]');
  if (!iqs.length) { listEl.innerHTML = ''; return; }
  listEl.innerHTML = '<h4 style="margin-bottom:8px;font-size:0.85rem;">Added Questions (' + iqs.length + ')</h4>' +
    iqs.map(q => `
      <div style="display:flex;align-items:center;gap:8px;padding:8px 12px;background:var(--surface2);border:1px solid var(--border);border-radius:var(--radius-sm);margin-bottom:6px;font-size:0.82rem;">
        <span style="flex:1;font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">⭐ ${q.question}</span>
        <span class="badge ${q.priority === 'high' ? 'badge-red' : q.priority === 'med' ? 'badge-amber' : 'badge-green'}">${q.priority}</span>
        <span class="badge badge-teal">${q.subject || 'All'}</span>
        <span class="badge badge-green">Live</span>
        <!-- Sub Admin cannot delete -->
      </div>`).join('');
}

export function v10IQForm(subjectName, unitId) {
  const iqs = JSON.parse(localStorage.getItem('edusync_admin_iqs') || '[]')
    .filter(q => q.subject === subjectName && parseInt(q.unit) === unitId);
  const s = (subjectName || '').replace(/\\/g, '\\\\').replace(/'/g, "\\'");
  return `
  <div class="v10-form">
    <p class="hint">Important questions uploaded here will appear in the student's <strong>Important Qs tab</strong>.</p>
    <div class="input-group">
      <span class="v10-label">QUESTION</span>
      <textarea class="input" id="v10-iqtxt-${unitId}" placeholder="Type the important question..." rows="3" style="resize:vertical;"></textarea>
    </div>
    <div class="v10-2col">
      <div class="input-group">
        <span class="v10-label">PRIORITY</span>
        <select class="select" id="v10-iqprio-${unitId}">
          <option value="high">🔴 High Priority</option>
          <option value="med" selected>🟡 Medium Priority</option>
          <option value="low">🟢 Low Priority</option>
        </select>
      </div>
      <div class="input-group">
        <span class="v10-label">TAGS (COMMA SEPARATED)</span>
        <input class="input" id="v10-iqtags-${unitId}" placeholder="e.g. Unit ${unitId}, Memory">
      </div>
    </div>
    <div class="v10-2col">
      <div class="input-group">
        <span class="v10-label">SUBJECT</span>
        <input class="input" value="${subjectName}" readonly style="background:var(--surface2);">
      </div>
      <div class="input-group">
        <span class="v10-label">UNIT</span>
        <select class="select" id="v10-iqunit-${unitId}">
          ${[1, 2, 3, 4, 5].map(u => `<option value="${u}"${u === unitId ? ' selected' : ''}>Unit ${u}</option>`).join('')}
        </select>
      </div>
    </div>
    <button class="v10-submit" onclick="v10UploadIQ('${s}',${unitId})">+ Add Question</button>
  </div>
  ${iqs.length ? `
  <div class="v10-items">
    <div class="v10-items-head">Added Questions (${iqs.length})</div>
    ${iqs.map(q => `
    <div class="v10-item">
      <span style="font-size:1rem;">${q.priority === 'high' ? '🔴' : q.priority === 'low' ? '🟢' : '🟡'}</span>
      <div class="v10-item-body">
        <div class="v10-item-title">${q.question.substring(0, 90)}${q.question.length > 90 ? '...' : ''}</div>
        <div class="v10-item-meta">${q.priority === 'high' ? 'High Priority' : q.priority === 'low' ? 'Low Priority' : 'Medium Priority'}${q.tags ? ' · ' + q.tags : ''}</div>
      </div>
      <button class="v10-del v10-edit-btn" onclick="aimeasyEditIQ(${q.id},'${s}',${unitId})" title="Edit" style="color:var(--primary);margin-right:4px;">✏️</button>
      <button class="v10-del v10-del-btn" onclick="v10DeleteIQ(${q.id},'${s}',${unitId})" title="Delete">🗑</button>
    </div>`).join('')}
  </div>` : ''}`;
}

export function v10UploadIQ(subjectName, unitId) {
  const question = document.getElementById('v10-iqtxt-' + unitId)?.value.trim();
  const priority = document.getElementById('v10-iqprio-' + unitId)?.value;
  const tags = document.getElementById('v10-iqtags-' + unitId)?.value.trim();
  if (!question) { showToast('Enter the question', 'red'); return; }
  const iqs = JSON.parse(localStorage.getItem('edusync_admin_iqs') || '[]');
  iqs.push({ id: Date.now(), question, priority, tags, subject: subjectName, unit: unitId, uploadedAt: new Date().toLocaleString() });
  localStorage.setItem('edusync_admin_iqs', JSON.stringify(iqs));
  document.getElementById('v10-iqtxt-' + unitId).value = '';
  document.getElementById('v10-iqtags-' + unitId).value = '';
  showToast('✅ Important question added! Students can now see it.', 'green');
  const pane = document.getElementById('v10-iq-' + unitId);
  if (pane) pane.innerHTML = v10IQForm(subjectName, unitId);
}

export function v10DeleteIQ(id, subjectName, unitId) {
  if (!confirm('Delete this question?')) return;
  const iqs = JSON.parse(localStorage.getItem('edusync_admin_iqs') || '[]');
  localStorage.setItem('edusync_admin_iqs', JSON.stringify(iqs.filter(q => q.id !== id)));
  showToast('Question deleted', 'red');
  const pane = document.getElementById('v10-iq-' + unitId);
  if (pane) pane.innerHTML = v10IQForm(subjectName, unitId);
}

export function v10IQFormLinked(subjectName, unitId) {
  const iqs = JSON.parse(localStorage.getItem('edusync_admin_iqs') || '[]').filter(q => q.subject === subjectName && parseInt(q.unit) === parseInt(unitId));
  const s = (subjectName || '').replace(/\\/g, '\\\\').replace(/'/g, "\\'");
  return `<div class="v10-form"><p class="hint">Important questions are linked to a roadmap topic.</p><div class="input-group"><span class="v10-label">TOPIC</span>${v10TopicSelect(subjectName, unitId)}</div><div class="input-group"><span class="v10-label">QUESTION</span><textarea class="input" id="v10-iqtxt-${unitId}" rows="3" style="resize:vertical;"></textarea></div><div class="input-group"><span class="v10-label">PRIORITY</span><select class="select" id="v10-iqprio-${unitId}"><option value="high">High</option><option value="med" selected>Medium</option><option value="low">Low</option></select></div><button class="v10-submit" onclick="v10UploadIQ('${s}',${unitId})">Save Important Question</button></div>${iqs.length ? `<div class="v10-items"><div class="v10-items-head">Important Questions (${iqs.length})</div>${iqs.map(q => `<div class="v10-item"><span>⭐</span><div class="v10-item-body"><div class="v10-item-title">${q.question}</div><div class="v10-item-meta">${q.topicName || 'No topic'} · ${q.priority || 'med'}</div></div><button class="v10-del v10-edit-btn" onclick="aimeasyEditIQ(${q.id},'${s}',${unitId})" style="color:var(--primary);margin-right:4px;">Edit</button><button class="v10-del v10-del-btn" onclick="v10DeleteIQ(${q.id},'${s}',${unitId})">Del</button></div>`).join('')}</div>` : ''}`;
}

export async function v10UploadIQLinked(subjectName, unitId) {
  const question = document.getElementById('v10-iqtxt-' + unitId)?.value.trim();
  const priority = document.getElementById('v10-iqprio-' + unitId)?.value;
  const topicId = document.querySelector(`#v10-iq-${unitId} .v10-topic-select`)?.value || '';
  const topicName = v10TopicNameById(unitId, topicId);
  if (!topicId) { showToast('Select a topic', 'red'); return; }
  if (!question) { showToast('Enter question', 'red'); return; }
  const iqs = JSON.parse(localStorage.getItem('edusync_admin_iqs') || '[]');
  const iq = { id: Date.now(), question, priority, subject: subjectName, unit: unitId, topicId, topicName, uploadedAt: new Date().toLocaleString() };
  const saved = await window.aimeasySaveLinkedContentItem?.({ subject: v10SubjectForDb(subjectName), unit: v10UnitForDb(unitId), topicTitle: topicName, topicLegacyId: topicId, contentType: 'iq', title: question.slice(0, 80), body: question, metadata: { priority, topicId } });
  if (saved?.error) { showToast('DB save failed: ' + saved.error.message, 'red'); return; }
  if (saved?.data?.id) iq.dbContentId = saved.data.id;
  iqs.push(iq);
  localStorage.setItem('edusync_admin_iqs', JSON.stringify(iqs));
  await v10RefreshContentPane('iq', subjectName, unitId);
  window.renderSubAdminDashboardLive?.();
  console.log('[IMPORTANT] Save Success', { subjectName, unitId, topicId, topicName, contentId: saved?.data?.id });
  showToast('Important question saved under topic.', 'green');
}

export async function v10DeleteIQLinked(id, subjectName, unitId) {
  if (!confirm('Delete this question?')) return;
  const iqs = JSON.parse(localStorage.getItem('edusync_admin_iqs') || '[]');
  const iq = iqs.find(q => q.id === id);
  if (iq?.dbContentId) await window.aimeasyDeleteContent?.(iq.dbContentId);
  localStorage.setItem('edusync_admin_iqs', JSON.stringify(iqs.filter(q => q.id !== id)));
  await v10RefreshContentPane('iq', subjectName, unitId);
  window.renderSubAdminDashboardLive?.();
  showToast('Question deleted', 'red');
}

export function v10IQFormTopicText(subjectName, unitId) {
  const iqs = JSON.parse(localStorage.getItem('edusync_admin_iqs') || '[]').filter(q => q.subject === subjectName && parseInt(q.unit) === parseInt(unitId));
  const s = v10EscapeJs(subjectName);
  return `<div class="v10-form"><p class="hint">Select an existing roadmap topic or type a new topic.</p>${v10TopicFieldsHTML(subjectName, unitId, 'iq')}<div class="input-group"><span class="v10-label">QUESTION</span><textarea class="input" id="v10-iqtxt-${unitId}" rows="3" style="resize:vertical;"></textarea></div><div class="input-group"><span class="v10-label">PRIORITY</span><select class="select" id="v10-iqprio-${unitId}"><option value="high">High</option><option value="med" selected>Medium</option><option value="low">Low</option></select></div><button class="v10-submit" onclick="v10UploadIQ('${s}',${unitId})">Save Important Question</button></div>${iqs.length ? `<div class="v10-items"><div class="v10-items-head">Uploaded Important Questions (${iqs.length})</div>${iqs.map(q => `<div class="v10-item"><span>⭐</span><div class="v10-item-body"><div class="v10-item-title">${q.question}</div><div class="v10-item-meta">${q.topicName || 'No topic'} · ${q.priority || 'med'}</div></div><button class="v10-del v10-edit-btn" onclick="aimeasyEditIQ('${q.id}','${s}',${unitId})" style="color:var(--primary);margin-right:4px;">Edit</button><button class="v10-del v10-del-btn" onclick="v10DeleteIQ('${q.id}','${s}',${unitId})">Delete</button></div>`).join('')}</div>` : ''}`;
}

export async function v10UploadIQTopicText(subjectName, unitId) {
  const question = document.getElementById('v10-iqtxt-' + unitId)?.value.trim();
  const priority = document.getElementById('v10-iqprio-' + unitId)?.value;
  const { topicId, topicName } = v10ReadTopicInput(unitId, 'iq');
  if (!topicName) { showToast('Enter topic text or select a topic', 'red'); return; }
  if (!question) { showToast('Enter question', 'red'); return; }
  const iqs = JSON.parse(localStorage.getItem('edusync_admin_iqs') || '[]');
  const branch = v10BranchForSubject(subjectName);
  const iq = { id: Date.now(), question, priority, subject: subjectName, branch, unit: unitId, topicId, topicName, uploadedAt: new Date().toLocaleString() };
  const saved = await window.aimeasySaveLinkedContentItem?.({ subject: v10SubjectForDb(subjectName), unit: v10UnitForDb(unitId), topicTitle: topicName, topicLegacyId: topicId, contentType: 'iq', title: question.slice(0, 80), body: question, metadata: { priority, topicId, topicText: topicName, branch } });
  if (saved?.error) { showToast('DB save failed: ' + saved.error.message, 'red'); return; }
  if (saved?.data?.id) iq.dbContentId = saved.data.id;
  iqs.push(iq);
  localStorage.setItem('edusync_admin_iqs', JSON.stringify(iqs));
  await v10RefreshContentPane('iq', subjectName, unitId);
  window.renderSubAdminDashboardLive?.();
  showToast('Important question saved under topic.', 'green');
}

export function v10IQFormMenuActions(subjectName, unitId) {
  const branch = v10BranchForSubject(subjectName);
  const iqs = JSON.parse(localStorage.getItem('edusync_admin_iqs') || '[]').filter(q => q.subject === subjectName && parseInt(q.unit) === parseInt(unitId) && v10SameBranchContent(q, branch));
  const s = v10EscapeJs(subjectName);
  return `<div class="v10-form"><p class="hint">Select a saved roadmap topic or type a matching topic.</p>${v10TopicFieldsHTML(subjectName, unitId, 'iq')}<div class="input-group"><span class="v10-label">QUESTION</span><textarea class="input" id="v10-iqtxt-${unitId}" rows="3" style="resize:vertical;"></textarea></div><div class="input-group"><span class="v10-label">PRIORITY</span><select class="select" id="v10-iqprio-${unitId}"><option value="high">High</option><option value="med" selected>Medium</option><option value="low">Low</option></select></div><button class="v10-submit" onclick="v10UploadIQ('${s}',${unitId})">Save Important Question</button></div>${iqs.length ? `<div class="v10-items"><div class="v10-items-head">Uploaded Important Questions (${iqs.length})</div>${iqs.map(q => `<div class="v10-item"><span>⭐</span><div class="v10-item-body"><div class="v10-item-title">${q.question}</div><div class="v10-item-meta">${q.topicName || 'No topic'} · ${q.priority || 'med'}</div></div>${v10ContentActionMenu(`aimeasyEditIQ('${q.id}','${s}',${unitId})`, `v10DeleteIQ('${q.id}','${s}',${unitId})`)}</div>`).join('')}</div>` : ''}`;
}

export function v10IQFormDropZone(subjectName, unitId) {
  const branch = v10BranchForSubject(subjectName);
  const iqs = JSON.parse(localStorage.getItem('edusync_admin_iqs') || '[]').filter(q => q.subject === subjectName && parseInt(q.unit) === parseInt(unitId) && v10SameBranchContent(q, branch));
  const s = v10EscapeJs(subjectName);
  return `<div class="v10-form">${v10TopicFieldsHTML(subjectName, unitId, 'iq')}${v10FileUploadArea(unitId, 'iq')}<input class="input" id="v10-iqlink-${unitId}" type="hidden"><div class="input-group"><span class="v10-label">QUESTION</span><textarea class="input" id="v10-iqtxt-${unitId}" rows="3" style="resize:vertical;"></textarea></div><div class="input-group"><span class="v10-label">PRIORITY</span><select class="select" id="v10-iqprio-${unitId}"><option value="high">High</option><option value="med" selected>Medium</option><option value="low">Low</option></select></div><button class="v10-submit" onclick="v10UploadIQ('${s}',${unitId})">Save Important Question</button></div>${iqs.length ? `<div class="v10-items"><div class="v10-items-head">Uploaded Important Questions (${iqs.length})</div>${iqs.map(q => `<div class="v10-item"><span>!</span><div class="v10-item-body"><div class="v10-item-title">${q.question}</div><div class="v10-item-meta">${q.topicName || 'No topic'} ${q.priority || 'med'}</div></div>${v10ContentActionMenu(`aimeasyEditIQ('${q.id}','${s}',${unitId})`, `v10DeleteIQ('${q.id}','${s}',${unitId})`)}</div>`).join('')}</div>` : ''}`;
}

export async function v10UploadIQReliable(subjectName, unitId) {
  const before = JSON.parse(localStorage.getItem('edusync_admin_iqs') || '[]').length;
  const result = await v10UploadIQWithLogs(subjectName, unitId);
  const after = JSON.parse(localStorage.getItem('edusync_admin_iqs') || '[]').length;
  if (after > before) console.log('[IMPORTANT] Save Success', { subjectName, unitId });
  return result;
}
