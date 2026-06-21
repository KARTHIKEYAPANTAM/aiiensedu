// Common legacy helpers used across modules
const esc = (value) => String(value ?? '').replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
const js = (value) => String(value ?? '').replace(/\\/g, '\\\\').replace(/'/g, "\\'");
const sb = () => window.__AIMEASY_SUPABASE__;
const todayKeyDb = (date = new Date()) => date.toISOString().slice(0, 10);
const pctFromCgpa = (cgpa) => Math.max(0, Math.min(100, Number(cgpa || 0) * 9.5));

export function openUnit(unitNum, subjectId) {
  APP.currentUnit = unitNum;
  recordStudyActivity('unit_opened', {
    subjectId: subjectId || APP.currentSubject?.id || '',
    subjectName: APP.currentSubject?.name || '',
    unitId: unitNum
  });
  navigateTo('unit-content');
  const pg = document.getElementById('page-unit-content');
  const subj = APP.currentSubject;
  const subjectName = subj?.name || 'Subject';

  document.querySelectorAll('.tab-pane').forEach(p => {
    p.classList.remove('active');
    p.style.display = 'none';
  });

  document.getElementById('unit-content-title').textContent = `${subj?.icon || '📚'} Unit ${unitNum} — ${subjectName}`;
  document.getElementById('unit-content-sub').textContent = `Explore Roadmap, Notes, and PYQs`;
  document.getElementById('topbar-title').textContent = `Unit ${unitNum}`;
  document.getElementById('topbar-breadcrumb').innerHTML = `${subjectName} / <span>Unit ${unitNum}</span>`;
  {
    const displayUnit = window.aimeasyUnitLabel ? window.aimeasyUnitLabel(unitNum) : `Unit - ${unitNum}`;
    document.getElementById('unit-content-title').textContent = `${subj?.icon || ''} ${displayUnit} - ${subjectName}`.trim();
    document.getElementById('topbar-title').textContent = displayUnit;
    document.getElementById('topbar-breadcrumb').innerHTML = `${subjectName} / <span>${displayUnit}</span>`;
  }

  switchTab('videos');
  setTimeout(restoreRoadmapSidebarState, 10);

  renderVideoList(subjectId || subj?.id || 'default', unitNum);
  renderNotes(subjectId || subj?.id, unitNum);
  renderPYQ(null, subjectId || subj?.id, unitNum);
  renderIQ(subjectId || subj?.id, unitNum);
  setTimeout(renderPendingUrls, 80);
}

export function switchTab(tab) {
  // UPDATE: Fix tab switching — deactivate all panes and buttons first
  document.querySelectorAll('.content-tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.tab-pane').forEach(p => {
    p.classList.remove('active');
    p.style.display = 'none';
  });
  // Activate the selected tab pane
  const pane = document.getElementById('tab-' + tab);
  if (pane) {
    pane.classList.add('active');
    pane.style.display = 'block';
  }
  // Activate the selected tab button
  const btn = document.getElementById('tab-btn-' + tab);
  if (btn) btn.classList.add('active');
  APP.currentTab = tab;
}

export function backToUnits() {
  document.querySelectorAll('[id^="page-"]').forEach(p => p.style.display = 'none');
  document.getElementById('page-units').style.display = 'block';
  document.getElementById('topbar-title').textContent = APP.currentSubject?.name || 'Subject';
  document.getElementById('topbar-breadcrumb').innerHTML = `Subjects / <span>${APP.currentSubject?.name || ''}</span>`;
}
