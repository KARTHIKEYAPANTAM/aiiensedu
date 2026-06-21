
const js = (value) =>
String(value ?? '')
.replace(/\\/g, '\\\\')
.replace(/'/g, "\\'");

export function renderSubAdminShell(subjectCount) {
    return `
      <div style="padding:2rem;max-width:1100px;margin:0 auto;width:100%;">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:1.2rem;flex-wrap:wrap;gap:10px;">
          <h2 style="font-size:1.4rem;font-weight:800;letter-spacing:-.02em;">📚 My Subjects (${subjectCount})</h2>
          <div style="display:flex;gap:8px;">
            <button class="btn btn-ghost btn-sm" onclick="v10SASubjects()">🔄 Refresh</button>
            <button class="btn btn-primary" onclick="document.getElementById('v10-sa-create-form').style.display='block';document.getElementById('v10-sa-create-form').scrollIntoView({behavior:'smooth'})">+ Add Subject</button>
          </div>
        </div>
        <div id="sa-create-subject-form-container"></div>
        <div id="sa-subjects-grid-container"></div>
      </div>
    `;
}

export function renderCreateSubjectForm() {
    const sa = window.APP?.subAdminData || {};
    const allSems = ['1-1', '1-2', '2-1', '2-2', '3-1', '3-2', '4-1', '4-2'];
    const unis = ['JNTUK', 'JNTUH', 'Andhra University'];
    const regs = ['R23', 'R20', 'R19', 'R16'];
    const branches = ['CSE', 'ECE', 'EEE', 'IT', 'AIML', 'AIDS', 'MECH', 'CIVIL'];

    return `
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
          <div class.input-group">
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
          <button class="btn btn-primary" id="v10-sa-create-btn" onclick="window.__v10SACreateSubjectFixed()" style="flex:1;">✅ Create Subject</button>
          <button class="btn btn-ghost" onclick="document.getElementById('v10-sa-create-form').style.display='none'">Cancel</button>
        </div>
      </div>`;
}

export function renderSubjectCards(subjects) {
    if (!subjects || subjects.length === 0) {
        return `<div style="text-align:center;padding:4rem;color:var(--text3);">
            <div style="font-size:3rem;margin-bottom:1rem;">📚</div>
            <div style="font-weight:600;font-size:1rem;margin-bottom:6px;">No subjects yet</div>
            <div style="font-size:.82rem;">Click "+ Add Subject" to create your first subject</div>
          </div>`;
    }

    const cards = subjects.map(s => {
        const safeName = js(s.name);
        const safeId = s.id;
        // IMPORTANT: onclick uses the legacy v10SAOpenUnits, not the modern openSubject
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
            <span class="badge badge-amber">My Subject ✓</span>
          </div>
          <div class="v10-arrow">📋 Click to manage units →</div>
        </div>`;
      }).join('');

    return `<div class="v10-subj-grid">${cards}</div>`;
}
