// ═══════════════════════════════════════════════════
//  ADMIN/SUBADMIN COMPREHENSIVE FIXES — PATCH v2
// ═══════════════════════════════════════════════════

// ── Override switchAdminSection to include new sections ──
const _origSwitchAdminSection = switchAdminSection;
switchAdminSection = function (section) {
  closeAdminSidebar();
  document.querySelectorAll('[id^="admin-nav-"]').forEach(el => el.classList.remove('active'));
  const navEl = document.getElementById('admin-nav-' + section);
  if (navEl) navEl.classList.add('active');
  const titles = {
    dashboard: 'Admin Dashboard',
    create: 'Create & Manage',
    subjects: 'All Subjects',
    approvals: 'URL Approvals',
    creatorview: 'Creator View',
    skillup: 'Skill Up Management',
    notifications: 'Notifications'
  };
  const titleEl = document.getElementById('admin-topbar-title');
  if (titleEl) titleEl.textContent = titles[section] || 'Admin';
  renderAdminSectionFull(section);
};

// ── Override switchSASection to include new sections ──
const _origSwitchSASection = switchSASection;
switchSASection = function (section) {
  closeSASidebar();
  document.querySelectorAll('[id^="sa-nav-"]').forEach(el => el.classList.remove('active'));
  const navEl = document.getElementById('sa-nav-' + section);
  if (navEl) navEl.classList.add('active');
  const titles = {
    dashboard: 'Sub Admin Dashboard',
    subjects: 'Create Subject',
    view: 'View Content',
    skillup: 'Skill Up',
    curriculum: 'Curriculum'
  };
  const titleEl = document.getElementById('sa-topbar-title');
  if (titleEl) titleEl.textContent = titles[section] || 'Sub Admin';
  renderSASectionFull(section);
};

// ── Full admin section renderer with subject click open fix ──
export function renderAdminSectionFull(section) {
  const content = document.getElementById('admin-content');
  if (!content) return;

  const customSubjects = JSON.parse(localStorage.getItem('edusync_custom_subjects') || '[]');
  const adminVideos = JSON.parse(localStorage.getItem('edusync_admin_videos') || '[]');
  const adminNotes = JSON.parse(localStorage.getItem('edusync_admin_notes') || '[]');
  const adminPYQs = JSON.parse(localStorage.getItem('edusync_admin_pyqs') || '[]');
  const adminIQs = JSON.parse(localStorage.getItem('edusync_admin_iqs') || '[]');
  const subAdmins = JSON.parse(localStorage.getItem('edusync_subadmins') || '[]');
  const urlRequests = JSON.parse(localStorage.getItem('edusync_url_requests') || '[]');
  const pending = urlRequests.filter(r => r.status === 'pending');

  // Update badge
  const badge = document.getElementById('admin-approval-badge');
  if (badge) { badge.textContent = pending.length; badge.style.display = pending.length ? 'inline-flex' : 'none'; }

  if (section === 'dashboard') { renderAdminSection('dashboard'); return; }
  if (section === 'create') { renderAdminSection('create'); return; }
  if (section === 'approvals') { renderAdminSection('approvals'); return; }
  if (section === 'notifications') { renderAdminNotificationsUI(); return; }

  if (section === 'skillup') {
    const skills = JSON.parse(localStorage.getItem('edusync_skills') || '[]');
    const skillVideos = JSON.parse(localStorage.getItem('edusync_skill_videos') || '[]');
    const skillNotes = JSON.parse(localStorage.getItem('edusync_skill_notes') || '[]');
    content.innerHTML = `
    <div style="padding:2rem;max-width:1200px;margin:0 auto;width:100%;">
      <h2 style="font-size:1.4rem;font-weight:800;letter-spacing:-0.02em;margin-bottom:1.5rem;">⚡ Skill Up Management</h2>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:1.4rem;align-items:start;">
        <div class="card">
          <h3 style="margin-bottom:1rem;">➕ Create Skill Course</h3>
          <div class="input-group"><label>Skill Name</label><input class="input" id="adm-skillname2" placeholder="e.g. Python Programming"></div>
          <div class="input-group"><label>Description</label><textarea class="input" id="adm-skilldesc2" rows="2" placeholder="Brief description..." style="resize:vertical;"></textarea></div>
          <div class="form-row">
            <div class="input-group"><label>Category</label>
              <select class="select" id="adm-skillcat2">
                <option value="coding">💻 Coding</option><option value="aptitude">🧠 Aptitude</option>
                <option value="communication">🗣️ Communication</option><option value="ai">🤖 AI & ML</option>
                <option value="certification">🏆 Certification</option><option value="other">⭐ Other</option>
              </select>
            </div>
            <div class="input-group"><label>Level</label>
              <select class="select" id="adm-skilllevel2">
                <option value="Beginner">🟢 Beginner</option><option value="Intermediate">🟡 Intermediate</option><option value="Advanced">🔴 Advanced</option>
              </select>
            </div>
          </div>
          <div class="form-row">
            <div class="input-group"><label>Icon (emoji)</label><input class="input" id="adm-skillicon2" placeholder="💻" maxlength="4"></div>
            <div class="input-group"><label>Duration</label><input class="input" id="adm-skillduration2" placeholder="e.g. 8 hours"></div>
          </div>
          <button class="btn btn-primary" onclick="adminCreateSkillV2()" style="width:100%;">⚡ Create Skill Course</button>
          <hr style="margin:1.2rem 0;border-color:var(--border);">
          <h4 style="margin-bottom:0.8rem;">🎬 Add Video to Skill</h4>
          <div class="input-group"><label>Skill</label>
            <select class="select" id="adm-skillvid-skill2">${skills.length ? skills.map(s => `<option value="${s.id}">${s.name}</option>`).join('') : '<option>No skills yet</option>'}</select></div>
          <div class="input-group"><label>Video Title</label><input class="input" id="adm-skillvid-title2" placeholder="e.g. Intro to Python"></div>
          <div class="input-group"><label>YouTube URL</label><input class="input" id="adm-skillvid-url2" placeholder="https://youtube.com/..." type="url"></div>
          <button class="btn btn-teal" onclick="adminAddSkillVideoV2()" style="width:100%;">📤 Add Video</button>
        </div>
        <div class="card">
          <h3 style="margin-bottom:1rem;">⚡ All Skill Courses (${skills.length})</h3>
          <div style="max-height:600px;overflow-y:auto;">
            ${skills.length ? skills.map(s => {
      const vids = skillVideos.filter(v => v.skillId == s.id);
      const notes = skillNotes.filter(n => n.skillId == s.id);
      return `<div style="border:1px solid var(--border);border-radius:var(--radius-md);margin-bottom:10px;overflow:hidden;">
                <div style="display:flex;align-items:center;gap:8px;padding:10px 12px;background:var(--lavender-light);">
                  <span style="font-size:1.4rem;">${s.icon || '⚡'}</span>
                  <div style="flex:1;"><div style="font-weight:700;font-size:0.9rem;">${s.name}</div><div style="font-size:0.72rem;color:var(--text3);">${s.category} · ${s.level} · ${vids.length} videos · ${notes.length} notes</div></div>
                  <button class="btn btn-danger btn-sm" onclick="adminDeleteSkill(${s.id});switchAdminSection('skillup')">🗑</button>
                </div>
                ${vids.length ? '<div style="padding:6px 12px;font-size:0.78rem;">' + vids.map(v => `<div style="display:flex;align-items:center;gap:6px;padding:4px 0;border-bottom:1px solid var(--border);">🎬 <span style="flex:1;">${v.title}</span><button class="btn btn-danger btn-sm" style="padding:2px 8px;font-size:0.7rem;" onclick="adminDeleteSkillVideo(${v.id});switchAdminSection('skillup')">✕</button></div>`).join('') + '</div>' : ''}
              </div>`;
    }).join('') : '<div style="color:var(--text3);text-align:center;padding:2rem;">No skill courses yet</div>'}
          </div>
        </div>
      </div>
    </div>`;
    return;
  }

  if (section === 'creatorview') {
    content.innerHTML = `
    <div style="padding:2rem;max-width:1200px;margin:0 auto;width:100%;">
      <h2 style="font-size:1.4rem;font-weight:800;letter-spacing:-0.02em;margin-bottom:1.5rem;">🎨 Creator View</h2>
      <div class="card" style="margin-bottom:1.4rem;">
        <div class="section-heading" style="margin-bottom:1rem;">👥 Content Creators Overview</div>
        <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:1rem;">
          ${(() => {
        const subAdminsAll = [...subAdmins];
        return subAdminsAll.map(sa => `
              <div class="card" style="padding:1rem;">
                <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px;">
                  <div style="width:40px;height:40px;border-radius:50%;background:linear-gradient(135deg,var(--teal),var(--primary));display:flex;align-items:center;justify-content:center;font-weight:800;color:#fff;font-size:0.9rem;">${sa.username[0].toUpperCase()}</div>
                  <div><div style="font-weight:700;font-size:0.88rem;">${sa.username}</div><div style="font-size:0.72rem;color:var(--text3);">${sa.branch}</div></div>
                </div>
                <div style="display:flex;gap:6px;flex-wrap:wrap;">
                  <span class="badge badge-teal">${customSubjects.filter(s => s.branch === sa.branch).length} subjects</span>
                  <span class="badge badge-green">Active</span>
                </div>
              </div>`).join('');
      })()}
        </div>
      </div>
      <div class="card">
        <div class="section-heading" style="margin-bottom:1rem;">📋 Recent Content Activity</div>
        <div style="display:flex;flex-direction:column;gap:8px;">
          ${adminVideos.slice(-5).reverse().map(v => `
            <div style="display:flex;align-items:center;gap:10px;padding:10px;background:var(--surface2);border-radius:var(--radius-sm);">
              <span style="font-size:1.2rem;">🎬</span>
              <div style="flex:1;"><div style="font-weight:600;font-size:0.85rem;">${v.title}</div><div style="font-size:0.72rem;color:var(--text3);">${v.subject || '—'} · Unit ${v.unit || '—'}</div></div>
              <span class="badge badge-green">Live</span>
            </div>`).join('')}
          ${adminNotes.slice(-3).reverse().map(n => `
            <div style="display:flex;align-items:center;gap:10px;padding:10px;background:var(--surface2);border-radius:var(--radius-sm);">
              <span style="font-size:1.2rem;">📄</span>
              <div style="flex:1;"><div style="font-weight:600;font-size:0.85rem;">${n.title}</div><div style="font-size:0.72rem;color:var(--text3);">${n.subject || '—'} · ${n.type?.toUpperCase()}</div></div>
              <span class="badge badge-primary">Note</span>
            </div>`).join('')}
          ${(!adminVideos.length && !adminNotes.length) ? '<div style="color:var(--text3);text-align:center;padding:1.5rem;">No content uploaded yet</div>' : ''}
        </div>
      </div>
    </div>`;
    return;
  }

  // subjects section with CLICK TO OPEN + edit/delete
  if (section === 'subjects') {
    const allSems = ['1-1', '1-2', '2-1', '2-2', '3-1', '3-2', '4-1', '4-2'];
    const unis = ['JNTUK', 'JNTUH', 'Andhra University'];
    const regs = ['R23', 'R20', 'R19', 'R16'];
    const branches = ['CSE', 'ECE', 'EEE', 'IT', 'AIML', 'AIDS', 'MECH', 'CIVIL'];
    const savedFilter = window._adminSubjectFilter || {};
    const filterUni = savedFilter.uni || '';
    const filterReg = savedFilter.reg || '';
    const filterSem = savedFilter.sem || '';
    const filterBranch = savedFilter.branch || '';

    let allSubjects = [];
    allSems.forEach(sem => {
      const builtins = SUBJECTS_DB[sem] || [];
      builtins.forEach(s => allSubjects.push({ ...s, sem, reg: 'R23', uni: 'JNTUK', branch: s.branch || 'CSE', isBuiltin: true }));
    });
    customSubjects.forEach(s => allSubjects.push({ ...s, isBuiltin: false }));

    let filtered = allSubjects;
    if (filterUni) filtered = filtered.filter(s => s.uni === filterUni);
    if (filterReg) filtered = filtered.filter(s => s.reg === filterReg);
    if (filterSem) filtered = filtered.filter(s => s.sem === filterSem);
    if (filterBranch) filtered = filtered.filter(s => (s.branch || 'CSE') === filterBranch);

    content.innerHTML = `
    <div style="padding:2rem;max-width:1200px;margin:0 auto;width:100%;">
      <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px;margin-bottom:1.5rem;">
        <h2 style="font-size:1.4rem;font-weight:800;letter-spacing:-0.02em;">📚 All Subjects</h2>
        <div style="display:flex;gap:8px;flex-wrap:wrap;">
          <select class="select" style="width:130px;" onchange="window._adminSubjectFilter=Object.assign(window._adminSubjectFilter||{},{uni:this.value});renderAdminSectionFull('subjects')">
            <option value="">All Universities</option>${unis.map(u => `<option value="${u}" ${filterUni === u ? 'selected' : ''}>${u}</option>`).join('')}
          </select>
          <select class="select" style="width:120px;" onchange="window._adminSubjectFilter=Object.assign(window._adminSubjectFilter||{},{reg:this.value});renderAdminSectionFull('subjects')">
            <option value="">All Regulations</option>${regs.map(r => `<option value="${r}" ${filterReg === r ? 'selected' : ''}>${r}</option>`).join('')}
          </select>
          <select class="select" style="width:110px;" onchange="window._adminSubjectFilter=Object.assign(window._adminSubjectFilter||{},{sem:this.value});renderAdminSectionFull('subjects')">
            <option value="">All Semesters</option>${allSems.map(s => `<option value="${s}" ${filterSem === s ? 'selected' : ''}>${s}</option>`).join('')}
          </select>
          <select class="select" style="width:110px;" onchange="window._adminSubjectFilter=Object.assign(window._adminSubjectFilter||{},{branch:this.value});renderAdminSectionFull('subjects')">
            <option value="">All Branches</option>${branches.map(b => `<option value="${b}" ${filterBranch === b ? 'selected' : ''}>${b}</option>`).join('')}
          </select>
        </div>
      </div>
      <div style="font-size:0.82rem;color:var(--text3);margin-bottom:1rem;">Showing ${filtered.length} subjects — click a card to manage it</div>
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:1rem;">
        ${filtered.map(s => `
          <div class="card" style="padding:1.2rem;cursor:pointer;position:relative;" onclick="adminOpenSubject(${JSON.stringify(s).replace(/"/g, '&quot;')})">
            <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:8px;margin-bottom:8px;">
              <div>
                <div style="font-weight:700;font-size:0.92rem;margin-bottom:4px;">${s.icon || '📖'} ${s.name}</div>
                <div style="font-size:0.75rem;color:var(--text3);">${s.code || '—'} · ${s.credits || 3} Cr · ${s.branch || 'CSE'}</div>
              </div>
              <div style="display:flex;gap:4px;" onclick="event.stopPropagation()">
                ${!s.isBuiltin ? `<button class="btn-icon" onclick="adminEditSubjectModal(${s.id})" title="Edit" style="font-size:0.8rem;padding:5px;">✏️</button>` : ''}
                ${!s.isBuiltin ? `<button class="btn-icon" onclick="adminDeleteSubjectConfirm(${s.id},'${(s.name || '').replace(/'/g, "\\'")}')" title="Delete" style="font-size:0.8rem;padding:5px;color:var(--red);">🗑</button>` : ''}
              </div>
            </div>
            <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:8px;">
              <span class="badge badge-primary">${s.sem}</span>
              <span class="badge badge-teal">${s.uni || 'JNTUK'}</span>
              <span class="badge badge-lavender">${s.reg || 'R23'}</span>
              ${s.isBuiltin ? '<span class="badge badge-green">Built-in</span>' : '<span class="badge badge-amber">Custom</span>'}
            </div>
            <div style="font-size:0.75rem;color:var(--primary);font-weight:600;">🔍 Click to open & manage →</div>
          </div>`).join('')}
      </div>
    </div>
    ${getAdminModals()}`;
    return;
  }
}

// ── Admin subject open (units→topics→content) ──
export function adminOpenSubject(s) {
  if (typeof s === 'string') try { s = JSON.parse(s); } catch (e) { }
  const content = document.getElementById('admin-content');
  if (!content) return;
  const units = JSON.parse(localStorage.getItem('edusync_units_' + s.id) || '[]');
  const defaultUnits = units.length ? units : Array.from({ length: 5 }, (_, i) => ({ id: i + 1, name: `Unit ${i + 1}`, topics: [] }));

  content.innerHTML = `
  <div style="padding:2rem;max-width:1200px;margin:0 auto;width:100%;">
    <button class="back-btn" onclick="renderAdminSectionFull('subjects')">← Back to Subjects</button>
    <div style="margin:1rem 0 1.5rem;">
      <h2 style="font-size:1.3rem;font-weight:800;letter-spacing:-0.02em;margin-bottom:4px;">📖 ${s.name}</h2>
      <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:10px;">
        <span class="badge badge-primary">${s.sem}</span>
        <span class="badge badge-teal">${s.uni || 'JNTUK'}</span>
        <span class="badge badge-lavender">${s.reg || 'R23'}</span>
        <span class="badge badge-amber">${s.branch || 'CSE'}</span>
      </div>
    </div>

    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:1rem;">
      <h3 style="font-size:1rem;font-weight:700;">📚 Units</h3>
      ${!s.isBuiltin ? `<button class="btn btn-primary btn-sm" onclick="adminAddUnit(${s.id})">+ Add Unit</button>` : ''}
    </div>

    <div id="admin-units-list">
      ${defaultUnits.map((u, ui) => `
        <div class="card" style="margin-bottom:1rem;">
          <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px;">
            <div style="width:36px;height:36px;border-radius:8px;background:var(--primary-light);display:flex;align-items:center;justify-content:center;font-weight:800;color:var(--primary);flex-shrink:0;">${u.id}</div>
            <div style="flex:1;font-weight:700;font-size:0.95rem;">${u.name}</div>
            ${!s.isBuiltin ? `
              <button class="btn-icon" onclick="adminEditUnit(${s.id},${ui})" title="Edit Unit">✏️</button>
              <button class="btn-icon" onclick="adminDeleteUnit(${s.id},${ui})" title="Delete Unit" style="color:var(--red);">🗑</button>
            ` : ''}
          </div>

          <!-- Topics -->
          <div style="margin-left:46px;">
            <div style="font-size:0.72rem;font-weight:700;text-transform:uppercase;letter-spacing:0.07em;color:var(--text3);margin-bottom:8px;">Subtopics</div>
            ${(u.topics || []).map((t, ti) => `
              <div style="display:flex;align-items:center;gap:8px;padding:7px 10px;background:var(--surface2);border:1px solid var(--border);border-radius:var(--radius-sm);margin-bottom:4px;font-size:0.83rem;">
                <span style="flex:1;font-weight:600;">📌 ${t.name}</span>
                
                ${!s.isBuiltin ? `
                  <button class="btn-icon btn-sm" onclick="adminEditTopic(${s.id},${ui},${ti})" style="font-size:0.7rem;padding:3px 6px;" title="Edit">✏️</button>
                  <button class="btn-icon btn-sm" onclick="adminDeleteTopic(${s.id},${ui},${ti})" style="font-size:0.7rem;padding:3px 6px;color:var(--red);" title="Delete">✕</button>
                ` : ''}
              </div>`).join('')}
            ${!s.isBuiltin ? `
              <div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:8px;">
                <input class="input" id="admin-topic-name-${u.id}" placeholder="New subtopic name" style="max-width:200px;">
                <input class="input" id="admin-topic-url-${u.id}" placeholder="YouTube URL (optional)" style="max-width:240px;">
                <button class="btn btn-teal btn-sm" onclick="adminAddTopic(${s.id},${ui},${u.id})">+ Add Subtopic</button>
              </div>
            ` : ''}
          </div>

          <!-- Content management links -->
          <div style="margin-left:46px;margin-top:12px;padding-top:12px;border-top:1px solid var(--border);">
            <div style="font-size:0.72rem;font-weight:700;text-transform:uppercase;letter-spacing:0.07em;color:var(--text3);margin-bottom:8px;">Content</div>
            <div style="display:flex;gap:8px;flex-wrap:wrap;">
              <button class="btn btn-ghost btn-sm" onclick="adminManageContent('notes','${(s.name || '').replace(/'/g, "\\'")}',${u.id})">📄 Notes (${JSON.parse(localStorage.getItem('edusync_admin_notes') || '[]').filter(n => n.subject === s.name && parseInt(n.unit) === u.id).length})</button>
              <button class="btn btn-ghost btn-sm" onclick="adminManageContent('pyqs','${(s.name || '').replace(/'/g, "\\'")}',${u.id})">📝 PYQs (${JSON.parse(localStorage.getItem('edusync_admin_pyqs') || '[]').filter(p => p.subject === s.name && parseInt(p.unit) === u.id).length})</button>
              <button class="btn btn-ghost btn-sm" onclick="adminManageContent('iqs','${(s.name || '').replace(/'/g, "\\'")}',${u.id})">⭐ IQs (${JSON.parse(localStorage.getItem('edusync_admin_iqs') || '[]').filter(q => q.subject === s.name && parseInt(q.unit) === u.id).length})</button>
              <button class="btn btn-ghost btn-sm" onclick="adminManageContent('videos','${(s.name || '').replace(/'/g, "\\'")}',${u.id})">🎬 Videos (${JSON.parse(localStorage.getItem('edusync_admin_videos') || '[]').filter(v => v.subject === s.name && parseInt(v.unit) === u.id).length})</button>
            </div>
          </div>
        </div>`).join('')}
    </div>
  </div>
  ${getAdminModals()}`;

  window._adminCurrentSubject = s;
}

