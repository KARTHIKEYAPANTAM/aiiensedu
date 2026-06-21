// Common legacy helpers used across modules
const esc = (value) => String(value ?? '').replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
const js = (value) => String(value ?? '').replace(/\\/g, '\\\\').replace(/'/g, "\\'");
const sb = () => window.__AIMEASY_SUPABASE__;
const todayKeyDb = (date = new Date()) => date.toISOString().slice(0, 10);
const pctFromCgpa = (cgpa) => Math.max(0, Math.min(100, Number(cgpa || 0) * 9.5));

export async function adminCreateSubAdmin() {
  const username = document.getElementById('adm-sa-user')?.value.trim();
  const password = document.getElementById('adm-sa-pass')?.value.trim();
  const branch = document.getElementById('adm-sa-branch')?.value;
  const errEl = document.getElementById('adm-sa-err');
  const okEl = document.getElementById('adm-sa-ok');
  if (!username || !password || !branch) {
    if (errEl) { errEl.textContent = 'Fill all fields (User ID, Password, Branch)'; errEl.style.display = 'block'; }
    return;
  }
  if (errEl) errEl.style.display = 'none';
  const subAdmins = JSON.parse(localStorage.getItem('edusync_subadmins') || '[]');
  if (subAdmins.find(sa => sa.username === username)) {
    if (errEl) { errEl.textContent = 'User ID already exists'; errEl.style.display = 'block'; }
    return;
  }
  subAdmins.push({ username, password, branch, createdAt: new Date().toLocaleString() });
  localStorage.setItem('edusync_subadmins', JSON.stringify(subAdmins));
  console.log('STARTING SUBADMIN INSERT', username);
  if (window.supabase) {
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

    console.log('INSERT DATA:', data);
    console.log('INSERT ERROR:', error);

    if (error) {
      console.error('SUBADMIN INSERT ERROR:', error);
      showToast('❌ Failed to save subadmin to database', 'red');
    } else {
      console.log('SUBADMIN INSERT SUCCESS:', username);
    }
  }
  if (okEl) { okEl.textContent = '✅ Sub Admin "' + username + '" created for branch ' + branch; okEl.style.display = 'block'; setTimeout(() => { if (okEl) okEl.style.display = 'none'; }, 3000); }
  showToast('✅ Sub Admin created!', 'green');
  renderAdminDashboard('subadmins');
}

export function adminDeleteSubAdmin(index) {
  const subAdmins = JSON.parse(localStorage.getItem('edusync_subadmins') || '[]');
  subAdmins.splice(index, 1);
  localStorage.setItem('edusync_subadmins', JSON.stringify(subAdmins));
  showToast('Sub Admin deleted', 'red');
}

export function launchSubAdmin_LEGACY() {
  // Overridden by new launchSubAdmin defined later
}

export function switchSubAdminTab(tab, el) {
  document.querySelectorAll('.subadmin-tab').forEach(t => t.classList.remove('active'));
  if (el) el.classList.add('active');
  const content = document.getElementById('subadmin-tab-content');

  if (tab === 'subjects') {
    content.innerHTML = `
      <div class="card" style="max-width:560px;">
        <h3 style="margin-bottom:1.2rem;">📚 Create Subject</h3>
        <div class="form-row">
          <div class="input-group"><label>Branch</label>
            <select class="select" id="sa-branch"><option value="">Select Branch</option>
              ${['CSE', 'ECE', 'EEE', 'IT', 'AIML', 'AIDS', 'MECH', 'CIVIL'].map(b => `<option>${b}</option>`).join('')}
            </select></div>
          <div class="input-group"><label>Year</label>
            <select class="select" id="sa-year"><option value="">Select Year</option>
              <option value="1">1st Year</option><option value="2">2nd Year</option>
              <option value="3">3rd Year</option><option value="4">4th Year</option>
            </select></div>
        </div>
        <div class="form-row">
          <div class="input-group"><label>Semester</label>
            <select class="select" id="sa-sem"><option value="">Select Semester</option>
              ${['1-1', '1-2', '2-1', '2-2', '3-1', '3-2', '4-1', '4-2'].map(s => `<option>${s}</option>`).join('')}
            </select></div>
          <div class="input-group"><label>Regulation</label>
            <select class="select" id="sa-reg"><option value="">Select Regulation</option>
              <option>R23</option><option>R20</option></select></div>
        </div>
        <div class="input-group"><label>University</label>
          <select class="select" id="sa-uni"><option value="">Select University</option>
            <option>JNTUK</option><option>JNTUH</option><option>Andhra University</option>
          </select></div>
        <div class="input-group"><label>Subject Name</label>
          <input class="input" id="sa-subname" placeholder="e.g. Data Structures and Algorithms"></div>
        <div class="form-row">
          <div class="input-group"><label>Subject Code</label>
            <input class="input" id="sa-subcode" placeholder="e.g. CS301"></div>
          <div class="input-group"><label>Credits</label>
            <input class="input" id="sa-credits" placeholder="e.g. 3" type="number" min="1" max="5"></div>
        </div>
        <button class="btn btn-lavender" onclick="createSubject()" style="width:100%;margin-top:0.5rem;">+ Create Subject</button>
        <div id="sa-subjects-list" style="margin-top:1.2rem;"></div>
      </div>
      <!-- Learning Roadmap Creator (shown after subject is created) -->
      <div id="sa-roadmap-creator" style="display:none;margin-top:1.4rem;max-width:900px;">
        <div class="card">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:1.2rem;">
            <div>
              <h3 style="margin-bottom:4px;">📍 Create Learning Roadmap</h3>
              <p style="font-size:0.82rem;color:var(--text2);">Define subtopics for each of the 5 units. Students will see these as their learning path.</p>
            </div>
            <span id="sa-roadmap-subject-label" class="badge badge-lavender" style="font-size:0.8rem;padding:6px 14px;"></span>
          </div>
          <div id="sa-roadmap-units" style="display:flex;flex-direction:column;gap:1rem;"></div>
          <button class="btn btn-primary" onclick="saveRoadmap()" style="width:100%;margin-top:1.2rem;">💾 Save Learning Roadmap</button>
        </div>
      </div>`;
    renderSASubjects();
  } else if (tab === 'videos') {
    // Build subject options from both builtin and custom subjects
    const customSubjects = JSON.parse(localStorage.getItem('edusync_custom_subjects') || '[]');
    const builtinSubjectNames = Object.values(SUBJECTS_DB).flat().map(s => s.name);
    const customSubjectNames = customSubjects.map(s => s.name);
    const allSubjectNames = [...new Set([...builtinSubjectNames, ...customSubjectNames])].sort();
    content.innerHTML = `
      <div class="card" style="max-width:700px;">
        <h3 style="margin-bottom:1.2rem;">🎬 Upload Video</h3>
        <p style="font-size:0.82rem;color:var(--text2);margin-bottom:1rem;">Paste a YouTube URL — it will appear as an <strong>embedded video</strong> in the student's subject page.</p>
        <div class="input-group"><label>Video Title</label><input class="input" id="sa-vtitle" placeholder="e.g. Unit 1 Introduction"></div>
        <div class="input-group"><label>YouTube / Video URL</label><input class="input" id="sa-vurl" placeholder="https://youtube.com/watch?v=..." type="url"></div>
        <div class="form-row">
          <div class="input-group"><label>Subject</label>
            <select class="select" id="sa-vsubject" onchange="updateRoadmapTopicSelector()">
              <option value="">All Subjects</option>
              ${allSubjectNames.map(n => `<option value="${n}">${n}</option>`).join('')}
            </select>
          </div>
          <div class="input-group"><label>Unit</label>
            <select class="select" id="sa-vunit" onchange="updateRoadmapTopicSelector()">
              <option value="">All Units</option>
              ${[1, 2, 3, 4, 5].map(u => `<option value="${u}">Unit ${u}</option>`).join('')}
            </select></div>
        </div>
        <div class="input-group" id="sa-vtopic-group" style="display:none;">
          <label>📍 Learning Roadmap Topic</label>
          <select class="select" id="sa-vtopic"><option value="">Select a topic (optional)</option></select>
          <div style="font-size:0.75rem;color:var(--text3);margin-top:4px;">Link this video to a specific topic in the learning roadmap</div>
        </div>
        <button class="btn btn-lavender" onclick="uploadVideo()" style="width:100%;margin-top:0.5rem;">📤 Upload Video</button>
        <div id="sa-videos-list" style="margin-top:1.2rem;"></div>
      </div>`;
    renderUploadedVideosList();
  } else if (tab === 'notes') {
    const customSubjects = JSON.parse(localStorage.getItem('edusync_custom_subjects') || '[]');
    const builtinSubjectNames = Object.values(SUBJECTS_DB).flat().map(s => s.name);
    const customSubjectNames = customSubjects.map(s => s.name);
    const allSubjectNames = [...new Set([...builtinSubjectNames, ...customSubjectNames])].sort();
    content.innerHTML = `
      <div class="card" style="max-width:560px;">
        <h3 style="margin-bottom:0.5rem;">📄 Upload Notes</h3>
        <p style="font-size:0.82rem;color:var(--text2);margin-bottom:1rem;">Notes uploaded here will appear in the student's <strong>Notes tab</strong> for the selected subject & unit.</p>
        <div class="input-group"><label>Notes Title</label><input class="input" id="sa-ntitle" placeholder="e.g. Unit 1 Handwritten Notes"></div>
        <div class="form-row">
          <div class="input-group"><label>Type</label>
            <select class="select" id="sa-ntype">
              <option value="pdf">📄 PDF</option>
              <option value="doc">📝 DOC</option>
              <option value="link">🔗 Link</option>
            </select>
          </div>
          <div class="input-group"><label>Unit</label>
            <select class="select" id="sa-nunit"><option value="">All Units</option>
              ${[1, 2, 3, 4, 5].map(u => `<option value="${u}">Unit ${u}</option>`).join('')}
            </select>
          </div>
        </div>
        <div class="input-group"><label>Subject</label>
          <select class="select" id="sa-nsubject">
            <option value="">All Subjects</option>
            ${allSubjectNames.map(n => `<option value="${n}">${n}</option>`).join('')}
          </select>
        </div>
        <div class="input-group"><label>Link / URL (Google Drive, PDF URL etc.)</label>
          <input class="input" id="sa-nlink" placeholder="https://drive.google.com/..." type="url">
        </div>
        <button class="btn btn-lavender" onclick="uploadNotes()" style="width:100%;margin-top:0.5rem;">📤 Upload Notes</button>
        <div id="sa-notes-list" style="margin-top:1.2rem;"></div>
      </div>`;
    renderUploadedNotesList();
  } else if (tab === 'pyq') {
    const customSubjects = JSON.parse(localStorage.getItem('edusync_custom_subjects') || '[]');
    const allSubjectNames = [...new Set([...Object.values(SUBJECTS_DB).flat().map(s => s.name), ...customSubjects.map(s => s.name)])].sort();
    content.innerHTML = `
      <div class="card" style="max-width:600px;">
        <h3 style="margin-bottom:0.5rem;">📝 Upload Previous Year Questions</h3>
        <p style="font-size:0.82rem;color:var(--text2);margin-bottom:1rem;">PYQs uploaded here will appear in the student's <strong>Previous Year Qs tab</strong>.</p>
        <div class="form-row">
          <div class="input-group"><label>Exam Year</label><input class="input" id="sa-pyqyear" placeholder="e.g. 2023" type="number" min="2000" max="2099"></div>
          <div class="input-group"><label>Repeated Count</label><input class="input" id="sa-pyqcount" placeholder="e.g. 3" type="number" min="1" value="1"></div>
        </div>
        <div class="input-group"><label>Question Text</label>
          <textarea class="input" id="sa-pyqtext" placeholder="Type the question here..." rows="3" style="resize:vertical;"></textarea>
        </div>
        <div class="input-group"><label>Answer (optional)</label>
          <textarea class="input" id="sa-pyqans" placeholder="Type the answer or explanation..." rows="3" style="resize:vertical;"></textarea>
        </div>
        <div class="form-row">
          <div class="input-group"><label>Subject</label>
            <select class="select" id="sa-pyqsubject">
              <option value="">All Subjects</option>
              ${allSubjectNames.map(n => `<option value="${n}">${n}</option>`).join('')}
            </select>
          </div>
          <div class="input-group"><label>Unit</label>
            <select class="select" id="sa-pyqunit"><option value="">All Units</option>
              ${[1, 2, 3, 4, 5].map(u => `<option value="${u}">Unit ${u}</option>`).join('')}
            </select>
          </div>
        </div>
        <button class="btn btn-lavender" onclick="uploadPYQ()" style="width:100%;margin-top:0.5rem;">📤 Upload Question</button>
        <div id="sa-pyq-list" style="margin-top:1.2rem;"></div>
      </div>`;
    renderUploadedPYQList();
  } else if (tab === 'iq') {
    const customSubjects = JSON.parse(localStorage.getItem('edusync_custom_subjects') || '[]');
    const allSubjectNames = [...new Set([...Object.values(SUBJECTS_DB).flat().map(s => s.name), ...customSubjects.map(s => s.name)])].sort();
    content.innerHTML = `
      <div class="card" style="max-width:560px;">
        <h3 style="margin-bottom:0.5rem;">⭐ Upload Important Questions</h3>
        <p style="font-size:0.82rem;color:var(--text2);margin-bottom:1rem;">Important questions uploaded here will appear in the student's <strong>Important Qs tab</strong>.</p>
        <div class="input-group"><label>Question</label>
          <textarea class="input" id="sa-iqtext" placeholder="Type the important question..." rows="3" style="resize:vertical;"></textarea>
        </div>
        <div class="form-row">
          <div class="input-group"><label>Priority</label>
            <select class="select" id="sa-iqpriority">
              <option value="high">🔴 High Priority</option>
              <option value="med">🟡 Medium Priority</option>
              <option value="low">🟢 Low Priority</option>
            </select>
          </div>
          <div class="input-group"><label>Tags (comma separated)</label>
            <input class="input" id="sa-iqtags" placeholder="e.g. Unit 1, Memory">
          </div>
        </div>
        <div class="form-row">
          <div class="input-group"><label>Subject</label>
            <select class="select" id="sa-iqsubject">
              <option value="">All Subjects</option>
              ${allSubjectNames.map(n => `<option value="${n}">${n}</option>`).join('')}
            </select>
          </div>
          <div class="input-group"><label>Unit</label>
            <select class="select" id="sa-iqunit"><option value="">All Units</option>
              ${[1, 2, 3, 4, 5].map(u => `<option value="${u}">Unit ${u}</option>`).join('')}
            </select>
          </div>
        </div>
        <button class="btn btn-lavender" onclick="uploadIQ()" style="width:100%;margin-top:0.5rem;">+ Add Question</button>
        <div id="sa-iq-list" style="margin-top:1.2rem;"></div>
      </div>`;
    renderUploadedIQList();
  } else if (tab === 'urls') {
    content.innerHTML = `
      <div class="card">
        <h3 style="margin-bottom:1.2rem;">🔗 Manage URL Requests</h3>
        <div id="sa-url-list"></div>
      </div>`;
    renderSAUrlRequests();
  }
}

export function openCreateSubAdminModal() {
  document.getElementById('sa-create-username').value = '';
  document.getElementById('sa-create-password').value = '';
  document.getElementById('sa-create-branch').value = '';
  document.getElementById('sa-create-dept').value = '';
  document.getElementById('sa-create-err').style.display = 'none';
  document.getElementById('sa-create-success').style.display = 'none';
  renderExistingSubAdmins();
  document.getElementById('create-subadmin-modal').classList.add('open');
}

export function closeCreateSubAdminModal() {
  document.getElementById('create-subadmin-modal').classList.remove('open');
}

export async function renderExistingSubAdmins() {
  const { data: subAdmins, error } = await window.supabase
    .from('sub_admin_accounts')
    .select('*');

  if (error) {
    console.error(error);
    return;
  }
  const el = document.getElementById('sa-existing-list');
  if (!el) return;
  if (!subAdmins.length) { el.innerHTML = ''; return; }
  el.innerHTML = '<div style="font-size:0.78rem;font-weight:700;color:var(--text2);margin-bottom:6px;">Existing Sub Admins (' + subAdmins.length + ')</div>' +
    subAdmins.map(sa =>
      '<div style="display:flex;align-items:center;gap:8px;padding:8px 12px;background:var(--surface2);border:1px solid var(--border);border-radius:var(--radius-sm);margin-bottom:4px;font-size:0.82rem;">' +
      '<span style="flex:1;font-weight:600;">' + sa.username + '</span>' +
      '<span class="badge badge-teal">' + sa.branch + '</span>' +

      '<span class="badge badge-green">Active</span></div>'
    ).join('');
}

export function createSubAdmin() {
  const username = document.getElementById('sa-create-username').value.trim();
  const password = document.getElementById('sa-create-password').value.trim();
  const branch = document.getElementById('sa-create-branch').value;
  const dept = document.getElementById('sa-create-dept').value.trim();
  const errEl = document.getElementById('sa-create-err');
  const sucEl = document.getElementById('sa-create-success');
  if (!username || !password || !branch || !dept) {
    errEl.textContent = 'Please fill all fields.';
    errEl.style.display = 'block'; sucEl.style.display = 'none'; return;
  }
  errEl.style.display = 'none';
  const subAdmins = JSON.parse(localStorage.getItem('edusync_subadmins') || '[]');
  if (subAdmins.find(sa => sa.username === username)) {
    errEl.textContent = 'Username already exists.';
    errEl.style.display = 'block'; return;
  }
  subAdmins.push({ username, password, branch, createdAt: new Date().toLocaleString() });
  localStorage.setItem('edusync_subadmins', JSON.stringify(subAdmins));
  sucEl.textContent = 'Sub Admin "' + username + '" created! They can login with these credentials.';
  sucEl.style.display = 'block';
  document.getElementById('sa-create-username').value = '';
  document.getElementById('sa-create-password').value = '';
  document.getElementById('sa-create-branch').value = '';
  document.getElementById('sa-create-dept').value = '';
  renderExistingSubAdmins();
  if (typeof renderAdminDashboard === 'function') renderAdminDashboard();
  showToast('Sub Admin created!', 'green');
}

export function launchSubAdmin() {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById('screen-subadmin').classList.add('active');
  const sa = APP.subAdminData || {};
  const saNameEl = document.getElementById('sa-sidebar-name');
  const saInfoEl = document.getElementById('sa-sidebar-info');
  if (saNameEl) saNameEl.textContent = sa.username || 'Sub Admin';
  if (saInfoEl) saInfoEl.textContent = (sa.branch || 'Content Manager');
  switchSASection('dashboard');
}

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
