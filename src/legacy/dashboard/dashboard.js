// Common legacy helpers used across modules
const esc = (value) => String(value ?? '').replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
const js = (value) => String(value ?? '').replace(/\\/g, '\\\\').replace(/'/g, "\\'");
const sb = () => window.__AIMEASY_SUPABASE__;
const todayKeyDb = (date = new Date()) => date.toISOString().slice(0, 10);
const pctFromCgpa = (cgpa) => Math.max(0, Math.min(100, Number(cgpa || 0) * 9.5));

export function showScreen(id, role) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  const screen = document.getElementById(id);
  if (!screen) {
    logAuth('showScreen target missing', { id });
    return;
  }
  screen.classList.add('active');
  if (role) APP.role = role;
  if (id === 'screen-landing') {
    updateLandingStats();
  }
}

export function selectRole(role) {
  APP.role = role;
  document.querySelectorAll('.role-card').forEach(c => c.classList.remove('selected'));
  const cardId = role === 'content_creator' ? 'role-creator' : 'role-' + role;
  document.getElementById(cardId)?.classList.add('selected');
}

export function launchApp() {
  showScreen('screen-app');
  updateSidebarProfile();
  document.getElementById('chat-fab').style.display = 'flex';
  if (!shouldPreserveStudentRouteOnLaunch()) {
    navigateTo('dashboard');
  }
}