// ── Admin content management panel ──
export function adminManageContent(type, subjectName, unitId) {
  const content = document.getElementById('admin-content');
  const s = window._adminCurrentSubject;
  const subjectOptions = `<option value="${subjectName}" selected>${subjectName}</option>`;
  const unitOptions = `<option value="${unitId}" selected>Unit ${unitId}</option>`;

  const adminNotes = JSON.parse(localStorage.getItem('edusync_admin_notes') || '[]');
  const adminPYQs = JSON.parse(localStorage.getItem('edusync_admin_pyqs') || '[]');
  const adminIQs = JSON.parse(localStorage.getItem('edusync_admin_iqs') || '[]');
  const adminVideos = JSON.parse(localStorage.getItem('edusync_admin_videos') || '[]');

  let panelHTML = '';

  if (type === 'notes') {
    const unitNotes = adminNotes.filter(n => n.subject === subjectName && parseInt(n.unit) === parseInt(unitId));
    panelHTML = `
      <h3 style="margin-bottom:1rem;">📄 Notes — ${subjectName} / Unit ${unitId}</h3>
      <div class="card" style="margin-bottom:1rem;">
        <h4 style="margin-bottom:0.8rem;">Add Note</h4>
        <div class="input-group"><label>Title</label><input class="input" id="cm-note-title" placeholder="Note title"></div>
        <div class="form-row">
          <div class="input-group"><label>Type</label><select class="select" id="cm-note-type"><option value="pdf">PDF</option><option value="doc">DOC</option><option value="link">Link</option></select></div>
          <div class="input-group"><label>Link/URL</label><input class="input" id="cm-note-link" placeholder="https://..."></div>
        </div>
        <button class="btn btn-primary btn-sm" onclick="adminAddContentNote('${subjectName.replace(/'/g, "\\'")}',${unitId})">+ Add Note</button>
      </div>
      <div>
        ${unitNotes.map(n => `
          <div style="display:flex;align-items:center;gap:8px;padding:9px 12px;border:1px solid var(--border);border-radius:var(--radius-sm);margin-bottom:6px;font-size:0.83rem;">
            <span style="font-size:1.1rem;">${n.type === 'pdf' ? '📄' : n.type === 'doc' ? '📝' : '🔗'}</span>
            <div style="flex:1;"><div style="font-weight:600;">${n.title}</div><div style="font-size:0.72rem;color:var(--text3);">${n.type?.toUpperCase()} · ${n.uploadedAt || ''}</div></div>
            <button class="btn-icon" onclick="adminEditNote(${n.id})" style="font-size:0.8rem;">✏️</button>
            <button class="btn-icon" onclick="adminDeleteNoteConfirm(${n.id},'${(n.title || '').replace(/'/g, "\\'")}','${subjectName.replace(/'/g, "\\'")}',${unitId})" style="color:var(--red);font-size:0.8rem;">🗑</button>
          </div>`).join('')}
        ${!unitNotes.length ? '<div style="color:var(--text3);text-align:center;padding:1rem;">No notes for this unit</div>' : ''}
      </div>`;
  } else if (type === 'pyqs') {
    const unitPYQs = adminPYQs.filter(p => p.subject === subjectName && parseInt(p.unit) === parseInt(unitId));
    panelHTML = `
      <h3 style="margin-bottom:1rem;">📝 PYQs — ${subjectName} / Unit ${unitId}</h3>
      <div class="card" style="margin-bottom:1rem;">
        <h4 style="margin-bottom:0.8rem;">Add PYQ</h4>
        <div class="input-group"><label>Question</label><textarea class="input" id="cm-pyq-text" rows="2" placeholder="Enter question..." style="resize:vertical;"></textarea></div>
        <div class="form-row">
          <div class="input-group"><label>Year</label><input class="input" id="cm-pyq-year" placeholder="2023" type="number"></div>
          <div class="input-group"><label>Repeated Count</label><input class="input" id="cm-pyq-count" placeholder="1" type="number" value="1"></div>
        </div>
        <div class="input-group"><label>Answer (optional)</label><textarea class="input" id="cm-pyq-ans" rows="2" placeholder="Answer..." style="resize:vertical;"></textarea></div>
        <button class="btn btn-primary btn-sm" onclick="adminAddContentPYQ('${subjectName.replace(/'/g, "\\'")}',${unitId})">+ Add PYQ</button>
      </div>
      <div>
        ${unitPYQs.map(p => `
          <div style="display:flex;align-items:flex-start;gap:8px;padding:9px 12px;border:1px solid var(--border);border-radius:var(--radius-sm);margin-bottom:6px;font-size:0.83rem;">
            <div style="flex:1;"><div style="font-weight:600;line-height:1.4;">${p.question.substring(0, 100)}${p.question.length > 100 ? '...' : ''}</div><div style="font-size:0.72rem;color:var(--text3);">Year: ${p.year} · ×${p.count}</div></div>
            <button class="btn-icon" onclick="adminEditPYQ(${p.id})" style="font-size:0.8rem;">✏️</button>
            <button class="btn-icon" onclick="adminDeletePYQConfirm(${p.id},'${subjectName.replace(/'/g, "\\'")}',${unitId})" style="color:var(--red);font-size:0.8rem;">🗑</button>
          </div>`).join('')}
        ${!unitPYQs.length ? '<div style="color:var(--text3);text-align:center;padding:1rem;">No PYQs for this unit</div>' : ''}
      </div>`;
  } else if (type === 'iqs') {
    const unitIQs = adminIQs.filter(q => q.subject === subjectName && parseInt(q.unit) === parseInt(unitId));
    panelHTML = `
      <h3 style="margin-bottom:1rem;">⭐ Important Questions — ${subjectName} / Unit ${unitId}</h3>
      <div class="card" style="margin-bottom:1rem;">
        <h4 style="margin-bottom:0.8rem;">Add Important Question</h4>
        <div class="input-group"><label>Question</label><textarea class="input" id="cm-iq-text" rows="2" placeholder="Enter important question..." style="resize:vertical;"></textarea></div>
        <div class="form-row">
          <div class="input-group"><label>Priority</label>
            <select class="select" id="cm-iq-priority"><option value="high">🔴 High</option><option value="med" selected>🟡 Medium</option><option value="low">🟢 Low</option></select>
          </div>
          <div class="input-group"><label>Tags</label><input class="input" id="cm-iq-tags" placeholder="Unit 1, Memory"></div>
        </div>
        <button class="btn btn-primary btn-sm" onclick="adminAddContentIQ('${subjectName.replace(/'/g, "\\'")}',${unitId})">+ Add Question</button>
      </div>
      <div>
        ${unitIQs.map(q => `
          <div style="display:flex;align-items:flex-start;gap:8px;padding:9px 12px;border:1px solid var(--border);border-radius:var(--radius-sm);margin-bottom:6px;font-size:0.83rem;">
            <div style="flex:1;"><div style="font-weight:600;line-height:1.4;">${q.question.substring(0, 100)}${q.question.length > 100 ? '...' : ''}</div><span class="badge ${q.priority === 'high' ? 'badge-red' : q.priority === 'med' ? 'badge-amber' : 'badge-green'}">${q.priority}</span></div>
            <button class="btn-icon" onclick="adminEditIQ(${q.id})" style="font-size:0.8rem;">✏️</button>
            <button class="btn-icon" onclick="adminDeleteIQConfirm(${q.id},'${subjectName.replace(/'/g, "\\'")}',${unitId})" style="color:var(--red);font-size:0.8rem;">🗑</button>
          </div>`).join('')}
        ${!unitIQs.length ? '<div style="color:var(--text3);text-align:center;padding:1rem;">No important questions for this unit</div>' : ''}
      </div>`;
  } else if (type === 'videos') {
    const unitVideos = adminVideos.filter(v => v.subject === subjectName && parseInt(v.unit) === parseInt(unitId));
    panelHTML = `
      <h3 style="margin-bottom:1rem;">🎬 Videos — ${subjectName} / Unit ${unitId}</h3>
      <div class="card" style="margin-bottom:1rem;">
        <h4 style="margin-bottom:0.8rem;">Add Video</h4>
        <div class="input-group"><label>Video Title</label><input class="input" id="cm-vid-title" placeholder="e.g. Introduction to Unit 1"></div>
        <div class="input-group"><label>YouTube URL</label><input class="input" id="cm-vid-url" placeholder="https://youtube.com/watch?v=..." type="url"></div>
        <button class="btn btn-primary btn-sm" onclick="adminAddContentVideo('${subjectName.replace(/'/g, "\\'")}',${unitId})">+ Add Video</button>
      </div>
      <div>
        ${unitVideos.map(v => `
          <div style="display:flex;align-items:center;gap:8px;padding:9px 12px;border:1px solid var(--border);border-radius:var(--radius-sm);margin-bottom:6px;font-size:0.83rem;">
            <span style="font-size:1.2rem;">🎬</span>
            <div style="flex:1;"><div style="font-weight:600;">${v.title}</div><div style="font-size:0.72rem;color:var(--text3);">${v.url || 'No URL'}</div></div>
            <button class="btn-icon" onclick="adminEditVideo(${v.id})" style="font-size:0.8rem;">✏️</button>
            <button class="btn-icon" onclick="adminDeleteVideoConfirm(${v.id},'${subjectName.replace(/'/g, "\\'")}',${unitId})" style="color:var(--red);font-size:0.8rem;">🗑</button>
          </div>`).join('')}
        ${!unitVideos.length ? '<div style="color:var(--text3);text-align:center;padding:1rem;">No videos for this unit</div>' : ''}
      </div>`;
  }

  content.innerHTML = `
  <div style="padding:2rem;max-width:1100px;margin:0 auto;width:100%;">
    <button class="back-btn" onclick="adminOpenSubject(window._adminCurrentSubject)">← Back to Units</button>
    <div style="margin-top:1.5rem;">${panelHTML}</div>
  </div>
  ${getAdminModals()}`;
}

// ── Content CRUD helpers ──
export function adminAddContentNote(subjectName, unitId) {
  const title = document.getElementById('cm-note-title')?.value.trim();
  const type = document.getElementById('cm-note-type')?.value;
  const link = document.getElementById('cm-note-link')?.value.trim();
  if (!title) { showToast('Enter note title', 'red'); return; }
  const notes = JSON.parse(localStorage.getItem('edusync_admin_notes') || '[]');
  notes.push({ id: Date.now(), title, type, link, subject: subjectName, unit: unitId, uploadedAt: new Date().toLocaleDateString() });
  localStorage.setItem('edusync_admin_notes', JSON.stringify(notes));
  showToast('✅ Note added!', 'green');
  adminManageContent('notes', subjectName, unitId);
}

export function adminAddContentPYQ(subjectName, unitId) {
  const question = document.getElementById('cm-pyq-text')?.value.trim();
  const year = document.getElementById('cm-pyq-year')?.value;
  const count = document.getElementById('cm-pyq-count')?.value || '1';
  const answer = document.getElementById('cm-pyq-ans')?.value.trim();
  if (!question || !year) { showToast('Enter question and year', 'red'); return; }
  const pyqs = JSON.parse(localStorage.getItem('edusync_admin_pyqs') || '[]');
  pyqs.push({ id: Date.now(), question, year, count: parseInt(count), answer, subject: subjectName, unit: unitId });
  localStorage.setItem('edusync_admin_pyqs', JSON.stringify(pyqs));
  showToast('✅ PYQ added!', 'green');
  adminManageContent('pyqs', subjectName, unitId);
}

export function adminAddContentIQ(subjectName, unitId) {
  const question = document.getElementById('cm-iq-text')?.value.trim();
  const priority = document.getElementById('cm-iq-priority')?.value;
  const tags = document.getElementById('cm-iq-tags')?.value.trim();
  if (!question) { showToast('Enter question', 'red'); return; }
  const iqs = JSON.parse(localStorage.getItem('edusync_admin_iqs') || '[]');
  iqs.push({ id: Date.now(), question, priority, tags, subject: subjectName, unit: unitId });
  localStorage.setItem('edusync_admin_iqs', JSON.stringify(iqs));
  showToast('✅ Important question added!', 'green');
  adminManageContent('iqs', subjectName, unitId);
}

export function adminAddContentVideo(subjectName, unitId) {
  const title = document.getElementById('cm-vid-title')?.value.trim();
  const url = document.getElementById('cm-vid-url')?.value.trim();
  if (!title || !url) { showToast('Enter title and URL', 'red'); return; }
  const videos = JSON.parse(localStorage.getItem('edusync_admin_videos') || '[]');
  videos.push({ id: Date.now(), title, url, subject: subjectName, unit: unitId });
  localStorage.setItem('edusync_admin_videos', JSON.stringify(videos));
  showToast('✅ Video added!', 'green');
  adminManageContent('videos', subjectName, unitId);
}

// ── Edit note/pyq/iq/video (uses prompt for quick edit) ──
export function adminEditNote(id) {
  const notes = JSON.parse(localStorage.getItem('edusync_admin_notes') || '[]');
  const n = notes.find(x => x.id === id);
  if (!n) return;
  const newTitle = prompt('Edit note title:', n.title);
  if (!newTitle) return;
  const newLink = prompt('Edit link/URL:', n.link || '');
  n.title = newTitle.trim();
  if (newLink !== null) n.link = newLink.trim();
  localStorage.setItem('edusync_admin_notes', JSON.stringify(notes));
  showToast('✅ Note updated!', 'green');
  adminManageContent('notes', n.subject, n.unit);
}

export function adminEditPYQ(id) {
  const pyqs = JSON.parse(localStorage.getItem('edusync_admin_pyqs') || '[]');
  const p = pyqs.find(x => x.id === id);
  if (!p) return;
  const newQ = prompt('Edit question:', p.question);
  if (!newQ) return;
  const newYear = prompt('Edit year:', p.year);
  const newCount = prompt('Edit repeated count:', p.count);
  p.question = newQ.trim();
  if (newYear) p.year = newYear;
  if (newCount) p.count = parseInt(newCount);
  localStorage.setItem('edusync_admin_pyqs', JSON.stringify(pyqs));
  showToast('✅ PYQ updated!', 'green');
  adminManageContent('pyqs', p.subject, p.unit);
}

export function adminEditIQ(id) {
  const iqs = JSON.parse(localStorage.getItem('edusync_admin_iqs') || '[]');
  const q = iqs.find(x => x.id === id);
  if (!q) return;
  const newQ = prompt('Edit question:', q.question);
  if (!newQ) return;
  const newPriority = prompt('Edit priority (high/med/low):', q.priority);
  q.question = newQ.trim();
  if (newPriority && ['high', 'med', 'low'].includes(newPriority)) q.priority = newPriority;
  localStorage.setItem('edusync_admin_iqs', JSON.stringify(iqs));
  showToast('✅ Question updated!', 'green');
  adminManageContent('iqs', q.subject, q.unit);
}

export function adminEditVideo(id) {
  const videos = JSON.parse(localStorage.getItem('edusync_admin_videos') || '[]');
  const v = videos.find(x => x.id === id);
  if (!v) return;
  const newTitle = prompt('Edit video title:', v.title);
  if (!newTitle) return;
  const newUrl = prompt('Edit YouTube URL:', v.url || '');
  v.title = newTitle.trim();
  if (newUrl !== null) v.url = newUrl.trim();
  localStorage.setItem('edusync_admin_videos', JSON.stringify(videos));
  showToast('✅ Video updated!', 'green');
  adminManageContent('videos', v.subject, v.unit);
}

// ── Delete confirm helpers ──
export function adminDeleteNoteConfirm(id, title, subjectName, unitId) {
  if (!confirm(`Delete note "${title}"?`)) return;
  const notes = JSON.parse(localStorage.getItem('edusync_admin_notes') || '[]');
  localStorage.setItem('edusync_admin_notes', JSON.stringify(notes.filter(n => n.id !== id)));
  showToast('Note deleted', 'red');
  adminManageContent('notes', subjectName, unitId);
}

export function adminDeletePYQConfirm(id, subjectName, unitId) {
  if (!confirm('Delete this PYQ?')) return;
  const pyqs = JSON.parse(localStorage.getItem('edusync_admin_pyqs') || '[]');
  localStorage.setItem('edusync_admin_pyqs', JSON.stringify(pyqs.filter(p => p.id !== id)));
  showToast('PYQ deleted', 'red');
  adminManageContent('pyqs', subjectName, unitId);
}

export function adminDeleteIQConfirm(id, subjectName, unitId) {
  if (!confirm('Delete this important question?')) return;
  const iqs = JSON.parse(localStorage.getItem('edusync_admin_iqs') || '[]');
  localStorage.setItem('edusync_admin_iqs', JSON.stringify(iqs.filter(q => q.id !== id)));
  showToast('Question deleted', 'red');
  adminManageContent('iqs', subjectName, unitId);
}

export function adminDeleteVideoConfirm(id, subjectName, unitId) {
  if (!confirm('Delete this video?')) return;
  const videos = JSON.parse(localStorage.getItem('edusync_admin_videos') || '[]');
  localStorage.setItem('edusync_admin_videos', JSON.stringify(videos.filter(v => v.id !== id)));
  showToast('Video deleted', 'red');
  adminManageContent('videos', subjectName, unitId);
}

// ── Admin unit management ──
export function adminAddUnit(subjId) {
  const name = prompt('Unit name:');
  if (!name) return;
  const units = JSON.parse(localStorage.getItem('edusync_units_' + subjId) || '[]');
  const newId = units.length ? Math.max(...units.map(u => u.id)) + 1 : 1;
  units.push({ id: newId, name: name.trim(), topics: [] });
  localStorage.setItem('edusync_units_' + subjId, JSON.stringify(units));
  showToast('✅ Unit added!', 'green');
  adminOpenSubject(window._adminCurrentSubject);
}

export function adminEditUnit(subjId, idx) {
  const units = JSON.parse(localStorage.getItem('edusync_units_' + subjId) || '[]');
  if (!units[idx]) return;
  const newName = prompt('Edit unit name:', units[idx].name);
  if (!newName) return;
  units[idx].name = newName.trim();
  localStorage.setItem('edusync_units_' + subjId, JSON.stringify(units));
  showToast('✅ Unit updated!', 'green');
  adminOpenSubject(window._adminCurrentSubject);
}

export function adminDeleteUnit(subjId, idx) {
  if (!confirm('Delete this unit and all its topics?')) return;
  const units = JSON.parse(localStorage.getItem('edusync_units_' + subjId) || '[]');
  units.splice(idx, 1);
  localStorage.setItem('edusync_units_' + subjId, JSON.stringify(units));
  showToast('Unit deleted', 'red');
  adminOpenSubject(window._adminCurrentSubject);
}

export function adminAddTopic(subjId, unitIdx, unitId) {
  const nameInput = document.getElementById('admin-topic-name-' + unitId);
  const urlInput = document.getElementById('admin-topic-url-' + unitId);
  const name = nameInput?.value.trim();
  const url = urlInput?.value.trim();
  if (!name) { showToast('Enter subtopic name', 'red'); return; }
  let units = JSON.parse(localStorage.getItem('edusync_units_' + subjId) || '[]');
  if (!units.length) {
    units = Array.from({ length: 5 }, (_, i) => ({ id: i + 1, name: `Unit ${i + 1}`, topics: [] }));
  }
  if (!units[unitIdx]) return;
  if (!units[unitIdx].topics) units[unitIdx].topics = [];
  const topic = {
    id: Date.now() + Math.random(),
    topicName: name,
    youtubeUrl: url,
    name,
    url,
    notes: [],
    pyqs: [],
    importantQuestions: []
  };
  console.log('Saving Topic:', topic);
  units[unitIdx].topics.push(topic);
  localStorage.setItem('edusync_units_' + subjId, JSON.stringify(units));
  showToast('✅ Subtopic added!', 'green');
  adminOpenSubject(window._adminCurrentSubject);
}

export function adminEditTopic(subjId, unitIdx, topicIdx) {
  const units = JSON.parse(localStorage.getItem('edusync_units_' + subjId) || '[]');
  if (!units[unitIdx]?.topics?.[topicIdx]) return;
  const t = units[unitIdx].topics[topicIdx];
  const newName = prompt('Edit topic name:', t.topicName || t.name || '');
  if (!newName) return;
  const newUrl = prompt('Edit YouTube URL (optional):', t.youtubeUrl || t.url || '');
  t.topicName = newName.trim();
  t.name = newName.trim();
  if (newUrl !== null) {
    t.youtubeUrl = newUrl.trim();
    t.url = newUrl.trim();
  }
  console.log('Saving Topic:', t);
  localStorage.setItem('edusync_units_' + subjId, JSON.stringify(units));
  showToast('✅ Topic updated!', 'green');
  adminOpenSubject(window._adminCurrentSubject);
}

export function adminDeleteTopic(subjId, unitIdx, topicIdx) {
  if (!confirm('Delete this topic?')) return;
  const units = JSON.parse(localStorage.getItem('edusync_units_' + subjId) || '[]');
  if (units[unitIdx]?.topics) {
    units[unitIdx].topics.splice(topicIdx, 1);
    localStorage.setItem('edusync_units_' + subjId, JSON.stringify(units));
  }
  showToast('Topic deleted', 'red');
  adminOpenSubject(window._adminCurrentSubject);
}

// ── Admin edit/delete subject ──
export function adminEditSubjectModal(id) {
  const subjects = JSON.parse(localStorage.getItem('edusync_custom_subjects') || '[]');
  const s = subjects.find(x => x.id === id);
  if (!s) return;
  const newName = prompt('Edit subject name:', s.name);
  if (!newName) return;
  const newSem = prompt('Edit semester (e.g. 2-1):', s.sem);
  const newReg = prompt('Edit regulation (e.g. R23):', s.reg);
  const newUni = prompt('Edit university:', s.uni);
  const newBranch = prompt('Edit branch (e.g. CSE):', s.branch);
  s.name = newName.trim();
  if (newSem) s.sem = newSem.trim();
  if (newReg) s.reg = newReg.trim();
  if (newUni) s.uni = newUni.trim();
  if (newBranch) s.branch = newBranch.trim();
  localStorage.setItem('edusync_custom_subjects', JSON.stringify(subjects));
  showToast('✅ Subject updated!', 'green');
  renderAdminSectionFull('subjects');
}

export function adminDeleteSubjectConfirm(id, name) {
  if (!confirm(`Delete subject "${name}" and all its data (units, topics, content)?`)) return;
  const subjects = JSON.parse(localStorage.getItem('edusync_custom_subjects') || '[]');
  localStorage.setItem('edusync_custom_subjects', JSON.stringify(subjects.filter(s => s.id !== id)));
  // Clean up related data
  localStorage.removeItem('edusync_units_' + id);
  ['edusync_admin_notes', 'edusync_admin_pyqs', 'edusync_admin_iqs', 'edusync_admin_videos'].forEach(key => {
    const items = JSON.parse(localStorage.getItem(key) || '[]');
    localStorage.setItem(key, JSON.stringify(items.filter(x => x.subject !== name)));
  });
  showToast('Subject deleted', 'red');
  renderAdminSectionFull('subjects');
}

// ── Admin SubAdmin edit helper ──
export function adminEditSubAdminEntry(idx) {
  const subAdmins = JSON.parse(localStorage.getItem('edusync_subadmins') || '[]');
  if (!subAdmins[idx]) return;
  const sa = subAdmins[idx];
  const newPass = prompt('New password for ' + sa.username + ':', sa.password);
  if (!newPass) return;
  const newBranch = prompt('Branch:', sa.branch);
  sa.password = newPass;
  if (newBranch) sa.branch = newBranch;
  localStorage.setItem('edusync_subadmins', JSON.stringify(subAdmins));
  showToast('✅ Sub Admin updated!', 'green');
  renderAdminSectionFull('create');
}

// ── Skill Up v2 helpers ──
export function adminCreateSkillV2() {
  const name = document.getElementById('adm-skillname2')?.value.trim();
  const desc = document.getElementById('adm-skilldesc2')?.value.trim();
  const cat = document.getElementById('adm-skillcat2')?.value;
  const level = document.getElementById('adm-skilllevel2')?.value;
  const icon = document.getElementById('adm-skillicon2')?.value.trim() || '⚡';
  const duration = document.getElementById('adm-skillduration2')?.value.trim();
  if (!name) { showToast('Enter skill name', 'red'); return; }
  const skills = JSON.parse(localStorage.getItem('edusync_skills') || '[]');
  skills.push({ id: Date.now(), name, description: desc, category: cat, level, icon, duration });
  localStorage.setItem('edusync_skills', JSON.stringify(skills));
  showToast('✅ Skill course created!', 'green');
  switchAdminSection('skillup');
}

export function adminAddSkillVideoV2() {
  const skillId = document.getElementById('adm-skillvid-skill2')?.value;
  const title = document.getElementById('adm-skillvid-title2')?.value.trim();
  const url = document.getElementById('adm-skillvid-url2')?.value.trim();
  if (!skillId || !title || !url) { showToast('Fill all video fields', 'red'); return; }
  const videos = JSON.parse(localStorage.getItem('edusync_skill_videos') || '[]');
  videos.push({ id: Date.now(), skillId, title, url });
  localStorage.setItem('edusync_skill_videos', JSON.stringify(videos));
  showToast('✅ Video added to skill!', 'green');
  switchAdminSection('skillup');
}

// ── Modal HTML shared helper ──
export function getAdminModals() {
  return `
  <div class="modal-overlay" id="admin-confirm-modal" onclick="if(event.target===this)this.classList.remove('open')">
    <div class="modal">
      <div id="admin-confirm-body"></div>
      <div style="display:flex;gap:10px;justify-content:flex-end;margin-top:1.5rem;">
        <button class="btn btn-ghost" onclick="document.getElementById('admin-confirm-modal').classList.remove('open')">Cancel</button>
        <button class="btn btn-danger" id="admin-confirm-ok">Confirm Delete</button>
      </div>
    </div>
  </div>`;
}

