// Common legacy helpers used across modules
const esc = (value) => String(value ?? '').replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
const js = (value) => String(value ?? '').replace(/\\/g, '\\\\').replace(/'/g, "\\'");
const sb = () => window.__AIMEASY_SUPABASE__;
const todayKeyDb = (date = new Date()) => date.toISOString().slice(0, 10);
const pctFromCgpa = (cgpa) => Math.max(0, Math.min(100, Number(cgpa || 0) * 9.5));

export function toggleAdminDropdown(e) {
  if (e) e.stopPropagation();
  const dd = document.getElementById('admin-dropdown');
  const isOpen = dd.classList.contains('open');
  dd.classList.toggle('open', !isOpen);
}

export function closeAdminDropdownOutside() {
  document.getElementById('admin-dropdown')?.classList.remove('open');
}

export function openAdminLogin(type) {
  console.log(type === 'admin' ? '[ROLE CLICK] Admin' : '[ROLE CLICK] Sub Admin');

  // Ensure adsense placeholders are not injected dynamically (legacy compat)
  // (Used only for legacy UI; harmless if function doesn't exist.)

  adminLoginType = type;
  document.getElementById('admin-dropdown').classList.remove('open');
  const isAdmin = type === 'admin';
  document.getElementById('admin-modal-icon').textContent = isAdmin ? '🛡️' : '👤';
  document.getElementById('admin-modal-title').textContent = isAdmin ? 'Admin Login' : 'Sub Admin Login';
  document.getElementById('admin-modal-sub').textContent = isAdmin
    ? 'Enter your admin credentials to access the full dashboard'
    : 'Enter your sub-admin credentials to manage content';
  const userIdInput = document.getElementById('admin-userid');
  const passwordInput = document.getElementById('admin-password');
  [userIdInput, passwordInput].forEach((input) => {
    if (!input) return;
    input.disabled = false;
    input.readOnly = false;
    input.style.removeProperty('pointer-events');
  });
  userIdInput.value = '';
  passwordInput.value = '';
  document.getElementById('admin-login-err').style.display = 'none';
  setModalOpenState('admin-login-modal', true);
  setTimeout(() => userIdInput?.focus(), 0);
}

export function closeAdminLogin() {
  setModalOpenState('admin-login-modal', false);
}

export async function submitAdminLogin() {
  const uid = document.getElementById('admin-userid').value.trim();
  const pwd = document.getElementById('admin-password').value.trim();
  const err = document.getElementById('admin-login-err');
  const client = window.__AIMEASY_SUPABASE__;

  if (!client) {
    err.style.display = 'block';
    err.innerHTML = '❌ Supabase client not initialized';
    return;
  }

  if (adminLoginType === 'admin') {
    const { data: admin, error } = await client
      .from('admin_accounts')
      .select('*')
      .eq('username', uid)
      .eq('password', pwd)
      .eq('status', 'active')
      .single();

    console.log('ADMIN LOGIN RESULT', admin);
    console.log('ADMIN LOGIN ERROR', error);

    if (error || !admin) {
      err.style.display = 'block';
      err.innerHTML = '❌ Invalid Admin username or password';
      return;
    }

    err.style.display = 'none';

    APP.role = 'admin';
    APP.adminType = 'admin';
    APP.user = admin;

    localStorage.setItem(
      'edusync_admin_session',
      JSON.stringify({
        type: 'admin',
        username: admin.username
      })
    );

    closeAdminLogin();

    showLoading('Logging in as Administrator...');

    setTimeout(() => {
      hideLoading();
      launchAdminDashboard();
    }, 800);
  } else {
    const { data: match, error: subAdminError } = await client
      .from('sub_admin_accounts')
      .select('*')
      .eq('username', uid)
      .eq('password', pwd)
      .eq('status', 'active')
      .single();

    if (match) {
      err.style.display = 'none';
      APP.role = 'subadmin';
      APP.adminType = 'subadmin';
      APP.subAdminData = match;
      closeAdminLogin();
      showLoading('Logging in as Sub Admin...');
      setTimeout(() => {
        hideLoading();
        launchSubAdmin();
      }, 800);
    } else {
      err.style.display = 'block';
      err.innerHTML = '❌ Invalid Sub Admin username or password';
      document.getElementById('admin-password').value = '';
    }
  }
}

export function launchAdminDashboard_LEGACY() {
  // Overridden by new launchAdminDashboard with sidebar
}

export function renderAdminDashboard(activeTab) {
  activeTab = activeTab || 'overview';
  const urlRequests = JSON.parse(localStorage.getItem('edusync_url_requests') || '[]');
  const pending = urlRequests.filter(r => r.status === 'pending').length;
  const approved = urlRequests.filter(r => r.status === 'approved').length;
  const rejected = urlRequests.filter(r => r.status === 'rejected').length;
  const customSubjects = JSON.parse(localStorage.getItem('edusync_custom_subjects') || '[]');
  const adminVideos = JSON.parse(localStorage.getItem('edusync_admin_videos') || '[]');
  const adminNotes = JSON.parse(localStorage.getItem('edusync_admin_notes') || '[]');
  const adminPYQs = JSON.parse(localStorage.getItem('edusync_admin_pyqs') || '[]');
  const adminIQs = JSON.parse(localStorage.getItem('edusync_admin_iqs') || '[]');
  const subAdmins = JSON.parse(localStorage.getItem('edusync_subadmins') || '[]');

  const tabs = [
    { id: 'overview', label: '📊 Overview' },
    { id: 'subjects', label: '📚 Subjects' },
    { id: 'videos', label: '🎬 Videos' },
    { id: 'notes', label: '📄 Notes' },
    { id: 'pyq', label: '📝 PYQs' },
    { id: 'iq', label: '⭐ Imp. Questions' },
    { id: 'skills', label: '⚡ Skills Up' },
    { id: 'urls', label: '🔗 URL Requests' },
    { id: 'subadmins', label: '👤 Sub Admins' },
  ];

  const allSubjectNames = [...new Set([...Object.values(SUBJECTS_DB).flat().map(s => s.name), ...customSubjects.map(s => s.name)])].sort();
  const subjectOptions = `<option value="">All Subjects</option>${allSubjectNames.map(n => `<option value="${n}">${n}</option>`).join('')}`;
  const unitOptions = `<option value="">All Units</option>${[1, 2, 3, 4, 5].map(u => `<option value="${u}">Unit ${u}</option>`).join('')}`;

  document.getElementById('admin-content').innerHTML = `
    <div style="margin-bottom:1.5rem;">
      <h2 style="font-size:1.6rem;font-weight:800;letter-spacing:-0.02em;margin-bottom:4px;">Admin Dashboard</h2>
      <p style="font-size:0.88rem;color:var(--text2);">Full control — manage all content, sub admins, and student submissions</p>
    </div>
    <!-- Admin Tabs -->
    <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:1.6rem;border-bottom:1px solid var(--border);padding-bottom:1rem;">
      ${tabs.map(t => `<button class="btn ${activeTab === t.id ? 'btn-lavender' : 'btn-ghost'} btn-sm" onclick="renderAdminDashboard('${t.id}')">${t.label}${t.id === 'urls' && pending ? ` <span style="background:#fff;color:var(--amber);border-radius:50%;font-size:0.65rem;width:16px;height:16px;display:inline-flex;align-items:center;justify-content:center;margin-left:4px;">${pending}</span>` : ''}${t.id === 'subadmins' ? ` <span style="background:rgba(255,255,255,0.2);border-radius:50px;font-size:0.65rem;padding:0 5px;">${subAdmins.length}</span>` : ''}</button>`).join('')}
    </div>
    <!-- TAB CONTENT -->
    ${activeTab === 'overview' ? `
    <div class="admin-grid">
      <div class="admin-stat-card"><div class="admin-stat-accent" style="background:var(--primary);"></div>
        <div style="font-size:2.2rem;font-weight:800;color:var(--primary);">1,284</div>
        <div style="font-size:0.88rem;font-weight:600;margin-top:4px;">Total Student Logins</div>
        <div style="font-size:0.75rem;color:var(--text3);margin-top:4px;">↑ 12% this week</div></div>
      <div class="admin-stat-card"><div class="admin-stat-accent" style="background:var(--teal);"></div>
        <div style="font-size:2.2rem;font-weight:800;color:var(--teal);">${customSubjects.length + Object.values(SUBJECTS_DB).flat().length}</div>
        <div style="font-size:0.88rem;font-weight:600;margin-top:4px;">Total Subjects</div>
        <div style="font-size:0.75rem;color:var(--text3);margin-top:4px;">${customSubjects.length} custom created</div></div>
      <div class="admin-stat-card"><div class="admin-stat-accent" style="background:var(--amber);"></div>
        <div style="font-size:2.2rem;font-weight:800;color:var(--amber);">${pending}</div>
        <div style="font-size:0.88rem;font-weight:600;margin-top:4px;">Pending URL Requests</div>
        <div style="font-size:0.75rem;color:var(--text3);margin-top:4px;">Needs review</div></div>
      <div class="admin-stat-card"><div class="admin-stat-accent" style="background:var(--green);"></div>
        <div style="font-size:2.2rem;font-weight:800;color:var(--green);">${adminVideos.length}</div>
        <div style="font-size:0.88rem;font-weight:600;margin-top:4px;">Videos Uploaded</div>
        <div style="font-size:0.75rem;color:var(--text3);margin-top:4px;">Across all subjects</div></div>
      <div class="admin-stat-card"><div class="admin-stat-accent" style="background:var(--lavender);"></div>
        <div style="font-size:2.2rem;font-weight:800;color:var(--lavender);">${adminNotes.length}</div>
        <div style="font-size:0.88rem;font-weight:600;margin-top:4px;">Notes Uploaded</div>
        <div style="font-size:0.75rem;color:var(--text3);margin-top:4px;">${adminPYQs.length} PYQs · ${adminIQs.length} IQs</div></div>
      <div class="admin-stat-card"><div class="admin-stat-accent" style="background:var(--red);"></div>
        <div style="font-size:2.2rem;font-weight:800;color:var(--red);">${subAdmins.length}</div>
        <div style="font-size:0.88rem;font-weight:600;margin-top:4px;">Sub Admins</div>
        <div style="font-size:0.75rem;color:var(--text3);margin-top:4px;">Active accounts</div></div>
    </div>
    <div class="admin-pending-list">
      <div class="admin-pending-header"><h4>⏳ Recent URL Requests</h4><span class="badge badge-amber">${pending} pending</span></div>
      ${urlRequests.slice(-5).reverse().map((r, i) => `
        <div class="admin-pending-item">
          <div style="flex:1;min-width:0;">
            <div style="font-size:0.85rem;font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${r.url}</div>
            <div style="font-size:0.75rem;color:var(--text3);">${r.subject} · Unit ${r.unit} · by ${r.submittedBy} · ${r.submittedAt}</div>
          </div>
          <span class="badge ${r.status === 'approved' ? 'badge-green' : r.status === 'rejected' ? 'badge-red' : 'badge-amber'}">${r.status}</span>
        </div>`).join('') || '<div style="padding:2rem;text-align:center;color:var(--text3);">No URL requests yet</div>'}
    </div>` : ''}

    ${activeTab === 'subjects' ? `
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:1.4rem;align-items:start;">
      <div class="card">
        <h3 style="margin-bottom:1rem;">➕ Add Subject</h3>
        <div class="form-row">
          <div class="input-group"><label>Branch</label>
            <select class="select" id="adm-branch"><option value="">Select Branch</option>
              ${['CSE', 'ECE', 'EEE', 'IT', 'AIML', 'AIDS', 'MECH', 'CIVIL'].map(b => `<option>${b}</option>`).join('')}
            </select></div>
          <div class="input-group"><label>Year</label>
            <select class="select" id="adm-year"><option value="">Select Year</option>
              <option value="1">1st</option><option value="2">2nd</option><option value="3">3rd</option><option value="4">4th</option>
            </select></div>
        </div>
        <div class="form-row">
          <div class="input-group"><label>Semester</label>
            <select class="select" id="adm-sem"><option value="">Select Sem</option>
              ${['1-1', '1-2', '2-1', '2-2', '3-1', '3-2', '4-1', '4-2'].map(s => `<option>${s}</option>`).join('')}
            </select></div>
          <div class="input-group"><label>Regulation</label>
            <select class="select" id="adm-reg"><option value="">Regulation</option><option>R23</option><option>R20</option><option>R16</option></select></div>
        </div>
        <div class="input-group"><label>University</label>
          <select class="select" id="adm-uni"><option value="">Select University</option><option>JNTUK</option><option>JNTUH</option><option>Andhra University</option></select></div>
        <div class="input-group"><label>Subject Name</label>
          <input class="input" id="adm-subname" placeholder="e.g. Data Structures"></div>
        <div class="form-row">
          <div class="input-group"><label>Code</label><input class="input" id="adm-subcode" placeholder="CS301"></div>
          <div class="input-group"><label>Credits</label><input class="input" id="adm-credits" type="number" min="1" max="6" value="3"></div>
        </div>
        <button class="btn btn-primary" onclick="adminCreateSubject()" style="width:100%;">+ Create Subject</button>
      </div>
      <div>
        <div class="card" style="margin-bottom:1.2rem;border:2px solid var(--teal-mid);">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:0.8rem;">
            <h3 style="color:var(--teal);">👤 Sub Admin Created Subjects (${customSubjects.length})</h3>
            <span class="badge badge-teal">${customSubjects.length} subjects</span>
          </div>
          <p style="font-size:0.8rem;color:var(--text2);margin-bottom:1rem;">These subjects were created by sub admins. You can delete them below.</p>
          <div id="adm-subjects-list" style="max-height:400px;overflow-y:auto;">
            ${customSubjects.length ? customSubjects.map(s => `
              <div style="display:flex;align-items:center;gap:8px;padding:10px 12px;border:1px solid var(--border);border-radius:var(--radius-sm);margin-bottom:6px;font-size:0.82rem;background:var(--teal-light);">
                <div style="flex:1;">
                  <div style="font-weight:600;">${s.name} <span class="badge badge-primary">${s.code}</span></div>
                  <div style="font-size:0.72rem;color:var(--text3);margin-top:2px;">${s.branch} · ${s.sem} · ${s.reg} · ${s.uni}</div>
                </div>
                <span class="badge badge-teal">${s.branch}</span>
                <button class="btn btn-danger btn-sm" onclick="adminDeleteSubject(${s.id});renderAdminDashboard('subjects')">🗑 Delete</button>
              </div>`).join('') : '<div style="color:var(--text3);text-align:center;padding:1.5rem;">No sub admin subjects yet</div>'}
          </div>
        </div>
      </div>
    </div>` : ''}

    ${activeTab === 'videos' ? `
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:1.4rem;align-items:start;">
      <div class="card">
        <h3 style="margin-bottom:1rem;">🎬 Add/Edit Video</h3>
        <div class="input-group"><label>Title</label><input class="input" id="adm-vtitle" placeholder="e.g. Unit 1 Introduction Video"></div>
        <div class="input-group"><label>YouTube / Video URL</label><input class="input" id="adm-vurl" placeholder="https://youtube.com/watch?v=..."></div>
        <div class="form-row">
          <div class="input-group"><label>Subject</label><select class="select" id="adm-vsubject">${subjectOptions}</select></div>
          <div class="input-group"><label>Unit</label><select class="select" id="adm-vunit">${unitOptions}</select></div>
        </div>
        <button class="btn btn-primary" onclick="adminUploadVideo()" style="width:100%;">📤 Upload Video</button>
      </div>
      <div class="card">
        <h3 style="margin-bottom:1rem;">All Videos (${adminVideos.length})</h3>
        <div style="max-height:500px;overflow-y:auto;">
          ${adminVideos.length ? adminVideos.map(v => `
            <div style="display:flex;align-items:center;gap:8px;padding:8px 12px;border:1px solid var(--border);border-radius:var(--radius-sm);margin-bottom:6px;font-size:0.82rem;">
              <div style="flex:1;">
                <div style="font-weight:600;">🎬 ${v.title}</div>
                <div style="font-size:0.72rem;color:var(--text3);">${v.subject || 'All'} · Unit ${v.unit || 'All'}</div>
                <div style="font-size:0.68rem;color:var(--primary);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${v.url}</div>
              </div>
              <span class="badge badge-green">Live</span>
              <button class="btn btn-danger btn-sm" onclick="adminDeleteVideo(${v.id});renderAdminDashboard('videos')">✕</button>
            </div>`).join('') : '<div style="color:var(--text3);text-align:center;padding:1.5rem;">No videos yet</div>'}
        </div>
      </div>
    </div>` : ''}

    ${activeTab === 'notes' ? `
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:1.4rem;align-items:start;">
      <div class="card">
        <h3 style="margin-bottom:1rem;">📄 Add/Edit Notes</h3>
        <div class="input-group"><label>Notes Title</label><input class="input" id="adm-ntitle" placeholder="e.g. Unit 1 Handwritten Notes"></div>
        <div class="form-row">
          <div class="input-group"><label>Type</label>
            <select class="select" id="adm-ntype"><option value="pdf">📄 PDF</option><option value="doc">📝 DOC</option><option value="link">🔗 Link</option></select></div>
          <div class="input-group"><label>Unit</label><select class="select" id="adm-nunit">${unitOptions}</select></div>
        </div>
        <div class="input-group"><label>Subject</label><select class="select" id="adm-nsubject">${subjectOptions}</select></div>
        <div class="input-group"><label>Link / URL (Google Drive, PDF link)</label>
          <input class="input" id="adm-nlink" placeholder="https://..."></div>
        <button class="btn btn-primary" onclick="adminUploadNotes()" style="width:100%;">📤 Upload Notes</button>
      </div>
      <div class="card">
        <h3 style="margin-bottom:1rem;">All Notes (${adminNotes.length})</h3>
        <div style="max-height:500px;overflow-y:auto;">
          ${adminNotes.length ? adminNotes.map(n => `
            <div style="display:flex;align-items:center;gap:8px;padding:8px 12px;border:1px solid var(--border);border-radius:var(--radius-sm);margin-bottom:6px;font-size:0.82rem;">
              <div style="flex:1;">
                <div style="font-weight:600;">${n.type === 'pdf' ? '📄' : n.type === 'doc' ? '📝' : '🔗'} ${n.title}</div>
                <div style="font-size:0.72rem;color:var(--text3);">${n.subject || 'All'} · Unit ${n.unit || 'All'} · ${n.type?.toUpperCase()}</div>
              </div>
              <span class="badge badge-green">Live</span>
              <button class="btn btn-danger btn-sm" onclick="adminDeleteNote(${n.id});renderAdminDashboard('notes')">✕</button>
            </div>`).join('') : '<div style="color:var(--text3);text-align:center;padding:1.5rem;">No notes yet</div>'}
        </div>
      </div>
    </div>` : ''}

    ${activeTab === 'pyq' ? `
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:1.4rem;align-items:start;">
      <div class="card">
        <h3 style="margin-bottom:1rem;">📝 Add/Edit PYQ</h3>
        <div class="form-row">
          <div class="input-group"><label>Exam Year</label><input class="input" id="adm-pyqyear" placeholder="2023" type="number"></div>
          <div class="input-group"><label>Repeated Count</label><input class="input" id="adm-pyqcount" placeholder="e.g. 3" type="number" value="1"></div>
        </div>
        <div class="input-group"><label>Question</label>
          <textarea class="input" id="adm-pyqtext" rows="3" placeholder="Type the question..." style="resize:vertical;"></textarea></div>
        <div class="input-group"><label>Answer (optional)</label>
          <textarea class="input" id="adm-pyqans" rows="2" placeholder="Type the answer..." style="resize:vertical;"></textarea></div>
        <div class="form-row">
          <div class="input-group"><label>Subject</label><select class="select" id="adm-pyqsubject">${subjectOptions}</select></div>
          <div class="input-group"><label>Unit</label><select class="select" id="adm-pyqunit">${unitOptions}</select></div>
        </div>
        <button class="btn btn-primary" onclick="adminUploadPYQ()" style="width:100%;">📤 Upload PYQ</button>
      </div>
      <div class="card">
        <h3 style="margin-bottom:1rem;">All PYQs (${adminPYQs.length})</h3>
        <div style="max-height:500px;overflow-y:auto;">
          ${adminPYQs.length ? adminPYQs.map(p => `
            <div style="display:flex;align-items:flex-start;gap:8px;padding:8px 12px;border:1px solid var(--border);border-radius:var(--radius-sm);margin-bottom:6px;font-size:0.82rem;">
              <div style="flex:1;">
                <div style="font-weight:600;line-height:1.4;">${p.question.substring(0, 80)}${p.question.length > 80 ? '...' : ''}</div>
                <div style="font-size:0.72rem;color:var(--text3);">${p.subject || 'All'} · Unit ${p.unit || 'All'} · ${p.year} · ×${p.count}</div>
              </div>
              <span class="badge badge-green">Live</span>
              <button class="btn btn-danger btn-sm" onclick="adminDeletePYQ(${p.id});renderAdminDashboard('pyq')">✕</button>
            </div>`).join('') : '<div style="color:var(--text3);text-align:center;padding:1.5rem;">No PYQs yet</div>'}
        </div>
      </div>
    </div>` : ''}

    ${activeTab === 'iq' ? `
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:1.4rem;align-items:start;">
      <div class="card">
        <h3 style="margin-bottom:1rem;">⭐ Add/Edit Important Question</h3>
        <div class="input-group"><label>Question</label>
          <textarea class="input" id="adm-iqtext" rows="3" placeholder="Type the important question..." style="resize:vertical;"></textarea></div>
        <div class="form-row">
          <div class="input-group"><label>Priority</label>
            <select class="select" id="adm-iqpriority">
              <option value="high">🔴 High Priority</option>
              <option value="med">🟡 Medium Priority</option>
              <option value="low">🟢 Low Priority</option>
            </select></div>
          <div class="input-group"><label>Tags (comma separated)</label>
            <input class="input" id="adm-iqtags" placeholder="Unit 1, Memory"></div>
        </div>
        <div class="form-row">
          <div class="input-group"><label>Subject</label><select class="select" id="adm-iqsubject">${subjectOptions}</select></div>
          <div class="input-group"><label>Unit</label><select class="select" id="adm-iqunit">${unitOptions}</select></div>
        </div>
        <button class="btn btn-primary" onclick="adminUploadIQ()" style="width:100%;">+ Add Question</button>
      </div>
      <div class="card">
        <h3 style="margin-bottom:1rem;">All Imp. Questions (${adminIQs.length})</h3>
        <div style="max-height:500px;overflow-y:auto;">
          ${adminIQs.length ? adminIQs.map(q => `
            <div style="display:flex;align-items:flex-start;gap:8px;padding:8px 12px;border:1px solid var(--border);border-radius:var(--radius-sm);margin-bottom:6px;font-size:0.82rem;">
              <div style="flex:1;">
                <div style="font-weight:600;line-height:1.4;">${q.question.substring(0, 80)}${q.question.length > 80 ? '...' : ''}</div>
                <div style="display:flex;gap:4px;margin-top:4px;flex-wrap:wrap;">
                  <span class="badge ${q.priority === 'high' ? 'badge-red' : q.priority === 'med' ? 'badge-amber' : 'badge-green'}">${q.priority}</span>
                  <span class="badge badge-teal">${q.subject || 'All'}</span>
                </div>
              </div>
              <button class="btn btn-danger btn-sm" onclick="adminDeleteIQ(${q.id});renderAdminDashboard('iq')">✕</button>
            </div>`).join('') : '<div style="color:var(--text3);text-align:center;padding:1.5rem;">No important questions yet</div>'}
        </div>
      </div>
    </div>` : ''}

    ${activeTab === 'skills' ? `
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:1.4rem;align-items:start;">
      <div class="card">
        <h3 style="margin-bottom:1rem;">⚡ Add Skill Course</h3>
        <div class="input-group"><label>Skill Name</label><input class="input" id="adm-skillname" placeholder="e.g. Python Programming"></div>
        <div class="input-group"><label>Description</label><textarea class="input" id="adm-skilldesc" rows="2" placeholder="Brief description of this skill..." style="resize:vertical;"></textarea></div>
        <div class="form-row">
          <div class="input-group"><label>Category</label>
            <select class="select" id="adm-skillcat">
              <option value="coding">💻 Coding</option>
              <option value="aptitude">🧠 Aptitude</option>
              <option value="communication">🗣️ Communication</option>
              <option value="ai">🤖 AI & ML</option>
              <option value="certification">🏆 Certification</option>
              <option value="other">⭐ Other</option>
            </select></div>
          <div class="input-group"><label>Level</label>
            <select class="select" id="adm-skilllevel">
              <option value="Beginner">🟢 Beginner</option>
              <option value="Intermediate">🟡 Intermediate</option>
              <option value="Advanced">🔴 Advanced</option>
            </select></div>
        </div>
        <div class="form-row">
          <div class="input-group"><label>Icon (emoji)</label><input class="input" id="adm-skillicon" placeholder="e.g. 💻" maxlength="4"></div>
          <div class="input-group"><label>Duration</label><input class="input" id="adm-skillduration" placeholder="e.g. 8 hours"></div>
        </div>
        <button class="btn btn-primary" onclick="adminCreateSkill()" style="width:100%;margin-bottom:1rem;">⚡ Create Skill Course</button>
        
        <hr style="border-color:var(--border);margin:1rem 0;">
        <h4 style="margin-bottom:0.8rem;">🎬 Add Video to Skill</h4>
        <div class="input-group"><label>Skill</label>
          <select class="select" id="adm-skillvid-skill">${(() => { const sk = JSON.parse(localStorage.getItem('edusync_skills') || '[]'); return sk.length ? sk.map(s => `<option value="${s.id}">${s.name}</option>`).join('') : '<option value="">No skills yet</option>'; })()}</select></div>
        <div class="input-group"><label>Video Title</label><input class="input" id="adm-skillvid-title" placeholder="e.g. Intro to Python"></div>
        <div class="input-group"><label>YouTube URL</label><input class="input" id="adm-skillvid-url" placeholder="https://youtube.com/watch?v=..." type="url"></div>
        <div class="input-group"><label>Topic/Subtopic Name</label><input class="input" id="adm-skillvid-topic" placeholder="e.g. Variables and Data Types"></div>
        <button class="btn btn-teal" onclick="adminAddSkillVideo()" style="width:100%;">📤 Add Video</button>

        <hr style="border-color:var(--border);margin:1rem 0;">
        <h4 style="margin-bottom:0.8rem;">📄 Add Notes to Skill</h4>
        <div class="input-group"><label>Skill</label>
          <select class="select" id="adm-skillnote-skill">${(() => { const sk = JSON.parse(localStorage.getItem('edusync_skills') || '[]'); return sk.length ? sk.map(s => `<option value="${s.id}">${s.name}</option>`).join('') : '<option value="">No skills yet</option>'; })()}</select></div>
        <div class="input-group"><label>Notes Title</label><input class="input" id="adm-skillnote-title" placeholder="e.g. Python Cheatsheet"></div>
        <div class="input-group"><label>Link (PDF/Google Drive)</label><input class="input" id="adm-skillnote-url" placeholder="https://..." type="url"></div>
        <button class="btn btn-lavender" onclick="adminAddSkillNote()" style="width:100%;">📤 Add Notes</button>
      </div>
      <div class="card">
        <h3 style="margin-bottom:1rem;">⚡ All Skill Courses (${JSON.parse(localStorage.getItem('edusync_skills') || '[]').length})</h3>
        <div style="max-height:600px;overflow-y:auto;">
          ${(() => {
        const skills = JSON.parse(localStorage.getItem('edusync_skills') || '[]');
        const skillVideos = JSON.parse(localStorage.getItem('edusync_skill_videos') || '[]');
        const skillNotes = JSON.parse(localStorage.getItem('edusync_skill_notes') || '[]');
        if (!skills.length) return '<div style="color:var(--text3);text-align:center;padding:1.5rem;">No skill courses yet</div>';
        return skills.map(s => {
          const vids = skillVideos.filter(v => v.skillId == s.id);
          const notes = skillNotes.filter(n => n.skillId == s.id);
          return `
              <div style="border:1px solid var(--border);border-radius:var(--radius-md);margin-bottom:10px;overflow:hidden;">
                <div style="display:flex;align-items:center;gap:8px;padding:10px 12px;background:var(--lavender-light);">
                  <span style="font-size:1.4rem;">${s.icon || '⚡'}</span>
                  <div style="flex:1;">
                    <div style="font-weight:700;font-size:0.9rem;">${s.name}</div>
                    <div style="font-size:0.72rem;color:var(--text3);">${s.category} · ${s.level} · ${vids.length} videos · ${notes.length} notes</div>
                  </div>
                  <button class="btn btn-danger btn-sm" onclick="adminDeleteSkill(${s.id});renderAdminDashboard('skills')">🗑 Delete</button>
                </div>
                ${vids.length ? '<div style="padding:6px 12px;background:var(--surface2);font-size:0.78rem;">' + vids.map(v => `<div style="display:flex;align-items:center;gap:6px;padding:4px 0;border-bottom:1px solid var(--border);">🎬 <span style="flex:1;">${v.title}</span><button class="btn btn-danger btn-sm" style="padding:2px 8px;font-size:0.7rem;" onclick="adminDeleteSkillVideo(${v.id});renderAdminDashboard('skills')">✕</button></div>`).join('') + '</div>' : ''}
                ${notes.length ? '<div style="padding:6px 12px;background:var(--surface2);font-size:0.78rem;">' + notes.map(n => `<div style="display:flex;align-items:center;gap:6px;padding:4px 0;border-bottom:1px solid var(--border);">📄 <span style="flex:1;">${n.title}</span><button class="btn btn-danger btn-sm" style="padding:2px 8px;font-size:0.7rem;" onclick="adminDeleteSkillNote(${n.id});renderAdminDashboard('skills')">✕</button></div>`).join('') + '</div>' : ''}
              </div>`;
        }).join('');
      })()}
        </div>
      </div>
    </div>` : ''}

    ${activeTab === 'urls' ? `
    <div class="card">
      <h3 style="margin-bottom:1rem;">🔗 Student URL Requests — Approve or Reject</h3>
      <div id="adm-url-list">
        ${urlRequests.length ? urlRequests.map((r, i) => `
          <div style="display:flex;align-items:flex-start;gap:10px;padding:12px;border:1px solid var(--border);border-radius:var(--radius-md);margin-bottom:8px;">
            <div style="flex:1;min-width:0;">
              <div style="font-size:0.88rem;font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${r.url}</div>
              <div style="font-size:0.75rem;color:var(--text3);margin-top:2px;">${r.subject} · Unit ${r.unit} · by ${r.submittedBy} · ${r.submittedAt}</div>
            </div>
            <span class="badge ${r.status === 'approved' ? 'badge-green' : r.status === 'rejected' ? 'badge-red' : 'badge-amber'}">${r.status}</span>
            ${r.status === 'pending' ? `
              <button class="btn btn-teal btn-sm" onclick="adminApproveUrl(${i})">✅ Approve</button>
              <button class="btn btn-danger btn-sm" onclick="adminRejectUrl(${i})">❌ Reject</button>
            `: ''}
          </div>`).join('') : '<div style="padding:2rem;text-align:center;color:var(--text3);">No URL requests yet</div>'}
      </div>
    </div>` : ''}

    ${activeTab === 'subadmins' ? `
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:1.4rem;align-items:start;">
      <div class="card">
        <h3 style="margin-bottom:1rem;">➕ Create Sub Admin</h3>
        <div class="form-row">
          <div class="input-group"><label>User ID / Email</label><input class="input" id="adm-sa-user" placeholder="e.g. ravi_cse or ravi@college.edu"></div>
          <div class="input-group"><label>Password</label><input class="input" id="adm-sa-pass" type="password" placeholder="Set password"></div>
        </div>
        <div class="input-group"><label>Branch</label>
          <select class="select" id="adm-sa-branch"><option value="">Select Branch</option>
            ${['CSE', 'ECE', 'EEE', 'IT', 'AIML', 'AIDS', 'MECH', 'CIVIL'].map(b => `<option>${b}</option>`).join('')}
          </select></div>
        <div id="adm-sa-err" style="display:none;font-size:0.82rem;color:var(--red);margin-bottom:10px;padding:8px 12px;background:var(--red-light);border-radius:var(--radius-sm);"></div>
        <div id="adm-sa-ok" style="display:none;font-size:0.82rem;color:var(--green);margin-bottom:10px;padding:8px 12px;background:var(--green-light);border-radius:var(--radius-sm);"></div>
        <button class="btn btn-primary" onclick="adminCreateSubAdmin()" style="width:100%;">Create Sub Admin</button>
      </div>
      <div class="card">
        <h3 style="margin-bottom:1rem;">All Sub Admins (${subAdmins.length})</h3>
        <div style="max-height:500px;overflow-y:auto;">
          ${subAdmins.length ? subAdmins.map((sa, i) => `
            <div style="display:flex;align-items:center;gap:8px;padding:10px 12px;border:1px solid var(--border);border-radius:var(--radius-sm);margin-bottom:6px;font-size:0.82rem;">
              <div style="flex:1;">
                <div style="font-weight:600;">${sa.username}</div>
                <div style="font-size:0.72rem;color:var(--text3);">${sa.branch} · Created: ${sa.createdAt}</div>
              </div>
              <span class="badge badge-green">Active</span>
              <button class="btn btn-danger btn-sm" onclick="adminDeleteSubAdmin(${i});renderAdminDashboard('subadmins')">✕</button>
            </div>`).join('') : '<div style="color:var(--text3);text-align:center;padding:1.5rem;">No sub admins created yet</div>'}
        </div>
      </div>
    </div>` : ''}
  `;
}

export function adminCreateSubject() {
  const branch = document.getElementById('adm-branch')?.value;
  const year = document.getElementById('adm-year')?.value;
  const sem = document.getElementById('adm-sem')?.value;
  const reg = document.getElementById('adm-reg')?.value;
  const uni = document.getElementById('adm-uni')?.value;
  const name = document.getElementById('adm-subname')?.value.trim();
  const code = document.getElementById('adm-subcode')?.value.trim();
  const credits = document.getElementById('adm-credits')?.value;
  if (!branch || !year || !sem || !reg || !uni || !name || !code) { showToast('Fill all fields', 'red'); return; }
  const subjects = JSON.parse(localStorage.getItem('edusync_custom_subjects') || '[]');
  subjects.push({ branch, year, sem, reg, uni, name, code, credits, id: Date.now() });
  localStorage.setItem('edusync_custom_subjects', JSON.stringify(subjects));
  showToast('✅ Subject created and live!', 'green');
  renderAdminDashboard('subjects');
}

export function adminDeleteSubject(id) {
  const subjects = JSON.parse(localStorage.getItem('edusync_custom_subjects') || '[]');
  localStorage.setItem('edusync_custom_subjects', JSON.stringify(subjects.filter(s => s.id !== id)));
  showToast('Subject deleted', 'red');
}

export function adminUploadVideo() {
  const title = document.getElementById('adm-vtitle')?.value.trim();
  const url = document.getElementById('adm-vurl')?.value.trim();
  const subject = document.getElementById('adm-vsubject')?.value;
  const unit = document.getElementById('adm-vunit')?.value;
  if (!title || !url) { showToast('Fill title and URL', 'red'); return; }
  const videos = JSON.parse(localStorage.getItem('edusync_admin_videos') || '[]');
  videos.push({ id: Date.now(), title, url, subject, unit: unit ? parseInt(unit) : null, uploadedAt: new Date().toLocaleString() });
  localStorage.setItem('edusync_admin_videos', JSON.stringify(videos));
  showToast('✅ Video uploaded and live!', 'green');
  renderAdminDashboard('videos');
}

export function adminDeleteVideo(id) {
  const v = JSON.parse(localStorage.getItem('edusync_admin_videos') || '[]');
  localStorage.setItem('edusync_admin_videos', JSON.stringify(v.filter(x => x.id !== id)));
  showToast('Video deleted', 'red');
}

export function adminUploadNotes() {
  const title = document.getElementById('adm-ntitle')?.value.trim();
  const type = document.getElementById('adm-ntype')?.value;
  const unit = document.getElementById('adm-nunit')?.value;
  const subject = document.getElementById('adm-nsubject')?.value;
  const link = document.getElementById('adm-nlink')?.value.trim();
  if (!title) { showToast('Fill title', 'red'); return; }
  const notes = JSON.parse(localStorage.getItem('edusync_admin_notes') || '[]');
  notes.push({ id: Date.now(), title, type, subject, unit: unit ? parseInt(unit) : null, link, uploadedAt: new Date().toLocaleString() });
  localStorage.setItem('edusync_admin_notes', JSON.stringify(notes));
  showToast('✅ Notes uploaded and live!', 'green');
  renderAdminDashboard('notes');
}

export function adminDeleteNote(id) {
  const n = JSON.parse(localStorage.getItem('edusync_admin_notes') || '[]');
  localStorage.setItem('edusync_admin_notes', JSON.stringify(n.filter(x => x.id !== id)));
  showToast('Note deleted', 'red');
}

export function adminUploadPYQ() {
  const year = document.getElementById('adm-pyqyear')?.value;
  const count = document.getElementById('adm-pyqcount')?.value;
  const question = document.getElementById('adm-pyqtext')?.value.trim();
  const answer = document.getElementById('adm-pyqans')?.value.trim();
  const subject = document.getElementById('adm-pyqsubject')?.value;
  const unit = document.getElementById('adm-pyqunit')?.value;
  if (!question || !year) { showToast('Fill question and year', 'red'); return; }
  const pyqs = JSON.parse(localStorage.getItem('edusync_admin_pyqs') || '[]');
  pyqs.push({ id: Date.now(), question, answer, year, count: parseInt(count) || 1, subject, unit: unit ? parseInt(unit) : null });
  localStorage.setItem('edusync_admin_pyqs', JSON.stringify(pyqs));
  showToast('✅ PYQ added and live!', 'green');
  renderAdminDashboard('pyq');
}

export function adminDeletePYQ(id) {
  const p = JSON.parse(localStorage.getItem('edusync_admin_pyqs') || '[]');
  localStorage.setItem('edusync_admin_pyqs', JSON.stringify(p.filter(x => x.id !== id)));
  showToast('PYQ deleted', 'red');
}

export function adminUploadIQ() {
  const question = document.getElementById('adm-iqtext')?.value.trim();
  const priority = document.getElementById('adm-iqpriority')?.value;
  const tags = document.getElementById('adm-iqtags')?.value;
  const subject = document.getElementById('adm-iqsubject')?.value;
  const unit = document.getElementById('adm-iqunit')?.value;
  if (!question) { showToast('Fill question', 'red'); return; }
  const iqs = JSON.parse(localStorage.getItem('edusync_admin_iqs') || '[]');
  iqs.push({ id: Date.now(), question, priority, tags, subject, unit: unit ? parseInt(unit) : null });
  localStorage.setItem('edusync_admin_iqs', JSON.stringify(iqs));
  showToast('✅ Important question added!', 'green');
  renderAdminDashboard('iq');
}

export function adminDeleteIQ(id) {
  const q = JSON.parse(localStorage.getItem('edusync_admin_iqs') || '[]');
  localStorage.setItem('edusync_admin_iqs', JSON.stringify(q.filter(x => x.id !== id)));
  showToast('Question deleted', 'red');
}

export function adminCreateSkill() {
  const name = document.getElementById('adm-skillname')?.value.trim();
  const desc = document.getElementById('adm-skilldesc')?.value.trim();
  const category = document.getElementById('adm-skillcat')?.value;
  const level = document.getElementById('adm-skilllevel')?.value;
  const icon = document.getElementById('adm-skillicon')?.value.trim() || '⚡';
  const duration = document.getElementById('adm-skillduration')?.value.trim() || 'Self-paced';
  if (!name) { showToast('Enter skill name', 'red'); return; }
  const skills = JSON.parse(localStorage.getItem('edusync_skills') || '[]');
  skills.push({ id: Date.now(), name, description: desc, category, level, icon, duration, topics: 5 });
  localStorage.setItem('edusync_skills', JSON.stringify(skills));
  showToast('✅ Skill course created!', 'green');
  renderAdminDashboard('skills');
}

export function adminDeleteSkill(id) {
  const skills = JSON.parse(localStorage.getItem('edusync_skills') || '[]');
  localStorage.setItem('edusync_skills', JSON.stringify(skills.filter(s => s.id !== id)));
  // Also delete associated videos and notes
  const vids = JSON.parse(localStorage.getItem('edusync_skill_videos') || '[]');
  localStorage.setItem('edusync_skill_videos', JSON.stringify(vids.filter(v => v.skillId !== id)));
  const notes = JSON.parse(localStorage.getItem('edusync_skill_notes') || '[]');
  localStorage.setItem('edusync_skill_notes', JSON.stringify(notes.filter(n => n.skillId !== id)));
  showToast('Skill course deleted', 'red');
}

export function adminAddSkillVideo() {
  const skillId = document.getElementById('adm-skillvid-skill')?.value;
  const title = document.getElementById('adm-skillvid-title')?.value.trim();
  const url = document.getElementById('adm-skillvid-url')?.value.trim();
  const topic = document.getElementById('adm-skillvid-topic')?.value.trim();
  if (!skillId || !title || !url) { showToast('Fill all fields', 'red'); return; }
  const vids = JSON.parse(localStorage.getItem('edusync_skill_videos') || '[]');
  vids.push({ id: Date.now(), skillId: parseInt(skillId), title, url, topic, addedAt: new Date().toLocaleString() });
  localStorage.setItem('edusync_skill_videos', JSON.stringify(vids));
  showToast('✅ Video added to skill!', 'green');
  renderAdminDashboard('skills');
}

export function adminDeleteSkillVideo(id) {
  const vids = JSON.parse(localStorage.getItem('edusync_skill_videos') || '[]');
  localStorage.setItem('edusync_skill_videos', JSON.stringify(vids.filter(v => v.id !== id)));
  showToast('Video removed', 'red');
}

export function adminAddSkillNote() {
  const skillId = document.getElementById('adm-skillnote-skill')?.value;
  const title = document.getElementById('adm-skillnote-title')?.value.trim();
  const url = document.getElementById('adm-skillnote-url')?.value.trim();
  if (!skillId || !title) { showToast('Fill all fields', 'red'); return; }
  const notes = JSON.parse(localStorage.getItem('edusync_skill_notes') || '[]');
  notes.push({ id: Date.now(), skillId: parseInt(skillId), title, url, addedAt: new Date().toLocaleString() });
  localStorage.setItem('edusync_skill_notes', JSON.stringify(notes));
  showToast('✅ Notes added to skill!', 'green');
  renderAdminDashboard('skills');
}

export function adminDeleteSkillNote(id) {
  const notes = JSON.parse(localStorage.getItem('edusync_skill_notes') || '[]');
  localStorage.setItem('edusync_skill_notes', JSON.stringify(notes.filter(n => n.id !== id)));
  showToast('Notes removed', 'red');
}

export function adminApproveUrl(index) {
  const requests = JSON.parse(localStorage.getItem('edusync_url_requests') || '[]');
  if (requests[index]) { requests[index].status = 'approved'; }
  localStorage.setItem('edusync_url_requests', JSON.stringify(requests));
  renderAdminDashboard('urls');
  renderSAUrlRequests();
  showToast('✅ URL approved!', 'green');
}

export function adminRejectUrl(index) {
  const requests = JSON.parse(localStorage.getItem('edusync_url_requests') || '[]');
  if (requests[index]) { requests[index].status = 'rejected'; }
  localStorage.setItem('edusync_url_requests', JSON.stringify(requests));
  renderAdminDashboard('urls');
  renderSAUrlRequests();
  showToast('❌ URL request rejected.', 'red');
}

export function adminLogout() {
  APP.adminType = null;
  showScreen('screen-landing');
  showToast('Logged out of admin', 'blue');
}

export function deleteAdminNote(id) {
  const notes = JSON.parse(localStorage.getItem('edusync_admin_notes') || '[]');
  localStorage.setItem('edusync_admin_notes', JSON.stringify(notes.filter(n => n.id !== id)));
  renderUploadedNotesList();
  showToast('Note removed', 'red');
}

export function deleteAdminPYQ(id) {
  const pyqs = JSON.parse(localStorage.getItem('edusync_admin_pyqs') || '[]');
  localStorage.setItem('edusync_admin_pyqs', JSON.stringify(pyqs.filter(p => p.id !== id)));
  renderUploadedPYQList();
  showToast('PYQ removed', 'red');
}

export function deleteAdminIQ(id) {
  const iqs = JSON.parse(localStorage.getItem('edusync_admin_iqs') || '[]');
  localStorage.setItem('edusync_admin_iqs', JSON.stringify(iqs.filter(q => q.id !== id)));
  renderUploadedIQList();
  showToast('Question removed', 'red');
}

export function deleteAdminVideo(id) {
  const videos = JSON.parse(localStorage.getItem('edusync_admin_videos') || '[]');
  const filtered = videos.filter(v => v.id !== id);
  localStorage.setItem('edusync_admin_videos', JSON.stringify(filtered));
  renderUploadedVideosList();
  showToast('Video removed', 'red');
}

export function toggleAdminSidebar() {
  document.getElementById('admin-sidebar').classList.toggle('open');
  document.getElementById('admin-sidebar-backdrop').classList.toggle('open');
}

export function closeAdminSidebar() {
  document.getElementById('admin-sidebar').classList.remove('open');
  document.getElementById('admin-sidebar-backdrop').classList.remove('open');
}

export function switchAdminSection(section) {
  closeAdminSidebar();
  document.querySelectorAll('[id^="admin-nav-"]').forEach(el => el.classList.remove('active'));
  const navEl = document.getElementById('admin-nav-' + section);
  if (navEl) navEl.classList.add('active');
  const titles = { dashboard: 'Admin Dashboard', create: 'Create & Manage', subjects: 'All Subjects', approvals: 'URL Approvals' };
  const titleEl = document.getElementById('admin-topbar-title');
  if (titleEl) titleEl.textContent = titles[section] || 'Admin';
  renderAdminSection(section);
}

export function renderAdminSection(section) {
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

  if (section === 'dashboard') {
    const totalBuiltinSubjects = Object.values(SUBJECTS_DB).flat().length;
    content.innerHTML = `
    <div style="padding:2rem;max-width:1200px;margin:0 auto;width:100%;">
      <div style="margin-bottom:1.6rem;">
        <h2 style="font-size:1.5rem;font-weight:800;letter-spacing:-0.02em;margin-bottom:4px;">📊 Admin Dashboard</h2>
        <p style="font-size:0.85rem;color:var(--text3);">Platform overview and analytics</p>
      </div>
      <div class="admin-grid" style="margin-bottom:2rem;">
        <div class="admin-stat-card">
          <div class="admin-stat-accent" style="background:var(--primary);"></div>
          <div style="font-size:2.4rem;font-weight:800;color:var(--primary);">1,284</div>
          <div style="font-size:0.88rem;font-weight:600;margin-top:4px;">Total Students</div>
          <div style="font-size:0.75rem;color:var(--text3);margin-top:4px;">↑ 12% this week</div>
        </div>
        <div class="admin-stat-card">
          <div class="admin-stat-accent" style="background:var(--teal);"></div>
          <div style="font-size:2.4rem;font-weight:800;color:var(--teal);">48</div>
          <div style="font-size:0.88rem;font-weight:600;margin-top:4px;">Total Teachers</div>
          <div style="font-size:0.75rem;color:var(--text3);margin-top:4px;">${subAdmins.length} sub admins</div>
        </div>
        <div class="admin-stat-card">
          <div class="admin-stat-accent" style="background:var(--lavender);"></div>
          <div style="font-size:2.4rem;font-weight:800;color:var(--lavender);">${totalBuiltinSubjects + customSubjects.length}</div>
          <div style="font-size:0.88rem;font-weight:600;margin-top:4px;">Total Subjects</div>
          <div style="font-size:0.75rem;color:var(--text3);margin-top:4px;">${customSubjects.length} custom added</div>
        </div>
        <div class="admin-stat-card">
          <div class="admin-stat-accent" style="background:var(--amber);"></div>
          <div style="font-size:2.4rem;font-weight:800;color:var(--amber);">${pending.length}</div>
          <div style="font-size:0.88rem;font-weight:600;margin-top:4px;">Pending Approvals</div>
          <div style="font-size:0.75rem;color:var(--text3);margin-top:4px;">URL requests</div>
        </div>
        <div class="admin-stat-card">
          <div class="admin-stat-accent" style="background:var(--green);"></div>
          <div style="font-size:2.4rem;font-weight:800;color:var(--green);">${adminVideos.length + adminNotes.length}</div>
          <div style="font-size:0.88rem;font-weight:600;margin-top:4px;">Content Uploaded</div>
          <div style="font-size:0.75rem;color:var(--text3);margin-top:4px;">${adminVideos.length} videos · ${adminNotes.length} notes</div>
        </div>
        <div class="admin-stat-card">
          <div class="admin-stat-accent" style="background:var(--red);"></div>
          <div style="font-size:2.4rem;font-weight:800;color:var(--red);">2.4 GB</div>
          <div style="font-size:0.88rem;font-weight:600;margin-top:4px;">Storage Used</div>
          <div style="font-size:0.75rem;color:var(--text3);margin-top:4px;">of 10 GB limit</div>
        </div>
      </div>
      <!-- Activity overview -->
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:1.4rem;margin-bottom:1.4rem;">
        <div class="card">
          <div class="section-heading" style="margin-bottom:1rem;">📈 Average Platform Usage</div>
          ${['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((d, i) => {
      const pct = [62, 78, 85, 71, 90, 45, 38][i];
      return `<div style="display:flex;align-items:center;gap:10px;margin-bottom:8px;">
              <span style="font-size:0.78rem;color:var(--text2);width:80px;flex-shrink:0;">${d}</span>
              <div style="flex:1;"><div class="progress-bar"><div class="progress-fill" style="width:${pct}%;"></div></div></div>
              <span style="font-size:0.75rem;font-weight:700;color:var(--primary);width:30px;">${pct}%</span>
            </div>`;
    }).join('')}
        </div>
        <div class="card">
          <div class="section-heading" style="margin-bottom:1rem;">📋 Activity Overview</div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
            <div style="padding:14px;background:var(--primary-light);border-radius:var(--radius-md);text-align:center;">
              <div style="font-size:1.6rem;font-weight:800;color:var(--primary);">${urlRequests.filter(r => r.status === 'approved').length}</div>
              <div style="font-size:0.75rem;font-weight:600;color:var(--text2);">URLs Approved</div>
            </div>
            <div style="padding:14px;background:var(--teal-light);border-radius:var(--radius-md);text-align:center;">
              <div style="font-size:1.6rem;font-weight:800;color:var(--teal);">${adminPYQs.length + 6}</div>
              <div style="font-size:0.75rem;font-weight:600;color:var(--text2);">PYQs Available</div>
            </div>
            <div style="padding:14px;background:var(--amber-light);border-radius:var(--radius-md);text-align:center;">
              <div style="font-size:1.6rem;font-weight:800;color:var(--amber);">${adminIQs.length + 8}</div>
              <div style="font-size:0.75rem;font-weight:600;color:var(--text2);">Imp. Questions</div>
            </div>
            <div style="padding:14px;background:var(--green-light);border-radius:var(--radius-md);text-align:center;">
              <div style="font-size:1.6rem;font-weight:800;color:var(--green);">0</div>
              <div style="font-size:0.75rem;font-weight:600;color:var(--text2);">Satisfaction</div>
            </div>
          </div>
        </div>
      </div>
    </div>`;
    return;
  }

  if (section === 'create') {
    const allSubAdmins = [...subAdmins];
    const adminFeatures = JSON.parse(localStorage.getItem('edusync_features') || '["Videos","Notes","PYQs","Important Questions"]');
    content.innerHTML = `
    <div style="padding:2rem;max-width:1200px;margin:0 auto;width:100%;">
      <h2 style="font-size:1.4rem;font-weight:800;letter-spacing:-0.02em;margin-bottom:1.5rem;">➕ Create & Manage</h2>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:1.4rem;align-items:start;">
        <!-- Sub Admin Creation -->
        <div class="card">
          <h3 style="margin-bottom:1rem;">👤 Sub Admin Creation</h3>
          <div class="input-group"><label>User ID / Email</label><input class="input" id="adm-sa-user" placeholder="e.g. subadmin2"></div>
          <div class="input-group"><label>Password</label><input class="input" id="adm-sa-pass" placeholder="Secure password" type="password"></div>
          <div class="input-group"><label>Branch</label>
              <select class="select" id="adm-sa-branch"><option value="">Select Branch</option>
                ${['CSE', 'ECE', 'EEE', 'IT', 'AIML', 'AIDS', 'MECH', 'CIVIL'].map(b => `<option>${b}</option>`).join('')}
              </select>
          </div>
          <div id="adm-sa-err" style="display:none;font-size:0.82rem;color:var(--red);margin-bottom:10px;padding:8px 12px;background:var(--red-light);border-radius:var(--radius-sm);"></div>
          <div id="adm-sa-ok" style="display:none;font-size:0.82rem;color:var(--green);margin-bottom:10px;padding:8px 12px;background:var(--green-light);border-radius:var(--radius-sm);"></div>
          <button class="btn btn-primary" onclick="adminCreateSubAdmin();renderAdminSection('create')" style="width:100%;">+ Create Sub Admin</button>
          <hr style="margin:1.2rem 0;border-color:var(--border);">
          <div style="font-size:0.85rem;font-weight:700;margin-bottom:8px;">Active Sub Admins (${allSubAdmins.length})</div>
          <div style="max-height:300px;overflow-y:auto;">
            ${allSubAdmins.map((sa, i) => `
              <div style="display:flex;align-items:center;gap:8px;padding:9px 12px;border:1px solid var(--border);border-radius:var(--radius-sm);margin-bottom:5px;font-size:0.82rem;">
                <div style="flex:1;"><div style="font-weight:600;">${sa.username}</div><div style="font-size:0.72rem;color:var(--text3);">${sa.branch}</div></div>
                <span class="badge badge-green">Active</span>
                <button class="btn btn-danger btn-sm" onclick="adminDeleteSubAdmin(${i});renderAdminSection('create')">✕</button>
              </div>`).join('')}
          </div>
        </div>
        <!-- Feature Management -->
        <div class="card">
          <h3 style="margin-bottom:1rem;">⚡ Feature Management</h3>
          <p style="font-size:0.82rem;color:var(--text2);margin-bottom:1rem;">Dynamically create, edit, and manage platform features.</p>
          <div class="input-group">
            <label>New Feature Name</label>
            <div style="display:flex;gap:8px;">
              <input class="input" id="adm-feature-name" placeholder="e.g. Live Quizzes">
              <button class="btn btn-primary btn-sm" onclick="adminAddFeature()">Add</button>
            </div>
          </div>
          <div style="margin-top:0.8rem;" id="adm-features-list">
            ${adminFeatures.map((f, i) => `
              <div style="display:flex;align-items:center;gap:8px;padding:9px 12px;border:1px solid var(--border);border-radius:var(--radius-sm);margin-bottom:5px;font-size:0.85rem;">
                <span style="flex:1;font-weight:600;">⚡ ${f}</span>
                <span class="badge badge-green">Live</span>
                <button class="btn btn-ghost btn-sm" onclick="adminEditFeature(${i})">✏️</button>
                <button class="btn btn-danger btn-sm" onclick="adminDeleteFeature(${i})">✕</button>
              </div>`).join('')}
          </div>
        </div>
      </div>
    </div>`;
    return;
  }

  if (section === 'subjects') {
    const allSems = ['1-1', '1-2', '2-1', '2-2', '3-1', '3-2', '4-1', '4-2'];
    const unis = ['JNTUK', 'JNTUH', 'Andhra University'];
    const regs = ['R23', 'R20', 'R19', 'R16'];
    const savedFilter = window._adminSubjectFilter || {};
    const filterUni = savedFilter.uni || '';
    const filterReg = savedFilter.reg || '';
    const filterSem = savedFilter.sem || '';
    // All subjects: builtin + custom
    let allSubjects = [];
    allSems.forEach(sem => {
      const builtins = SUBJECTS_DB[sem] || [];
      builtins.forEach(s => allSubjects.push({ ...s, sem, reg: 'R23', uni: 'JNTUK', isBuiltin: true }));
    });
    customSubjects.forEach(s => allSubjects.push({ ...s, isBuiltin: false }));
    // Apply filters
    let filtered = allSubjects;
    if (filterUni) filtered = filtered.filter(s => s.uni === filterUni);
    if (filterReg) filtered = filtered.filter(s => s.reg === filterReg);
    if (filterSem) filtered = filtered.filter(s => s.sem === filterSem);

    content.innerHTML = `
    <div style="padding:2rem;max-width:1200px;margin:0 auto;width:100%;">
      <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px;margin-bottom:1.5rem;">
        <h2 style="font-size:1.4rem;font-weight:800;letter-spacing:-0.02em;">📚 All Subjects</h2>
        <div style="display:flex;gap:8px;flex-wrap:wrap;">
          <select class="select" style="width:140px;" onchange="window._adminSubjectFilter=Object.assign(window._adminSubjectFilter||{},{uni:this.value});renderAdminSection('subjects')">
            <option value="">All Universities</option>${unis.map(u => `<option value="${u}" ${filterUni === u ? 'selected' : ''}>${u}</option>`).join('')}
          </select>
          <select class="select" style="width:120px;" onchange="window._adminSubjectFilter=Object.assign(window._adminSubjectFilter||{},{reg:this.value});renderAdminSection('subjects')">
            <option value="">All Regulations</option>${regs.map(r => `<option value="${r}" ${filterReg === r ? 'selected' : ''}>${r}</option>`).join('')}
          </select>
          <select class="select" style="width:110px;" onchange="window._adminSubjectFilter=Object.assign(window._adminSubjectFilter||{},{sem:this.value});renderAdminSection('subjects')">
            <option value="">All Semesters</option>${allSems.map(s => `<option value="${s}" ${filterSem === s ? 'selected' : ''}>${s}</option>`).join('')}
          </select>
        </div>
      </div>
      <div style="font-size:0.82rem;color:var(--text3);margin-bottom:1rem;">Showing ${filtered.length} subjects</div>
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:1rem;">
        ${filtered.map(s => `
          <div class="card" style="padding:1.2rem;">
            <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:8px;margin-bottom:8px;">
              <div>
                <div style="font-weight:700;font-size:0.92rem;margin-bottom:4px;">${s.icon || '📖'} ${s.name}</div>
                <div style="font-size:0.75rem;color:var(--text3);">${s.code || '—'} · ${s.credits || 3} Cr</div>
              </div>
              ${!s.isBuiltin ? `<button class="btn btn-danger btn-sm" onclick="adminDeleteSubject(${s.id});renderAdminSection('subjects')" title="Delete">✕</button>` : ''}
            </div>
            <div style="display:flex;gap:6px;flex-wrap:wrap;">
              <span class="badge badge-primary">${s.sem}</span>
              <span class="badge badge-teal">${s.uni || 'JNTUK'}</span>
              <span class="badge badge-lavender">${s.reg || 'R23'}</span>
              ${s.isBuiltin ? '<span class="badge badge-green">Built-in</span>' : '<span class="badge badge-amber">Custom</span>'}
            </div>
          </div>`).join('')}
      </div>
    </div>`;
    return;
  }

  if (section === 'approvals') {
    const allReqs = JSON.parse(localStorage.getItem('edusync_url_requests') || '[]');
    const pendingReqs = allReqs.filter(r => r.status === 'pending');
    const approvedReqs = allReqs.filter(r => r.status === 'approved');
    const rejectedReqs = allReqs.filter(r => r.status === 'rejected');

    content.innerHTML = `
    <div style="padding:2rem;max-width:1000px;margin:0 auto;width:100%;">
      <div style="margin-bottom:2rem;">
        <h2 style="font-size:1.6rem;font-weight:800;letter-spacing:-0.02em;margin-bottom:8px;">URL Approvals Queue</h2>
        <p style="font-size:0.9rem;color:var(--text3);">Review, approve, or reject student-submitted resources.</p>
      </div>

      <!-- Stats Cards Row -->
      <div style="display:flex; gap:16px; margin-bottom:2rem; flex-wrap:wrap;">
        <div style="flex:1; min-width:200px; background:var(--surface); border:1px solid var(--border); border-radius:var(--radius-md); padding:1.2rem; display:flex; flex-direction:column; justify-content:center;">
           <div style="font-size:0.75rem; color:var(--text3); font-weight:700; text-transform:uppercase; letter-spacing:0.05em; margin-bottom:8px;">Pending Requests</div>
           <div style="font-size:2rem; font-weight:800; color:var(--amber); line-height:1;">${pendingReqs.length}</div>
        </div>
        <div style="flex:1; min-width:200px; background:var(--surface); border:1px solid var(--border); border-radius:var(--radius-md); padding:1.2rem; display:flex; flex-direction:column; justify-content:center;">
           <div style="font-size:0.75rem; color:var(--text3); font-weight:700; text-transform:uppercase; letter-spacing:0.05em; margin-bottom:8px;">Approved Requests</div>
           <div style="font-size:2rem; font-weight:800; color:var(--green); line-height:1;">${approvedReqs.length}</div>
        </div>
        <div style="flex:1; min-width:200px; background:var(--surface); border:1px solid var(--border); border-radius:var(--radius-md); padding:1.2rem; display:flex; flex-direction:column; justify-content:center;">
           <div style="font-size:0.75rem; color:var(--text3); font-weight:700; text-transform:uppercase; letter-spacing:0.05em; margin-bottom:8px;">Rejected Requests</div>
           <div style="font-size:2rem; font-weight:800; color:var(--red); line-height:1;">${rejectedReqs.length}</div>
        </div>
      </div>

      <!-- Queue List -->
      <div style="display:flex; flex-direction:column; gap:16px;">
        ${!allReqs.length ? '<div style="text-align:center;padding:4rem;color:var(--text3);background:var(--surface);border:1px dashed var(--border);border-radius:var(--radius-md);">🎉 No URL requests in the queue.</div>' :
        allReqs.slice().reverse().map((r, i) => {
          const realIdx = allReqs.length - 1 - i;
          const statusColor = r.status === 'approved' ? 'var(--green)' : r.status === 'rejected' ? 'var(--red)' : 'var(--amber)';
          const statusBg = r.status === 'approved' ? 'rgba(34,197,94,0.1)' : r.status === 'rejected' ? 'rgba(239,68,68,0.1)' : 'rgba(245,158,11,0.1)';
          const statusLabel = r.status === 'pending' ? 'Pending' : r.status === 'approved' ? 'Approved' : 'Rejected';

          return `
            <div style="background:var(--surface);border:1px solid var(--border);border-radius:var(--radius-md);padding1.2rem; display:flex; flex-direction:column; gap:12px; transition:box-shadow 0.2s ease;">
              
              <!-- Header Row: Subject / Unit / Topic -->
              <div style="display:flex; justify-content:space-between; align-items:flex-start; flex-wrap:wrap; gap:12px;">
                <div style="display:flex; align-items:center; flex-wrap:wrap; gap:8px;">
                  <div style="font-weight:700; font-size:1.05rem; color:var(--text1);">${r.subject || 'Unknown Subject'}</div>
                  <div style="color:var(--text3); font-size:0.9rem;">/</div>
                  <div style="font-weight:600; font-size:0.95rem; color:var(--text2);">Unit ${r.unit || '-'}</div>
                  <div style="color:var(--text3); font-size:0.9rem;">/</div>
                  <div style="font-weight:500; font-size:0.95rem; color:var(--text2);">${r.topic || 'No Topic Specified'}</div>
                </div>
                <!-- Status Badge -->
                <div style="background:${statusBg}; color:${statusColor}; border:1px solid ${statusColor}40; padding:4px 10px; border-radius:12px; font-size:0.75rem; font-weight:700; text-transform:uppercase; letter-spacing:0.05em; display:inline-block;">
                  ${statusLabel}
                </div>
              </div>

              <!-- Middle Row: Submitted By & Date -->
              <div style="display:flex; align-items:center; flex-wrap:wrap; gap:24px; font-size:0.85rem; color:var(--text3);">
                <div style="display:flex; align-items:center; gap:6px;">
                  <span style="opacity:0.7;">🁤</span> 
                  <span style="font-weight:500; color:var(--text2);">${r.submittedBy || 'Unknown User'}</span>
                </div>
                <div style="display:flex; align-items:center; gap:6px;">
                  <span style="opacity:0.7;">𝔐</span> 
                  <span style="font-weight:500; color:var(--text2);">${r.submittedAt || 'Unknown Time'}</span>
                </div>
              </div>

              <!-- Bottom Row: URL -->
              <div style="background:var(--bg); border:1px solid var(--border); border-radius:6px; padding10px 12px; display:flex; align-items:center; gap:8px;">
                <span style="font-size:0.9rem; opacity:0.6;">🖇</span>
                <a href="${r.url}" target="_blank" style="color:var(--primary); font-size:0.85rem; font-family:monospace; text-decoration:none; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; display:block; width:100%; font-weight:500;" title="${r.url}">
                  ${r.url}
                </a>
              </div>

              <!-- Action Row -->
              <div style="display:flex; justify-content:flex-end; gap:8px; flex-wrap:wrap; margin-top:4px;">
                <a href="${r.url}" target="_blank" class="btn btn-ghost btn-sm" style="font-size:0.8rem; padding:6px 12px;">👁 View Link</a>
                ${r.status === 'pending' ? `
                  <button class="btn btn-teal btn-sm" onclick="adminApproveUrl(${realIdx});renderAdminSection('approvals')" style="font-size:0.8rem; padding:6px 12px;">✅\tApprove</button>
                  <button class="btn btn-danger btn-sm" onclick="adminRejectUrl(${realIdx});renderAdminSection('approvals')" style="font-size:0.8rem; padding:6px 12px;">❌\tReject</button>
                ` : ''}
                <button class="btn btn-ghost btn-sm" onclick="typeof showToast === 'function' ? showToast('Edit action pending backend integration', 'amber') : alert('Edit action not implemented')" style="font-size:0.8rem; padding:6px 12px;">✏️ Edit</button>
                <button class="btn btn-ghost btn-sm" onclick="typeof showToast === 'function' ? showToast('Delete action pending backend integration', 'red') : alert('Delete action not implemented')" style="font-size:0.8rem; padding:6px 12px; color:var(--red);">🙁\tDelete</button>
              </div>

            </div>`;
        }).join('')}
      </div>
    </div>`;
    return;
  }
}

export function launchAdminDashboard() {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById('screen-admin').classList.add('active');
  document.getElementById('admin-role-label').textContent = 'Full Administrator';
  document.getElementById('create-subadmin-btn').style.display = 'flex';
  document.getElementById('admin-sidebar-name').textContent = 'Administrator';
  document.getElementById('admin-sidebar-role').textContent = 'Full Access';
  switchAdminSection('dashboard');
}

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

export function patchAdminSubjectsNav() {
  setTimeout(() => {
    const navEl = document.getElementById('admin-nav-subjects');
    if (navEl) navEl.onclick = function () { switchAdminSection('subjects'); };
  }, 300);
}

export function installStudentDashboardAndWorkshopPatch() {
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
}