export function currentHashPath() {
  const raw = (window.location.hash || '').replace(/^#/, '');
  if (!raw || raw === '/') return '/landing';
  return raw.startsWith('/') ? raw : `/${raw}`;
}

export function shouldPreserveStudentRouteOnLaunch() {
  const path = currentHashPath();
  const exactStudentRoutes = new Set([
    '/student/dashboard',
    '/student/subjects',
    '/student/calculator',
    '/student/backlog',
    '/student/skills',
    '/student/units',
    '/student/unit-content',
  ]);

  return (
    exactStudentRoutes.has(path) ||
    /^\/student\/subjects\/[^/]+$/.test(path) ||
    /^\/student\/units\/[^/]+$/.test(path) ||
    /^\/student\/unit-content\/[^/]+\/[^/]+$/.test(path)
  );
}

export function updateDashGreeting() {
  const user = resolveAppUser();
  const greetEl = document.getElementById('dash-greeting-text');
  if (!user || !greetEl) return;
  const h = new Date().getHours();
  const greet = h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
  const firstName = user.name?.split(' ')[0] || 'Student';
  greetEl.textContent = `${greet}, ${firstName}! 👋`;
}

export function updateSidebarProfile() {
  const user = resolveAppUser();
  if (!user) return;
  const name = user.name || 'Student';
  const initials = name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  const av = document.getElementById('sidebar-avatar');
  if (!av) return;
  if (user.photo) {
    av.innerHTML = `<img src="${user.photo}" alt="${name}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">`;
  } else {
    av.textContent = initials;
  }
  const nameEl = document.getElementById('sidebar-name');
  const infoEl = document.getElementById('sidebar-info');
  if (nameEl) nameEl.textContent = name.split(' ')[0];
  const yearVal = String(user.year || '');
  const yr = yearVal
    ? yearVal + (yearVal === '1' ? 'st' : yearVal === '2' ? 'nd' : yearVal === '3' ? 'rd' : 'th') + ' Year'
    : '';
  const branch = user.branch || user.branch_name || '';
  if (infoEl) infoEl.textContent = branch && yr ? `${branch} · ${yr}` : branch || yr || '';
  updateDashGreeting();
}

export function navigateTo(page) {
  console.log('[LEGACY NAVIGATE]', page);
  // Hide all pages
  document.querySelectorAll('[id^="page-"]').forEach(p => p.style.display = 'none');
  // Update nav
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  const titles = { dashboard: 'Dashboard', subjects: 'Subjects', calculator: 'Calculator', backlog: 'Backlog Subjects', skills: 'Skills Up' };
  const icons = { dashboard: '🏠', subjects: '📖', calculator: '🧮', backlog: '⚠️', skills: '⚡' };
  document.getElementById(`page-${page}`).style.display = 'block';
  document.getElementById('topbar-title').textContent = titles[page] || page;
  document.getElementById('topbar-breadcrumb').innerHTML = `Home / <span>${titles[page] || page}</span>`;
  // Activate nav
  const navItems = document.querySelectorAll('.nav-item');
  navItems.forEach(ni => {
    if (ni.querySelector('.nav-label')?.textContent.toLowerCase().includes(page.replace('backlog', 'backlog'))) ni.classList.add('active');
  });
  // Page-specific init
  if (page === 'dashboard') updateStudentDashboardMetrics();
  if (page === 'subjects') { buildSemSwitcher(); renderSubjects(); }
  if (page === 'units' && APP.currentSubject) { renderUnits(APP.currentSubject); }
  if (page === 'unit-content' && APP.currentSubject && APP.currentUnit) { renderVideoList(APP.currentSubject.id || APP.currentSubject.rawId || APP.currentSubject, APP.currentUnit); }
  if (page === 'backlog') renderBacklog();
  if (page === 'calculator') renderCalc();
  if (page === 'skills') renderSkillsPage();
}

export function toggleSidebar() {
  const sidebar = document.getElementById('sidebar');
  const backdrop = document.getElementById('sidebar-backdrop');
  const hamburger = document.getElementById('hamburger-btn');
  if (sidebar.classList.contains('open')) {
    sidebar.classList.remove('open');
    backdrop.classList.remove('open');
    hamburger.classList.remove('open');
  } else {
    sidebar.classList.add('open');
    backdrop.classList.add('open');
    hamburger.classList.add('open');
  }
}

export function closeSidebar() {
  document.getElementById('sidebar').classList.remove('open');
  document.getElementById('sidebar-backdrop').classList.remove('open');
  document.getElementById('hamburger-btn').classList.remove('open');
}

export function toggleReview() {
  const sid = APP.currentSubject?.id || 'os';
  const uid = APP.currentUnit || 1;
  const key = `${sid}-${uid}-${APP.currentVideoIndex}`;
  if (APP.markedReviews.has(key)) {
    APP.markedReviews.delete(key);
    document.getElementById('review-btn').classList.remove('marked');
    document.getElementById('review-btn').textContent = '🔖 Mark for Review';
    showToast('Review mark removed', 'amber');
  } else {
    APP.markedReviews.add(key);
    document.getElementById('review-btn').classList.add('marked');
    document.getElementById('review-btn').textContent = '🔖 Marked for Review';
    showToast('📌 Added to weak area review!', 'amber');
  }
}

export function toggleReviewPersistedTopicState() {
  const sid = APP.currentSubject?.id || 'os';
  const uid = APP.currentUnit || 1;
  hydrateMarkedReviews();
  const item = APP._videoItems?.[APP.currentVideoIndex];
  const topicIndex = item?.topicIndex ?? APP.currentVideoIndex;
  const key = topicReviewKey(sid, uid, topicIndex);
  const btn = document.getElementById('review-btn');
  if (APP.markedReviews.has(key)) {
    APP.markedReviews.delete(key);
    btn?.classList.remove('marked');
    if (btn) btn.textContent = 'Mark for Review';
    persistMarkedReviews();
    syncRoadmapNodeStates();
    syncTopicProgressToDb({ subjectId: sid, unitId: uid, topicIndex, topicId: item?.id || item?.topicId || null, status: 'current' });
    showToast('Review mark removed', 'amber');
    return;
  }
  APP.markedReviews.add(key);
  btn?.classList.add('marked');
  if (btn) btn.textContent = 'Marked for Review';
  persistMarkedReviews();
  syncRoadmapNodeStates();
  syncTopicProgressToDb({ subjectId: sid, unitId: uid, topicIndex, topicId: item?.id || item?.topicId || null, status: 'review' });
  showToast('Added to review', 'amber');
}

export function addSemester() {
  const num = APP.calcSemesters.length + 1;
  const semId = 'sem-' + num;
  saveCurrentSemRows();
  APP.calcSemesters.push({ id: semId, label: 'Semester ' + num, rows: [], sgpa: null });
  APP.currentSemId = semId;
  document.getElementById('calc-tbody').innerHTML = '';
  APP.calcRows = [];
  renderSemTabs();
  renderCalcSemTitle();
  saveCalcState();
  showToast('Semester ' + num + ' added!', 'green');
}

export function switchSem(semId) {
  saveCurrentSemRows();
  APP.currentSemId = semId;
  const sem = APP.calcSemesters.find(s => s.id === semId);
  document.getElementById('calc-tbody').innerHTML = '';
  APP.calcRows = [];
  if (sem && sem.rows.length) {
    sem.rows.forEach(r => addCalcRow(r.name, r.credits, r.grade));
  } else {
    DEFAULT_SUBJECTS.forEach(s => addCalcRow(s));
  }
  renderSemTabs();
  renderCalcSemTitle();
  if (sem && sem.sgpa !== null) {
    document.getElementById('sgpa-result').textContent = sem.sgpa.toFixed(2);
  } else {
    document.getElementById('sgpa-result').textContent = '–';
  }
  saveCalcState();
}

export function renderSemTabs() {
  const container = document.getElementById('sem-tabs');
  if (!container) return;
  container.innerHTML = APP.calcSemesters.map(function (s) {
    var cls = s.id === APP.currentSemId ? 'btn-primary' : 'btn-ghost';
    var lbl = s.label + (s.sgpa !== null ? ' · ' + s.sgpa.toFixed(2) : '');
    return '<button class="btn ' + cls + ' btn-sm" onclick="switchSem(\'' + s.id + '\')">' + lbl + '</button>';
  }).join('');
}

export function renderCalcSemTitle() {
  const sem = APP.calcSemesters.find(s => s.id === APP.currentSemId);
  const el = document.getElementById('calc-sem-title');
  if (el && sem) el.textContent = sem.label + ' Subjects';
}

export function addCalcRow(name, credits, defaultGrade) {
  const id = Date.now() + Math.random();
  APP.calcRows.push(id);
  const tbody = document.getElementById('calc-tbody');
  const tr = document.createElement('tr');
  tr.id = 'row-' + id;
  const selGrade = defaultGrade || 'A';
  const selCredits = credits || '3';
  const gradeOptions = Object.keys(GRADES).map(g =>
    '<option value="' + g + '"' + (g === selGrade ? ' selected' : '') + '>' + g + '</option>'
  ).join('');
  tr.innerHTML =
    '<td class="input-cell"><input type="text" placeholder="Subject name" value="' + (name || '') + '" style="min-width:140px;"></td>' +
    '<td class="input-cell"><input type="number" min="1" max="5" value="' + selCredits + '" style="width:60px;text-align:center;"></td>' +
    '<td class="input-cell"><select style="width:70px;">' + gradeOptions + '</select></td>' +
    '<td style="text-align:center;font-weight:700;" class="pts-cell">' + (GRADES[selGrade] || 0) + '</td>' +
    '<td><button style="background:none;border:none;cursor:pointer;color:var(--red);font-size:1rem;padding:4px;" onclick="removeCalcRow(\'' + id + '\')">✕</button></td>';
  tbody.appendChild(tr);
  if (selGrade === 'F') tr.classList.add('fail-row');

  // Real-time updates and saving
  const select = tr.querySelector('select');
  select.addEventListener('change', function () {
    const pts = tr.querySelector('.pts-cell');
    pts.textContent = GRADES[this.value] ?? 0;
    if (this.value === 'F') tr.classList.add('fail-row');
    else tr.classList.remove('fail-row');
    saveCurrentSemRows();
  });

  tr.querySelectorAll('input').forEach(input => {
    input.addEventListener('input', () => {
      saveCurrentSemRows();
    });
  });

  saveCurrentSemRows();
}

export function removeCalcRow(id) {
  document.getElementById('row-' + id)?.remove();
  APP.calcRows = APP.calcRows.filter(r => r !== id);
  saveCurrentSemRows();
}

export function renderSkillsPage() {
  const grid = document.getElementById('skills-grid');
  const empty = document.getElementById('skills-empty');
  if (!grid) return;
  const skills = JSON.parse(localStorage.getItem('edusync_skills') || '[]');
  if (!skills.length) {
    grid.innerHTML = '';
    if (empty) {
      empty.style.display = 'block';
      empty.innerHTML = `<div class="coming-soon-wrap">
        <div class="coming-soon-orbit">
          <div class="orbit-center">⚡</div>
          <div class="orbit-ring" style="width:120px;height:120px;"></div>
          <div class="orbit-ring" style="width:170px;height:170px;"></div>
        </div>
        <h2 style="font-size:1.8rem;font-weight:800;margin-bottom:8px;">Skills Up</h2>
        <p style="color:var(--text2);max-width:400px;line-height:1.6;font-size:0.95rem;">Skill courses will appear here once the Admin adds them from the Admin Dashboard → Skills Up tab.</p>
      </div>`;
    }
    return;
  }
  if (empty) empty.style.display = 'none';
  const colorMap = { coding: 'teal', aptitude: 'lavender', communication: 'blue', ai: 'amber', certification: 'green', other: 'primary' };
  grid.innerHTML = skills.map((s, i) => {
    const col = colorMap[s.category] || 'primary';
    const skillVideos = JSON.parse(localStorage.getItem('edusync_skill_videos') || '[]').filter(v => v.skillId == s.id);
    const skillNotes = JSON.parse(localStorage.getItem('edusync_skill_notes') || '[]').filter(n => n.skillId == s.id);
    return `<div class="subject-card" onclick="openSkillCourse('${s.id}')" style="animation-delay:${i * 0.06}s">
      <div class="subject-card-header" style="background:linear-gradient(135deg,var(--${col}-light),rgba(255,255,255,0.5));">
        <div class="subject-icon">${s.icon || '⚡'}</div>
        <div class="subject-name">${s.name}</div>
        <div class="subject-code">${s.category || 'Skill'} · ${s.level || 'Beginner'}</div>
      </div>
      <div class="subject-card-body">
        <div class="subject-meta">
          <span class="badge badge-${col}">${skillVideos.length} Videos</span>
          <span class="badge badge-primary">${s.duration || 'Self-paced'}</span>
        </div>
        <p style="font-size:0.78rem;color:var(--text2);margin:8px 0;">${s.description || ''}</p>
        ${skillNotes.length ? `<div style="font-size:0.75rem;color:var(--text3);">📄 ${skillNotes.length} note${skillNotes.length > 1 ? 's' : ''} available</div>` : ''}
        <div class="progress-bar" style="margin-top:8px;"><div class="progress-fill" style="width:0%;"></div></div>
      </div>
    </div>`;
  }).join('');
}

export function openSkillCourse(id) {
  const skills = JSON.parse(localStorage.getItem('edusync_skills') || '[]');
  const skill = skills.find(s => s.id == id);
  if (!skill) return;
  APP.currentSubject = { id: 'skill_' + id, name: skill.name, icon: skill.icon || '⚡', credits: 0, progress: 0, isSkill: true, skillId: id };
  document.querySelectorAll('[id^="page-"]').forEach(p => p.style.display = 'none');
  document.getElementById('page-units').style.display = 'block';
  document.getElementById('units-subject-name').textContent = (skill.icon || '⚡') + ' ' + skill.name;
  document.getElementById('units-tags').innerHTML = `<span class="badge badge-teal">${skill.category || 'Skill'}</span><span class="badge badge-lavender">${skill.level || 'Beginner'}</span>`;
  document.getElementById('topbar-title').textContent = skill.name;
  document.getElementById('topbar-breadcrumb').innerHTML = `Skills Up / <span>${skill.name}</span>`;
  // Build units from skill videos/notes grouped by topic
  const skillVideos = JSON.parse(localStorage.getItem('edusync_skill_videos') || '[]').filter(v => v.skillId == id);
  const skillNotes = JSON.parse(localStorage.getItem('edusync_skill_notes') || '[]').filter(n => n.skillId == id);
  APP._skillVideos = skillVideos;
  APP._skillNotes = skillNotes;
  renderUnits(APP.currentSubject);
}

export function renderBacklog() {
  const grid = document.getElementById('backlog-grid');
  if (!APP.backlogSubjects.length) {
    grid.innerHTML = `<div class="backlog-empty">
      <div class="empty-icon">🎉</div>
      <h3>No Backlogs!</h3>
      <p>Great job! You have no backlog subjects. Keep maintaining your grades.</p>
    </div>`;
    return;
  }
  grid.innerHTML = `<div class="subject-grid">${APP.backlogSubjects.map((s, i) => `
    <div class="subject-card" onclick="openBacklogSubject('${s}')" style="animation-delay:${i * 0.07}s">
      <div class="subject-card-header" style="background:linear-gradient(135deg,var(--red-light),#fff);">
        <div class="subject-icon">⚠️</div>
        <div class="subject-name">${s}</div>
        <div class="subject-code">Backlog — Needs Attention</div>
      </div>
      <div class="subject-card-body">
        <div class="subject-meta">
          <span class="badge badge-red">Backlog</span>
          <span class="badge badge-primary">5 Units</span>
        </div>
        <div class="subject-progress-row">
          <span class="subject-progress-label">Completion</span>
          <span class="subject-progress-val" style="color:var(--red);">0%</span>
        </div>
        <div class="progress-bar"><div class="progress-fill" style="width:0%;background:var(--red);"></div></div>
      </div>
    </div>`).join('')}</div>`;
}

export function openBacklogSubject(name) {
  APP.currentSubject = { id: 'default', name, icon: '⚠️', credits: 3, progress: 0 };
  document.querySelectorAll('[id^="page-"]').forEach(p => p.style.display = 'none');
  document.getElementById('page-units').style.display = 'block';
  document.getElementById('units-subject-name').textContent = `⚠️ ${name}`;
  document.getElementById('units-tags').innerHTML = `<span class="badge badge-red">Backlog</span><span class="badge badge-primary">5 Units</span>`;
  document.getElementById('topbar-title').textContent = name;
  document.getElementById('topbar-breadcrumb').innerHTML = `Backlog / <span>${name}</span>`;
  renderUnits(APP.currentSubject);
}

export function openSubjectFromRecent(id) {
  navigateTo('subjects');
  setTimeout(() => openSubject(id), 100);
  showToast('Opening recent activity...', 'blue');
}

export function buildHeatmap() {
  const hm = document.getElementById('heatmap');
  if (!hm) return;
  const intensities = ['', 'h1', 'h2', 'h3', 'h4'];
  for (let i = 0; i < 91; i++) {
    const cell = document.createElement('div');
    const r = Math.random();
    cell.className = 'heatmap-cell ' + (i > 77 ? intensities[3 + Math.floor(r * 2)] : r > 0.4 ? intensities[1 + Math.floor(r * 3)] : '');
    cell.style.animationDelay = (i * 8) + 'ms';
    cell.style.animation = `heatmap-appear 0.3s ease ${i * 6}ms both`;
    cell.title = `Day ${i + 1}`;
    hm.appendChild(cell);
  }
}

export function toggleChat() {
  APP.chatOpen = !APP.chatOpen;
  document.getElementById('chat-window').classList.toggle('open', APP.chatOpen);
  if (APP.chatOpen) document.getElementById('chat-input').focus();
}

export function openChat() {
  APP.chatOpen = false;
  toggleChat();
}

export function sendChat() {
  const input = document.getElementById('chat-input');
  const msg = input.value.trim();
  if (!msg) return;
  input.value = '';
  addChatMsg(msg, 'user');
  showTyping();
  setTimeout(() => {
    removeTyping();
    const key = Object.keys(AI_RESPONSES).find(k => msg.toLowerCase().includes(k));
    const response = AI_RESPONSES[key] || AI_RESPONSES.default;
    addChatMsg(response, 'bot');
  }, 1200 + Math.random() * 600);
}

export function quickChat(msg) {
  document.getElementById('chat-input').value = msg;
  sendChat();
}

export function addChatMsg(text, type) {
  const msgs = document.getElementById('chat-messages');
  const div = document.createElement('div');
  div.className = `chat-msg ${type}`;
  div.innerHTML = `<div class="chat-bubble">${text.replace(/\n/g, '<br>').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')}</div>`;
  msgs.appendChild(div);
  msgs.scrollTop = msgs.scrollHeight;
}

export function showTyping() {
  const msgs = document.getElementById('chat-messages');
  const div = document.createElement('div');
  div.className = 'chat-msg bot'; div.id = 'typing-indicator';
  div.innerHTML = `<div class="chat-bubble"><div class="chat-typing"><div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div></div></div>`;
  msgs.appendChild(div);
  msgs.scrollTop = msgs.scrollHeight;
}

export function removeTyping() {
  document.getElementById('typing-indicator')?.remove();
}

export function handleSearch(val) {
  if (!val.trim()) return;
  // Fuzzy search subjects
  const all = Object.values(SUBJECTS_DB).flat();
  const found = all.find(s => s.name.toLowerCase().includes(val.toLowerCase()));
  if (found) showToast(`Found: ${found.name} — press Enter to open`, 'blue');
}

export function renderPendingUrls() {
  const list = document.getElementById('suggest-pending-list');
  if (!list) return;
  const requests = JSON.parse(localStorage.getItem('edusync_url_requests') || '[]');
  const subReqs = requests.filter(r => r.subject === (APP.currentSubject?.name || ''));
  if (!subReqs.length) { list.innerHTML = ''; return; }
  list.innerHTML = `<div style="font-size:0.78rem;font-weight:700;color:var(--text2);margin-bottom:6px;">Your Submissions:</div>` +
    subReqs.map(r => `
      <div style="display:flex;align-items:center;gap:8px;padding:6px 10px;background:var(--surface);border:1px solid var(--border);border-radius:var(--radius-sm);margin-bottom:4px;font-size:0.78rem;">
        <span style="flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:var(--text2);">${r.url}</span>
        <span class="badge ${r.status === 'approved' ? 'badge-green' : r.status === 'rejected' ? 'badge-red' : 'badge-amber'}">${r.status === 'approved' ? '✅ Approved' : r.status === 'rejected' ? '❌ Rejected' : '⏳ Pending'}</span>
        ${r.status === 'approved' ? `<button class="btn btn-primary btn-sm" onclick="openApprovedVideo('${r.url}')">Watch</button>` : ''}
      </div>`).join('');
}

export function createSubject() {
  const branch = document.getElementById('sa-branch').value;
  const year = document.getElementById('sa-year').value;
  const sem = document.getElementById('sa-sem').value;
  const reg = document.getElementById('sa-reg').value;
  const uni = document.getElementById('sa-uni').value;
  const name = document.getElementById('sa-subname').value.trim();
  const code = document.getElementById('sa-subcode').value.trim();
  const credits = document.getElementById('sa-credits').value;
  if (!branch || !year || !sem || !reg || !uni || !name || !code) {
    showToast('Please fill all fields', 'red'); return;
  }
  const newId = Date.now();
  const subjects = JSON.parse(localStorage.getItem('edusync_custom_subjects') || '[]');
  subjects.push({ branch, year, sem, reg, uni, name, code, credits, id: newId });
  localStorage.setItem('edusync_custom_subjects', JSON.stringify(subjects));
  showToast('✅ Subject created! Now build its learning roadmap below.', 'green');
  renderSASubjects();
  // Show roadmap creator for this new subject
  openRoadmapCreator(newId, name);
}

export function renderSASubjects() {
  const list = document.getElementById('sa-subjects-list');
  if (!list) return;
  const subjects = JSON.parse(localStorage.getItem('edusync_custom_subjects') || '[]');
  if (!subjects.length) { list.innerHTML = ''; return; }
  const roadmaps = JSON.parse(localStorage.getItem('edusync_roadmaps') || '{}');
  list.innerHTML = `<h4 style="margin-bottom:8px;font-size:0.85rem;">Created Subjects (${subjects.length})</h4>` +
    subjects.map(s => {
      const hasRoadmap = roadmaps[s.id] && roadmaps[s.id].some(u => u.topics.some(t => t.trim()));
      return `
      <div style="display:flex;align-items:center;gap:8px;padding:10px 12px;background:var(--surface2);border:1px solid var(--border);border-radius:var(--radius-sm);margin-bottom:6px;font-size:0.82rem;">
        <div style="flex:1;min-width:0;">
          <div style="font-weight:600;">${s.name} <span class="badge badge-primary">${s.code}</span></div>
          <div style="font-size:0.72rem;color:var(--text3);margin-top:2px;">${s.branch} · Sem ${s.sem} · ${s.reg}</div>
        </div>
        <span class="badge badge-teal">${s.branch}</span>
        ${hasRoadmap ? '<span class="badge badge-green">✅ Roadmap Set</span>' : '<span class="badge badge-amber">⚠️ No Roadmap</span>'}
        <button class="btn btn-ghost btn-sm" onclick="openRoadmapCreator(${s.id}, '${s.name.replace(/'/g, "\\'")}')">📍 ${hasRoadmap ? 'Edit' : 'Create'} Roadmap</button>
      </div>`;
    }).join('');
}

export function uploadNotes() {
  const title = document.getElementById('sa-ntitle').value.trim();
  const type = document.getElementById('sa-ntype').value;
  const subject = document.getElementById('sa-nsubject').value;
  const unit = document.getElementById('sa-nunit').value;
  const link = document.getElementById('sa-nlink').value.trim();
  if (!title) { showToast('Please enter a notes title', 'red'); return; }
  const notes = JSON.parse(localStorage.getItem('edusync_admin_notes') || '[]');
  notes.push({ id: Date.now(), title, type, subject, unit: parseInt(unit) || 0, link, uploadedAt: new Date().toLocaleString(), uploadedBy: APP.subAdminData?.username || 'Sub Admin' });
  localStorage.setItem('edusync_admin_notes', JSON.stringify(notes));
  document.getElementById('sa-ntitle').value = '';
  document.getElementById('sa-nlink').value = '';
  showToast('✅ Notes uploaded! Students can now see it.', 'green');
  renderUploadedNotesList();
}

export function renderUploadedNotesList() {
  const listEl = document.getElementById('sa-notes-list');
  if (!listEl) return;
  const notes = JSON.parse(localStorage.getItem('edusync_admin_notes') || '[]');
  if (!notes.length) { listEl.innerHTML = ''; return; }
  listEl.innerHTML = '<h4 style="margin-bottom:8px;font-size:0.85rem;">Uploaded Notes (' + notes.length + ')</h4>' +
    notes.map(n => `
      <div style="display:flex;align-items:center;gap:8px;padding:8px 12px;background:var(--surface2);border:1px solid var(--border);border-radius:var(--radius-sm);margin-bottom:6px;font-size:0.82rem;">
        <span style="flex:1;font-weight:600;">📄 ${n.title}</span>
        <span class="badge badge-teal">${n.subject || 'All'}</span>
        <span class="badge badge-lavender">Unit ${n.unit || 'All'}</span>
        <span class="badge badge-green">Live</span>
        <!-- Sub Admin cannot delete — only view -->
      </div>`).join('');
}

export function renderSAUrlRequests() {
  const list = document.getElementById('sa-url-list');
  if (!list) return;
  const requests = JSON.parse(localStorage.getItem('edusync_url_requests') || '[]');
  if (!requests.length) { list.innerHTML = '<div style="padding:1.5rem;text-align:center;color:var(--text3);">No URL requests yet</div>'; return; }
  list.innerHTML = requests.map((r, i) => `
    <div style="display:flex;align-items:flex-start;gap:10px;padding:12px;border:1px solid var(--border);border-radius:var(--radius-md);margin-bottom:8px;">
      <div style="flex:1;min-width:0;">
        <div style="font-size:0.85rem;font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${r.url}</div>
        <div style="font-size:0.75rem;color:var(--text3);">${r.subject} · by ${r.submittedBy} · ${r.submittedAt}</div>
      </div>
      <span class="badge ${r.status === 'approved' ? 'badge-green' : r.status === 'rejected' ? 'badge-red' : 'badge-amber'}">${r.status}</span>
      ${r.status === 'pending' ? `
        <button class="btn btn-teal btn-sm" onclick="adminApproveUrl(${i});renderSAUrlRequests()">✅</button>
        <button class="btn btn-danger btn-sm" onclick="adminRejectUrl(${i});renderSAUrlRequests()">❌</button>
      `: ''}
    </div>`).join('');
}

export function toggleSASidebar() {
  document.getElementById('sa-sidebar').classList.toggle('open');
  document.getElementById('sa-sidebar-backdrop').classList.toggle('open');
}

export function closeSASidebar() {
  document.getElementById('sa-sidebar').classList.remove('open');
  document.getElementById('sa-sidebar-backdrop').classList.remove('open');
}

export function switchSASection(section) {
  closeSASidebar();
  document.querySelectorAll('[id^="sa-nav-"]').forEach(el => el.classList.remove('active'));
  const navEl = document.getElementById('sa-nav-' + section);
  if (navEl) navEl.classList.add('active');
  const titles = { dashboard: 'Sub Admin Dashboard', subjects: 'Create Subject', view: 'View Subjects', curriculum: 'Curriculum', skillup: 'Skill Up' };
  const titleEl = document.getElementById('sa-topbar-title');
  if (titleEl) titleEl.textContent = titles[section] || 'Sub Admin';
  renderSASection(section);
}

export function renderSASection(section) {
  const content = document.getElementById('sa-content');
  if (!content) return;
  const customSubjects = JSON.parse(localStorage.getItem('edusync_custom_subjects') || '[]');
  const sa = APP.subAdminData || {};

  if (section === 'dashboard') {
    const mySubs = customSubjects.filter(s => !sa.branch || s.branch === sa.branch);
    const bySem = {};
    const allSems = ['1-1', '1-2', '2-1', '2-2', '3-1', '3-2', '4-1', '4-2'];
    allSems.forEach(sem => bySem[sem] = mySubs.filter(s => s.sem === sem).length);
    const recentSubs = mySubs.slice(-3).reverse();
    const regs = [...new Set(mySubs.map(s => s.reg).filter(Boolean))];

    content.innerHTML = `
    <div style="padding:2rem;max-width:1100px;margin:0 auto;width:100%;">
      <div style="margin-bottom:1.6rem;">
        <h2 style="font-size:1.4rem;font-weight:800;letter-spacing:-0.02em;margin-bottom:4px;">📊 Sub Admin Dashboard</h2>
        <p style="font-size:0.82rem;color:var(--text3);">${sa.branch || 'Content Management'}</p>
      </div>
      <div class="admin-grid" style="margin-bottom:1.6rem;">
        <div class="admin-stat-card">
          <div class="admin-stat-accent" style="background:var(--primary);"></div>
          <div style="font-size:2.2rem;font-weight:800;color:var(--primary);">${mySubs.length}</div>
          <div style="font-size:0.88rem;font-weight:600;margin-top:4px;">Subjects Created</div>
          <div style="font-size:0.75rem;color:var(--text3);margin-top:4px;">by your account</div>
        </div>
        <div class="admin-stat-card">
          <div class="admin-stat-accent" style="background:var(--teal);"></div>
          <div style="font-size:2.2rem;font-weight:800;color:var(--teal);">${regs.length || 2}</div>
          <div style="font-size:0.88rem;font-weight:600;margin-top:4px;">Regulations</div>
          <div style="font-size:0.75rem;color:var(--text3);margin-top:4px;">${regs.join(', ') || 'R23, R20'}</div>
        </div>
        <div class="admin-stat-card">
          <div class="admin-stat-accent" style="background:var(--lavender);"></div>
          <div style="font-size:2.2rem;font-weight:800;color:var(--lavender);">${allSems.filter(s => bySem[s] > 0).length}</div>
          <div style="font-size:0.88rem;font-weight:600;margin-top:4px;">Active Semesters</div>
          <div style="font-size:0.75rem;color:var(--text3);margin-top:4px;">with content</div>
        </div>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:1.4rem;margin-bottom:1.4rem;">
        <div class="card">
          <div class="section-heading" style="margin-bottom:1rem;">📋 Recently Created Subjects</div>
          ${recentSubs.length ? recentSubs.map(s => `
            <div style="display:flex;align-items:center;gap:10px;padding:10px 0;border-bottom:1px solid var(--border);">
              <div style="width:36px;height:36px;border-radius:var(--radius-sm);background:var(--primary-light);display:flex;align-items:center;justify-content:center;font-size:1.1rem;flex-shrink:0;">📖</div>
              <div style="flex:1;min-width:0;">
                <div style="font-size:0.85rem;font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${s.name}</div>
                <div style="font-size:0.72rem;color:var(--text3);">${s.sem} · ${s.reg}</div>
              </div>
            </div>`).join('') : '<div style="color:var(--text3);text-align:center;padding:1.5rem;">No subjects yet. Create your first one →</div>'}
        </div>
        <div class="card">
          <div class="section-heading" style="margin-bottom:1rem;">📈 Semester Analytics</div>
          ${allSems.map(sem => `
            <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px;">
              <span style="font-size:0.78rem;color:var(--text2);width:40px;flex-shrink:0;">${sem}</span>
              <div style="flex:1;"><div class="progress-bar"><div class="progress-fill" style="width:${Math.min(100, bySem[sem] * 20)}%;"></div></div></div>
              <span style="font-size:0.75rem;font-weight:700;color:var(--primary);width:16px;">${bySem[sem]}</span>
            </div>`).join('')}
        </div>
      </div>
    </div>`;
    return;
  }

  if (section === 'subjects') {
    const mySubs = customSubjects.filter(s => !sa.branch || s.branch === sa.branch);
    const allSems = ['1-1', '1-2', '2-1', '2-2', '3-1', '3-2', '4-1', '4-2'];
    content.innerHTML = `
    <div style="padding:2rem;max-width:1100px;margin:0 auto;width:100%;">
      <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px;margin-bottom:1.5rem;">
        <h2 style="font-size:1.4rem;font-weight:800;letter-spacing:-0.02em;">📚 Manage Subjects</h2>
        <button class="btn btn-primary" onclick="openSACreateSubjectForm()">+ Add Subject</button>
      </div>
      <div id="sa-create-subject-form" style="display:none;margin-bottom:1.5rem;">
        <div class="card">
          <h3 style="margin-bottom:1rem;">Create New Subject</h3>
          <div class="form-row">
            <div class="input-group"><label>Branch</label>
              <select class="select" id="sa-sub-branch"><option value="">Select Branch</option>
                ${['CSE', 'ECE', 'EEE', 'IT', 'AIML', 'AIDS', 'MECH', 'CIVIL'].map(b => `<option value="${b}" ${sa.branch === b ? 'selected' : ''}>${b}</option>`).join('')}
              </select>
            </div>
            <div class="input-group"><label>Year</label>
              <select class="select" id="sa-sub-year"><option value="">Select Year</option>
                ${['1', '2', '3', '4'].map(y => `<option>Year ${y}</option>`).join('')}
              </select>
            </div>
          </div>
          <div class="form-row">
            <div class="input-group"><label>Semester</label>
              <select class="select" id="sa-sub-sem"><option value="">Select Semester</option>
                ${allSems.map(s => `<option value="${s}">${s}</option>`).join('')}
              </select>
            </div>
            <div class="input-group"><label>Regulation</label>
              <select class="select" id="sa-sub-reg"><option value="">Select Regulation</option>
                ${['R23', 'R20', 'R19', 'R16'].map(r => `<option value="${r}">${r}</option>`).join('')}
              </select>
            </div>
          </div>
          <div class="form-row">
            <div class="input-group"><label>University</label>
              <select class="select" id="sa-sub-uni"><option value="">Select University</option>
                ${['JNTUK', 'JNTUH', 'Andhra University'].map(u => `<option value="${u}">${u}</option>`).join('')}
              </select>
            </div>
            <div class="input-group"><label>Credits</label>
              <select class="select" id="sa-sub-credits">
                ${[2, 3, 4, 5].map(c => `<option value="${c}">${c} Credits</option>`).join('')}
              </select>
            </div>
          </div>
          <div class="form-row">
            <div class="input-group"><label>Subject Name</label><input class="input" id="sa-sub-name" placeholder="e.g. Machine Learning"></div>
            <div class="input-group"><label>Subject Code</label><input class="input" id="sa-sub-code" placeholder="e.g. ML101"></div>
          </div>
          <div style="display:flex;gap:10px;">
            <button class="btn btn-primary" onclick="saCreateSubject()">✅ Create Subject</button>
            <button class="btn btn-ghost" onclick="document.getElementById('sa-create-subject-form').style.display='none'">Cancel</button>
          </div>
        </div>
      </div>
      ${mySubs.length ? `
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:1rem;">
        ${mySubs.map(s => `
          <div class="card" style="padding:1.2rem;cursor:pointer;" onclick="openSASubjectUnits(${s.id})">
            <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:8px;margin-bottom:8px;">
              <div>
                <div style="font-weight:700;font-size:0.92rem;margin-bottom:4px;">📖 ${s.name}</div>
                <div style="font-size:0.75rem;color:var(--text3);">${s.code || '—'} · ${s.credits || 3} Cr</div>
              </div>
              <button class="btn btn-danger btn-sm" onclick="event.stopPropagation();saDeleteSubject(${s.id})" title="Delete">✕</button>
            </div>
            <div style="display:flex;gap:6px;flex-wrap:wrap;">
              <span class="badge badge-primary">${s.sem}</span>
              <span class="badge badge-teal">${s.uni || 'JNTUK'}</span>
              <span class="badge badge-lavender">${s.reg || 'R23'}</span>
            </div>
            <div style="margin-top:10px;font-size:0.75rem;color:var(--primary);font-weight:600;">Click to manage units →</div>
          </div>`).join('')}
      </div>` : '<div style="text-align:center;padding:3rem;color:var(--text3);">No subjects created yet. Click "+ Add Subject" to get started.</div>'}
    </div>`;
    return;
  }

  if (section === 'view') {
    const allSems = ['1-1', '1-2', '2-1', '2-2', '3-1', '3-2', '4-1', '4-2'];
    const savedFilter = window._saViewFilter || {};
    const filterUni = savedFilter.uni || '';
    const filterReg = savedFilter.reg || '';
    const filterSem = savedFilter.sem || '';
    let filtered = customSubjects;
    if (filterUni) filtered = filtered.filter(s => s.uni === filterUni);
    if (filterReg) filtered = filtered.filter(s => s.reg === filterReg);
    if (filterSem) filtered = filtered.filter(s => s.sem === filterSem);
    content.innerHTML = `
    <div style="padding:2rem;max-width:1100px;margin:0 auto;width:100%;">
      <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px;margin-bottom:1.5rem;">
        <h2 style="font-size:1.4rem;font-weight:800;letter-spacing:-0.02em;">👁️ View Content</h2>
        <div style="display:flex;gap:8px;flex-wrap:wrap;">
          <select class="select" style="width:140px;" onchange="window._saViewFilter=Object.assign(window._saViewFilter||{},{uni:this.value});renderSASection('view')">
            <option value="">All Universities</option>
            ${['JNTUK', 'JNTUH', 'Andhra University'].map(u => `<option value="${u}" ${filterUni === u ? 'selected' : ''}>${u}</option>`).join('')}
          </select>
          <select class="select" style="width:120px;" onchange="window._saViewFilter=Object.assign(window._saViewFilter||{},{reg:this.value});renderSASection('view')">
            <option value="">All Regulations</option>
            ${['R23', 'R20', 'R19', 'R16'].map(r => `<option value="${r}" ${filterReg === r ? 'selected' : ''}>${r}</option>`).join('')}
          </select>
          <select class="select" style="width:110px;" onchange="window._saViewFilter=Object.assign(window._saViewFilter||{},{sem:this.value});renderSASection('view')">
            <option value="">All Semesters</option>
            ${allSems.map(s => `<option value="${s}" ${filterSem === s ? 'selected' : ''}>${s}</option>`).join('')}
          </select>
        </div>
      </div>
      <div style="font-size:0.82rem;color:var(--text3);margin-bottom:1rem;">Showing ${filtered.length} subjects</div>
      ${filtered.length ? `
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:1rem;">
        ${filtered.map(s => `
          <div class="card" style="padding:1.2rem;">
            <div style="font-weight:700;font-size:0.92rem;margin-bottom:6px;">📖 ${s.name}</div>
            <div style="font-size:0.75rem;color:var(--text3);margin-bottom:8px;">${s.code || '—'} · ${s.credits || 3} Cr</div>
            <div style="display:flex;gap:5px;flex-wrap:wrap;">
              <span class="badge badge-primary">${s.sem}</span>
              <span class="badge badge-teal">${s.uni || 'JNTUK'}</span>
              <span class="badge badge-lavender">${s.reg || 'R23'}</span>
              <span class="badge badge-amber">${s.branch || 'All'}</span>
            </div>
          </div>`).join('')}
      </div>` : '<div style="text-align:center;padding:3rem;color:var(--text3);">No subjects match the selected filters.</div>'}
    </div>`;
  }
}

export function openSACreateSubjectForm() {
  const el = document.getElementById('sa-create-subject-form');
  if (el) el.style.display = el.style.display === 'none' ? 'block' : 'none';
}

export function renderSASectionFull(section) {
  const content = document.getElementById('sa-content');
  if (!content) return;
  const customSubjects = JSON.parse(localStorage.getItem('edusync_custom_subjects') || '[]');
  const sa = APP.subAdminData || {};

  if (section === 'dashboard' || section === 'subjects' || section === 'view') {
    renderSASection(section);
    return;
  }

  if (section === 'skillup') {
    const skills = JSON.parse(localStorage.getItem('edusync_skills') || '[]');
    const skillVideos = JSON.parse(localStorage.getItem('edusync_skill_videos') || '[]');
    content.innerHTML = `
    <div style="padding:2rem;max-width:1100px;margin:0 auto;width:100%;">
      <h2 style="font-size:1.4rem;font-weight:800;letter-spacing:-0.02em;margin-bottom:1.5rem;">⚡ Skill Up</h2>
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:1rem;">
        ${skills.map(s => {
      const vids = skillVideos.filter(v => v.skillId == s.id);
      return `<div class="card" style="padding:1.2rem;">
            <div style="font-size:2rem;margin-bottom:0.5rem;">${s.icon || '⚡'}</div>
            <div style="font-weight:700;margin-bottom:4px;">${s.name}</div>
            <div style="font-size:0.78rem;color:var(--text3);margin-bottom:8px;">${s.category} · ${s.level} · ${vids.length} videos</div>
            <p style="font-size:0.83rem;color:var(--text2);line-height:1.5;margin-bottom:10px;">${s.description || ''}</p>
            <div style="display:flex;gap:6px;flex-wrap:wrap;">
              <span class="badge badge-lavender">${s.duration || '—'}</span>
              <span class="badge badge-green">Available</span>
            </div>
          </div>`;
    }).join('')}
        ${!skills.length ? '<div style="color:var(--text3);text-align:center;padding:2rem;grid-column:1/-1;">No skill courses yet. Admin creates them.</div>' : ''}
      </div>
    </div>`;
    return;
  }

  if (section === 'curriculum') {
    const mySubs = customSubjects.filter(s => !sa.branch || s.branch === sa.branch);
    content.innerHTML = `
    <div style="padding:2rem;max-width:1100px;margin:0 auto;width:100%;">
      <h2 style="font-size:1.4rem;font-weight:800;letter-spacing:-0.02em;margin-bottom:1.5rem;">🎯 Creator Subjects</h2>
      <p style="font-size:0.85rem;color:var(--text2);margin-bottom:1.5rem;">Your subjects and their full learning curriculum</p>
      ${mySubs.map(s => {
      const units = JSON.parse(localStorage.getItem('edusync_units_' + s.id) || '[]');
      const topicsTotal = units.reduce((sum, u) => sum + (u.topics || []).length, 0);
      return `<div class="card" style="margin-bottom:1rem;padding:1.2rem;">
          <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px;">
            <div style="width:40px;height:40px;border-radius:var(--radius-sm);background:var(--primary-light);display:flex;align-items:center;justify-content:center;font-size:1.2rem;">📖</div>
            <div style="flex:1;">
              <div style="font-weight:700;">${s.name}</div>
              <div style="font-size:0.75rem;color:var(--text3);">${s.sem} · ${s.reg} · ${s.branch}</div>
            </div>
            <div style="text-align:right;">
              <div style="font-size:1.2rem;font-weight:800;color:var(--primary);">${units.length}</div>
              <div style="font-size:0.72rem;color:var(--text3);">units</div>
            </div>
            <div style="text-align:right;">
              <div style="font-size:1.2rem;font-weight:800;color:var(--teal);">${topicsTotal}</div>
              <div style="font-size:0.72rem;color:var(--text3);">topics</div>
            </div>
          </div>
          <div class="progress-bar" style="margin-bottom:4px;"><div class="progress-fill" style="width:${Math.min(100, topicsTotal * 5)}%;"></div></div>
          <div style="font-size:0.72rem;color:var(--text3);">${topicsTotal} of 20 suggested topics covered</div>
        </div>`;
    }).join('')}
      ${!mySubs.length ? '<div class="card" style="text-align:center;padding:2rem;color:var(--text3);">No subjects created yet. Go to Subjects tab to create your first one.</div>' : ''}
    </div>`;
    return;
  }
}

export function v10DotMenu(btn, dataObj) {
  document.querySelectorAll('.v10-popup').forEach(p => p.remove());
  if (typeof dataObj === 'string') try { dataObj = JSON.parse(dataObj); } catch (e) { }
  const { id, name, isBuiltin } = dataObj;
  const safeName = (name || '').replace(/\\/g, '\\\\').replace(/'/g, "\\'");
  const popup = document.createElement('div');
  popup.className = 'v10-popup';
  if (isBuiltin) {
    popup.innerHTML = `
      <button class="v10-popup-item" onclick="v10AdminViewSubject(${id || 0},true)">🔍 Open & Manage</button>
      <div class="v10-popup-item muted">🔒 Built-in — cannot edit/delete</div>`;
  } else {
    popup.innerHTML = `
      <button class="v10-popup-item" onclick="v10AdminViewSubject(${id},false)">🔍 Open & Manage</button>
      <button class="v10-popup-item" onclick="v10AdminEditSubject(${id})">✏️ Edit Subject</button>
      <button class="v10-popup-item red" onclick="v10AdminDeleteSubject(${id},'${safeName}')">🗑 Delete Subject</button>`;
  }
  btn.closest('.v10-dot-wrap').appendChild(popup);
}

export async function v10SASubjects() {
  const content = document.getElementById('sa-content');
  if (!content) return;

  const sa = APP.subAdminData || {};
  const allSems = ['1-1', '1-2', '2-1', '2-2', '3-1', '3-2', '4-1', '4-2'];
  const unis = ['JNTUK', 'JNTUH', 'Andhra University'];
  const regs = ['R23', 'R20', 'R19', 'R16'];
  const branches = ['CSE', 'ECE', 'EEE', 'IT', 'AIML', 'AIDS', 'MECH', 'CIVIL'];

  // Show loading state immediately
  content.innerHTML = `
  <div style="padding:2rem;max-width:1100px;margin:0 auto;width:100%;text-align:center;">
    <div class="loading-spinner" style="margin: 3rem auto 1rem;"></div>
    <p style="color:var(--text3);">Fetching subjects from Supabase...</p>
  </div>`;

  // Fetch subjects directly from Supabase — no localStorage
  let mySubs = [];
  if (window.aimeasyFetchSubjects) {
    const filters = sa.branch ? { branch: sa.branch } : {};
    console.log('[SubAdmin] Fetching subjects from Supabase', filters);
    const { data, error } = await window.aimeasyFetchSubjects(filters);
    if (error) {
      console.error('[SubAdmin] Subject fetch error', error);
      content.innerHTML = `
      <div style="padding:2rem;max-width:1100px;margin:0 auto;width:100%;text-align:center;">
        <p style="color:var(--red);">Failed to load subjects: ${error.message}</p>
        <button class="btn btn-primary btn-sm" style="margin-top:1rem;" onclick="v10SASubjects()">Retry</button>
      </div>`;
      return;
    }
    mySubs = data || [];
    console.log('[SubAdmin] Subjects Returned from Supabase', mySubs.length);
  } else {
    console.warn('[SubAdmin] aimeasyFetchSubjects not yet available');
  }

  const createForm = `
  <div class="v10-create-form" id="v10-sa-create-form" style="display:none;">
    <h3 style="margin-bottom:1rem;font-size:1rem;">📚 Create New Subject</h3>
    <div class="v10-2col">
      <div class="input-group">
        <label>Branch</label>
        <select class="select" id="v10-sa-branch">
          <option value="">Select Branch</option>
          ${branches.map(b => `<option value="${b}"${sa.branch === b ? ' selected' : ''}>${b}</option>`).join('')}
        </select>
      </div>
      <input type="hidden" id="v10-sa-year" value="">
    </div>
    <div class="v10-2col">
      <div class="input-group">
        <label>Semester</label>
        <select class="select" id="v10-sa-sem">
          <option value="">Select Semester</option>
          ${allSems.map(s => `<option value="${s}">${s}</option>`).join('')}
        </select>
      </div>
      <div class="input-group">
        <label>Regulation</label>
        <select class="select" id="v10-sa-reg">
          <option value="">Select Regulation</option>
          ${regs.map(r => `<option value="${r}">${r}</option>`).join('')}
        </select>
      </div>
    </div>
    <div class="v10-2col">
      <div class="input-group">
        <label>University</label>
        <select class="select" id="v10-sa-uni">
          <option value="">Select University</option>
          ${unis.map(u => `<option value="${u}">${u}</option>`).join('')}
        </select>
      </div>
      <input type="hidden" id="v10-sa-credits" value="3">
    </div>
    <div class="v10-2col">
      <div class="input-group">
        <label>Subject Name</label>
        <input class="input" id="v10-sa-name" placeholder="e.g. Machine Learning">
      </div>
      <input type="hidden" id="v10-sa-code" value="">
    </div>
    <div style="display:flex;gap:10px;margin-top:.5rem;">
      <button class="btn btn-primary" id="v10-sa-create-btn" onclick="v10SACreateSubject()" style="flex:1;">✅ Create Subject</button>
      <button class="btn btn-ghost" onclick="document.getElementById('v10-sa-create-form').style.display='none'">Cancel</button>
    </div>
  </div>`;

  const cards = mySubs.map(s => {
    const safeName = (s.name || '').replace(/\\/g, '\\\\').replace(/'/g, "\\'");
    const safeId = s.id;
    return `
    <div class="v10-subj-card" onclick="v10SAOpenUnits('${safeId}')">
      <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:6px;">
        <div class="v10-subj-icon">📖</div>
        <div class="v10-dot-wrap" onclick="event.stopPropagation()">
          <button class="v10-dot-btn" onclick="v10SaDotMenu(this,'${safeId}','${safeName}')">⋯</button>
        </div>
      </div>
      <div class="v10-subj-name">${s.name}</div>
      <div class="v10-subj-meta">${s.code || '—'} · ${s.credits || 3} Cr · ${s.branch || 'CSE'}</div>
      <div style="display:flex;gap:5px;flex-wrap:wrap;margin-bottom:4px;">
        <span class="badge badge-primary">${s.semester || '—'}</span>
        <span class="badge badge-teal">${s.university_name || 'JNTUK'}</span>
        <span class="badge badge-lavender">${s.regulation_code || 'R23'}</span>
        <span class="badge badge-amber">DB ✓</span>
      </div>
      <div class="v10-arrow">📋 Click to manage units →</div>
    </div>`;
  }).join('');

  content.innerHTML = `
  <div style="padding:2rem;max-width:1100px;margin:0 auto;width:100%;">
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:1.2rem;flex-wrap:wrap;gap:10px;">
      <h2 style="font-size:1.4rem;font-weight:800;letter-spacing:-.02em;">📚 My Subjects (${mySubs.length})</h2>
      <div style="display:flex;gap:8px;">
        <button class="btn btn-ghost btn-sm" onclick="v10SASubjects()">🔄 Refresh</button>
        <button class="btn btn-primary" onclick="document.getElementById('v10-sa-create-form').style.display='block';document.getElementById('v10-sa-create-form').scrollIntoView({behavior:'smooth'})">+ Add Subject</button>
      </div>
    </div>
    ${createForm}
    ${mySubs.length
      ? `<div class="v10-subj-grid">${cards}</div>`
      : `<div style="text-align:center;padding:4rem;color:var(--text3);">
          <div style="font-size:3rem;margin-bottom:1rem;">📚</div>
          <div style="font-weight:600;font-size:1rem;margin-bottom:6px;">No subjects yet</div>
          <div style="font-size:.82rem;">Click "+ Add Subject" to create your first subject</div>
        </div>`}
  </div>`;
}

export function v10SaDotMenu(btn, id, name) {
  document.querySelectorAll('.v10-popup').forEach(p => p.remove());
  const safeName = name.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
  const popup = document.createElement('div');
  popup.className = 'v10-popup';
  popup.innerHTML = `
    <button class="v10-popup-item" onclick="v10SAOpenUnits('${id}')">🔍 Open & Manage</button>
    <button class="v10-popup-item" onclick="v10SAEditSubject('${id}')">✏️ Edit Subject</button>
    <button class="v10-popup-item red" onclick="v10SADeleteSubject('${id}','${safeName}')">🗑 Delete Subject</button>`;
  btn.closest('.v10-dot-wrap').appendChild(popup);
}

export async function v10SAEditSubject(id) {
  document.querySelectorAll('.v10-popup').forEach(p => p.remove());
  if (!window.aimeasyFetchSubjects) { showToast('Supabase not ready', 'red'); return; }

  // Fetch the existing subject from Supabase by ID
  const { data: allSubjects, error: fetchErr } = await window.aimeasyFetchSubjects({});
  if (fetchErr) { showToast('Could not load subject: ' + fetchErr.message, 'red'); return; }
  const s = (allSubjects || []).find(x => String(x.id) === String(id));
  if (!s) { showToast('Subject not found in database', 'red'); return; }

  const newName = prompt('Subject name:', s.name);
  if (!newName) return;
  const newSem = prompt('Semester (e.g. 3-1):', s.semester);
  const newReg = prompt('Regulation (e.g. R23):', s.regulation_code);

  showToast('Saving changes...', 'blue');
  const { error: updateErr } = await window.aimeasyUpdateSubject(id, {
    name: newName.trim(),
    university_name: s.university_name,
    regulation_code: newReg ? newReg.trim() : s.regulation_code,
    branch: s.branch,
    semester: newSem ? newSem.trim() : s.semester,
    code: s.code,
    credits: s.credits
  });
  if (updateErr) { showToast('Update failed: ' + updateErr.message, 'red'); return; }
  showToast('✅ Subject updated in database!', 'green');
  v10SASubjects();
}

export async function v10SADeleteSubject(id, name) {
  document.querySelectorAll('.v10-popup').forEach(p => p.remove());
  if (!confirm(`Delete "${name}" from the database?\n\nThis will permanently remove all content for this subject.`)) return;
  if (!window.aimeasyDeleteSubject) { showToast('Supabase not ready', 'red'); return; }

  showToast('Deleting from database...', 'blue');
  const { error } = await window.aimeasyDeleteSubject(id);
  if (error) { showToast('Delete failed: ' + error.message, 'red'); return; }
  showToast('Subject deleted from database', 'red');
  v10SASubjects();
}

export async function v10SACreateSubject() {
  const branch = document.getElementById('v10-sa-branch')?.value;
  const sem = document.getElementById('v10-sa-sem')?.value;
  const year = document.getElementById('v10-sa-year')?.value || String(sem || '').charAt(0);
  const reg = document.getElementById('v10-sa-reg')?.value;
  const uni = document.getElementById('v10-sa-uni')?.value;
  const credits = document.getElementById('v10-sa-credits')?.value || '3';
  const name = document.getElementById('v10-sa-name')?.value.trim();
  const code = document.getElementById('v10-sa-code')?.value.trim();

  if (!branch || !sem || !reg || !uni || !name) {
    showToast('Please fill all required fields', 'red');
    return;
  }

  if (!window.aimeasyCreateSubject) {
    showToast('Supabase not ready. Please wait and try again.', 'red');
    return;
  }

  const dbPayload = {
    name,
    code: code || '',
    university_name: uni,
    regulation_code: reg,
    branch,
    semester: sem,
    credits: Number(credits) || 3
  };

  console.log('[SubAdmin] Subject Payload', dbPayload);

  // Disable the create button to prevent double-submit
  const btn = document.getElementById('v10-sa-create-btn');
  if (btn) { btn.disabled = true; btn.textContent = 'Creating...'; }

  showToast('Saving to Supabase...', 'blue');

  const { data, error } = await window.aimeasyCreateSubject(dbPayload);

  console.log('[SubAdmin] Insert Result', data);
  console.log('[SubAdmin] Insert Error', error);

  if (error) {
    showToast('❌ Failed to create subject: ' + error.message, 'red');
    if (btn) { btn.disabled = false; btn.textContent = '✅ Create Subject'; }
    return;
  }

  if (!data || !data.id) {
    showToast('❌ Insert appeared to succeed but no row was returned. Check Supabase RLS policies.', 'red');
    if (btn) { btn.disabled = false; btn.textContent = '✅ Create Subject'; }
    return;
  }

  // Only show success AFTER confirmed Supabase insert
  console.log('[SubAdmin] Subject created in Supabase', { id: data.id, name: data.name });
  showToast('✅ Subject created and live for students!', 'green');

  // Refresh the list from Supabase (not from localStorage)
  await v10SASubjects();
}

export function v10TopicRowHTML(subjId, unitId, idx, name, urls, total, topicId = '') {
  const isFilled = name.trim() !== '';
  const urlList = Array.isArray(urls) ? urls : [urls || ''];
  const urlRows = (urlList.length ? urlList : ['']).map((url, ui) => `
      <div class="v10-url-row" style="display:flex;align-items:center;gap:8px;margin-top:6px;">
        <input class="v10-url-input" placeholder="${ui === 0 ? 'Video URL (YouTube / Google Drive / etc.)' : 'Additional video URL'}"
          value="${(url || '').replace(/"/g, '&quot;')}"
          style="font-size:.78rem;flex:1;" />
        ${ui === 0
      ? `<button type="button" class="btn btn-ghost btn-sm" onclick="v10AddTopicUrl('${subjId}','${unitId}','${idx}')" title="Add another URL">+</button>`
      : `<button type="button" class="btn btn-ghost btn-sm" onclick="v10RemoveTopicUrl(this)" title="Remove URL">✕</button>`
    }
      </div>`).join('');
  return `
  <div class="v10-topic-row" id="v10-tr-${unitId}-${idx}" data-topic-id="${topicId}">
    <div class="v10-dot ${isFilled ? 'filled' : ''}" id="v10-dot-${unitId}-${idx}">${idx + 1}</div>
    <div class="v10-topic-fields">
      <input class="${isFilled ? 'filled' : ''}" placeholder="Topic name (e.g. Introduction to Trees)"
        value="${name.replace(/"/g, '&quot;')}"
        oninput="v10DotUpdate('${unitId}',${idx},this.value)" />
      <div class="v10-url-list">${urlRows}</div>
    </div>
    <button class="v10-rm-btn" onclick="v10RemoveTopic('${unitId}',${idx})" title="Remove">✕</button>
  </div>`;
}

export function v10DotUpdate(unitId, idx, val) {
  const dot = document.getElementById('v10-dot-' + unitId + '-' + idx);
  if (dot) { dot.className = 'v10-dot ' + (val.trim() ? 'filled' : ''); }
  const inp = document.querySelector(`#v10-tr-${unitId}-${idx} .v10-topic-fields input:first-child`);
  if (inp) inp.className = val.trim() ? 'filled' : '';
}

export function v10RemoveTopic(unitId, idx) {
  const row = document.getElementById('v10-tr-' + unitId + '-' + idx);
  if (row) { row.remove(); v10RenumberDots(unitId); }
}

export function v10RenumberDots(unitId) {
  const container = document.getElementById('v10-topics-' + unitId);
  if (!container) return;
  container.querySelectorAll('.v10-topic-row').forEach((row, i) => {
    const dot = row.querySelector('.v10-dot');
    if (dot) dot.textContent = i + 1;
    row.id = 'v10-tr-' + unitId + '-' + i;
    if (dot) dot.id = 'v10-dot-' + unitId + '-' + i;
  });
}

export function v10AddTopic(subjId, unitId, isSubTopic = false) {
  const container = document.getElementById('v10-topics-' + unitId);
  if (!container) return;
  // Remove empty state
  const empty = document.getElementById('v10-rm-empty-' + unitId);
  if (empty) empty.remove();
  const rows = container.querySelectorAll('.v10-topic-row');
  const idx = rows.length;
  const div = document.createElement('div');
  div.innerHTML = v10TopicRowHTML(subjId, unitId, idx, '', [''], idx + 1, '', isSubTopic);
  container.appendChild(div.firstElementChild);
  container.lastElementChild.querySelector('input')?.focus();
}

export function v10AddTopicUrl(subjId, unitId, topicIdx) {
  const row = document.getElementById('v10-tr-' + unitId + '-' + topicIdx);
  if (!row) return;
  const urlList = row.querySelector('.v10-url-list');
  if (!urlList) return;
  const div = document.createElement('div');
  div.className = 'v10-url-row';
  div.style.cssText = 'display:flex;align-items:center;gap:8px;margin-top:6px;';
  div.innerHTML = `<input class="v10-url-input" placeholder="Additional video URL" style="font-size:.78rem;flex:1;" />
    <button type="button" class="btn btn-ghost btn-sm" onclick="v10RemoveTopicUrl(this)" title="Remove URL">✕</button>`;
  urlList.appendChild(div);
}

export function v10RemoveTopicUrl(button) {
  const row = button.closest('.v10-url-row');
  if (row) row.remove();
}

export function v10ContentPanel(subjectName, unitId, role) {
  return `
  <div class="v10-panel">
    <div class="v10-panel-head">
      <h4>📚 Unit Content</h4>
    </div>
    <div class="v10-tabs">
      <button class="v10-tab on" onclick="v10SwitchTab(this,'v10-notes-${unitId}')">📄 Upload Notes</button>
      <button class="v10-tab"    onclick="v10SwitchTab(this,'v10-pyq-${unitId}')">📝 Previous Questions</button>
      <button class="v10-tab"    onclick="v10SwitchTab(this,'v10-iq-${unitId}')">⭐ Important Qs</button>
    </div>
    <div class="v10-pane on" id="v10-notes-${unitId}">${v10NotesForm(subjectName, unitId)}</div>
    <div class="v10-pane"    id="v10-pyq-${unitId}">${v10PYQForm(subjectName, unitId)}</div>
    <div class="v10-pane"    id="v10-iq-${unitId}">${v10IQForm(subjectName, unitId)}</div>
  </div>`;
}

export function v10SwitchTab(btn, paneId) {
  const panel = btn.closest('.v10-panel');
  panel.querySelectorAll('.v10-tab').forEach(t => t.classList.remove('on'));
  panel.querySelectorAll('.v10-pane').forEach(p => p.classList.remove('on'));
  btn.classList.add('on');
  const pane = document.getElementById(paneId);
  if (pane) pane.classList.add('on');
}

export function v10NotesForm(subjectName, unitId) {
  const notes = JSON.parse(localStorage.getItem('edusync_admin_notes') || '[]')
    .filter(n => n.subject === subjectName && parseInt(n.unit) === unitId);
  const s = (subjectName || '').replace(/\\/g, '\\\\').replace(/'/g, "\\'");
  return `
  <div class="v10-form">
    <p class="hint">Notes uploaded here will appear in the student's <strong>Notes tab</strong> for this unit.</p>
    <div class="input-group">
      <span class="v10-label">NOTES TITLE</span>
      <input class="input" id="v10-ntitle-${unitId}" placeholder="e.g. Unit ${unitId} Handwritten Notes">
    </div>
    <div class="v10-2col">
      <div class="input-group">
        <span class="v10-label">TYPE</span>
        <select class="select" id="v10-ntype-${unitId}">
          <option value="pdf">📄 PDF</option>
          <option value="doc">📝 DOC</option>
          <option value="link">🔗 Link</option>
        </select>
      </div>
      <div class="input-group">
        <span class="v10-label">UNIT</span>
        <select class="select" id="v10-nunit-${unitId}">
          ${[1, 2, 3, 4, 5].map(u => `<option value="${u}"${u === unitId ? ' selected' : ''}>Unit ${u}</option>`).join('')}
        </select>
      </div>
    </div>
    <div class="input-group">
      <span class="v10-label">SUBJECT</span>
      <input class="input" value="${subjectName}" readonly style="background:var(--surface2);">
    </div>
    <div class="input-group">
      <span class="v10-label">LINK / URL (GOOGLE DRIVE, PDF URL ETC.)</span>
      <input class="input" id="v10-nlink-${unitId}" placeholder="https://drive.google.com/..." type="url">
    </div>
    <button class="v10-submit" onclick="v10UploadNote('${s}',${unitId})">📄 Upload Notes</button>
  </div>
  ${notes.length ? `
  <div class="v10-items">
    <div class="v10-items-head">Uploaded Notes (${notes.length})</div>
    ${notes.map(n => `
    <div class="v10-item">
      <span style="font-size:1.1rem;">${n.type === 'pdf' ? '📄' : n.type === 'doc' ? '📝' : '🔗'}</span>
      <div class="v10-item-body">
        <div class="v10-item-title">${n.title}</div>
        <div class="v10-item-meta">${(n.type || '').toUpperCase()} · ${n.uploadedAt || ''}</div>
      </div>
      <button class="v10-del v10-edit-btn" onclick="aimeasyEditNote(${n.id},'${s}',${unitId})" title="Edit" style="color:var(--primary);margin-right:4px;">✏️</button>
      <button class="v10-del v10-del-btn" onclick="v10DeleteNote(${n.id},'${s}',${unitId})" title="Delete">🗑</button>
    </div>`).join('')}
  </div>` : ''}`;
}

export function v10UploadNote(subjectName, unitId) {
  const title = document.getElementById('v10-ntitle-' + unitId)?.value.trim();
  const type = document.getElementById('v10-ntype-' + unitId)?.value;
  const link = document.getElementById('v10-nlink-' + unitId)?.value.trim();
  if (!title) { showToast('Enter a note title', 'red'); return; }
  const notes = JSON.parse(localStorage.getItem('edusync_admin_notes') || '[]');
  notes.push({ id: Date.now(), title, type, link, subject: subjectName, unit: unitId, uploadedAt: new Date().toLocaleDateString() });
  localStorage.setItem('edusync_admin_notes', JSON.stringify(notes));
  document.getElementById('v10-ntitle-' + unitId).value = '';
  document.getElementById('v10-nlink-' + unitId).value = '';
  showToast('✅ Notes uploaded! Students can now see them.', 'green');
  const pane = document.getElementById('v10-notes-' + unitId);
  if (pane) pane.innerHTML = v10NotesForm(subjectName, unitId);
}

export function v10DeleteNote(id, subjectName, unitId) {
  if (!confirm('Delete this note?')) return;
  const notes = JSON.parse(localStorage.getItem('edusync_admin_notes') || '[]');
  localStorage.setItem('edusync_admin_notes', JSON.stringify(notes.filter(n => n.id !== id)));
  showToast('Note deleted', 'red');
  const pane = document.getElementById('v10-notes-' + unitId);
  if (pane) pane.innerHTML = v10NotesForm(subjectName, unitId);
}

export function v10TopicSelect(subjectName, unitId, selected = '', target = '') {
  const topics = v10UnitTopics(unitId);
  return `<select class="select v10-topic-select" id="v10-topic-${unitId}">
    <option value="">Select Topic</option>
    ${topics.map((t, i) => {
    const id = t.id || String(i + 1);
    const label = t.name || t.topicName || `Topic ${i + 1}`;
    return `<option value="${id}" data-title="${label.replace(/"/g, '&quot;')}"${String(selected) === String(id) ? ' selected' : ''}>${label}</option>`;
  }).join('')}
  </select>`.replace('<select ', `<select ${target ? `onchange="v10ApplyTopicSelection(this,'${target}',${unitId})" ` : ''}`);
}

export function v10TopicNameById(unitId, topicId) {
  const topics = v10UnitTopics(unitId);
  const idx = topics.findIndex((t, i) => String(t.id || i + 1) === String(topicId));
  return idx >= 0 ? (topics[idx].name || topics[idx].topicName || `Topic ${idx + 1}`) : '';
}

export function v10SubjectForDb(subjectName) {
  const subjects = JSON.parse(localStorage.getItem('edusync_custom_subjects') || '[]');
  const activeBranch = (APP.currentSubject?.branch || APP.user?.branch || APP.user?.branch_name || window._v10SASubj?.branch || '').toUpperCase();
  return subjects.find(s => s.name === subjectName && (!activeBranch || String(s.branch || '').toUpperCase() === activeBranch))
    || subjects.find(s => s.name === subjectName)
    || window._v10SASubj
    || APP.currentSubject
    || { name: subjectName };
}

export function v10BranchForSubject(subjectName) {
  const subject = v10SubjectForDb(subjectName);
  return String(subject?.branch || APP.currentSubject?.branch || APP.user?.branch || APP.user?.branch_name || '').toUpperCase();
}

export function v10SameBranchContent(item, branch) {
  const itemBranch = String(item?.branch || '').toUpperCase();
  const activeBranch = String(branch || '').toUpperCase();
  if (!activeBranch) return true;
  return itemBranch === activeBranch;
}

export function v10PersistSubjectDbIds(subjId, unitId, data) {
  if (!data?.subjectId || !data?.unitId) return;
  const subjects = JSON.parse(localStorage.getItem('edusync_custom_subjects') || '[]');
  const idx = subjects.findIndex(s => String(s.id) === String(subjId));
  if (idx >= 0) {
    subjects[idx].dbSubjectId = data.subjectId;
    subjects[idx].dbUnitIds = { ...(subjects[idx].dbUnitIds || {}), [unitId]: data.unitId };
    localStorage.setItem('edusync_custom_subjects', JSON.stringify(subjects));
    if (window._v10SASubj && String(window._v10SASubj.id) === String(subjId)) {
      window._v10SASubj = subjects[idx];
    }
  }
}

export function v10EscapeAttr(value) {
  return String(value || '').replace(/"/g, '&quot;');
}

export function v10EscapeJs(value) {
  return String(value || '').replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

export function v10TopicFieldsHTML(subjectName, unitId, target) {
  return `<div class="input-group"><span class="v10-label">TOPIC DROPDOWN (OPTIONAL)</span>${v10TopicSelect(subjectName, unitId, '', target)}</div>
    <div class="input-group"><span class="v10-label">TOPIC TEXT</span><input class="input v10-topic-text-input" id="v10-${target}-topic-text-${unitId}" placeholder="Type or select a topic" /></div>`;
}

export function v10ApplyTopicSelection(select, target, unitId) {
  const selected = select?.options?.[select.selectedIndex];
  const title = selected?.dataset?.title || selected?.textContent || '';
  const input = document.getElementById(`v10-${target}-topic-text-${unitId}`);
  if (input && title && select.value) input.value = title.trim();
}

export function v10ReadTopicInput(unitId, target) {
  const select = document.querySelector(`#v10-${target}-${unitId} .v10-topic-select`);
  const topicId = select?.value || '';
  const selectedTitle = topicId ? (select?.options?.[select.selectedIndex]?.dataset?.title || v10TopicNameById(unitId, topicId)) : '';
  const topicText = document.getElementById(`v10-${target}-topic-text-${unitId}`)?.value.trim() || selectedTitle.trim();
  return { topicId, topicName: topicText, selectedTitle };
}

