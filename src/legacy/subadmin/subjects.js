// Common legacy helpers used across modules
const esc = (value) => String(value ?? '').replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
const js = (value) => String(value ?? '').replace(/\\/g, '\\\\').replace(/'/g, "\\'");
const sb = () => window.__AIMEASY_SUPABASE__;
const todayKeyDb = (date = new Date()) => date.toISOString().slice(0, 10);
const pctFromCgpa = (cgpa) => Math.max(0, Math.min(100, Number(cgpa || 0) * 9.5));

export function launchTeacherPortal(teacher) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  const ts = document.getElementById('screen-teacher');
  ts.classList.add('active');
  // Render teacher portal UI
  ts.innerHTML = `
    <header class="admin-topbar">
      <div style="display:flex;align-items:center;gap:12px;">
        <div class="logo-icon" style="width:32px;height:32px;font-size:0.85rem;background:linear-gradient(135deg,var(--teal),var(--primary));">T</div>
        <div>
          <div style="font-weight:800;font-size:1rem;letter-spacing:-0.02em;">AIIENS Edu Teacher Portal</div>
          <div style="font-size:0.72rem;color:var(--text3);">${teacher.dept} Department</div>
        </div>
      </div>
      <div style="display:flex;gap:10px;align-items:center;">
        <span class="badge badge-teal" style="font-size:0.75rem;padding:5px 12px;">👨‍🏫 ${teacher.name}</span>
        <button class="btn btn-ghost btn-sm" onclick="teacherLogout()">Logout</button>
      </div>
    </header>
    <div style="padding:2rem;max-width:1100px;margin:0 auto;width:100%;">
      <div style="margin-bottom:2rem;">
        <h2 style="font-size:1.6rem;font-weight:800;letter-spacing:-0.02em;margin-bottom:4px;">Welcome, ${teacher.name}! 👋</h2>
        <p style="font-size:0.88rem;color:var(--text2);">Subject: ${teacher.subject} · ${teacher.dept} Department</p>
      </div>

      <!-- Stats Row -->
      <div class="admin-grid" style="margin-bottom:2rem;">
        <div class="admin-stat-card">
          <div class="admin-stat-accent" style="background:var(--primary);"></div>
          <div style="font-size:2.2rem;font-weight:800;color:var(--primary);">124</div>
          <div style="font-size:0.88rem;font-weight:600;margin-top:4px;">Students Enrolled</div>
          <div style="font-size:0.75rem;color:var(--text3);margin-top:4px;">Across 3 sections</div>
        </div>
        <div class="admin-stat-card">
          <div class="admin-stat-accent" style="background:var(--teal);"></div>
          <div style="font-size:2.2rem;font-weight:800;color:var(--teal);">18</div>
          <div style="font-size:0.88rem;font-weight:600;margin-top:4px;">Materials Uploaded</div>
          <div style="font-size:0.75rem;color:var(--text3);margin-top:4px;">Videos, Notes & PYQs</div>
        </div>
        <div class="admin-stat-card">
          <div class="admin-stat-accent" style="background:var(--lavender);"></div>
          <div style="font-size:2.2rem;font-weight:800;color:var(--lavender);">5</div>
          <div style="font-size:0.88rem;font-weight:600;margin-top:4px;">Units Covered</div>
          <div style="font-size:0.75rem;color:var(--text3);margin-top:4px;">Full syllabus available</div>
        </div>
        <div class="admin-stat-card">
          <div class="admin-stat-accent" style="background:var(--amber);"></div>
          <div style="font-size:2.2rem;font-weight:800;color:var(--amber);">87%</div>
          <div style="font-size:0.88rem;font-weight:600;margin-top:4px;">Avg Attendance</div>
          <div style="font-size:0.75rem;color:var(--text3);margin-top:4px;">This semester</div>
        </div>
      </div>

      <!-- Quick Actions -->
      <div class="card" style="margin-bottom:1.5rem;">
        <div class="section-heading">⚡ Quick Actions</div>
        <div style="display:flex;gap:12px;flex-wrap:wrap;">
          <button class="btn btn-primary" onclick="showToast('📤 Upload material — connect to Sub Admin panel','blue')">📤 Upload Material</button>
          <button class="btn btn-teal" onclick="showToast('📝 Quiz builder coming soon!','blue')">📝 Create Quiz</button>
          <button class="btn btn-lavender" onclick="showToast('📊 Analytics dashboard coming soon!','blue')">📊 View Analytics</button>
          <button class="btn btn-ghost" onclick="showToast('📣 Announcement sent to all students!','green')">📣 Announce</button>
        </div>
      </div>

      <!-- Recent Activity -->
      <div class="card">
        <div class="section-heading">🕐 Recent Activity</div>
        ${[
      { icon: '🎬', title: 'Uploaded: OS Unit 3 — Memory Management Video', time: '2 hours ago', color: 'var(--teal-light)' },
      { icon: '📄', title: 'Added Notes: Virtual Memory Concepts PDF', time: 'Yesterday', color: 'var(--primary-light)' },
      { icon: '📝', title: 'Added 5 PYQs for Unit 2 (2019–2023)', time: '2 days ago', color: 'var(--lavender-light)' },
      { icon: '✅', title: 'Reviewed 8 student URL submissions', time: '3 days ago', color: 'var(--green-light)' },
    ].map(a => `
          <div class="recent-item">
            <div class="recent-thumb" style="background:${a.color};">${a.icon}</div>
            <div class="recent-info">
              <div class="recent-title">${a.title}</div>
              <div class="recent-sub">${teacher.subject}</div>
            </div>
            <div class="recent-time">${a.time}</div>
          </div>`).join('')}
      </div>
    </div>
  `;
}

export function teacherLogout() {
  APP.role = null;
  APP.teacherData = null;
  showScreen('screen-landing');
  showToast('👋 Logged out of Teacher Portal', 'blue');
}

export function saCreateSubject() {
  const branch = document.getElementById('sa-sub-branch')?.value;
  const year = document.getElementById('sa-sub-year')?.value;
  const sem = document.getElementById('sa-sub-sem')?.value;
  const reg = document.getElementById('sa-sub-reg')?.value;
  const uni = document.getElementById('sa-sub-uni')?.value;
  const name = document.getElementById('sa-sub-name')?.value.trim();
  const code = document.getElementById('sa-sub-code')?.value.trim();
  const credits = document.getElementById('sa-sub-credits')?.value || '3';
  if (!branch || !sem || !reg || !uni || !name) { showToast('Fill all required fields', 'red'); return; }
  const subjects = JSON.parse(localStorage.getItem('edusync_custom_subjects') || '[]');
  subjects.push({ branch, year, sem, reg, uni, name, code, credits, id: Date.now() });
  localStorage.setItem('edusync_custom_subjects', JSON.stringify(subjects));
  showToast('✅ Subject created and live for students!', 'green');
  switchSASection('subjects');
}

export function saDeleteSubject(id) {
  const subjects = JSON.parse(localStorage.getItem('edusync_custom_subjects') || '[]');
  localStorage.setItem('edusync_custom_subjects', JSON.stringify(subjects.filter(s => s.id !== id)));
  showToast('Subject deleted', 'red');
  switchSASection('subjects');
}