// ── Full Sub Admin section renderer ──
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

// ── Override renderAdminDashboard to handle new sections ──
renderAdminDashboard = function (activeTab) {
  const sectionMap = { overview: 'dashboard', subadmins: 'create', urls: 'approvals' };
  const section = sectionMap[activeTab] || activeTab || 'dashboard';
  renderAdminSectionFull(section);
};

// ── Override launchAdminDashboard ──
launchAdminDashboard = function () {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById('screen-admin').classList.add('active');
  document.getElementById('admin-role-label').textContent = 'Full Administrator';
  document.getElementById('create-subadmin-btn').style.display = 'flex';
  document.getElementById('admin-sidebar-name').textContent = 'Administrator';
  document.getElementById('admin-sidebar-role').textContent = 'Full Access';
  const preserved = String(window.__aimeasyPreserveRoleRoute || '');
  const [, section] = preserved.split('/').filter(Boolean);
  switchAdminSection(section || 'dashboard');
};

// ── Override launchSubAdmin ──
launchSubAdmin = function () {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById('screen-subadmin').classList.add('active');
  const sa = APP.subAdminData || {};
  const saNameEl = document.getElementById('sa-sidebar-name');
  const saInfoEl = document.getElementById('sa-sidebar-info');
  if (saNameEl) saNameEl.textContent = sa.username || 'Sub Admin';
  if (saInfoEl) saInfoEl.textContent = (sa.branch || 'Content Manager');
  const preserved = String(window.__aimeasyPreserveRoleRoute || '');
  const [, section] = preserved.split('/').filter(Boolean);
  switchSASection(section || 'dashboard');
};

// ── SA subjects section with filter ──
const _origRenderSASection = renderSASection;
renderSASection = function (section) {
  const content = document.getElementById('sa-content');
  if (!content) return;
  const customSubjects = JSON.parse(localStorage.getItem('edusync_custom_subjects') || '[]');
  const sa = APP.subAdminData || {};

  if (section === 'subjects') {
    const allSems = ['1-1', '1-2', '2-1', '2-2', '3-1', '3-2', '4-1', '4-2'];
    const branches = ['CSE', 'ECE', 'EEE', 'IT', 'AIML', 'AIDS', 'MECH', 'CIVIL'];
    const unis = ['JNTUK', 'JNTUH', 'Andhra University'];
    const regs = ['R23', 'R20', 'R19', 'R16'];
    const savedFilter = window._saSubjectFilter || {};
    const filterBranch = savedFilter.branch || sa.branch || '';
    const filterSem = savedFilter.sem || '';
    const filterReg = savedFilter.reg || '';
    const filterUni = savedFilter.uni || '';

    let mySubs = customSubjects;
    if (filterBranch) mySubs = mySubs.filter(s => s.branch === filterBranch);
    if (filterSem) mySubs = mySubs.filter(s => s.sem === filterSem);
    if (filterReg) mySubs = mySubs.filter(s => s.reg === filterReg);
    if (filterUni) mySubs = mySubs.filter(s => s.uni === filterUni);

    content.innerHTML = `
    <div style="padding:2rem;max-width:1100px;margin:0 auto;width:100%;">
      <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px;margin-bottom:1rem;">
        <h2 style="font-size:1.4rem;font-weight:800;letter-spacing:-0.02em;">📚 Manage Subjects</h2>
        <button class="btn btn-primary" onclick="openSACreateSubjectForm()">+ Add Subject</button>
      </div>
      <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:1.2rem;">
        <select class="select" style="width:120px;" onchange="window._saSubjectFilter=Object.assign(window._saSubjectFilter||{},{uni:this.value});renderSASection('subjects')">
          <option value="">All Universities</option>${unis.map(u => `<option value="${u}" ${filterUni === u ? 'selected' : ''}>${u}</option>`).join('')}
        </select>
        <select class="select" style="width:120px;" onchange="window._saSubjectFilter=Object.assign(window._saSubjectFilter||{},{reg:this.value});renderSASection('subjects')">
          <option value="">All Regulations</option>${regs.map(r => `<option value="${r}" ${filterReg === r ? 'selected' : ''}>${r}</option>`).join('')}
        </select>
        <select class="select" style="width:110px;" onchange="window._saSubjectFilter=Object.assign(window._saSubjectFilter||{},{sem:this.value});renderSASection('subjects')">
          <option value="">All Semesters</option>${allSems.map(s => `<option value="${s}" ${filterSem === s ? 'selected' : ''}>${s}</option>`).join('')}
        </select>
        <select class="select" style="width:110px;" onchange="window._saSubjectFilter=Object.assign(window._saSubjectFilter||{},{branch:this.value});renderSASection('subjects')">
          <option value="">All Branches</option>${branches.map(b => `<option value="${b}" ${filterBranch === b ? 'selected' : ''}>${b}</option>`).join('')}
        </select>
      </div>
      <div id="sa-create-subject-form" style="display:none;margin-bottom:1.5rem;">
        <div class="card">
          <h3 style="margin-bottom:1rem;">Create New Subject</h3>
          <div class="form-row">
            <div class="input-group"><label>Branch</label>
              <select class="select" id="sa-sub-branch"><option value="">Select Branch</option>
                ${branches.map(b => `<option value="${b}" ${sa.branch === b ? 'selected' : ''}>${b}</option>`).join('')}
              </select>
            </div>
            <div class="input-group"><label>Year</label>
              <select class="select" id="sa-sub-year"><option value="">Select Year</option>
                ${['1', '2', '3', '4'].map(y => `<option value="${y}">Year ${y}</option>`).join('')}
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
                ${unis.map(u => `<option value="${u}">${u}</option>`).join('')}
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
            <button class="btn btn-primary" onclick="saCreateSubjectNew()" style="flex:1;">+ Create Subject</button>
            <button class="btn btn-ghost" onclick="document.getElementById('sa-create-subject-form').style.display='none'">Cancel</button>
          </div>
        </div>
      </div>
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:1rem;">
        ${mySubs.map(s => `
          <div class="card" style="padding:1.2rem;cursor:pointer;" onclick="renderSAUnitsPage(${JSON.stringify(s).replace(/"/g, '&quot;')})">
            <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:8px;margin-bottom:8px;">
              <div style="font-weight:700;font-size:0.92rem;">📖 ${s.name}</div>
              <div style="display:flex;gap:4px;" onclick="event.stopPropagation()">
                <button class="btn-icon" onclick="saEditSubject(${s.id})" style="font-size:0.8rem;padding:5px;" title="Edit">✏️</button>
                <button class="btn-icon" onclick="saDeleteSubjectConfirm(${s.id},'${(s.name || '').replace(/'/g, "\\'")}','${(s.branch || '').replace(/'/g, "\\'")}',${s.sem ? `'${s.sem}'` : 'undefined'})" style="font-size:0.8rem;padding:5px;color:var(--red);" title="Delete">🗑</button>
              </div>
            </div>
            <div style="font-size:0.75rem;color:var(--text3);margin-bottom:8px;">${s.code || '—'} · ${s.credits || 3} Cr · ${s.branch || 'CSE'}</div>
            <div style="display:flex;gap:6px;flex-wrap:wrap;">
              <span class="badge badge-primary">${s.sem || '—'}</span>
              <span class="badge badge-teal">${s.uni || 'JNTUK'}</span>
              <span class="badge badge-lavender">${s.reg || 'R23'}</span>
            </div>
            <div style="font-size:0.75rem;color:var(--primary);font-weight:600;margin-top:8px;">📋 Click to manage →</div>
          </div>`).join('')}
        ${!mySubs.length ? '<div style="color:var(--text3);text-align:center;padding:2rem;grid-column:1/-1;">No subjects match this filter</div>' : ''}
      </div>
    </div>`;
    return;
  }

  _origRenderSASection(section);
};