export function v10ContentActionMenu(editCall, deleteCall) {
  return `<details class="v10-actions-menu"><summary title="Actions">...</summary><div class="v10-actions-dropdown">
    <button onclick="${editCall}">Edit</button>
    <button class="danger" onclick="${deleteCall}">Delete</button>
  </div></details>`;
}

export async function v10RefreshContentPane(kind, subjectName, unitId) {
  await v10ReloadUnitContentFromDb(subjectName, unitId);
  const pane = document.getElementById(`v10-${kind}-${unitId}`);
  if (!pane) {
    console.warn('[ROADMAP] Content refresh skipped: missing pane', { kind, unitId });
    return;
  }
  const renderers = {
    notes: v10NotesForm,
    pyq: v10PYQForm,
    iq: v10IQForm,
  };
  const renderer = renderers[kind];
  if (typeof renderer === 'function') pane.innerHTML = renderer(subjectName, unitId);
}

export function v10TopicRowHTMLEnhanced(subjId, unitId, idx, name, urls, total, topicId = '') {
  const isFilled = name.trim() !== '';
  const videos = (Array.isArray(urls) && urls.length ? urls : ['']).map((item) => (
    typeof item === 'object'
      ? { url: item.url || item.youtubeUrl || '', description: item.description || item.title || '' }
      : { url: item || '', description: '' }
  ));
  const urlRows = videos.map((video, ui) => `
    <div class="v10-url-row" style="display:grid;grid-template-columns:minmax(0,1fr) auto;gap:8px;margin-top:8px;align-items:start;">
      <input class="v10-url-input" placeholder="${ui === 0 ? 'Video URL' : 'Additional video URL'}" value="${(video.url || '').replace(/"/g, '&quot;')}" style="font-size:.78rem;width:100%;" />
      ${ui === 0
      ? `<button type="button" class="btn btn-ghost btn-sm" onclick="v10AddTopicUrl('${subjId}','${unitId}','${idx}')" title="Add another video">+</button>`
      : `<button type="button" class="btn btn-ghost btn-sm" onclick="v10RemoveTopicUrl(this)" title="Remove video">x</button>`}
      <input class="v10-video-desc-input" placeholder="${ui === 0 ? 'Video 1 description' : `Video ${ui + 1} description`}" value="${(video.description || '').replace(/"/g, '&quot;')}" style="font-size:.78rem;grid-column:1 / -1;width:100%;" />
    </div>`).join('');
  return `
  <div class="v10-topic-row" id="v10-tr-${unitId}-${idx}" data-topic-id="${topicId}">
    <div class="v10-dot ${isFilled ? 'filled' : ''}" id="v10-dot-${unitId}-${idx}">${idx + 1}</div>
    <div class="v10-topic-fields">
      <input class="${isFilled ? 'filled' : ''}" placeholder="Topic name (e.g. Introduction to AI)" value="${name.replace(/"/g, '&quot;')}" oninput="v10DotUpdate('${unitId}',${idx},this.value)" />
      <div class="v10-url-list">${urlRows}</div>
    </div>
    <button class="v10-rm-btn" onclick="v10RemoveTopic('${unitId0}',${idx})" title="Remove">x</button>
  </div>`;
}

export function v10AddTopicUrlEnhanced(subjId, unitId, topicIdx) {
  const row = document.getElementById('v10-tr-' + unitId + '-' + topicIdx);
  const urlList = row?.querySelector('.v10-url-list');
  if (!urlList) return;
  const count = urlList.querySelectorAll('.v10-url-row').length + 1;
  const div = document.createElement('div');
  div.className = 'v10-url-row';
  div.style.cssText = 'display:grid;grid-template-columns:minmax(0,1fr) auto;gap:8px;margin-top:8px;align-items:start;';
  div.innerHTML = `<input class="v10-url-input" placeholder="Additional video URL" style="font-size:.78rem;width:100%;" />
    <button type="button" class="btn btn-ghost btn-sm" onclick="v10RemoveTopicUrl(this)" title="Remove video">x</button>
    <input class="v10-video-desc-input" placeholder="Video ${count} description" style="font-size:.78rem;grid-column:1 / -1;width:100%;" />`;
  urlList.appendChild(div);
}

export function v10SavedRow(unitId, topicIdx) {
  return v10RoadmapRows(unitId)[topicIdx] || null;
}

export function v10ContentPanelLinked(subjectName, unitId, role) {
  return `<div class="v10-panel"><div class="v10-panel-head"><h4>Unit Content</h4></div><div class="v10-tabs">
    <button class="v10-tab on" onclick="v10SwitchTab(this,'v10-notes-${unitId}')">Notes</button>
    <button class="v10-tab" onclick="v10SwitchTab(this,'v10-pyq-${unitId}')">PYQs</button>
    <button class="v10-tab" onclick="v10SwitchTab(this,'v10-iq-${unitId}')">Important Qs</button>
  </div><div class="v10-pane on" id="v10-notes-${unitId}">${v10NotesForm(subjectName, unitId)}</div><div class="v10-pane" id="v10-pyq-${unitId}">${v10PYQForm(subjectName, unitId)}</div><div class="v10-pane" id="v10-iq-${unitId}">${v10IQForm(subjectName, unitId)}</div></div>`;
}

