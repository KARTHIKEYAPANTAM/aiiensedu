// Common legacy helpers used across modules
const esc = (value) => String(value ?? '').replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
const js = (value) => String(value ?? '').replace(/\\/g, '\\\\').replace(/'/g, "\\'");
const sb = () => window.__AIMEASY_SUPABASE__;
const todayKeyDb = (date = new Date()) => date.toISOString().slice(0, 10);
const pctFromCgpa = (cgpa) => Math.max(0, Math.min(100, Number(cgpa || 0) * 9.5));

export function uploadPYQ() {
  const year = document.getElementById('sa-pyqyear').value.trim();
  const count = document.getElementById('sa-pyqcount').value.trim();
  const question = document.getElementById('sa-pyqtext').value.trim();
  const answer = document.getElementById('sa-pyqans').value.trim();
  const subject = document.getElementById('sa-pyqsubject').value;
  const unit = document.getElementById('sa-pyqunit').value;
  if (!question || !year) { showToast('Please fill question and year', 'red'); return; }
  const pyqs = JSON.parse(localStorage.getItem('edusync_admin_pyqs') || '[]');
  pyqs.push({ id: Date.now(), question, answer, year, count: parseInt(count) || 1, subject, unit: parseInt(unit) || 0, uploadedAt: new Date().toLocaleString() });
  localStorage.setItem('edusync_admin_pyqs', JSON.stringify(pyqs));
  document.getElementById('sa-pyqtext').value = '';
  document.getElementById('sa-pyqans').value = '';
  showToast('✅ PYQ uploaded! Students can now see it.', 'green');
  renderUploadedPYQList();
}

export function renderUploadedPYQList() {
  const listEl = document.getElementById('sa-pyq-list');
  if (!listEl) return;
  const pyqs = JSON.parse(localStorage.getItem('edusync_admin_pyqs') || '[]');
  if (!pyqs.length) { listEl.innerHTML = ''; return; }
  listEl.innerHTML = '<h4 style="margin-bottom:8px;font-size:0.85rem;">Uploaded PYQs (' + pyqs.length + ')</h4>' +
    pyqs.map(p => `
      <div style="display:flex;align-items:center;gap:8px;padding:8px 12px;background:var(--surface2);border:1px solid var(--border);border-radius:var(--radius-sm);margin-bottom:6px;font-size:0.82rem;">
        <span style="flex:1;font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">📝 ${p.question}</span>
        <span class="badge badge-amber">${p.year}</span>
        <span class="badge badge-teal">${p.subject || 'All'}</span>
        <span class="badge badge-green">Live</span>
        <!-- Sub Admin cannot delete -->
      </div>`).join('');
}

export function v10PYQForm(subjectName, unitId) {
  const pyqs = JSON.parse(localStorage.getItem('edusync_admin_pyqs') || '[]')
    .filter(p => p.subject === subjectName && parseInt(p.unit) === unitId);
  const s = (subjectName || '').replace(/\\/g, '\\\\').replace(/'/g, "\\'");
  return `
  <div class="v10-form">
    <p class="hint">PYQs uploaded here will appear in the student's <strong>Previous Year Qs tab</strong>.</p>
    <div class="v10-2col">
      <div class="input-group">
        <span class="v10-label">EXAM YEAR</span>
        <input class="input" id="v10-pyqyr-${unitId}" placeholder="e.g. 2023" type="number" min="2000" max="2099">
      </div>
      <div class="input-group">
        <span class="v10-label">REPEATED COUNT</span>
        <input class="input" id="v10-pyqcnt-${unitId}" type="number" min="1" value="1">
      </div>
    </div>
    <div class="input-group">
      <span class="v10-label">QUESTION TEXT</span>
      <textarea class="input" id="v10-pyqtxt-${unitId}" placeholder="Type the question here..." rows="3" style="resize:vertical;"></textarea>
    </div>
    <div class="input-group">
      <span class="v10-label">ANSWER (OPTIONAL)</span>
      <textarea class="input" id="v10-pyqans-${unitId}" placeholder="Type the answer or explanation..." rows="3" style="resize:vertical;"></textarea>
    </div>
    <div class="v10-2col">
      <div class="input-group">
        <span class="v10-label">SUBJECT</span>
        <input class="input" value="${subjectName}" readonly style="background:var(--surface2);">
      </div>
      <div class="input-group">
        <span class="v10-label">UNIT</span>
        <select class="select" id="v10-pyqunit-${unitId}">
          ${[1, 2, 3, 4, 5].map(u => `<option value="${u}"${u === unitId ? ' selected' : ''}>Unit ${u}</option>`).join('')}
        </select>
      </div>
    </div>
    <button class="v10-submit" onclick="v10UploadPYQ('${s}',${unitId})">📝 Upload Question</button>
  </div>
  ${pyqs.length ? `
  <div class="v10-items">
    <div class="v10-items-head">Uploaded PYQs (${pyqs.length})</div>
    ${pyqs.map(p => `
    <div class="v10-item">
      <span style="font-size:1rem;">📅</span>
      <div class="v10-item-body">
        <div class="v10-item-title">${p.question.substring(0, 90)}${p.question.length > 90 ? '...' : ''}</div>
        <div class="v10-item-meta">Year: ${p.year} · ×${p.count || 1} times</div>
      </div>
      <button class="v10-del v10-edit-btn" onclick="aimeasyEditPYQ(${p.id},'${s}',${unitId})" title="Edit" style="color:var(--primary);margin-right:4px;">✏️</button>
      <button class="v10-del v10-del-btn" onclick="v10DeletePYQ(${p.id},'${s}',${unitId})" title="Delete">🗑</button>
    </div>`).join('')}
  </div>` : ''}`;
}

export function v10UploadPYQ(subjectName, unitId) {
  const year = document.getElementById('v10-pyqyr-' + unitId)?.value;
  const count = document.getElementById('v10-pyqcnt-' + unitId)?.value || '1';
  const question = document.getElementById('v10-pyqtxt-' + unitId)?.value.trim();
  const answer = document.getElementById('v10-pyqans-' + unitId)?.value.trim();
  if (!question) { showToast('Enter the question text', 'red'); return; }
  if (!year) { showToast('Enter the exam year', 'red'); return; }
  const pyqs = JSON.parse(localStorage.getItem('edusync_admin_pyqs') || '[]');
  pyqs.push({ id: Date.now(), question, answer, year, count: parseInt(count) || 1, subject: subjectName, unit: unitId });
  localStorage.setItem('edusync_admin_pyqs', JSON.stringify(pyqs));
  document.getElementById('v10-pyqtxt-' + unitId).value = '';
  document.getElementById('v10-pyqans-' + unitId).value = '';
  document.getElementById('v10-pyqyr-' + unitId).value = '';
  showToast('✅ PYQ added and live for students!', 'green');
  const pane = document.getElementById('v10-pyq-' + unitId);
  if (pane) pane.innerHTML = v10PYQForm(subjectName, unitId);
}

export function v10DeletePYQ(id, subjectName, unitId) {
  if (!confirm('Delete this PYQ?')) return;
  const pyqs = JSON.parse(localStorage.getItem('edusync_admin_pyqs') || '[]');
  localStorage.setItem('edusync_admin_pyqs', JSON.stringify(pyqs.filter(p => p.id !== id)));
  showToast('PYQ deleted', 'red');
  const pane = document.getElementById('v10-pyq-' + unitId);
  if (pane) pane.innerHTML = v10PYQForm(subjectName, unitId);
}

export function v10PYQFormLinked(subjectName, unitId) {
  const pyqs = JSON.parse(localStorage.getItem('edusync_admin_pyqs') || '[]').filter(p => p.subject === subjectName && parseInt(p.unit) === parseInt(unitId));
  const s = (subjectName || '').replace(/\\/g, '\\\\').replace(/'/g, "\\'");
  return `<div class="v10-form"><p class="hint">PYQs are linked to a roadmap topic.</p><div class="input-group"><span class="v10-label">TOPIC</span>${v10TopicSelect(subjectName, unitId)}</div><div class="v10-2col"><div class="input-group"><span class="v10-label">YEAR</span><input class="input" id="v10-pyqyr-${unitId}" type="number" min="2000" max="2099"></div><div class="input-group"><span class="v10-label">MARKS</span><input class="input" id="v10-pyqmarks-${unitId}" type="number" min="1"></div></div><div class="input-group"><span class="v10-label">QUESTION</span><textarea class="input" id="v10-pyqtxt-${unitId}" rows="3" style="resize:vertical;"></textarea></div><button class="v10-submit" onclick="v10UploadPYQ('${s}',${unitId})">Save PYQ</button></div>${pyqs.length ? `<div class="v10-items"><div class="v10-items-head">PYQs (${pyqs.length})</div>${pyqs.map(p => `<div class="v10-item"><span>📝</span><div class="v10-item-body"><div class="v10-item-title">${p.question}</div><div class="v10-item-meta">${p.topicName || 'No topic'} · ${p.year || '-'} · ${p.marks || p.count || '-'} marks</div></div><button class="v10-del v10-edit-btn" onclick="aimeasyEditPYQ(${p.id},'${s}',${unitId})" style="color:var(--primary);margin-right:4px;">Edit</button><button class="v10-del v10-del-btn" onclick="v10DeletePYQ(${p.id},'${s}',${unitId})">Del</button></div>`).join('')}</div>` : ''}`;
}

export async function v10UploadPYQLinked(subjectName, unitId) {
  const question = document.getElementById('v10-pyqtxt-' + unitId)?.value.trim();
  const year = document.getElementById('v10-pyqyr-' + unitId)?.value;
  const marks = document.getElementById('v10-pyqmarks-' + unitId)?.value;
  const topicId = document.querySelector(`#v10-pyq-${unitId} .v10-topic-select`)?.value || '';
  const topicName = v10TopicNameById(unitId, topicId);
  if (!topicId) { showToast('Select a topic', 'red'); return; }
  if (!question) { showToast('Enter question', 'red'); return; }
  const pyqs = JSON.parse(localStorage.getItem('edusync_admin_pyqs') || '[]');
  const pyq = { id: Date.now(), question, year, marks, subject: subjectName, unit: unitId, topicId, topicName };
  const saved = await window.aimeasySaveLinkedContentItem?.({ subject: v10SubjectForDb(subjectName), unit: v10UnitForDb(unitId), topicTitle: topicName, topicLegacyId: topicId, contentType: 'pyq', title: question.slice(0, 80), body: question, metadata: { year, marks, topicId } });
  if (saved?.error) { showToast('DB save failed: ' + saved.error.message, 'red'); return; }
  if (saved?.data?.id) pyq.dbContentId = saved.data.id;
  pyqs.push(pyq);
  localStorage.setItem('edusync_admin_pyqs', JSON.stringify(pyqs));
  await v10RefreshContentPane('pyq', subjectName, unitId);
  window.renderSubAdminDashboardLive?.();
  console.log('[PYQ] Save Success', { subjectName, unitId, topicId, topicName, contentId: saved?.data?.id });
  showToast('PYQ saved under topic.', 'green');
}

export async function v10DeletePYQLinked(id, subjectName, unitId) {
  if (!confirm('Delete this PYQ?')) return;
  const pyqs = JSON.parse(localStorage.getItem('edusync_admin_pyqs') || '[]');
  const pyq = pyqs.find(p => p.id === id);
  if (pyq?.dbContentId) await window.aimeasyDeleteContent?.(pyq.dbContentId);
  localStorage.setItem('edusync_admin_pyqs', JSON.stringify(pyqs.filter(p => p.id !== id)));
  await v10RefreshContentPane('pyq', subjectName, unitId);
  window.renderSubAdminDashboardLive?.();
  showToast('PYQ deleted', 'red');
}

export function v10PYQFormTopicText(subjectName, unitId) {
  const pyqs = JSON.parse(localStorage.getItem('edusync_admin_pyqs') || '[]').filter(p => p.subject === subjectName && parseInt(p.unit) === parseInt(unitId));
  const s = v10EscapeJs(subjectName);
  return `<div class="v10-form"><p class="hint">Select an existing roadmap topic or type a new topic.</p>${v10TopicFieldsHTML(subjectName, unitId, 'pyq')}<div class="v10-2col"><div class="input-group"><span class="v10-label">YEAR</span><input class="input" id="v10-pyqyr-${unitId}" type="number" min="2000" max="2099"></div><div class="input-group"><span class="v10-label">MARKS</span><input class="input" id="v10-pyqmarks-${unitId}" type="number" min="1"></div></div><div class="input-group"><span class="v10-label">QUESTION</span><textarea class="input" id="v10-pyqtxt-${unitId}" rows="3" style="resize:vertical;"></textarea></div><button class="v10-submit" onclick="v10UploadPYQ('${s}',${unitId})">Save PYQ</button></div>${pyqs.length ? `<div class="v10-items"><div class="v10-items-head">Uploaded PYQs (${pyqs.length})</div>${pyqs.map(p => `<div class="v10-item"><span>📝</span><div class="v10-item-body"><div class="v10-item-title">${p.question}</div><div class="v10-item-meta">${p.topicName || 'No topic'} · ${p.year || '-'} · ${p.marks || p.count || '-'} marks</div></div><button class="v10-del v10-edit-btn" onclick="aimeasyEditPYQ('${p.id}','${s}',${unitId})" style="color:var(--primary);margin-right:4px;">Edit</button><button class="v10-del v10-del-btn" onclick="v10DeletePYQ('${p.id}','${s}',${unitId})">Delete</button></div>`).join('')}</div>` : ''}`;
}

export async function v10UploadPYQTopicText(subjectName, unitId) {
  const question = document.getElementById('v10-pyqtxt-' + unitId)?.value.trim();
  const year = document.getElementById('v10-pyqyr-' + unitId)?.value;
  const marks = document.getElementById('v10-pyqmarks-' + unitId)?.value;
  const { topicId, topicName } = v10ReadTopicInput(unitId, 'pyq');
  if (!topicName) { showToast('Enter topic text or select a topic', 'red'); return; }
  if (!question) { showToast('Enter question', 'red'); return; }
  const pyqs = JSON.parse(localStorage.getItem('edusync_admin_pyqs') || '[]');
  const branch = v10BranchForSubject(subjectName);
  const pyq = { id: Date.now(), question, year, marks, subject: subjectName, branch, unit: unitId, topicId, topicName };
  const saved = await window.aimeasySaveLinkedContentItem?.({ subject: v10SubjectForDb(subjectName), unit: v10UnitForDb(unitId), topicTitle: topicName, topicLegacyId: topicId, contentType: 'pyq', title: question.slice(0, 80), body: question, metadata: { year, marks, topicId, topicText: topicName, branch } });
  if (saved?.error) { showToast('DB save failed: ' + saved.error.message, 'red'); return; }
  if (saved?.data?.id) pyq.dbContentId = saved.data.id;
  pyqs.push(pyq);
  localStorage.setItem('edusync_admin_pyqs', JSON.stringify(pyqs));
  await v10RefreshContentPane('pyq', subjectName, unitId);
  window.renderSubAdminDashboardLive?.();
  showToast('PYQ saved under topic.', 'green');
}

export function v10PYQFormMenuActions(subjectName, unitId) {
  const branch = v10BranchForSubject(subjectName);
  const pyqs = JSON.parse(localStorage.getItem('edusync_admin_pyqs') || '[]').filter(p => p.subject === subjectName && parseInt(p.unit) === parseInt(unitId) && v10SameBranchContent(p, branch));
  const s = v10EscapeJs(subjectName);
  return `<div class="v10-form"><p class="hint">Select a saved roadmap topic or type a matching topic.</p>${v10TopicFieldsHTML(subjectName, unitId, 'pyq')}<div class="v10-2col"><div class="input-group"><span class="v10-label">YEAR</span><input class="input" id="v10-pyqyr-${unitId}" type="number" min="2000" max="2099"></div><div class="input-group"><span class="v10-label">MARKS</span><input class="input" id="v10-pyqmarks-${unitId}" type="number" min="1"></div></div><div class="input-group"><span class="v10-label">QUESTION</span><textarea class="input" id="v10-pyqtxt-${unitId}" rows="3" style="resize:vertical;"></textarea></div><button class="v10-submit" onclick="v10UploadPYQ('${s}',${unitId})">Save PYQ</button></div>${pyqs.length ? `<div class="v10-items"><div class="v10-items-head">Uploaded PYQs (${pyqs.length})</div>${pyqs.map(p => `<div class="v10-item"><span>📝</span><div class="v10-item-body"><div class="v10-item-title">${p.question}</div><div class="v10-item-meta">${p.topicName || 'No topic'} · ${p.year || '-'} · ${p.marks || p.count || '-'} marks</div></div>${v10ContentActionMenu(`aimeasyEditPYQ('${p.id}','${s}',${unitId})`, `v10DeletePYQ('${p.id}','${s}',${unitId})`)}</div>`).join('')}</div>` : ''}`;
}

export function v10PYQFormDropZone(subjectName, unitId) {
  const branch = v10BranchForSubject(subjectName);
  const pyqs = JSON.parse(localStorage.getItem('edusync_admin_pyqs') || '[]').filter(p => p.subject === subjectName && parseInt(p.unit) === parseInt(unitId) && v10SameBranchContent(p, branch));
  const s = v10EscapeJs(subjectName);
  return `<div class="v10-form">${v10TopicFieldsHTML(subjectName, unitId, 'pyq')}${v10FileUploadArea(unitId, 'pyq')}<input class="input" id="v10-pyqlink-${unitId}" type="hidden"><div class="v10-2col"><div class="input-group"><span class="v10-label">YEAR</span><input class="input" id="v10-pyqyr-${unitId}" type="number" min="2000" max="2099"></div><div class="input-group"><span class="v10-label">MARKS</span><input class="input" id="v10-pyqmarks-${unitId}" type="number" min="1"></div></div><div class="input-group"><span class="v10-label">QUESTION</span><textarea class="input" id="v10-pyqtxt-${unitId}" rows="3" style="resize:vertical;"></textarea></div><button class="v10-submit" onclick="v10UploadPYQ('${s}',${unitId})">Save PYQ</button></div>${pyqs.length ? `<div class="v10-items"><div class="v10-items-head">Uploaded PYQs (${pyqs.length})</div>${pyqs.map(p => `<div class="v10-item"><span>Q</span><div class="v10-item-body"><div class="v10-item-title">${p.question}</div><div class="v10-item-meta">${p.topicName || 'No topic'} ${p.year || '-'} ${p.marks || p.count || '-'} marks</div></div>${v10ContentActionMenu(`aimeasyEditPYQ('${p.id}','${s}',${unitId})`, `v10DeletePYQ('${p.id}','${s}',${unitId})`)}</div>`).join('')}</div>` : ''}`;
}

export async function v10UploadPYQReliable(subjectName, unitId) {
  const before = JSON.parse(localStorage.getItem('edusync_admin_pyqs') || '[]').length;
  const result = await v10UploadPYQWithLogs(subjectName, unitId);
  const after = JSON.parse(localStorage.getItem('edusync_admin_pyqs') || '[]').length;
  if (after > before) console.log('[PYQ] Save Success', { subjectName, unitId });
  return result;
}
