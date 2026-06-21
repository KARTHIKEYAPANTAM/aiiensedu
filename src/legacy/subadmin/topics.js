// Common legacy helpers used across modules
const esc = (value) => String(value ?? '').replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
const js = (value) => String(value ?? '').replace(/\\/g, '\\\\').replace(/'/g, "\\'");
const sb = () => window.__AIMEASY_SUPABASE__;
const todayKeyDb = (date = new Date()) => date.toISOString().slice(0, 10);
const pctFromCgpa = (cgpa) => Math.max(0, Math.min(100, Number(cgpa || 0) * 9.5));

export function saveCalcState() {
  try {
    const data = {
      calcSemesters: APP.calcSemesters,
      currentSemId: APP.currentSemId
    };
    localStorage.setItem('edusync_cgpa_data', JSON.stringify(data));
    console.log('Saving CGPA', data);
  } catch (e) {
    console.warn('Failed to save CGPA calculator state:', e);
  }
}

export function saveCurrentSemRows() {
  const sem = APP.calcSemesters.find(s => s.id === APP.currentSemId);
  if (!sem) return;
  const rows = [];
  document.querySelectorAll('#calc-tbody tr').forEach(row => {
    const inputs = row.querySelectorAll('input,select');
    rows.push({ name: inputs[0]?.value || '', credits: inputs[1]?.value || '3', grade: inputs[2]?.value || 'A' });
  });
  sem.rows = rows;
  saveCalcState();
}

export function subAdminBack_LEGACY() {
  // Overridden
}

export function saveRoadmap() {
  const creator = document.getElementById('sa-roadmap-creator');
  const subjectId = creator?.dataset.subjectId;
  const subjectName = creator?.dataset.subjectName;
  if (!subjectId) { showToast('No subject selected', 'red'); return; }

  const roadmaps = JSON.parse(localStorage.getItem('edusync_roadmaps') || '{}');
  const units = [];
  for (let u = 0; u < 5; u++) {
    const container = document.getElementById(`roadmap-unit-${u}`);
    const topics = [];
    if (container) {
      container.querySelectorAll('input').forEach(inp => {
        if (inp.value.trim()) topics.push(inp.value.trim());
      });
    }
    units.push({ unit: u + 1, topics });
  }
  roadmaps[subjectId] = units;
  localStorage.setItem('edusync_roadmaps', JSON.stringify(roadmaps));
  showToast('✅ Learning roadmap saved! Students will see this as their learning path.', 'green');
  creator.style.display = 'none';
  renderSASubjects();
}

export function saAddTopic(subjId, unitIdx, unitId) {
  const nameInput = document.getElementById('sa-topic-name-' + unitId);
  const name = nameInput?.value.trim();
  if (!name) { showToast('Enter subtopic name', 'red'); return; }
  const units = JSON.parse(localStorage.getItem('edusync_units_' + subjId) || '[]');
  if (!units[unitIdx]) {
    const defaultUnits = Array.from({ length: 5 }, (_, i) => ({ id: i + 1, name: `Unit ${i + 1}`, topics: [] }));
    defaultUnits[unitIdx].topics.push({ name });
    localStorage.setItem('edusync_units_' + subjId, JSON.stringify(defaultUnits));
  } else {
    if (!units[unitIdx].topics) units[unitIdx].topics = [];
    units[unitIdx].topics.push({ name });
    localStorage.setItem('edusync_units_' + subjId, JSON.stringify(units));
  }
  if (nameInput) nameInput.value = '';
  const subj = JSON.parse(localStorage.getItem('edusync_custom_subjects') || '[]').find(s => s.id === subjId);
  if (subj) renderSAUnitsPage(subj);
  showToast('✅ Subtopic added! Visible in student roadmap.', 'green');
}

export function saDeleteTopic(subjId, unitIdx, topicIdx) {
  const units = JSON.parse(localStorage.getItem('edusync_units_' + subjId) || '[]');
  if (units[unitIdx]?.topics) {
    units[unitIdx].topics.splice(topicIdx, 1);
    localStorage.setItem('edusync_units_' + subjId, JSON.stringify(units));
  }
  const subj = JSON.parse(localStorage.getItem('edusync_custom_subjects') || '[]').find(s => s.id === subjId);
  if (subj) renderSAUnitsPage(subj);
  showToast('Topic deleted', 'red');
}

export function subAdminBack() {
  localStorage.removeItem('edusync_session_user');
  APP.adminType = null; APP.subAdminData = null;
  showScreen('screen-landing');
}

export function saCreateSubjectNew() {
  const branch = document.getElementById('sa-sub-branch')?.value;
  const year = document.getElementById('sa-sub-year')?.value;
  const sem = document.getElementById('sa-sub-sem')?.value;
  const reg = document.getElementById('sa-sub-reg')?.value;
  const uni = document.getElementById('sa-sub-uni')?.value;
  const credits = document.getElementById('sa-sub-credits')?.value;
  const name = document.getElementById('sa-sub-name')?.value.trim();
  const code = document.getElementById('sa-sub-code')?.value.trim();
  if (!branch || !sem || !reg || !uni || !name) { showToast('Fill all required fields', 'red'); return; }
  const subjects = JSON.parse(localStorage.getItem('edusync_custom_subjects') || '[]');
  subjects.push({ id: Date.now(), branch, year, sem, reg, uni, credits, name, code });
  localStorage.setItem('edusync_custom_subjects', JSON.stringify(subjects));
  showToast('✅ Subject created! Now visible to students.', 'green');
  renderSASection('subjects');
}

export function saEditSubject(id) {
  const subjects = JSON.parse(localStorage.getItem('edusync_custom_subjects') || '[]');
  const s = subjects.find(x => x.id === id);
  if (!s) return;
  const newName = prompt('Edit subject name:', s.name);
  if (!newName) return;
  const newSem = prompt('Edit semester:', s.sem);
  const newReg = prompt('Edit regulation:', s.reg);
  s.name = newName.trim();
  if (newSem) s.sem = newSem;
  if (newReg) s.reg = newReg;
  localStorage.setItem('edusync_custom_subjects', JSON.stringify(subjects));
  showToast('✅ Subject updated!', 'green');
  renderSASection('subjects');
}

export function saDeleteSubjectConfirm(id, name) {
  if (!confirm(`Delete subject "${name}" and all its content?`)) return;
  const subjects = JSON.parse(localStorage.getItem('edusync_custom_subjects') || '[]');
  localStorage.setItem('edusync_custom_subjects', JSON.stringify(subjects.filter(s => s.id !== id)));
  localStorage.removeItem('edusync_units_' + id);
  showToast('Subject deleted', 'red');
  renderSASection('subjects');
}

export async function renderSubAdminCurriculumrenderSubAdminCurriculum() {
  const content = document.getElementById('sa-content');
  if (!content) return;
  const curriculums = await aimLoadCurriculums();
  content.innerHTML = `<div style="padding:2rem;max-width:1100px;margin:0 auto;width:100%;">
    <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:12px;margin-bottom:1rem;">
      <div><h2 style="font-size:1.35rem;font-weight:800;">Curriculum</h2>
      <p style="font-size:.82rem;color:var(--text3);">Blueprint-only curriculum. Create Subject content stays separate.</p></div>
    </div>
    ${aimCurriculumForm()}
    <div class="v10-items">
      <div class="v10-items-head">Curriculum Blueprints (${curriculums.length})</div>
      ${curriculums.map(cur => `<div class="v10-item">
        <div class="v10-item-body">
          <div class="v10-item-title">${v10Html(cur.subjectName)} ${aimStatusBadge(cur.status)}</div>
          <div class="v10-item-meta">${v10Html(cur.subjectCode || '')} · ${(cur.units || []).length} unit(s)</div>
          <div class="roadmap-video-tree">${(cur.units || []).map(unit => `<div class="roadmap-video-child">${v10Html(unit.unitName)} ${aimStatusBadge(unit.status)}: ${(unit.topics || []).map(t => v10Html(t.topicName)).join(', ')}</div>`).join('')}</div>
        </div>
        ${cur.status === 'Sent To SubAdmin' ? `<button class="btn btn-primary btn-sm" onclick="aimReviewCurriculum('${cur.id}','Published')">Approve</button><button class="btn btn-ghost btn-sm" onclick="aimReviewCurriculum('${cur.id}','Returned')">Reject</button>` : ''}
      </div>`).join('') || '<p style="padding:1rem;color:var(--text3);">No curriculum blueprints yet.</p>'}
    </div>
  </div>`;
}