export function v10NotesFormLinked(subjectName, unitId) {
  const notes = JSON.parse(localStorage.getItem('edusync_admin_notes') || '[]').filter(n => n.subject === subjectName && parseInt(n.unit) === parseInt(unitId));
  const s = v10EscapeJs(subjectName);
  return `<div class="v10-form"><p class="hint">Select an existing roadmap topic or type a new topic.</p>${v10TopicFieldsHTML(subjectName, unitId, 'notes')}<div class="input-group"><span class="v10-label">NOTE URL / FILE</span><input class="input" id="v10-nlink-${unitId}" placeholder="https://drive.google.com/..." type="url"></div><div class="input-group"><span class="v10-label">DESCRIPTION</span><textarea class="input" id="v10-ndesc-${unitId}" rows="3" style="resize:vertical;"></textarea></div><button class="v10-submit" onclick="v10UploadNote('${s}',${unitId})">Save Note</button></div>${notes.length ? `<div class="v10-items"><div class="v10-items-head">Uploaded Notes (${notes.length})</div>${notes.map(n => `<div class="v10-item"><span>📄</span><div class="v10-item-body"><div class="v10-item-title">${n.topicName || n.title}</div><div class="v10-item-meta">${n.description || n.title || ''} · ${n.uploadedAt || ''}</div></div><button class="v10-del v10-edit-btn" onclick="aimeasyEditNote('${n.id}','${s}',${unitId})" style="color:var(--primary);margin-right:4px;">Edit</button><button class="v10-del v10-del-btn" onclick="v10DeleteNote('${n.id}','${s}',${unitId})">Delete</button></div>`).join('')}</div>` : ''}`;
}

export async function v10UploadNoteLinked(subjectName, unitId) {
  const link = document.getElementById('v10-nlink-' + unitId)?.value.trim();
  const description = document.getElementById('v10-ndesc-' + unitId)?.value.trim() || '';
  const { topicId, topicName } = v10ReadTopicInput(unitId, 'notes');
  if (!topicName) { showToast('Enter topic text or select a topic', 'red'); return; }
  const notes = JSON.parse(localStorage.getItem('edusync_admin_notes') || '[]');
  const note = { id: Date.now(), title: topicName, description, type: 'link', link, subject: subjectName, unit: unitId, topicId, topicName, uploadedAt: new Date().toLocaleDateString() };
  const saved = await window.aimeasySaveLinkedContentItem?.({ subject: v10SubjectForDb(subjectName), unit: v10UnitForDb(unitId), topicTitle: topicName, topicLegacyId: topicId, contentType: 'note', title: topicName, body: description, url: link, metadata: { topicId, topicText: topicName } });
  if (saved?.error) { showToast('DB save failed: ' + saved.error.message, 'red'); return; }
  if (saved?.data?.id) note.dbContentId = saved.data.id;
  notes.push(note);
  localStorage.setItem('edusync_admin_notes', JSON.stringify(notes));
  await v10RefreshContentPane('notes', subjectName, unitId);
  window.renderSubAdminDashboardLive?.();
  console.log('[NOTES] Save Success', { subjectName, unitId, topicId, topicName, contentId: saved?.data?.id });
  showToast('Note saved under topic.', 'green');
}

export async function v10DeleteNoteLinked(id, subjectName, unitId) {
  if (!confirm('Delete this note?')) return;
  const notes = JSON.parse(localStorage.getItem('edusync_admin_notes') || '[]');
  const note = notes.find(n => n.id === id);
  if (note?.dbContentId) await window.aimeasyDeleteContent?.(note.dbContentId);
  localStorage.setItem('edusync_admin_notes', JSON.stringify(notes.filter(n => n.id !== id)));
  await v10RefreshContentPane('notes', subjectName, unitId);
  window.renderSubAdminDashboardLive?.();
  showToast('Note deleted', 'red');
}

export function v10NotesFormTopicText(subjectName, unitId) {
  const notes = JSON.parse(localStorage.getItem('edusync_admin_notes') || '[]').filter(n => n.subject === subjectName && parseInt(n.unit) === parseInt(unitId));
  const s = v10EscapeJs(subjectName);
  return `<div class="v10-form"><p class="hint">Select an existing roadmap topic or type a new topic.</p>${v10TopicFieldsHTML(subjectName, unitId, 'notes')}<div class="input-group"><span class="v10-label">NOTE URL / FILE</span><input class="input" id="v10-nlink-${unitId}" placeholder="https://drive.google.com/..." type="url"></div><div class="input-group"><span class="v10-label">DESCRIPTION</span><textarea class="input" id="v10-ndesc-${unitId}" rows="3" style="resize:vertical;"></textarea></div><button class="v10-submit" onclick="v10UploadNote('${s}',${unitId})">Save Note</button></div>${notes.length ? `<div class="v10-items"><div class="v10-items-head">Uploaded Notes (${notes.length})</div>${notes.map(n => `<div class="v10-item"><span>📄</span><div class="v10-item-body"><div class="v10-item-title">${n.topicName || n.title}</div><div class="v10-item-meta">${n.description || n.title || ''} · ${n.uploadedAt || ''}</div></div><button class="v10-del v10-edit-btn" onclick="aimeasyEditNote('${n.id}','${s}',${unitId})" style="color:var(--primary);margin-right:4px;">Edit</button><button class="v10-del v10-del-btn" onclick="v10DeleteNote('${n.id}','${s}',${unitId})">Delete</button></div>`).join('')}</div>` : ''}`;
}

export async function v10UploadNoteTopicText(subjectName, unitId) {
  const link = document.getElementById('v10-nlink-' + unitId)?.value.trim();
  const description = document.getElementById('v10-ndesc-' + unitId)?.value.trim() || '';
  const { topicId, topicName } = v10ReadTopicInput(unitId, 'notes');
  if (!topicName) { showToast('Enter topic text or select a topic', 'red'); return; }
  const notes = JSON.parse(localStorage.getItem('edusync_admin_notes') || '[]');
  const branch = v10BranchForSubject(subjectName);
  const note = { id: Date.now(), title: topicName, description, type: 'link', link, subject: subjectName, branch, unit: unitId, topicId, topicName, uploadedAt: new Date().toLocaleDateString() };
  const saved = await window.aimeasySaveLinkedContentItem?.({ subject: v10SubjectForDb(subjectName), unit: v10UnitForDb(unitId), topicTitle: topicName, topicLegacyId: topicId, contentType: 'note', title: topicName, body: description, url: link, metadata: { topicId, topicText: topicName, branch } });
  if (saved?.error) { showToast('DB save failed: ' + saved.error.message, 'red'); return; }
  if (saved?.data?.id) note.dbContentId = saved.data.id;
  notes.push(note);
  localStorage.setItem('edusync_admin_notes', JSON.stringify(notes));
  await v10RefreshContentPane('notes', subjectName, unitId);
  window.renderSubAdminDashboardLive?.();
  showToast('Note saved under topic.', 'green');
}

export function v10NotesFormMenuActions(subjectName, unitId) {
  const branch = v10BranchForSubject(subjectName);
  const notes = JSON.parse(localStorage.getItem('edusync_admin_notes') || '[]').filter(n => n.subject === subjectName && parseInt(n.unit) === parseInt(unitId) && v10SameBranchContent(n, branch));
  const s = v10EscapeJs(subjectName);
  return `<div class="v10-form"><p class="hint">Select a saved roadmap topic or type a matching topic.</p>${v10TopicFieldsHTML(subjectName, unitId, 'notes')}<div class="input-group"><span class="v10-label">PDF / NOTE URL</span><input class="input" id="v10-nlink-${unitId}" placeholder="https://drive.google.com/..." type="url"></div><div class="input-group"><span class="v10-label">DESCRIPTION</span><textarea class="input" id="v10-ndesc-${unitId}" rows="3" style="resize:vertical;"></textarea></div><button class="v10-submit" onclick="v10UploadNote('${s}',${unitId})">Save Note</button></div>${notes.length ? `<div class="v10-items"><div class="v10-items-head">Uploaded Notes (${notes.length})</div>${notes.map(n => `<div class="v10-item"><span>📄</span><div class="v10-item-body"><div class="v10-item-title">${n.topicName || n.title}</div><div class="v10-item-meta">${n.description || n.title || ''} · ${n.uploadedAt || ''}</div></div>${v10ContentActionMenu(`aimeasyEditNote('${n.id}','${s}',${unitId})`, `v10DeleteNote('${n.id}','${s}',${unitId})`)}</div>`).join('')}</div>` : ''}`;
}

export function v10CloseActionMenus() {
  document.querySelectorAll('.v10-actions-menu.open').forEach(menu => menu.classList.remove('open'));
}

export function v10ToggleActionMenuv10ToggleActionMenuPortal(button) {
  window.event?.stopPropagation();
  const wrapper = button.closest('.v10-actions-menu');
  const wasOpen = wrapper?.classList.contains('open');
  v10CloseActionMenus();
  if (!wrapper || wasOpen) return;
  wrapper.classList.add('open');

  const portal = document.createElement('div');
  portal.id = 'v10-actions-portal';
  portal.className = 'v10-actions-portal';
  portal.innerHTML = `
    <button type="button" data-action="edit">${button.dataset.editLabel || 'Edit'}</button>
    <button type="button" class="danger" data-action="delete">${button.dataset.deleteLabel || 'Delete'}</button>`;
  document.body.appendChild(portal);

  const rect = button.getBoundingClientRect();
  const portalRect = portal.getBoundingClientRect();
  const left = Math.min(window.innerWidth - portalRect.width - 10, Math.max(10, rect.right - portalRect.width));
  const top = Math.min(window.innerHeight - portalRect.height - 10, rect.bottom + 6);
  portal.style.left = `${left}px`;
  portal.style.top = `${top}px`;

  portal.querySelector('[data-action="edit"]').onclick = () => {
    v10CloseActionMenus();
    new Function(button.dataset.edit || '')();
  };
  portal.querySelector('[data-action="delete"]').onclick = () => {
    v10CloseActionMenus();
    new Function(button.dataset.delete || '')();
  };
}

export function v10ContentActionMenuFixed(editCall, deleteCall) {
  return `<div class="v10-actions-menu">
    <button type="button" class="v10-actions-trigger" title="Actions" onclick="v10ToggleActionMenu(this)">...</button>
    <div class="v10-actions-dropdown">
      <button type="button" onclick="v10CloseActionMenus();${editCall}">Edit</button>
      <button type="button" class="danger" onclick="v10CloseActionMenus();${deleteCall}">Delete</button>
    </div>
  </div>`;
}

export function v10FileUploadArea(unitId, target) {
  return `<div class="v10-drop-zone" data-target="${target}" data-unit="${unitId}" ondragover="v10UploadDragOver(event)" ondragleave="v10UploadDragLeave(event)" ondrop="v10UploadDrop(event,'${target}',${unitId})" onclick="document.getElementById('v10-${target}-file-${unitId}')?.click()">
    <input type="file" id="v10-${target}-file-${unitId}" accept=".pdf,.docx,.pptx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.openxmlformats-officedocument.presentationml.presentation" style="display:none" onchange="v10HandleUploadFile(this.files?.[0],'${target}',${unitId})">
    <div class="v10-drop-title">Drag PDF here</div>
    <div class="v10-drop-sub">or click to upload PDF, DOCX, or PPTX</div>
    <div class="v10-upload-progress" id="v10-${target}-progress-${unitId}"><span></span></div>
  </div>`;
}

export function v10UploadDragOverv10UploadDragOver(event) {
  event.preventDefault();
  event.currentTarget.classList.add('dragging');
}

export function v10UploadDragLeavev10UploadDragLeave(event) {
  event.currentTarget.classList.remove('dragging');
}

export function v10UploadDropv10UploadDrop(event, target, unitId) {
  event.preventDefault();
  event.currentTarget.classList.remove('dragging');
  v10HandleUploadFile(event.dataTransfer?.files?.[0], target, unitId);
}

export async function v10HandleUploadFilev10HandleUploadFilePersistent(file, target, unitId) {
  if (!file) return;
  const ext = aimeasyFileExt(file);
  const maxBytes = 25 * 1024 * 1024;
  if (!['pdf', 'docx', 'pptx'].includes(ext)) {
    showToast('Only PDF, DOCX, and PPTX files are supported.', 'red');
    return;
  }
  if (file.size > maxBytes) {
    showToast('Maximum upload size is 25 MB.', 'red');
    return;
  }

  const inputId = target === 'notes' ? `v10-nlink-${unitId}` : `v10-${target}link-${unitId}`;
  const urlInput = document.getElementById(inputId);
  const progress = document.getElementById(`v10-${target}-progress-${unitId}`);
  const localUrl = URL.createObjectURL(file);
  window.__aimeasyLocalFilePreviews[localUrl] = { file, name: file.name, type: file.type };
  if (urlInput) urlInput.value = localUrl;
  if (progress) {
    progress.classList.add('active');
    progress.querySelector('span').style.width = '35%';
  }

  const uploadPromise = aimeasyUploadContentFile(file, target, unitId);
  window.__aimeasyPendingUploads[inputId] = uploadPromise;
  const uploaded = await uploadPromise.finally(() => {
    delete window.__aimeasyPendingUploads[inputId];
  });
  if (progress) progress.querySelector('span').style.width = uploaded.error ? '70%' : '100%';
  if (uploaded.url) {
    if (urlInput) urlInput.value = uploaded.url;
    console.log(`[${target === 'notes' ? 'NOTES' : target.toUpperCase()}] Upload Success`, {
      fileName: file.name,
      size: file.size,
      url: uploaded.url,
    });
    showToast('File uploaded. Press Save to publish it.', 'green');
    return;
  }

  console.warn('[NOTES] Storage upload failed; using session preview only', uploaded.error);
  showToast('Storage upload failed. Preview works in this session only; configure the aimeasy-content bucket migration.', 'amber');
}

export function v10NotesFormDropZone(subjectName, unitId) {
  const branch = v10BranchForSubject(subjectName);
  const notes = JSON.parse(localStorage.getItem('edusync_admin_notes') || '[]').filter(n => n.subject === subjectName && parseInt(n.unit) === parseInt(unitId) && v10SameBranchContent(n, branch));
  const s = v10EscapeJs(subjectName);
  return `<div class="v10-form">${v10TopicFieldsHTML(subjectName, unitId, 'notes')}${v10FileUploadArea(unitId, 'notes')}<div class="input-group"><span class="v10-label">PDF / NOTE URL</span><input class="input" id="v10-nlink-${unitId}" placeholder="https://drive.google.com/..." type="url"></div><div class="input-group"><span class="v10-label">DESCRIPTION</span><textarea class="input" id="v10-ndesc-${unitId}" rows="3" style="resize:vertical;"></textarea></div><button class="v10-submit" onclick="v10UploadNote('${s}',${unitId})">Save Note</button></div>${notes.length ? `<div class="v10-items"><div class="v10-items-head">Uploaded Notes (${notes.length})</div>${notes.map(n => `<div class="v10-item"><span>File</span><div class="v10-item-body"><div class="v10-item-title">${n.topicName || n.title}</div><div class="v10-item-meta">${n.description || n.title || ''} ${n.uploadedAt || ''}</div></div>${v10ContentActionMenu(`aimeasyEditNote('${n.id}','${s}',${unitId})`, `v10DeleteNote('${n.id}','${s}',${unitId})`)}</div>`).join('')}</div>` : ''}`;
}

export async function v10UploadNoteReliable(subjectName, unitId) {
  const before = JSON.parse(localStorage.getItem('edusync_admin_notes') || '[]').length;
  const result = await v10UploadNoteWithLogs(subjectName, unitId);
  const after = JSON.parse(localStorage.getItem('edusync_admin_notes') || '[]').length;
  if (after > before) console.log('[NOTES] Upload Success', { subjectName, unitId });
  return result;
}

export function updateLandingStats() {
  try {
    const elStudents = document.getElementById('stat-students');
    if (elStudents) elStudents.textContent = '0';

    const elSubjects = document.getElementById('stat-subjects');
    if (elSubjects) elSubjects.textContent = '0';

    const elPyqs = document.getElementById('stat-pyqs');
    if (elPyqs) elPyqs.textContent = '0';

    const elSat = document.getElementById('stat-satisfaction');
    if (elSat) elSat.textContent = '0';
  } catch (e) {
    // Landing page must never crash.
    try {
      console.warn('updateLandingStats failed:', e);
    } catch (_) { }
  }
}

export function getSubjectProgress(subj) {
  if (!subj) return 0;
  if (typeof subj === 'string') {
    const found = Object.values(SUBJECTS_DB).flat().find(s => s.id === subj);
    if (found) {
      subj = found;
    } else {
      const customSubjects = JSON.parse(localStorage.getItem('edusync_custom_subjects') || '[]');
      const cFound = customSubjects.find(s => s.id === subj || s.rawId === subj);
      if (cFound) subj = cFound;
      else return 0;
    }
  }
  const subjId = subj.id;

  let units = [];
  if (subj.rawId) {
    units = JSON.parse(localStorage.getItem('edusync_units_' + subj.rawId) || '[]');
  } else if (subj.isCustom || (subjId && subjId.toString().startsWith('custom_'))) {
    const rawId = subjId.toString().replace('custom_', '');
    units = JSON.parse(localStorage.getItem('edusync_units_' + rawId) || '[]');
  }
  if (!units.length) {
    units = JSON.parse(localStorage.getItem('edusync_units_' + subjId) || '[]');
  }

  const unitCount = subj.units || 5;
  let totalTopics = 0;
  let completedTopics = 0;
  const completed = JSON.parse(localStorage.getItem('edusync_completed_topics') || '[]');

  if (units.length > 0) {
    units.forEach(u => {
      const topicCount = (u.topics || []).length;
      totalTopics += topicCount;
      (u.topics || []).forEach((t, i) => {
        const key = `${subjId}-${u.id}-${i}`;
        if (completed.includes(key)) {
          completedTopics++;
        }
      });
    });
  } else {
    const topicsDb = UNIT_TOPICS[subjId] || UNIT_TOPICS.default;
    for (let u = 1; u <= unitCount; u++) {
      const topics = topicsDb[u] || UNIT_TOPICS.default[1];
      totalTopics += topics.length;
      topics.forEach((t, i) => {
        const key = `${subjId}-${u}-${i}`;
        if (completed.includes(key)) {
          completedTopics++;
        }
      });
    }
  }

  if (totalTopics === 0) return 0;
  return Math.round((completedTopics / totalTopics) * 100);
}

export function readStudentJson(key, fallback = []) {
  try { return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback)); } catch { return fallback; }
}