openSACreateSubjectForm = function () {
  const form = document.getElementById('sa-create-subject-form');
  if (form) form.style.display = form.style.display === 'none' ? 'block' : 'none';
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

/* ═══════════════════════════════════════════════════════════════════════
   V10 CURRICULUM SYSTEM — Complete clean replacement
   Handles: Admin 3-dot menus, SA subject→unit→roadmap+content flow
   ═══════════════════════════════════════════════════════════════════════ */

/* ── Inject styles once ── */
(function () {
  if (document.getElementById('v10-styles')) return;
  const el = document.createElement('style');
  el.id = 'v10-styles';
  el.textContent = `
/* ── 3-dot popup ── */
.v10-dot-wrap { position:relative; display:inline-block; }
.v10-dot-btn {
  width:30px; height:30px; border-radius:8px; background:transparent; border:none;
  cursor:pointer; font-size:1.3rem; color:var(--text3); display:flex; align-items:center;
  justify-content:center; transition:background 0.15s;
}
.v10-dot-btn:hover { background:var(--surface2); color:var(--text); }
.v10-popup {
  position:absolute; top:calc(100% + 4px); right:0; z-index:500;
  background:var(--surface); border:1px solid var(--border);
  border-radius:var(--radius-md); box-shadow:0 8px 32px rgba(0,0,0,0.12);
  min-width:160px; overflow:hidden;
  animation:scaleIn .15s cubic-bezier(.34,1.56,.64,1) both;
  transform-origin:top right;
}
.v10-popup-item {
  display:flex; align-items:center; gap:10px;
  padding:10px 16px; font-size:0.84rem; font-weight:500;
  cursor:pointer; border:none; background:transparent;
  width:100%; text-align:left; color:var(--text); transition:background .15s;
}
.v10-popup-item:hover { background:var(--surface2); }
.v10-popup-item.red { color:var(--red); }
.v10-popup-item.red:hover { background:var(--red-light); }
.v10-popup-item.muted { color:var(--text3); cursor:default; font-size:0.78rem; }
.v10-popup-item.muted:hover { background:transparent; }

/* ── Subject grid ── */
.v10-subj-grid {
  display:grid;
  grid-template-columns:repeat(auto-fill, minmax(268px,1fr));
  gap:1rem;
}
.v10-subj-card {
  background:var(--surface); border:1.5px solid var(--border);
  border-radius:var(--radius-lg); padding:1.3rem 1.3rem 1.1rem;
  cursor:pointer; transition:var(--transition); position:relative; overflow:visible;
}
.v10-subj-card:hover {
  border-color:var(--primary); transform:translateY(-3px);
  box-shadow:0 6px 24px rgba(79,142,247,0.14);
}
.v10-subj-icon {
  width:44px; height:44px; border-radius:var(--radius-sm);
  background:linear-gradient(135deg,var(--primary-light),var(--lavender-light));
  display:flex; align-items:center; justify-content:center;
  font-size:1.4rem; margin-bottom:10px; flex-shrink:0;
}
.v10-subj-name { font-weight:700; font-size:0.94rem; margin-bottom:3px; }
.v10-subj-meta { font-size:0.74rem; color:var(--text3); margin-bottom:10px; }
.v10-arrow { font-size:0.74rem; font-weight:600; color:var(--primary); margin-top:8px; }

/* ── Unit cards ── */
.v10-unit-grid {
  display:grid;
  grid-template-columns:repeat(auto-fill, minmax(240px,1fr));
  gap:1rem; margin-top:1rem;
}
.v10-unit-card {
  background:var(--surface); border:1.5px solid var(--border);
  border-radius:var(--radius-lg); padding:1.2rem;
  cursor:pointer; transition:var(--transition); position:relative;
}
.v10-unit-card:hover {
  border-color:var(--lavender); transform:translateY(-3px);
  box-shadow:0 6px 24px rgba(139,117,245,0.14);
}
.v10-unit-num {
  width:44px; height:44px; border-radius:var(--radius-sm);
  background:linear-gradient(135deg,var(--lavender),var(--primary));
  display:flex; align-items:center; justify-content:center;
  color:#fff; font-weight:800; font-size:1.15rem; margin-bottom:10px;
}
.v10-unit-name { font-weight:700; font-size:0.9rem; margin-bottom:4px; }
.v10-unit-meta { font-size:0.74rem; color:var(--text3); }
.v10-unit-badges { display:flex; gap:5px; flex-wrap:wrap; margin-top:8px; }
.v10-unit-arrow { font-size:0.74rem; font-weight:600; color:var(--lavender); margin-top:8px; }

/* ── Unit detail 2-panel layout ── */
.v10-detail-wrap {
  display:grid; grid-template-columns:1fr 1fr;
  gap:1.4rem; margin-top:1.4rem; align-items:start;
}
@media(max-width:880px) { .v10-detail-wrap { grid-template-columns:1fr; } }

.v10-panel {
  background:var(--surface); border:1px solid var(--border);
  border-radius:var(--radius-lg); overflow:hidden;
}
.v10-panel-head {
  padding:.9rem 1.2rem;
  background:linear-gradient(135deg,var(--primary-light),var(--lavender-light));
  border-bottom:1px solid var(--border);
  display:flex; align-items:center; justify-content:space-between; gap:8px;
}
.v10-panel-head h4 { font-size:.9rem; font-weight:700; margin:0; }
.v10-panel-body { padding:1.1rem; }

/* ── Roadmap topics ── */
.v10-topic-row {
  display:flex; align-items:flex-start; gap:10px;
  margin-bottom:10px; position:relative;
}
.v10-topic-row::after {
  content:''; position:absolute; left:10px; top:22px;
  height:calc(100% + 6px); width:2px; background:var(--border); z-index:0;
}
.v10-topic-row:last-of-type::after { display:none; }
.v10-dot {
  width:20px; height:20px; border-radius:50%; flex-shrink:0; z-index:1; margin-top:11px;
  display:flex; align-items:center; justify-content:center;
  font-size:.55rem; font-weight:800; color:#fff;
  background:var(--border); border:2.5px solid var(--surface);
  box-shadow:0 0 0 2px var(--border-hover); transition:background .2s;
}
.v10-dot.filled { background:var(--primary); box-shadow:0 0 0 2px var(--primary-mid); }
.v10-topic-fields { flex:1; display:flex; flex-direction:column; gap:5px; }
.v10-topic-fields input {
  padding:8px 11px; border:1.5px solid var(--border);
  border-radius:var(--radius-sm); font-size:.83rem; font-family:var(--font);
  color:var(--text); outline:none; width:100%; transition:border-color .2s;
}
.v10-topic-fields input:focus { border-color:var(--primary); }
.v10-topic-fields input.filled { border-color:var(--primary-mid); }
.v10-rm-btn {
  width:28px; height:28px; border-radius:8px; background:transparent; border:none;
  cursor:pointer; color:var(--text3); font-size:.9rem; margin-top:10px; flex-shrink:0;
  display:flex; align-items:center; justify-content:center; transition:var(--transition);
}
.v10-rm-btn:hover { background:var(--red-light); color:var(--red); }

/* ── Content panel tabs ── */
.v10-tabs {
  display:flex; background:var(--surface2);
  border-bottom:1px solid var(--border); overflow-x:auto;
}
.v10-tab {
  padding:10px 14px; font-size:.82rem; font-weight:600;
  color:var(--text2); border:none; background:transparent;
  cursor:pointer; border-bottom:2.5px solid transparent;
  transition:var(--transition); white-space:nowrap;
}
.v10-tab.on { color:var(--lavender); border-bottom-color:var(--lavender); background:var(--surface); }
.v10-tab:hover:not(.on) { background:var(--surface); color:var(--text); }
.v10-pane { display:none; }
.v10-pane.on { display:block; }

/* ── Upload form ── */
.v10-form { padding:1.2rem; }
.v10-form p.hint {
  font-size:.79rem; color:var(--text2); margin-bottom:1rem; line-height:1.5;
}
.v10-label {
  display:block; font-size:.69rem; font-weight:700; text-transform:uppercase;
  letter-spacing:.08em; color:var(--text2); margin-bottom:4px;
}
.v10-2col { display:grid; grid-template-columns:1fr 1fr; gap:12px; }
.v10-submit {
  display:flex; align-items:center; justify-content:center; gap:8px;
  width:100%; padding:13px; border-radius:50px;
  background:linear-gradient(135deg,#7C5CFC,#9B7CFF);
  color:#fff; font-family:var(--font); font-size:.9rem; font-weight:700;
  border:none; cursor:pointer; margin-top:.9rem;
  box-shadow:0 4px 16px rgba(124,92,252,.35); transition:var(--transition);
}
.v10-submit:hover { background:linear-gradient(135deg,#6B4BEB,#8A6BEE); transform:translateY(-1px); }
.v10-submit:active { transform:scale(.97); }

/* ── Uploaded items list ── */
.v10-items { padding:0 1.2rem 1.2rem; }
.v10-items-head {
  font-size:.75rem; font-weight:700; color:var(--text2);
  margin-bottom:8px; padding-top:2px;
}
.v10-item {
  display:flex; align-items:flex-start; gap:8px;
  padding:9px 12px; background:var(--surface2);
  border:1px solid var(--border); border-radius:var(--radius-sm);
  margin-bottom:6px; font-size:.82rem;
}
.v10-item-body { flex:1; min-width:0; }
.v10-item-title { font-weight:600; line-height:1.35; }
.v10-item-meta { font-size:.71rem; color:var(--text3); margin-top:2px; }
.v10-del {
  width:26px; height:26px; border-radius:8px; border:none;
  background:transparent; cursor:pointer; color:var(--text3);
  font-size:.9rem; flex-shrink:0; display:flex; align-items:center;
  justify-content:center; transition:var(--transition);
}
.v10-del:hover { background:var(--red-light); color:var(--red); }

/* Create-subject form */
.v10-create-form {
  background:var(--surface); border:1.5px solid var(--primary-mid);
  border-radius:var(--radius-lg); padding:1.4rem; margin-bottom:1.4rem;
  animation:fadeIn .25s ease both;
}
`;
  document.head.appendChild(el);
})();

/* ── Close popups on outside click ── */
document.addEventListener('click', function (e) {
  if (!e.target.closest('.v10-dot-wrap')) {
    document.querySelectorAll('.v10-popup').forEach(p => p.remove());
  }
});

/* ═══════════════════════════════════════════════════════════════
   ADMIN: subjects section with clickable cards + 3-dot menu
   ═══════════════════════════════════════════════════════════════ */
export function v10AdminSubjects() {
  const content = document.getElementById('admin-content');
  if (!content) return;

  const customSubjects = JSON.parse(localStorage.getItem('edusync_custom_subjects') || '[]');
  const allSems = ['1-1', '1-2', '2-1', '2-2', '3-1', '3-2', '4-1', '4-2'];
  const managedUniversities = (() => { try { return JSON.parse(localStorage.getItem('edusync_universities') || '[]'); } catch (e) { return []; } })();
  const managedRegs = (() => {
    try {
      const cached = JSON.parse(localStorage.getItem('aimeasy_cached_regulations') || '[]');
      const legacy = JSON.parse(localStorage.getItem('edusync_regulations') || '[]');
      return [...new Set([...cached, ...legacy].map(item => String(item?.regulation_name || item?.regulation_code || item?.name || item || '').trim().toUpperCase()).filter(Boolean))];
    } catch (e) {
      return [];
    }
  })();
  const unis = [...new Set(['JNTUK', 'JNTUH', 'Andhra University', ...managedUniversities.map(u => u.name || u.code).filter(Boolean)])];
  const regs = managedRegs.length ? managedRegs : ['R23', 'R20', 'R19', 'R16'];
  const branches = ['CSE', 'ECE', 'EEE', 'IT', 'AIML', 'AIDS', 'MECH', 'CIVIL'];
  const f = window._v10AdminFilter || {};

  let all = [];
  allSems.forEach(sem => {
    (SUBJECTS_DB[sem] || []).forEach(s =>
      all.push({ ...s, sem, reg: 'R23', uni: 'JNTUK', branch: s.branch || 'CSE', isBuiltin: true })
    );
  });
  customSubjects.forEach(s => all.push({ ...s, isBuiltin: false }));

  if (f.uni) all = all.filter(s => s.uni === f.uni);
  if (f.reg) all = all.filter(s => s.reg === f.reg);
  if (f.sem) all = all.filter(s => s.sem === f.sem);
  if (f.branch) all = all.filter(s => (s.branch || 'CSE') === f.branch);

  const filterBar = `
  <div style="display:flex;gap:8px;flex-wrap:wrap;">
    <select class="select" style="width:130px;" onchange="window._v10AdminFilter=Object.assign(window._v10AdminFilter||{},{uni:this.value});v10AdminSubjects()">
      <option value="">All Universities</option>${unis.map(u => `<option value="${u}"${f.uni === u ? ' selected' : ''}>${u}</option>`).join('')}
    </select>
    <select class="select" style="width:115px;" onchange="window._v10AdminFilter=Object.assign(window._v10AdminFilter||{},{reg:this.value});v10AdminSubjects()">
      <option value="">All Regulations</option>${regs.map(r => `<option value="${r}"${f.reg === r ? ' selected' : ''}>${r}</option>`).join('')}
    </select>
    <select class="select" style="width:105px;" onchange="window._v10AdminFilter=Object.assign(window._v10AdminFilter||{},{sem:this.value});v10AdminSubjects()">
      <option value="">All Sems</option>${allSems.map(s => `<option value="${s}"${f.sem === s ? ' selected' : ''}>${s}</option>`).join('')}
    </select>
    <select class="select" style="width:110px;" onchange="window._v10AdminFilter=Object.assign(window._v10AdminFilter||{},{branch:this.value});v10AdminSubjects()">
      <option value="">All Branches</option>${branches.map(b => `<option value="${b}"${f.branch === b ? ' selected' : ''}>${b}</option>`).join('')}
    </select>
  </div>`;

  const cards = all.map(s => {
    const id = s.id || ('bi-' + s.sem + '-' + s.code);
    const safeName = (s.name || '').replace(/\\/g, '\\\\').replace(/'/g, "\\'");
    const safeS = encodeURIComponent(JSON.stringify(s));
    return `
    <div class="v10-subj-card" onclick="v10AdminOpenSubject('${safeS}')">
      <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:6px;">
        <div class="v10-subj-icon">${s.icon || '📖'}</div>
        <div class="v10-dot-wrap" onclick="event.stopPropagation()">
          <button class="v10-dot-btn" onclick="v10DotMenu(this,${JSON.stringify({ id: s.id, name: s.name, isBuiltin: !!s.isBuiltin }).replace(/"/g, '&quot;')})">⋯</button>
        </div>
      </div>
      <div class="v10-subj-name">${s.name}</div>
      <div class="v10-subj-meta">${s.code || '—'} · ${s.credits || 3} Cr · ${s.branch || 'CSE'}</div>
      <div style="display:flex;gap:5px;flex-wrap:wrap;margin-bottom:4px;">
        <span class="badge badge-primary">${s.sem}</span>
        <span class="badge badge-teal">${s.uni || 'JNTUK'}</span>
        <span class="badge badge-lavender">${s.reg || 'R23'}</span>
        ${s.isBuiltin ? '<span class="badge badge-green">Built-in</span>' : '<span class="badge badge-amber">Custom</span>'}
      </div>
      <div class="v10-arrow">🔍 Click to open & manage →</div>
    </div>`;
  }).join('');

  content.innerHTML = `
  <div style="padding:2rem;max-width:1200px;margin:0 auto;width:100%;">
    <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px;margin-bottom:1.2rem;">
      <h2 style="font-size:1.4rem;font-weight:800;letter-spacing:-.02em;">📚 All Subjects (${all.length})</h2>
      ${filterBar}
    </div>
    <p style="font-size:.79rem;color:var(--text3);margin-bottom:1rem;">Click a card to open & manage · Use ⋯ menu to edit or delete</p>
    <div class="v10-subj-grid">${cards || '<div style="color:var(--text3);text-align:center;padding:3rem;grid-column:1/-1;">No subjects match filters.</div>'}</div>
  </div>
  ${getAdminModals()}`;
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

export function v10AdminViewSubject(id, isBuiltin) {
  document.querySelectorAll('.v10-popup').forEach(p => p.remove());
  const customSubjects = JSON.parse(localStorage.getItem('edusync_custom_subjects') || '[]');
  let s = customSubjects.find(x => x.id === id);
  if (!s && isBuiltin) {
    const allSems = ['1-1', '1-2', '2-1', '2-2', '3-1', '3-2', '4-1', '4-2'];
    allSems.forEach(sem => {
      (SUBJECTS_DB[sem] || []).forEach(subj => { if (subj.id == id) s = { ...subj, sem, reg: 'R23', uni: 'JNTUK', isBuiltin: true }; });
    });
  }
  if (s) v10AdminOpenSubjectObj(s);
}

export function v10AdminEditSubject(id) {
  document.querySelectorAll('.v10-popup').forEach(p => p.remove());
  const subjects = JSON.parse(localStorage.getItem('edusync_custom_subjects') || '[]');
  const s = subjects.find(x => x.id === id);
  if (!s) return;
  const newName = prompt('Subject name:', s.name);
  if (!newName) return;
  const newSem = prompt('Semester (e.g. 3-1):', s.sem);
  const newReg = prompt('Regulation (R23/R20/R16):', s.reg);
  s.name = newName.trim();
  if (newSem) s.sem = newSem.trim();
  if (newReg) s.reg = newReg.trim();
  localStorage.setItem('edusync_custom_subjects', JSON.stringify(subjects));
  showToast('✅ Subject updated!', 'green');
  v10AdminSubjects();
}

export function v10AdminDeleteSubject(id, name) {
  document.querySelectorAll('.v10-popup').forEach(p => p.remove());
  if (!confirm(`Delete "${name}" and all its content? This cannot be undone.`)) return;
  const subjects = JSON.parse(localStorage.getItem('edusync_custom_subjects') || '[]');
  localStorage.setItem('edusync_custom_subjects', JSON.stringify(subjects.filter(s => s.id !== id)));
  localStorage.removeItem('edusync_units_' + id);
  showToast('Subject deleted', 'red');
  v10AdminSubjects();
}

export function v10AdminOpenSubject(encoded) {
  let s;
  try { s = JSON.parse(decodeURIComponent(encoded)); } catch (e) { return; }
  v10AdminOpenSubjectObj(s);
}

export function v10AdminOpenSubjectObj(s) {
  window._v10AdminSubj = s;
  const content = document.getElementById('admin-content');
  if (!content) return;
  const units = JSON.parse(localStorage.getItem('edusync_units_' + s.id) || '[]');
  const uList = units.length ? units : Array.from({ length: 5 }, (_, i) => ({ id: i + 1, name: `Unit ${i + 1}`, topics: [] }));

  const adminNotes = JSON.parse(localStorage.getItem('edusync_admin_notes') || '[]');
  const adminPYQs = JSON.parse(localStorage.getItem('edusync_admin_pyqs') || '[]');
  const adminIQs = JSON.parse(localStorage.getItem('edusync_admin_iqs') || '[]');
  const adminVideos = JSON.parse(localStorage.getItem('edusync_admin_videos') || '[]');

  const unitCards = uList.map((u, ui) => {
    const nC = adminNotes.filter(n => n.subject === s.name && parseInt(n.unit) === u.id).length;
    const pC = adminPYQs.filter(p => p.subject === s.name && parseInt(p.unit) === u.id).length;
    const iC = adminIQs.filter(q => q.subject === s.name && parseInt(q.unit) === u.id).length;
    const vC = adminVideos.filter(v => v.subject === s.name && parseInt(v.unit) === u.id).length;
    const tC = (u.topics || []).length;
    return `
    <div class="v10-unit-card" onclick="v10AdminUnitDetail(${s.id},${u.id})">
      <div style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:8px;">
        <div class="v10-unit-num">${u.id}</div>
        <div style="display:flex;gap:4px;" onclick="event.stopPropagation()">
          <button class="v10-dot-btn" onclick="v10AdminEditUnit(${s.id},${ui})" title="Edit" style="font-size:.8rem;">✏️</button>
          <button class="v10-dot-btn" onclick="v10AdminDeleteUnit(${s.id},${ui})" title="Delete" style="font-size:.8rem;color:var(--red);">🗑</button>
        </div>
      </div>
      <div class="v10-unit-name">${u.name}</div>
      <div class="v10-unit-meta">${tC} topic${tC !== 1 ? 's' : ''} · ${vC} video${vC !== 1 ? 's' : ''}</div>
      <div class="v10-unit-badges">
        ${nC ? `<span class="badge badge-primary">📄 ${nC}</span>` : ''}
        ${pC ? `<span class="badge badge-amber">📝 ${pC}</span>` : ''}
        ${iC ? `<span class="badge badge-lavender">⭐ ${iC}</span>` : ''}
      </div>
      <div class="v10-unit-arrow">Click to manage content →</div>
    </div>`;
  }).join('');

  content.innerHTML = `
  <div style="padding:2rem;max-width:1200px;margin:0 auto;width:100%;">
    <button class="back-btn" onclick="v10AdminSubjects()">← Back to Subjects</button>
    <div style="margin:1rem 0 .5rem;">
      <h2 style="font-size:1.25rem;font-weight:800;letter-spacing:-.02em;margin-bottom:6px;">${s.icon || '📖'} ${s.name}</h2>
      <div style="display:flex;gap:6px;flex-wrap:wrap;">
        <span class="badge badge-primary">${s.sem || '—'}</span>
        <span class="badge badge-teal">${s.uni || 'JNTUK'}</span>
        <span class="badge badge-lavender">${s.reg || 'R23'}</span>
        <span class="badge badge-amber">${s.branch || 'CSE'}</span>
      </div>
    </div>
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:.4rem;">
      <p style="font-size:.79rem;color:var(--text3);">Click a unit to open learning roadmap and manage content</p>
      <button class="btn btn-primary btn-sm" onclick="v10AdminAddUnit(${s.id})">+ Add Unit</button>
    </div>
    <div class="v10-unit-grid">${unitCards}</div>
  </div>
  ${getAdminModals()}`;
}

export function v10AdminAddUnit(subjId) {
  const name = prompt('Unit name:', 'Unit ' + (JSON.parse(localStorage.getItem('edusync_units_' + subjId) || '[]').length + 1));
  if (!name) return;
  const units = JSON.parse(localStorage.getItem('edusync_units_' + subjId) || '[]');
  const newId = units.length ? Math.max(...units.map(u => u.id)) + 1 : units.length + 1;
  units.push({ id: newId, name: name.trim(), topics: [] });
  localStorage.setItem('edusync_units_' + subjId, JSON.stringify(units));
  showToast('✅ Unit added!', 'green');
  v10AdminOpenSubjectObj(window._v10AdminSubj);
}

export function v10AdminEditUnit(subjId, idx) {
  const units = JSON.parse(localStorage.getItem('edusync_units_' + subjId) || '[]');
  if (!units[idx]) return;
  const name = prompt('Unit name:', units[idx].name);
  if (!name) return;
  units[idx].name = name.trim();
  localStorage.setItem('edusync_units_' + subjId, JSON.stringify(units));
  showToast('✅ Unit updated!', 'green');
  v10AdminOpenSubjectObj(window._v10AdminSubj);
}

export function v10AdminDeleteUnit(subjId, idx) {
  if (!confirm('Delete this unit?')) return;
  const units = JSON.parse(localStorage.getItem('edusync_units_' + subjId) || '[]');
  units.splice(idx, 1);
  localStorage.setItem('edusync_units_' + subjId, JSON.stringify(units));
  showToast('Unit deleted', 'red');
  v10AdminOpenSubjectObj(window._v10AdminSubj);
}

/* ── Admin unit detail: roadmap + content panels ── */
export function v10AdminUnitDetail(subjId, unitId) {
  window._v10AdminSubjId = subjId;
  window._v10AdminUnitId = unitId;
  const s = window._v10AdminSubj;
  const units = JSON.parse(localStorage.getItem('edusync_units_' + subjId) || '[]');
  const defs = units.length ? units : Array.from({ length: 5 }, (_, i) => ({ id: i + 1, name: `Unit ${i + 1}`, topics: [] }));
  const unit = defs.find(u => u.id === unitId) || { id: unitId, name: `Unit ${unitId}`, topics: [] };

  const content = document.getElementById('admin-content');
  if (!content) return;

  content.innerHTML = `
  <div style="padding:2rem;max-width:1200px;margin:0 auto;width:100%;">
    <button class="back-btn" onclick="v10AdminOpenSubjectObj(window._v10AdminSubj)">← Back to Units</button>
    <div style="margin:1rem 0 .3rem;">
        <h2 style="font-size:1.15rem;font-weight:800;margin-bottom:4px;">Unit - ${unit.sort_order || (defs.findIndex(u => String(u.id) === String(unitId)) + 1) || 1}</h2>
      <p style="font-size:.78rem;color:var(--text3);">Build the learning roadmap and attach notes, PYQs, and important questions</p>
    </div>
    <div class="v10-detail-wrap">
      ${v10RoadmapPanel(subjId, unitId, unit.topics || [])}
      ${v10ContentPanel(s ? s.name : '', unitId, 'admin')}
    </div>
  </div>
  ${getAdminModals()}`;
}

/* ═══════════════════════════════════════════════════════════════
   SUB ADMIN: subjects → units → roadmap + content
   ═══════════════════════════════════════════════════════════════ */

/* Override renderSASection for 'subjects' only */
const _v10OrigRenderSASection = renderSASection;
renderSASection = function (section) {
  if (section === 'subjects') { v10SASubjects(); return; }
  _v10OrigRenderSASection(section);
};

/* Override switchSASection so 'subjects' goes to v10 */
const _v10OrigSwitchSASection = switchSASection;
switchSASection = function (section) {
  closeSASidebar();
  document.querySelectorAll('[id^="sa-nav-"]').forEach(el => el.classList.remove('active'));
  const navEl = document.getElementById('sa-nav-' + section);
  if (navEl) navEl.classList.add('active');
  const titles = { dashboard: 'Sub Admin Dashboard', subjects: 'Create Subject', view: 'View Content', curriculum: 'Curriculum', skillup: 'Skill Up' };
  const titleEl = document.getElementById('sa-topbar-title');
  if (titleEl) titleEl.textContent = titles[section] || 'Sub Admin';
  if (section === 'subjects') { v10SASubjects(); return; }
  _v10OrigSwitchSASection(section);
};

/* Override renderAdminSectionFull for 'subjects' */
const _v10OrigAdminSectionFull = window.renderAdminSectionFull;
renderAdminSectionFull = function (section) {
  if (section === 'subjects') { v10AdminSubjects(); return; }
  if (_v10OrigAdminSectionFull) _v10OrigAdminSectionFull(section);
  else if (typeof renderAdminSection === 'function') renderAdminSection(section);
};

/* Override switchAdminSection so 'subjects' goes to v10 */
const _v10OrigSwitchAdmin = switchAdminSection;
switchAdminSection = function (section) {
  closeAdminSidebar();
  document.querySelectorAll('[id^="admin-nav-"]').forEach(el => el.classList.remove('active'));
  const navEl = document.getElementById('admin-nav-' + section);
  if (navEl) navEl.classList.add('active');
  const titles = { dashboard: 'Admin Dashboard', create: 'Create & Manage', subjects: 'All Subjects', approvals: 'URL Approvals', creatorview: 'Creator View', skillup: 'Skill Up' };
  const titleEl = document.getElementById('admin-topbar-title');
  if (titleEl) titleEl.textContent = titles[section] || 'Admin';
  if (section === 'subjects') { v10AdminSubjects(); return; }
  _v10OrigSwitchAdmin(section);
};

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

/* ── SA: open subject → show unit cards ── */
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

/* ── SA: Unit detail — Roadmap (left) + Content tabs (right) ── */
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

/* ═══════════════════════════════════════════════════════════════
   SHARED: Roadmap panel + Content panel builders
   ═══════════════════════════════════════════════════════════════ */

export function v10RoadmapPanel(subjId, unitId, topics) {
  const rows = topics.length ? topics.map((t, i) => v10TopicRowHTML(
    subjId,
    unitId,
    i,
    t.name || t.topicName || '',
    Array.isArray(t.youtubeUrls) ? t.youtubeUrls : (t.youtubeUrl || t.url ? [t.youtubeUrl || t.url] : ['']),
    topics.length,
    t.id || ''
  )).join('')
    : `<div id="v10-rm-empty-${unitId}" style="text-align:center;padding:1.8rem;color:var(--text3);">
        <div style="font-size:2.2rem;margin-bottom:8px;">📍</div>
        <div style="font-weight:600;font-size:.88rem;">No topics yet</div>
        <div style="font-size:.76rem;margin-top:4px;">Click "+ Add Topic" to build the roadmap</div>
       </div>`;

  return `
  <div class="v10-panel">
    <div class="v10-panel-head">
      <h4>📍 Learning Roadmap</h4>
      <button class="btn btn-primary btn-sm" onclick="v10AddTopic('${subjId}','${unitId}')">+ Add Topic</button>
    </div>
    <div class="v10-panel-body">
      <div id="v10-topics-${unitId}">${rows}</div>
      <button class="btn btn-ghost" style="width:100%;margin-top:.6rem;" onclick="v10AddTopic('${subjId}','${unitId}')">+ Add Topic to Roadmap</button>
      <button class="v10-submit" onclick="v10SaveRoadmap('${subjId}','${unitId}')">💾 Save Learning Roadmap</button>
    </div>
  </div>`;
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

export function v10SaveRoadmap(subjId, unitId) {
  const container = document.getElementById('v10-topics-' + unitId);
  if (!container) return;
  const topics = [];
  container.querySelectorAll('.v10-topic-row').forEach(row => {
    const name = row.querySelector('.v10-topic-fields input:first-child')?.value.trim();
    const urls = Array.from(row.querySelectorAll('.v10-url-input'))
      .map(input => input.value.trim())
      .filter(Boolean);
    const primaryUrl = urls[0] || '';
    if (name) {
      const topicId = row.dataset.topicId || Date.now() + Math.random();
      const topic = {
        id: topicId,
        topicName: name,
        youtubeUrl: primaryUrl,
        youtubeUrls: urls,
        name,
        url: primaryUrl,
        urls: urls,
        notes: [],
        pyqs: [],
        importantQuestions: []
      };
      console.log('Saving Topic:', topic);
      topics.push(topic);
    }
  });

  /* Save to edusync_units */
  let units = JSON.parse(localStorage.getItem('edusync_units_' + subjId) || '[]');
  if (!units.length) units = Array.from({ length: 5 }, (_, i) => ({ id: i + 1, name: `Unit ${i + 1}`, topics: [] }));
  const ui = units.findIndex(u => u.id === unitId);
  if (ui >= 0) units[ui].topics = topics;
  else units.push({ id: unitId, name: `Unit ${unitId}`, topics });
  localStorage.setItem('edusync_units_' + subjId, JSON.stringify(units));

  /* Also sync edusync_roadmaps for student view */
  const roadmaps = JSON.parse(localStorage.getItem('edusync_roadmaps') || '{}');
  if (!roadmaps[subjId]) roadmaps[subjId] = [];
  let rm = roadmaps[subjId].find(r => r.unit === unitId);
  if (rm) rm.topics = topics.map(t => t.name);
  else roadmaps[subjId].push({ unit: unitId, topics: topics.map(t => t.name) });

  /* Topics are stored as unified topic objects in edusync_units_*; do not save separate admin video records. */

  localStorage.setItem('edusync_roadmaps', JSON.stringify(roadmaps));
  showToast('✅ Learning Roadmap saved! Students will see this.', 'green');
}

/* ── Content panel (Notes / PYQs / IQs) ── */
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

/* ── NOTES form ── */
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

/* ── PYQ form ── */
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

/* ── Important Questions form ── */
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

export function v10UnitTopics(unitId) {
  const subj = window._v10SASubj || {};
  const units = JSON.parse(localStorage.getItem('edusync_units_' + subj.id) || '[]');
  return (units.find(u => parseInt(u.id) === parseInt(unitId))?.topics || []);
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

export function v10FormatRoadmapError(error) {
  if (!error) return 'Unknown Supabase error';
  return [
    error.code,
    error.message,
    error.details,
    error.hint,
  ].filter(Boolean).join(' | ') || JSON.stringify(error);
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

window.v10ApplyTopicSelection = v10ApplyTopicSelection;

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

export function v10NormalizeVideosFromRow(row) {
  return Array.from(row.querySelectorAll('.v10-url-row')).map((urlRow) => ({
    url: urlRow.querySelector('.v10-url-input')?.value.trim() || '',
    description: urlRow.querySelector('.v10-video-desc-input')?.value.trim() || '',
  })).filter(video => video.url || video.description);
}

export function v10SavedRoadmapTree(topics, subjId, unitId) {
  const list = Array.isArray(topics) ? topics : [];
  if (!list.length) return '<div class="v10-saved-roadmap-empty">Saved roadmap will appear here after save.</div>';
  return `<div class="v10-saved-roadmap"><div class="v10-items-head">Saved Roadmap (${list.length})</div>${list.map((topic, ti) => {
    const videos = Array.isArray(topic.videos) && topic.videos.length
      ? topic.videos
      : (topic.youtubeUrls || topic.urls || []).map((url) => ({ url, description: '' }));
    const topicName = topic.name || topic.topicName || `Topic ${ti + 1}`;
    return `<div class="v10-saved-topic" data-topic-index="${ti}">
      <div class="v10-saved-topic-head" style="display:flex;gap:8px;align-items:center;margin-bottom:8px;">
        <input class="input v10-saved-topic-input" value="${String(topicName).replace(/"/g, '&quot;')}" onchange="v10EditSavedRoadmapTopic(${subjId},${unitId},${ti},this.value)" style="font-weight:700;font-size:.82rem;min-width:0;flex:1;" />
        <details class="v10-actions-menu"><summary title="Actions">...</summary><div class="v10-actions-dropdown">
          <button onclick="this.closest('details').removeAttribute('open');this.closest('.v10-saved-topic').querySelector('.v10-saved-topic-input')?.focus()">Edit</button>
          <button class="danger" onclick="v10DeleteSavedRoadmapTopic(${subjId},${unitId},${ti})">Delete</button>
        </div></details>
      </div>
      <div class="roadmap-video-tree">${videos.length ? videos.map((video, vi) => `<div class="roadmap-video-child" style="display:grid;grid-template-columns:minmax(0,1fr) auto;gap:6px;align-items:start;margin-top:6px;">
        <input class="input" value="${String(video.description || '').replace(/"/g, '&quot;')}" placeholder="Description ${vi + 1}" onchange="v10EditSavedRoadmapVideo(${subjId},${unitId},${ti},${vi},'description',this.value)" style="font-size:.76rem;" />
        <details class="v10-actions-menu"><summary title="Actions">...</summary><div class="v10-actions-dropdown">
          <button onclick="this.closest('.roadmap-video-child').querySelector('input')?.focus()">Edit</button>
          <button class="danger" onclick="v10DeleteSavedRoadmapVideo(${subjId},${unitId},${ti},${vi})">Delete</button>
        </div></details>
        <input class="input" value="${String(video.url || '').replace(/"/g, '&quot;')}" placeholder="Video URL ${vi + 1}" onchange="v10EditSavedRoadmapVideo(${subjId},${unitId},${ti},${vi},'url',this.value)" style="font-size:.76rem;grid-column:1 / -1;" />
      </div>`).join('') : '<div class="roadmap-video-child">No videos added yet</div>'}</div>
    </div>`;
  }).join('')}</div>`;
}

v10RoadmapPanel = function v10RoadmapPanelEnhanced(subjId, unitId, topics) {
  const rows = topics.length ? topics.map((t, i) => v10TopicRowHTML(
    subjId,
    unitId,
    i,
    t.name || t.topicName || '',
    Array.isArray(t.videos) && t.videos.length
      ? t.videos
      : (Array.isArray(t.youtubeUrls) ? t.youtubeUrls : (t.youtubeUrl || t.url ? [t.youtubeUrl || t.url] : [''])),
    topics.length,
    t.id || ''
  )).join('')
    : `<div id="v10-rm-empty-${unitId}" style="text-align:center;padding:1.8rem;color:var(--text3);">
        <div style="font-weight:600;font-size:.88rem;">No topics yet</div>
        <div style="font-size:.76rem;margin-top:4px;">Click "+ Add Topic" to build the roadmap</div>
       </div>`;

  return `
  <div class="v10-panel">
    <div class="v10-panel-head">
      <h4>Learning Roadmap</h4>
      <div class="v10-panel-actions">
        <button class="btn btn-primary btn-sm"onclick="v10AddTopic('${subjId}','${unitId}',false)">+ Add Main Topic</button>
        <button class="btn btn-ghost btn-sm"onclick="v10AddTopic('${subjId}','${unitId}',true)">+ Add Sub Topic</button>
      </div>
    </div>
    <div class="v10-panel-body">
      <div id="v10-topics-${unitId}">${rows}</div>
      <button class="v10-submit"onclick="v10SaveRoadmap('${subjId}','${unitId}')">Save Learning Roadmap</button>
      <div id="v10-saved-roadmap-${unitId}" style="margin-top:1rem;">${v10SavedRoadmapTree(topics, subjId, unitId)}</div>
    </div>
  </div>`;
};

v10TopicRowHTML = function v10TopicRowHTMLEnhanced(subjId, unitId, idx, name, urls, total, topicId = '') {
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
};

v10AddTopicUrl = function v10AddTopicUrlEnhanced(subjId, unitId, topicIdx) {
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
};

export function v10RoadmapRows(unitId) {
  return Array.from(document.querySelectorAll(`#v10-topics-${unitId} .v10-topic-row`));
}

export function v10SavedRow(unitId, topicIdx) {
  return v10RoadmapRows(unitId)[topicIdx] || null;
}

export function v10EditSavedRoadmapTopic(subjId, unitId, topicIdx, value) {
  const row = v10SavedRow(unitId, topicIdx);
  const input = row?.querySelector('.v10-topic-fields input:first-child');
  if (!input) return;
  input.value = value;
  v10DotUpdate?.(unitId, topicIdx, value);
  v10SaveRoadmap(subjId, unitId);
}

export function v10EditSavedRoadmapVideo(subjId, unitId, topicIdx, videoIdx, field, value) {
  const row = v10SavedRow(unitId, topicIdx);
  const videoRow = row?.querySelectorAll('.v10-url-row')?.[videoIdx];
  if (!videoRow) return;
  const target = field === 'description'
    ? videoRow.querySelector('.v10-video-desc-input')
    : videoRow.querySelector('.v10-url-input');
  if (!target) return;
  target.value = value;
  v10SaveRoadmap(subjId, unitId);
}

export function v10DeleteSavedRoadmapVideo(subjId, unitId, topicIdx, videoIdx) {
  const row = v10SavedRow(unitId, topicIdx);
  const videoRows = row ? Array.from(row.querySelectorAll('.v10-url-row')) : [];
  const videoRow = videoRows[videoIdx];
  if (!videoRow) return;
  if (videoRows.length === 1) {
    const urlInput = videoRow.querySelector('.v10-url-input');
    const descInput = videoRow.querySelector('.v10-video-desc-input');
    if (urlInput) urlInput.value = '';
    if (descInput) descInput.value = '';
  } else {
    videoRow.remove();
  }
  v10SaveRoadmap(subjId, unitId);
}

export function v10DeleteSavedRoadmapTopic(subjId, unitId, topicIdx) {
  const row = v10SavedRow(unitId, topicIdx);
  if (!row) return;
  row.remove();
  v10SaveRoadmap(subjId, unitId);
}

v10SaveRoadmap = async function v10SaveRoadmapEnhanced(subjId, unitId) {
  console.log('[ROADMAP] Save Started');
  const container = document.getElementById('v10-topics-' + unitId);
  if (!container) return;
  const topics = [];
  container.querySelectorAll('.v10-topic-row').forEach((row, index) => {
    const name = row.querySelector('.v10-topic-fields input:first-child')?.value.trim();
    const videos = v10NormalizeVideosFromRow(row);
    if (!name) return;
    const topicId = row.dataset.topicId || `${Date.now()}-${index}`;
    const urls = videos.map(video => video.url).filter(Boolean);
    topics.push({
      id: topicId,
      topicName: name,
      name,
      videos,
      youtubeUrl: urls[0] || '',
      youtubeUrls: urls,
      url: urls[0] || '',
      urls,
    });
  });

    const subject = JSON.parse(localStorage.getItem('edusync_custom_subjects') || '[]').find(s => String(s.id) === String(subjId)) || window._v10SASubj || window._v11AdminSubj;
  const units = JSON.parse(localStorage.getItem('edusync_units_' + subjId) || '[]');
  const unit = units.find(u => parseInt(u.id) === parseInt(unitId)) || { id: unitId, name: `Unit ${unitId}` };
  if (!window.aimeasySaveUnitRoadmap || !subject) {
    showToast('Roadmap DB save is unavailable. Supabase is the required source of truth.', 'red');
    return;
  }
  const { data, error } = await window.aimeasySaveUnitRoadmap({ subject, unit, topics });
  if (error) {
    const exact = v10FormatRoadmapError(error);
    console.error('[ROADMAP] Save Failed', error);
    showToast('Roadmap DB sync failed: ' + exact, 'red');
    return;
  }
    if (typeof window.v10PersistSubjectDbIds === 'function') {
      window.v10PersistSubjectDbIds(subjId, unitId, data);
    }
  await v10ReloadUnitRoadmapFromDb(subjId, unitId, { ...subject, dbSubjectId: data.subjectId }, { ...unit, dbUnitId: data.unitId });
    if (document.getElementById('sa-content')) {
      window.v10SAUnitDetail?.(subjId, unitId);
    } else if (document.getElementById('admin-content')) {
      window.v11AdminUnitDetail?.(subjId, unitId);
    }
  showToast('Learning Roadmap saved and refreshed.', 'green');
};

export function v10VideosFromRoadmapPanel(subjectName, unitId) {
  const topics = v10UnitTopics(unitId);
  const rows = topics.flatMap((topic, ti) => {
    const videos = Array.isArray(topic.videos) && topic.videos.length
      ? topic.videos
      : (topic.youtubeUrls || topic.urls || []).map(url => ({ url, description: '' }));
    return videos.map((video, vi) => ({ topic, ti, video, vi }));
  });
  return `<div class="v10-items"><div class="v10-items-head">Videos from Learning Roadmap (${rows.length})</div>
    ${rows.length ? rows.map(({ topic, ti, video, vi }) => `<div class="v10-item"><span>${vi === rows.length - 1 ? '└' : '├'}</span><div class="v10-item-body"><div class="v10-item-title">${topic.name || topic.topicName || `Topic ${ti + 1}`}</div><div class="v10-item-meta">${video.description || `Video ${vi + 1}`}</div><div class="v10-item-meta" style="color:var(--primary);word-break:break-all;">${video.url || ''}</div></div></div>`).join('') : '<p style="color:var(--text3);font-size:.83rem;padding:1rem;">No roadmap videos yet.</p>'}
  </div>`;
}

v10ContentPanel = function v10ContentPanelLinked(subjectName, unitId, role) {
  return `<div class="v10-panel"><div class="v10-panel-head"><h4>Unit Content</h4></div><div class="v10-tabs">
    <button class="v10-tab on" onclick="v10SwitchTab(this,'v10-notes-${unitId}')">Notes</button>
    <button class="v10-tab" onclick="v10SwitchTab(this,'v10-pyq-${unitId}')">PYQs</button>
    <button class="v10-tab" onclick="v10SwitchTab(this,'v10-iq-${unitId}')">Important Qs</button>
  </div><div class="v10-pane on" id="v10-notes-${unitId}">${v10NotesForm(subjectName, unitId)}</div><div class="v10-pane" id="v10-pyq-${unitId}">${v10PYQForm(subjectName, unitId)}</div><div class="v10-pane" id="v10-iq-${unitId}">${v10IQForm(subjectName, unitId)}</div></div>`;
};

v10NotesForm = function v10NotesFormLinked(subjectName, unitId) {
  const notes = JSON.parse(localStorage.getItem('edusync_admin_notes') || '[]').filter(n => n.subject === subjectName && parseInt(n.unit) === parseInt(unitId));
  const s = v10EscapeJs(subjectName);
  return `<div class="v10-form"><p class="hint">Select an existing roadmap topic or type a new topic.</p>${v10TopicFieldsHTML(subjectName, unitId, 'notes')}<div class="input-group"><span class="v10-label">NOTE URL / FILE</span><input class="input" id="v10-nlink-${unitId}" placeholder="https://drive.google.com/..." type="url"></div><div class="input-group"><span class="v10-label">DESCRIPTION</span><textarea class="input" id="v10-ndesc-${unitId}" rows="3" style="resize:vertical;"></textarea></div><button class="v10-submit" onclick="v10UploadNote('${s}',${unitId})">Save Note</button></div>${notes.length ? `<div class="v10-items"><div class="v10-items-head">Uploaded Notes (${notes.length})</div>${notes.map(n => `<div class="v10-item"><span>📄</span><div class="v10-item-body"><div class="v10-item-title">${n.topicName || n.title}</div><div class="v10-item-meta">${n.description || n.title || ''} · ${n.uploadedAt || ''}</div></div><button class="v10-del v10-edit-btn" onclick="aimeasyEditNote('${n.id}','${s}',${unitId})" style="color:var(--primary);margin-right:4px;">Edit</button><button class="v10-del v10-del-btn" onclick="v10DeleteNote('${n.id}','${s}',${unitId})">Delete</button></div>`).join('')}</div>` : ''}`;
};

v10UploadNote = async function v10UploadNoteLinked(subjectName, unitId) {
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
};

v10PYQForm = function v10PYQFormLinked(subjectName, unitId) {
  const pyqs = JSON.parse(localStorage.getItem('edusync_admin_pyqs') || '[]').filter(p => p.subject === subjectName && parseInt(p.unit) === parseInt(unitId));
  const s = (subjectName || '').replace(/\\/g, '\\\\').replace(/'/g, "\\'");
  return `<div class="v10-form"><p class="hint">PYQs are linked to a roadmap topic.</p><div class="input-group"><span class="v10-label">TOPIC</span>${v10TopicSelect(subjectName, unitId)}</div><div class="v10-2col"><div class="input-group"><span class="v10-label">YEAR</span><input class="input" id="v10-pyqyr-${unitId}" type="number" min="2000" max="2099"></div><div class="input-group"><span class="v10-label">MARKS</span><input class="input" id="v10-pyqmarks-${unitId}" type="number" min="1"></div></div><div class="input-group"><span class="v10-label">QUESTION</span><textarea class="input" id="v10-pyqtxt-${unitId}" rows="3" style="resize:vertical;"></textarea></div><button class="v10-submit" onclick="v10UploadPYQ('${s}',${unitId})">Save PYQ</button></div>${pyqs.length ? `<div class="v10-items"><div class="v10-items-head">PYQs (${pyqs.length})</div>${pyqs.map(p => `<div class="v10-item"><span>📝</span><div class="v10-item-body"><div class="v10-item-title">${p.question}</div><div class="v10-item-meta">${p.topicName || 'No topic'} · ${p.year || '-'} · ${p.marks || p.count || '-'} marks</div></div><button class="v10-del v10-edit-btn" onclick="aimeasyEditPYQ(${p.id},'${s}',${unitId})" style="color:var(--primary);margin-right:4px;">Edit</button><button class="v10-del v10-del-btn" onclick="v10DeletePYQ(${p.id},'${s}',${unitId})">Del</button></div>`).join('')}</div>` : ''}`;
};

v10UploadPYQ = async function v10UploadPYQLinked(subjectName, unitId) {
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
};

v10IQForm = function v10IQFormLinked(subjectName, unitId) {
  const iqs = JSON.parse(localStorage.getItem('edusync_admin_iqs') || '[]').filter(q => q.subject === subjectName && parseInt(q.unit) === parseInt(unitId));
  const s = (subjectName || '').replace(/\\/g, '\\\\').replace(/'/g, "\\'");
  return `<div class="v10-form"><p class="hint">Important questions are linked to a roadmap topic.</p><div class="input-group"><span class="v10-label">TOPIC</span>${v10TopicSelect(subjectName, unitId)}</div><div class="input-group"><span class="v10-label">QUESTION</span><textarea class="input" id="v10-iqtxt-${unitId}" rows="3" style="resize:vertical;"></textarea></div><div class="input-group"><span class="v10-label">PRIORITY</span><select class="select" id="v10-iqprio-${unitId}"><option value="high">High</option><option value="med" selected>Medium</option><option value="low">Low</option></select></div><button class="v10-submit" onclick="v10UploadIQ('${s}',${unitId})">Save Important Question</button></div>${iqs.length ? `<div class="v10-items"><div class="v10-items-head">Important Questions (${iqs.length})</div>${iqs.map(q => `<div class="v10-item"><span>⭐</span><div class="v10-item-body"><div class="v10-item-title">${q.question}</div><div class="v10-item-meta">${q.topicName || 'No topic'} · ${q.priority || 'med'}</div></div><button class="v10-del v10-edit-btn" onclick="aimeasyEditIQ(${q.id},'${s}',${unitId})" style="color:var(--primary);margin-right:4px;">Edit</button><button class="v10-del v10-del-btn" onclick="v10DeleteIQ(${q.id},'${s}',${unitId})">Del</button></div>`).join('')}</div>` : ''}`;
};

v10UploadIQ = async function v10UploadIQLinked(subjectName, unitId) {
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
};

/* ── Patch renderSAUnitsPage so old onclick still works ── */
v10DeleteNote = async function v10DeleteNoteLinked(id, subjectName, unitId) {
  if (!confirm('Delete this note?')) return;
  const notes = JSON.parse(localStorage.getItem('edusync_admin_notes') || '[]');
  const note = notes.find(n => n.id === id);
  if (note?.dbContentId) await window.aimeasyDeleteContent?.(note.dbContentId);
  localStorage.setItem('edusync_admin_notes', JSON.stringify(notes.filter(n => n.id !== id)));
  await v10RefreshContentPane('notes', subjectName, unitId);
  window.renderSubAdminDashboardLive?.();
  showToast('Note deleted', 'red');
};

v10DeletePYQ = async function v10DeletePYQLinked(id, subjectName, unitId) {
  if (!confirm('Delete this PYQ?')) return;
  const pyqs = JSON.parse(localStorage.getItem('edusync_admin_pyqs') || '[]');
  const pyq = pyqs.find(p => p.id === id);
  if (pyq?.dbContentId) await window.aimeasyDeleteContent?.(pyq.dbContentId);
  localStorage.setItem('edusync_admin_pyqs', JSON.stringify(pyqs.filter(p => p.id !== id)));
  await v10RefreshContentPane('pyq', subjectName, unitId);
  window.renderSubAdminDashboardLive?.();
  showToast('PYQ deleted', 'red');
};

v10DeleteIQ = async function v10DeleteIQLinked(id, subjectName, unitId) {
  if (!confirm('Delete this question?')) return;
  const iqs = JSON.parse(localStorage.getItem('edusync_admin_iqs') || '[]');
  const iq = iqs.find(q => q.id === id);
  if (iq?.dbContentId) await window.aimeasyDeleteContent?.(iq.dbContentId);
  localStorage.setItem('edusync_admin_iqs', JSON.stringify(iqs.filter(q => q.id !== id)));
  await v10RefreshContentPane('iq', subjectName, unitId);
  window.renderSubAdminDashboardLive?.();
  showToast('Question deleted', 'red');
};

v10NotesForm = function v10NotesFormTopicText(subjectName, unitId) {
  const notes = JSON.parse(localStorage.getItem('edusync_admin_notes') || '[]').filter(n => n.subject === subjectName && parseInt(n.unit) === parseInt(unitId));
  const s = v10EscapeJs(subjectName);
  return `<div class="v10-form"><p class="hint">Select an existing roadmap topic or type a new topic.</p>${v10TopicFieldsHTML(subjectName, unitId, 'notes')}<div class="input-group"><span class="v10-label">NOTE URL / FILE</span><input class="input" id="v10-nlink-${unitId}" placeholder="https://drive.google.com/..." type="url"></div><div class="input-group"><span class="v10-label">DESCRIPTION</span><textarea class="input" id="v10-ndesc-${unitId}" rows="3" style="resize:vertical;"></textarea></div><button class="v10-submit" onclick="v10UploadNote('${s}',${unitId})">Save Note</button></div>${notes.length ? `<div class="v10-items"><div class="v10-items-head">Uploaded Notes (${notes.length})</div>${notes.map(n => `<div class="v10-item"><span>📄</span><div class="v10-item-body"><div class="v10-item-title">${n.topicName || n.title}</div><div class="v10-item-meta">${n.description || n.title || ''} · ${n.uploadedAt || ''}</div></div><button class="v10-del v10-edit-btn" onclick="aimeasyEditNote('${n.id}','${s}',${unitId})" style="color:var(--primary);margin-right:4px;">Edit</button><button class="v10-del v10-del-btn" onclick="v10DeleteNote('${n.id}','${s}',${unitId})">Delete</button></div>`).join('')}</div>` : ''}`;
};

v10UploadNote = async function v10UploadNoteTopicText(subjectName, unitId) {
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
};

v10PYQForm = function v10PYQFormTopicText(subjectName, unitId) {
  const pyqs = JSON.parse(localStorage.getItem('edusync_admin_pyqs') || '[]').filter(p => p.subject === subjectName && parseInt(p.unit) === parseInt(unitId));
  const s = v10EscapeJs(subjectName);
  return `<div class="v10-form"><p class="hint">Select an existing roadmap topic or type a new topic.</p>${v10TopicFieldsHTML(subjectName, unitId, 'pyq')}<div class="v10-2col"><div class="input-group"><span class="v10-label">YEAR</span><input class="input" id="v10-pyqyr-${unitId}" type="number" min="2000" max="2099"></div><div class="input-group"><span class="v10-label">MARKS</span><input class="input" id="v10-pyqmarks-${unitId}" type="number" min="1"></div></div><div class="input-group"><span class="v10-label">QUESTION</span><textarea class="input" id="v10-pyqtxt-${unitId}" rows="3" style="resize:vertical;"></textarea></div><button class="v10-submit" onclick="v10UploadPYQ('${s}',${unitId})">Save PYQ</button></div>${pyqs.length ? `<div class="v10-items"><div class="v10-items-head">Uploaded PYQs (${pyqs.length})</div>${pyqs.map(p => `<div class="v10-item"><span>📝</span><div class="v10-item-body"><div class="v10-item-title">${p.question}</div><div class="v10-item-meta">${p.topicName || 'No topic'} · ${p.year || '-'} · ${p.marks || p.count || '-'} marks</div></div><button class="v10-del v10-edit-btn" onclick="aimeasyEditPYQ('${p.id}','${s}',${unitId})" style="color:var(--primary);margin-right:4px;">Edit</button><button class="v10-del v10-del-btn" onclick="v10DeletePYQ('${p.id}','${s}',${unitId})">Delete</button></div>`).join('')}</div>` : ''}`;
};

v10UploadPYQ = async function v10UploadPYQTopicText(subjectName, unitId) {
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
};

v10IQForm = function v10IQFormTopicText(subjectName, unitId) {
  const iqs = JSON.parse(localStorage.getItem('edusync_admin_iqs') || '[]').filter(q => q.subject === subjectName && parseInt(q.unit) === parseInt(unitId));
  const s = v10EscapeJs(subjectName);
  return `<div class="v10-form"><p class="hint">Select an existing roadmap topic or type a new topic.</p>${v10TopicFieldsHTML(subjectName, unitId, 'iq')}<div class="input-group"><span class="v10-label">QUESTION</span><textarea class="input" id="v10-iqtxt-${unitId}" rows="3" style="resize:vertical;"></textarea></div><div class="input-group"><span class="v10-label">PRIORITY</span><select class="select" id="v10-iqprio-${unitId}"><option value="high">High</option><option value="med" selected>Medium</option><option value="low">Low</option></select></div><button class="v10-submit" onclick="v10UploadIQ('${s}',${unitId})">Save Important Question</button></div>${iqs.length ? `<div class="v10-items"><div class="v10-items-head">Uploaded Important Questions (${iqs.length})</div>${iqs.map(q => `<div class="v10-item"><span>⭐</span><div class="v10-item-body"><div class="v10-item-title">${q.question}</div><div class="v10-item-meta">${q.topicName || 'No topic'} · ${q.priority || 'med'}</div></div><button class="v10-del v10-edit-btn" onclick="aimeasyEditIQ('${q.id}','${s}',${unitId})" style="color:var(--primary);margin-right:4px;">Edit</button><button class="v10-del v10-del-btn" onclick="v10DeleteIQ('${q.id}','${s}',${unitId})">Delete</button></div>`).join('')}</div>` : ''}`;
};

v10UploadIQ = async function v10UploadIQTopicText(subjectName, unitId) {
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
};

v10NotesForm = function v10NotesFormMenuActions(subjectName, unitId) {
  const branch = v10BranchForSubject(subjectName);
  const notes = JSON.parse(localStorage.getItem('edusync_admin_notes') || '[]').filter(n => n.subject === subjectName && parseInt(n.unit) === parseInt(unitId) && v10SameBranchContent(n, branch));
  const s = v10EscapeJs(subjectName);
  return `<div class="v10-form"><p class="hint">Select a saved roadmap topic or type a matching topic.</p>${v10TopicFieldsHTML(subjectName, unitId, 'notes')}<div class="input-group"><span class="v10-label">PDF / NOTE URL</span><input class="input" id="v10-nlink-${unitId}" placeholder="https://drive.google.com/..." type="url"></div><div class="input-group"><span class="v10-label">DESCRIPTION</span><textarea class="input" id="v10-ndesc-${unitId}" rows="3" style="resize:vertical;"></textarea></div><button class="v10-submit" onclick="v10UploadNote('${s}',${unitId})">Save Note</button></div>${notes.length ? `<div class="v10-items"><div class="v10-items-head">Uploaded Notes (${notes.length})</div>${notes.map(n => `<div class="v10-item"><span>📄</span><div class="v10-item-body"><div class="v10-item-title">${n.topicName || n.title}</div><div class="v10-item-meta">${n.description || n.title || ''} · ${n.uploadedAt || ''}</div></div>${v10ContentActionMenu(`aimeasyEditNote('${n.id}','${s}',${unitId})`, `v10DeleteNote('${n.id}','${s}',${unitId})`)}</div>`).join('')}</div>` : ''}`;
};

v10PYQForm = function v10PYQFormMenuActions(subjectName, unitId) {
  const branch = v10BranchForSubject(subjectName);
  const pyqs = JSON.parse(localStorage.getItem('edusync_admin_pyqs') || '[]').filter(p => p.subject === subjectName && parseInt(p.unit) === parseInt(unitId) && v10SameBranchContent(p, branch));
  const s = v10EscapeJs(subjectName);
  return `<div class="v10-form"><p class="hint">Select a saved roadmap topic or type a matching topic.</p>${v10TopicFieldsHTML(subjectName, unitId, 'pyq')}<div class="v10-2col"><div class="input-group"><span class="v10-label">YEAR</span><input class="input" id="v10-pyqyr-${unitId}" type="number" min="2000" max="2099"></div><div class="input-group"><span class="v10-label">MARKS</span><input class="input" id="v10-pyqmarks-${unitId}" type="number" min="1"></div></div><div class="input-group"><span class="v10-label">QUESTION</span><textarea class="input" id="v10-pyqtxt-${unitId}" rows="3" style="resize:vertical;"></textarea></div><button class="v10-submit" onclick="v10UploadPYQ('${s}',${unitId})">Save PYQ</button></div>${pyqs.length ? `<div class="v10-items"><div class="v10-items-head">Uploaded PYQs (${pyqs.length})</div>${pyqs.map(p => `<div class="v10-item"><span>📝</span><div class="v10-item-body"><div class="v10-item-title">${p.question}</div><div class="v10-item-meta">${p.topicName || 'No topic'} · ${p.year || '-'} · ${p.marks || p.count || '-'} marks</div></div>${v10ContentActionMenu(`aimeasyEditPYQ('${p.id}','${s}',${unitId})`, `v10DeletePYQ('${p.id}','${s}',${unitId})`)}</div>`).join('')}</div>` : ''}`;
};

v10IQForm = function v10IQFormMenuActions(subjectName, unitId) {
  const branch = v10BranchForSubject(subjectName);
  const iqs = JSON.parse(localStorage.getItem('edusync_admin_iqs') || '[]').filter(q => q.subject === subjectName && parseInt(q.unit) === parseInt(unitId) && v10SameBranchContent(q, branch));
  const s = v10EscapeJs(subjectName);
  return `<div class="v10-form"><p class="hint">Select a saved roadmap topic or type a matching topic.</p>${v10TopicFieldsHTML(subjectName, unitId, 'iq')}<div class="input-group"><span class="v10-label">QUESTION</span><textarea class="input" id="v10-iqtxt-${unitId}" rows="3" style="resize:vertical;"></textarea></div><div class="input-group"><span class="v10-label">PRIORITY</span><select class="select" id="v10-iqprio-${unitId}"><option value="high">High</option><option value="med" selected>Medium</option><option value="low">Low</option></select></div><button class="v10-submit" onclick="v10UploadIQ('${s}',${unitId})">Save Important Question</button></div>${iqs.length ? `<div class="v10-items"><div class="v10-items-head">Uploaded Important Questions (${iqs.length})</div>${iqs.map(q => `<div class="v10-item"><span>⭐</span><div class="v10-item-body"><div class="v10-item-title">${q.question}</div><div class="v10-item-meta">${q.topicName || 'No topic'} · ${q.priority || 'med'}</div></div>${v10ContentActionMenu(`aimeasyEditIQ('${q.id}','${s}',${unitId})`, `v10DeleteIQ('${q.id}','${s}',${unitId})`)}</div>`).join('')}</div>` : ''}`;
};

export function v10CloseActionMenus() {
  document.querySelectorAll('.v10-actions-menu.open').forEach(menu => menu.classList.remove('open'));
}

window.v10ToggleActionMenu = function v10ToggleActionMenu(button) {
  window.event?.stopPropagation();
  const menu = button.closest('.v10-actions-menu');
  const wasOpen = menu?.classList.contains('open');
  v10CloseActionMenus();
  if (menu && !wasOpen) menu.classList.add('open');
};

document.addEventListener('click', (event) => {
  if (!event.target.closest('.v10-actions-menu')) v10CloseActionMenus();
});

v10ContentActionMenu = function v10ContentActionMenuFixed(editCall, deleteCall) {
  return `<div class="v10-actions-menu">
    <button type="button" class="v10-actions-trigger" title="Actions" onclick="v10ToggleActionMenu(this)">...</button>
    <div class="v10-actions-dropdown">
      <button type="button" onclick="v10CloseActionMenus();${editCall}">Edit</button>
      <button type="button" class="danger" onclick="v10CloseActionMenus();${deleteCall}">Delete</button>
    </div>
  </div>`;
};

export function v10FileUploadArea(unitId, target) {
  return `<div class="v10-drop-zone" data-target="${target}" data-unit="${unitId}" ondragover="v10UploadDragOver(event)" ondragleave="v10UploadDragLeave(event)" ondrop="v10UploadDrop(event,'${target}',${unitId})" onclick="document.getElementById('v10-${target}-file-${unitId}')?.click()">
    <input type="file" id="v10-${target}-file-${unitId}" accept=".pdf,.docx,.pptx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.openxmlformats-officedocument.presentationml.presentation" style="display:none" onchange="v10HandleUploadFile(this.files?.[0],'${target}',${unitId})">
    <div class="v10-drop-title">Drag PDF here</div>
    <div class="v10-drop-sub">or click to upload PDF, DOCX, or PPTX</div>
    <div class="v10-upload-progress" id="v10-${target}-progress-${unitId}"><span></span></div>
  </div>`;
}

window.v10UploadDragOver = function v10UploadDragOver(event) {
  event.preventDefault();
  event.currentTarget.classList.add('dragging');
};

window.v10UploadDragLeave = function v10UploadDragLeave(event) {
  event.currentTarget.classList.remove('dragging');
};

window.v10UploadDrop = function v10UploadDrop(event, target, unitId) {
  event.preventDefault();
  event.currentTarget.classList.remove('dragging');
  v10HandleUploadFile(event.dataTransfer?.files?.[0], target, unitId);
};

window.v10HandleUploadFile = function v10HandleUploadFile(file, target, unitId) {
  if (!file) return;
  const ext = (file.name.split('.').pop() || '').toLowerCase();
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
  if (progress) {
    progress.classList.add('active');
    progress.querySelector('span').style.width = '30%';
  }
  window.setTimeout(() => {
    if (progress) progress.querySelector('span').style.width = '100%';
    if (urlInput) urlInput.value = URL.createObjectURL(file);
    console.log(`[${target === 'notes' ? 'NOTES' : target.toUpperCase()}] Upload Success`, { fileName: file.name, size: file.size });
    showToast('Upload ready. Press Save to publish it.', 'green');
  }, 250);
};

export function v10RoadmapTopicActionMenu(subjId, unitId, topicIdx) {
  return `<div class="v10-actions-menu">
    <button type="button" class="v10-actions-trigger" title="Actions" onclick="v10ToggleActionMenu(this)">...</button>
    <div class="v10-actions-dropdown">
      <button type="button" onclick="v10CloseActionMenus();v10OpenRoadmapEditModal(${subjId},${unitId},${topicIdx})">Edit Topic</button>
      <button type="button" class="danger" onclick="v10CloseActionMenus();v10DeleteSavedRoadmapTopic(${subjId},${unitId},${topicIdx})">Delete Topic</button>
    </div>
  </div>`;
}

v10SavedRoadmapTree = function v10SavedRoadmapTreeFixed(topics, subjId, unitId) {
  const list = Array.isArray(topics) ? topics : [];
  if (!list.length) return '<div class="v10-saved-roadmap-empty">Saved roadmap will appear here after save.</div>';
  return `<div class="v10-saved-roadmap"><div class="v10-items-head">Saved Roadmap (${list.length})</div>${list.map((topic, ti) => {
    const videos = Array.isArray(topic.videos) && topic.videos.length
      ? topic.videos
      : (topic.youtubeUrls || topic.urls || []).map((url) => ({ url, description: '' }));
    const topicName = topic.name || topic.topicName || `Topic ${ti + 1}`;
    return `<div class="v10-saved-topic" data-topic-index="${ti}">
      <div class="v10-saved-topic-head">
        <div class="v10-saved-topic-title">${topicName}</div>
        ${v10RoadmapTopicActionMenu(subjId, unitId, ti)}
      </div>
      <div class="roadmap-video-tree">${videos.length ? videos.map((video, vi) => `<div class="roadmap-video-child"><strong>Video ${vi + 1}:</strong> ${video.description || 'No description'}<br><span>${video.url || 'No URL'}</span></div>`).join('') : '<div class="roadmap-video-child">No videos added yet</div>'}</div>
    </div>`;
  }).join('')}</div>`;
};

window.v10OpenRoadmapEditModal = function v10OpenRoadmapEditModal(subjId, unitId, topicIdx) {
  const row = v10SavedRow(unitId, topicIdx);
  if (!row) return;
  const topicInput = row.querySelector('.v10-topic-fields input:first-child');
  const videoRow = row.querySelector('.v10-url-row');
  const urlInput = videoRow?.querySelector('.v10-url-input');
  const descInput = videoRow?.querySelector('.v10-video-desc-input');
  const modal = document.createElement('div');
  modal.className = 'v10-edit-modal';
  modal.innerHTML = `<div class="v10-edit-box">
    <h3>Edit Topic</h3>
    <label>Topic Name<input class="input" id="v10-edit-topic-name" value="${v10EscapeAttr(topicInput?.value || '')}"></label>
    <label>Video URL<input class="input" id="v10-edit-topic-url" value="${v10EscapeAttr(urlInput?.value || '')}"></label>
    <label>Description<textarea class="input" id="v10-edit-topic-desc" rows="4">${descInput?.value || ''}</textarea></label>
    <div class="v10-edit-actions">
      <button class="btn btn-ghost" onclick="this.closest('.v10-edit-modal').remove()">Cancel</button>
      <button class="btn btn-primary" onclick="v10SaveRoadmapEditModal(${subjId},${unitId},${topicIdx})">Save Changes</button>
    </div>
  </div>`;
  document.body.appendChild(modal);
};

window.v10SaveRoadmapEditModal = async function v10SaveRoadmapEditModal(subjId, unitId, topicIdx) {
  const row = v10SavedRow(unitId, topicIdx);
  if (!row) return;
  const topicInput = row.querySelector('.v10-topic-fields input:first-child');
  const videoRow = row.querySelector('.v10-url-row');
  const urlInput = videoRow?.querySelector('.v10-url-input');
  const descInput = videoRow?.querySelector('.v10-video-desc-input');
  if (topicInput) topicInput.value = document.getElementById('v10-edit-topic-name')?.value.trim() || '';
  if (urlInput) urlInput.value = document.getElementById('v10-edit-topic-url')?.value.trim() || '';
  if (descInput) descInput.value = document.getElementById('v10-edit-topic-desc')?.value.trim() || '';
  document.querySelector('.v10-edit-modal')?.remove();
  console.log('[DB] Topic Updated', { subjId, unitId, topicIdx });
  await v10SaveRoadmap(subjId, unitId);
};

const v10DeleteSavedRoadmapTopicOriginal = v10DeleteSavedRoadmapTopic;
v10DeleteSavedRoadmapTopic = function v10DeleteSavedRoadmapTopicConfirmed(subjId, unitId, topicIdx) {
  if (!confirm('Delete this roadmap topic and its related video URLs/descriptions?')) return;
  console.log('[DB] Topic Deleted', { subjId, unitId, topicIdx });
  v10DeleteSavedRoadmapTopicOriginal(subjId, unitId, topicIdx);
};

v10NotesForm = function v10NotesFormDropZone(subjectName, unitId) {
  const branch = v10BranchForSubject(subjectName);
  const notes = JSON.parse(localStorage.getItem('edusync_admin_notes') || '[]').filter(n => n.subject === subjectName && parseInt(n.unit) === parseInt(unitId) && v10SameBranchContent(n, branch));
  const s = v10EscapeJs(subjectName);
  return `<div class="v10-form">${v10TopicFieldsHTML(subjectName, unitId, 'notes')}${v10FileUploadArea(unitId, 'notes')}<div class="input-group"><span class="v10-label">PDF / NOTE URL</span><input class="input" id="v10-nlink-${unitId}" placeholder="https://drive.google.com/..." type="url"></div><div class="input-group"><span class="v10-label">DESCRIPTION</span><textarea class="input" id="v10-ndesc-${unitId}" rows="3" style="resize:vertical;"></textarea></div><button class="v10-submit" onclick="v10UploadNote('${s}',${unitId})">Save Note</button></div>${notes.length ? `<div class="v10-items"><div class="v10-items-head">Uploaded Notes (${notes.length})</div>${notes.map(n => `<div class="v10-item"><span>File</span><div class="v10-item-body"><div class="v10-item-title">${n.topicName || n.title}</div><div class="v10-item-meta">${n.description || n.title || ''} ${n.uploadedAt || ''}</div></div>${v10ContentActionMenu(`aimeasyEditNote('${n.id}','${s}',${unitId})`, `v10DeleteNote('${n.id}','${s}',${unitId})`)}</div>`).join('')}</div>` : ''}`;
};

v10PYQForm = function v10PYQFormDropZone(subjectName, unitId) {
  const branch = v10BranchForSubject(subjectName);
  const pyqs = JSON.parse(localStorage.getItem('edusync_admin_pyqs') || '[]').filter(p => p.subject === subjectName && parseInt(p.unit) === parseInt(unitId) && v10SameBranchContent(p, branch));
  const s = v10EscapeJs(subjectName);
  return `<div class="v10-form">${v10TopicFieldsHTML(subjectName, unitId, 'pyq')}${v10FileUploadArea(unitId, 'pyq')}<input class="input" id="v10-pyqlink-${unitId}" type="hidden"><div class="v10-2col"><div class="input-group"><span class="v10-label">YEAR</span><input class="input" id="v10-pyqyr-${unitId}" type="number" min="2000" max="2099"></div><div class="input-group"><span class="v10-label">MARKS</span><input class="input" id="v10-pyqmarks-${unitId}" type="number" min="1"></div></div><div class="input-group"><span class="v10-label">QUESTION</span><textarea class="input" id="v10-pyqtxt-${unitId}" rows="3" style="resize:vertical;"></textarea></div><button class="v10-submit" onclick="v10UploadPYQ('${s}',${unitId})">Save PYQ</button></div>${pyqs.length ? `<div class="v10-items"><div class="v10-items-head">Uploaded PYQs (${pyqs.length})</div>${pyqs.map(p => `<div class="v10-item"><span>Q</span><div class="v10-item-body"><div class="v10-item-title">${p.question}</div><div class="v10-item-meta">${p.topicName || 'No topic'} ${p.year || '-'} ${p.marks || p.count || '-'} marks</div></div>${v10ContentActionMenu(`aimeasyEditPYQ('${p.id}','${s}',${unitId})`, `v10DeletePYQ('${p.id}','${s}',${unitId})`)}</div>`).join('')}</div>` : ''}`;
};

v10IQForm = function v10IQFormDropZone(subjectName, unitId) {
  const branch = v10BranchForSubject(subjectName);
  const iqs = JSON.parse(localStorage.getItem('edusync_admin_iqs') || '[]').filter(q => q.subject === subjectName && parseInt(q.unit) === parseInt(unitId) && v10SameBranchContent(q, branch));
  const s = v10EscapeJs(subjectName);
  return `<div class="v10-form">${v10TopicFieldsHTML(subjectName, unitId, 'iq')}${v10FileUploadArea(unitId, 'iq')}<input class="input" id="v10-iqlink-${unitId}" type="hidden"><div class="input-group"><span class="v10-label">QUESTION</span><textarea class="input" id="v10-iqtxt-${unitId}" rows="3" style="resize:vertical;"></textarea></div><div class="input-group"><span class="v10-label">PRIORITY</span><select class="select" id="v10-iqprio-${unitId}"><option value="high">High</option><option value="med" selected>Medium</option><option value="low">Low</option></select></div><button class="v10-submit" onclick="v10UploadIQ('${s}',${unitId})">Save Important Question</button></div>${iqs.length ? `<div class="v10-items"><div class="v10-items-head">Uploaded Important Questions (${iqs.length})</div>${iqs.map(q => `<div class="v10-item"><span>!</span><div class="v10-item-body"><div class="v10-item-title">${q.question}</div><div class="v10-item-meta">${q.topicName || 'No topic'} ${q.priority || 'med'}</div></div>${v10ContentActionMenu(`aimeasyEditIQ('${q.id}','${s}',${unitId})`, `v10DeleteIQ('${q.id}','${s}',${unitId})`)}</div>`).join('')}</div>` : ''}`;
};

const v10UploadNoteWithLogs = v10UploadNote;
v10UploadNote = async function v10UploadNoteReliable(subjectName, unitId) {
  const before = JSON.parse(localStorage.getItem('edusync_admin_notes') || '[]').length;
  const result = await v10UploadNoteWithLogs(subjectName, unitId);
  const after = JSON.parse(localStorage.getItem('edusync_admin_notes') || '[]').length;
  if (after > before) console.log('[NOTES] Upload Success', { subjectName, unitId });
  return result;
};

const v10UploadPYQWithLogs = v10UploadPYQ;
v10UploadPYQ = async function v10UploadPYQReliable(subjectName, unitId) {
  const before = JSON.parse(localStorage.getItem('edusync_admin_pyqs') || '[]').length;
  const result = await v10UploadPYQWithLogs(subjectName, unitId);
  const after = JSON.parse(localStorage.getItem('edusync_admin_pyqs') || '[]').length;
  if (after > before) console.log('[PYQ] Save Success', { subjectName, unitId });
  return result;
};

const v10UploadIQWithLogs = v10UploadIQ;
v10UploadIQ = async function v10UploadIQReliable(subjectName, unitId) {
  const before = JSON.parse(localStorage.getItem('edusync_admin_iqs') || '[]').length;
  const result = await v10UploadIQWithLogs(subjectName, unitId);
  const after = JSON.parse(localStorage.getItem('edusync_admin_iqs') || '[]').length;
  if (after > before) console.log('[IMPORTANT] Save Success', { subjectName, unitId });
  return result;
};

renderSAUnitsPage = function (subj) {
  if (typeof subj === 'string') try { subj = JSON.parse(subj); } catch (e) { }
  if (!subj || !subj.id) return;
  window._v10SASubj = subj;
  v10SAUnitsPage(subj);
};

/* ── On load: patch admin "subjects" nav ── */
(function patchAdminSubjectsNav() {
  setTimeout(() => {
    const navEl = document.getElementById('admin-nav-subjects');
    if (navEl) navEl.onclick = function () { switchAdminSection('subjects'); };
  }, 300);
})();
// MOHAN'S STUDENT TRACKING AND METRICS
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

// [Omitted duplicate: function recordStudyActivity(type, details = {}) {]
// [Omitted duplicate: const now = new Date();]
// [Omitted duplicate: const events = readStudentJson('edusync_study_activity', []);]
// [Omitted duplicate: events.unshift({ type, ...details, at: now.toISOString(), day: todayKey(now) });]
// [Omitted duplicate: writeStudentJson('edusync_study_activity', events.slice(0, 600));]
// [Omitted duplicate: updateStudyStreak(now);]
// [Omitted duplicate: }]
// [Omitted duplicate: ]
// [Omitted duplicate: function updateStudyStreak(now = new Date()) {]
// [Omitted duplicate: const events = readStudentJson('edusync_study_activity', []);]
// [Omitted duplicate: const days = [...new Set(events.map(event => event.day).filter(Boolean))].sort().reverse();]
// [Omitted duplicate: const today = todayKey(now);]
// [Omitted duplicate: const yesterdayDate = new Date(now);]
// [Omitted duplicate: yesterdayDate.setDate(yesterdayDate.getDate() - 1);]
// [Omitted duplicate: const yesterday = todayKey(yesterdayDate);]
// [Omitted duplicate: let current = 0;]
// [Omitted duplicate: if (days.includes(today) || days.includes(yesterday)) {]
// [Omitted duplicate: const cursor = new Date(days.includes(today) ? now : yesterdayDate);]
// [Omitted duplicate: while (days.includes(todayKey(cursor))) {]
// [Omitted duplicate: current++;]
// [Omitted duplicate: cursor.setDate(cursor.getDate() - 1);]
// [Omitted duplicate: }]
// [Omitted duplicate: }]
// [Omitted duplicate: const best = Math.max(current, parseInt(localStorage.getItem('edusync_best_streak') || '0'));]
// [Omitted duplicate: localStorage.setItem('edusync_streak', String(current));]
// [Omitted duplicate: localStorage.setItem('edusync_best_streak', String(best));]
// [Omitted duplicate: localStorage.setItem('edusync_last_active_date', events[0]?.day || '');]
// [Omitted duplicate: }]
// [Omitted duplicate: ]
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

/* Final roadmap/content fixes: floating menus, subtopics, DB-only student playback. */
export function v10Html(value) {
  return String(value || '').replace(/[&<>"']/g, ch => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  }[ch]));
}

export function v10VideoSubTopic(video, index) {
  return (video?.subTopicName || video?.description || video?.sub_topic_name || video?.title || `Resource ${index + 1}`).trim();
}

v10CloseActionMenus = function v10CloseActionMenusPortal() {
  document.querySelectorAll('.v10-actions-menu.open').forEach(menu => menu.classList.remove('open'));
  document.getElementById('v10-actions-portal')?.remove();
};

window.v10ToggleActionMenu = function v10ToggleActionMenuPortal(button) {
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
};

document.addEventListener('click', (event) => {
  if (!event.target.closest('.v10-actions-menu') && !event.target.closest('#v10-actions-portal')) {
    v10CloseActionMenus();
  }
}, true);
window.addEventListener('scroll', () => v10CloseActionMenus(), true);
window.addEventListener('resize', () => v10CloseActionMenus());

v10ContentActionMenu = function v10ContentActionMenuPortal(editCall, deleteCall) {
  return `<div class="v10-actions-menu">
    <button type="button" class="v10-actions-trigger" title="Actions" aria-label="Actions" data-edit="${v10EscapeAttr(editCall)}" data-delete="${v10EscapeAttr(deleteCall)}" onclick="v10ToggleActionMenu(this)">...</button>
  </div>`;
};

v10RoadmapTopicActionMenu = function (subjId, unitId, topicIdx) {
  return `<div class="v10-actions-menu">
    <button type="button" class="v10-actions-trigger" title="Actions" aria-label="Actions" data-edit-label="Edit Topic" data-delete-label="Delete Topic" data-edit="v10OpenRoadmapEditModal(${subjId},${unitId},${topicIdx})" data-delete="v10DeleteSavedRoadmapTopic(${subjId},${unitId},${topicIdx})" onclick="v10ToggleActionMenu(this)">...</button>
  </div>`;
}

v10NormalizeVideosFromRow = function v10NormalizeVideosFromRowSubtopics(row) {
  const urlRow = row.querySelector('.v10-url-row');
  if (!urlRow) return [];
  const video = {
    subTopicName: urlRow.querySelector('.v10-subtopic-input')?.value.trim() || '',
    url: urlRow.querySelector('.v10-url-input')?.value.trim() || '',
    description: urlRow.querySelector('.v10-video-desc-input')?.value.trim() || '',
  };
  return [video].filter(v => v.subTopicName || v.url || v.description);
};

v10TopicRowHTML = function v10TopicRowHTMLSubtopics(subjId, unitId, idx, name, urls, total, topicId = '', isSubTopic = false) {
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
};

v10AddTopicUrl = function v10AddTopicUrlSubtopic(subjId, unitId, topicIdx) {
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
};

v10SavedRoadmapTree = function v10SavedRoadmapTreeSubtopics(topics, subjId, unitId) {
  const list = Array.isArray(topics) ? topics : [];
  if (!list.length) return '<div class="v10-saved-roadmap-empty">Saved roadmap will appear here after save.</div>';
  return `<div class="v10-saved-roadmap"><div class="v10-items-head">Saved Roadmap (${list.length})</div>${list.map((topic, ti) => {
    const videos = Array.isArray(topic.videos) && topic.videos.length
      ? topic.videos
      : (topic.youtubeUrls || topic.urls || []).map((url) => ({ url, subTopicName: '', description: '' }));
    const topicName = topic.name || topic.topicName || `Topic ${ti + 1}`;
    return `<div class="v10-saved-topic" data-topic-index="${ti}">
      <div class="v10-saved-topic-head">
        <div class="v10-saved-topic-title">${v10Html(topicName)}</div>
        <div class="v10-saved-topic-actions">
          <button type="button" class="btn btn-ghost btn-sm" onclick="v10OpenRoadmapEditModal(${subjId},${unitId},${ti})">Edit</button>
          <button type="button" class="btn btn-danger btn-sm" onclick="v10DeleteSavedRoadmapTopic(${subjId},${unitId},${ti})">Delete</button>
        </div>
      </div>
      <div class="roadmap-video-tree">${videos.length ? videos.map((video, vi) => {
      const label = v10Html(video.subTopicName || video.description || 'Topic resource');
      return `<div class="roadmap-video-child"><strong>${label}</strong>${video.url ? `<div class="roadmap-video-url">${v10Html(video.url)}</div>` : ''}</div>`;
    }).join('') : '<div class="roadmap-video-child">No sub topics added yet</div>'}</div>
    </div>`;
  }).join('')}</div>`;
};

window.v10OpenRoadmapEditModal = function v10OpenRoadmapEditModalSubtopic(subjId, unitId, topicIdx) {
  const row = v10SavedRow(unitId, topicIdx);
  if (!row) return;
  const topicInput = row.querySelector('.v10-topic-fields input:first-child');
  const videoRow = row.querySelector('.v10-url-row');
  const subTopicInput = videoRow?.querySelector('.v10-subtopic-input');
  const urlInput = videoRow?.querySelector('.v10-url-input');
  const descInput = videoRow?.querySelector('.v10-video-desc-input');
  const modal = document.createElement('div');
  modal.className = 'v10-edit-modal';
  modal.innerHTML = `<div class="v10-edit-box">
    <h3>Edit Topic</h3>
    <label>Topic<input class="input" id="v10-edit-topic-name" value="${v10EscapeAttr(topicInput?.value || '')}"></label>
    <label>Sub Topic Name<input class="input" id="v10-edit-subtopic-name" value="${v10EscapeAttr(subTopicInput?.value || '')}"></label>
    <label>Video URL<input class="input" id="v10-edit-topic-url" value="${v10EscapeAttr(urlInput?.value || '')}"></label>
    <label>Description<textarea class="input" id="v10-edit-topic-desc" rows="4">${v10Html(descInput?.value || '')}</textarea></label>
    <div class="v10-edit-actions">
      <button class="btn btn-ghost" onclick="this.closest('.v10-edit-modal').remove()">Cancel</button>
      <button class="btn btn-primary" onclick="v10SaveRoadmapEditModal(${subjId},${unitId},${topicIdx})">Save Changes</button>
    </div>
  </div>`;
  document.body.appendChild(modal);
};

window.v10SaveRoadmapEditModal = async function v10SaveRoadmapEditModalSubtopic(subjId, unitId, topicIdx) {
  const row = v10SavedRow(unitId, topicIdx);
  if (!row) return;
  const topicInput = row.querySelector('.v10-topic-fields input:first-child');
  const videoRow = row.querySelector('.v10-url-row');
  const subTopicInput = videoRow?.querySelector('.v10-subtopic-input');
  const urlInput = videoRow?.querySelector('.v10-url-input');
  const descInput = videoRow?.querySelector('.v10-video-desc-input');
  if (topicInput) topicInput.value = document.getElementById('v10-edit-topic-name')?.value.trim() || '';
  if (subTopicInput) subTopicInput.value = document.getElementById('v10-edit-subtopic-name')?.value.trim() || '';
  if (urlInput) urlInput.value = document.getElementById('v10-edit-topic-url')?.value.trim() || '';
  if (descInput) descInput.value = document.getElementById('v10-edit-topic-desc')?.value.trim() || '';
  document.querySelector('.v10-edit-modal')?.remove();
  await v10SaveRoadmap(subjId, unitId);
};

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

const aimeasySwitchTabWithUnitState = switchTab;
switchTab = function switchTabPersistStudentState(tab) {
  const result = aimeasySwitchTabWithUnitState?.call(this, tab);
  if (document.getElementById('page-unit-content')?.style.display !== 'none') {
    writeStudentUnitState({ tab });
  }
  return result;
};
window.switchTab = switchTab;

export function syncRoadmapNodeStates() {
  const sid = APP.currentSubject?.id || APP.currentSubject?.rawId || 'subject';
  const uid = APP.currentUnit || 1;
  const completed = readStudentJson('edusync_completed_topics', []);
  document.querySelectorAll('.video-item').forEach((node) => {
    const idx = Number(node.dataset.topicIndex || 0);
    const key = topicReviewKey(sid, uid, idx);
    node.classList.toggle('review', APP.markedReviews.has(key));
    node.classList.toggle('completed', completed.includes(key));
    node.classList.toggle('active', idx === APP.currentVideoIndex);
    const isReview = APP.markedReviews.has(key);
    const isCompleted = completed.includes(key);
    node.setAttribute('aria-current', idx === APP.currentVideoIndex ? 'step' : 'false');
    node.setAttribute('aria-label', `${node.textContent.trim()}${isCompleted ? ', completed' : ''}${isReview ? ', marked for review' : ''}`);
    const dot = node.querySelector('.video-item-dot');
    if (dot) dot.textContent = isCompleted ? '✓' : String(idx + 1);
  });
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

renderVideoList = async function renderVideoListDbSubtopics(subjectId, unitNum) {
  let roadmapTopics = [];
  let roadmapContext = null;
  if (subjectId) {
    const dbSubject = APP.currentSubject;
    if (window.aimeasyFetchUnitRoadmap && dbSubject) {
      const { data, error } = await window.aimeasyFetchUnitRoadmap({
        subject: dbSubject,
        unit: { id: unitNum, name: `Unit ${unitNum}` },
      });
      if (error) {
        console.warn('[STUDENT] Roadmap Failed', error);
        showToast?.('Roadmap load failed: ' + (error.message || JSON.stringify(error)), 'red');
      } else {
        roadmapTopics = data?.topics || [];
        roadmapContext = data || null;
      }
    }
  }

  const list = document.getElementById('video-list');
  if (!list) return;
  hydrateMarkedReviews();
  const unitState = readStudentUnitState(APP.currentSubject?.id || subjectId, unitNum);
  APP.currentVideoIndex = Math.max(0, Number(unitState.videoIndex || 0));
  APP._videoItems = [];

  const approvedSuggestions = await fetchApprovedTopicSuggestions(roadmapContext?.subjectId, roadmapContext?.unitId);
  const suggestionsByTopic = approvedSuggestions.reduce((map, row) => {
    const key = String(row.topic_id || '');
    if (!key) return map;
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(row);
    return map;
  }, new Map());

  const groupedHtml = roadmapTopics.map((topic, topicIndex) => {
    const topicTitle = topic.topicName || topic.name || `Topic ${topicIndex + 1}`;
    const adminVideos = Array.isArray(topic.videos) && topic.videos.length
      ? topic.videos
      : (topic.youtubeUrls || topic.urls || []).map((url) => ({ url, description: '' }));
    const suggestedVideos = (suggestionsByTopic.get(String(topic.id || topic.dbContentId || '')) || []).map((row) => ({
      id: row.id,
      url: row.url,
      title: row.title || 'Suggested URL',
      description: row.description || '',
      source: 'suggestion',
    }));
    const sourceVideos = [...adminVideos, ...suggestedVideos]
      .map((video) => ({
        id: video.id || video.dbContentId || '',
        url: (video.url || video.youtubeUrl || '').trim(),
        title: video.title || video.description || topicTitle,
        description: video.description || '',
        source: video.source || 'admin',
      }))
      .filter((video) => video.url || video.description);
    const displayVideos = sourceVideos.length ? sourceVideos : [{ url: '', title: topicTitle, description: '', source: 'admin' }];
    const baseIndex = APP._videoItems.length;
    displayVideos.forEach((video, videoIndex) => APP._videoItems.push({
      type: video.source === 'suggestion' ? 'suggested' : 'roadmap',
      id: topic.id || topic.dbContentId || '',
      topicId: topic.id || topic.dbContentId || '',
      suggestionId: video.source === 'suggestion' ? video.id : '',
      title: topicTitle,
      url: video.url,
      description: video.description || '',
      topicIndex,
      videoIndex,
    }));
    const extraButtons = displayVideos.length > 1 ? `<div class="video-item-extras">${displayVideos.map((video, videoIndex) => {
      const label = video.source === 'suggestion' ? `Suggested ${videoIndex}` : `Video ${videoIndex + 1}`;
      return `<button type="button" class="video-extra-btn" onclick="event.stopPropagation(); selectTopicUrl(${topicIndex},${videoIndex})">${v10Html(label)}</button>`;
    }).join('')}</div>` : '';
    const hasApproved = displayVideos.some((video) => video.source === 'suggestion');
    return `<button type="button" class="video-item ${topicIndex === APP.currentVideoIndex ? 'active' : ''}" data-topic-index="${topicIndex}" onclick="selectVideoItem(${baseIndex})">
      <div class="video-connector"></div>
      <div class="video-item-dot">${topicIndex + 1}</div>
      <div class="video-item-info">
        <div class="video-item-title">${v10Html(topicTitle)}${hasApproved ? ' <span class="badge badge-green">Suggested URLs</span>' : ''}</div>
        ${extraButtons}
      </div>
    </button>`;
  }).join('');

  list.innerHTML = groupedHtml;
  if (APP._videoItems.length) {
    const restoredIndex = Math.min(APP.currentVideoIndex, APP._videoItems.length - 1);
    selectVideoItem(restoredIndex);
    const restoredTab = unitState.tab || APP.currentTab;
    if (restoredTab && restoredTab !== 'videos') window.setTimeout(() => switchTab(restoredTab), 0);
  } else {
    const wrapper = document.getElementById('video-embed-wrapper') || document.querySelector('.video-embed-wrapper');
    if (wrapper) {
      wrapper.innerHTML = `<div class="video-placeholder"><div style="font-size:3.5rem;margin-bottom:4px;">Video</div><div style="opacity:0.75;font-size:0.95rem;color:#fff;">No roadmap available yet</div><div style="font-size:0.8rem;opacity:0.6;margin-top:1rem;">SubAdmin has not saved roadmap videos for this unit</div></div>`;
    }
    const descEl = document.getElementById('video-topic-desc');
    if (descEl) descEl.textContent = 'No roadmap records are saved for this subject and unit yet.';
  }
};

selectVideoItem = function selectVideoItemFlat(idx) {
  APP.currentVideoIndex = idx;
  const item = APP._videoItems?.[idx];
  if (!item) return;
  document.querySelectorAll('.video-item').forEach(el => el.classList.toggle('active', Number(el.dataset.topicIndex) === item.topicIndex));
  writeStudentUnitState({ videoIndex: idx, topicIndex: item.topicIndex, tab: APP.currentTab || 'videos' });
  syncRoadmapNodeStates();

  const displayTitle = item.title;
  const nowLabel = document.getElementById('now-playing-label');
  if (nowLabel) nowLabel.textContent = displayTitle;
  const topicTitleEl = document.getElementById('video-topic-title');
  if (topicTitleEl) topicTitleEl.textContent = displayTitle;

  const sid = APP.currentSubject?.id || 'os';
  const uid = APP.currentUnit || 1;
  recordStudyActivity('video_opened', { subjectId: sid, subjectName: APP.currentSubject?.name || '', unitId: uid, topicIndex: item.topicIndex });
  const reviewKey = topicReviewKey(sid, uid, item.topicIndex);
  const rb = document.getElementById('review-btn');
  if (rb) {
    const isReview = APP.markedReviews.has(reviewKey);
    rb.classList.toggle('marked', isReview);
    rb.textContent = isReview ? 'Marked for Review' : 'Mark for Review';
  }

  const wrapper = document.getElementById('video-embed-wrapper') || document.querySelector('.video-embed-wrapper');
  const descEl = document.getElementById('video-topic-desc');
  if (!wrapper) return;
  const url = item.url || '';
  const videoId = convertYouTubeToEmbed(url);
  if (videoId) {
    renderStudentYouTubeVideo(wrapper, item, idx, videoId, displayTitle);
    if (descEl) descEl.textContent = '';
    renderTopicInlineNotes(item.title, sid, uid, item.topicIndex);
    window.renderPendingUrls?.();
    return;
  }
  if (url) {
    if (/\.(mp4|webm|ogg)(\?|#|$)/i.test(url)) {
      wrapper.innerHTML = `<video src="${v10EscapeAttr(url)}" controls autoplay playsinline style="width:100%;height:100%;border-radius:var(--radius-lg);background:#000;"></video>`;
    } else {
      wrapper.innerHTML = `<iframe src="${v10EscapeAttr(url)}" frameborder="0" allowfullscreen></iframe>`;
    }
    if (descEl) descEl.textContent = '';
    renderTopicInlineNotes(item.title, sid, uid, item.topicIndex);
    window.renderPendingUrls?.();
    return;
  }
  wrapper.innerHTML = `<div class="video-placeholder"><div style="font-size:3.5rem;margin-bottom:4px;">Video</div><div style="opacity:0.75;font-size:0.95rem;color:#fff;margin-top:6px;">${v10Html(displayTitle)}</div></div>`;
  if (descEl) descEl.textContent = 'Video coming soon.';
  renderTopicInlineNotes(item.title, sid, uid, item.topicIndex);
  window.renderPendingUrls?.();
};

selectTopicUrl = function selectTopicUrlFlat(topicIndex, urlIndex) {
  const matchIndex = (APP._videoItems || []).findIndex(item => item.topicIndex === topicIndex && item.videoIndex === urlIndex);
  if (matchIndex >= 0) selectVideoItem(matchIndex);
};

prevVideo = function prevVideoFlat() {
  if (APP.currentVideoIndex > 0) {
    selectVideoItem(APP.currentVideoIndex - 1);
    showToast('Previous video', 'blue');
  } else {
    showToast('This is the first video', 'amber');
  }
};

nextVideo = function nextVideoFlat() {
  const total = APP._videoItems?.length || 0;
  const item = APP._videoItems?.[APP.currentVideoIndex];
  const sid = APP.currentSubject?.id || 'os';
  const uid = APP.currentUnit || 1;
  const active = document.querySelector(`.video-item[data-topic-index="${item?.topicIndex ?? APP.currentVideoIndex}"]`);
  active?.classList.add('completed');
  if (item) {
    markTopicCompleted(sid, uid, item.topicIndex);
    syncTopicProgressToDb({ subjectId: sid, unitId: uid, topicIndex: item.topicIndex, topicId: item.id || item.topicId || null, status: 'completed' });
  }
  if (APP.currentVideoIndex < total - 1) {
    selectVideoItem(APP.currentVideoIndex + 1);
    document.querySelector(`.video-item[data-topic-index="${APP._videoItems?.[APP.currentVideoIndex]?.topicIndex ?? APP.currentVideoIndex}"]`)?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    showToast('Progress saved', 'green');
  } else {
    showToast('Unit complete', 'green');
  }
};

/* Persistent PDF uploads for student-side note preview. */
export const AIMEASY_CONTENT_BUCKET = 'aimeasy-content';
window.__aimeasyLocalFilePreviews = window.__aimeasyLocalFilePreviews || {};
window.__aimeasyPendingUploads = window.__aimeasyPendingUploads || {};

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

window.v10HandleUploadFile = async function v10HandleUploadFilePersistent(file, target, unitId) {
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
};

const v10UploadNoteBeforePersistentFiles = v10UploadNote;
v10UploadNote = async function v10UploadNoteWaitForPersistentFile(subjectName, unitId) {
  const inputId = `v10-nlink-${unitId}`;
  const pending = window.__aimeasyPendingUploads?.[inputId];
  if (pending) {
    showToast('Finishing file upload before saving...', 'blue');
    await pending;
  }
  return v10UploadNoteBeforePersistentFiles(subjectName, unitId);
};

previewNoteInline = function previewNoteInlinePersistent(link, title) {
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
};

downloadNote = function downloadNotePersistent(link, title) {
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
};

/* Curriculum workflow: isolated from Create Subject data. */
export const CURRICULUM_STATUS = ['Draft', 'In Progress', 'Completed', 'Sent To SubAdmin', 'Published', 'Returned'];

export function aimReadJson(key, fallback = []) {
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

window.aimCreateCurriculumBlueprint = async function aimCreateCurriculumBlueprint() {
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
};

window.renderSubAdminCurriculum = async function renderSubAdminCurriculum() {
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
};

window.aimReviewCurriculum = async function aimReviewCurriculum(id, status) {
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
};

const aimOriginalSwitchSASection = window.switchSASection || switchSASection;
window.switchSASection = switchSASection = function switchSASectionCurriculum(section) {
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
};

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
window.v10PersistSubjectDbIds = v10PersistSubjectDbIds;

window.renderCRDashboard = async function renderCRDashboardWorkflow() {
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
};

window.renderCRAddContent = async function renderCRAddContentWorkflow() {
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
};

window.aimSaveCreatorCurriculumContent = async function aimSaveCreatorCurriculumContent(curriculumId, unitId) {
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
};

window.aimSendCurriculumForReview = async function aimSendCurriculumForReview(curriculumId, unitId) {
  const curriculums = aimLocalCurriculums();
  const cur = curriculums.find(row => String(row.id) === String(curriculumId));
  const unit = cur?.units?.find(row => String(row.id) === String(unitId));
  if (unit) unit.status = 'Sent To SubAdmin';
  if (cur) cur.status = 'Sent To SubAdmin';
  aimWriteJson('aimeasy_curriculums', curriculums);
  await window.aimeasyUpdateCurriculumStatus?.({ curriculumId, unitId, status: 'Sent To SubAdmin' });
  showToast('Sent to SubAdmin for review.', 'green');
  renderCRAddContent();
};

/* Production admin/student experience patch. Keep this late so it wins over legacy overrides. */
(function installAiiensProductionExperiencePatch() {
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
})();

// Backward-compatible globals for inline legacy HTML handlers.
// Keep this outside feature code so UI clicks never fail with ReferenceError after refactors.
(function installLegacyInlineHandlerGlobals() {
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
})();

/* Supabase-backed student dashboard/profile and live workshop patch. */
(function installStudentDashboardAndWorkshopPatch() {
  if (window.__aiiensStudentWorkshopPatchInstalled) return;
  window.__aiiensStudentWorkshopPatchInstalled = true;

  const esc = (value) => String(value ?? '').replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
  const js = (value) => String(value ?? '').replace(/\\/g, '\\\\').replace(/'/g, "\\'");
  const sb = () => window.__AIMEASY_SUPABASE__;
  let liveWorkshopChannel = null;
  const todayKeyDb = (date = new Date()) => date.toISOString().slice(0, 10);
  const pctFromCgpa = (cgpa) => Math.max(0, Math.min(100, Number(cgpa || 0) * 9.5));

  async function authUser() {
    try {
      const { data } = await sb()?.auth?.getUser?.();
      return data?.user || null;
    } catch {
      return null;
    }
  }

  async function userId() {
    const user = await authUser();
    return user?.id || window.APP?.user?.id || window.APP?.user?.googleId || null;
  }

  function syncAppProfilePatch(patch) {
    window.APP = window.APP || {};
    window.APP.user = { ...(window.APP.user || {}), ...patch };
    window.updateSidebarProfile?.();
    window.updateDashGreeting?.();
  }

  async function saveProfileInstantly(reason = 'profile-edit') {
    const supabase = sb();
    const id = await userId();
    if (!supabase || !id) return;

    const previous = { ...(window.APP?.user || {}) };
    const patch = {
      id,
      email: previous.email || (await authUser())?.email || null,
      role: previous.role || window.APP?.role || 'student',
      full_name: document.getElementById('p-name')?.value?.trim() || null,
      name: document.getElementById('p-name')?.value?.trim() || null,
      phone: document.getElementById('p-phone')?.value?.trim() || null,
      phone_number: document.getElementById('p-phone')?.value?.trim() || null,
      college: document.getElementById('p-college')?.value?.trim() || null,
      university_name: document.getElementById('p-university')?.value?.trim() || null,
      regulation_code: document.getElementById('p-regulation')?.value?.trim() || null,
      branch_name: document.getElementById('p-branch')?.value?.trim() || null,
      year: document.getElementById('p-year')?.value?.trim() || null,
      semester: document.getElementById('p-semester')?.value?.trim() || null,
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase.from('profiles').upsert(patch, { onConflict: 'id' });
    if (error) {
      console.warn('[PROFILE] Instant save failed:', error.message || error);
      return;
    }

    syncAppProfilePatch({
      name: patch.name,
      full_name: patch.full_name,
      phone: patch.phone,
      phone_number: patch.phone_number,
      college: patch.college,
      university: patch.university_name,
      university_name: patch.university_name,
      regulation: patch.regulation_code,
      regulation_code: patch.regulation_code,
      branch: patch.branch_name,
      branch_name: patch.branch_name,
      year: patch.year,
      semester: patch.semester,
    });

    if (reason === 'academic-change') {
      window.buildSemSwitcher?.(patch.semester);
      await window.renderSubjects?.(patch.semester);
      await refreshLearningSummary();
      await loadDashboardSupabaseData();
      window.dispatchEvent(new CustomEvent('aiiens:academic-profile-changed'));
    }
  }

  function installProfileAutosave() {
    const screen = document.getElementById('screen-profile');
    if (!screen || screen.dataset.aiiensAutosaveInstalled) return;
    screen.dataset.aiiensAutosaveInstalled = 'true';

    const card = screen.querySelector('.profile-card');
    const back = screen.querySelector('.aimeasy-profile-back');
    if (back) {
      back.classList.add('profile-settings-back-top');
      back.textContent = 'Back';
    } else if (card) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'btn btn-ghost btn-sm aimeasy-profile-back profile-settings-back-top';
      btn.textContent = 'Back';
      btn.addEventListener('click', () => window.aimeasySafeBack?.('/student/dashboard', () => window.navigateTo?.('dashboard')));
      card.insertBefore(btn, card.firstChild);
    }

    let timer = null;
    const schedule = (reason) => {
      clearTimeout(timer);
      timer = setTimeout(() => saveProfileInstantly(reason), 450);
    };
    ['p-name', 'p-phone', 'p-college', 'p-university', 'p-regulation', 'p-branch'].forEach((id) => {
      document.getElementById(id)?.addEventListener('input', () => schedule('profile-edit'));
      document.getElementById(id)?.addEventListener('change', () => schedule('profile-edit'));
    });
    ['p-year', 'p-semester'].forEach((id) => {
      document.getElementById(id)?.addEventListener('change', () => schedule('academic-change'));
    });
  }

  const originalShowScreen = window.showScreen;
  window.showScreen = globalThis.showScreen = function showScreenStudentPatch(id, ...args) {
    const result = originalShowScreen?.call(this, id, ...args);
    if (id === 'screen-profile') setTimeout(installProfileAutosave, 0);
    if (id === 'screen-app') setTimeout(() => { touchStreak(); loadDashboardSupabaseData(); }, 0);
    if (id === 'screen-live-workshops') setTimeout(renderLiveWorkshopDashboard, 0);
    return result;
  };

  window.confirmLogout = globalThis.confirmLogout = async function confirmLogoutSessionOnly() {
    window.APP.session = false;
    window.APP.user = null;
    window.APP.calcSemesters = [];
    window.APP.currentSemId = '';
    window.closeLogoutModal?.();
    try {
      await sb()?.auth?.signOut?.();
    } catch (error) {
      console.warn('Supabase signOut failed:', error?.message || error);
    }
    window.showToast?.('Logged out successfully', 'blue');
    const fab = document.getElementById('chat-fab');
    if (fab) fab.style.display = 'none';
    document.getElementById('chat-window')?.classList.remove('open');
    setTimeout(() => window.showScreen?.('screen-landing'), 250);
  };

  async function saveRecentSubjectToDb(subject) {
    const supabase = sb();
    const id = await userId();
    if (!supabase || !id || !subject) return;
    const rawId = String(subject.rawId || subject.id || subject.name || '').replace(/^custom_/, '');
    if (!rawId) return;
    const row = {
      user_id: id,
      subject_id: rawId,
      subject_name: subject.name || 'Subject',
      subject_code: subject.code || null,
      subject_icon: subject.icon || null,
      branch: subject.branch || window.APP?.user?.branch || window.APP?.user?.branch_name || null,
      regulation: subject.reg || subject.regulation || window.APP?.user?.regulation || window.APP?.user?.regulation_code || null,
      semester: subject.sem || subject.semester || window.APP?.user?.semester || null,
      last_opened_at: new Date().toISOString(),
    };
    const { error } = await supabase.from('student_recent_subjects').upsert(row, { onConflict: 'user_id,subject_id' });
    if (error) console.warn('[DASHBOARD] Recent subject save failed:', error.message || error);
  }

  const originalAddRecent = window.addToRecentlyOpened || globalThis.addToRecentlyOpened;
  window.addToRecentlyOpened = globalThis.addToRecentlyOpened = function addRecentSupabase(name, code, icon, id) {
    saveRecentSubjectToDb({ id, rawId: id, name, code, icon });
    return originalAddRecent?.apply(this, arguments);
  };

  const originalOpenSubject = window.openSubject || globalThis.openSubject;
  if (typeof originalOpenSubject === 'function') {
    window.openSubject = globalThis.openSubject = async function openSubjectSupabaseTracked(id) {
      const result = await originalOpenSubject.apply(this, arguments);
      if (window.APP?.currentSubject) await saveRecentSubjectToDb(window.APP.currentSubject);
      await touchStreak();
      return result;
    };
  }

  async function saveCgpaFromCalculator() {
    const supabase = sb();
    const id = await userId();
    if (!supabase || !id) return;
    const cgpa = Number(document.getElementById('cgpa-result')?.textContent || document.getElementById('sgpa-result')?.textContent || 0);
    const sgpa = Number(document.getElementById('sgpa-result')?.textContent || 0);
    if (!Number.isFinite(cgpa) || cgpa <= 0) return;
    const { error } = await supabase.from('student_cgpa_results').insert({
      user_id: id,
      semester_key: window.APP?.currentSemId || null,
      sgpa: Number.isFinite(sgpa) ? sgpa : null,
      cgpa,
      percentage: Number(pctFromCgpa(cgpa).toFixed(2)),
      payload: { currentSemId: window.APP?.currentSemId || null, semesters: window.APP?.calcSemesters || [] },
    });
    if (error) console.warn('[DASHBOARD] CGPA save failed:', error.message || error);
    await loadDashboardSupabaseData();
  }

  const originalCalculateGPA = window.calculateGPA || globalThis.calculateGPA;
  if (typeof originalCalculateGPA === 'function') {
    window.calculateGPA = globalThis.calculateGPA = function calculateGpaSupabase() {
      const result = originalCalculateGPA.apply(this, arguments);
      setTimeout(saveCgpaFromCalculator, 0);
      return result;
    };
  }

  async function refreshLearningSummary() {
    const supabase = sb();
    const id = await userId();
    if (!supabase || !id) return null;
    let completedTopics = 0;
    let totalTopics = 0;
    try {
      const { count } = await supabase.from('student_topic_progress').select('id', { count: 'exact', head: true }).eq('user_id', id).eq('status', 'completed');
      completedTopics = count || 0;
    } catch (error) {
      console.warn('[DASHBOARD] Progress count failed:', error?.message || error);
    }
    try {
      let subjectIds = [];
      if (window.aimeasyFetchSubjects) {
        const user = window.APP?.user || {};
        const { data } = await window.aimeasyFetchSubjects({
          semester: user.semester,
          university_name: user.university_name || user.university,
          branch: user.branch_name || user.branch,
          regulation_code: user.regulation_code || user.regulation,
        });
        subjectIds = (data || []).map(row => row.id).filter(Boolean);
      }
      if (subjectIds.length) {
        const { count } = await supabase.from('topics').select('id', { count: 'exact', head: true }).in('subject_id', subjectIds);
        totalTopics = count || 0;
      }
    } catch (error) {
      console.warn('[DASHBOARD] Topic total failed:', error?.message || error);
    }
    const learningPercentage = totalTopics ? Math.round((completedTopics / totalTopics) * 100) : 0;
    const row = {
      user_id: id,
      total_topics: totalTopics,
      completed_topics: completedTopics,
      completed_videos: completedTopics,
      learning_percentage: learningPercentage,
      updated_at: new Date().toISOString(),
    };
    const { error } = await supabase.from('student_learning_summaries').upsert(row, { onConflict: 'user_id' });
    if (error) console.warn('[DASHBOARD] Learning summary save failed:', error.message || error);
    return row;
  }

  const originalMarkTopicCompleted = window.markTopicCompleted || globalThis.markTopicCompleted;
  if (typeof originalMarkTopicCompleted === 'function') {
    window.markTopicCompleted = globalThis.markTopicCompleted = function markTopicCompletedSupabase() {
      const result = originalMarkTopicCompleted.apply(this, arguments);
      setTimeout(() => { refreshLearningSummary(); touchStreak(); loadDashboardSupabaseData(); }, 0);
      return result;
    };
  }

  async function touchStreak() {
    const supabase = sb();
    const id = await userId();
    if (!supabase || !id) return null;
    const today = todayKeyDb();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayKey = todayKeyDb(yesterday);
    const { data } = await supabase.from('student_streaks').select('*').eq('user_id', id).maybeSingle();
    let current = Number(data?.current_streak || 0);
    let missed = false;
    if (data?.last_active_date === today) {
      missed = false;
    } else if (data?.last_active_date === yesterdayKey) {
      current += 1;
    } else {
      missed = Boolean(data?.last_active_date);
      current = 1;
    }
    const best = Math.max(current, Number(data?.best_streak || 0));
    const row = { user_id: id, current_streak: current, best_streak: best, last_active_date: today, missed_yesterday: missed, updated_at: new Date().toISOString() };
    const { error } = await supabase.from('student_streaks').upsert(row, { onConflict: 'user_id' });
    if (error) console.warn('[DASHBOARD] Streak save failed:', error.message || error);
    renderStreak(row);
    return row;
  }

  function renderStreak(row) {
    const card = document.querySelector('#page-dashboard .streak-card');
    const metric = document.querySelector('#page-dashboard .metric-card.lavender .metric-val');
    const trend = document.querySelector('#page-dashboard .metric-card.lavender .metric-trend');
    if (metric) metric.textContent = String(row?.current_streak || 0);
    if (trend) trend.textContent = row?.missed_yesterday ? 'You missed your streak yesterday.' : `Current Streak = ${row?.current_streak || 0} Days`;
    if (!card || !row) return;
    card.innerHTML = `
      <div class="compact-streak-card">
        <div>
          <div class="compact-kicker">Current Streak</div>
          <div class="compact-streak-value">Day ${esc(row.current_streak || 0)}</div>
        </div>
        <div class="compact-streak-meta">
          <span>Current Streak = <strong>${esc(row.current_streak || 0)} Days</strong></span>
          <span>Best: <strong>${esc(row.best_streak || 0)} Days</strong></span>
          ${row.missed_yesterday ? '<span class="streak-missed">You missed your streak yesterday.</span>' : ''}
        </div>
      </div>`;
  }

  async function loadDashboardSupabaseData() {
    if (document.getElementById('page-dashboard')?.style.display === 'none') return;
    const supabase = sb();
    const id = await userId();
    if (!supabase || !id) return;
    try {
      const { data } = await supabase.from('student_cgpa_results').select('*').eq('user_id', id).order('calculated_at', { ascending: false }).limit(1);
      const latest = data?.[0];
      const cgpaEl = document.querySelector('#page-dashboard .metric-card.blue .metric-val');
      const cgpaTrend = document.querySelector('#page-dashboard .metric-card.blue .metric-trend');
      if (latest && cgpaEl) cgpaEl.textContent = Number(latest.cgpa).toFixed(2);
      if (latest && cgpaTrend) cgpaTrend.textContent = `${Number(latest.percentage).toFixed(2)}% latest percentage`;
    } catch (error) {
      console.warn('[DASHBOARD] CGPA load failed:', error?.message || error);
    }
    try {
      const summary = await refreshLearningSummary();
      const progressEl = document.querySelector('#page-dashboard .metric-card.teal .metric-val');
      const progressTrend = document.querySelector('#page-dashboard .metric-card.teal .metric-trend');
      if (summary && progressEl) progressEl.textContent = `${summary.learning_percentage}%`;
      if (summary && progressTrend) progressTrend.textContent = `${summary.completed_topics} topics, ${summary.completed_videos} videos completed`;
      const tracker = document.querySelector('#page-dashboard .progress-tracker');
      if (summary && tracker) {
        tracker.innerHTML = `
          <div class="section-heading">Learning Progress</div>
          <div class="weekly-summary compact-weekly-summary">
            <div><strong>${esc(summary.completed_topics)}</strong><span>Topics Completed</span></div>
            <div><strong>${esc(summary.completed_videos)}</strong><span>Videos Completed</span></div>
            <div><strong>${esc(summary.learning_percentage)}%</strong><span>Overall Learning</span></div>
          </div>
          <div class="weekly-mini-progress"><span style="width:${Math.max(4, Math.min(100, Number(summary.learning_percentage) || 0))}%"></span></div>`;
      }
    } catch (error) {
      console.warn('[DASHBOARD] Learning summary load failed:', error?.message || error);
    }
    try {
      const { data } = await supabase.from('student_recent_subjects').select('*').eq('user_id', id).order('last_opened_at', { ascending: false }).limit(5);
      const listEl = document.getElementById('recently-opened-list') || document.querySelector('#page-dashboard .dash-row-3 .card');
      if (listEl) {
        listEl.innerHTML = `<div class="section-heading">Recently Opened</div>` + ((data || []).length ? (data || []).map(item => `
          <div class="recent-item">
            <div class="recent-info">
              <div class="recent-title">${esc(item.subject_name)}</div>
              <div class="recent-sub">${esc(item.subject_code || 'Subject')} - ${esc(new Date(item.last_opened_at).toLocaleString())}</div>
            </div>
            <button class="btn btn-primary btn-sm" onclick="openSubjectFromRecent('${js('custom_' + item.subject_id)}')">Continue</button>
          </div>`).join('') : '<div class="empty-state-card">No subjects opened yet.</div>');
      }
    } catch (error) {
      console.warn('[DASHBOARD] Recent subjects load failed:', error?.message || error);
    }
    try {
      const { data } = await supabase.from('student_streaks').select('*').eq('user_id', id).maybeSingle();
      if (data) renderStreak(data);
    } catch (error) {
      console.warn('[DASHBOARD] Streak load failed:', error?.message || error);
    }
  }

  const originalNavigateTo = window.navigateTo || globalThis.navigateTo;
  if (typeof originalNavigateTo === 'function') {
    window.navigateTo = globalThis.navigateTo = function navigateToSupabase(page) {
      const result = originalNavigateTo.apply(this, arguments);
      if (page === 'dashboard') setTimeout(() => { touchStreak(); loadDashboardSupabaseData(); }, 0);
      return result;
    };
  }

  function ensureLiveWorkshopSurfaces() {
    const roleCards = document.querySelector('.role-cards');
    if (roleCards && !document.getElementById('role-live-workshops')) {
      roleCards.insertAdjacentHTML('beforeend', `
        <div class="role-card live-workshops" id="role-live-workshops" onclick="openLiveWorkshops()">
          <div class="role-icon">Live</div>
          <div class="role-label">Live Workshops</div>
          <div class="role-desc">Join expert-led live sessions</div>
        </div>`);
    }
    const statsRow = document.querySelector('#screen-landing .stats-row');
    if (statsRow && !document.getElementById('stat-workshop-participants')) {
      statsRow.insertAdjacentHTML('beforeend', `
        <div class="stat-item">
          <div class="stat-num" id="stat-workshop-participants">0</div>
          <div class="stat-label">Total Workshop Participants</div>
        </div>`);
      window.updateLandingStats?.();
    }
    if (!document.getElementById('screen-live-workshops')) {
      document.body.insertAdjacentHTML('beforeend', `
        <div class="screen live-workshop-screen" id="screen-live-workshops">
          <div class="live-workshop-shell">
            <header class="live-workshop-topbar">
              <button class="btn btn-ghost btn-sm" onclick="showScreen('screen-landing')">Back</button>
              <strong>Live Workshops</strong>
            </header>
            <main id="live-workshop-content"></main>
          </div>
        </div>`);
    }
    const adminNav = document.querySelector('#screen-admin nav');
    if (adminNav && !document.getElementById('admin-nav-liveworkshops')) {
      adminNav.insertAdjacentHTML('beforeend', `
        <div class="admin-nav-item" id="admin-nav-liveworkshops" onclick="switchAdminSection('liveworkshops')">
          <span>Live</span> Live Workshops
        </div>`);
    }
  }

  window.openLiveWorkshops = async function openLiveWorkshops() {
    ensureLiveWorkshopSurfaces();
    const user = await authUser();
    if (!user) {
      const supabase = sb();
      if (!supabase) {
        window.showToast?.('Google login is not configured.', 'red');
        return;
      }
      try {
        sessionStorage.setItem('aimeasy_login_portal', 'live_workshop');
        localStorage.setItem('aimeasy_login_portal_backup', 'live_workshop');
        sessionStorage.setItem('aiiens_live_workshop_auth', '1');
      } catch {}
      await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: `${window.location.origin}${window.location.pathname}#/live-workshops` },
      });
      return;
    }
    try {
      sessionStorage.setItem('aimeasy_login_portal', 'live_workshop');
      localStorage.setItem('aimeasy_login_portal_backup', 'live_workshop');
      sessionStorage.setItem('aiiens_live_workshop_auth', '1');
    } catch {}
    window.showScreen?.('screen-live-workshops');
    await renderLiveWorkshopDashboard();
  };

  async function loadWorkshopRegistration() {
    const supabase = sb();
    const user = await authUser();
    const id = user?.id || await userId();
    if (!supabase || !id) return null;
    const { data, error } = await supabase
      .from('live_workshop_registrations')
      .select('*')
      .eq('user_id', id)
      .is('workshop_id', null)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) console.warn('[LIVE WORKSHOP] Registration load failed:', error.message || error);
    return data || null;
  }

  function subscribeLiveWorkshopUpdates() {
    const supabase = sb();
    if (!supabase || liveWorkshopChannel) return;
    liveWorkshopChannel = supabase.channel('live-workshop-dashboard')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'live_workshops' }, () => {
        if (document.getElementById('screen-live-workshops')?.classList.contains('active')) renderLiveWorkshopDashboard();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'live_workshop_banners' }, () => {
        if (document.getElementById('screen-live-workshops')?.classList.contains('active')) renderLiveWorkshopDashboard();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'live_workshop_registrations' }, () => {
        window.updateLandingStats?.();
      })
      .subscribe?.();
  }

  async function renderLiveWorkshopDashboard() {
    ensureLiveWorkshopSurfaces();
    const root = document.getElementById('live-workshop-content');
    if (!root) return;
    const user = await authUser();
    if (!user) {
      root.innerHTML = '<div class="empty-state-card">Please sign in with Google to continue.</div>';
      return;
    }
    subscribeLiveWorkshopUpdates();
    let registration = null;
    try {
      registration = await loadWorkshopRegistration();
    } catch (error) {
      console.warn('[LIVE WORKSHOP] Registration lookup crashed:', error?.message || error);
    }
    if (!registration) {
      root.innerHTML = `
        <section class="live-workshop-form">
          <h2>Complete Workshop Profile</h2>
          <div class="input-group"><label>Name</label><input class="input" id="lw-name" value="${esc(user.user_metadata?.full_name || user.email || '')}"></div>
          <div class="input-group"><label>Mobile Number</label><input class="input" id="lw-mobile" maxlength="10" inputmode="numeric"></div>
          <div class="input-group"><label>Role</label><select class="select" id="lw-role" onchange="document.getElementById('lw-college-wrap').style.display=this.value==='student'?'block':'none'"><option value="student">Student</option><option value="job_holder">Job Holder</option><option value="other">Other</option></select></div>
          <div class="input-group" id="lw-college-wrap"><label>College Name</label><input class="input" id="lw-college"></div>
          <button class="btn btn-primary" onclick="submitLiveWorkshopProfile()">Submit</button>
        </section>`;
      return;
    }
    await renderPublishedWorkshops(root);
  }

  window.submitLiveWorkshopProfile = async function submitLiveWorkshopProfile() {
    const supabase = sb();
    const id = await userId();
    if (!supabase || !id) return;
    const nameVal = document.getElementById('lw-name')?.value?.trim() || '';
    const mobileVal = document.getElementById('lw-mobile')?.value?.trim() || '';
    const role = document.getElementById('lw-role')?.value || 'student';
    const collegeVal = document.getElementById('lw-college')?.value?.trim() || '';

    if (!nameVal) {
      window.showToast?.('Name is required', 'red');
      return;
    }
    if (!/^[0-9]{10}$/.test(mobileVal)) {
      window.showToast?.('Enter a valid 10-digit mobile number', 'red');
      return;
    }
    if (role === 'student' && !collegeVal) {
      window.showToast?.('College name is required for student role', 'red');
      return;
    }

    const row = {
      user_id: id,
      name: nameVal,
      mobile_number: mobileVal,
      role_type: role,
      college_name: role === 'student' ? collegeVal : null,
      created_at: new Date().toISOString(),
    };

    const existing = await supabase
      .from('live_workshop_registrations')
      .select('id')
      .eq('user_id', id)
      .is('workshop_id', null)
      .limit(1)
      .maybeSingle();
    if (existing.error) {
      console.warn('[LIVE WORKSHOP] Existing registration check failed:', existing.error.message || existing.error);
      window.showToast?.('Could not verify workshop registration. Please try again.', 'red');
      return;
    }
    const request = existing.data?.id
      ? supabase.from('live_workshop_registrations').update(row).eq('id', existing.data.id)
      : supabase.from('live_workshop_registrations').insert(row);
    const { error } = await request;
    if (error) {
      window.showToast?.('Could not save workshop profile: ' + error.message, 'red');
      return;
    }
    try {
      sessionStorage.setItem('aiiens_live_workshop_auth', '1');
      sessionStorage.setItem('aimeasy_login_portal', 'live_workshop');
    } catch {}
    window.showToast?.('Workshop profile saved', 'green');
    window.updateLandingStats?.();
    await renderLiveWorkshopDashboard();
  };

  async function renderPublishedWorkshops(root) {
    const supabase = sb();
    let banner = null;
    try {
      const { data: bannerData, error: bannerError } = await supabase
        .from('live_workshop_banners')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (!bannerError) banner = bannerData || null;
    } catch (error) {
      console.warn('[LIVE WORKSHOP] Banner load failed:', error?.message || error);
    }
    let { data, error } = await supabase.from('live_workshops').select('*').eq('status', 'published').order('workshop_date', { ascending: true });
    if (error) {
      root.innerHTML = `<div class="empty-state-card">Could not load workshops: ${esc(error.message)}</div>`;
      return;
    }
    const bannerImage = banner?.banner_image || banner?.image_url || (data || []).find(row => row.banner_image)?.banner_image || '';
    const bannerTitle = banner?.banner_title || banner?.title || 'Live Workshops';
    const bannerSubtitle = banner?.banner_subtitle || banner?.subtitle || 'Upcoming expert sessions';
    root.innerHTML = `
      <section class="live-workshop-banner" ${bannerImage ? `style="background-image:url('${esc(bannerImage)}')"` : ''}>
        <div><span>${esc(bannerTitle)}</span><h1>${esc(bannerSubtitle)}</h1></div>
      </section>
      <section class="live-workshop-grid">
        ${(data || []).length ? data.map(workshopCard).join('') : '<div class="empty-state-card">No published workshops yet.</div>'}
      </section>`;
  }

  function workshopCard(row) {
    return `
      <article class="live-workshop-card">
        <h3>${esc(row.workshop_name)}</h3>
        <p><strong>Speaker:</strong> ${esc(row.speaker_name)}</p>
        <p><strong>Date:</strong> ${esc(row.workshop_date)} <strong>Time:</strong> ${esc(row.workshop_time)}</p>
        <p>${esc(row.description || '')}</p>
        <a class="btn btn-primary" href="${esc(row.join_link)}" target="_blank" rel="noreferrer">Join</a>
      </article>`;
  }

  async function renderAdminLiveWorkshops() {
    ensureLiveWorkshopSurfaces();
    const content = document.getElementById('admin-content');
    if (!content) return;
    content.innerHTML = `
      <div class="admin-section-head"><div><h2>Live Workshops</h2><p>Create, publish, edit, and delete live workshop sessions.</p></div></div>
      <div class="card live-admin-form">
        <input class="input" id="admin-lw-id" type="hidden">
        <div class="form-row"><div class="input-group"><label>Workshop Name</label><input class="input" id="admin-lw-name"></div><div class="input-group"><label>Speaker Name</label><input class="input" id="admin-lw-speaker"></div></div>
        <div class="form-row"><div class="input-group"><label>Date</label><input class="input" id="admin-lw-date" type="date"></div><div class="input-group"><label>Time</label><input class="input" id="admin-lw-time" type="time"></div></div>
        <div class="input-group"><label>Description</label><textarea class="input" id="admin-lw-desc" rows="3"></textarea></div>
        <div class="form-row"><div class="input-group"><label>Join Link</label><input class="input" id="admin-lw-link" type="url"></div><div class="input-group"><label>Banner Image URL</label><input class="input" id="admin-lw-banner" type="url"></div></div>
        <button class="btn btn-primary" onclick="saveAdminLiveWorkshop()">Save Workshop</button>
      </div>
      <div id="admin-live-workshop-list" class="live-workshop-grid"></div>`;
    await loadAdminLiveWorkshopList();
  }

  async function loadAdminLiveWorkshopList() {
    const supabase = sb();
    const list = document.getElementById('admin-live-workshop-list');
    if (!supabase || !list) return;
    const { data, error } = await supabase.from('live_workshops').select('*').order('created_at', { ascending: false });
    if (error) {
      list.innerHTML = `<div class="empty-state-card">Could not load workshops: ${esc(error.message)}</div>`;
      return;
    }
    list.innerHTML = (data || []).length ? data.map(row => `
      <article class="live-workshop-card">
        <h3>${esc(row.workshop_name)}</h3>
        <p>${esc(row.speaker_name)} - ${esc(row.workshop_date)} ${esc(row.workshop_time)}</p>
        <p>${esc(row.description || '')}</p>
        <div style="display:flex;gap:8px;flex-wrap:wrap;">
          <button class="btn btn-ghost btn-sm" onclick='editAdminLiveWorkshop(${JSON.stringify(row).replace(/'/g, '&#39;')})'>Edit</button>
          <button class="btn btn-primary btn-sm" onclick="toggleAdminLiveWorkshop('${js(row.id)}', ${((row.status || '').toLowerCase() === 'published') ? 'false' : 'true'})">${((row.status || '').toLowerCase() === 'published') ? 'Unpublish' : 'Publish'}</button>
          <button class="btn btn-danger btn-sm" onclick="deleteAdminLiveWorkshop('${js(row.id)}')">Delete</button>
        </div>
      </article>`).join('') : '<div class="empty-state-card">No workshops created yet.</div>';
  }

  window.saveAdminLiveWorkshop = async function saveAdminLiveWorkshop() {
    const supabase = sb();
    if (!supabase) return;
    const auth = await authUser();
    const row = {
      workshop_name: document.getElementById('admin-lw-name')?.value?.trim(),
      speaker_name: document.getElementById('admin-lw-speaker')?.value?.trim(),
      workshop_date: document.getElementById('admin-lw-date')?.value,
      workshop_time: document.getElementById('admin-lw-time')?.value,
      description: document.getElementById('admin-lw-desc')?.value?.trim() || null,
      join_link: document.getElementById('admin-lw-link')?.value?.trim(),
      banner_image: document.getElementById('admin-lw-banner')?.value?.trim() || null,
      status: 'unpublished',
      created_by: auth?.id || null,
      updated_at: new Date().toISOString(),
    };
    if (!row.workshop_name || !row.speaker_name || !row.workshop_date || !row.workshop_time || !row.join_link) {
      window.showToast?.('Please fill all required workshop fields', 'red');
      return;
    }
    const editId = document.getElementById('admin-lw-id')?.value;
    if (editId) {
      delete row.status;
    }
    const request = editId ? supabase.from('live_workshops').update(row).eq('id', editId) : supabase.from('live_workshops').insert(row);
    const { error } = await request;
    if (error) {
      window.showToast?.('Workshop save failed: ' + error.message, 'red');
      return;
    }
    window.showToast?.('Workshop saved', 'green');
    await renderAdminLiveWorkshops();
  };

  window.editAdminLiveWorkshop = function editAdminLiveWorkshop(row) {
    document.getElementById('admin-lw-id').value = row.id || '';
    document.getElementById('admin-lw-name').value = row.workshop_name || '';
    document.getElementById('admin-lw-speaker').value = row.speaker_name || '';
    document.getElementById('admin-lw-date').value = row.workshop_date || '';
    document.getElementById('admin-lw-time').value = row.workshop_time || '';
    document.getElementById('admin-lw-desc').value = row.description || '';
    document.getElementById('admin-lw-link').value = row.join_link || '';
    document.getElementById('admin-lw-banner').value = row.banner_image || '';
  };

  window.toggleAdminLiveWorkshop = async function toggleAdminLiveWorkshop(id, next) {
    const published = Boolean(next);
    const { error } = await sb().from('live_workshops').update({ status: published ? 'published' : 'unpublished', updated_at: new Date().toISOString() }).eq('id', id);
    if (error) window.showToast?.('Publish update failed: ' + error.message, 'red');
    else await loadAdminLiveWorkshopList();
  };

  window.deleteAdminLiveWorkshop = async function deleteAdminLiveWorkshop(id) {
    const { error } = await sb().from('live_workshops').delete().eq('id', id);
    if (error) window.showToast?.('Delete failed: ' + error.message, 'red');
    else await loadAdminLiveWorkshopList();
  };

  const originalSwitchAdmin = window.switchAdminSection;
  window.switchAdminSection = globalThis.switchAdminSection = function switchAdminWithLiveWorkshops(section) {
    ensureLiveWorkshopSurfaces();
    if (section === 'liveworkshops') {
      document.querySelectorAll('[id^="admin-nav-"]').forEach(el => el.classList.remove('active'));
      document.getElementById('admin-nav-liveworkshops')?.classList.add('active');
      const title = document.getElementById('admin-topbar-title');
      if (title) title.textContent = 'Live Workshops';
      return renderAdminLiveWorkshops();
    }
    return originalSwitchAdmin?.apply(this, arguments);
  };

  window.addEventListener('hashchange', () => {
    if (window.location.hash.includes('live-workshops')) window.openLiveWorkshops();
  });

  setTimeout(() => {
    ensureLiveWorkshopSurfaces();
    installProfileAutosave();
    if (window.location.hash.includes('live-workshops')) window.openLiveWorkshops();
  }, 300);
})();

