// Common legacy helpers used across modules
const esc = (value) => String(value ?? '').replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
const js = (value) => String(value ?? '').replace(/\\/g, '\\\\').replace(/'/g, "\\'");
const sb = () => window.__AIMEASY_SUPABASE__;
const todayKeyDb = (date = new Date()) => date.toISOString().slice(0, 10);
const pctFromCgpa = (cgpa) => Math.max(0, Math.min(100, Number(cgpa || 0) * 9.5));

export async function loadStudentUnitContentFromDb(subjectId, unitNum) {
  // Deprecated: No longer merging content into local storage.
  // Each render function (renderNotes, renderPYQ, renderIQ) fetches its own data directly from Supabase.
}

export function openSASubjectUnits(id) {
  const subjects = JSON.parse(localStorage.getItem('edusync_custom_subjects') || '[]');
  const subj = subjects.find(s => s.id === id);
  if (!subj) return;
  APP.saCurrentSubject = subj;
  renderSAUnitsPage(subj);
}

export function renderSAUnitsPage(subj) {
  const content = document.getElementById('sa-content');
  if (!content) return;
  const units = JSON.parse(localStorage.getItem('edusync_units_' + subj.id) || '[]');
  const defaultUnits = units.length ? units : Array.from({ length: 5 }, (_, i) => ({ id: i + 1, name: `Unit ${i + 1}`, topics: [] }));
  content.innerHTML = `
  <div style="padding:2rem;max-width:1100px;margin:0 auto;width:100%;">
    <button class="back-btn" onclick="switchSASection('subjects')">← Back to Subjects</button>
    <div style="margin:1rem 0 1.5rem;">
      <h2 style="font-size:1.3rem;font-weight:800;letter-spacing:-0.02em;margin-bottom:4px;">📖 ${subj.name}</h2>
      <div style="display:flex;gap:6px;flex-wrap:wrap;">
        <span class="badge badge-primary">${subj.sem}</span>
        <span class="badge badge-teal">${subj.uni}</span>
        <span class="badge badge-lavender">${subj.reg}</span>
      </div>
    </div>
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:1rem;">
      <h3 style="font-size:1rem;font-weight:700;">Units (${defaultUnits.length})</h3>
      <button class="btn btn-primary btn-sm" onclick="saAddUnit(${subj.id})">+ Add Unit</button>
    </div>
    <div id="sa-units-list">
      ${defaultUnits.map((u, i) => `
        <div class="card" style="padding:1rem;margin-bottom:10px;">
          <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px;">
            <div style="width:32px;height:32px;border-radius:8px;background:var(--primary-light);display:flex;align-items:center;justify-content:center;font-weight:800;color:var(--primary);font-size:0.88rem;flex-shrink:0;">${u.id}</div>
            <div style="flex:1;"><span style="font-weight:700;font-size:0.9rem;">${u.name}</span></div>
            <button class="btn btn-ghost btn-sm" onclick="saEditUnit(${subj.id},${i})">✏️</button>
            <button class="btn btn-danger btn-sm" onclick="saDeleteUnit(${subj.id},${i})">✕</button>
          </div>
          <div style="margin-left:42px;">
            <div style="font-size:0.75rem;font-weight:700;text-transform:uppercase;letter-spacing:0.07em;color:var(--text3);margin-bottom:6px;">Subtopics</div>
            <div id="sa-topics-${u.id}" style="margin-bottom:8px;">
              ${(u.topics || []).map((t, ti) => `
                <div style="display:flex;align-items:center;gap:8px;padding:6px 10px;background:var(--surface2);border:1px solid var(--border);border-radius:var(--radius-sm);margin-bottom:4px;font-size:0.82rem;">
                  <span style="flex:1;font-weight:600;">${t.name}</span>
                  
                  <button class="btn btn-danger btn-sm" onclick="saDeleteTopic(${subj.id},${i},${ti})">✕</button>
                </div>`).join('')}
            </div>
            <div style="display:flex;gap:6px;flex-wrap:wrap;">
              <input class="input" id="sa-topic-name-${u.id}" placeholder="Subtopic name" style="max-width:200px;">

              <button class="btn btn-teal btn-sm" onclick="saAddTopic(${subj.id},${i},${u.id})">+ Add</button>
            </div>
          </div>
        </div>`).join('')}
    </div>
  </div>`;
}

export async function v10SAOpenUnits(subjId) {
  document.querySelectorAll('.v10-popup').forEach(p => p.remove());

  // Fetch subject from Supabase by ID — no localStorage
  if (!window.aimeasyFetchSubjects) {
    showToast('Supabase not ready', 'red');
    return;
  }

  const { data: allSubjects, error } = await window.aimeasyFetchSubjects({});
  if (error) { showToast('Could not load subject: ' + error.message, 'red'); return; }
  const subj = (allSubjects || []).find(s => String(s.id) === String(subjId));
  if (!subj) { showToast('Subject not found in database', 'red'); return; }

  // Normalize to the shape v10SAUnitsPage expects
  const normalizedSubj = {
    id: subj.id,
    name: subj.name,
    code: subj.code || '',
    sem: subj.semester || '',
    semester: subj.semester || '',
    uni: subj.university_name || 'JNTUK',
    university_name: subj.university_name || 'JNTUK',
    reg: subj.regulation_code || 'R23',
    regulation_code: subj.regulation_code || 'R23',
    branch: subj.branch || 'CSE',
    credits: subj.credits || 3
  };

  window._v10SASubj = normalizedSubj;
  await v10SAUnitsPage(normalizedSubj);
}

export async function v10SAUnitsPage(subj) {
  const content = document.getElementById('sa-content');
  if (!content) return;

  content.innerHTML = `
  <div style="padding:2rem;max-width:1100px;margin:0 auto;width:100%;text-align:center;">
    <div class="loading-spinner" style="margin: 3rem auto 1rem;"></div>
    <p style="color:var(--text3);">Loading units from Supabase...</p>
  </div>`;

  let uList = [];
  let contentCounts = {}; // unitId -> { notes, videos, topics }

  if (window.aimeasyFetchUnits) {
    const { data: dbUnits, error: unitErr } = await window.aimeasyFetchUnits(subj.id);
    console.log('SUBJECT ID:', subj.id);
    console.log('DB UNITS:', dbUnits);
    if (unitErr) {
      showToast('Failed to load units: ' + unitErr.message, 'red');
    } else if (dbUnits && dbUnits.length) {
      uList = dbUnits.map(u => ({
        id: u.id,
        sort_order: u.sort_order,
        name: u.title || `Unit ${u.sort_order}`,
        topics: []
      }));
    }
    console.log('ULIST:', uList);
    console.log('ULIST LENGTH:', uList.length);
  }

  // If no units in DB yet, show empty state (don't generate phantom units)
  const unitCards = uList.map((u) => {
    return `
    <div
  class="v10-unit-card"
  data-subject-id="${subj.id}"
  data-unit-id="${u.id}">
      <div style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:8px;">
        <div class="v10-unit-num">${u.sort_order || u.id}</div>
        <div style="display:flex;gap:4px;" onclick="event.stopPropagation()">
          <button class="v10-dot-btn" onclick="v10SAEditUnit('${subj.id}','${u.id}')" title="Edit" style="font-size:.8rem;">✏️</button>
          <button class="v10-dot-btn" onclick="v10SADeleteUnit('${subj.id}','${u.id}')" title="Delete" style="font-size:.8rem;color:var(--red);">🗑</button>
        </div>
      </div>
      <div class="v10-unit-name">${u.name}</div>
      <div class="v10-unit-meta">Click to add roadmap &amp; content</div>
      <div class="v10-unit-badges"><span class="badge badge-amber">DB ✓</span></div>
      <div class="v10-unit-arrow">Click to add roadmap &amp; content →</div>
    </div>`;
  }).join('');
  console.log('UNIT CARDS:', unitCards);
  console.log('UNIT CARDS LENGTH:', unitCards.length);

  content.innerHTML = `
  <div style="padding:2rem;max-width:1100px;margin:0 auto;width:100%;">
    <button class="back-btn" onclick="v10SASubjects()">← Back to Subjects</button>
    <div style="margin:1rem 0 .5rem;">
      <h2 style="font-size:1.25rem;font-weight:800;letter-spacing:-.02em;margin-bottom:6px;">📖 ${subj.name}</h2>
      <div style="display:flex;gap:6px;flex-wrap:wrap;">
        <span class="badge badge-primary">${subj.sem || subj.semester || '—'}</span>
        <span class="badge badge-teal">${subj.uni || subj.university_name || 'JNTUK'}</span>
        <span class="badge badge-lavender">${subj.reg || subj.regulation_code || 'R23'}</span>
        <span class="badge badge-amber">${subj.branch || 'CSE'}</span>
      </div>
    </div>
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:.4rem;">
      <p style="font-size:.79rem;color:var(--text3);">Click a unit card to open its learning roadmap and upload content</p>
      <button class="btn btn-primary btn-sm" onclick="v10SAAddUnit('${subj.id}')">+ Add Unit</button>
    </div>
    ${uList.length
      ? `<div class="v10-unit-grid">${unitCards}</div>`
      : `<div style="text-align:center;padding:3rem;color:var(--text3);">
          <div style="font-size:3rem;margin-bottom:1rem;">📚</div>
          <div style="font-weight:600;">No units yet</div>
          <div style="font-size:.82rem;">Click "+ Add Unit" to create units for this subject</div>
        </div>`}
  </div>`;
  // Attach click handlers to unit cards
  document.querySelectorAll('.v10-unit-card').forEach(card => {
    card.addEventListener('click', () => {
      const subjectId = card.dataset.subjectId;
      const unitId = card.dataset.unitId;

      console.log('UNIT CLICKED');
      console.log('SUBJECT', subjectId);
      console.log('UNIT', unitId);

      v10SAUnitDetail(subjectId, unitId);
    });
  });
}

export async function v10SAAddUnit(subjId) {
  if (!window.aimeasyFetchUnits || !window.aimeasyCreateUnit) {
    showToast('Supabase not ready', 'red');
    return;
  }
  const { data: existingUnits } = await window.aimeasyFetchUnits(subjId);
  const currentCount = (existingUnits || []).length;
  const newSortOrder = currentCount + 1;
  const name = prompt('Unit name:', `Unit ${newSortOrder}`);
  if (!name) return;

  showToast('Creating unit in Supabase...', 'blue');
  const { data, error } = await window.aimeasyCreateUnit(subjId, {
    name: name.trim(),
    title: name.trim(),
    sort_order: newSortOrder
  });
  if (error) { showToast('Failed to create unit: ' + error.message, 'red'); return; }
  showToast('✅ Unit added to database!', 'green');
  await v10SAUnitsPage(window._v10SASubj);
}

export async function v10SAEditUnit(subjId, unitId) {
  if (!window.aimeasyUpdateUnit) { showToast('Supabase not ready', 'red'); return; }
  const { data: units } = await window.aimeasyFetchUnits(subjId);
  const unit = (units || []).find(u => String(u.id) === String(unitId));
  if (!unit) { showToast('Unit not found', 'red'); return; }

  const name = prompt('Unit name:', unit.title || unit.name);
  if (!name) return;

  showToast('Saving...', 'blue');
  const { error } = await window.aimeasyUpdateUnit(unitId, { name: name.trim(), title: name.trim() });
  if (error) { showToast('Update failed: ' + error.message, 'red'); return; }
  showToast('✅ Unit updated!', 'green');
  await v10SAUnitsPage(window._v10SASubj);
}

export async function v10SADeleteUnit(subjId, unitId) {
  if (!confirm('Delete this unit and all its content from the database?')) return;
  if (!window.aimeasyDeleteUnit) { showToast('Supabase not ready', 'red'); return; }

  showToast('Deleting from Supabase...', 'blue');
  const { error } = await window.aimeasyDeleteUnit(unitId);
  if (error) { showToast('Delete failed: ' + error.message, 'red'); return; }
  showToast('Unit deleted from database', 'red');
  await v10SAUnitsPage(window._v10SASubj);
}

export function v10UnitMenu(btn, subjId, unitId) {

  document
    .querySelectorAll('.v10-popup')
    .forEach(p => p.remove());

  const popup = document.createElement('div');

  popup.className = 'v10-popup';

  popup.innerHTML = `
    <button class="v10-popup-item"
      onclick="v10SAEditUnit('${subjId}','${unitId}')">
      ✏️ Edit
    </button>

    <button class="v10-popup-item red"
      onclick="v10SADeleteUnit('${subjId}','${unitId}')">
      🗑 Delete
    </button>
  `;

  btn.parentElement.appendChild(popup);
}

export async function v10SAUnitDetail(subjId, unitId) {
  window._v10SASubjId = subjId;
  window._v10SAUnitId = unitId;
  const subj = window._v10SASubj;

  // Fetch unit from Supabase — no localStorage
  let unit = { id: unitId, dbUnitId: unitId, name: `Unit`, topics: [], sort_order: 1 };
  if (window.aimeasyFetchUnits && subjId) {
    const { data: dbUnits } = await window.aimeasyFetchUnits(subjId);
    const found = (dbUnits || []).find(u => String(u.id) === String(unitId));
    if (found) {
      unit = {
        id: found.id,
        dbUnitId: found.id,
        sort_order: found.sort_order,
        name: found.title || `Unit ${found.sort_order}`,
        topics: []
      };
    }
  }

  // Load roadmap topics from DB
  if (subj) {
    const dbUnit = await v10ReloadUnitRoadmapFromDb(subjId, unitId, subj, unit);
    if (dbUnit) unit = { ...unit, ...dbUnit };
  }
  await v10ReloadUnitContentFromDb(subj?.name || '', unitId);

  const content = document.getElementById('sa-content');
  if (!content) return;

  content.innerHTML = `
  <div style="padding:2rem;max-width:1200px;margin:0 auto;width:100%;">
    <button class="back-btn" onclick="v10SAUnitsPage(window._v10SASubj)">← Back to Units</button>
    <div style="margin:1rem 0 .3rem;">
      <h2 style="font-size:1.15rem;font-weight:800;margin-bottom:4px;">Unit - ${unit.sort_order || 1}</h2>
      <p style="font-size:.78rem;color:var(--text3);">Build the learning roadmap on the left · Add notes, PYQs and important questions on the right</p>
    </div>
    <div class="v10-detail-wrap">
      ${v10RoadmapPanel(subjId, unitId, unit.topics || [])}
      ${v10ContentPanel(subj ? subj.name : '', unitId, 'sa')}
    </div>
  </div>`;
}

export function v10UnitTopics(unitId) {
  const subj = window._v10SASubj || {};
  const units = JSON.parse(localStorage.getItem('edusync_units_' + subj.id) || '[]');
  return (units.find(u => parseInt(u.id) === parseInt(unitId))?.topics || []);
}

export function v10UnitForDb(unitId) {
  const subject = v10SubjectForDb('');
  const units = JSON.parse(localStorage.getItem('edusync_units_' + subject?.id) || '[]');
  const unit = units.find(u => parseInt(u.id) === parseInt(unitId)) || { id: unitId, name: `Unit ${unitId}` };
  return { ...unit, dbUnitId: subject?.dbUnitIds?.[unitId] || unit?.dbUnitId };
}

export function v10StoreUnitTopics(subjId, unitId, topics, unitName) {
  let units = JSON.parse(localStorage.getItem('edusync_units_' + subjId) || '[]');
  if (!units.length) units = Array.from({ length: 5 }, (_, i) => ({ id: i + 1, name: `Unit ${i + 1}`, topics: [] }));
  const ui = units.findIndex(u => parseInt(u.id) === parseInt(unitId));
  if (ui >= 0) units[ui] = { ...units[ui], topics };
  else units.push({ id: unitId, name: unitName || `Unit ${unitId}`, topics });
  localStorage.setItem('edusync_units_' + subjId, JSON.stringify(units));
  return units;
}

export async function v10ReloadUnitRoadmapFromDb(subjId, unitId, subject, unit) {
  if (!window.aimeasyFetchUnitRoadmap || !subject) return null;
  const { data, error } = await window.aimeasyFetchUnitRoadmap({ subject, unit });
  if (error) {
    console.warn('Roadmap DB reload failed:', error);
    return null;
  }
  v10PersistSubjectDbIds(subjId, unitId, data);
  const units = v10StoreUnitTopics(subjId, unitId, data.topics || [], unit?.name);
  const roadmaps = JSON.parse(localStorage.getItem('edusync_roadmaps') || '{}');
  if (!roadmaps[subjId]) roadmaps[subjId] = [];
  const rm = roadmaps[subjId].find(r => parseInt(r.unit) === parseInt(unitId));
  if (rm) rm.topics = data.topics || [];
  else roadmaps[subjId].push({ unit: unitId, topics: data.topics || [] });
  localStorage.setItem('edusync_roadmaps', JSON.stringify(roadmaps));
  return units.find(u => parseInt(u.id) === parseInt(unitId)) || null;
}

export async function v10GetDbContextForUnit(subjectName, unitId) {
  const subject = v10SubjectForDb(subjectName);
  if (!window.aimeasyFetchUnitRoadmap || !subject) return null;
  const { data, error } = await window.aimeasyFetchUnitRoadmap({
    subject,
    unit: { id: unitId, name: `Unit ${unitId}`, dbUnitId: subject?.dbUnitIds?.[unitId] },
  });
  if (error) {
    console.warn('Content DB context failed:', error);
    return null;
  }
  return data;
}

export function v10MergeUnitContentRows(subjectName, unitId, notesRows = [], pyqRows = [], iqRows = []) {
  const branch = v10BranchForSubject(subjectName);
  function mergeByDbId(key, rows, mapRow) {
    const all = JSON.parse(localStorage.getItem(key) || '[]').filter(item => (
      item.subject !== subjectName || parseInt(item.unit) !== parseInt(unitId) || !item.dbContentId || !v10SameBranchContent(item, branch)
    ));
    const mapped = (rows || []).map(mapRow);
    localStorage.setItem(key, JSON.stringify([...all, ...mapped]));
  }
  mergeByDbId('edusync_admin_notes', notesRows, row => ({
    id: row.id,
    dbContentId: row.id,
    title: row.title || row.metadata?.topicTitle || 'Note',
    description: row.body || '',
    type: 'link',
    link: row.url || '',
    subject: subjectName,
    branch: row.branch || row.metadata?.branch || branch,
    unit: unitId,
    topicId: row.metadata?.topicLegacyId || row.metadata?.topicId || '',
    topicName: row.metadata?.topicTitle || row.metadata?.topicText || row.title || '',
    uploadedAt: row.created_at ? new Date(row.created_at).toLocaleDateString() : '',
  }));
  mergeByDbId('edusync_admin_pyqs', pyqRows, row => ({
    id: row.id,
    dbContentId: row.id,
    question: row.body || row.title || '',
    year: row.metadata?.year || '',
    marks: row.metadata?.marks || '',
    count: row.metadata?.count || 1,
    answer: row.metadata?.answer || '',
    subject: subjectName,
    branch: row.branch || row.metadata?.branch || branch,
    unit: unitId,
    topicId: row.metadata?.topicLegacyId || row.metadata?.topicId || '',
    topicName: row.metadata?.topicTitle || row.metadata?.topicText || '',
  }));
  mergeByDbId('edusync_admin_iqs', iqRows, row => ({
    id: row.id,
    dbContentId: row.id,
    question: row.body || row.title || '',
    priority: row.metadata?.priority || 'med',
    tags: row.metadata?.tags || '',
    subject: subjectName,
    branch: row.branch || row.metadata?.branch || branch,
    unit: unitId,
    topicId: row.metadata?.topicLegacyId || row.metadata?.topicId || '',
    topicName: row.metadata?.topicTitle || row.metadata?.topicText || '',
    uploadedAt: row.created_at ? new Date(row.created_at).toLocaleString() : '',
  }));
}

export async function v10ReloadUnitContentFromDb(subjectName, unitId) {
  if (!window.aimeasyListContent) return;
  const ctx = await v10GetDbContextForUnit(subjectName, unitId);
  if (!ctx?.subjectId || !ctx?.unitId) return;
  const [notesResult, pyqsResult, iqsResult] = await Promise.all([
    window.aimeasyListContent({ subjectId: ctx.subjectId, unitId: ctx.unitId, contentType: 'note' }),
    window.aimeasyListContent({ subjectId: ctx.subjectId, unitId: ctx.unitId, contentType: 'pyq' }),
    window.aimeasyListContent({ subjectId: ctx.subjectId, unitId: ctx.unitId, contentType: 'iq' }),
  ]);
  if (notesResult?.error || pyqsResult?.error || iqsResult?.error) {
    console.warn('Content DB reload failed:', notesResult?.error || pyqsResult?.error || iqsResult?.error);
    return;
  }
  v10MergeUnitContentRows(subjectName, unitId, notesResult.data || [], pyqsResult.data || [], iqsResult.data || []);
}

export function markUnitCompletedIfReady(subjectId, unitId) {
  const subject = APP.currentSubject;
  const units = readStudentJson('edusync_units_' + (subject?.rawId || String(subjectId || '').replace('custom_', '')), []);
  const unit = units.find(item => String(item.id) === String(unitId));
  const topics = unit?.topics || [];
  if (!topics.length) return;
  const completed = readStudentJson('edusync_completed_topics', []);
  const unitDone = topics.every((topic, idx) => completed.includes(`${subjectId}-${unitId}-${idx}`));
  if (!unitDone) return;
  const unitsDone = readStudentJson('edusync_completed_units', []);
  const key = `${subjectId}-${unitId}`;
  if (!unitsDone.some(item => item.key === key)) {
    unitsDone.push({ key, subjectId, unitId, at: new Date().toISOString(), day: todayKey() });
    writeStudentJson('edusync_completed_units', unitsDone);
  }
}

export function studentUnitStateKey(subjectId = APP.currentSubject?.id, unitId = APP.currentUnit) {
  const userId = APP.user?.id || APP.user?.googleId || APP.user?.email || 'guest';
  return `edusync_student_unit_state_${userId}_${subjectId || 'subject'}_${unitId || 'unit'}`;
}

export function readStudentUnitState(subjectId, unitId) {
  try {
    return JSON.parse(localStorage.getItem(studentUnitStateKey(subjectId, unitId)) || '{}');
  } catch {
    return {};
  }
}

export function writeStudentUnitState(patch = {}) {
  const subjectId = APP.currentSubject?.id || APP.currentSubject?.rawId || 'subject';
  const unitId = APP.currentUnit || 'unit';
  const current = readStudentUnitState(subjectId, unitId);
  localStorage.setItem(studentUnitStateKey(subjectId, unitId), JSON.stringify({
    ...current,
    subjectId,
    unitId,
    updatedAt: new Date().toISOString(),
    ...patch,
  }));
}