export function writeStudentJson(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

export function todayKey(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

export function startOfWeek(date = new Date()) {
  const d = new Date(date);
  const day = d.getDay() || 7;
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - day + 1);
  return d;
}

export function getStudentAssignedSubjects() {
  const sem = APP.user?.semester || '3-1';
  const customSubjects = readStudentJson('edusync_custom_subjects', []);
  const colorOptions = ['teal', 'lavender', 'blue', 'green', 'amber'];
  return customSubjects
    .filter(s =>
      s.sem === sem &&
      (!APP.user?.branch || s.branch === APP.user.branch) &&
      (!APP.user?.regulation || s.reg === APP.user.regulation || !s.reg)
    )
    .map((s, i) => {
      const units = readStudentJson('edusync_units_' + s.id, []);
      return {
        id: 'custom_' + s.id,
        rawId: s.id,
        name: s.name,
        code: s.code || 'Subject',
        credits: parseInt(s.credits) || 3,
        units: units.length,
        color: colorOptions[i % colorOptions.length],
        icon: '\u{1F4D6}',
        branch: s.branch,
        isCustom: true
      };
    });
}

export function contentItemsForSubject(subject) {
  const subjectName = subject?.name || '';
  const branch = subject?.branch || APP.user?.branch || APP.user?.branch_name || '';
  const keys = [
    ['edusync_admin_notes', 'note'],
    ['edusync_admin_videos', 'video'],
    ['edusync_admin_pyqs', 'quiz'],
    ['edusync_admin_iqs', 'iq']
  ];
  return keys.flatMap(([key, type]) => readStudentJson(key, [])
    .filter(item => item.subject === subjectName && v10SameBranchContent(item, branch))
    .map(item => ({ ...item, type })));
}

export function totalLearningItems(subjects) {
  return subjects.reduce((total, subject) => {
    const units = readStudentJson('edusync_units_' + (subject.rawId || String(subject.id).replace('custom_', '')), []);
    const topicCount = units.reduce((sum, unit) => sum + (unit.topics || []).length, 0);
    return total + topicCount + units.length + contentItemsForSubject(subject).length;
  }, 0);
}

export function markTopicCompleted(subjectId, unitId, topicIndex) {
  if (topicIndex === undefined || topicIndex === null) return;
  const completed = readStudentJson('edusync_completed_topics', []);
  const key = `${subjectId}-${unitId}-${topicIndex}`;
  if (!completed.includes(key)) {
    completed.push(key);
    writeStudentJson('edusync_completed_topics', completed);
    recordStudyActivity('content_completed', { subjectId, unitId, topicIndex });
    markUnitCompletedIfReady(subjectId, unitId);
  }
}

export function weeklyDashboardStats(subjects) {
  const weekStart = startOfWeek();
  const events = readStudentJson('edusync_study_activity', [])
    .filter(event => new Date(event.at) >= weekStart);
  const completedUnits = readStudentJson('edusync_completed_units', [])
    .filter(item => item.at && new Date(item.at) >= weekStart);
  const activeSubjects = new Set(events.map(event => event.subjectId).filter(Boolean));
  const weeklyCompletion = totalLearningItems(subjects)
    ? Math.min(100, Math.round((events.filter(event => event.type === 'content_completed').length / totalLearningItems(subjects)) * 100))
    : 0;
  return { weeklyCompletion, unitsCompleted: completedUnits.length, subjectsActive: activeSubjects.size };
}

export function achievementList(subjects) {
  const events = readStudentJson('edusync_study_activity', []);
  const unitsDone = readStudentJson('edusync_completed_units', []);
  const streak = parseInt(localStorage.getItem('edusync_streak') || '0');
  const notesRead = events.filter(event => event.type === 'note_read').length;
  const subjectMilestones = subjects.filter(subject => getSubjectProgress(subject) >= 100).length;
  return [
    { label: 'First Subject Opened', icon: '\u{1F4D6}', earned: events.some(event => event.type === 'subject_opened') },
    { label: 'First Unit Completed', icon: '\u{2705}', earned: unitsDone.length >= 1 },
    { label: '5 Units Completed', icon: '\u{26A1}', earned: unitsDone.length >= 5 },
    { label: '10 Units Completed', icon: '\u{1F3C6}', earned: unitsDone.length >= 10 },
    { label: '7 Day Streak', icon: '\u{1F525}', earned: streak >= 7 },
    { label: '30 Day Streak', icon: '\u{1F451}', earned: streak >= 30 },
    { label: '100 Notes Read', icon: '\u{1F4DA}', earned: notesRead >= 100 },
    { label: `${subjectMilestones} Subject Milestone${subjectMilestones === 1 ? '' : 's'}`, icon: '\u{1F393}', earned: subjectMilestones > 0 }
  ];
}

export function formatRecentTime(iso) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.max(0, Math.floor(diffMs / 60000));
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} hr ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? '' : 's'} ago`;
}

export function updateStudentDashboardMetrics() {
  loadCalcState();
  const calcdSems = APP.calcSemesters ? APP.calcSemesters.filter(s => s.sgpa !== null) : [];
  let cgpa = 0.0;
  if (calcdSems.length > 0) {
    cgpa = calcdSems.reduce((s, x) => s + x.sgpa, 0) / calcdSems.length;
  }

  updateStudyStreak();
  const subjects = getStudentAssignedSubjects();
  const weekly = weeklyDashboardStats(subjects);

  const metricVals = document.querySelectorAll('#page-dashboard .metric-card .metric-val');
  if (metricVals.length >= 3) {
    metricVals[0].textContent = cgpa > 0 ? cgpa.toFixed(2) : '0';
    const avgProgress = subjects.length
      ? Math.round(subjects.reduce((sum, s) => sum + getSubjectProgress(s), 0) / subjects.length)
      : 0;
    metricVals[1].textContent = avgProgress + '%';

    const streak = parseInt(localStorage.getItem('edusync_streak') || '0');
    metricVals[2].textContent = streak;
  }

  const trendEl = document.querySelector('#page-dashboard .metric-card.blue .metric-trend');
  if (trendEl) {
    if (calcdSems.length > 1) {
      const prevSems = calcdSems.slice(0, -1);
      const prevCgpa = prevSems.reduce((s, x) => s + x.sgpa, 0) / prevSems.length;
      const diff = cgpa - prevCgpa;
      const arrow = diff >= 0 ? '↑' : '↓';
      trendEl.textContent = `${arrow} ${Math.abs(diff).toFixed(2)} from last sem`;
    } else {
      trendEl.textContent = '↑ 0.0 from last sem';
    }
  }

  const streakEl = document.getElementById('study-streak-current');
  if (streakEl) streakEl.textContent = `${localStorage.getItem('edusync_streak') || '0'} \u{1F525}`;
  const streakMeta = document.getElementById('study-streak-meta');
  if (streakMeta) {
    const best = localStorage.getItem('edusync_best_streak') || '0';
    const last = localStorage.getItem('edusync_last_active_date') || 'Never';
    streakMeta.textContent = `Best Streak: ${best} · Last Active: ${last}`;
  }

  const progressTracker = document.querySelector('#page-dashboard .progress-tracker');
  if (progressTracker) {
    const heading = progressTracker.querySelector('.section-heading');
    progressTracker.innerHTML = '';
    if (heading) progressTracker.appendChild(heading);
    progressTracker.insertAdjacentHTML('beforeend', `
      <div class="weekly-summary">
        <div><strong>${weekly.weeklyCompletion}%</strong><span>Weekly Completion</span></div>
        <div><strong>${weekly.unitsCompleted}</strong><span>Units Completed This Week</span></div>
        <div><strong>${weekly.subjectsActive}</strong><span>Subjects Active This Week</span></div>
      </div>
    `);

    subjects.slice(0, 5).forEach((s, idx) => {
      const progress = getSubjectProgress(s);
      const colors = ['var(--green),var(--teal)', 'var(--amber),#f97316', 'var(--primary),var(--lavender)', 'var(--lavender),var(--primary)', 'var(--red),#f97316'];
      const color = colors[idx % colors.length];
      const trackerItem = document.createElement('div');
      trackerItem.className = 'tracker-item';
      trackerItem.innerHTML = `
        <div class="tracker-header">
          <span class="tracker-name">${v10Html(s.name)}</span>
          <span class="tracker-pct">${progress}%</span>
        </div>
        <div class="progress-bar">
          <div class="progress-fill" style="width:${progress}%;background:linear-gradient(90deg,${color});"></div>
        </div>
      `;
      progressTracker.appendChild(trackerItem);
    });
    if (!subjects.length) {
      progressTracker.insertAdjacentHTML('beforeend', '<p style="color:var(--text3);font-size:0.83rem;padding:1rem 0;text-align:center;">No assigned subjects yet.</p>');
    }
  }

  const recentListEl = document.getElementById('recently-opened-list');
  if (recentListEl) {
    const list = readStudentJson('edusync_recently_opened', []);
    if (list.length === 0) {
      recentListEl.innerHTML = `<p style="color:var(--text3);font-size:0.83rem;padding:1.4rem 0;text-align:center;">No recently opened subjects yet.</p>`;
    } else {
      recentListEl.innerHTML = list.map(item => `
        <div class="recent-item">
          <div class="recent-thumb" style="background:var(--primary-light);">${item.icon || '\u{1F4D6}'}</div>
          <div class="recent-info">
            <div class="recent-title">${v10Html(item.name)}</div>
            <div class="recent-sub">${v10Html(item.code || 'Subject')} · ${formatRecentTime(item.openedAt)}</div>
          </div>
          <button class="btn btn-primary btn-sm" onclick="openSubjectFromRecent('${v10EscapeJs(item.id || item.name)}')">Continue</button>
        </div>
      `).join('');
    }
  }

  const achievementsEl = document.getElementById('achievements-list');
  if (achievementsEl) {
    achievementsEl.innerHTML = achievementList(subjects).map(item => `
      <div class="achievement-card ${item.earned ? 'earned' : 'locked'}">
        <div class="achievement-icon">${item.icon}</div>
        <div>${v10Html(item.label)}</div>
      </div>
    `).join('');
  }
}

export function addToRecentlyOpened(name, code, icon, id) {
  let list = readStudentJson('edusync_recently_opened', []);
  list = list.filter(item => item.id !== id && item.name !== name);
  list.unshift({ name, code, icon, id, openedAt: new Date().toISOString() });
  writeStudentJson('edusync_recently_opened', list.slice(0, 5));
}

export function v10Html(value) {
  return String(value || '').replace(/[&<>"']/g, ch => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  }[ch]));
}

export function v10CloseActionMenusPortal() {
  document.querySelectorAll('.v10-actions-menu.open').forEach(menu => menu.classList.remove('open'));
  document.getElementById('v10-actions-portal')?.remove();
}

export function v10ContentActionMenuPortal(editCall, deleteCall) {
  return `<div class="v10-actions-menu">
    <button type="button" class="v10-actions-trigger" title="Actions" aria-label="Actions" data-edit="${v10EscapeAttr(editCall)}" data-delete="${v10EscapeAttr(deleteCall)}" onclick="v10ToggleActionMenu(this)">...</button>
  </div>`;
}

export function v10TopicRowHTMLSubtopics(subjId, unitId, idx, name, urls, total, topicId = '', isSubTopic = false) {
  const isFilled = name.trim() !== '';
  const topicPlaceholder = isSubTopic ? 'Sub topic name (e.g. Topic 1.1)' : 'Topic name (e.g. Introduction to AI)';
  const video = Array.isArray(urls) && urls.length ? urls[0] : '';
  const parsedVideo = typeof video === 'object'
    ? { subTopicName: video.subTopicName || video.sub_topic_name || '', url: video.url || video.youtubeUrl || video.url || '', description: video.description || '' }
    : { subTopicName: '', url: video || '', description: '' };
  return `
  <div class="v10-topic-row${isSubTopic ? ' subtopic-row' : ''}" id="v10-tr-${unitId}-${idx}" data-topic-id="${topicId}">
    <div class="v10-dot ${isFilled ? 'filled' : ''}" id="v10-dot-${unitId}-${idx}">${idx + 1}</div>
    <div class="v10-topic-fields">
      <input class="${isFilled ? 'filled' : ''}" placeholder="${topicPlaceholder}" value="${v10EscapeAttr(name)}" oninput="v10DotUpdate('${unitId}',${idx},this.value)" />
      <div class="v10-url-row" style="display:grid;grid-template-columns:1fr;gap:8px;margin-top:10px;">
        <input class="input v10-subtopic-input" placeholder="Sub Topic name (optional)" value="${v10EscapeAttr(parsedVideo.subTopicName)}" style="font-size:.88rem;width:100%;" />
        <input class="input v10-url-input" placeholder="Video URL (optional)" value="${v10EscapeAttr(parsedVideo.url)}" style="font-size:.88rem;width:100%;" />
        <input class="input v10-video-desc-input" placeholder="Video description (optional)" value="${v10EscapeAttr(parsedVideo.description)}" style="font-size:.88rem;width:100%;" />
      </div>
    </div>
    <button class="v10-rm-btn" onclick="v10RemoveTopic('${unitId}',${idx})" title="Remove">✕</button>
  </div>`;
}

export function v10AddTopicUrlSubtopic(subjId, unitId, topicIdx) {
  const row = document.getElementById('v10-tr-' + unitId + '-' + topicIdx);
  const urlList = row?.querySelector('.v10-url-list');
  if (!urlList) return;
  const count = urlList.querySelectorAll('.v10-url-row').length + 1;
  const div = document.createElement('div');
  div.className = 'v10-url-row';
  div.style.cssText = 'display:grid;grid-template-columns:minmax(0,1fr) auto;gap:8px;margin-top:8px;align-items:start;';
  div.innerHTML = `<input class="input v10-subtopic-input" placeholder="Sub Topic Name" value="Video ${count}" style="font-size:.78rem;width:100%;" />
    <button type="button" class="btn btn-ghost btn-sm" onclick="v10RemoveTopicUrl(this)" title="Remove video">x</button>
    <input class="v10-url-input" placeholder="Additional video URL" style="font-size:.78rem;width:100%;grid-column:1 / -1;" />
    <input class="v10-video-desc-input" placeholder="Video ${count} description" style="font-size:.78rem;grid-column:1 / -1;width:100%;" />`;
  urlList.appendChild(div);
}

export function reviewStorageKey() {
  const userId = APP.user?.id || APP.user?.googleId || APP.user?.email || 'guest';
  return `edusync_marked_reviews_${userId}`;
}

export function hydrateMarkedReviews() {
  try {
    const saved = JSON.parse(localStorage.getItem(reviewStorageKey()) || '[]');
    APP.markedReviews = new Set(saved);
  } catch {
    APP.markedReviews = APP.markedReviews || new Set();
  }
}

export function persistMarkedReviews() {
  localStorage.setItem(reviewStorageKey(), JSON.stringify([...APP.markedReviews]));
}

export async function syncTopicProgressToDb({ subjectId, unitId, topicIndex, topicId, status }) {
  const supabase = window.__AIMEASY_SUPABASE__;
  const userId = APP.user?.id || APP.user?.googleId;
  if (!supabase || !userId || !subjectId || !unitId || topicIndex === undefined || topicIndex === null) return;
  try {
    const { error } = await supabase
      .from('student_topic_progress')
      .upsert({
        user_id: userId,
        subject_key: String(subjectId),
        unit_key: String(unitId),
        topic_index: Number(topicIndex),
        topic_id: topicId || null,
        status,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id,subject_key,unit_key,topic_index' });
    if (error) console.warn('[STUDENT] Progress DB sync failed:', error.message || error);
  } catch (error) {
    console.warn('[STUDENT] Progress DB sync failed:', error?.message || error);
  }
}

export function topicReviewKey(subjectId, unitId, topicIndex) {
  return `${subjectId}-${unitId}-${topicIndex}`;
}

export function switchTabPersistStudentState(tab) {
  const result = aimeasySwitchTabWithUnitState?.call(this, tab);
  if (document.getElementById('page-unit-content')?.style.display !== 'none') {
    writeStudentUnitState({ tab });
  }
  return result;
}

export async function fetchApprovedTopicSuggestions(subjectId, unitId) {
  const supabase = window.__AIMEASY_SUPABASE__;
  if (!supabase || !subjectId || !unitId) return [];
  const { data, error } = await supabase
    .from('student_url_suggestions')
    .select('id, title, url, description, subject_id, unit_id, topic_id, status, created_at')
    .eq('subject_id', subjectId)
    .eq('unit_id', unitId)
    .eq('status', 'approved')
    .order('created_at', { ascending: true });
  if (error) {
    console.warn('[SUGGESTIONS] Approved URL load failed:', error.message || error);
    return [];
  }
  return data || [];
}

export function selectTopicUrlFlat(topicIndex, urlIndex) {
  const matchIndex = (APP._videoItems || []).findIndex(item => item.topicIndex === topicIndex && item.videoIndex === urlIndex);
  if (matchIndex >= 0) selectVideoItem(matchIndex);
}

export function aimeasySafePathPart(value) {
  return String(value || 'file').trim().toLowerCase().replace(/[^a-z0-9._-]+/g, '-').replace(/^-+|-+$/g, '') || 'file';
}

export function aimeasyFileExt(file) {
  return (file?.name?.split('.').pop() || '').toLowerCase();
}

export function aimeasyPreviewableNoteUrl(link) {
  return String(link || '').trim();
}

export async function aimeasyUploadContentFile(file, target, unitId) {
  const supabase = window.__AIMEASY_SUPABASE__;
  if (!supabase?.storage) {
    return { url: '', error: new Error('Supabase Storage is not configured') };
  }
  const ext = aimeasyFileExt(file) || 'pdf';
  const safeName = aimeasySafePathPart(file.name || `upload.${ext}`);
  const folder = target === 'notes' ? 'notes' : target;
  const path = `${folder}/unit-${unitId}/${Date.now()}-${safeName}`;
  const upload = await supabase.storage
    .from(AIMEASY_CONTENT_BUCKET)
    .upload(path, file, {
      cacheControl: '3600',
      contentType: file.type || (ext === 'pdf' ? 'application/pdf' : 'application/octet-stream'),
      upsert: false,
    });
  if (upload.error) return { url: '', error: upload.error };
  const publicUrl = supabase.storage.from(AIMEASY_CONTENT_BUCKET).getPublicUrl(path)?.data?.publicUrl || '';
  return { url: publicUrl, path, error: null };
}

export async function v10UploadNoteWaitForPersistentFile(subjectName, unitId) {
  const inputId = `v10-nlink-${unitId}`;
  const pending = window.__aimeasyPendingUploads?.[inputId];
  if (pending) {
    showToast('Finishing file upload before saving...', 'blue');
    await pending;
  }
  return v10UploadNoteBeforePersistentFiles(subjectName, unitId);
}

export function previewNoteInlinePersistent(link, title) {
  const cleanLink = aimeasyPreviewableNoteUrl(link);
  if (!cleanLink) {
    showToast('No preview available for this note', 'amber');
    return;
  }
  recordStudyActivity('note_read', {
    subjectId: APP.currentSubject?.id || '',
    subjectName: APP.currentSubject?.name || '',
    unitId: APP.currentUnit || '',
    title: title || 'Note'
  });
  const modal = document.getElementById('note-preview-modal');
  const bodyEl = document.getElementById('note-preview-body');
  const titleEl = document.getElementById('note-preview-title');
  const dlBtn = document.getElementById('note-download-btn');
  if (!modal || !bodyEl) return;
  if (titleEl) titleEl.textContent = title || 'Note Preview';
  if (dlBtn) dlBtn.onclick = function () { downloadNote(cleanLink, title); };

  let embedUrl = cleanLink;
  if (cleanLink.includes('drive.google.com')) {
    const fileIdMatch = cleanLink.match(/\/d\/([a-zA-Z0-9_-]+)/);
    embedUrl = fileIdMatch
      ? `https://drive.google.com/file/d/${fileIdMatch[1]}/preview`
      : cleanLink.replace('/view', '/preview').replace('?usp=sharing', '');
  }
  const isPdf = /\.pdf($|[?#])/i.test(cleanLink) || cleanLink.includes('/storage/v1/object/public/') || cleanLink.startsWith('blob:') || cleanLink.startsWith('data:application/pdf');
  const suffix = isPdf && !cleanLink.startsWith('data:') ? '#toolbar=0&navpanes=0&scrollbar=1' : '';
  bodyEl.innerHTML = `<iframe src="${v10EscapeAttr(embedUrl + suffix)}" allow="autoplay"></iframe>`;
  modal.classList.add('open');
  document.body.style.overflow = 'hidden';
}

export function downloadNotePersistent(link, title) {
  const cleanLink = aimeasyPreviewableNoteUrl(link);
  if (!cleanLink) {
    showToast('No download available', 'amber');
    return;
  }
  const fileIdMatch = cleanLink.match(/\/d\/([a-zA-Z0-9_-]+)/);
  const href = fileIdMatch ? `https://drive.google.com/uc?export=download&id=${fileIdMatch[1]}` : cleanLink;
  const a = document.createElement('a');
  a.href = href;
  a.download = title || window.__aimeasyLocalFilePreviews[cleanLink]?.name || 'note';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  showToast('Downloading...', 'green');
}

export const CURRICULUM_STATUS = ['Draft', 'In Progress', 'Completed', 'Sent To SubAdmin', 'Published', 'Returned'];

function aimReadJson(key, fallback = []) {
  try { return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback)); } catch { return fallback; }
}

export function aimWriteJson(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

export function aimStatusBadge(status) {
  const value = status || 'Draft';
  const colors = {
    Draft: 'badge-amber',
    'In Progress': 'badge-primary',
    Completed: 'badge-green',
    'Sent To SubAdmin': 'badge-lavender',
    Published: 'badge-green',
    Returned: 'badge-amber',
  };
  return `<span class="badge ${colors[value] || 'badge-primary'}">${v10Html(value)}</span>`;
}

export function aimLocalCurriculums() {
  return aimReadJson('aimeasy_curriculums', []);
}

export function aimSaveLocalCurriculum(curriculum) {
  const rows = aimLocalCurriculums();
  const index = rows.findIndex(item => String(item.id) === String(curriculum.id));
  if (index >= 0) rows[index] = curriculum;
  else rows.unshift(curriculum);
  aimWriteJson('aimeasy_curriculums', rows);
}

export async function aimLoadCurriculums() {
  const remote = await window.aimeasyListCurriculums?.();
  if (!remote?.error && Array.isArray(remote?.data)) {
    const mapped = remote.data.map(row => ({
      id: row.id,
      subjectName: row.subject_name,
      subjectCode: row.subject_code,
      branch: row.branch,
      regulationCode: row.regulation_code,
      semester: row.semester,
      universityName: row.university_name,
      status: row.status || 'Draft',
      units: (row.curriculum_units || []).sort((a, b) => Number(a.display_order || 0) - Number(b.display_order || 0)).map(unit => ({
        id: unit.id,
        unitName: unit.unit_name,
        status: unit.status || row.status || 'Draft',
        topics: (unit.curriculum_topics || []).sort((a, b) => Number(a.display_order || 0) - Number(b.display_order || 0)).map(topic => ({
          id: topic.id,
          topicName: topic.topic_name,
        })),
      })),
    }));
    aimWriteJson('aimeasy_curriculums', mapped);
    return mapped;
  }
  return aimLocalCurriculums();
}

export function aimCurriculumForm(unitIndex = 0) {
  return `<div class="card" style="margin-bottom:1rem;">
    <h3 style="font-size:1rem;margin-bottom:1rem;">Create Curriculum</h3>
    <div class="v10-2col">
      <div class="input-group"><label>Subject</label><input class="input" id="aim-cur-subject" placeholder="Subject name"></div>
      <div class="input-group"><label>Subject Code</label><input class="input" id="aim-cur-code" placeholder="Optional"></div>
    </div>
    <div class="v10-2col">
      <div class="input-group"><label>Unit</label><input class="input" id="aim-cur-unit" placeholder="Unit name"></div>
      <div class="input-group"><label>Topic Name</label><input class="input" id="aim-cur-topic" placeholder="Topic name"></div>
    </div>
    <button class="btn btn-primary" onclick="aimCreateCurriculumBlueprint()">Save Curriculum</button>
  </div>`;
}

export async function aimCreateCurriculumBlueprintaimCreateCurriculumBlueprint() {
  const subjectName = document.getElementById('aim-cur-subject')?.value.trim();
  const subjectCode = document.getElementById('aim-cur-code')?.value.trim();
  const unitName = document.getElementById('aim-cur-unit')?.value.trim();
  const topicName = document.getElementById('aim-cur-topic')?.value.trim();
  if (!subjectName || !unitName || !topicName) {
    showToast('Enter subject, unit, and topic name.', 'red');
    return;
  }
  const payload = { subjectName, subjectCode, units: [{ unitName, topics: [{ topicName }] }] };
  const saved = await window.aimeasyCreateCurriculumBlueprint?.(payload);
  if (saved?.error) console.warn('[CURRICULUM] DB save failed; using local fallback', saved.error);
  const local = {
    id: saved?.data?.curriculum?.id || `local-${Date.now()}`,
    subjectName,
    subjectCode,
    status: 'Draft',
    units: [{
      id: saved?.data?.units?.[0]?.id || `local-unit-${Date.now()}`,
      unitName,
      status: 'Draft',
      topics: [{ id: saved?.data?.topics?.[0]?.id || `local-topic-${Date.now()}`, topicName }],
    }],
  };
  aimSaveLocalCurriculum(local);
  showToast('Curriculum saved as Draft.', 'green');
  renderSubAdminCurriculum();
}

export async function aimReviewCurriculumaimReviewCurriculum(id, status) {
  const rows = aimLocalCurriculums();
  const cur = rows.find(item => String(item.id) === String(id));
  if (cur) {
    cur.status = status;
    (cur.units || []).forEach(unit => { unit.status = status; });
    aimWriteJson('aimeasy_curriculums', rows);
  }
  await window.aimeasyUpdateCurriculumStatus?.({ curriculumId: id, status });
  showToast(`Curriculum ${status}.`, status === 'Published' ? 'green' : 'amber');
  renderSubAdminCurriculum();
}

export function switchSASectionCurriculum(section) {
  if (section === 'curriculum') {
    closeSASidebar?.();
    document.querySelectorAll('[id^="sa-nav-"]').forEach(el => el.classList.remove('active'));
    document.getElementById('sa-nav-curriculum')?.classList.add('active');
    const titleEl = document.getElementById('sa-topbar-title');
    if (titleEl) titleEl.textContent = 'Curriculum';
    renderSubAdminCurriculum();
    return;
  }
  return aimOriginalSwitchSASection?.(section);
}

export async function aimCreatorDashboardCounts() {
  const remote = await window.aimeasyFetchWorkflowDashboardCounts?.();
  if (!remote?.error && remote?.data) return remote.data;
  const curriculums = aimLocalCurriculums();
  const units = curriculums.flatMap(cur => cur.units || []);
  return {
    assignedUnits: units.length,
    completedUnits: units.filter(unit => ['Completed', 'Sent To SubAdmin', 'Published'].includes(unit.status)).length,
    pendingUnits: units.filter(unit => ['Draft', 'In Progress', 'Returned'].includes(unit.status || 'Draft')).length,
  };
}

export async function renderCRDashboardrenderCRDashboardWorkflow() {
  const content = document.getElementById('cr-content');
  if (!content) return;
  const counts = await aimCreatorDashboardCounts();
  content.innerHTML = `<div style="padding:2rem;max-width:1100px;margin:0 auto;width:100%;">
    <h2 style="font-size:1.35rem;font-weight:800;margin-bottom:.4rem;">Creator Dashboard</h2>
    <p style="font-size:.84rem;color:var(--text2);margin-bottom:1.4rem;">Live curriculum workflow metrics.</p>
    <div class="admin-grid">
      ${[['Assigned Units', counts.assignedUnits, 'var(--primary)'], ['Completed Units', counts.completedUnits, 'var(--green)'], ['Pending Units', counts.pendingUnits, 'var(--amber)']].map(([label, value, color]) => `
      <div class="admin-stat-card"><div class="admin-stat-accent" style="background:${color};"></div><div style="font-size:2.1rem;font-weight:800;color:${color};">${value}</div><div style="font-size:.84rem;font-weight:600;">${label}</div></div>`).join('')}
    </div>
    <div class="card" style="margin-top:1rem;"><button class="btn btn-primary" onclick="switchCRSection('addcontent')">Open Assigned Curriculum</button></div>
  </div>`;
}

export async function renderCRAddContentrenderCRAddContentWorkflow() {
  const content = document.getElementById('cr-content');
  if (!content) return;
  const curriculums = await aimLoadCurriculums();
  const selectedId = window._crSelectedCurriculumId || curriculums[0]?.id;
  const cur = curriculums.find(item => String(item.id) === String(selectedId));
  window._crSelectedCurriculumId = selectedId;
  if (!cur) {
    content.innerHTML = `<div style="padding:2rem;color:var(--text3);">No curriculum assigned yet.</div>`;
    return;
  }
  const selectedUnitId = window._crSelectedUnit || cur.units?.[0]?.id;
  const unit = (cur.units || []).find(item => String(item.id) === String(selectedUnitId)) || cur.units?.[0];
  window._crSelectedUnit = unit?.id;
  const rows = aimReadJson('aimeasy_curriculum_content', []).filter(item => String(item.curriculumId) === String(cur.id) && String(item.unitId) === String(unit?.id));
  const hasRequired = ['video', 'note', 'pyq', 'iq'].every(type => rows.some(item => item.contentType === type));
  content.innerHTML = `<div style="padding:2rem;max-width:1100px;margin:0 auto;width:100%;">
    <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:12px;margin-bottom:1rem;">
      <div><h2 style="font-size:1.3rem;font-weight:800;">${v10Html(cur.subjectName)}</h2>
      <p style="font-size:.82rem;color:var(--text2);">Creator content workspace · ${aimStatusBadge(unit?.status || cur.status)}</p></div>
      <button class="btn btn-primary btn-sm" ${hasRequired ? '' : 'disabled'} onclick="aimSendCurriculumForReview('${cur.id}','${unit?.id || ''}')">Send For Review</button>
    </div>
    <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:1rem;">${curriculums.map(item => `<button class="btn ${String(item.id) === String(cur.id) ? 'btn-primary' : 'btn-ghost'} btn-sm" onclick="window._crSelectedCurriculumId='${item.id}';window._crSelectedUnit=null;renderCRAddContent()">${v10Html(item.subjectName)}</button>`).join('')}</div>
    <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:1rem;">${(cur.units || []).map(item => `<button class="btn ${String(item.id) === String(unit?.id) ? 'btn-teal' : 'btn-ghost'} btn-sm" onclick="window._crSelectedUnit='${item.id}';renderCRAddContent()">${v10Html(item.unitName)} ${aimStatusBadge(item.status)}</button>`).join('')}</div>
    <div class="card" style="margin-bottom:1rem;"><div style="font-weight:700;margin-bottom:8px;">Topics</div>${(unit?.topics || []).map(topic => `<span class="tag">${v10Html(topic.topicName)}</span>`).join(' ')}</div>
    <div class="card">
      <div class="v10-2col">
        <input class="input" id="aim-cc-title" placeholder="Title">
        <select class="select" id="aim-cc-type"><option value="video">Video</option><option value="note">Note</option><option value="pyq">PYQ</option><option value="iq">Important Question</option><option value="other">Other</option></select>
      </div>
      <input class="input" id="aim-cc-url" placeholder="URL" style="margin-top:8px;">
      <textarea class="input" id="aim-cc-desc" rows="3" placeholder="Description / Question" style="margin-top:8px;resize:vertical;"></textarea>
      <button class="btn btn-teal" style="margin-top:8px;" onclick="aimSaveCreatorCurriculumContent('${cur.id}','${unit?.id || ''}')">Save Content</button>
    </div>
    <div class="v10-items" style="margin-top:1rem;"><div class="v10-items-head">Saved Content (${rows.length})</div>
      ${rows.map(item => `<div class="v10-item"><div class="v10-item-body"><div class="v10-item-title">${v10Html(item.title)} ${aimStatusBadge(item.contentType)}</div><div class="v10-item-meta">${v10Html(item.url || item.description || '')}</div></div></div>`).join('') || '<p style="padding:1rem;color:var(--text3);">Add one Video, Note, PYQ, and Important Question to enable Send For Review.</p>'}
    </div>
  </div>`;
}

export async function aimSaveCreatorCurriculumContentaimSaveCreatorCurriculumContent(curriculumId, unitId) {
  const title = document.getElementById('aim-cc-title')?.value.trim();
  const contentType = document.getElementById('aim-cc-type')?.value;
  const url = document.getElementById('aim-cc-url')?.value.trim();
  const description = document.getElementById('aim-cc-desc')?.value.trim();
  if (!title && !description && !url) {
    showToast('Enter content details.', 'red');
    return;
  }
  const item = { id: `local-content-${Date.now()}`, curriculumId, unitId, contentType, title: title || contentType, url, description, createdAt: new Date().toISOString() };
  const rows = aimReadJson('aimeasy_curriculum_content', []);
  rows.unshift(item);
  aimWriteJson('aimeasy_curriculum_content', rows);
  await window.aimeasySaveCurriculumContent?.({ curriculumId, unitId, contentType, title: item.title, url, description, body: description });
  const curriculums = aimLocalCurriculums();
  const cur = curriculums.find(row => String(row.id) === String(curriculumId));
  const unit = cur?.units?.find(row => String(row.id) === String(unitId));
  if (unit && unit.status === 'Draft') unit.status = 'In Progress';
  if (cur && cur.status === 'Draft') cur.status = 'In Progress';
  aimWriteJson('aimeasy_curriculums', curriculums);
  showToast('Content saved. You stayed on this unit.', 'green');
  renderCRAddContent();
}

export async function aimSendCurriculumForReviewaimSendCurriculumForReview(curriculumId, unitId) {
  const curriculums = aimLocalCurriculums();
  const cur = curriculums.find(row => String(row.id) === String(curriculumId));
  const unit = cur?.units?.find(row => String(row.id) === String(unitId));
  if (unit) unit.status = 'Sent To SubAdmin';
  if (cur) cur.status = 'Sent To SubAdmin';
  aimWriteJson('aimeasy_curriculums', curriculums);
  await window.aimeasyUpdateCurriculumStatus?.({ curriculumId, unitId, status: 'Sent To SubAdmin' });
  showToast('Sent to SubAdmin for review.', 'green');
  renderCRAddContent();
}

export function installAiiensProductionExperiencePatch() {
  if (window.__aiiensProductionExperiencePatchInstalled) return;
  window.__aiiensProductionExperiencePatchInstalled = true;

  const read = (key, fallback = []) => {
    try { return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback)); } catch { return fallback; }
  };
  const write = (key, value) => localStorage.setItem(key, JSON.stringify(value));
  const esc = (value) => String(value ?? '').replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
  const js = (value) => String(value ?? '').replace(/\\/g, '\\\\').replace(/'/g, "\\'");
  const activeScreen = () => document.querySelector('.screen.active')?.id || '';
  const isValidUrl = (value) => {
    try {
      const parsed = new URL(String(value || ''));
      return parsed.protocol === 'http:' || parsed.protocol === 'https:';
    } catch {
      return false;
    }
  };
  const externalIcon = '<span class="external-link-icon" aria-hidden="true">↗</span>';
  const actionIcon = {
    edit: '<span aria-hidden="true">✎</span>',
    delete: '<span aria-hidden="true">×</span>'
  };
  const currentStudentKey = () => {
    const user = APP.user || read('edusync_session_user', {});
    return String(user.id || user.googleId || user.email || user.phone || user.name || 'anonymous').replace(/[^a-z0-9_.@-]+/gi, '_');
  };
  const studentRecentKey = () => `edusync_recently_opened:${currentStudentKey()}`;
  const allSubjectUnits = (subject) => read('edusync_units_' + (subject.rawId || String(subject.id || '').replace('custom_', '')), []);
  const sameText = (a, b) => !a || !b || String(a).toLowerCase() === String(b).toLowerCase();
  const routePush = (path) => {
    const hash = `#${path}`;
    if (window.location.hash !== hash) {
      const nextIndex = (window.history.state?.aimeasyIndex ?? 0) + 1;
      window.history.pushState({ aimeasyPath: path, aimeasyIndex: nextIndex }, '', hash);
    }
  };

  const ADMIN_ROUTE_TO_SECTION = { manage: 'create', management: 'create', 'create-management': 'create', 'create-manage': 'create', 'url-approvals': 'approvals', urls: 'approvals' };
  const ADMIN_SECTION_TO_ROUTE = { create: 'create-manage', dashboard: 'dashboard', subjects: 'subjects', approvals: 'url-approvals', creatorview: 'creatorview', skillup: 'skillup', notifications: 'notifications' };
  const SA_ROUTE_TO_SECTION = { 'create-subject': 'subjects', content: 'view', 'manage-content': 'view', approvals: 'urls', 'url-approvals': 'urls' };
  const SA_SECTION_TO_ROUTE = { dashboard: 'dashboard', subjects: 'create-subject', view: 'manage-content', curriculum: 'curriculum', skillup: 'skillup', urls: 'url-approvals' };
  const normalizeAdminSection = (section) => ADMIN_ROUTE_TO_SECTION[section] || section || 'dashboard';
  const normalizeSASection = (section) => SA_ROUTE_TO_SECTION[section] || section || 'dashboard';
  const adminRouteFor = (section) => ADMIN_SECTION_TO_ROUTE[section] || section || 'dashboard';
  const saRouteFor = (section) => SA_SECTION_TO_ROUTE[section] || section || 'dashboard';

  window.aiiensNormalizeAdminRoute = function aiiensNormalizeAdminRoute(path) {
    const parts = String(path || '').split('/').filter(Boolean);
    if (parts[0] === 'admin' && parts[1]) return '/admin/' + adminRouteFor(normalizeAdminSection(parts[1]));
    if (parts[0] === 'subadmin' && parts[1]) return '/subadmin/' + saRouteFor(normalizeSASection(parts[1]));
    return path;
  };

  function refreshActiveAdminSurfaces() {
    const screen = activeScreen();
    if (screen === 'screen-subadmin') {
      const section = document.querySelector('#screen-subadmin .admin-nav-item.active')?.id?.replace('sa-nav-', '') || 'dashboard';
      if (section === 'dashboard') renderSubAdminDashboardProduction();
      if (section === 'subjects' && typeof v10SASubjects === 'function') v10SASubjects();
      if (section === 'view' && typeof renderSASection === 'function') renderSASection('view');
    }
    if (screen === 'screen-admin') {
      const section = document.querySelector('#screen-admin .admin-nav-item.active')?.id?.replace('admin-nav-', '') || 'dashboard';
      if (section === 'dashboard') renderAdminDashboardProduction();
      if (section === 'create') renderAdminCreateManageProduction();
      if (section === 'subjects' && typeof v10AdminSubjects === 'function') v10AdminSubjects();
      if (section === 'approvals') renderApprovalLinksProduction('admin');
    }
    if (screen === 'screen-app') updateStudentDashboardMetrics?.();
  }
  window.aiiensRefreshActiveAdminSurfaces = refreshActiveAdminSurfaces;

  addToRecentlyOpened = function addToRecentlyOpenedPerStudent(name, code, icon, id) {
    const subjects = getStudentAssignedSubjects?.() || [];
    const user = APP.user || {};
    const allowed = subjects.find(subject =>
      (String(subject.id) === String(id) || String(subject.rawId) === String(id) || subject.name === name) &&
      sameText(subject.branch, user.branch || user.branch_name) &&
      sameText(subject.reg || subject.regulation, user.regulation || user.regulation_code || user.reg) &&
      sameText(subject.sem || subject.semester, user.semester || user.sem)
    );
    if (!allowed) return;
    let list = read(studentRecentKey(), []);
    list = list.filter(item => item.id !== allowed.id && item.name !== allowed.name);
    list.unshift({
      id: allowed.id,
      name: allowed.name,
      code: allowed.code || code || 'Subject',
      icon: allowed.icon || icon || 'Book',
      openedAt: new Date().toISOString(),
      branch: allowed.branch || APP.user?.branch || '',
      reg: allowed.reg || APP.user?.regulation || '',
      sem: allowed.sem || APP.user?.semester || ''
    });
    write(studentRecentKey(), list.slice(0, 5));
  };

  const previousUpdateStudentDashboardMetrics = updateStudentDashboardMetrics;
  updateStudentDashboardMetrics = function updateStudentDashboardMetricsProduction() {
    previousUpdateStudentDashboardMetrics?.();
    const card = document.querySelector('#page-dashboard .streak-card');
    if (card) {
      const current = localStorage.getItem('edusync_streak') || '0';
      const best = localStorage.getItem('edusync_best_streak') || '0';
      const last = localStorage.getItem('edusync_last_active_date') || 'Never';
      card.innerHTML = `
        <div class="compact-streak-card">
          <div>
            <div class="compact-kicker">Current Streak</div>
            <div class="compact-streak-value">${esc(current)} days</div>
          </div>
          <div class="compact-streak-meta">
            <span>Best: <strong>${esc(best)}</strong></span>
            <span>Last active: <strong>${esc(last)}</strong></span>
          </div>
          <div class="streak-week">${weeklyStreakDots(current)}</div>
        </div>`;
    }
    const subjectsForStudent = getStudentAssignedSubjects?.() || [];
    const weekly = typeof weeklyDashboardStats === 'function'
      ? weeklyDashboardStats(subjectsForStudent)
      : { weeklyCompletion: 0, unitsCompleted: 0, subjectsActive: 0 };
    const weeklyEvents = read('edusync_study_activity', []).filter(event => {
      const at = new Date(event.at || event.openedAt || 0);
      return Number.isFinite(at.getTime()) && Date.now() - at.getTime() <= 7 * 24 * 60 * 60 * 1000;
    });
    const progressTracker = document.querySelector('#page-dashboard .progress-tracker');
    if (progressTracker) {
      progressTracker.innerHTML = `
        <div class="section-heading">Weekly Progress</div>
        <div class="weekly-summary compact-weekly-summary">
          <div><strong>${esc(weekly.weeklyCompletion)}%</strong><span>Weekly Completion</span></div>
          <div><strong>${esc(weekly.unitsCompleted)}</strong><span>Units Completed</span></div>
          <div><strong>${esc(weekly.subjectsActive)}</strong><span>Active Subjects</span></div>
          <div><strong>${esc(weeklyEvents.length)}</strong><span>Learning Sessions</span></div>
        </div>
        <div class="weekly-mini-progress"><span style="width:${Math.max(4, Math.min(100, Number(weekly.weeklyCompletion) || 0))}%"></span></div>
      `;
    }
    const recentListEl = document.getElementById('recently-opened-list');
    if (recentListEl) {
      const user = APP.user || {};
      const allowed = subjectsForStudent.filter(subject =>
        sameText(subject.branch, user.branch || user.branch_name) &&
        sameText(subject.reg || subject.regulation, user.regulation || user.reg) &&
        sameText(subject.sem || subject.semester, user.semester || user.sem)
      );
      const allowedIds = new Set(allowed.flatMap(subject => [String(subject.id), String(subject.rawId || '')]));
      const allowedNames = new Set(allowed.map(subject => subject.name));
      const list = read(studentRecentKey(), []).filter(item =>
        (allowedIds.has(String(item.id)) || allowedNames.has(item.name)) &&
        sameText(item.branch, user.branch || user.branch_name) &&
        sameText(item.reg || item.regulation, user.regulation || user.reg) &&
        sameText(item.sem || item.semester, user.semester || user.sem)
      ).slice(0, 5);
      recentListEl.innerHTML = list.length
        ? list.map(item => `
          <div class="recent-item">
            <div class="recent-info">
              <div class="recent-title">${esc(item.name)}</div>
              <div class="recent-sub">${esc(formatRecentTime(item.openedAt))}</div>
            </div>
            <button class="btn btn-primary btn-sm" onclick="openSubjectFromRecent('${js(item.id)}')">Continue</button>
          </div>`).join('')
        : '<div class="empty-state-card">No subjects opened yet.</div>';
    }
    const achievementsEl = document.getElementById('achievements-list');
    if (achievementsEl && typeof achievementList === 'function') {
      achievementsEl.innerHTML = achievementList(subjectsForStudent).map(item => `
        <div class="achievement-card ${item.earned ? 'earned' : 'locked'}">
          <div class="achievement-icon">${item.earned ? item.icon : 'Lock'}</div>
          <div>${esc(item.label)}</div>
          <div class="achievement-progress"><span style="width:${item.earned ? 100 : 35}%"></span></div>
        </div>
      `).join('');
    }
  };

  function subjectScope() {
    const sa = APP.subAdminData || {};
    return read('edusync_custom_subjects', []).filter(subject =>
      (!sa.branch || subject.branch === sa.branch) &&
      (!sa.regulation && !sa.reg || !sa.regulation || subject.reg === sa.regulation)
    );
  }

  function productionCards(items) {
    return items.map(([label, value, color, sub, trend = '']) => `
      <div class="admin-stat-card production-kpi">
        <div class="admin-stat-accent" style="background:${color};"></div>
        <div class="kpi-head">
          <span>${esc(label)}</span>
          ${trend ? `<em style="color:${color};">${esc(trend)}</em>` : ''}
        </div>
        <div class="kpi-value" style="color:${color};">${esc(value)}</div>
        <div class="kpi-sub">${esc(sub || '')}</div>
      </div>`).join('');
  }

  function cachedRegulations() {
    const fromCache = read('aimeasy_cached_regulations', []);
    const fromLegacy = read('edusync_regulations', []);
    const fromSubjects = read('edusync_custom_subjects', []).map(subject => subject.reg || subject.regulation);
    return [...new Set([...fromCache, ...fromLegacy, ...fromSubjects]
      .map(item => String(item?.regulation_name || item?.regulation_code || item?.name || item || '').trim().toUpperCase())
      .filter(Boolean))];
  }

  const defaultUniversities = [
    { name: 'JNTUK', code: 'JNTUK', state: 'Andhra Pradesh', status: 'Active' },
    { name: 'JNTUH', code: 'JNTUH', state: 'Telangana', status: 'Active' },
    { name: 'Andhra University', code: 'AU', state: 'Andhra Pradesh', status: 'Active' },
  ];
  const defaultUniversityKeys = new Set(defaultUniversities.map((row) => row.name.toLowerCase()));

  function managedUniversities() {
    const seen = new Set();
    const deletedDefaults = new Set(read('edusync_deleted_universities', []).map((name) => String(name || '').toLowerCase()));
    return [...defaultUniversities, ...read('edusync_universities', [])]
      .map((row) => ({
        name: String(row?.name || row?.university_name || row?.university || row?.code || row || '').trim(),
        code: String(row?.code || row?.university_code || row?.name || row || '').trim(),
        state: String(row?.state || '').trim(),
        status: String(row?.status || 'Active').trim() || 'Active',
        id: row?.id,
        updatedAt: row?.updatedAt,
      }))
      .filter((row) => {
        const status = row.status.toLowerCase();
        const key = row.name.toLowerCase();
        return row.name && status !== 'inactive' && status !== 'deleted' && !deletedDefaults.has(key);
      })
      .filter((row) => {
        const key = row.name.toLowerCase();
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
  }

  function saveManagedUniversities(rows) {
    const normalized = managedUniversitiesFrom(rows);
    const presentDefaultKeys = new Set(normalized.map((row) => row.name.toLowerCase()).filter((key) => defaultUniversityKeys.has(key)));
    write('edusync_deleted_universities', [...defaultUniversityKeys].filter((key) => !presentDefaultKeys.has(key)));
    write('edusync_universities', normalized);
    window.dispatchEvent(new CustomEvent('edusync:data-sync', { detail: { key: 'edusync_universities' } }));
  }

  function managedUniversitiesFrom(rows) {
    const seen = new Set();
    return (rows || [])
      .map((row) => ({
        name: String(row?.name || row?.university_name || row?.university || row?.code || row || '').trim(),
        code: String(row?.code || row?.university_code || row?.name || row || '').trim(),
        state: String(row?.state || '').trim(),
        status: String(row?.status || 'Active').trim() || 'Active',
        id: row?.id,
        updatedAt: row?.updatedAt,
      }))
      .filter((row) => row.name)
      .filter((row) => {
        const key = row.name.toLowerCase();
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
  }

  function featureSlug(value) {
    return String(value || '').trim().toLowerCase().replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  }

  function featureRows() {
    const defaults = ['Videos', 'Notes', 'PYQs', 'Important Questions'];
    const stored = read('edusync_features', []);
    const disabled = new Set(read('edusync_disabled_features', []).map(featureSlug));
    const seen = new Set();
    return [...defaults, ...(Array.isArray(stored) ? stored : [])]
      .map(item => String(item || '').trim())
      .filter(Boolean)
      .filter(item => {
        const key = featureSlug(item);
        if (!key || seen.has(key) || disabled.has(key)) return false;
        seen.add(key);
        return true;
      });
  }

  function saveFeatureRows(rows) {
    const defaults = new Set(['videos', 'notes', 'pyqs', 'important-questions']);
    const custom = rows.filter(item => !defaults.has(featureSlug(item)));
    write('edusync_features', custom);
    window.dispatchEvent(new CustomEvent('edusync:data-sync', { detail: { key: 'edusync_features' } }));
  }

  function renderFeatureList() {
    const list = document.getElementById('admin-feature-list');
    if (!list) return;
    const rows = featureRows();
    list.innerHTML = rows.map((feature, index) => {
      const isCore = ['videos', 'notes', 'pyqs', 'important-questions'].includes(featureSlug(feature));
      return `<div class="v10-item management-record feature-row">
        <div class="record-icon">${esc(feature.charAt(0).toUpperCase())}</div>
        <div class="v10-item-body">
          <div class="v10-item-title">${esc(feature)}</div>
          <div class="v10-item-meta">${isCore ? 'Core learning module' : 'Custom module'}</div>
        </div>
        <span class="badge badge-green">${isCore ? 'Core' : 'Live'}</span>
        <button class="icon-action-btn" onclick="adminEditFeature(${index})" title="Edit feature" aria-label="Edit ${esc(feature)}">${actionIcon.edit}</button>
        <button class="icon-action-btn danger" onclick="adminDeleteFeature(${index})"${isCore ? ' title="Core features stay available for existing content"' : ' title="Delete feature"'} aria-label="Delete ${esc(feature)}">${actionIcon.delete}</button>
      </div>`;
    }).join('');
  }

  function featureManagerPanel() {
    return `<div class="card manage-panel card-soft-lavender">
      <div class="manage-panel-head">
        <div><h3>Feature Management</h3><span>${esc(featureRows().length)} live modules</span></div>
      </div>
      <div class="regulation-create-row">
        <input class="input" id="adm-feature-name" placeholder="New feature name">
        <button class="btn btn-primary btn-sm" onclick="adminAddFeature()">Add</button>
      </div>
      <div id="admin-feature-list" class="v10-items manage-list"></div>
    </div>`;
  }

  function regulationManagerPanel(regulations = cachedRegulations()) {
    return `<div class="card manage-panel regulation-panel card-soft-mint" id="aimeasy-regulation-manager">
      <div class="manage-panel-head">
        <div><h3>Regulation Management</h3><span>Academic regulation options</span></div>
      </div>
      <p class="manage-helper">Created regulations are shown to Sub Admin, Creator, and Student filters.</p>
      <div class="regulation-create-row">
        <input class="input" id="aimeasy-reg-name" placeholder="e.g. R24">
        <button class="btn btn-primary btn-sm" onclick="aimeasyAddRegulation()">Add</button>
      </div>
      <div id="aimeasy-regulation-list" class="v10-items manage-list regulation-list">
        ${regulations.length ? regulations.map((reg, index) => `
          <div class="v10-item regulation-row">
            <div class="v10-item-body"><div class="v10-item-title">${esc(reg)}</div></div>
            <span class="badge badge-green">Live</span>
            <button class="icon-action-btn" onclick="aimeasyEditRegulation(${index})" title="Edit regulation" aria-label="Edit ${esc(reg)} regulation">${actionIcon.edit}</button>
            <button class="icon-action-btn danger" onclick="aimeasyDeleteRegulation(${index})" title="Delete regulation" aria-label="Delete ${esc(reg)} regulation">${actionIcon.delete}</button>
          </div>`).join('') : '<div class="empty-state-card">No regulations created yet.</div>'}
      </div>
    </div>`;
  }

  function universityPanel(universities = managedUniversities()) {
    return `<div class="card manage-panel card-soft-amber">
      <div class="manage-panel-head"><div><h3>University Management</h3><span>${esc(universities.length)} configured</span></div></div>
      <div class="v10-2col">
        <input class="input" id="uni-name" placeholder="University Name">
        <input class="input" id="uni-code" placeholder="Code">
      </div>
      <div class="v10-2col" style="margin-top:8px;">
        <input class="input" id="uni-state" placeholder="State">
        <select class="select" id="uni-status"><option>Active</option><option>Inactive</option></select>
      </div>
      <button class="btn btn-primary btn-sm" style="margin-top:8px;" onclick="aiiensSaveUniversity()">Save University</button>
      <div class="university-filter-box">
        <input class="input" id="uni-search" placeholder="Search by university name" oninput="aiiensRenderUniversities()">
        <input class="input" id="uni-state-filter" placeholder="Filter by state" oninput="aiiensRenderUniversities()">
        <select class="select" id="uni-status-filter" onchange="aiiensRenderUniversities()">
          <option value="">All statuses</option>
          <option>Active</option>
          <option>Inactive</option>
        </select>
      </div>
      <div id="university-list" class="v10-items manage-list"></div>
    </div>`;
  }

  function barRows(rows) {
    const max = Math.max(1, ...rows.map(row => Number(row[1]) || 0));
    return rows.map(([label, value]) => `
      <div class="analytics-row">
        <span>${esc(label)}</span>
        <div><i style="width:${Math.max(6, Math.round((Number(value) || 0) / max * 100))}%"></i></div>
        <strong>${esc(value)}</strong>
      </div>`).join('');
  }

  function analyticsChart(title, rows, caption = '') {
    const total = rows.reduce((sum, row) => sum + (Number(row[1]) || 0), 0);
    return `<div class="card analytics-card production-chart">
      <div class="analytics-card-head">
        <div><h3>${esc(title)}</h3>${caption ? `<p>${esc(caption)}</p>` : ''}</div>
        <strong>${esc(total)}</strong>
      </div>
      <div class="analytics-chart">${barRows(rows)}</div>
    </div>`;
  }

  function engagementKpis(items) {
    return `<div class="card analytics-card production-activity">
      <div class="analytics-card-head"><div><h3>Student Engagement</h3><p>Learning signals across the platform</p></div></div>
      <div class="engagement-kpis">${items.map(([label, value, tone]) => `
        <div class="engagement-kpi ${tone || ''}">
          <strong>${esc(value)}</strong>
          <span>${esc(label)}</span>
        </div>`).join('')}</div>
    </div>`;
  }

  function weeklyStreakDots(current) {
    const active = Math.min(7, Number(current) || 0);
    return Array.from({ length: 7 }, (_, index) => `<span class="${index < active ? 'active' : ''}"></span>`).join('');
  }

  async function renderSubAdminDashboardProduction() {
    const content = document.getElementById('sa-content');
    if (!content) return;
    if (typeof window.aimeasyFetchCurriculumStats === 'function') {
      const { data, error } = await window.aimeasyFetchCurriculumStats();
      if (!error && data) {
        content.innerHTML = `
      <div class="admin-dashboard-wrap">
        <div style="margin-bottom:1.4rem;">
          <h2 style="font-size:1.35rem;font-weight:800;margin-bottom:4px;">Sub Admin Dashboard</h2>
          <p style="font-size:0.84rem;color:var(--text3);">Live curriculum metrics from Supabase.</p>
        </div>
        <div class="admin-grid production-kpi-grid" style="margin-bottom:1.4rem;">
          ${productionCards([
      ['Total Subjects', data.subjects, 'var(--primary)', 'Database subjects'],
      ['Total Units', data.units, 'var(--teal)', 'Database units'],
      ['Total Topics', data.topics, 'var(--lavender)', 'Roadmap topics'],
      ['Total Videos', data.videos, 'var(--blue)', 'Roadmap and content videos'],
      ['Total Notes', data.notes, 'var(--amber)', 'Database notes'],
      ['Total PYQs', data.pyqs, 'var(--green)', 'Database PYQs']
    ])}
        </div>
      </div>`;
        return;
      }
    }
    const subjects = subjectScope();
    const subjectNames = new Set(subjects.map(subject => subject.name));
    const units = subjects.flatMap(subject => allSubjectUnits(subject).map(unit => ({ ...unit, subject })));
    const students = read('edusync_users', []).filter(user =>
      (!APP.subAdminData?.branch || user.branch === APP.subAdminData.branch || user.branch_name === APP.subAdminData.branch)
    );
    const contentRows = ['edusync_admin_videos', 'edusync_admin_notes', 'edusync_admin_pyqs', 'edusync_admin_iqs']
      .flatMap(key => read(key, []).filter(item => subjectNames.has(item.subject)));
    const activeSubjects = subjects.filter(subject => {
      const unitCount = allSubjectUnits(subject).length;
      return unitCount > 0 || contentRows.some(item => item.subject === subject.name);
    });
    const bySem = [...new Set(subjects.map(subject => subject.sem || 'Other'))].sort()
      .map(sem => [sem, subjects.filter(subject => (subject.sem || 'Other') === sem).length]);
    const contentActivity = [
      ['Videos', read('edusync_admin_videos', []).filter(item => subjectNames.has(item.subject)).length],
      ['Notes', read('edusync_admin_notes', []).filter(item => subjectNames.has(item.subject)).length],
      ['PYQs', read('edusync_admin_pyqs', []).filter(item => subjectNames.has(item.subject)).length],
      ['Important Qs', read('edusync_admin_iqs', []).filter(item => subjectNames.has(item.subject)).length]
    ];
    const activity = read('edusync_study_activity', []).filter(event => subjectNames.has(event.subjectName));
    content.innerHTML = `
      <div class="admin-dashboard-wrap">
        <div style="margin-bottom:1.4rem;">
          <h2 style="font-size:1.35rem;font-weight:800;margin-bottom:4px;">Sub Admin Dashboard</h2>
          <p style="font-size:0.84rem;color:var(--text3);">Educational analytics for ${esc(APP.subAdminData?.branch || 'assigned curriculum')}.</p>
        </div>
        <div class="admin-grid production-kpi-grid" style="margin-bottom:1.4rem;">
          ${productionCards([
      ['Total Subjects', subjects.length, 'var(--primary)', 'Assigned scope only'],
      ['Total Units', units.length, 'var(--teal)', 'Across created subjects'],
      ['Active Subjects', activeSubjects.length, 'var(--green)', 'With units or content']
    ])}
        </div>
      </div>`;
  }
  window.renderSubAdminDashboardLive = renderSubAdminDashboardProduction;

  async function renderAdminDashboardProduction() {
    const content = document.getElementById('admin-content');
    if (!content) return;
    if (typeof window.aimeasyFetchAdminDashboardStats === 'function') {
      const stats = await window.aimeasyFetchAdminDashboardStats();
      if (stats) {
        content.innerHTML = `
      <div class="admin-dashboard-wrap">
        <div class="admin-section-head">
          <div>
            <h2>Admin Dashboard</h2>
            <p>Supabase is the only source of truth.</p>
          </div>
        </div>
        <div class="admin-grid production-kpi-grid">
          ${productionCards([
      ['Total Students', stats.students, 'var(--primary)', 'Database student profiles'],
      ['Total Content Creators', stats.creators, 'var(--teal)', 'Sub Admin and creator profiles'],
      ['Total Subjects', stats.subjects, 'var(--lavender)', 'Database subjects'],
      ['Total Videos', stats.videos, 'var(--blue)', 'Roadmap and content videos'],
      ['Total Notes', stats.notes, 'var(--amber)', 'Database notes'],
      ['Total PYQs', stats.pyqs, 'var(--green)', 'Database PYQs']
    ])}
        </div>
      </div>`;
        return;
      }
    }
    const subjects = read('edusync_custom_subjects', []);
    const students = read('edusync_users', []);
    const subAdmins = read('edusync_subadmins', []);
    const universities = managedUniversities();
    const regulations = cachedRegulations();
    content.innerHTML = `
      <div class="admin-dashboard-wrap">
        <div class="admin-section-head">
          <div>
            <h2>Admin Dashboard</h2>
            <p>Supabase is the only source of truth.</p>
          </div>
        </div>
        <div class="admin-grid production-kpi-grid">
          ${productionCards([
      ['Total Students', students.length, 'var(--primary)', 'Real records only'],
      ['Total Sub Admins', subAdmins.length, 'var(--teal)', 'Real records only'],
      ['Total Subjects', subjects.length, 'var(--lavender)', 'Real records only'],
      ['Total Regulations', regulations.length, 'var(--amber)', 'Real records only'],
      ['Total Universities', universities.length, 'var(--green)', 'Real records only']
    ])}
        </div>
      </div>`;
  }

  function renderApprovalLinksProduction(owner = 'admin') {
    const content = document.getElementById(owner === 'admin' ? 'admin-content' : 'sa-content');
    if (!content) return;
    const requests = read('edusync_url_requests', []);
    content.innerHTML = `
      <div class="admin-dashboard-wrap">
        <h2 style="font-size:1.25rem;font-weight:800;margin-bottom:1rem;">URL Approvals</h2>
        <div class="v10-items">
          ${requests.length ? requests.map((request, index) => `
            <div class="v10-item">
              <div class="v10-item-body">
                <div class="v10-item-title">${esc(request.subject || 'Subject')} · Unit ${esc(request.unit || '-')}</div>
                <a href="${esc(request.url)}" target="_blank" rel="noopener noreferrer" class="approval-link">${esc(request.url)}</a>
                <div class="v10-item-meta">Submitted by ${esc(request.submittedBy || 'Student')} · ${esc(request.submittedAt || '')}</div>
              </div>
              <span class="badge ${request.status === 'approved' ? 'badge-green' : request.status === 'rejected' ? 'badge-red' : 'badge-amber'}">${esc(request.status || 'pending')}</span>
              ${request.status === 'pending' ? `<button class="btn btn-primary btn-sm" onclick="adminApproveUrl(${index})">Approve</button><button class="btn btn-ghost btn-sm" onclick="adminRejectUrl(${index})">Reject</button>` : ''}
            </div>`).join('') : '<p style="padding:1rem;color:var(--text3);">No URL requests yet.</p>'}
        </div>
      </div>`;
  }

  const oldAdminApproveUrl = window.adminApproveUrl || adminApproveUrl;
  adminApproveUrl = window.adminApproveUrl = function adminApproveUrlProduction(index) {
    const requests = read('edusync_url_requests', []);
    if (!requests[index]) return;
    requests[index] = { ...requests[index], status: 'approved', reviewedAt: new Date().toISOString() };
    write('edusync_url_requests', requests);
    window.dispatchEvent(new CustomEvent('edusync:data-sync', { detail: { key: 'edusync_url_requests' } }));
    renderApprovalLinksProduction(activeScreen() === 'screen-subadmin' ? 'subadmin' : 'admin');
    showToast('URL approved', 'green');
  };
  const oldAdminRejectUrl = window.adminRejectUrl || adminRejectUrl;
  adminRejectUrl = window.adminRejectUrl = function adminRejectUrlProduction(index) {
    const requests = read('edusync_url_requests', []);
    if (!requests[index]) return;
    requests[index] = { ...requests[index], status: 'rejected', reviewedAt: new Date().toISOString() };
    write('edusync_url_requests', requests);
    window.dispatchEvent(new CustomEvent('edusync:data-sync', { detail: { key: 'edusync_url_requests' } }));
    renderApprovalLinksProduction(activeScreen() === 'screen-subadmin' ? 'subadmin' : 'admin');
    showToast('URL rejected', 'red');
  };
  renderSAUrlRequests = function renderSAUrlRequestsProduction() {
    const list = document.getElementById('sa-url-list');
    if (!list) return;
    const requests = read('edusync_url_requests', []);
    list.innerHTML = requests.length ? requests.map((request, index) => `
      <div class="v10-item">
        <div class="v10-item-body">
          <a href="${esc(request.url)}" target="_blank" rel="noopener noreferrer" class="approval-link">${esc(request.url)}</a>
          <div class="v10-item-meta">${esc(request.subject)} · by ${esc(request.submittedBy)} · ${esc(request.submittedAt)}</div>
        </div>
        <span class="badge ${request.status === 'approved' ? 'badge-green' : request.status === 'rejected' ? 'badge-red' : 'badge-amber'}">${esc(request.status)}</span>
        ${request.status === 'pending' ? `<button class="btn btn-primary btn-sm" onclick="adminApproveUrl(${index});renderSAUrlRequests()">Approve</button><button class="btn btn-ghost btn-sm" onclick="adminRejectUrl(${index});renderSAUrlRequests()">Reject</button>` : ''}
      </div>`).join('') : '<div style="padding:1.5rem;text-align:center;color:var(--text3);">No URL requests yet</div>';
  };

  renderApprovalLinksProduction = async function renderApprovalLinksCardProduction(owner = 'admin') {
    const content = document.getElementById(owner === 'admin' ? 'admin-content' : 'sa-content');
    if (!content) return;
    const supabase = window.__AIMEASY_SUPABASE__;
    let requests = [];
    if (supabase) {
      const { data, error } = await supabase
        .from('student_url_suggestions')
        .select('id, title, url, description, status, created_at, student_id, subject_id, unit_id, topic_id, subjects(name), units(title, sort_order), topics(topic_name)')
        .order('created_at', { ascending: false });
      if (error) {
        console.warn('[SUGGESTIONS] Approval load failed:', error.message || error);
      } else {
        requests = data || [];
      }
    } else {
      requests = read('edusync_url_requests', []);
    }
    const pending = requests.filter(request => (request.status || 'pending') === 'pending').length;
    const approved = requests.filter(request => request.status === 'approved').length;
    const rejected = requests.filter(request => request.status === 'rejected').length;
    content.innerHTML = `
      <div class="admin-dashboard-wrap approval-workspace">
        <div class="admin-section-head approval-page-head">
          <div>
            <h2>URL Approvals</h2>
            <p>Review submitted learning links and keep the content library clean.</p>
          </div>
          <div class="approval-stat-cards" aria-label="URL approval statistics">
            <div class="approval-stat-card approved"><span>Approved URLs</span><strong>${esc(approved)}</strong></div>
            <div class="approval-stat-card rejected"><span>Rejected URLs</span><strong>${esc(rejected)}</strong></div>
          </div>
        </div>
        <div class="approval-summary-line"><span class="badge badge-amber">${esc(pending)} pending</span></div>
        <div class="approval-card-grid">
          ${requests.length ? requests.map((request, index) => {
      const status = request.status || 'pending';
      const url = String(request.url || '').trim();
      const valid = isValidUrl(url);
      const displayUrl = url || '-';
      const topic = request.topics?.topic_name || request.topic || request.subtopic || request.subtopicName || request.topicName || request.title || 'Not specified';
      const subjectName = request.subjects?.name || request.subject || 'Subject';
      const unitName = request.units?.title || request.unitName || ('Unit ' + (request.units?.sort_order || request.unit || '-'));
      const actionArg = request.id ? `'${esc(request.id)}'` : index;
      return `<div class="approval-card approval-${esc(status)}">
              <div class="approval-card-top">
                <div class="approval-card-title">
                  <span>Subject</span>
                  <h3>${esc(subjectName)}</h3>
                </div>
                <span class="badge ${status === 'approved' ? 'badge-green' : status === 'rejected' ? 'badge-red' : 'badge-amber'}">${esc(status)}</span>
              </div>
              <div class="approval-detail-grid">
                <div><span>Unit</span><strong>${esc(unitName)}</strong></div>
                <div><span>Topic</span><strong>${esc(topic)}</strong></div>
                <div><span>Student</span><strong>${esc(request.student_name || request.submittedBy || request.student_id || 'Student')}</strong></div>
                <div><span>Submitted Date</span><strong>${esc(request.created_at ? new Date(request.created_at).toLocaleString() : request.submittedAt || request.date || '-')}</strong></div>
              </div>
              <div class="approval-url-row ${valid ? '' : 'invalid'}">
                <span class="approval-url-label">URL</span>
                ${valid
          ? `<a href="${esc(url)}" target="_blank" rel="noopener noreferrer" class="approval-url-text">${esc(displayUrl)} ${externalIcon}</a>`
          : `<span class="approval-url-text invalid">Invalid URL: ${esc(displayUrl)}</span>`}
              </div>
              <div class="approval-actions">
                <button class="btn btn-primary btn-sm" onclick="adminApproveUrl(${actionArg})">Approve</button>
                <button class="btn btn-ghost btn-sm" onclick="adminRejectUrl(${actionArg})">Reject</button>
              </div>
            </div>`;
    }).join('') : '<div class="empty-state-card">No URL requests yet.</div>'}
        </div>
      </div>`;
  };

  renderSAUrlRequests = function renderSAUrlRequestsCardProduction() {
    renderApprovalLinksProduction('subadmin');
  };

  function renderAdminCreateManageProduction() {
    const content = document.getElementById('admin-content');
    if (!content) return;
    const subAdmins = read('edusync_subadmins', []);
    const universities = managedUniversities();
    content.innerHTML = `
      <div class="admin-dashboard-wrap">
        <div class="admin-section-head">
          <div>
            <h2>Create & Manage</h2>
            <p>Core administration tools grouped for fast scanning.</p>
          </div>
        </div>
        <div class="admin-manage-grid">
          <div class="card manage-panel card-soft-blue">
            <div class="manage-panel-head"><div><h3>Sub Admin Management</h3><span>${esc(subAdmins.length)} active records</span></div><button class="btn btn-primary btn-sm" onclick="openCreateSubAdminModal()">Create</button></div>
            <input class="input" id="subadmin-search" placeholder="Search sub admins" oninput="aiiensRenderSubAdmins(this.value)">
            <div class="v10-items manage-list">${subAdmins.map((sa, index) => subAdminRow(sa, index)).join('') || '<div class="empty-state-card">No sub admins yet.</div>'}</div>
          </div>
          ${featureManagerPanel()}
          ${regulationManagerPanel()}
          ${universityPanel(universities)}
        </div>
      </div>`;
    aiiensRenderUniversities();
    renderFeatureList();
    window.aimeasyUpdateRegulationDropdowns?.(document);
    window.aiiensUpdateUniversityDropdowns?.(document);
  }

  function subAdminRow(sa, index) {
    return `<div class="v10-item subadmin-compact-card management-record">
      <div class="record-icon">${esc((sa.username || 'S').charAt(0).toUpperCase())}</div>
      <div class="v10-item-body">
        <div class="v10-item-title">${esc(sa.username || 'User ID')}</div>
        <div class="subadmin-meta-grid">
          <span><b>Branch</b>${esc(sa.branch || '-')}</span>
          <span><b>Regulation</b>${esc(sa.regulation || '-')}</span>
          <span><b>University</b>${esc(sa.university || sa.department || '-')}</span>
          <span><b>Status</b>${esc(sa.status || 'Active')}</span>
        </div>
      </div>
      <button class="icon-action-btn" onclick="aiiensEditSubAdmin(${index})" title="Edit sub admin" aria-label="Edit ${esc(sa.username || 'sub admin')}">${actionIcon.edit}</button>
      <button class="icon-action-btn danger" onclick="aiiensDeleteSubAdmin(${index})" title="Delete sub admin" aria-label="Delete ${esc(sa.username || 'sub admin')}">${actionIcon.delete}</button>
    </div>`;
  }

  renderExistingSubAdmins = function renderExistingSubAdminsProduction() {
    const el = document.getElementById('sa-existing-list');
    if (!el) return;
    const subAdmins = read('edusync_subadmins', []);
    el.innerHTML = subAdmins.length
      ? '<div style="font-size:0.78rem;font-weight:700;color:var(--text2);margin-bottom:6px;">Existing Sub Admins (' + subAdmins.length + ')</div>' + subAdmins.map((sa, index) => subAdminRow(sa, index)).join('')
      : '';
  };
  window.aiiensRenderSubAdmins = function aiiensRenderSubAdmins(query = '') {
    const card = document.querySelector('#subadmin-search')?.closest('.manage-panel');
    const list = card?.querySelector('.manage-list');
    if (!list) return;
    const q = String(query || '').toLowerCase();
    const rows = read('edusync_subadmins', []).filter(sa => !q || [sa.username, sa.branch, sa.university, sa.regulation].some(value => String(value || '').toLowerCase().includes(q)));
    list.innerHTML = rows.length ? rows.map((sa) => {
      const realIndex = read('edusync_subadmins', []).findIndex(item => item.username === sa.username);
      return subAdminRow(sa, realIndex);
    }).join('') : '<div class="empty-state-card">No matching sub admins.</div>';
  };

  function configureSubAdminModalMode(isEdit = false) {
    const title = document.getElementById('create-subadmin-title');
    const submit = document.getElementById('sa-create-submit');
    if (title) title.textContent = isEdit ? 'Edit Sub Admin' : 'Create Sub Admin';
    if (submit) submit.textContent = isEdit ? 'Save Changes' : 'Create Sub Admin';
    const dept = document.getElementById('sa-create-dept');
    if (dept && !dept.value) dept.value = 'Academics';
    const permissions = document.getElementById('sa-create-permissions');
    if (permissions && !permissions.value) permissions.value = 'subjects, units, content';
  }

  window.toggleSubAdminPassword = function toggleSubAdminPassword() {
    const input = document.getElementById('sa-create-password');
    const button = document.querySelector('#create-subadmin-modal .password-toggle');
    if (!input) return;
    const showing = input.type === 'text';
    input.type = showing ? 'password' : 'text';
    if (button) {
      button.textContent = showing ? 'Eye' : 'Hide';
      button.setAttribute('aria-label', showing ? 'Show password' : 'Hide password');
    }
  };

  document.getElementById('create-subadmin-modal')?.addEventListener('keydown', (event) => {
    if (event.key !== 'Enter') return;
    const target = event.target;
    if (target?.tagName === 'TEXTAREA') return;
    event.preventDefault();
    createSubAdmin();
  });

  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Enter') return;
    const target = event.target;
    if (!target || target.tagName === 'TEXTAREA' || target.closest('#create-subadmin-modal')) return;
    if (target.closest('#sa-create-subject-form') || target.closest('#v10-sa-create-form')) {
      event.preventDefault();
      window.v10SACreateSubject?.();
      return;
    }
    if (target.id === 'uni-name' || target.id === 'uni-code' || target.id === 'uni-status') {
      event.preventDefault();
      window.aiiensSaveUniversity?.();
      return;
    }
    if (target.id === 'adm-feature-name') {
      event.preventDefault();
      window.adminAddFeature?.();
    }
  });

  openCreateSubAdminModal = window.openCreateSubAdminModal = function openCreateSubAdminModalProduction() {
    const modal = document.getElementById('create-subadmin-modal');
    modal?.classList.add('open');
    if (modal) delete modal.dataset.editIndex;
    ['sa-create-username', 'sa-create-password', 'sa-create-branch', 'sa-create-regulation', 'sa-create-university'].forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
    configureSubAdminModalMode(false);
    window.aimeasyUpdateRegulationDropdowns?.(document);
    window.aiiensUpdateUniversityDropdowns?.(document);
  };

  createSubAdmin = window.createSubAdmin = async function createSubAdminProduction() {
    const modal = document.getElementById('create-subadmin-modal');
    const editIndex = modal?.dataset.editIndex;
    const username = document.getElementById('sa-create-username')?.value.trim();
    const password = document.getElementById('sa-create-password')?.value.trim();
    const branch = document.getElementById('sa-create-branch')?.value;
    const department = document.getElementById('sa-create-dept')?.value.trim() || 'Academics';
    const regulation = document.getElementById('sa-create-regulation')?.value;
    const university = document.getElementById('sa-create-university')?.value.trim();
    const permissions = (document.getElementById('sa-create-permissions')?.value || 'subjects, units, content').split(',').map(p => p.trim()).filter(Boolean);
    const errEl = document.getElementById('sa-create-err');
    const sucEl = document.getElementById('sa-create-success');
    if (!username || !password || !branch || !department || !regulation || !university) {
      if (errEl) { errEl.textContent = 'Please fill username, password, branch, department, regulation, and university.'; errEl.style.display = 'block'; }
      if (sucEl) sucEl.style.display = 'none';
      return;
    }
    const subAdmins = read('edusync_subadmins', []);
    const duplicate = subAdmins.some((sa, idx) => sa.username === username && String(idx) !== String(editIndex ?? ''));
    if (duplicate) {
      if (errEl) { errEl.textContent = 'Username already exists.'; errEl.style.display = 'block'; }
      return;
    }
    const row = { username, password, branch, department, regulation, university, permissions, createdAt: subAdmins[editIndex]?.createdAt || new Date().toLocaleString() };
    if (editIndex !== undefined) subAdmins[Number(editIndex)] = { ...subAdmins[Number(editIndex)], ...row };
    else subAdmins.push(row);
    write('edusync_subadmins', subAdmins);
    if (window.supabase && editIndex === undefined) {

      console.log('SUBADMIN INSERT START', username);

      const { data, error } = await window.supabase
        .from('sub_admin_accounts')
        .insert([
          {
            username,
            password,
            status: 'active'
          }
        ])
        .select();

      console.log('SUBADMIN INSERT DATA:', data);
      console.log('SUBADMIN INSERT ERROR:', error);

      if (error) {
        console.error('SUBADMIN INSERT FAILED:', error);
        showToast('Failed to save subadmin to Supabase', 'red');
      } else {
        console.log('SUBADMIN INSERT SUCCESS:', username);
      }
    }
    if (errEl) errEl.style.display = 'none';
    if (sucEl) { sucEl.textContent = editIndex !== undefined ? 'Sub Admin updated.' : 'Sub Admin created.'; sucEl.style.display = 'block'; }
    if (modal) delete modal.dataset.editIndex;
    configureSubAdminModalMode(false);
    renderExistingSubAdmins();
    refreshActiveAdminSurfaces();
    showToast(editIndex !== undefined ? 'Sub Admin updated' : 'Sub Admin created', 'green');
  };

  window.aiiensEditSubAdmin = function aiiensEditSubAdmin(index) {
    const subAdmins = read('edusync_subadmins', []);
    const sa = subAdmins[index];
    if (!sa) return;
    const modal = document.getElementById('create-subadmin-modal');
    modal?.classList.add('open');
    modal?.style.removeProperty('pointer-events');
    if (modal) modal.dataset.editIndex = String(index);
    window.aiiensUpdateUniversityDropdowns?.(document);
    document.getElementById('sa-create-username').value = sa.username || '';
    document.getElementById('sa-create-password').value = sa.password || '';
    document.getElementById('sa-create-branch').value = sa.branch || '';
    document.getElementById('sa-create-dept').value = sa.department || sa.dept || '';
    if (document.getElementById('sa-create-regulation')) document.getElementById('sa-create-regulation').value = sa.regulation || '';
    if (document.getElementById('sa-create-university')) document.getElementById('sa-create-university').value = sa.university || '';
    window.setTimeout(() => {
      if (document.getElementById('sa-create-university')) document.getElementById('sa-create-university').value = sa.university || '';
    }, 0);
    if (document.getElementById('sa-create-permissions')) document.getElementById('sa-create-permissions').value = (sa.permissions || []).join(', ');
    configureSubAdminModalMode(true);
    renderExistingSubAdmins();
  };
  window.aiiensDeleteSubAdmin = async function aiiensDeleteSubAdmin(index) {
    const subAdmins = read('edusync_subadmins', []);
    const deletedUser = subAdmins[index];

    subAdmins.splice(index, 1);
    write('edusync_subadmins', subAdmins);

    if (window.supabase && deletedUser) {
      const { error } = await window.supabase
        .from('sub_admin_accounts')
        .delete()
        .eq('username', deletedUser.username);

      console.log('DELETE ERROR:', error);
    }

    renderExistingSubAdmins();
    refreshActiveAdminSurfaces();
    showToast('Sub Admin deleted', 'red');
  };

  window.aiiensSaveUniversity = function aiiensSaveUniversity() {
    const name = document.getElementById('uni-name')?.value.trim();
    const code = document.getElementById('uni-code')?.value.trim();
    const state = document.getElementById('uni-state')?.value.trim();
    const status = document.getElementById('uni-status')?.value || 'Active';
    if (!name || !code) { showToast('Enter university name and code', 'red'); return; }
    const rows = managedUniversities();
    const editIndex = document.getElementById('uni-name')?.dataset.editIndex;
    const row = { name, code, state, status, updatedAt: new Date().toISOString() };
    if (editIndex !== undefined) rows[Number(editIndex)] = { ...rows[Number(editIndex)], ...row };
    else rows.push(row);
    saveManagedUniversities(rows);
    delete document.getElementById('uni-name').dataset.editIndex;
    document.getElementById('uni-name').value = '';
    document.getElementById('uni-code').value = '';
    if (document.getElementById('uni-state')) document.getElementById('uni-state').value = '';
    if (document.getElementById('uni-status')) document.getElementById('uni-status').value = 'Active';
    aiiensRenderUniversities();
    window.aiiensUpdateUniversityDropdowns?.(document);
    showToast(editIndex !== undefined ? 'University updated' : 'University saved', 'green');
  };
  window.aiiensRenderUniversities = function aiiensRenderUniversities(query = '') {
    const list = document.getElementById('university-list');
    if (!list) return;
    const q = String(query || document.getElementById('uni-search')?.value || '').toLowerCase();
    const stateQ = String(document.getElementById('uni-state-filter')?.value || '').toLowerCase();
    const statusQ = String(document.getElementById('uni-status-filter')?.value || '').toLowerCase();
    const allRows = managedUniversities();
    const rows = allRows.filter(row => {
      const nameMatch = !q || String(row.name || '').toLowerCase().includes(q) || String(row.code || '').toLowerCase().includes(q);
      const stateMatch = !stateQ || String(row.state || '').toLowerCase().includes(stateQ);
      const statusMatch = !statusQ || String(row.status || 'Active').toLowerCase() === statusQ;
      return nameMatch && stateMatch && statusMatch;
    });
    list.innerHTML = rows.length ? rows.map((row, index) => `
      <div class="v10-item management-record"><div class="v10-item-body"><div class="v10-item-title">${esc(row.name)}</div><div class="v10-item-meta">${esc(row.code)} · ${esc(row.state || 'State not set')} · ${esc(row.status || 'Active')}</div></div>
      <button class="icon-action-btn" onclick="aiiensEditUniversity(${allRows.indexOf(row)})" title="Edit university" aria-label="Edit ${esc(row.name)}">${actionIcon.edit}</button><button class="icon-action-btn danger" onclick="aiiensDeleteUniversity(${allRows.indexOf(row)})" title="Delete university" aria-label="Delete ${esc(row.name)}">${actionIcon.delete}</button></div>`).join('') : '<p style="color:var(--text3);">No universities found.</p>';
  };
  window.aiiensEditUniversity = function aiiensEditUniversity(index) {
    const row = managedUniversities()[index];
    if (!row) return;
    document.getElementById('uni-name').value = row.name || '';
    document.getElementById('uni-name').dataset.editIndex = String(index);
    document.getElementById('uni-code').value = row.code || '';
    if (document.getElementById('uni-state')) document.getElementById('uni-state').value = row.state || '';
    document.getElementById('uni-status').value = row.status || 'Active';
    document.getElementById('uni-name')?.focus();
  };
  window.aiiensDeleteUniversity = function aiiensDeleteUniversity(index) {
    const rows = managedUniversities();
    rows.splice(index, 1);
    saveManagedUniversities(rows);
    aiiensRenderUniversities();
    window.aiiensUpdateUniversityDropdowns?.(document);
    showToast('University deleted', 'red');
  };

  adminAddFeature = window.adminAddFeature = function adminAddFeatureProduction() {
    const input = document.getElementById('adm-feature-name');
    const name = input?.value.trim();
    if (!name) { showToast('Enter feature name', 'red'); return; }
    const rows = featureRows();
    if (rows.some(item => featureSlug(item) === featureSlug(name))) {
      showToast('Feature already exists', 'amber');
      return;
    }
    const nextSlug = featureSlug(name);
    write('edusync_disabled_features', read('edusync_disabled_features', []).filter(item => featureSlug(item) !== nextSlug));
    saveFeatureRows([...rows, name]);
    if (input) input.value = '';
    renderFeatureList();
    showToast('Feature added and synced to all panels.', 'green');
  };
  adminEditFeature = window.adminEditFeature = function adminEditFeatureProduction(index) {
    const rows = featureRows();
    const oldName = rows[index];
    const nextName = prompt('Edit feature name:', oldName);
    if (!nextName?.trim()) return;
    const oldSlug = featureSlug(oldName);
    if (['videos', 'notes', 'pyqs', 'important-questions'].includes(oldSlug)) {
      const disabled = [...new Set([...read('edusync_disabled_features', []), oldSlug])];
      write('edusync_disabled_features', disabled);
      rows.splice(index, 1, nextName.trim());
    } else {
      rows[index] = nextName.trim();
    }
    saveFeatureRows(rows);
    renderFeatureList();
    showToast('Feature updated everywhere.', 'green');
  };
  adminDeleteFeature = window.adminDeleteFeature = function adminDeleteFeatureProduction(index) {
    const rows = featureRows();
    const feature = rows[index];
    if (!feature) return;
    if (!confirm(`Delete "${feature}"? Existing content for this feature may no longer be shown.`)) return;
    const key = featureSlug(feature);
    if (['videos', 'notes', 'pyqs', 'important-questions'].includes(key)) {
      write('edusync_disabled_features', [...new Set([...read('edusync_disabled_features', []), key])]);
    } else {
      saveFeatureRows(rows.filter((_, itemIndex) => itemIndex !== index));
    }
    renderFeatureList();
    showToast('Feature deleted', 'red');
  };

  window.aiiensEditUrlRequest = function aiiensEditUrlRequest(index) {
    const rows = read('edusync_url_requests', []);
    const row = rows[index];
    if (!row) return;
    const nextUrl = prompt('Edit URL:', row.url || '');
    if (!nextUrl?.trim()) return;
    rows[index] = { ...row, url: nextUrl.trim() };
    write('edusync_url_requests', rows);
    renderApprovalLinksProduction(activeScreen() === 'screen-subadmin' ? 'subadmin' : 'admin');
    showToast('URL request updated', 'green');
  };
  window.aiiensDeleteUrlRequest = function aiiensDeleteUrlRequest(index) {
    const rows = read('edusync_url_requests', []);
    const row = rows[index];
    if (!row) return;
    if (!confirm('Delete this URL request?')) return;
    rows.splice(index, 1);
    write('edusync_url_requests', rows);
    renderApprovalLinksProduction(activeScreen() === 'screen-subadmin' ? 'subadmin' : 'admin');
    showToast('URL request deleted', 'red');
  };

  adminApproveUrl = window.adminApproveUrl = async function adminApproveUrlDb(idOrIndex) {
    const supabase = window.__AIMEASY_SUPABASE__;
    if (!supabase) {
      const rows = read('edusync_url_requests', []);
      if (!rows[idOrIndex]) return;
      rows[idOrIndex] = { ...rows[idOrIndex], status: 'approved', reviewedAt: new Date().toISOString() };
      write('edusync_url_requests', rows);
      renderApprovalLinksProduction(activeScreen() === 'screen-subadmin' ? 'subadmin' : 'admin');
      showToast('URL approved', 'green');
      return;
    }
    const authUser = supabase.auth?.getUser ? (await supabase.auth.getUser())?.data?.user : null;
    const { error } = await supabase
      .from('student_url_suggestions')
      .update({
        status: 'approved',
        approved_by: authUser?.id || null,
        approved_at: new Date().toISOString(),
      })
      .eq('id', idOrIndex);
    if (error) {
      showToast('Approval failed: ' + error.message, 'red');
      return;
    }
    await renderApprovalLinksProduction(activeScreen() === 'screen-subadmin' ? 'subadmin' : 'admin');
    if (document.querySelector('.screen.active')?.id === 'screen-app' && APP.currentSubject && APP.currentUnit) {
      renderVideoList(APP.currentSubject.id || APP.currentSubject.rawId, APP.currentUnit);
    }
    showToast('URL approved and published', 'green');
  };

  adminRejectUrl = window.adminRejectUrl = async function adminRejectUrlDb(idOrIndex) {
    const supabase = window.__AIMEASY_SUPABASE__;
    if (!supabase) {
      const rows = read('edusync_url_requests', []);
      if (!rows[idOrIndex]) return;
      rows[idOrIndex] = { ...rows[idOrIndex], status: 'rejected', reviewedAt: new Date().toISOString() };
      write('edusync_url_requests', rows);
      renderApprovalLinksProduction(activeScreen() === 'screen-subadmin' ? 'subadmin' : 'admin');
      showToast('URL rejected', 'red');
      return;
    }
    const { error } = await supabase
      .from('student_url_suggestions')
      .update({
        status: 'rejected',
        approved_by: null,
        approved_at: null,
      })
      .eq('id', idOrIndex);
    if (error) {
      showToast('Reject failed: ' + error.message, 'red');
      return;
    }
    await renderApprovalLinksProduction(activeScreen() === 'screen-subadmin' ? 'subadmin' : 'admin');
    showToast('URL rejected', 'red');
  };

  const originalSwitchAdminSection = window.switchAdminSection || switchAdminSection;
  switchAdminSection = window.switchAdminSection = function switchAdminSectionProduction(section) {
    section = normalizeAdminSection(section);
    console.log('[ROUTE RESTORE] Admin section restore', { requested: window.location.hash, section });
    closeAdminSidebar?.();
    document.querySelectorAll('[id^="admin-nav-"]').forEach(el => el.classList.remove('active'));
    document.getElementById('admin-nav-' + section)?.classList.add('active');
    const titleEl = document.getElementById('admin-topbar-title');
    if (titleEl) titleEl.textContent = ({ dashboard: 'Admin Dashboard', create: 'Create & Manage', subjects: 'All Subjects', approvals: 'URL Approvals', creatorview: 'Creator View', skillup: 'Skill Up', notifications: 'Notifications' })[section] || 'Admin';
    routePush('/admin/' + adminRouteFor(section));
    if (section === 'dashboard') return renderAdminDashboardProduction();
    if (section === 'create') return renderAdminCreateManageProduction();
    if (section === 'approvals') return renderApprovalLinksProduction('admin');
    return originalSwitchAdminSection?.(section);
  };

  renderAdminSection = window.renderAdminSection = function renderAdminSectionProduction(section) {
    section = normalizeAdminSection(section);
    document.querySelectorAll('[id^="admin-nav-"]').forEach(el => el.classList.remove('active'));
    document.getElementById('admin-nav-' + section)?.classList.add('active');
    const titleEl = document.getElementById('admin-topbar-title');
    if (titleEl) titleEl.textContent = ({ dashboard: 'Admin Dashboard', create: 'Create & Manage', subjects: 'All Subjects', approvals: 'URL Approvals', creatorview: 'Creator View', skillup: 'Skill Up', notifications: 'Notifications' })[section] || 'Admin';
    if (section === 'dashboard') return renderAdminDashboardProduction();
    if (section === 'create') return renderAdminCreateManageProduction();
    if (section === 'approvals') return renderApprovalLinksProduction('admin');
    return originalSwitchAdminSection?.(section);
  };

  const originalSwitchSASection = window.switchSASection || switchSASection;
  switchSASection = window.switchSASection = function switchSASectionProduction(section) {
    section = normalizeSASection(section);
    console.log('[ROUTE RESTORE] SubAdmin section restore', { requested: window.location.hash, section });
    closeSASidebar?.();
    document.querySelectorAll('[id^="sa-nav-"]').forEach(el => el.classList.remove('active'));
    document.getElementById('sa-nav-' + section)?.classList.add('active');
    const titleEl = document.getElementById('sa-topbar-title');
    if (titleEl) titleEl.textContent = ({ dashboard: 'Sub Admin Dashboard', subjects: 'Create Subject', view: 'View Subjects', curriculum: 'Curriculum', skillup: 'Skill Up', urls: 'URL Approvals' })[section] || 'Sub Admin';
    routePush('/subadmin/' + saRouteFor(section));
    if (section === 'dashboard') return renderSubAdminDashboardProduction();
    if (section === 'urls') return renderApprovalLinksProduction('subadmin');
    return originalSwitchSASection?.(section);
  };

  window.adminNavigateBack = function adminNavigateBackProduction() {
    if (document.getElementById('admin-nav-dashboard')?.classList.contains('active')) return;
    switchAdminSection('dashboard');
  };
  window.subAdminNavigateBack = function subAdminNavigateBackProduction() {
    if (document.getElementById('sa-nav-dashboard')?.classList.contains('active')) return;
    switchSASection('dashboard');
  };
  window.subAdminBack = function subAdminLogoutOnlyFromButton() {
    localStorage.removeItem('edusync_admin_session');
    APP.adminType = null;
    APP.subAdminData = null;
    showScreen('screen-landing');
  };

  function wrapAndRefresh(fnName) {
    const original = window[fnName] || (typeof globalThis[fnName] === 'function' ? globalThis[fnName] : null);
    if (typeof original !== 'function') return;
    window[fnName] = globalThis[fnName] = function wrappedProductionRefresh(...args) {
      const result = original.apply(this, args);
      Promise.resolve(result).finally(() => window.setTimeout(refreshActiveAdminSurfaces, 0));
      return result;
    };
  }
  [
    'v10SACreateSubject', 'v10AdminCreateSubject', 'v10AdminSaveEditSubject', 'v10AdminDeleteSubject',
    'v10AdminAddUnit', 'v10AdminEditUnit', 'v10AdminDeleteUnit', 'v10SaveUnitRoadmap',
    'v10UploadNote', 'v10UploadPYQ', 'v10UploadIQ', 'aimSaveCreatorCurriculumContent'
  ].forEach(wrapAndRefresh);

  window.addEventListener('storage', (event) => {
    if (/^(edusync_custom_subjects|edusync_units_|edusync_admin_|edusync_url_requests|edusync_subadmins|edusync_universities|edusync_deleted_universities|edusync_regulations|aimeasy_cached_regulations)/.test(event.key || '')) {
      refreshActiveAdminSurfaces();
    }
  });
}

export function installLegacyInlineHandlerGlobals() {
  const expose = (name, fn) => {
    if (typeof fn !== 'function') return;
    window[name] = globalThis[name] = function legacyInlineHandlerBridge(...args) {
      return fn.apply(this, args);
    };
  };

  expose('selectRoleAndNavigate', typeof selectRoleAndNavigate === 'function' ? selectRoleAndNavigate : window.selectRoleAndNavigate);
  expose('selectRole', typeof selectRole === 'function' ? selectRole : window.selectRole);
  expose('proceedWithRole', typeof proceedWithRole === 'function' ? proceedWithRole : window.proceedWithRole);
  expose('toggleAdminDropdown', typeof toggleAdminDropdown === 'function' ? toggleAdminDropdown : window.toggleAdminDropdown);
  expose('openAdminLogin', typeof openAdminLogin === 'function' ? openAdminLogin : window.openAdminLogin);
  expose('closeAdminLogin', typeof closeAdminLogin === 'function' ? closeAdminLogin : window.closeAdminLogin);
  expose('submitAdminLogin', typeof submitAdminLogin === 'function' ? submitAdminLogin : window.submitAdminLogin);
  expose('toggleAdminSidebar', typeof toggleAdminSidebar === 'function' ? toggleAdminSidebar : window.toggleAdminSidebar);
  expose('closeAdminSidebar', typeof closeAdminSidebar === 'function' ? closeAdminSidebar : window.closeAdminSidebar);
  expose('switchAdminSection', typeof switchAdminSection === 'function' ? switchAdminSection : window.switchAdminSection);
  expose('renderAdminSection', typeof renderAdminSection === 'function' ? renderAdminSection : window.renderAdminSection);
  expose('launchAdminDashboard', typeof launchAdminDashboard === 'function' ? launchAdminDashboard : window.launchAdminDashboard);
  expose('adminLogout', typeof adminLogout === 'function' ? adminLogout : window.adminLogout);
  expose('toggleSASidebar', typeof toggleSASidebar === 'function' ? toggleSASidebar : window.toggleSASidebar);
  expose('closeSASidebar', typeof closeSASidebar === 'function' ? closeSASidebar : window.closeSASidebar);
  expose('switchSASection', typeof switchSASection === 'function' ? switchSASection : window.switchSASection);
  expose('subAdminBack', typeof subAdminBack === 'function' ? subAdminBack : window.subAdminBack);
  expose('launchSubAdmin', typeof launchSubAdmin === 'function' ? launchSubAdmin : window.launchSubAdmin);
  expose('showScreen', typeof showScreen === 'function' ? showScreen : window.showScreen);
  expose('showLoading', typeof showLoading === 'function' ? showLoading : window.showLoading);
  expose('hideLoading', typeof hideLoading === 'function' ? hideLoading : window.hideLoading);

  console.log('[LEGACY COMPAT] Inline handlers restored', {
    selectRoleAndNavigate: typeof window.selectRoleAndNavigate,
    switchAdminSection: typeof window.switchAdminSection,
    toggleAdminDropdown: typeof window.toggleAdminDropdown,
    toggleAdminSidebar: typeof window.toggleAdminSidebar,
    openAdminLogin: typeof window.openAdminLogin,
    submitAdminLogin: typeof window.submitAdminLogin,
  });

  // =========================================================================
  //  NOTIFICATIONS LOGIC
  // =========================================================================

  function getCurrentUserKey() {
    const user = window.APP?.user || JSON.parse(localStorage.getItem('edusync_session_user') || '{}');
    return user.id || user.email || 'guest';
  }

  window.sendAdminNotification = function () {
    const title = document.getElementById('notif-title')?.value.trim();
    const recipient = document.getElementById('notif-recipient')?.value;
    const message = document.getElementById('notif-message')?.value.trim();

    if (!title || !message) {
      showToast('Please fill in both the title and message fields.', 'red');
      return;
    }

    let notifications = JSON.parse(localStorage.getItem('edusync_admin_notifications') || '[]');
    const newNotif = {
      id: Date.now(),
      title: title,
      message: message,
      recipient: recipient,
      sentAt: new Date().toLocaleString(),
    };

    notifications.unshift(newNotif);

    // Maintain maximum of 5 notifications (oldest removed)
    if (notifications.length > 5) {
      notifications = notifications.slice(0, 5);
    }

    localStorage.setItem('edusync_admin_notifications', JSON.stringify(notifications));

    // Clear form inputs
    if (document.getElementById('notif-title')) document.getElementById('notif-title').value = '';
    if (document.getElementById('notif-message')) document.getElementById('notif-message').value = '';

    showToast('✅ Notification sent successfully!', 'green');
    renderAdminNotificationsUI();
  };

  window.deleteAdminNotification = function (id) {
    if (!confirm('Are you sure you want to delete this notification?')) return;
    let notifications = JSON.parse(localStorage.getItem('edusync_admin_notifications') || '[]');
    notifications = notifications.filter(n => n.id !== id);
    localStorage.setItem('edusync_admin_notifications', JSON.stringify(notifications));

    showToast('Notification deleted', 'red');
    renderAdminNotificationsUI();
  };

  window.renderAdminNotificationsUI = function () {
    const content = document.getElementById('admin-content');
    if (!content) return;

    const notifications = JSON.parse(localStorage.getItem('edusync_admin_notifications') || '[]');

    content.innerHTML = `
      <div style="padding:2rem; max-width:1200px; margin:0 auto; width:100%;">
        <div style="margin-bottom:1.6rem;">
          <h2 style="font-size:1.5rem; font-weight:800; letter-spacing:-0.02em; margin-bottom:4px;">🔔 Notifications Management</h2>
          <p style="font-size:0.85rem; color:var(--text3);">Compose and send notifications to Students or Content Creators</p>
        </div>

        <div style="display:grid; grid-template-columns: 1fr 1fr; gap:1.6rem; align-items:start;">
          <!-- Compose Notification Form -->
          <div class="card" style="padding: 1.5rem;">
            <h3 style="margin-bottom: 1.2rem; font-size:1.1rem; font-weight:700;">➕ Compose Notification</h3>
            <div class="input-group" style="margin-bottom: 1rem;">
              <label style="font-weight:600; margin-bottom: 4px; display:block;">Title</label>
              <input class="input" id="notif-title" placeholder="e.g. System Update or Important announcement" style="width:100%;">
            </div>
            
            <div class="input-group" style="margin-bottom: 1rem;">
              <label style="font-weight:600; margin-bottom: 4px; display:block;">Recipient Role</label>
              <select class="select" id="notif-recipient" style="width:100%;">
                <option value="student">Student</option>
                <option value="content_creator">Content Creator</option>
                <option value="both">Both (All)</option>
              </select>
            </div>
            
            <div class="input-group" style="margin-bottom: 1.5rem;">
              <label style="font-weight:600; margin-bottom: 4px; display:block;">Message</label>
              <textarea class="input" id="notif-message" rows="5" placeholder="Write notification message here..." style="width:100%; resize: vertical; min-height: 120px;"></textarea>
            </div>
            
            <button class="btn btn-primary" onclick="sendAdminNotification()" style="width:100%; font-weight:700; padding:10px;">
              🔔 Send Broadcast
            </button>
          </div>

          <!-- Sent Notifications History -->
          <div class="card" style="padding: 1.5rem;">
            <h3 style="margin-bottom: 1.2rem; font-size:1.1rem; font-weight:700;">📋 Broadcast History (Latest 5)</h3>
            <div style="display:flex; flex-direction:column; gap:10px;">
              ${!notifications.length ? `
                <div style="text-align:center; padding:3rem; color:var(--text3); border:1.5px dashed var(--border); border-radius:var(--radius-md);">
                  📬 No notifications sent yet.
                </div>
              ` : notifications.map(n => `
                <div style="padding: 12px; border: 1px solid var(--border); border-radius: var(--radius-md); background: var(--surface2); display:flex; justify-content:space-between; align-items:flex-start; gap:10px;">
                  <div style="flex:1; min-width:0;">
                    <div style="font-weight:700; font-size:0.9rem; color:var(--text1); display:flex; align-items:center; gap:8px;">
                      ${n.title}
                      <span class="badge ${n.recipient === 'student' ? 'badge-primary' : n.recipient === 'content_creator' ? 'badge-teal' : 'badge-lavender'}" style="font-size:0.65rem;">
                        ${n.recipient === 'student' ? 'Student' : n.recipient === 'content_creator' ? 'Creator' : 'All'}
                      </span>
                    </div>
                    <p style="font-size:0.82rem; color:var(--text2); margin-top:4px; line-height:1.4; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden;">
                      ${n.message}
                    </p>
                    <span style="font-size:0.7rem; color:var(--text3); display:block; margin-top:6px;">
                      🕒 Sent: ${n.sentAt}
                    </span>
                  </div>
                  <button class="btn btn-danger btn-sm" onclick="deleteAdminNotification(${n.id})" style="padding:4px 8px; font-size:0.75rem;">✕</button>
                </div>
              `).join('')}
            </div>
          </div>
        </div>
      </div>
    `;
  };

  window.openNotificationsModal = function () {
    const modal = document.getElementById('notifications-modal');
    if (!modal) return;

    // Reset views
    document.getElementById('notif-detail-container').style.display = 'none';
    document.getElementById('notif-list-container').style.display = 'flex';

    // Render notifications list
    renderNotificationsList();

    modal.classList.add('open');
  };

  window.closeNotificationsModal = function () {
    const modal = document.getElementById('notifications-modal');
    if (modal) modal.classList.remove('open');

    // Refresh dot status
    updateNotificationDots();
  };

  window.backToNotifList = function () {
    document.getElementById('notif-detail-container').style.display = 'none';
    document.getElementById('notif-list-container').style.display = 'flex';
    renderNotificationsList();
  };

  function renderNotificationsList() {
    const container = document.getElementById('notif-list-container');
    if (!container) return;

    const userRole = window.APP?.user?.role || window.APP?.role || 'student';
    const userKey = getCurrentUserKey();

    const notifications = JSON.parse(localStorage.getItem('edusync_admin_notifications') || '[]');
    const readList = JSON.parse(localStorage.getItem('edusync_read_notifications_' + userKey) || '[]');

    // Filter relevant notifications (matches user role or 'both')
    const relevant = notifications.filter(n => n.recipient === userRole || n.recipient === 'both');

    if (!relevant.length) {
      container.innerHTML = `
        <div style="text-align: center; padding: 2.5rem; color: var(--text3);">
          <div style="font-size: 2.5rem; margin-bottom: 8px;">📬</div>
          <div style="font-weight:600; font-size:0.88rem;">All caught up!</div>
          <div style="font-size:0.78rem; margin-top:2px;">No announcements from Admin.</div>
        </div>
      `;
      return;
    }

    container.innerHTML = relevant.map(n => {
      const isRead = readList.includes(n.id);
      return `
        <div onclick="openNotificationDetail(${n.id})" style="position: relative; padding: 12px; border: 1px solid var(--border); border-radius: var(--radius-md); background: ${isRead ? 'var(--surface)' : 'var(--primary-light)'}; cursor: pointer; transition: var(--transition); display: flex; gap: 10px; align-items: flex-start;">
          <div style="font-size: 1.3rem; margin-top: 2px;">📢</div>
          <div style="flex: 1; min-width: 0;">
            <div style="font-weight: 700; font-size: 0.9rem; color: var(--text1); display: flex; align-items: center; gap: 8px;">
              <span style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 80%;">${n.title}</span>
              ${!isRead ? '<span style="width: 8px; height: 8px; border-radius: 50%; background: var(--red); display: inline-block; flex-shrink: 0;" title="Unread"></span>' : ''}
            </div>
            <div style="font-size: 0.8rem; color: var(--text2); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; margin-top: 4px;">
              ${n.message}
            </div>
            <div style="font-size: 0.7rem; color: var(--text3); margin-top: 6px;">
              🕒 ${n.sentAt}
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  window.openNotificationDetail = function (id) {
    const notifications = JSON.parse(localStorage.getItem('edusync_admin_notifications') || '[]');
    const notif = notifications.find(n => n.id === id);
    if (!notif) return;

    // Mark as read
    const userKey = getCurrentUserKey();
    let readList = JSON.parse(localStorage.getItem('edusync_read_notifications_' + userKey) || '[]');
    if (!readList.includes(id)) {
      readList.push(id);
      localStorage.setItem('edusync_read_notifications_' + userKey, JSON.stringify(readList));
    }

    // Toggle views
    document.getElementById('notif-list-container').style.display = 'none';
    const detail = document.getElementById('notif-detail-container');
    detail.style.display = 'flex';

    document.getElementById('notif-detail-title').textContent = notif.title;
    document.getElementById('notif-detail-time').textContent = '🕒 Received: ' + notif.sentAt;
    document.getElementById('notif-detail-message').textContent = notif.message;
  };

  window.updateNotificationDots = function () {
    const userRole = window.APP?.user?.role || window.APP?.role;
    if (!userRole) return;

    const userKey = getCurrentUserKey();
    const notifications = JSON.parse(localStorage.getItem('edusync_admin_notifications') || '[]');
    const readList = JSON.parse(localStorage.getItem('edusync_read_notifications_' + userKey) || '[]');

    const relevant = notifications.filter(n => n.recipient === userRole || n.recipient === 'both');
    const hasUnread = relevant.some(n => !readList.includes(n.id));

    const studentDot = document.getElementById('student-notif-dot');
    const creatorDot = document.getElementById('creator-notif-dot');

    if (studentDot) studentDot.style.display = hasUnread ? 'block' : 'none';
    if (creatorDot) creatorDot.style.display = hasUnread ? 'block' : 'none';
  };

  // Run automatically to keep notification dots in sync
  setInterval(window.updateNotificationDots, 2000);
}
