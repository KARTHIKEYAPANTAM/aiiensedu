// AIIENS Edu targeted fixes: auth, regulations, counters, navigation, menus, and placeholders.
window.v10Esc = window.v10Esc || function(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
};
(function installAIIENSEduFixes() {
  const REG_KEY = 'edusync_regulations'; // legacy key (no longer used for regulation CRUD)
  const DEFAULT_UNIVERSITIES = [
    { name: 'JNTUK', code: 'JNTUK', state: 'Andhra Pradesh', status: 'Active' },
    { name: 'JNTUH', code: 'JNTUH', state: 'Telangana', status: 'Active' },
    { name: 'Andhra University', code: 'AU', state: 'Andhra Pradesh', status: 'Active' },
  ];

  function read(key, fallback) {
    try {
      return JSON.parse(localStorage.getItem(key) || '') ?? fallback;
    } catch (e) {
      return fallback;
    }
  }

  function write(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }


  function esc(value) {
    return String(value ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function unitNumber(value, fallback = 1) {
    const source = typeof value === 'object'
      ? (value.sort_order || value.order || value.unit || value.id || value.name || value.title)
      : value;
    const text = String(source ?? '');
    const explicit = text.match(/unit\s*[-:]?\s*(\d+)/i);
    if (explicit) return Number(explicit[1]);
    const numeric = Number(text);
    if (Number.isFinite(numeric) && numeric > 0) return numeric;
    return Number(fallback) || 1;
  }

  function unitLabel(value, fallback = 1) {
    return `Unit - ${unitNumber(value, fallback)}`;
  }

  window.aimeasyUnitLabel = unitLabel;

  function findSubjectById(id) {
    if (typeof window.findSubjectById === 'function') return window.findSubjectById(id);
    const custom = JSON.parse(localStorage.getItem('edusync_custom_subjects') || '[]');
    return custom.find(s => String(s.id) === String(id));
  }

  function normalizeStatus(value) {
    return String(value || 'Active').trim().toLowerCase();
  }

  function uniqueByName(rows) {
    const seen = new Set();
    const deletedDefaults = new Set(read('edusync_deleted_universities', []).map((name) => String(name || '').toLowerCase()));
    return rows
      .map((row) => ({
        name: String(row?.name || row?.university_name || row?.university || row?.code || row || '').trim(),
        code: String(row?.code || row?.university_code || row?.name || row || '').trim(),
        state: String(row?.state || '').trim(),
        status: String(row?.status || 'Active').trim() || 'Active',
        id: row?.id,
      }))
      .filter((row) => {
        const key = row.name.toLowerCase();
        return row.name && normalizeStatus(row.status) !== 'inactive' && normalizeStatus(row.status) !== 'deleted' && !deletedDefaults.has(key);
      })
      .filter((row) => {
        const key = row.name.toLowerCase();
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
  }

  let cachedRegulations = read('aimeasy_cached_regulations', []);
  try {
    const stored = localStorage.getItem('aimeasy_cached_regulations');
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length) {
        cachedRegulations = parsed;
      }
    }
  } catch (e) {}

  async function regulations() {
    const supabase = window.__AIMEASY_SUPABASE__;
    if (!supabase) return cachedRegulations;
    try {
      const { data } = await supabase
        .from('regulations')
        .select('regulation_name, regulation_code, status')
        .order('created_at', { ascending: true });
      const list = (data || [])
        .filter((r) => {
          const status = String(r?.status || '').trim().toLowerCase();
          return !status || status === 'active';
        })
        .map((r) => String(r.regulation_code || r.regulation_name || '').trim().toUpperCase())
        .filter(Boolean);
      cachedRegulations = list;
      localStorage.setItem('aimeasy_cached_regulations', JSON.stringify(list));
      localStorage.setItem('edusync_regulations', JSON.stringify(list));
    } catch (e) {
      console.warn('Failed to fetch regulations from Supabase:', e);
    }
    return cachedRegulations;
  }

  async function universities() {
    const localRows = uniqueByName([...DEFAULT_UNIVERSITIES, ...read('edusync_universities', [])]);
    const supabase = window.__AIMEASY_SUPABASE__;
    if (!supabase) return localRows;
    try {
      const { data } = await supabase
        .from('universities')
        .select('id, name, code, state, status')
        .order('name', { ascending: true });
      const rows = uniqueByName([...DEFAULT_UNIVERSITIES, ...(data || []), ...read('edusync_universities', [])]);
      localStorage.setItem('edusync_universities', JSON.stringify(rows));
      return rows;
    } catch (e) {
      console.warn('Failed to fetch universities from Supabase:', e);
      return localRows;
    }
  }

  async function refreshRegulationUI() {
    // Re-render admin regulation manager + dropdowns (if present)
    try {
      if (window.APP?.adminType) {
        installRegulationManager?.();
      }
      await updateRegulationDropdowns?.();
      await updateUniversityDropdowns?.();
      await renderRegulationList?.();
      window.aiiensRefreshActiveAdminSurfaces?.();
    } catch (e) {
      // ignore
    }
  }



  async function updateRegulationDropdowns(root = document) {
    const regs = await regulations();
    root.querySelectorAll('select').forEach((select) => {

      const id = (select.id || '').toLowerCase();
      const label = (select.closest('.input-group')?.querySelector('label,.v10-label')?.textContent || '').toLowerCase();
      const onchange = select.getAttribute('onchange') || '';
      if (!id.includes('reg') && !label.includes('regulation') && !onchange.includes('reg')) return;
      const current = select.value;
      const first = onchange.includes('Filter') || onchange.includes('filter') ? 'All Regulations' : 'Select Regulation';
      select.innerHTML = `<option value="">${first}</option>` + regs.map((reg) => `<option value="${esc(reg)}"${current === reg ? ' selected' : ''}>${esc(reg)}</option>`).join('');
    });
  }
  window.aimeasyUpdateRegulationDropdowns = updateRegulationDropdowns;

  async function updateUniversityDropdowns(root = document) {
    const rows = await universities();
    root.querySelectorAll('select').forEach((select) => {
      const id = (select.id || '').toLowerCase();
      const label = (select.closest('.input-group')?.querySelector('label,.v10-label')?.textContent || '').toLowerCase();
      const onchange = select.getAttribute('onchange') || '';
      if (!id.includes('uni') && !label.includes('university') && !onchange.toLowerCase().includes('uni')) return;
      const current = select.value;
      const first = onchange.includes('Filter') || onchange.includes('filter') ? 'All Universities' : 'Select University';
      select.innerHTML = `<option value="">${first}</option>` + rows.map((row) => {
        const value = row.name || row.code;
        return `<option value="${esc(value)}"${current === value ? ' selected' : ''}>${esc(row.name || row.code)}</option>`;
      }).join('');
    });
    if (root === document && document.getElementById('university-list')) {
      window.aiiensRenderUniversities?.();
    }
  }
  window.aiiensUpdateUniversityDropdowns = updateUniversityDropdowns;

  async function installRegulationManager() {
    const content = document.getElementById('admin-content');
    if (!content || document.getElementById('aimeasy-regulation-manager')) return;
    const grid = content.querySelector('.admin-manage-grid') || content.querySelector('div[style*="grid-template-columns"]');
    if (!grid) return;
    const regs = await regulations();
    grid.insertAdjacentHTML('beforeend', `

      <div class="card" id="aimeasy-regulation-manager">
        <h3 style="margin-bottom:1rem;">Regulation Management</h3>
        <p style="font-size:0.82rem;color:var(--text2);margin-bottom:1rem;">Created regulations are the only options shown to Sub Admin, Creator, and Student filters.</p>
        <div class="input-group">
          <label>New Regulation</label>
          <div style="display:flex;gap:8px;">
            <input class="input" id="aimeasy-reg-name" placeholder="e.g. R24">
            <button class="btn btn-primary btn-sm" onclick="aimeasyAddRegulation()">Add</button>
          </div>
        </div>
        <div style="margin-top:0.8rem;">
          ${regs.length ? regs.map((reg, index) => `
            <div style="display:flex;align-items:center;gap:8px;padding:9px 12px;border:1px solid var(--border);border-radius:var(--radius-sm);margin-bottom:5px;font-size:0.85rem;">
              <span style="flex:1;font-weight:600;">${esc(reg)}</span>
              <span class="badge badge-green">Live</span>
              <button class="btn btn-ghost btn-sm" onclick="aimeasyEditRegulation(${index})">Edit</button>
              <button class="btn btn-danger btn-sm" onclick="aimeasyDeleteRegulation(${index})">Delete</button>
            </div>`).join('') : '<div style="font-size:0.82rem;color:var(--text3);padding:8px 0;">No regulations created yet.</div>'}
        </div>
      </div>`);
    await renderRegulationList();
  }

  async function renderRegulationList() {
    const list = document.getElementById('aimeasy-regulation-list');
    if (!list) return;
    const regs = await regulations();
    list.innerHTML = regs.length ? regs.map((reg, index) => `
      <div class="v10-item regulation-row">
        <div class="v10-item-body"><div class="v10-item-title">${esc(reg)}</div></div>
        <span class="badge badge-green">Live</span>
        <button class="btn btn-ghost btn-sm" onclick="aimeasyEditRegulation(${index})">Edit</button>
        <button class="btn btn-danger btn-sm" onclick="aimeasyDeleteRegulation(${index})">Delete</button>
      </div>`).join('') : '<div class="empty-state-card">No regulations created yet.</div>';
  }

  window.aimeasyAddRegulation = async function aimeasyAddRegulation() {
    const input = document.getElementById('aimeasy-reg-name');
    const reg = input?.value.trim().toUpperCase();
    if (!reg) {
      showToast('Enter regulation', 'red');
      return;
    }

    const supabase = window.__AIMEASY_SUPABASE__;
    if (!supabase) {
      cachedRegulations = [...new Set([...cachedRegulations, reg])];
      localStorage.setItem('aimeasy_cached_regulations', JSON.stringify(cachedRegulations));
      localStorage.setItem('edusync_regulations', JSON.stringify(cachedRegulations));
      showToast('Regulation saved.', 'green');
      await refreshRegulationUI();
      return;
    }

    // Check existence by regulation_code/name (case-insensitive match in UI)
    const { data: existing } = await supabase
      .from('regulations')
      .select('id, regulation_name, regulation_code')
      .or(`regulation_code.eq.${reg},regulation_name.eq.${reg}`);

    if (existing?.length) {
      showToast('Regulation already exists', 'amber');
      return;
    }

    let authUser = null;
    try {
      authUser = supabase.auth?.getUser ? (await supabase.auth.getUser())?.data?.user : null;
    } catch (e) {
      authUser = null;
    }
    const appUser = window.APP?.user || {};
    const createdBy = String(authUser?.id || authUser?.email || appUser.email || appUser.name || 'admin').trim() || 'admin';
    const regulationPayload = {
      regulation_name: reg,
      regulation_code: reg,
      university: appUser.university || appUser.university_name || 'JNTUK',
      status: 'active',
      created_by: createdBy,
    };
    const { error: insErr } = await supabase
      .from('regulations')
      .insert([regulationPayload]);

    if (insErr) {
      showToast(insErr.message || 'Failed to create regulation', 'red');
      return;
    }

    showToast('Regulation saved to Supabase.', 'green');
    await refreshRegulationUI();
  };



  window.aimeasyEditRegulation = async function aimeasyEditRegulation(index) {
    const regs = await regulations();
    const oldReg = regs[index];
    const next = prompt('Edit regulation:', oldReg);
    if (!next?.trim()) return;
    const updated = next.trim().toUpperCase();

    const supabase = window.__AIMEASY_SUPABASE__;
    if (!supabase) {
      cachedRegulations = regs.map((item, itemIndex) => itemIndex === index ? updated : item);
      localStorage.setItem('aimeasy_cached_regulations', JSON.stringify(cachedRegulations));
      localStorage.setItem('edusync_regulations', JSON.stringify(cachedRegulations));
      showToast('Regulation updated.', 'green');
      await refreshRegulationUI();
      return;
    }

    const { data: rows } = await supabase
      .from('regulations')
      .select('id')
      .or(`regulation_code.eq.${oldReg},regulation_name.eq.${oldReg}`);

    const id = rows?.[0]?.id;
    if (!id) {
      showToast('Regulation not found in DB', 'red');
      return;
    }

    const { error: upErr } = await supabase
      .from('regulations')
      .update({
        regulation_name: updated,
        regulation_code: updated,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (upErr) {
      showToast(upErr.message || 'Failed to update regulation', 'red');
      return;
    }

    showToast('Regulation updated (Supabase).', 'green');
    await refreshRegulationUI();
  };



  window.aimeasyDeleteRegulation = async function aimeasyDeleteRegulation(index) {
    const regs = await regulations();
    if (!confirm(`Delete "${regs[index]}"?`)) return;

    const supabase = window.__AIMEASY_SUPABASE__;
    if (!supabase) {
      cachedRegulations = regs.filter((_, itemIndex) => itemIndex !== index);
      localStorage.setItem('aimeasy_cached_regulations', JSON.stringify(cachedRegulations));
      localStorage.setItem('edusync_regulations', JSON.stringify(cachedRegulations));
      showToast('Regulation deleted.', 'red');
      await refreshRegulationUI();
      return;
    }

    const delVal = regs[index];
    const { data: rows } = await supabase
      .from('regulations')
      .select('id')
      .or(`regulation_code.eq.${delVal},regulation_name.eq.${delVal}`);

    const id = rows?.[0]?.id;
    if (!id) {
      showToast('Regulation not found in DB', 'red');
      return;
    }

    const { error: delErr } = await supabase.from('regulations').delete().eq('id', id);
    if (delErr) {
      showToast(delErr.message || 'Failed to delete regulation', 'red');
      return;
    }

    showToast('Regulation deleted (Supabase).', 'red');
    await refreshRegulationUI();
  };



  async function statsLiveFromSupabase(created_by_subadmin_id = null) {
    const supabase = window.__AIMEASY_SUPABASE__;
    if (!supabase) return {
      students: 0,
      users: 0,
      subjects: 0,
      branches: 0,
      semesters: 0,
      units: 0,
      topics: 0,
      videos: 0,
      notes: 0,
      pyqs: 0,
      iqs: 0,
      totalRegulations: 0,
      recentRegulations: []
    };

    if (created_by_subadmin_id) {
      try {
        const { data: mySubjects, error: subjectsErr } = await supabase
          .from('subjects')
          .select('id, branch, semester')
          .eq('created_by', created_by_subadmin_id);

        if (subjectsErr) throw subjectsErr;

        const subjectIds = (mySubjects || []).map(s => s.id);
        const subjectsCount = subjectIds.length;

        if (subjectsCount === 0) {
          return {
            students: 0,
            users: 0,
            creators: 0,
            subjects: 0,
            branches: 0,
            semesters: 0,
            units: 0,
            topics: 0,
            totalRegulations: 0,
            recentRegulations: [],
            videos: 0,
            notes: 0,
            pyqs: 0,
            iqs: 0
          };
        }

        const uniqueBranches = new Set(mySubjects.map(s => s.branch).filter(Boolean)).size;
        const uniqueSemesters = new Set(mySubjects.map(s => s.semester).filter(Boolean)).size;

        const { count: unitCount, error: unitsErr } = await supabase
          .from('units')
          .select('*', { count: 'exact', head: true })
          .in('subject_id', subjectIds);
        if (unitsErr) throw unitsErr;

        const { data: myTopics, error: topicsErr } = await supabase
          .from('topics')
          .select('id')
          .in('subject_id', subjectIds);
        if (topicsErr) throw topicsErr;

        const topicIds = (myTopics || []).map(t => t.id);
        const topicsCount = topicIds.length;

        let topicVideosCount = 0;
        if (topicIds.length > 0) {
          const { count, error: videosErr } = await supabase
            .from('topic_videos')
            .select('*', { count: 'exact', head: true })
            .in('topic_id', topicIds);
          if (videosErr) throw videosErr;
          topicVideosCount = count || 0;
        }

        const countContent = async (type) => {
          const { count, error } = await supabase
            .from('content_items')
            .select('*', { count: 'exact', head: true })
            .eq('content_type', type)
            .eq('created_by', created_by_subadmin_id);
          if (error) throw error;
          return Number(count || 0);
        };

        const [contentVideoCount, noteCount, pyqCount, iqCount] = await Promise.all([
          countContent('video'),
          countContent('note'),
          countContent('pyq'),
          countContent('iq')
        ]);

        return {
          students: 0,
          users: 0,
          creators: 0,
          subjects: subjectsCount,
          branches: uniqueBranches,
          semesters: uniqueSemesters,
          units: Number(unitCount || 0),
          topics: topicsCount,
          totalRegulations: 0,
          recentRegulations: [],
          videos: topicVideosCount + contentVideoCount,
          notes: noteCount,
          pyqs: pyqCount,
          iqs: iqCount
        };
      } catch (e) {
        console.warn('SubAdmin stats fetch failed:', e);
        return {
          students: 0,
          users: 0,
          creators: 0,
          subjects: 0,
          branches: 0,
          semesters: 0,
          units: 0,
          topics: 0,
          totalRegulations: 0,
          recentRegulations: [],
          videos: 0,
          notes: 0,
          pyqs: 0,
          iqs: 0
        };
      }
    }

    const { data: dashboardCounts, error: dashboardCountsError } = await supabase.rpc('get_dashboard_counts');
    if (dashboardCountsError) {
      console.warn('get_dashboard_counts failed:', dashboardCountsError.message);
    }
    const counts = Array.isArray(dashboardCounts) ? dashboardCounts[0] || {} : dashboardCounts || {};
    const countTable = async (table, apply) => {
      try {
        let query = supabase.from(table).select('*', { count: 'exact', head: true });
        if (typeof apply === 'function') query = apply(query);
        const { count, error } = await query;
        if (error) {
          console.warn(`${table} count failed:`, error.message);
          return 0;
        }
        return Number(count || 0);
      } catch (e) {
        console.warn(`${table} count failed:`, e?.message || e);
        return 0;
      }
    };
    const distinctSubjectCount = async (column) => {
      try {
        const { data, error } = await supabase.from('subjects').select(column);
        if (error) return 0;
        return new Set((data || []).map(row => row?.[column]).filter(Boolean)).size;
      } catch (e) {
        return 0;
      }
    };

    // Regulations from public.regulations
    const { count: regsCount } = await supabase
      .from('regulations')
      .select('*', { count: 'exact', head: true });

    const { data: recentRegRows } = await supabase
      .from('regulations')
      .select('id, regulation_name, regulation_code, created_at')
      .order('created_at', { ascending: false })
      .limit(5);
    const [
      profileCount,
      roleProfileCount,
      subjectCount,
      branchCount,
      branchNameCount,
      semesterCount,
      unitCount,
      topicCount,
      topicVideoCount,
      contentVideoCount,
      noteCount,
      pyqCount,
      iqCount
    ] = await Promise.all([
      countTable('profiles'),
      countTable('profiles'),
      countTable('subjects'),
      countTable('branches'),
      distinctSubjectCount('branch'),
      distinctSubjectCount('semester'),
      countTable('units'),
      countTable('topics'),
      countTable('topic_videos'),
      countTable('content_items', q => q.eq('content_type', 'video')),
      countTable('content_items', q => q.eq('content_type', 'note')),
      countTable('content_items', q => q.eq('content_type', 'pyq')),
      countTable('content_items', q => q.eq('content_type', 'iq'))
    ]);
    const students = Number(counts.students || 0);
    const creators = Number(counts.creators || 0);
    const users = Number(counts.users || roleProfileCount || profileCount || students + creators || 0);

    return {
      students,
      users,
      creators,
      subjects: Number(counts.subjects || subjectCount || 0),
      branches: Number(counts.branches || branchCount || branchNameCount || 0),
      semesters: Number(counts.semesters || semesterCount || 0),
      units: unitCount,
      topics: topicCount,
      totalRegulations: Number(counts.regulations || regsCount || 0),
      recentRegulations: (recentRegRows || []).map(r => String(r.regulation_name || '').trim() || String(r.regulation_code || '').trim()).filter(Boolean),
      videos: topicVideoCount + contentVideoCount,
      notes: noteCount,
      pyqs: pyqCount,
      iqs: iqCount
    };
  }


  function statCards(items) {
    return items.map(([label, value, color]) => `
      <div class="admin-stat-card">
        <div class="admin-stat-accent" style="background:${color};"></div>
        <div style="font-size:2.3rem;font-weight:800;color:${color};">${value}</div>
        <div style="font-size:0.88rem;font-weight:600;margin-top:4px;">${label}</div>
        <div style="font-size:0.75rem;color:var(--text3);margin-top:4px;">Real records only</div>
      </div>`).join('');
  }

  async function renderAdminDashboardLive() {
    const content = document.getElementById('admin-content');
    if (!content) return;

    content.innerHTML = `
      <div style="padding:2rem;max-width:1100px;margin:0 auto;width:100%;">
        <div style="margin-bottom:1.6rem;">
          <h2 style="font-size:1.5rem;font-weight:800;letter-spacing:-0.02em;margin-bottom:4px;">Admin Dashboard</h2>
          <p style="font-size:0.84rem;color:var(--text3);">Loading live metrics from Supabase...</p>
        </div>
      </div>`;

    const s = await statsLiveFromSupabase();

    content.innerHTML = `
      <div style="padding:2rem;max-width:1100px;margin:0 auto;width:100%;">
        <div style="margin-bottom:1.6rem;">
          <h2 style="font-size:1.5rem;font-weight:800;letter-spacing:-0.02em;margin-bottom:4px;">Admin Dashboard</h2>
          <p style="font-size:0.84rem;color:var(--text3);">Supabase is the only source of truth.</p>
        </div>
        <div class="admin-grid" style="margin-bottom:2rem;">
          ${statCards([
            ['Total Students', s.students, 'var(--primary)'],
            ['Total Users', s.users, 'var(--green)'],
            ['Total Content Creators', s.creators, 'var(--teal)'],
            ['Total Subjects', s.subjects, 'var(--lavender)'],
            ['Total Branches', s.branches, 'var(--blue)'],
            ['Total Semesters', s.semesters, 'var(--red)'],
            ['Total Units', s.units, 'var(--teal)'],
            ['Total Topics', s.topics, 'var(--primary)'],
            ['Total Videos', s.videos, 'var(--blue)'],
            ['Total Notes', s.notes, 'var(--amber)'],
            ['Total PYQs', s.pyqs, 'var(--green)'],
            ['Total Regulations', s.totalRegulations, 'var(--amber)'],
          ])}
        </div>
      </div>`;
  }


  async function renderSubAdminDashboardLive() {
    const content = document.getElementById('sa-content');
    if (!content) return;
    const sa = APP.subAdminData || {};
    const s = await statsLiveFromSupabase(sa.username);
    content.innerHTML = `
      <div style="padding:2rem;max-width:1100px;margin:0 auto;width:100%;">
        <div style="margin-bottom:1.6rem;">
          <h2 style="font-size:1.4rem;font-weight:800;letter-spacing:-0.02em;margin-bottom:4px;">Sub Admin Dashboard</h2>
          <p style="font-size:0.82rem;color:var(--text3);">${esc(sa.branch || 'Content Management')}</p>
        </div>
        <div class="admin-grid" style="margin-bottom:1.6rem;">
          ${statCards([
            ['Total Subjects', s.subjects, 'var(--primary)'],
            ['Total Units', s.units, 'var(--teal)'],
            ['Total Topics', s.topics, 'var(--lavender)'],
            ['Total Videos', s.videos, 'var(--blue)'],
            ['Total Notes', s.notes, 'var(--amber)'],
            ['Total PYQs', s.pyqs, 'var(--green)']
          ])}
        </div>
      </div>`;
  }

  function skillUpComingSoon() {
    const content = document.getElementById('sa-content');
    if (!content) return;
    content.innerHTML = `
      <div style="padding:2rem;max-width:720px;margin:0 auto;width:100%;">
        <div class="card" style="text-align:center;padding:2.2rem;">
          <div style="width:46px;height:46px;border-radius:12px;background:var(--primary-light);color:var(--primary);display:inline-flex;align-items:center;justify-content:center;font-weight:800;margin-bottom:1rem;">SU</div>
          <h2 style="font-size:1.25rem;font-weight:800;margin-bottom:6px;">Skill Up</h2>
          <p style="font-size:0.9rem;color:var(--text2);">Coming Soon</p>
        </div>
      </div>`;
  }

  window.adminNavigateBack = function adminNavigateBack() {
    const isDashboardActive = document.getElementById('admin-nav-dashboard')?.classList.contains('active');
    if (isDashboardActive) {
      if (typeof adminLogout === 'function') {
        adminLogout();
      } else {
        window.aimeasySafeBack('/landing');
      }
    } else {
      switchAdminSection('dashboard');
    }
  };

  window.subAdminNavigateBack = function subAdminNavigateBack() {
    if (window._v10SASubjId && window._v10SASubj && typeof v10SAUnitsPage === 'function') {
      window._v10SASubjId = null;
      window._v10SAUnitId = null;
      v10SAUnitsPage(window._v10SASubj);
      return;
    }
    if (window._v10SASubj && typeof v10SASubjects === 'function') {
      window._v10SASubj = null;
      v10SASubjects();
      return;
    }
    const isDashboardActive = document.getElementById('sa-nav-dashboard')?.classList.contains('active');
    if (isDashboardActive) {
      if (typeof subAdminBack === 'function') {
        subAdminBack();
      } else {
        window.aimeasySafeBack('/landing');
      }
    } else {
      switchSASection('dashboard');
    }
  };

  window.creatorNavigateBack = function creatorNavigateBack() {
    if (window._crSelectedUnit && typeof renderCRAddContent === 'function') {
      window._crSelectedUnit = null;
      renderCRAddContent();
      return;
    }
    if (window._crSelectedSubj && typeof renderCRAddContent === 'function') {
      window._crSelectedSubj = null;
      renderCRAddContent();
      return;
    }
    const isDashboardActive = document.getElementById('cr-nav-dashboard')?.classList.contains('active');
    if (isDashboardActive) {
      if (typeof creatorLogout === 'function') {
        creatorLogout();
      } else {
        window.aimeasySafeBack('/landing');
      }
    } else {
      switchCRSection('dashboard');
    }
  };

  function addMenuIcons() {
    const paths = {
      dashboard: 'M3 13h8V3H3v10zm10 8h8V3h-8v18zM3 21h8v-6H3v6z',
      create: 'M12 5v14M5 12h14',
      subjects: 'M4 19.5V5a2 2 0 0 1 2-2h12v18H6a2 2 0 0 1-2-1.5z',
      approvals: 'M20 6 9 17l-5-5',
      creatorview: 'M12 3v18M3 12h18',
      skillup: 'M13 2 3 14h8l-1 8 11-14h-8l1-6z',
      choosing: 'M12 2l7 19-7-4-7 4 7-19z',
      addcontent: 'M12 5v14M5 12h14',
      view: 'M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z'
    };
    document.querySelectorAll('.admin-nav-item[id]').forEach((item) => {
      const span = item.querySelector('span:first-child');
      if (!span || span.querySelector('svg')) return;
      const key = item.id.replace(/^(admin|sa|cr)-nav-/, '');
      span.innerHTML = `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${paths[key] || 'M4 6h16M4 12h16M4 18h16'}"></path></svg>`;
      span.style.cssText = 'display:inline-flex;align-items:center;justify-content:center;width:20px;';
    });
  }

  function replaceUnitButtons() {
    document.querySelectorAll('.v10-unit-card,.adm-unit-card').forEach((card) => {
      if (card.querySelector('.aimeasy-unit-dots')) return;
      const buttons = Array.from(card.querySelectorAll('button')).filter((button) => /edit|delete|del|✏|🗑/i.test((button.textContent || '') + (button.title || '')));
      if (buttons.length < 2) return;
      const edit = buttons.find((button) => /edit|✏/i.test((button.textContent || '') + (button.title || '')));
      const del = buttons.find((button) => /delete|del|🗑/i.test((button.textContent || '') + (button.title || '')));
      if (!edit || !del) return;
      const editCall = edit.getAttribute('onclick') || '';
      const delCall = del.getAttribute('onclick') || '';
      const parent = edit.parentElement;
      buttons.forEach((button) => button.remove());
      parent.insertAdjacentHTML('beforeend', `<button class="v10-dot-btn aimeasy-unit-dots" title="Options" onclick="aimeasyOpenUnitMenu(this,\`${editCall.replace(/`/g, '\\`')}\`,\`${delCall.replace(/`/g, '\\`')}\`)">⋮</button>`);
    });
  }

  window.aimeasyOpenUnitMenu = function aimeasyOpenUnitMenu(button, editCall, delCall) {
    window.event?.stopPropagation();
    document.querySelectorAll('.aimeasy-unit-menu').forEach((menu) => menu.remove());
    button.parentElement.insertAdjacentHTML('beforeend', `<div class="adm-popup aimeasy-unit-menu"><button class="adm-popup-item" onclick="${editCall}">Edit</button><button class="adm-popup-item red" onclick="${delCall}">Delete</button></div>`);
  };

  function saveUserProfile(user) {
    const users = read('aiiens_users', []);
    const key = user.id || user.googleId || user.email;
    const index = users.findIndex((item) => (item.id || item.googleId || item.email) === key);
    if (index >= 0) users[index] = { ...users[index], ...user };
    else users.push(user);
    write('aiiens_users', users);
    localStorage.setItem('aiiens_session_user', JSON.stringify(user));
    if (user.googleId || user.id) localStorage.setItem('aiiens_user_' + (user.googleId || user.id), JSON.stringify(user));
  }

  localStorage.removeItem('aimeasy_oauth_role');
  localStorage.removeItem('aimeasy_active_role');

  if (!window.submitAdminLogin?.isPatched) {
    const originalSubmitAdminLogin = window.submitAdminLogin;
    window.submitAdminLogin = function submitAdminLoginPersistent() {
      const userid = document.getElementById('admin-userid')?.value.trim();
      const password = document.getElementById('admin-password')?.value.trim();
      const type = typeof adminLoginType !== 'undefined' ? adminLoginType : 'admin';
      originalSubmitAdminLogin?.();
      if (type === 'admin') {
        localStorage.setItem('aiiens_admin_session', JSON.stringify({ type: 'admin', username: userid }));
      }
      if (type !== 'admin') {
        const subAdmin = read('aiiens_subadmins', []).find((item) => item.username === userid && item.password === password);
        if (subAdmin) {
          localStorage.setItem('aiiens_admin_session', JSON.stringify({ type: subAdmin.role === 'content_creator' ? 'content_creator' : 'subadmin', data: subAdmin }));
        }
      }
    };
    window.submitAdminLogin.isPatched = true;
  }

  if (!window.adminLogout?.isPatched) {
    const originalAdminLogout = window.adminLogout;
    window.adminLogout = function adminLogoutFixed() {
      localStorage.removeItem('aiiens_admin_session');
      if (window.APP) {
        window.APP.adminType = null;
        window.APP.subAdminData = null;
        window.APP.session = false;
      }
      window.__aimeasyPreserveRoleRoute = '';
      originalAdminLogout?.();
    };
    window.adminLogout.isPatched = true;
  }

  if (!window.subAdminBack?.isPatched) {
    const originalSubAdminBack = window.subAdminBack;
    window.subAdminBack = function subAdminBackPreserveSession() {
      // Back button must never clear session.
      console.log('[NAVIGATION] Back button pressed');
      console.log('[AUTH] Session preserved');
      originalSubAdminBack?.();
    };
    window.subAdminBack.isPatched = true;
  }

  if (!window.creatorLogout?.isPatched) {
    const originalCreatorLogout = window.creatorLogout;
    window.creatorLogout = async function creatorLogoutFixed() {
      localStorage.removeItem('aiiens_admin_session');
      if (window.APP) {
        window.APP.adminType = null;
        window.APP.subAdminData = null;
        window.APP.session = false;
      }
      window.__aimeasyPreserveRoleRoute = '';
      const supabase = window.__AIMEASY_SUPABASE__;
      if (supabase) {
        try {
          await supabase.auth.signOut();
        } catch (e) {
          console.warn('Supabase creator logout signout error:', e);
        }
      }
      originalCreatorLogout?.();
    };
    window.creatorLogout.isPatched = true;
  }

  let isSyncing = false;
  window.aimeasySyncAndRefresh = async function aimeasySyncAndRefresh(customRenderFn) {
    if (isSyncing) return;
    if (typeof window.hydrateLegacyState === 'function') {
      isSyncing = true;
      try {
        await window.hydrateLegacyState();
        if (typeof customRenderFn === 'function') {
          customRenderFn();
        } else {
          // Re-render active views
          const activeScreen = document.querySelector('.screen.active')?.id;
          if (activeScreen === 'screen-app') {
            const activePage = [...document.querySelectorAll('[id^="page-"]')].find(p => p.style.display !== 'none')?.id?.replace('page-', '');
            if (activePage === 'dashboard') {
              if (typeof updateStudentDashboardMetrics === 'function') updateStudentDashboardMetrics();
            } else if (activePage === 'subjects') {
              if (typeof renderSubjects === 'function') renderSubjects();
            } else if (activePage === 'units') {
              if (window.APP?.currentSubject && typeof renderUnits === 'function') renderUnits(window.APP.currentSubject);
            } else if (activePage === 'unit-content') {
              if (window.APP?.currentSubject && window.APP?.currentUnit) {
                const subjId = window.APP.currentSubject.id || window.APP.currentSubject.rawId || window.APP.currentSubject;
                const unitNum = window.APP.currentUnit;
                if (typeof renderVideoList === 'function') renderVideoList(subjId, unitNum);
                if (typeof renderNotes === 'function') renderNotes(subjId, unitNum);
                if (typeof renderPYQ === 'function') renderPYQ(null, subjId, unitNum);
                if (typeof renderIQ === 'function') renderIQ(subjId, unitNum);
              }
            }
          } else if (activeScreen === 'screen-admin') {
            const activeAdminTab = document.querySelector('.admin-nav-item.active')?.id?.replace('admin-nav-', '');
            if (typeof window.aiiensRefreshActiveAdminSurfaces === 'function') {
              window.aiiensRefreshActiveAdminSurfaces();
            } else if (activeAdminTab === 'dashboard') {
              if (typeof renderAdminDashboardLive === 'function') renderAdminDashboardLive();
            } else if (activeAdminTab === 'subjects') {
              if (typeof renderAdminSubjectCrud === 'function') renderAdminSubjectCrud();
            }
          } else if (activeScreen === 'screen-subadmin') {
            const activeSaTab = document.querySelector('.admin-nav-item.active')?.id?.replace('sa-nav-', '');
            if (typeof window.aiiensRefreshActiveAdminSurfaces === 'function') {
              window.aiiensRefreshActiveAdminSurfaces();
            } else if (activeSaTab === 'dashboard') {
              if (typeof renderSubAdminDashboardLive === 'function') renderSubAdminDashboardLive();
            } else if (activeSaTab === 'subjects' || activeSaTab === 'curriculum') {
              if (typeof v10SASubjects === 'function') v10SASubjects();
            }
          } else if (activeScreen === 'screen-creator') {
            const activeCrTab = document.querySelector('.admin-nav-item.active')?.id?.replace('cr-nav-', '');
            if (activeCrTab === 'dashboard') {
              if (typeof renderCRDashboard === 'function') renderCRDashboard();
            } else if (activeCrTab === 'choosing' || activeCrTab === 'addcontent') {
              if (typeof renderCRAddContent === 'function') renderCRAddContent();
            }
          }
        }
      } catch (e) {
        console.warn('[AIIENS Edu sync] Sync failed:', e);
      } finally {
        isSyncing = false;
      }
    }
  };

  if (!window.renderAdminSection?.isPatched) {
    const originalRenderAdminSection = window.renderAdminSection;
    window.renderAdminSection = function renderAdminSectionFixed(section) {
      if (section === 'dashboard') {
        renderAdminDashboardLive();
        return;
      }
      originalRenderAdminSection?.(section);
      if (section === 'create') installRegulationManager();
      updateRegulationDropdowns();
      updateUniversityDropdowns();
      addMenuIcons();
    };
    window.renderAdminSection.isPatched = true;
  }

  if (!window.switchSASection?.isPatched) {
    const originalSwitchSASection = window.switchSASection;
    window.switchSASection = function switchSASectionFixed(section) {
      const SA_ROUTE_TO_SECTION = {
        'create-subject': 'subjects',
        'content': 'view',
        'manage-content': 'view',
        'approvals': 'urls',
        'url-approvals': 'urls'
      };
      const mappedSection = SA_ROUTE_TO_SECTION[section] || section;
      if (mappedSection === 'dashboard') {
        closeSASidebar?.();
        document.querySelectorAll('[id^="sa-nav-"]').forEach((el) => el.classList.remove('active'));
        document.getElementById('sa-nav-dashboard')?.classList.add('active');
        const title = document.getElementById('sa-topbar-title');
        if (title) title.textContent = 'Sub Admin Dashboard';
        renderSubAdminDashboardLive();
        addMenuIcons();
        if (window.location.hash !== '#/subadmin/dashboard') {
          window.location.hash = '#/subadmin/dashboard';
        }
        return;
      }
      if (mappedSection === 'skillup') {
        closeSASidebar?.();
        skillUpComingSoon();
        addMenuIcons();
        if (window.location.hash !== '#/subadmin/skillup') {
          window.location.hash = '#/subadmin/skillup';
        }
        return;
      }
      originalSwitchSASection?.(mappedSection);
      updateRegulationDropdowns();
      updateUniversityDropdowns();
      addMenuIcons();
      setTimeout(replaceUnitButtons, 0);
    };
    window.switchSASection.isPatched = true;
  }

  if (!window.switchAdminSection?.isPatched) {
    const originalSwitchAdminSection = window.switchAdminSection;
    window.switchAdminSection = function switchAdminSectionFixed(section) {
      const ADMIN_ROUTE_TO_SECTION = {
        'manage': 'create',
        'management': 'create',
        'create-management': 'create',
        'create-manage': 'create',
        'url-approvals': 'approvals',
        'urls': 'approvals'
      };
      const mappedSection = ADMIN_ROUTE_TO_SECTION[section] || section;
      if (originalSwitchAdminSection) {
        originalSwitchAdminSection(mappedSection);
      } else if (typeof switchAdminSection === 'function') {
        switchAdminSection(mappedSection);
      }
      updateRegulationDropdowns();
      updateUniversityDropdowns();
      addMenuIcons();
    };
    window.switchAdminSection.isPatched = true;
  }

  if (!window.switchCRSection?.isPatched) {
    const originalSwitchCRSection = window.switchCRSection;
    window.switchCRSection = function switchCRSectionFixed(section) {
      originalSwitchCRSection?.(section);
    };
    window.switchCRSection.isPatched = true;
  }

  ['v10SASubjects', 'v10SAUnitsPage', 'v10AdminSubjects', 'v10AdminOpenSubjectObj', 'v11AdminSubjectsPage', 'v11AdminUnitsPage', 'v11CreatorUnitsPage', 'renderCRChoosing', 'renderCRAddContent', 'renderSubjects'].forEach((name) => {
    const original = window[name];
    if (typeof original !== 'function' || original.isPatched) return;
    window[name] = function patchedRender(...args) {
      const result = original.apply(this, args);
      updateRegulationDropdowns();
      updateUniversityDropdowns();
      addMenuIcons();
      setTimeout(replaceUnitButtons, 0);
      return result;
    };
    window[name].isPatched = true;
  });

  if (!window.launchTeacherPortal?.isPatched) {
    const originalLaunchTeacherPortal = window.launchTeacherPortal;
    window.launchTeacherPortal = function launchTeacherPortalFixed(teacher) {
      if (teacher?.role === 'content_creator' || teacher?.role === 'creator' || teacher?.role === 'teacher' || APP.adminType === 'content_creator') {
        APP.adminType = 'content_creator';
        APP.subAdminData = {
          username: teacher?.name || 'Creator',
          branch: teacher?.branch || 'CSE',
          role: 'content_creator'
        };
        localStorage.setItem('aiiens_admin_session', JSON.stringify({
          type: 'content_creator',
          username: APP.subAdminData.username,
          data: APP.subAdminData
        }));
        launchCreatorScreen?.();
        return;
      }
      originalLaunchTeacherPortal?.(teacher);
    };
    window.launchTeacherPortal.isPatched = true;
  }

  if (!window.showScreen?.isPatched) {
    const originalShowScreen = window.showScreen;
    window.showScreen = function showScreenFixed(id, role) {
      if (id === 'screen-google-auth' && typeof window.syncGoogleAuthScreen === 'function') {
        window.syncGoogleAuthScreen();
      }
      if (id === 'screen-profile' && typeof window.aimeasyHydrateProfileDropdowns === 'function') {
        window.setTimeout(() => window.aimeasyHydrateProfileDropdowns(), 0);
      }
      const result = originalShowScreen?.(id, role);
      updateRegulationDropdowns();
      updateUniversityDropdowns();
      addMenuIcons();
      return result;
    };
    window.showScreen.isPatched = true;
  }

  document.addEventListener('click', (event) => {
    if (!event.target.closest('.aimeasy-unit-dots,.aimeasy-unit-menu')) {
      document.querySelectorAll('.aimeasy-unit-menu').forEach((menu) => menu.remove());
    }
  });

  if (!window.openAdminLogin?.isPatched) {
    const originalOpenAdminLogin = window.openAdminLogin;
    window.openAdminLogin = function openAdminLoginPersistent(type) {
      localStorage.removeItem('edusync_admin_session');
      if (window.APP) {
        window.APP.adminType = null;
        window.APP.subAdminData = null;
        window.APP.session = false;
      }
      window.__aimeasyPreserveRoleRoute = '';
      return originalOpenAdminLogin?.(type);
    };
    window.openAdminLogin.isPatched = true;
  }

  window.subAdminLogout = function subAdminLogout() {
    localStorage.removeItem('edusync_admin_session');
    if (window.APP) {
      window.APP.adminType = null;
      window.APP.subAdminData = null;
      window.APP.session = false;
    }
    window.__aimeasyPreserveRoleRoute = '';
    window.showScreen?.('screen-landing');
    window.history?.replaceState?.({ aimeasyPath: '/landing', aimeasyIndex: 0 }, '', '#/landing');
  };

  window.addEventListener('load', () => {
    document.title = 'AIIENS Edu - Smart AI Learning Ecosystem';
    const adminSession = read('edusync_admin_session', null);
    // Ensure async dropdown population runs without breaking render flow

    // Get current hash route to preserve it on load/reload
    const currentRoute = (window.location.hash || '').replace(/^#/, '');
    const isLanding = !currentRoute || currentRoute === '/' || currentRoute === '/landing' || currentRoute === '/intro';

    if (currentRoute && /^\/(admin|subadmin|creator)(\/|$)/.test(currentRoute)) {
      window.__aimeasyPreserveRoleRoute = currentRoute;
    }

    if (!isLanding && adminSession?.type) {
      window.__aimeasyPreserveRoleRoute = currentRoute;
      console.log('[SESSION RESTORE] Admin session detected; preserving role route without auto-launch', {
        currentRoute,
        adminSession,
      });
    }
    updateRegulationDropdowns();
    updateUniversityDropdowns();
    addMenuIcons();
  });

  // Edit handlers for sub-admin uploaded resources
  window.aimeasyEditNote = async function(id, subjectName, unitId) {
  if (window.event) window.event.preventDefault();
    const notes = JSON.parse(localStorage.getItem('edusync_admin_notes') || '[]');
    const note = notes.find(n => String(n.id) === String(id) || String(n.dbContentId) === String(id));
    if (!note) return;
    const newTitle = prompt('Edit Note Title:', note.title);
    if (newTitle === null) return;
    if (!newTitle.trim()) {
      showToast('Title cannot be empty', 'red');
      return;
    }
    const newLink = prompt('Edit Note Link / URL:', note.link || '');
    if (newLink === null) return;
    
    note.title = newTitle.trim();
    note.link = newLink.trim();
    const dbId = note.dbContentId || (String(note.id).startsWith('temp_') ? null : note.id);
    if (dbId) {
      await window.aimeasyUpdateContent?.(dbId, {
        title: note.title,
        url: note.link,
      });
    }
    localStorage.setItem('edusync_admin_notes', JSON.stringify(notes));
    showToast('Note updated successfully', 'green');
    
    if (typeof v10RefreshContentPane === 'function') await v10RefreshContentPane('notes', subjectName, unitId);
    else {
      const pane = document.getElementById('v10-notes-' + unitId);
      if (pane && typeof v10NotesForm === 'function') pane.innerHTML = v10NotesForm(subjectName, unitId);
    }
    window.aimeasySyncAndRefresh?.();
  };

  window.aimeasyEditPYQ = async function(id, subjectName, unitId) {
  if (window.event) window.event.preventDefault();
    const pyqs = JSON.parse(localStorage.getItem('edusync_admin_pyqs') || '[]');
    const pyq = pyqs.find(p => String(p.id) === String(id) || String(p.dbContentId) === String(id));
    if (!pyq) return;
    const newQuestion = prompt('Edit PYQ Question:', pyq.question);
    if (newQuestion === null) return;
    if (!newQuestion.trim()) {
      showToast('Question cannot be empty', 'red');
      return;
    }
    const newYear = prompt('Edit Exam Year:', pyq.year);
    if (newYear === null) return;
    const newCount = prompt('Edit Repeated Count:', pyq.count || '1');
    if (newCount === null) return;
    const newAnswer = prompt('Edit Answer/Explanation (optional):', pyq.answer || '');
    if (newAnswer === null) return;

    pyq.question = newQuestion.trim();
    pyq.year = newYear.trim();
    pyq.count = parseInt(newCount) || 1;
    pyq.answer = newAnswer.trim();
    const dbId = pyq.dbContentId || (String(pyq.id).startsWith('temp_') ? null : pyq.id);
    if (dbId) {
      await window.aimeasyUpdateContent?.(dbId, {
        title: pyq.question.slice(0, 80),
        body: pyq.question,
        metadata: {
          ...(pyq.metadata || {}),
          year: pyq.year,
          count: pyq.count,
          answer: pyq.answer,
          topicId: pyq.topicId,
        },
      });
    }
    
    localStorage.setItem('edusync_admin_pyqs', JSON.stringify(pyqs));
    showToast('PYQ updated successfully', 'green');
    
    if (typeof v10RefreshContentPane === 'function') await v10RefreshContentPane('pyq', subjectName, unitId);
    else {
      const pane = document.getElementById('v10-pyq-' + unitId);
      if (pane && typeof v10PYQForm === 'function') pane.innerHTML = v10PYQForm(subjectName, unitId);
    }
    window.aimeasySyncAndRefresh?.();
  };

  window.aimeasyEditIQ = async function(id, subjectName, unitId) {
  if (window.event) window.event.preventDefault();
    const iqs = JSON.parse(localStorage.getItem('edusync_admin_iqs') || '[]');
    const iq = iqs.find(q => String(q.id) === String(id) || String(q.dbContentId) === String(id));
    if (!iq) return;
    const newQuestion = prompt('Edit Important Question:', iq.question);
    if (newQuestion === null) return;
    if (!newQuestion.trim()) {
      showToast('Question cannot be empty', 'red');
      return;
    }
    const newPriority = prompt('Edit Priority (high / med / low):', iq.priority || 'med');
    if (newPriority === null) return;
    const newTags = prompt('Edit Tags (comma separated):', iq.tags || '');
    if (newTags === null) return;

    iq.question = newQuestion.trim();
    iq.priority = ['high', 'med', 'low'].includes(newPriority.trim().toLowerCase()) ? newPriority.trim().toLowerCase() : 'med';
    iq.tags = newTags.trim();
    const dbId = iq.dbContentId || (String(iq.id).startsWith('temp_') ? null : iq.id);
    if (dbId) {
      await window.aimeasyUpdateContent?.(dbId, {
        title: iq.question.slice(0, 80),
        body: iq.question,
        metadata: {
          ...(iq.metadata || {}),
          priority: iq.priority,
          tags: iq.tags,
          topicId: iq.topicId,
        },
      });
    }
    
    localStorage.setItem('edusync_admin_iqs', JSON.stringify(iqs));
    showToast('Question updated successfully', 'green');
    
    if (typeof v10RefreshContentPane === 'function') await v10RefreshContentPane('iq', subjectName, unitId);
    else {
      const pane = document.getElementById('v10-iq-' + unitId);
      if (pane && typeof v10IQForm === 'function') pane.innerHTML = v10IQForm(subjectName, unitId);
    }
    window.aimeasySyncAndRefresh?.();
  };

  // =========================================================================
  //  CENTRALIZED CRUD ENGINE HELPERS (CRITICAL REQUIREMENT 3)
  // =========================================================================
  window.createContent = async function(contentType, payload) {
    const supabase = window.__AIMEASY_SUPABASE__;
    if (!supabase) throw new Error('Supabase not configured');
    const activeBranch = payload.branch || (typeof getCurrentBranch === 'function' ? getCurrentBranch() : null);
    
    const row = {
      subject_id: payload.subjectId,
      unit_id: payload.unitId,
      content_type: contentType,
      title: payload.title || '',
      body: payload.body || '',
      url: payload.url || '',
      metadata: {
        ...(payload.metadata || {}),
        branch: activeBranch || null,
        topicId: payload.topicId || null,
      },
      created_by: payload.createdBy || 'subadmin',
    };

    const { data, error } = await supabase.from('content_items').insert(row).select().single();
    if (error) {
      console.error('[SUPABASE ERROR]', error);
      throw error;
    }
    return data;
  };

  window.updateContent = async function(id, patch) {
    const supabase = window.__AIMEASY_SUPABASE__;
    if (!supabase) throw new Error('Supabase not configured');
    
    const { data, error } = await supabase.from('content_items').update(patch).eq('id', id).select().single();
    if (error) {
      console.error('[SUPABASE ERROR]', error);
      throw error;
    }
    return data;
  };

  window.deleteContent = async function(id) {
    const supabase = window.__AIMEASY_SUPABASE__;
    if (!supabase) throw new Error('Supabase not configured');
    
    const { error } = await supabase.from('content_items').delete().eq('id', id);
    if (error) {
      console.error('[SUPABASE ERROR]', error);
      throw error;
    }
    return true;
  };

  // =========================================================================
  //  UUID-SAFE HELPER OVERRIDES (CRITICAL REQUIREMENT 2)
  // =========================================================================
  window.v10UnitTopics = function(unitId) {
    const subj = window._v10SASubj || {};
    const units = JSON.parse(localStorage.getItem('edusync_units_' + subj.id) || '[]');
    return (units.find(u => String(u.id) === String(unitId))?.topics || []);
  };

  window.v10TopicSelect = function(subjectName, unitId, selected = '', target = '') {
    const topics = window.v10UnitTopics(unitId);
    return `<select class="select v10-topic-select" id="v10-topic-${unitId}">
      <option value="">Select Topic</option>
      ${topics.map((t, i) => {
        const id = t.id || String(i + 1);
        const label = t.name || t.topicName || `Topic ${i + 1}`;
        return `<option value="${id}" data-title="${label.replace(/"/g, '&quot;')}"${String(selected) === String(id) ? ' selected' : ''}>${label}</option>`;
      }).join('')}
    </select>`.replace('<select ', `<select ${target ? `onchange="window.v10ApplyTopicSelection(this,'${target}','${unitId}')" ` : ''}`);
  };

  window.v10NotesForm = function(subjectName, unitId) {
    const notes = JSON.parse(localStorage.getItem('edusync_admin_notes') || '[]').filter(n => String(n.subject) === String(subjectName) && String(n.unit) === String(unitId));
    const s = v10EscapeJs(subjectName);
    return `<div class="v10-form"><p class="hint">Select an existing roadmap topic or type a new topic.</p>${v10TopicFieldsHTML(subjectName, unitId, 'notes')}<div class="input-group"><span class="v10-label">NOTE URL / FILE</span><input class="input" id="v10-nlink-${unitId}" placeholder="https://drive.google.com/..." type="url"></div><div class="input-group"><span class="v10-label">DESCRIPTION</span><textarea class="input" id="v10-ndesc-${unitId}" rows="3" style="resize:vertical;"></textarea></div><button class="v10-submit" onclick="window.v10UploadNote('${s}','${unitId}')">Save Note</button></div>${notes.length ? `<div class="v10-items"><div class="v10-items-head">Uploaded Notes (${notes.length})</div>${notes.map(n => `<div class="v10-item"><span>📄</span><div class="v10-item-body"><div class="v10-item-title">${n.topicName || n.title}</div><div class="v10-item-meta">${n.description || n.title || ''} · ${n.uploadedAt || ''}</div></div><button class="v10-del v10-edit-btn" onclick="window.aimeasyEditNote('${n.id}','${s}','${unitId}')" style="color:var(--primary);margin-right:4px;">Edit</button><button class="v10-del v10-del-btn" onclick="window.v10DeleteNote('${n.id}','${s}','${unitId}')">Delete</button></div>`).join('')}</div>` : ''}`;
  };

  window.v10PYQForm = function(subjectName, unitId) {
    const pyqs = JSON.parse(localStorage.getItem('edusync_admin_pyqs') || '[]').filter(p => String(p.subject) === String(subjectName) && String(p.unit) === String(unitId));
    const s = (subjectName || '').replace(/\\/g, '\\\\').replace(/'/g, "\\'");
    return `<div class="v10-form"><p class="hint">PYQs are linked to a roadmap topic.</p><div class="input-group"><span class="v10-label">TOPIC</span>${window.v10TopicSelect(subjectName, unitId)}</div><div class="v10-2col"><div class="input-group"><span class="v10-label">YEAR</span><input class="input" id="v10-pyqyr-${unitId}" type="number" min="2000" max="2099"></div><div class="input-group"><span class="v10-label">MARKS</span><input class="input" id="v10-pyqmarks-${unitId}" type="number" min="1"></div></div><div class="input-group"><span class="v10-label">QUESTION</span><textarea class="input" id="v10-pyqtxt-${unitId}" rows="3" style="resize:vertical;"></textarea></div><button class="v10-submit" onclick="window.v10UploadPYQ('${s}','${unitId}')">Save PYQ</button></div>${pyqs.length ? `<div class="v10-items"><div class="v10-items-head">PYQs (${pyqs.length})</div>${pyqs.map(p => `<div class="v10-item"><span>📝</span><div class="v10-item-body"><div class="v10-item-title">${p.question}</div><div class="v10-item-meta">${p.topicName || 'No topic'} · ${p.year || '-'} · ${p.marks || p.count || '-'} marks</div></div><button class="v10-del v10-edit-btn" onclick="window.aimeasyEditPYQ('${p.id}','${s}','${unitId}')" style="color:var(--primary);margin-right:4px;">Edit</button><button class="v10-del v10-del-btn" onclick="window.v10DeletePYQ('${p.id}','${s}','${unitId}')">Del</button></div>`).join('')}</div>` : ''}`;
  };

  window.v10IQForm = function(subjectName, unitId) {
    const iqs = JSON.parse(localStorage.getItem('edusync_admin_iqs') || '[]').filter(q => String(q.subject) === String(subjectName) && String(q.unit) === String(unitId));
    const s = (subjectName || '').replace(/\\/g, '\\\\').replace(/'/g, "\\'");
    return `<div class="v10-form"><p class="hint">Important questions are linked to a roadmap topic.</p><div class="input-group"><span class="v10-label">TOPIC</span>${window.v10TopicSelect(subjectName, unitId)}</div><div class="input-group"><span class="v10-label">QUESTION</span><textarea class="input" id="v10-iqtxt-${unitId}" rows="3" style="resize:vertical;"></textarea></div><div class="input-group"><span class="v10-label">PRIORITY</span><select class="select" id="v10-iqprio-${unitId}"><option value="high">High</option><option value="med" selected>Medium</option><option value="low">Low</option></select></div><button class="v10-submit" onclick="window.v10UploadIQ('${s}','${unitId}')">Save Important Question</button></div>${iqs.length ? `<div class="v10-items"><div class="v10-items-head">Important Questions (${iqs.length})</div>${iqs.map(q => `<div class="v10-item"><span>⭐</span><div class="v10-item-body"><div class="v10-item-title">${q.question}</div><div class="v10-item-meta">${q.topicName || 'No topic'} · ${q.priority || 'med'}</div></div><button class="v10-del v10-edit-btn" onclick="window.aimeasyEditIQ('${q.id}','${s}','${unitId}')" style="color:var(--primary);margin-right:4px;">Edit</button><button class="v10-del v10-del-btn" onclick="window.v10DeleteIQ('${q.id}','${s}','${unitId}')">Del</button></div>`).join('')}</div>` : ''}`;
  };

  window.v10MergeUnitContentRows = function(subjectName, unitId, notesRows = [], pyqRows = [], iqRows = []) {
    const branch = v10BranchForSubject(subjectName);
    function mergeByDbId(key, rows, mapRow) {
      const all = JSON.parse(localStorage.getItem(key) || '[]').filter(item => (
        String(item.subject) !== String(subjectName) || String(item.unit) !== String(unitId) || !item.dbContentId || 
        (typeof v10SameBranchContent === 'function' && !v10SameBranchContent(item, branch))
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
      uploadedAt: row.created_at ? new Date(row.created_at).toLocaleString() : '',
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
  };

  window.v10ReloadUnitRoadmapFromDb = async function(subjId, unitId, subject, unit) {
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
    const rm = roadmaps[subjId].find(r => String(r.unit) === String(unitId));
    if (rm) rm.topics = data.topics || [];
    else roadmaps[subjId].push({ unit: unitId, topics: data.topics || [] });
    localStorage.setItem('edusync_roadmaps', JSON.stringify(roadmaps));
    return units.find(u => String(u.id) === String(unitId)) || null;
  };

  // =========================================================================
  //  ROADMAP PERSISTENCE & ACTIONS (CRITICAL REQUIREMENT 4, 5, 6, 7, 8)
  // =========================================================================
  window.v10OpenRoadmapEditModalDb = function (subjId, unitId, topicId) {
    v11CloseAllPopups();
    const esc = window.v10Esc || ((s)=>String(s||''));
    const topics = JSON.parse(localStorage.getItem('edusync_units_' + subjId) || '[]')
      .find(u => String(u.id) === String(unitId))?.topics || [];
    const topic = topics.find(t => String(t.id) === String(topicId));
    if (!topic) { showToast('Topic not found', 'red'); return; }
    const videos = Array.isArray(topic.videos) ? topic.videos : [];
    const video = videos[0] || { url: '', description: '' };
    const url = video.url || topic.youtubeUrl || topic.url || '';
    const desc = video.description || topic.description || '';

    const modal = document.createElement('div');
    modal.className = 'v11-confirm-modal';
    modal.innerHTML = `
      <div class="v11-confirm-box" style="max-width: 500px;">
        <h3 style="font-size:1.1rem;margin-bottom:1rem;font-weight:700;color:var(--primary);">✏️ Edit Topic</h3>
        <div class="input-group" style="margin-bottom:12px;">
          <span class="v10-label">TOPIC NAME *</span>
          <input class="input" id="v11-edit-db-topic-name" value="${esc(topic.name || topic.topicName || '')}" placeholder="Topic Name" required />
        </div>
        <div class="input-group" style="margin-bottom:12px;">
          <span class="v10-label">VIDEO URL *</span>
          <input class="input" id="v11-edit-db-topic-url" value="${esc(url)}" placeholder="Video URL" required />
        </div>
        <div class="input-group" style="margin-bottom:16px;">
          <span class="v10-label">DESCRIPTION (OPTIONAL)</span>
          <textarea class="input" id="v11-edit-db-topic-desc" placeholder="Description..." rows="3" style="resize:vertical;">${esc(desc)}</textarea>
        </div>
        <div style="display:flex;gap:10px;justify-content:flex-end;">
          <button class="btn btn-ghost btn-sm" onclick="this.closest('.v11-confirm-modal').remove()">Cancel</button>
          <button class="btn btn-primary btn-sm" onclick="window.v10SaveRoadmapEditModalDb('${subjId}','${unitId}','${topicId}')">Save Changes</button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
  };

  window.v10SaveRoadmapEditModalDb = async function (subjId, unitId, topicId) {
    const name = document.getElementById('v11-edit-db-topic-name')?.value.trim();
    const url = document.getElementById('v11-edit-db-topic-url')?.value.trim();
    const desc = document.getElementById('v11-edit-db-topic-desc')?.value.trim() || '';

    if (!name) { showToast('Topic Name is required', 'red'); return; }
    if (!url) { showToast('Video URL is required', 'red'); return; }
    try {
      new URL(url);
    } catch (e) {
      showToast('Please enter a valid URL', 'red');
      return;
    }

    const supabase = window.__AIMEASY_SUPABASE__;
    if (!supabase) return;

    try {
      const { error: topicError } = await supabase.from('topics').update({ topic_name: name }).eq('id', topicId);
      if (topicError) {
        showToast('Failed to update topic: ' + topicError.message, 'red');
        return;
      }

      const { data: existingVideos } = await supabase.from('topic_videos').select('id').eq('topic_id', topicId);
      if (existingVideos && existingVideos.length > 0) {
        const { error: videoError } = await supabase.from('topic_videos').update({ video_url: url, description: desc }).eq('id', existingVideos[0].id);
        if (videoError) {
          showToast('Failed to update video: ' + videoError.message, 'red');
          return;
        }
      } else {
        const { error: videoError } = await supabase.from('topic_videos').insert({ topic_id: topicId, video_url: url, description: desc, display_order: 1 });
        if (videoError) {
          showToast('Failed to save video: ' + videoError.message, 'red');
          return;
        }
      }

      document.querySelector('.v11-confirm-modal')?.remove();
      showToast('Topic updated successfully.', 'green');

      const subj = window._v10SASubj || findSubjectById(subjId);
      const dbUnitObj = { id: unitId, name: unitLabel(unitId), sort_order: unitNumber(unitId) };
      await window.v10ReloadUnitRoadmapFromDb(subjId, unitId, { ...subj, dbSubjectId: subjId }, dbUnitObj);
      window.v10SAUnitDetail?.(subjId, unitId);
      window.v11AdminUnitDetail?.(subjId, unitId);
      window.renderSubAdminDashboardLive?.();
      window.renderAdminDashboardLive?.();
    } catch (err) {
      showToast('Update failed: ' + err.message, 'red');
    }
  };

  window.v10DeleteSavedRoadmapTopicDb = function (subjId, unitId, topicId) {
    v11Confirm('Are you sure you want to delete this topic?', async () => {
      const supabase = window.__AIMEASY_SUPABASE__;
      if (!supabase) return;
      
      try {
        await supabase.from('topic_videos').delete().eq('topic_id', topicId);
        const { error } = await supabase.from('topics').delete().eq('id', topicId);
        if (error) {
          showToast('Failed to delete topic: ' + error.message, 'red');
          return;
        }
        
        // Recalculate display_order (Critical Requirement 8)
        const { data: remainingTopics, error: fetchErr } = await supabase
          .from('topics')
          .select('id, display_order')
          .eq('subject_id', subjId)
          .eq('unit_id', unitId)
          .order('display_order', { ascending: true });
          
        if (!fetchErr && remainingTopics) {
          for (let i = 0; i < remainingTopics.length; i++) {
            const newOrder = i + 1;
            if (remainingTopics[i].display_order !== newOrder) {
              await supabase.from('topics').update({ display_order: newOrder }).eq('id', remainingTopics[i].id);
            }
          }
        }
        
        showToast('Topic deleted.', 'red');
        const subj = window._v10SASubj || findSubjectById(subjId);
        const dbUnitObj = { id: unitId, name: unitLabel(unitId), sort_order: unitNumber(unitId) };
        await window.v10ReloadUnitRoadmapFromDb(subjId, unitId, { ...subj, dbSubjectId: subjId }, dbUnitObj);
        window.v10SAUnitDetail?.(subjId, unitId);
        window.v11AdminUnitDetail?.(subjId, unitId);
        window.renderSubAdminDashboardLive?.();
        window.renderAdminDashboardLive?.();
      } catch (err) {
        showToast('Delete failed: ' + err.message, 'red');
      }
    });
  };

  window.v10MoveRoadmapTopicDb = async function (subjId, unitId, topicId, direction) {
    const supabase = window.__AIMEASY_SUPABASE__;
    if (!supabase) return;

    try {
      const { data: topics, error } = await supabase
        .from('topics')
        .select('id, display_order')
        .eq('subject_id', subjId)
        .eq('unit_id', unitId)
        .order('display_order', { ascending: true });

      if (error || !topics) {
        showToast('Failed to fetch topics for reorder', 'red');
        return;
      }

      const idx = topics.findIndex(t => String(t.id) === String(topicId));
      if (idx === -1) return;

      let swapIdx = -1;
      if (direction === 'up' && idx > 0) {
        swapIdx = idx - 1;
      } else if (direction === 'down' && idx < topics.length - 1) {
        swapIdx = idx + 1;
      }

      if (swapIdx === -1) return;

      const t1 = topics[idx];
      const t2 = topics[swapIdx];

      const tempOrder1 = t2.display_order;
      const tempOrder2 = t1.display_order;

      const { error: err1 } = await supabase.from('topics').update({ display_order: tempOrder1 }).eq('id', t1.id);
      const { error: err2 } = await supabase.from('topics').update({ display_order: tempOrder2 }).eq('id', t2.id);

      if (err1 || err2) {
        showToast('Failed to swap topic order', 'red');
        return;
      }

      showToast('Topic order updated.', 'green');

      const subj = window._v10SASubj || findSubjectById(subjId);
      const dbUnitObj = { id: unitId, name: unitLabel(unitId), sort_order: unitNumber(unitId) };
      await window.v10ReloadUnitRoadmapFromDb(subjId, unitId, { ...subj, dbSubjectId: subjId }, dbUnitObj);
      window.v10SAUnitDetail?.(subjId, unitId);
    } catch (err) {
      showToast('Reorder failed: ' + err.message, 'red');
    }
  };

  // =========================================================================
  //  VISUAL ROADMAP FLOW CHART DESIGN (CRITICAL REQUIREMENT 5, 6)
  // =========================================================================
  window.v10SavedRoadmapTree = function (topics, subjId, unitId) {
    const esc = window.v10Esc || ((s)=>String(s||''));
    const list = Array.isArray(topics) ? topics : [];
    if (!list.length) return '<div class="v10-saved-roadmap-empty" style="text-align:center;padding:2rem;color:var(--text3);">Saved roadmap will appear here as a flow diagram.</div>';
    
    // Sort by display order strictly
    list.sort((a, b) => Number(a.displayOrder || a.display_order || 0) - Number(b.displayOrder || b.display_order || 0));

    const isOwner = isCurrentSubjectOwned();

    return `
    <div class="v10-saved-roadmap">
      <div class="v10-items-head" style="margin-bottom:12px;font-weight:700;">Saved Roadmap Flow (${list.length})</div>
      <div class="roadmap-flow-container" style="display:flex; flex-direction:column; align-items:center; gap:16px; padding:20px; background:var(--surface2); border-radius:var(--radius-lg); border:1.5px solid var(--border);">
        ${list.map((topic, ti) => {
          const topicName = topic.name || topic.topicName || `Topic ${ti + 1}`;
          const videos = Array.isArray(topic.videos) && topic.videos.length
            ? topic.videos
            : (topic.youtubeUrls || topic.urls || []).map((url) => ({ url, description: '' }));
          const video = videos[0] || { url: '', description: '' };
          const videoUrl = video.url || topic.youtubeUrl || topic.url || '';
          const videoDesc = video.description || topic.description || '';

          const arrowHtml = ti > 0 ? `
            <div class="roadmap-connector" style="display:flex; align-items:center; justify-content:center; height:32px; width:100%;">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <polyline points="19 12 12 19 5 12"></polyline>
              </svg>
            </div>
          ` : '';

          return arrowHtml + `
            <div class="v10-saved-topic roadmap-node" data-topic-id="${topic.id}" style="position:relative; width:100%; max-width:400px; padding:18px; background:var(--surface); border:2px solid var(--primary); border-radius:var(--radius-md); box-shadow:var(--shadow-sm); display:flex; flex-direction:column; gap:8px;">
              <div style="display:flex; justify-content:space-between; align-items:center; gap:8px;">
                <h4 style="margin:0; font-size:0.95rem; color:var(--primary); font-weight:700;">${esc(topicName)}</h4>
                ${isOwner ? `
                <div class="v10-dot-wrap" style="position:relative;" onclick="event.stopPropagation()">
                  <button class="v10-dot-btn" onclick="window.v10OpenTopicMenuDb(this,'${subjId}','${unitId}','${topic.id}',${ti},${list.length})" title="Topic Options" style="padding:2px 6px;font-size:1.1rem;background:transparent;border:none;cursor:pointer;color:var(--text3);">⋮</button>
                </div>` : ''}
              </div>
              ${videoDesc ? `<p style="margin:0; font-size:0.8rem; color:var(--text2); line-height:1.4;">${esc(videoDesc)}</p>` : ''}
              ${videoUrl ? `
                <a href="${esc(videoUrl)}" target="_blank" rel="noopener" class="btn btn-teal btn-sm" style="display:inline-flex; align-items:center; justify-content:center; text-decoration:none; font-size:0.78rem; font-weight:600; gap:4px; padding:6px 12px; margin-top:4px; width:fit-content;">Open URL ↗</a>
              ` : ''}
            </div>
          `;
        }).join('')}
      </div>
    </div>
    `;
  };

  window.v10OpenTopicMenuDb = function (btn, subjId, unitId, topicId, idx, total) {
    if (!isCurrentSubjectOwned()) return;
    v11CloseAllPopups();
    const popup = document.createElement('div');
    popup.className = 'adm-popup';
    popup.style.cssText = 'position:absolute;right:0;top:100%;z-index:99;background:var(--surface);border:1px solid var(--border);border-radius:var(--radius-sm);box-shadow:var(--shadow-md);display:flex;flex-direction:column;min-width:120px;';

    let reorderHtml = '';
    if (idx > 0) {
      reorderHtml += `<button class="adm-popup-item" onclick="this.closest('.adm-popup').remove(); window.v10MoveRoadmapTopicDb('${subjId}','${unitId}','${topicId}','up')">▲ Move Up</button>`;
    }
    if (idx < total - 1) {
      reorderHtml += `<button class="adm-popup-item" onclick="this.closest('.adm-popup').remove(); window.v10MoveRoadmapTopicDb('${subjId}','${unitId}','${topicId}','down')">▼ Move Down</button>`;
    }

    popup.innerHTML = `
      <button class="adm-popup-item" onclick="this.closest('.adm-popup').remove(); window.v10OpenRoadmapEditModalDb('${subjId}','${unitId}','${topicId}')">✏️ Edit Topic</button>
      ${reorderHtml}
      <button class="adm-popup-item red" onclick="this.closest('.adm-popup').remove(); window.v10DeleteSavedRoadmapTopicDb('${subjId}','${unitId}','${topicId}')">🗑️ Delete Topic</button>
    `;
    btn.closest('.v10-dot-wrap').appendChild(popup);
    event.stopPropagation();
  };

  // =========================================================================
  //  TOPIC ROWS & SAVE VALIDATION (CRITICAL REQUIREMENT 7)
  // =========================================================================
  window.v10TopicRowHTML = function (subjId, unitId, idx, name, urls, total, topicId = '') {
    const isFilled = name.trim() !== '';
    const videos = (Array.isArray(urls) && urls.length ? urls : ['']).map((item) => (
      typeof item === 'object'
        ? { url: item.url || item.youtubeUrl || item.url || '', description: item.description || item.title || '' }
        : { url: item || '', description: '' }
    ));
    const video = videos[0] || { url: '', description: '' };
    
    const isOwner = isCurrentSubjectOwned();

    return `
    <div class="v10-topic-row" id="v10-tr-${unitId}-${idx}" data-topic-id="${topicId}" style="display:flex; flex-direction:column; gap:12px; padding:16px; border:1px solid var(--border); border-radius:var(--radius-md); background:var(--surface); margin-bottom:12px; position:relative;">
      <div style="display:flex; align-items:center; gap:8px;">
        <div class="v10-dot ${isFilled ? 'filled' : ''}" id="v10-dot-${unitId}-${idx}" style="width:24px; height:24px; border-radius:50%; background:var(--primary); color:white; display:flex; align-items:center; justify-content:center; font-size:.8rem; font-weight:700;">${idx + 1}</div>
        <h5 style="margin:0; font-size:.85rem; font-weight:600; color:var(--text1);">Topic Node #${idx + 1}</h5>
        ${isOwner ? `<button type="button" class="v10-rm-btn" onclick="window.v10RemoveTopic('${unitId}',${idx})" title="Remove" style="margin-left:auto; background:none; border:none; cursor:pointer; color:var(--red); font-size:1.1rem; font-weight:700;">✕</button>` : ''}
      </div>
      <div class="v10-topic-fields" style="display:flex; flex-direction:column; gap:8px;">
        <div class="input-group">
          <span class="v10-label" style="font-size:0.72rem; color:var(--text3); font-weight:600; text-transform:uppercase;">Topic Name *</span>
          <input class="input ${isFilled ? 'filled' : ''}" placeholder="Topic name (e.g. Introduction to AI)" value="${name.replace(/"/g, '&quot;')}" oninput="window.v10DotUpdate('${unitId}',${idx},this.value)" required style="width:100%;" ${isOwner ? '' : 'disabled'} />
        </div>
        <div class="v10-url-list">
          <div class="v10-url-row" style="display:flex; flex-direction:column; gap:8px;">
            <div class="input-group">
              <span class="v10-label" style="font-size:0.72rem; color:var(--text3); font-weight:600; text-transform:uppercase;">Video URL *</span>
              <input class="v10-url-input input" placeholder="Video URL" value="${(video.url || '').replace(/"/g, '&quot;')}" required style="width:100%;" ${isOwner ? '' : 'disabled'} />
            </div>
            <div class="input-group">
              <span class="v10-label" style="font-size:0.72rem; color:var(--text3); font-weight:600; text-transform:uppercase;">Description (Optional)</span>
              <textarea class="v10-video-desc-input input" placeholder="Description..." rows="2" style="width:100%; resize:vertical;" ${isOwner ? '' : 'disabled'}>${(video.description || '').replace(/"/g, '&quot;')}</textarea>
            </div>
          </div>
        </div>
      </div>
    </div>`;
  };
 
  window.v10RoadmapPanel = function (subjId, unitId, topics) {
    const list = Array.isArray(topics) ? topics : [];
    const isOwner = isCurrentSubjectOwned();
    const rows = list.length ? list.map((t, i) => window.v10TopicRowHTML(
      subjId,
      unitId,
      i,
      t.name || t.topicName || '',
      Array.isArray(t.videos) && t.videos.length
        ? t.videos
        : (Array.isArray(t.youtubeUrls) ? t.youtubeUrls : (t.youtubeUrl || t.url ? [t.youtubeUrl || t.url] : [''])),
      list.length,
      t.id || ''
    )).join('')
      : `<div id="v10-rm-empty-${unitId}" style="text-align:center;padding:1.8rem;color:var(--text3);">
          <div style="font-weight:600;font-size:.88rem;">No topics yet</div>
          <div style="font-size:.76rem;margin-top:4px;">${isOwner ? 'Click "+ Add Topic" to build the roadmap' : 'No topics have been added to this roadmap yet.'}</div>
         </div>`;

    return `
    <div class="v10-panel">
      <div class="v10-panel-head">
        <h4>Learning Roadmap</h4>
        <div class="v10-panel-actions">
          ${isOwner ? `<button class="btn btn-primary btn-sm" onclick="window.v10AddTopic('${subjId}','${unitId}')">+ Add Topic</button>` : ''}
        </div>
      </div>
      <div class="v10-panel-body">
        <div id="v10-topics-${unitId}">${rows}</div>
        ${isOwner ? `<button class="v10-submit" onclick="window.v10SaveRoadmap('${subjId}','${unitId}')">Save Learning Roadmap</button>` : ''}
        <div id="v10-saved-roadmap-${unitId}" style="margin-top:1rem;">${window.v10SavedRoadmapTree(list, subjId, unitId)}</div>
      </div>
    </div>`;
  };

  let isSavingRoadmap = false;
  window.v10SaveRoadmap = async function (subjId, unitId) {
    if (isSavingRoadmap) return;
    if (!isCurrentSubjectOwned()) {
      showToast('You do not have write access to this subject.', 'red');
      return;
    }
    console.log('[ROADMAP] Save Started');
    const container = document.getElementById('v10-topics-' + unitId);
    if (!container) return;
    const topics = [];
    container.querySelectorAll('.v10-topic-row').forEach((row, index) => {
      const name = row.querySelector('.v10-topic-fields input.input:not(.v10-url-input)')?.value.trim();
      const videoUrl = row.querySelector('.v10-url-input')?.value.trim();
      const description = row.querySelector('.v10-video-desc-input')?.value.trim() || '';
      if (!name) return;
      const topicId = row.dataset.topicId || `${Date.now()}-${index}`;
      const videos = [];
      if (videoUrl) {
        videos.push({ url: videoUrl, description: description });
      }
      topics.push({
        id: topicId,
        topicName: name,
        name,
        videos,
        youtubeUrl: videoUrl || '',
        youtubeUrls: videoUrl ? [videoUrl] : [],
        url: videoUrl || '',
        urls: videoUrl ? [videoUrl] : [],
      });
    });

    // Validations: Topic Name required, Video URL required (Critical Requirement 7)
    for (const t of topics) {
      if (!t.name) { showToast('Topic Name is required', 'red'); return; }
      if (!t.youtubeUrl) { showToast('Video URL is required for topic: ' + t.name, 'red'); return; }
      try {
        new URL(t.youtubeUrl);
      } catch (e) {
        showToast('Invalid Video URL for topic: ' + t.name, 'red');
        return;
      }
    }

    const submitBtn = document.querySelector(`.v10-submit[onclick*="v10SaveRoadmap"]`);
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Saving Roadmap...';
    }
    isSavingRoadmap = true;

    try {
      const subject = JSON.parse(localStorage.getItem('edusync_custom_subjects') || '[]').find(s => String(s.id) === String(subjId)) || window._v10SASubj;
      const units = JSON.parse(localStorage.getItem('edusync_units_' + subjId) || '[]');
      const unit = units.find(u => String(u.id) === String(unitId)) || { id: unitId, name: unitLabel(unitId), sort_order: unitNumber(unitId) };
      if (!window.aimeasySaveUnitRoadmap || !subject) {
        showToast('Roadmap DB save is unavailable. Supabase is the required source of truth.', 'red');
        return;
      }
      const { data, error } = await window.aimeasySaveUnitRoadmap({ subject, unit, topics });
      if (error) {
        console.error('[ROADMAP] Save Failed', error);
        showToast('Roadmap DB sync failed: ' + error.message, 'red');
        return;
      }
      v10PersistSubjectDbIds(subjId, unitId, data);
      await window.v10ReloadUnitRoadmapFromDb(subjId, unitId, { ...subject, dbSubjectId: data.subjectId }, { ...unit, dbUnitId: data.unitId });
      window.v10SAUnitDetail?.(subjId, unitId);
      showToast('Learning Roadmap saved and refreshed.', 'green');
    } catch (e) {
      showToast('Error saving roadmap: ' + e.message, 'red');
    } finally {
      isSavingRoadmap = false;
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Save Learning Roadmap';
      }
    }
  };

  window.v10AddTopic = function(subjId, unitId) {
    if (!isCurrentSubjectOwned()) {
      showToast('You do not have write access to this subject.', 'red');
      return;
    }
    const container = document.getElementById('v10-topics-' + unitId);
    if (!container) return;
    const empty = document.getElementById('v10-rm-empty-' + unitId);
    if (empty) empty.remove();
    const rows = container.querySelectorAll('.v10-topic-row');
    const idx = rows.length;
    const div = document.createElement('div');
    div.innerHTML = window.v10TopicRowHTML(subjId, unitId, idx, '', [''], idx + 1, '');
    container.appendChild(div.firstElementChild);
    container.lastElementChild.querySelector('input')?.focus();
  };

  // =========================================================================
  //  CONTENT CREATION & DELETION HANDLERS (CRITICAL REQUIREMENT 9)
  // =========================================================================
  let isSavingNote = false;
  window.v10UploadNote = async function (subjectName, unitId) {
    if (isSavingNote) return;
    if (!isCurrentSubjectOwned()) {
      showToast('You do not have write access to this subject.', 'red');
      return;
    }
    const form = document.querySelector(`#v10-notes-${unitId} .v10-form`);
    const btn = form?.querySelector('.v10-submit');
    
    const link = document.getElementById('v10-nlink-' + unitId)?.value.trim();
    const description = document.getElementById('v10-ndesc-' + unitId)?.value.trim() || '';
    const { topicId, topicName } = v10ReadTopicInput(unitId, 'notes');
    if (!topicName) { showToast('Enter topic text or select a topic', 'red'); return; }
    
    if (btn) {
      btn.disabled = true;
      btn.textContent = 'Saving...';
    }
    isSavingNote = true;

    try {
      const subj = v10SubjectForDb(subjectName);
      const unit = v10UnitForDb(unitId);
      
      const savedData = await window.createContent('note', {
        subjectId: subj.dbSubjectId || subj.id,
        unitId: unit.dbUnitId || unit.id,
        title: topicName,
        body: description,
        url: link,
        metadata: { topicId, topicText: topicName }
      });

      const notes = JSON.parse(localStorage.getItem('edusync_admin_notes') || '[]');
      const note = {
        id: savedData.id,
        dbContentId: savedData.id,
        title: topicName,
        description,
        type: 'link',
        link,
        subject: subjectName,
        unit: unitId,
        topicId,
        topicName,
        uploadedAt: new Date().toLocaleDateString()
      };
      notes.push(note);
      localStorage.setItem('edusync_admin_notes', JSON.stringify(notes));
      
      await v10RefreshContentPane('notes', subjectName, unitId);
      window.renderSubAdminDashboardLive?.();
      showToast('✅ Note saved under topic.', 'green');
    } catch (err) {
      showToast('DB save failed: ' + err.message, 'red');
    } finally {
      isSavingNote = false;
      if (btn) {
        btn.disabled = false;
        btn.textContent = 'Save Note';
      }
    }
  };

  let isSavingPYQ = false;
  window.v10UploadPYQ = async function (subjectName, unitId) {
    if (isSavingPYQ) return;
    if (!isCurrentSubjectOwned()) {
      showToast('You do not have write access to this subject.', 'red');
      return;
    }
    const form = document.querySelector(`#v10-pyq-${unitId} .v10-form`);
    const btn = form?.querySelector('.v10-submit');

    const question = document.getElementById('v10-pyqtxt-' + unitId)?.value.trim();
    const year = document.getElementById('v10-pyqyr-' + unitId)?.value;
    const marks = document.getElementById('v10-pyqmarks-' + unitId)?.value;
    const { topicId, topicName } = v10ReadTopicInput(unitId, 'pyq');
    if (!topicName) { showToast('Enter topic text or select a topic', 'red'); return; }
    if (!question) { showToast('Enter question', 'red'); return; }

    if (btn) {
      btn.disabled = true;
      btn.textContent = 'Saving...';
    }
    isSavingPYQ = true;

    try {
      const subj = v10SubjectForDb(subjectName);
      const unit = v10UnitForDb(unitId);
      
      const savedData = await window.createContent('pyq', {
        subjectId: subj.dbSubjectId || subj.id,
        unitId: unit.dbUnitId || unit.id,
        title: question.slice(0, 80),
        body: question,
        metadata: { year, marks, topicId, topicText: topicName }
      });

      const pyqs = JSON.parse(localStorage.getItem('edusync_admin_pyqs') || '[]');
      const pyq = {
        id: savedData.id,
        dbContentId: savedData.id,
        question,
        year,
        marks,
        subject: subjectName,
        unit: unitId,
        topicId,
        topicName
      };
      pyqs.push(pyq);
      localStorage.setItem('edusync_admin_pyqs', JSON.stringify(pyqs));
      
      await v10RefreshContentPane('pyq', subjectName, unitId);
      window.renderSubAdminDashboardLive?.();
      showToast('✅ PYQ saved under topic.', 'green');
    } catch (err) {
      showToast('DB save failed: ' + err.message, 'red');
    } finally {
      isSavingPYQ = false;
      if (btn) {
        btn.disabled = false;
        btn.textContent = 'Save PYQ';
      }
    }
  };

  let isSavingIQ = false;
  window.v10UploadIQ = async function (subjectName, unitId) {
    if (isSavingIQ) return;
    if (!isCurrentSubjectOwned()) {
      showToast('You do not have write access to this subject.', 'red');
      return;
    }
    const form = document.querySelector(`#v10-iq-${unitId} .v10-form`);
    const btn = form?.querySelector('.v10-submit');

    const question = document.getElementById('v10-iqtxt-' + unitId)?.value.trim();
    const priority = document.getElementById('v10-iqprio-' + unitId)?.value;
    const { topicId, topicName } = v10ReadTopicInput(unitId, 'iq');
    if (!topicName) { showToast('Enter topic text or select a topic', 'red'); return; }
    if (!question) { showToast('Enter question', 'red'); return; }

    if (btn) {
      btn.disabled = true;
      btn.textContent = 'Saving...';
    }
    isSavingIQ = true;

    try {
      const subj = v10SubjectForDb(subjectName);
      const unit = v10UnitForDb(unitId);
      
      const savedData = await window.createContent('iq', {
        subjectId: subj.dbSubjectId || subj.id,
        unitId: unit.dbUnitId || unit.id,
        title: question.slice(0, 80),
        body: question,
        metadata: { priority, topicId, topicText: topicName }
      });

      const iqs = JSON.parse(localStorage.getItem('edusync_admin_iqs') || '[]');
      const iq = {
        id: savedData.id,
        dbContentId: savedData.id,
        question,
        priority,
        subject: subjectName,
        unit: unitId,
        topicId,
        topicName,
        uploadedAt: new Date().toLocaleString()
      };
      iqs.push(iq);
      localStorage.setItem('edusync_admin_iqs', JSON.stringify(iqs));
      
      await v10RefreshContentPane('iq', subjectName, unitId);
      window.renderSubAdminDashboardLive?.();
      showToast('✅ Important question saved under topic.', 'green');
    } catch (err) {
      showToast('DB save failed: ' + err.message, 'red');
    } finally {
      isSavingIQ = false;
      if (btn) {
        btn.disabled = false;
        btn.textContent = 'Save Important Question';
      }
    }
  };

  window.v10DeleteNote = async function (id, subjectName, unitId) {
    if (!isCurrentSubjectOwned()) {
      showToast('You do not have write access to this subject.', 'red');
      return;
    }
    v11Confirm('Are you sure you want to delete this note?', async () => {
      try {
        if (id && !String(id).startsWith('temp_')) {
          await window.deleteContent(id);
        }
        const notes = JSON.parse(localStorage.getItem('edusync_admin_notes') || '[]');
        localStorage.setItem('edusync_admin_notes', JSON.stringify(notes.filter(n => String(n.id) !== String(id) && String(n.dbContentId) !== String(id))));
        
        await v10RefreshContentPane('notes', subjectName, unitId);
        window.renderSubAdminDashboardLive?.();
        showToast('Note deleted successfully', 'green');
      } catch (err) {
        showToast('Delete failed: ' + err.message, 'red');
      }
    });
  };

  window.v10DeletePYQ = async function (id, subjectName, unitId) {
    if (!isCurrentSubjectOwned()) {
      showToast('You do not have write access to this subject.', 'red');
      return;
    }
    v11Confirm('Are you sure you want to delete this PYQ?', async () => {
      try {
        if (id && !String(id).startsWith('temp_')) {
          await window.deleteContent(id);
        }
        const pyqs = JSON.parse(localStorage.getItem('edusync_admin_pyqs') || '[]');
        localStorage.setItem('edusync_admin_pyqs', JSON.stringify(pyqs.filter(p => String(p.id) !== String(id) && String(p.dbContentId) !== String(id))));
        
        await v10RefreshContentPane('pyq', subjectName, unitId);
        window.renderSubAdminDashboardLive?.();
        showToast('PYQ deleted successfully', 'green');
      } catch (err) {
        showToast('Delete failed: ' + err.message, 'red');
      }
    });
  };

  window.v10DeleteIQ = async function (id, subjectName, unitId) {
    if (!isCurrentSubjectOwned()) {
      showToast('You do not have write access to this subject.', 'red');
      return;
    }
    v11Confirm('Are you sure you want to delete this important question?', async () => {
      try {
        if (id && !String(id).startsWith('temp_')) {
          await window.deleteContent(id);
        }
        const iqs = JSON.parse(localStorage.getItem('edusync_admin_iqs') || '[]');
        localStorage.setItem('edusync_admin_iqs', JSON.stringify(iqs.filter(q => String(q.id) !== String(id) && String(q.dbContentId) !== String(id))));
        
        await v10RefreshContentPane('iq', subjectName, unitId);
        window.renderSubAdminDashboardLive?.();
        showToast('Important question deleted successfully', 'green');
      } catch (err) {
        showToast('Delete failed: ' + err.message, 'red');
      }
    });
  };

  // =========================================================================
  //  ADMIN & CREATOR VIEWS HOOKS FOR UUID COMPATIBILITY
  // =========================================================================
  window.v11AdminSubjectCard = function (s) {
    const safeName = (s.name || '').replace(/\\/g, '\\\\').replace(/'/g, "\\'");
    return `
    <div class="adm-subj-card" id="adm-scard-${s.id}">
      <div style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:8px;">
        <div style="width:40px;height:40px;border-radius:var(--radius-sm);background:linear-gradient(135deg,var(--primary-light),var(--lavender-light));display:flex;align-items:center;justify-content:center;font-size:1.3rem;flex-shrink:0;">📖</div>
        <div class="v10-dot-wrap" onclick="event.stopPropagation()">
          <button class="v10-dot-btn" onclick="window.v11AdminSubjectDotMenu(this,'${s.id}','${safeName}')" title="Options">⋮</button>
        </div>
      </div>
      <div style="font-weight:700;font-size:.94rem;margin-bottom:3px;">${s.name}</div>
      <div style="font-size:.74rem;color:var(--text3);margin-bottom:10px;">${s.code || '—'} · ${s.credits || 3} Cr · ${s.branch || 'CSE'}</div>
      <div style="display:flex;gap:5px;flex-wrap:wrap;margin-bottom:10px;">
        <span class="badge badge-primary">${s.sem || '—'}</span>
        <span class="badge badge-teal">${s.uni || 'JNTUK'}</span>
        <span class="badge badge-lavender">${s.reg || 'R23'}</span>
      </div>
      <button class="btn btn-ghost btn-sm" onclick="window.v11AdminOpenSubject('${s.id}')" style="width:100%;">📂 Manage Units & Content →</button>
    </div>`;
  };

  window.v11AdminSubjectDotMenu = function (btn, id, safeName) {
    v11CloseAllPopups();
    const popup = document.createElement('div');
    popup.className = 'adm-popup';
    popup.innerHTML = `
      <button class="adm-popup-item" onclick="window.v11AdminOpenSubject('${id}')">📂 Manage Units</button>
      <button class="adm-popup-item" onclick="window.v11AdminEditSubject('${id}')">✏️ Edit Subject</button>
      <button class="adm-popup-item red" onclick="window.v11AdminDeleteSubject('${id}','${safeName}')">🗑️ Delete Subject</button>`;
    btn.closest('.v10-dot-wrap').appendChild(popup);
    event.stopPropagation();
  };

  window.v11AdminUnitsPage = function (subj) {
    const content = document.getElementById('admin-content');
    if (!content) return;
    const units = v11GetUnits(subj.id, false, subj);

    const adminVideos = JSON.parse(localStorage.getItem('edusync_admin_videos') || '[]');
    const adminNotes = JSON.parse(localStorage.getItem('edusync_admin_notes') || '[]');
    const adminPYQs = JSON.parse(localStorage.getItem('edusync_admin_pyqs') || '[]');
    const adminIQs = JSON.parse(localStorage.getItem('edusync_admin_iqs') || '[]');

    content.innerHTML = `
    <div style="padding:2rem;max-width:1100px;margin:0 auto;width:100%;">
      <button class="v11-back" onclick="window.v11AdminSubjectsPage()">← Back to Subjects</button>
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:1rem;flex-wrap:wrap;gap:10px;">
        <div>
          <h2 style="font-size:1.2rem;font-weight:800;letter-spacing:-.02em;margin-bottom:4px;">📖 ${subj.name} — Units</h2>
          <div style="display:flex;gap:6px;flex-wrap:wrap;">
            <span class="badge badge-primary">${subj.sem || '—'}</span>
            <span class="badge badge-teal">${subj.uni || 'JNTUK'}</span>
            <span class="badge badge-lavender">${subj.reg || 'R23'}</span>
            <span class="badge badge-amber">${subj.branch || 'CSE'}</span>
          </div>
        </div>
        <button class="btn btn-primary btn-sm" onclick="window.v11AdminAddUnit('${subj.id}')">+ Add Unit</button>
      </div>
      <div class="adm-unit-grid">
        ${units.map((u, ui) => {
          const vC = adminVideos.filter(v => v.subject === subj.name && String(v.unit) === String(u.id)).length;
          const nC = adminNotes.filter(n => n.subject === subj.name && String(n.unit) === String(u.id)).length;
          const pC = adminPYQs.filter(p => p.subject === subj.name && String(p.unit) === String(u.id)).length;
          const iC = adminIQs.filter(q => q.subject === subj.name && String(q.unit) === String(u.id)).length;
          const tC = (u.topics || []).length;
          return `<div class="adm-unit-card">
            <div style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:8px;">
              <div style="width:40px;height:40px;border-radius:var(--radius-sm);background:linear-gradient(135deg,var(--lavender),var(--primary));display:flex;align-items:center;justify-content:center;color:#fff;font-weight:800;font-size:1.1rem;flex-shrink:0;">${u.id}</div>
              <div style="display:flex;gap:4px;" onclick="event.stopPropagation()">
                <button class="v10-dot-btn" title="Edit" onclick="window.v11AdminEditUnit('${subj.id}',${ui})" style="font-size:.8rem;">✏️</button>
                <button class="v10-dot-btn" title="Delete" onclick="window.v11AdminDeleteUnit('${subj.id}',${ui})" style="font-size:.8rem;color:var(--red);">🗑️</button>
              </div>
            </div>
            <div style="font-weight:700;font-size:.9rem;margin-bottom:4px;">${unitLabel(u, ui + 1)}</div>
            <div style="font-size:.74rem;color:var(--text3);margin-bottom:8px;">${tC} topic${tC !== 1 ? 's' : ''}</div>
            <div style="display:flex;gap:5px;flex-wrap:wrap;margin-bottom:8px;">
              ${vC ? `<span class="badge badge-teal">🎬 ${vC}</span>` : ''}
              ${nC ? `<span class="badge badge-primary">📄 ${nC}</span>` : ''}
              ${pC ? `<span class="badge badge-amber">📝 ${pC}</span>` : ''}
              ${iC ? `<span class="badge badge-lavender">⭐ ${iC}</span>` : ''}
            </div>
            <button class="btn btn-ghost btn-sm" onclick="window.v11AdminUnitDetail('${subj.id}','${u.id}')" style="width:100%;">Manage Content →</button>
          </div>`;
        }).join('')}
      </div>
    </div>`;
  };

  window.v11AdminUnitDetail = async function (subjId, unitId) {
    window._v11AdminSubjId = subjId;
    window._v11AdminUnitId = unitId;
    const subj = window._v11AdminSubj;
    if (!subj) return;
    
    let unit = { id: unitId, name: unitLabel(unitId), topics: [], sort_order: unitNumber(unitId) };
    const units = v11GetUnits(subjId, false, subj);
    const found = units.find(u => String(u.id) === String(unitId));
    if (found) unit = found;

    if (typeof window.v10ReloadUnitRoadmapFromDb === 'function') {
      const dbUnitObj = { id: unitId, name: unitLabel(unit, unitId), dbUnitId: unit.id };
      const reloadedUnit = await window.v10ReloadUnitRoadmapFromDb(subjId, unitId, { ...subj, dbSubjectId: subjId }, dbUnitObj);
      if (reloadedUnit) {
        unit.topics = reloadedUnit.topics || [];
      }
    }
    if (typeof window.v10ReloadUnitContentFromDb === 'function') {
      await window.v10ReloadUnitContentFromDb(subj.name, unitId);
    }

    const adminVideos = JSON.parse(localStorage.getItem('edusync_admin_videos') || '[]').filter(v => v.subject === subj.name && String(v.unit) === String(unitId));
    const adminNotes = JSON.parse(localStorage.getItem('edusync_admin_notes') || '[]').filter(n => n.subject === subj.name && String(n.unit) === String(unitId));
    const adminPYQs = JSON.parse(localStorage.getItem('edusync_admin_pyqs') || '[]').filter(p => p.subject === subj.name && String(p.unit) === String(unitId));
    const adminIQs = JSON.parse(localStorage.getItem('edusync_admin_iqs') || '[]').filter(q => q.subject === subj.name && String(q.unit) === String(unitId));

    const content = document.getElementById('admin-content');
    if (!content) return;
    
    content.innerHTML = `
    <div style="padding:2rem;max-width:1100px;margin:0 auto;width:100%;">
      <button class="v11-back" onclick="window.v11AdminUnitsPage(window._v11AdminSubj)">← Back to Units</button>
      <h2 style="font-size:1.15rem;font-weight:800;margin-bottom:.4rem;">${esc(subj.name)} - ${unitLabel(unit, unitId)}</h2>
      <p style="font-size:.79rem;color:var(--text3);margin-bottom:1.2rem;">Full content management for this unit</p>

      <div class="v11-tabs">
        <button class="v11-tab on" onclick="v11SwitchTab(this,'v11-topics')">📋 Topics (${(unit.topics || []).length})</button>
        <button class="v11-tab" onclick="v11SwitchTab(this,'v11-videos')">🎬 Videos (${adminVideos.length})</button>
        <button class="v11-tab" onclick="v11SwitchTab(this,'v11-notes')">📄 Notes (${adminNotes.length})</button>
        <button class="v11-tab" onclick="v11SwitchTab(this,'v11-pyqs')">📝 PYQs (${adminPYQs.length})</button>
        <button class="v11-tab" onclick="v11SwitchTab(this,'v11-iqs')">⭐ Imp. Questions (${adminIQs.length})</button>
      </div>

      <div class="v11-pane on" id="v11-topics">
        <div class="card">
          <h4 style="margin-bottom:1rem;">Learning Roadmap / Topics</h4>
          <div id="v11-topics-list">
            ${(unit.topics || []).map((t, ti) => `
            <div class="v11-item-row">
              <span style="width:22px;height:22px;border-radius:50%;background:var(--primary);color:#fff;font-size:.7rem;font-weight:800;display:flex;align-items:center;justify-content:center;flex-shrink:0;">${ti + 1}</span>
              <span style="flex:1;">${t.name}</span>
              ${t.url ? `<a href="${t.url}" target="_blank" class="badge badge-teal" style="text-decoration:none;">▶ Video</a>` : ''}
              <button class="btn btn-danger btn-sm" onclick="window.v11AdminDeleteTopic('${subjId}','${unitId}',${ti})">✕</button>
            </div>`).join('') || '<p style="color:var(--text3);font-size:.83rem;">No topics yet. Add some below.</p>'}
          </div>
          <hr style="margin:1rem 0;">
          <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:8px;">
            <input class="input" id="v11-topic-name" placeholder="Topic name" style="flex:1;min-width:180px;">
            <input class="input" id="v11-topic-url" placeholder="YouTube URL (optional)" style="flex:1;min-width:220px;">
            <button class="btn btn-primary" onclick="window.v11AdminAddTopic('${subjId}','${unitId}')">+ Add Topic</button>
          </div>
        </div>
      </div>

      <div class="v11-pane" id="v11-videos">
        <div class="card">
          <h4 style="margin-bottom:1rem;">🎬 Upload Video</h4>
          <div class="form-row">
            <div class="input-group"><label>Video Title</label><input class="input" id="v11-vtitle" placeholder="e.g. Unit 1 Introduction"></div>
            <div class="input-group"><label>YouTube URL</label><input class="input" id="v11-vurl" placeholder="https://youtube.com/watch?v=..."></div>
          </div>
          <button class="btn btn-primary" onclick="window.v11AdminUploadVideo('${subjId}','${unitId}','${(subj.name || '').replace(/'/g, "\\'")}')">📤 Upload Video</button>
          <hr style="margin:1rem 0;">
          <div id="v11-videos-list">
            ${adminVideos.map(v => `
            <div class="v11-item-row">
              <span>🎬</span>
              <div style="flex:1;min-width:0;"><div style="font-weight:600;">${v.title}</div><div style="font-size:.72rem;color:var(--primary);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${v.url}</div></div>
              <span class="badge badge-green">Live</span>
              <button class="btn btn-danger btn-sm" onclick="window.v11AdminDeleteVideo('${v.id}','${subjId}','${unitId}','${(subj.name || '').replace(/'/g, "\\'")}')">✕</button>
            </div>`).join('') || '<p style="color:var(--text3);font-size:.83rem;">No videos yet.</p>'}
          </div>
        </div>
      </div>

      <div class="v11-pane" id="v11-notes">
        <div class="card">
          <h4 style="margin-bottom:1rem;">📄 Upload Notes</h4>
          <div class="form-row">
            <div class="input-group"><label>Title</label><input class="input" id="v11-ntitle" placeholder="e.g. Unit 1 Handwritten Notes"></div>
            <div class="input-group"><label>Type</label>
              <select class="select" id="v11-ntype">
                <option value="pdf">PDF</option><option value="doc">DOC</option><option value="link">Link</option>
              </select></div>
          </div>
          <div class="input-group"><label>Google Drive / URL Link</label><input class="input" id="v11-nlink" placeholder="https://drive.google.com/..."></div>
          <button class="btn btn-primary" onclick="window.v11AdminUploadNote('${subjId}','${unitId}','${(subj.name || '').replace(/'/g, "\\'")}')">📤 Upload Notes</button>
          <hr style="margin:1rem 0;">
          <div id="v11-notes-list">
            ${adminNotes.map(n => `
            <div class="v11-item-row">
              <span>📄</span>
              <div style="flex:1;"><div style="font-weight:600;">${n.title}</div><div style="font-size:.72rem;color:var(--text3);">${n.type?.toUpperCase() || 'FILE'} · ${n.uploadedAt || ''}</div></div>
              <span class="badge badge-green">Live</span>
              <button class="btn btn-danger btn-sm" onclick="window.v11AdminDeleteNote('${n.id}','${subjId}','${unitId}','${(subj.name || '').replace(/'/g, "\\'")}')">✕</button>
            </div>`).join('') || '<p style="color:var(--text3);font-size:.83rem;">No notes yet.</p>'}
          </div>
        </div>
      </div>

      <div class="v11-pane" id="v11-pyqs">
        <div class="card">
          <h4 style="margin-bottom:1rem;">📝 Add PYQ</h4>
          <div class="form-row">
            <div class="input-group"><label>Exam Year</label><input class="input" id="v11-pyqyr" placeholder="e.g. 2023" type="number" min="2000" max="2099"></div>
            <div class="input-group"><label>Times Asked</label><input class="input" id="v11-pyqcnt" placeholder="e.g. 3" type="number" min="1" value="1"></div>
          </div>
          <div class="input-group"><label>Question</label><textarea class="input" id="v11-pyqtxt" placeholder="Type the question..." rows="3" style="resize:vertical;"></textarea></div>
          <div class="input-group"><label>Answer (optional)</label><textarea class="input" id="v11-pyqans" placeholder="Answer/explanation..." rows="2" style="resize:vertical;"></textarea></div>
          <button class="btn btn-primary" onclick="window.v11AdminUploadPYQ('${subjId}','${unitId}','${(subj.name || '').replace(/'/g, "\\'")}')">📝 Add PYQ</button>
          <hr style="margin:1rem 0;">
          <div id="v11-pyqs-list">
            ${adminPYQs.map(p => `
            <div class="v11-item-row">
              <span>📝</span>
              <div style="flex:1;min-width:0;"><div style="font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${p.question.substring(0, 80)}${p.question.length > 80 ? '...' : ''}</div><div style="font-size:.72rem;color:var(--text3);">Year: ${p.year} · ×${p.count || 1}</div></div>
              <span class="badge badge-green">Live</span>
              <button class="btn btn-danger btn-sm" onclick="window.v11AdminDeletePYQ('${p.id}','${subjId}','${unitId}','${(subj.name || '').replace(/'/g, "\\'")}')">✕</button>
            </div>`).join('') || '<p style="color:var(--text3);font-size:.83rem;">No PYQs yet.</p>'}
          </div>
        </div>
      </div>

      <div class="v11-pane" id="v11-iqs">
        <div class="card">
          <h4 style="margin-bottom:1rem;">⭐ Add Important Question</h4>
          <div class="input-group"><label>Question</label><textarea class="input" id="v11-iqtxt" placeholder="Type the important question..." rows="3" style="resize:vertical;"></textarea></div>
          <div class="form-row">
            <div class="input-group"><label>Priority</label>
              <select class="select" id="v11-iqprio">
                <option value="high">🔴 High</option>
                <option value="med" selected>🟡 Medium</option>
                <option value="low">🟢 Low</option>
              </select></div>
            <div class="input-group"><label>Tags</label><input class="input" id="v11-iqtags" placeholder="e.g. Unit 1, Memory"></div>
          </div>
          <button class="btn btn-primary" onclick="window.v11AdminUploadIQ('${subjId}','${unitId}','${(subj.name || '').replace(/'/g, "\\'")}')">⭐ Add Question</button>
          <hr style="margin:1rem 0;">
          <div id="v11-iqs-list">
            ${adminIQs.map(q => `
            <div class="v11-item-row">
              <span>${q.priority === 'high' ? '🔴' : q.priority === 'low' ? '🟢' : '🟡'}</span>
              <div style="flex:1;min-width:0;"><div style="font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${q.question.substring(0, 80)}${q.question.length > 80 ? '...' : ''}</div><div style="font-size:.72rem;color:var(--text3);">${q.priority} priority${q.tags ? ' · ' + q.tags : ''}</div></div>
              <span class="badge badge-green">Live</span>
              <button class="btn btn-danger btn-sm" onclick="window.v11AdminDeleteIQ('${q.id}','${subjId}','${unitId}','${(subj.name || '').replace(/'/g, "\\'")}')">✕</button>
            </div>`).join('') || '<p style="color:var(--text3);font-size:.83rem;">No important questions yet.</p>'}
          </div>
        </div>
      </div>
    </div>`;
  };

  window.v11CreatorUnitDetail = async function (subjId, unitId) {
    const subj = window._v11CrSubj || window._v10SASubj || findSubjectById(subjId);
    if (!subj) return;
    const content = document.getElementById('sa-content') || document.getElementById('admin-content');
    if (!content) return;
    const units = v11GetUnits(subjId, false, subj);
    const unit = units.find(u => String(u.id) === String(unitId)) || { id: unitId, name: unitLabel(unitId), topics: [], sort_order: unitNumber(unitId) };
    const by = APP.subAdminData?.username || 'Creator';

    if (typeof window.v10ReloadUnitRoadmapFromDb === 'function') {
      const dbUnitObj = { id: unitId, name: unitLabel(unit, unitId), dbUnitId: unit.id };
      const reloadedUnit = await window.v10ReloadUnitRoadmapFromDb(subjId, unitId, { ...subj, dbSubjectId: subjId }, dbUnitObj);
      if (reloadedUnit) {
        unit.topics = reloadedUnit.topics || [];
      }
    }
    if (typeof window.v10ReloadUnitContentFromDb === 'function') {
      await window.v10ReloadUnitContentFromDb(subj.name, unitId);
    }

    const adminVideos = JSON.parse(localStorage.getItem('edusync_admin_videos') || '[]').filter(v => v.subject === subj.name && String(v.unit) === String(unitId));
    const adminNotes = JSON.parse(localStorage.getItem('edusync_admin_notes') || '[]').filter(n => n.subject === subj.name && String(n.unit) === String(unitId));
    const adminPYQs = JSON.parse(localStorage.getItem('edusync_admin_pyqs') || '[]').filter(p => p.subject === subj.name && String(p.unit) === String(unitId));
    const adminIQs = JSON.parse(localStorage.getItem('edusync_admin_iqs') || '[]').filter(q => q.subject === subj.name && String(q.unit) === String(unitId));

    content.innerHTML = `
    <div style="padding:2rem;max-width:1100px;margin:0 auto;width:100%;">
      <button class="v11-back" onclick="window.v11CreatorUnitsPage(window._v11CrSubj)">← Back to Units</button>
      <h2 style="font-size:1.15rem;font-weight:800;margin-bottom:.4rem;">${esc(subj.name)} - ${unitLabel(unit, unitId)}</h2>
      <p style="font-size:.79rem;color:var(--text3);margin-bottom:1.2rem;">Upload content — instantly visible to all students</p>

      ${(unit.topics || []).length ? `
      <div class="card" style="margin-bottom:1.2rem;border-left:3px solid var(--teal);">
        <h4 style="margin-bottom:.6rem;font-size:.9rem;">📋 Learning Roadmap (${(unit.topics || []).length} topics)</h4>
        <div style="display:flex;flex-wrap:wrap;gap:6px;">
          ${(unit.topics || []).map(t => `<span class="tag">${t.name}</span>`).join('')}
        </div>
      </div>` : ''}

      <div class="v11-tabs">
        <button class="v11-tab on" onclick="v11SwitchTab(this,'v11-cr-videos')">🎬 Videos (${adminVideos.length})</button>
        <button class="v11-tab" onclick="v11SwitchTab(this,'v11-cr-notes')">📄 Notes (${adminNotes.length})</button>
        <button class="v11-tab" onclick="v11SwitchTab(this,'v11-cr-pyqs')">📝 PYQs (${adminPYQs.length})</button>
        <button class="v11-tab" onclick="v11SwitchTab(this,'v11-cr-iqs')">⭐ Imp. Questions (${adminIQs.length})</button>
      </div>

      <!-- Videos Pane -->
      <div class="v11-pane on" id="v11-cr-videos">
        <div class="card">
          <h4 style="margin-bottom:1rem;">🎬 Upload Video</h4>
          <div class="form-row">
            <div class="input-group"><label>Video Title</label><input class="input" id="v11-vtitle" placeholder="e.g. Unit 1 Introduction"></div>
            <div class="input-group"><label>YouTube URL</label><input class="input" id="v11-vurl" placeholder="https://youtube.com/watch?v=..."></div>
          </div>
          <button class="btn btn-primary" onclick="window.v11AdminUploadVideo('${subjId}','${unitId}','${(subj.name || '').replace(/'/g, "\\'")}')">📤 Upload Video</button>
          <hr style="margin:1rem 0;">
          <div id="v11-cr-videos-list">
            ${adminVideos.map(v => `
            <div class="v11-item-row">
              <span>🎬</span>
              <div style="flex:1;min-width:0;"><div style="font-weight:600;">${v.title}</div><div style="font-size:.72rem;color:var(--primary);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${v.url}</div></div>
              <span class="badge badge-green">Live</span>
              <button class="btn btn-danger btn-sm" onclick="window.v11AdminDeleteVideo('${v.id}','${subjId}','${unitId}','${(subj.name || '').replace(/'/g, "\\'")}')">✕</button>
            </div>`).join('') || '<p style="color:var(--text3);font-size:.83rem;">No videos yet.</p>'}
          </div>
        </div>
      </div>

      <!-- Notes Pane -->
      <div class="v11-pane" id="v11-cr-notes">
        <div class="card">
          <h4 style="margin-bottom:1rem;">📄 Upload Notes</h4>
          <div class="form-row">
            <div class="input-group"><label>Title</label><input class="input" id="v11-ntitle" placeholder="e.g. Unit 1 Handwritten Notes"></div>
            <div class="input-group"><label>Type</label>
              <select class="select" id="v11-ntype">
                <option value="pdf">PDF</option><option value="doc">DOC</option><option value="link">Link</option>
              </select></div>
          </div>
          <div class="input-group"><label>Google Drive / URL Link</label><input class="input" id="v11-nlink" placeholder="https://drive.google.com/..."></div>
          <button class="btn btn-primary" onclick="window.v11AdminUploadNote('${subjId}','${unitId}','${(subj.name || '').replace(/'/g, "\\'")}')">📤 Upload Notes</button>
          <hr style="margin:1rem 0;">
          <div id="v11-cr-notes-list">
            ${adminNotes.map(n => `
            <div class="v11-item-row">
              <span>📄</span>
              <div style="flex:1;"><div style="font-weight:600;">${n.title}</div><div style="font-size:.72rem;color:var(--text3);">${n.type?.toUpperCase() || 'FILE'} · ${n.uploadedAt || ''}</div></div>
              <span class="badge badge-green">Live</span>
              <button class="btn btn-danger btn-sm" onclick="window.v11AdminDeleteNote('${n.id}','${subjId}','${unitId}','${(subj.name || '').replace(/'/g, "\\'")}')">✕</button>
            </div>`).join('') || '<p style="color:var(--text3);font-size:.83rem;">No notes yet.</p>'}
          </div>
        </div>
      </div>

      <!-- PYQs Pane -->
      <div class="v11-pane" id="v11-cr-pyqs">
        <div class="card">
          <h4 style="margin-bottom:1rem;">📝 Add PYQ</h4>
          <div class="form-row">
            <div class="input-group"><label>Exam Year</label><input class="input" id="v11-pyqyr" placeholder="e.g. 2023" type="number" min="2000" max="2099"></div>
            <div class="input-group"><label>Times Asked</label><input class="input" id="v11-pyqcnt" placeholder="e.g. 3" type="number" min="1" value="1"></div>
          </div>
          <div class="input-group"><label>Question</label><textarea class="input" id="v11-pyqtxt" placeholder="Type the question..." rows="3" style="resize:vertical;"></textarea></div>
          <div class="input-group"><label>Answer (optional)</label><textarea class="input" id="v11-pyqans" placeholder="Answer/explanation..." rows="2" style="resize:vertical;"></textarea></div>
          <button class="btn btn-primary" onclick="window.v11AdminUploadPYQ('${subjId}','${unitId}','${(subj.name || '').replace(/'/g, "\\'")}')">📝 Add PYQ</button>
          <hr style="margin:1rem 0;">
          <div id="v11-cr-pyqs-list">
            ${adminPYQs.map(p => `
            <div class="v11-item-row">
              <span>📝</span>
              <div style="flex:1;min-width:0;"><div style="font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${p.question.substring(0, 80)}${p.question.length > 80 ? '...' : ''}</div><div style="font-size:.72rem;color:var(--text3);">Year: ${p.year} · ×${p.count || 1}</div></div>
              <span class="badge badge-green">Live</span>
              <button class="btn btn-danger btn-sm" onclick="window.v11AdminDeletePYQ('${p.id}','${subjId}','${unitId}','${(subj.name || '').replace(/'/g, "\\'")}')">✕</button>
            </div>`).join('') || '<p style="color:var(--text3);font-size:.83rem;">No PYQs yet.</p>'}
          </div>
        </div>
      </div>

      <!-- IQs Pane -->
      <div class="v11-pane" id="v11-cr-iqs">
        <div class="card">
          <h4 style="margin-bottom:1rem;">⭐ Add Important Question</h4>
          <div class="input-group"><label>Question</label><textarea class="input" id="v11-iqtxt" placeholder="Type the important question..." rows="3" style="resize:vertical;"></textarea></div>
          <div class="form-row">
            <div class="input-group"><label>Priority</label>
              <select class="select" id="v11-iqprio">
                <option value="high">🔴 High</option>
                <option value="med" selected>🟡 Medium</option>
                <option value="low">🟢 Low</option>
              </select></div>
            <div class="input-group"><label>Tags</label><input class="input" id="v11-iqtags" placeholder="e.g. Unit 1, Memory"></div>
          </div>
          <button class="btn btn-primary" onclick="window.v11AdminUploadIQ('${subjId}','${unitId}','${(subj.name || '').replace(/'/g, "\\'")}')">⭐ Add Question</button>
          <hr style="margin:1rem 0;">
          <div id="v11-cr-iqs-list">
            ${adminIQs.map(q => `
            <div class="v11-item-row">
              <span>${q.priority === 'high' ? '🔴' : q.priority === 'low' ? '🟢' : '🟡'}</span>
              <div style="flex:1;min-width:0;"><div style="font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${q.question.substring(0, 80)}${q.question.length > 80 ? '...' : ''}</div><div style="font-size:.72rem;color:var(--text3);">${q.priority} priority${q.tags ? ' · ' + q.tags : ''}</div></div>
              <span class="badge badge-green">Live</span>
              <button class="btn btn-danger btn-sm" onclick="window.v11AdminDeleteIQ('${q.id}','${subjId}','${unitId}','${(subj.name || '').replace(/'/g, "\\'")}')">✕</button>
            </div>`).join('') || '<p style="color:var(--text3);font-size:.83rem;">No important questions yet.</p>'}
          </div>
        </div>
      </div>
    </div>`;
  };

  // Inject Edit/Delete hover overrides
  const styleEl = document.createElement('style');
  styleEl.textContent = `
    .v10-edit-btn:hover { background:var(--primary-light) !important; color:var(--primary) !important; }
    .v10-del-btn:hover { background:var(--red-light) !important; color:var(--red) !important; }
  `;
  document.head.appendChild(styleEl);

  window.submitVideoSuggestion = async function submitVideoSuggestionDb() {
    const titleInput = document.getElementById('suggest-title-input');
    const urlInput = document.getElementById('suggest-url-input');
    const descInput = document.getElementById('suggest-desc-input');
    const title = titleInput?.value.trim() || '';
    const url = urlInput?.value.trim() || '';
    const description = descInput?.value.trim() || '';
    if (!url) { showToast('Please enter a URL', 'red'); return; }
    try { new URL(url); } catch (e) { showToast('Please enter a valid URL', 'red'); return; }

    const supabase = window.__AIMEASY_SUPABASE__;
    const currentItem = window.APP?._videoItems?.[window.APP.currentVideoIndex];
    const subject = window.APP?.currentSubject;
    const unitNum = window.APP?.currentUnit || 1;
    if (!supabase || !subject || !currentItem?.topicId) {
      showToast('Open a roadmap topic before suggesting a URL.', 'red');
      return;
    }

    const roadmap = await window.aimeasyFetchUnitRoadmap?.({
      subject,
      unit: { id: unitNum, name: `Unit ${unitNum}` },
    });
    const subjectId = roadmap?.data?.subjectId;
    const unitId = roadmap?.data?.unitId;
    const topicId = currentItem.topicId || currentItem.id;
    if (!subjectId || !unitId || !topicId) {
      showToast('Unable to map this suggestion to the current unit/topic.', 'red');
      return;
    }

    const authUser = supabase.auth?.getUser ? (await supabase.auth.getUser())?.data?.user : null;
    const { error } = await supabase.from('student_url_suggestions').insert({
      student_id: authUser?.id || window.APP?.user?.id || window.APP?.user?.googleId || null,
      subject_id: subjectId,
      unit_id: unitId,
      topic_id: topicId,
      title: title || currentItem.title || 'Suggested URL',
      url,
      description,
      status: 'pending',
    });
    if (error) {
      showToast('Suggestion save failed: ' + error.message, 'red');
      return;
    }

    if (titleInput) titleInput.value = '';
    if (urlInput) urlInput.value = '';
    if (descInput) descInput.value = '';
    await window.renderPendingUrls?.();
    showToast('URL submitted. Awaiting admin approval.', 'green');
  };

  window.renderPendingUrls = async function renderPendingUrlsDb() {
    const list = document.getElementById('suggest-pending-list');
    if (!list) return;
    const supabase = window.__AIMEASY_SUPABASE__;
    const currentItem = window.APP?._videoItems?.[window.APP.currentVideoIndex];
    if (!supabase || !currentItem?.topicId) { list.innerHTML = ''; return; }
    const authUser = supabase.auth?.getUser ? (await supabase.auth.getUser())?.data?.user : null;
    let query = supabase
      .from('student_url_suggestions')
      .select('id, title, url, status, created_at, topic_id')
      .eq('topic_id', currentItem.topicId)
      .order('created_at', { ascending: false });
    if (authUser?.id) query = query.eq('student_id', authUser.id);
    const { data, error } = await query;
    if (error) {
      list.innerHTML = '';
      console.warn('[SUGGESTIONS] Pending URL load failed:', error.message || error);
      return;
    }
    if (!data?.length) { list.innerHTML = ''; return; }
    const esc = window.v10Esc || ((s) => String(s || ''));
    list.innerHTML = `<div style="font-size:0.78rem;font-weight:700;color:var(--text2);margin-bottom:6px;">Your Submissions:</div>` +
      data.map((row) => `
        <div style="display:flex;align-items:center;gap:8px;padding:6px 10px;background:var(--surface);border:1px solid var(--border);border-radius:var(--radius-sm);margin-bottom:4px;font-size:0.78rem;">
          <span style="flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:var(--text2);">${esc(row.title || row.url)}</span>
          <span class="badge ${row.status === 'approved' ? 'badge-green' : row.status === 'rejected' ? 'badge-red' : 'badge-amber'}">${esc(row.status)}</span>
          ${row.status === 'approved' ? `<button class="btn btn-primary btn-sm" onclick="window.openApprovedVideo('${esc(row.url)}')">Watch</button>` : ''}
        </div>`).join('');
  };

  function installStudentBackButtons() {
    const pages = document.querySelectorAll('#screen-app [id^="page-"]');
    pages.forEach((page) => {
      if (page.id === 'page-dashboard') return;
      if (page.querySelector(':scope > .aimeasy-page-back')) return;
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'back-btn aimeasy-page-back';
      btn.textContent = 'Back';
      btn.addEventListener('click', () => {
        if (page.id === 'page-units') window.navigateTo?.('subjects');
        else if (page.id === 'page-unit-content') window.backToUnits?.();
        else window.aimeasySafeBack?.('/student/dashboard', () => window.navigateTo?.('dashboard'));
      });
      page.insertBefore(btn, page.firstChild);
    });
  }

  async function hydrateProfileFormFromSupabase() {
    const supabase = window.__AIMEASY_SUPABASE__;
    const profileScreen = document.getElementById('screen-profile');
    if (!profileScreen) return;
    if (!profileScreen.querySelector('.aimeasy-profile-back')) {
      const card = profileScreen.querySelector('.profile-card');
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'btn btn-ghost btn-sm aimeasy-profile-back';
      btn.textContent = 'Back';
      btn.addEventListener('click', () => window.aimeasySafeBack?.('/student/dashboard', () => window.navigateTo?.('dashboard')));
      card?.insertBefore(btn, card.firstChild);
    }
    let row = window.APP?.user || {};
    try {
      const authUser = supabase?.auth?.getUser ? (await supabase.auth.getUser())?.data?.user : null;
      if (supabase && authUser?.id) {
        const { data } = await supabase.from('profiles').select('*').eq('id', authUser.id).maybeSingle();
        if (data) row = { ...row, ...data };
      }
    } catch (e) {
      console.warn('[PROFILE] Load failed:', e?.message || e);
    }
    const set = (id, value) => {
      const el = document.getElementById(id);
      if (el && value !== undefined && value !== null) el.value = value;
    };
    set('p-name', row.full_name || row.name);
    set('p-email', row.email || window.APP?.user?.email);
    set('p-phone', row.phone_number || row.phone);
    set('p-college', row.college);
    set('p-university', row.university_name || row.university);
    set('p-regulation', row.regulation_code || row.regulation);
    set('p-branch', row.branch_name || row.branch);
    set('p-year', row.year);
    if (row.year && typeof window.updateSemesterOptions === 'function') window.updateSemesterOptions();
    set('p-semester', row.semester);
  }

  document.addEventListener('click', (event) => {
    const bell = event.target.closest('#screen-app .notif-btn');
    if (!bell) return;
    event.preventDefault();
    event.stopPropagation();
    window.openNotificationsModal?.();
  }, true);

  const aimeasyShowScreenBeforeProfileHydrate = window.showScreen || showScreen;
  window.showScreen = showScreen = function showScreenHydrateProfile(id, ...rest) {
    const result = aimeasyShowScreenBeforeProfileHydrate?.call(this, id, ...rest);
    if (id === 'screen-profile') window.setTimeout(() => hydrateProfileFormFromSupabase(), 0);
    return result;
  };

  setTimeout(() => {
    installStudentBackButtons();
    hydrateProfileFormFromSupabase();
  }, 200);
  window.addEventListener('aimeasy:data-changed', installStudentBackButtons);

  window.v10StoreUnitTopics = function (subjId, unitId, topics, unitName) {
    let units = JSON.parse(localStorage.getItem('edusync_units_' + subjId) || '[]');
    if (!units.length) units = Array.from({ length: 5 }, (_, i) => ({ id: i + 1, name: unitLabel(i + 1), sort_order: i + 1, topics: [] }));
    const ui = units.findIndex(u => {
      if (String(u.id) === String(unitId)) return true;
      const uInt = parseInt(u.id);
      const unitInt = parseInt(unitId);
      if (!isNaN(uInt) && !isNaN(unitInt) && uInt === unitInt) return true;
      return false;
    });
    if (ui >= 0) units[ui] = { ...units[ui], topics };
    else units.push({ id: unitId, name: unitLabel(unitName || unitId), sort_order: unitNumber(unitName || unitId), topics });
    localStorage.setItem('edusync_units_' + subjId, JSON.stringify(units));
    return units;
  };

  window.v10UnitForDb = function (unitId) {
    const subject = v10SubjectForDb('');
    const units = JSON.parse(localStorage.getItem('edusync_units_' + subject?.id) || '[]');
    const unit = units.find(u => {
      if (String(u.id) === String(unitId)) return true;
      const uInt = parseInt(u.id);
      const unitInt = parseInt(unitId);
      if (!isNaN(uInt) && !isNaN(unitInt) && uInt === unitInt) return true;
      return false;
    }) || { id: unitId, name: unitLabel(unitId), sort_order: unitNumber(unitId) };
    return { ...unit, dbUnitId: subject?.dbUnitIds?.[unitId] || unit?.dbUnitId };
  };

  window.v10SavedRoadmapTree = function v10SavedTopicCards(topics, subjId, unitId) {
    const esc = window.v10Esc || ((s) => String(s || ''));
    const list = Array.isArray(topics) ? [...topics] : [];
    if (!list.length) {
      return '<div class="v10-saved-roadmap-empty" style="text-align:center;padding:2rem;color:var(--text3);">Saved topics will appear here after saving.</div>';
    }
    list.sort((a, b) => String(a.createdAt || a.created_at || '').localeCompare(String(b.createdAt || b.created_at || '')) || Number(a.displayOrder || a.display_order || 0) - Number(b.displayOrder || b.display_order || 0));
    return `
      <div class="v10-saved-roadmap">
        <div class="v10-items-head" style="margin-bottom:12px;font-weight:700;">Saved Topics (${list.length})</div>
        <div style="display:flex;flex-direction:column;gap:12px;">
          ${list.map((topic, index) => {
            const videos = Array.isArray(topic.videos) && topic.videos.length
              ? topic.videos
              : (topic.youtubeUrls || topic.urls || []).map((url) => ({ url, description: '' }));
            const video = videos[0] || {};
            const name = topic.name || topic.topicName || `Topic ${index + 1}`;
            const url = video.url || topic.youtubeUrl || topic.url || '';
            const description = video.description || topic.description || '';
            const topicKey = topic.id || topic.dbContentId || '';
            return `
              <div class="v10-saved-topic" data-topic-id="${esc(topicKey)}" style="padding:14px;border:1.5px solid var(--border);border-radius:var(--radius-md);background:var(--surface);box-shadow:var(--shadow-sm);display:flex;flex-direction:column;gap:8px;">
                <div class="v10-saved-topic-title" style="font-weight:800;color:var(--primary);">${esc(name)}</div>
                ${url ? `<a href="${esc(url)}" target="_blank" rel="noopener" style="font-size:0.8rem;color:var(--teal);overflow-wrap:anywhere;">${esc(url)}</a>` : ''}
                ${description ? `<p style="margin:0;color:var(--text2);font-size:0.82rem;line-height:1.45;">${esc(description)}</p>` : ''}
                <div class="v10-saved-topic-actions" style="display:flex;gap:8px;flex-wrap:wrap;margin-top:4px;">
                  <button class="btn btn-ghost btn-sm" onclick="window.v10OpenRoadmapEditModalDb('${subjId}','${unitId}','${topicKey}')">Edit</button>
                  <button class="btn btn-danger btn-sm" onclick="window.v10DeleteSavedRoadmapTopicDb('${subjId}','${unitId}','${topicKey}')">Delete</button>
                </div>
              </div>`;
          }).join('')}
        </div>
      </div>`;
  };

  window.v11AdminAddTopic = async function v11AdminAddTopicDb(subjId, unitId) {
    const nameEl = document.getElementById('v11-topic-name');
    const urlEl = document.getElementById('v11-topic-url');
    const name = nameEl?.value.trim();
    const url = urlEl?.value.trim();
    if (!name) { showToast('Enter topic name', 'red'); return; }
    if (!url) { showToast('Enter topic URL', 'red'); return; }
    if (url) {
      try { new URL(url); } catch (e) { showToast('Please enter a valid URL', 'red'); return; }
    }
    const subj = window._v11AdminSubj || window._v10SASubj || findSubjectById(subjId);
    const units = JSON.parse(localStorage.getItem('edusync_units_' + subjId) || '[]');
    const unit = units.find(u => String(u.id) === String(unitId)) || { id: unitId, name: unitLabel(unitId), sort_order: unitNumber(unitId) };
    if (!window.aimeasySaveUnitRoadmap || !subj) {
      showToast('Topic DB save is unavailable.', 'red');
      return;
    }
    await window.v10ReloadUnitRoadmapFromDb?.(subjId, unitId, { ...subj, dbSubjectId: subjId }, { ...unit, dbUnitId: unit.id });
    const latestUnits = JSON.parse(localStorage.getItem('edusync_units_' + subjId) || '[]');
    const latestUnit = latestUnits.find(u => String(u.id) === String(unitId)) || unit;
    const topics = [...(latestUnit.topics || []), {
      name,
      topicName: name,
      url,
      youtubeUrl: url,
      urls: url ? [url] : [],
      youtubeUrls: url ? [url] : [],
      videos: url ? [{ url, description: '' }] : [],
    }];
    const { data, error } = await window.aimeasySaveUnitRoadmap({ subject: subj, unit, topics });
    if (error) {
      showToast('Topic save failed: ' + error.message, 'red');
      return;
    }
    if (nameEl) nameEl.value = '';
    if (urlEl) urlEl.value = '';
    await window.v10ReloadUnitRoadmapFromDb?.(subjId, unitId, { ...subj, dbSubjectId: data.subjectId }, { ...unit, dbUnitId: data.unitId });
    showToast('Topic saved.', 'green');
    window.v11AdminUnitDetail?.(subjId, unitId);
    window.renderSubAdminDashboardLive?.();
    window.renderAdminDashboardLive?.();
  };

  window.v11AdminDeleteTopic = async function v11AdminDeleteTopicDb(subjId, unitId, topicIdx) {
    const units = JSON.parse(localStorage.getItem('edusync_units_' + subjId) || '[]');
    const unit = units.find(u => String(u.id) === String(unitId));
    const topic = unit?.topics?.[topicIdx];
    if (!topic?.id) return;
    window.v10DeleteSavedRoadmapTopicDb?.(subjId, unitId, topic.id);
  };

  async function aimeasyResolveRoadmapContext(subjId, unitId) {
    const localSubjects = JSON.parse(localStorage.getItem('edusync_custom_subjects') || '[]');
    const subject = window._v10SASubj
      || window._v11AdminSubj
      || window._v11CrSubj
      || localSubjects.find(s => String(s.id) === String(subjId) || String(s.rawId) === String(subjId) || String(s.dbSubjectId) === String(subjId))
      || findSubjectById?.(subjId)
      || { id: subjId, rawId: subjId, dbSubjectId: subjId };
    const units = JSON.parse(localStorage.getItem('edusync_units_' + subjId) || '[]');
    const unit = units.find(u => String(u.id) === String(unitId) || String(u.dbUnitId) === String(unitId))
      || { id: unitId, name: unitLabel(unitId), title: unitLabel(unitId), sort_order: unitNumber(unitId), dbUnitId: subject?.dbUnitIds?.[unitId] };
    const fetched = await window.aimeasyFetchUnitRoadmap?.({ subject, unit });
    return {
      subject,
      unit,
      subjectId: fetched?.data?.subjectId || subject.dbSubjectId || subject.rawId || subjId,
      unitId: fetched?.data?.unitId || unit.dbUnitId || unit.id || unitId,
      topics: fetched?.data?.topics || unit.topics || [],
    };
  }

  async function aimeasyRefreshRoadmapSurfaces(subjId, unitId, context) {
    const ctx = context || await aimeasyResolveRoadmapContext(subjId, unitId);
    await window.v10ReloadUnitRoadmapFromDb?.(subjId, unitId, { ...ctx.subject, dbSubjectId: ctx.subjectId }, { ...ctx.unit, dbUnitId: ctx.unitId });
    window.dispatchEvent(new CustomEvent('aimeasy:data-changed', { detail: { type: 'roadmap', subjectId: ctx.subjectId, unitId: ctx.unitId } }));
    if (document.querySelector('.screen.active')?.id === 'screen-app' && window.APP?.currentSubject && String(window.APP?.currentUnit || '') === String(unitId)) {
      const subjectKey = window.APP.currentSubject.id || window.APP.currentSubject.rawId || subjId;
      window.renderVideoList?.(subjectKey, unitId);
    }
    window.v10SAUnitDetail?.(subjId, unitId);
    window.v11AdminUnitDetail?.(subjId, unitId);
    window.renderSubAdminDashboardLive?.();
    window.renderAdminDashboardLive?.();
  }

  window.v10OpenRoadmapEditModalDb = async function v10OpenRoadmapEditModalDbFixed(subjId, unitId, topicId) {
    v11CloseAllPopups?.();
    const esc = window.v10Esc || ((s) => String(s || ''));
    const ctx = await aimeasyResolveRoadmapContext(subjId, unitId);
    const topic = ctx.topics.find(t => String(t.id || t.dbContentId) === String(topicId));
    if (!topic) { showToast('Topic not found', 'red'); return; }
    const videos = Array.isArray(topic.videos) ? topic.videos : [];
    const video = videos[0] || {};
    const modal = document.createElement('div');
    modal.className = 'v11-confirm-modal';
    modal.innerHTML = `
      <div class="v11-confirm-box" style="max-width:500px;">
        <h3 style="font-size:1.1rem;margin-bottom:1rem;font-weight:700;color:var(--primary);">Edit Topic</h3>
        <div class="input-group" style="margin-bottom:12px;">
          <span class="v10-label">TOPIC NAME</span>
          <input class="input" id="v11-edit-db-topic-name" value="${esc(topic.name || topic.topicName || '')}" placeholder="Topic Name">
        </div>
        <div class="input-group" style="margin-bottom:12px;">
          <span class="v10-label">URL</span>
          <input class="input" id="v11-edit-db-topic-url" value="${esc(video.url || topic.youtubeUrl || topic.url || '')}" placeholder="Video URL">
        </div>
        <div class="input-group" style="margin-bottom:16px;">
          <span class="v10-label">DESCRIPTION</span>
          <textarea class="input" id="v11-edit-db-topic-desc" rows="3" style="resize:vertical;">${esc(video.description || topic.description || '')}</textarea>
        </div>
        <div style="display:flex;gap:10px;justify-content:flex-end;flex-wrap:wrap;">
          <button class="btn btn-ghost btn-sm" onclick="this.closest('.v11-confirm-modal').remove()">Cancel</button>
          <button class="btn btn-primary btn-sm" onclick="window.v10SaveRoadmapEditModalDb('${subjId}','${unitId}','${topicId}')">Save Changes</button>
        </div>
      </div>`;
    document.body.appendChild(modal);
  };

  window.v10SaveRoadmapEditModalDb = async function v10SaveRoadmapEditModalDbFixed(subjId, unitId, topicId) {
    const name = document.getElementById('v11-edit-db-topic-name')?.value.trim();
    const url = document.getElementById('v11-edit-db-topic-url')?.value.trim();
    const desc = document.getElementById('v11-edit-db-topic-desc')?.value.trim() || '';
    if (!name) { showToast('Topic name is required', 'red'); return; }
    if (url) {
      try { new URL(url); } catch (e) { showToast('Please enter a valid URL', 'red'); return; }
    }
    const supabase = window.__AIMEASY_SUPABASE__;
    if (!supabase) { showToast('Supabase is not available.', 'red'); return; }
    const ctx = await aimeasyResolveRoadmapContext(subjId, unitId);
    const topic = ctx.topics.find(t => String(t.id || t.dbContentId) === String(topicId));
    const dbTopicId = topic?.dbContentId || topic?.id || topicId;
    if (!dbTopicId) { showToast('Topic not found in Supabase.', 'red'); return; }
    const { error: topicError } = await supabase.from('topics').update({ topic_name: name }).eq('id', dbTopicId);
    if (topicError) { showToast('Failed to update topic: ' + topicError.message, 'red'); return; }
    const existing = await supabase.from('topic_videos').select('id').eq('topic_id', dbTopicId).order('display_order', { ascending: true }).limit(1);
    if (existing.error) { showToast('Failed to load topic URL: ' + existing.error.message, 'red'); return; }
    if (existing.data?.[0]) {
      const { error } = await supabase.from('topic_videos').update({ video_url: url || '', description: desc }).eq('id', existing.data[0].id);
      if (error) { showToast('Failed to update URL: ' + error.message, 'red'); return; }
    } else if (url) {
      const { error } = await supabase.from('topic_videos').insert({ topic_id: dbTopicId, video_url: url, description: desc, display_order: 1 });
      if (error) { showToast('Failed to save URL: ' + error.message, 'red'); return; }
    }
    await supabase.from('student_url_suggestions').update({ topic_name: name }).eq('topic_id', dbTopicId);
    document.querySelector('.v11-confirm-modal')?.remove();
    await aimeasyRefreshRoadmapSurfaces(subjId, unitId, ctx);
    showToast('Topic updated successfully.', 'green');
  };

  window.v10DeleteSavedRoadmapTopicDb = function v10DeleteSavedRoadmapTopicDbFixed(subjId, unitId, topicId) {
    v11Confirm('Delete this topic and its saved URL from the database?', async () => {
      const supabase = window.__AIMEASY_SUPABASE__;
      if (!supabase) { showToast('Supabase is not available.', 'red'); return; }
      const ctx = await aimeasyResolveRoadmapContext(subjId, unitId);
      const topic = ctx.topics.find(t => String(t.id || t.dbContentId) === String(topicId));
      const dbTopicId = topic?.dbContentId || topic?.id || topicId;
      if (!dbTopicId) { showToast('Topic not found in Supabase.', 'red'); return; }
      await supabase.from('topic_videos').delete().eq('topic_id', dbTopicId);
      const { error } = await supabase.from('topics').delete().eq('id', dbTopicId);
      if (error) { showToast('Failed to delete topic: ' + error.message, 'red'); return; }
      const { data: remaining } = await supabase
        .from('topics')
        .select('id, display_order')
        .eq('subject_id', ctx.subjectId)
        .eq('unit_id', ctx.unitId)
        .order('display_order', { ascending: true });
      for (const [index, topic] of (remaining || []).entries()) {
        if (Number(topic.display_order) !== index + 1) {
          await supabase.from('topics').update({ display_order: index + 1 }).eq('id', topic.id);
        }
      }
      await aimeasyRefreshRoadmapSurfaces(subjId, unitId, ctx);
      showToast('Topic deleted.', 'green');
    });
  };

  window.submitVideoSuggestion = async function submitVideoSuggestionDbFixed() {
    const titleInput = document.getElementById('suggest-title-input');
    const urlInput = document.getElementById('suggest-url-input');
    const descInput = document.getElementById('suggest-desc-input');
    const title = titleInput?.value.trim() || '';
    const url = urlInput?.value.trim() || '';
    const description = descInput?.value.trim() || '';
    if (!url) { showToast('Please enter a URL', 'red'); return; }
    try { new URL(url); } catch (e) { showToast('Please enter a valid URL', 'red'); return; }
    const supabase = window.__AIMEASY_SUPABASE__;
    const currentItem = window.APP?._videoItems?.[window.APP.currentVideoIndex];
    const subject = window.APP?.currentSubject;
    const unitNum = window.APP?.currentUnit || 1;
    if (!supabase || !subject || !currentItem?.topicId) {
      showToast('Open a roadmap topic before suggesting a URL.', 'red');
      return;
    }
    const roadmap = await window.aimeasyFetchUnitRoadmap?.({ subject, unit: { id: unitNum, name: `Unit ${unitNum}`, dbUnitId: subject?.dbUnitIds?.[unitNum] } });
    const subjectId = roadmap?.data?.subjectId;
    const unitId = roadmap?.data?.unitId;
    const topic = (roadmap?.data?.topics || []).find(t => String(t.id || t.dbContentId) === String(currentItem.topicId));
    const topicId = topic?.id || currentItem.topicId;
    if (!subjectId || !unitId || !topicId) {
      showToast('Unable to map this suggestion to the current unit/topic.', 'red');
      return;
    }
    const authUser = supabase.auth?.getUser ? (await supabase.auth.getUser())?.data?.user : null;
    const suggestionPayload = {
      student_id: authUser?.id || window.APP?.user?.id || window.APP?.user?.googleId || null,
      subject_id: subjectId,
      unit_id: unitId,
      topic_id: topicId,
      subject_name: subject.name || '',
      unit_name: roadmap?.data?.unitName || `Unit ${unitNum}`,
      topic_name: topic?.topicName || topic?.name || currentItem.title || '',
      title: title || currentItem.title || 'Suggested URL',
      url,
      description,
      status: 'pending',
    };
    let { error } = await supabase.from('student_url_suggestions').insert(suggestionPayload);
    if (error && /subject_name|unit_name|topic_name/i.test(error.message || '')) {
      const { subject_name, unit_name, topic_name, ...requiredPayload } = suggestionPayload;
      const retry = await supabase.from('student_url_suggestions').insert(requiredPayload);
      error = retry.error;
    }
    if (error) { showToast('Suggestion save failed: ' + error.message, 'red'); return; }
    if (titleInput) titleInput.value = '';
    if (urlInput) urlInput.value = '';
    if (descInput) descInput.value = '';
    await window.renderPendingUrls?.();
    showToast('URL submitted. Awaiting admin approval.', 'green');
  };

  const aimeasyRenderVideoListWithSuggestions = window.renderVideoList || renderVideoList;
  window.openApprovedVideo = async function openApprovedVideoDbFixed(url) {
    const sid = APP.currentSubject?.id || APP.currentSubject?.rawId || 'default';
    const uid = APP.currentUnit || 1;
    await aimeasyRenderVideoListWithSuggestions?.(sid, uid);
    const idx = (APP._videoItems || []).findIndex(v => String(v.url || '') === String(url || ''));
    if (idx >= 0) {
      selectVideoItem(idx);
      switchTab?.('videos');
      showToast('Playing approved URL.', 'green');
    }
  };

  const aimeasyOriginalSelectTopicUrl = window.selectTopicUrl || selectTopicUrl;
  window.selectTopicUrl = selectTopicUrl = function selectTopicUrlFixed(topicIndex, urlIndex) {
    const matchIndex = (APP._videoItems || []).findIndex(item => Number(item.topicIndex) === Number(topicIndex) && Number(item.videoIndex) === Number(urlIndex));
    if (matchIndex >= 0) selectVideoItem(matchIndex);
    else aimeasyOriginalSelectTopicUrl?.(topicIndex, urlIndex);
  };

  // =========================================================================
  //  SUB-ADMIN ACCESS CONTROLS & DYNAMIC RENDERING FIXES
  // =========================================================================
  function isCurrentSubjectOwned() {
    const currentSubj = window._v10SASubj;
    if (!currentSubj) return true;
    const sa = window.APP?.subAdminData || {};
    if (!sa.username) return true;
    if (window.APP?.adminType === 'admin') return true;
    return currentSubj.created_by === sa.username;
  }

  window.v10SaViewDotMenu = function(btn, id, name, isOwned) {
    document.querySelectorAll('.v10-popup').forEach(p => p.remove());
    const safeName = name.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
    const popup = document.createElement('div');
    popup.className = 'v10-popup';
    if (isOwned) {
      popup.innerHTML = `
        <button class="v10-popup-item" onclick="v10SAOpenUnits('${id}')">🔍 Open & Manage</button>
        <button class="v10-popup-item" onclick="v10SAEditSubject('${id}')">✏️ Edit Subject</button>
        <button class="v10-popup-item red" onclick="v10SADeleteSubject('${id}','${safeName}')">🗑 Delete Subject</button>`;
    } else {
      popup.innerHTML = `
        <button class="v10-popup-item" onclick="v10SAOpenUnits('${id}')">🔍 View Units</button>`;
    }
    btn.closest('.v10-dot-wrap').appendChild(popup);
  };

  window.v10SAViewSubjects = async function() {
    const content = document.getElementById('sa-content');
    if (!content) return;

    const sa = APP.subAdminData || {};
    
    content.innerHTML = `
    <div style="padding:2rem;max-width:1100px;margin:0 auto;width:100%;text-align:center;">
      <div class="loading-spinner" style="margin: 3rem auto 1rem;"></div>
      <p style="color:var(--text3);">Fetching subjects in your branch from Supabase...</p>
    </div>`;

    let mySubs = [];
    if (window.aimeasyFetchSubjects) {
      const filters = sa.branch ? { branch: sa.branch } : {};
      const { data, error } = await window.aimeasyFetchSubjects(filters);
      if (error) {
        content.innerHTML = `
        <div style="padding:2rem;max-width:1100px;margin:0 auto;width:100%;text-align:center;">
          <p style="color:var(--red);">Failed to load subjects: ${error.message}</p>
          <button class="btn btn-primary btn-sm" style="margin-top:1rem;" onclick="v10SAViewSubjects()">Retry</button>
        </div>`;
        return;
      }
      mySubs = data || [];
    }

    const cards = mySubs.map(s => {
      const safeName = (s.name || '').replace(/\\/g, '\\\\').replace(/'/g, "\\'");
      const safeId = s.id;
      const isOwned = s.created_by === sa.username;
      return `
      <div class="v10-subj-card" onclick="v10SAOpenUnits('${safeId}')">
        <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:6px;">
          <div class="v10-subj-icon">📖</div>
          <div class="v10-dot-wrap" onclick="event.stopPropagation()">
            <button class="v10-dot-btn" onclick="window.v10SaViewDotMenu(this,'${safeId}','${safeName}', ${isOwned})">⋯</button>
          </div>
        </div>
        <div class="v10-subj-name">${s.name}</div>
        <div class="v10-subj-meta">${s.code || '—'} · ${s.credits || 3} Cr · ${s.branch || 'CSE'}</div>
        <div style="display:flex;gap:5px;flex-wrap:wrap;margin-bottom:4px;">
          <span class="badge badge-primary">${s.semester || '—'}</span>
          <span class="badge badge-teal">${s.university_name || 'JNTUK'}</span>
          <span class="badge badge-lavender">${s.regulation_code || 'R23'}</span>
          <span class="badge badge-amber">${isOwned ? 'Owner' : 'View Only'}</span>
        </div>
        <div class="v10-arrow">${isOwned ? '📋 Click to manage units →' : '🔍 Click to view units →'}</div>
      </div>`;
    }).join('');

    content.innerHTML = `
    <div style="padding:2rem;max-width:1100px;margin:0 auto;width:100%;">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:1.2rem;flex-wrap:wrap;gap:10px;">
        <h2 style="font-size:1.4rem;font-weight:800;letter-spacing:-.02em;">👁️ View Subjects (${mySubs.length})</h2>
        <button class="btn btn-ghost btn-sm" onclick="v10SAViewSubjects()">🔄 Refresh</button>
      </div>
      ${mySubs.length
        ? `<div class="v10-subj-grid">${cards}</div>`
        : `<div style="text-align:center;padding:4rem;color:var(--text3);">
            <div style="font-size:3rem;margin-bottom:1rem;">📚</div>
            <div style="font-weight:600;font-size:1rem;margin-bottom:6px;">No subjects found</div>
            <div style="font-size:.82rem;">No subjects are active in this branch yet.</div>
          </div>`}
    </div>`;
  };

  window.v10SASubjects = async function() {
    const content = document.getElementById('sa-content');
    if (!content) return;

    const sa = APP.subAdminData || {};
    const allSems = ['1-1', '1-2', '2-1', '2-2', '3-1', '3-2', '4-1', '4-2'];
    const unis = ['JNTUK', 'JNTUH', 'Andhra University'];
    const regs = ['R23', 'R20', 'R19', 'R16'];
    const branches = ['CSE', 'ECE', 'EEE', 'IT', 'AIML', 'AIDS', 'MECH', 'CIVIL'];

    content.innerHTML = `
    <div style="padding:2rem;max-width:1100px;margin:0 auto;width:100%;text-align:center;">
      <div class="loading-spinner" style="margin: 3rem auto 1rem;"></div>
      <p style="color:var(--text3);">Fetching subjects from Supabase...</p>
    </div>`;

    let mySubs = [];
    if (window.aimeasyFetchSubjects) {
      const filters = { created_by_subadmin_id: sa.username };
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
  };

  window.v10SAOpenUnits = async function (subjId) {
    document.querySelectorAll(".v10-popup").forEach(p => p.remove());
    const saContent = document.getElementById("sa-content");
    if (saContent) saContent.innerHTML = "<div style=\"padding:2rem;text-align:center;\"><div class=\"loading-spinner\" style=\"margin: 3rem auto 1rem;\"></div><p style=\"color:var(--text3);\">Opening Units...</p></div>";

    if (!window.aimeasyFetchSubjects) {
      showToast('Supabase not ready', 'red');
      return;
    }

    const { data: allSubjects, error } = await window.aimeasyFetchSubjects({});
    if (error) { showToast('Could not load subject: ' + error.message, 'red'); return; }
    const subj = (allSubjects || []).find(s => String(s.id) === String(subjId));
    if (!subj) { showToast('Subject not found in database', 'red'); return; }

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
      credits: subj.credits || 3,
      created_by: subj.created_by
    };

    window._v10SASubj = normalizedSubj;
    await window.v10SAUnitsPage(normalizedSubj);
  };

  window.v10SAUnitsPage = async function (subj) {
    const content = document.getElementById('sa-content');
    if (!content) return;

    content.innerHTML = `
    <div style="padding:2rem;max-width:1100px;margin:0 auto;width:100%;text-align:center;">
      <div class="loading-spinner" style="margin: 3rem auto 1rem;"></div>
      <p style="color:var(--text3);">Loading units from Supabase...</p>
    </div>`;

    let uList = [];
    if (window.aimeasyFetchUnits) {
      const { data: dbUnits, error: unitErr } = await window.aimeasyFetchUnits(subj.id);
      if (unitErr) {
        showToast('Failed to load units: ' + unitErr.message, 'red');
      } else if (dbUnits && dbUnits.length) {
        uList = dbUnits.map(u => ({
          id: u.id,
          sort_order: u.sort_order,
          name: u.title || `Unit ${u.sort_order}`
        }));
      }
    }

    const isOwner = isCurrentSubjectOwned();

    const unitCards = uList.map((u) => {
      return `
      <div class="v10-unit-card" onclick="window.v10SAUnitDetail('${subj.id}','${u.id}')" style="cursor:pointer;">
        <div style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:8px;">
          <div class="v10-unit-num">${u.sort_order || u.id}</div>
          ${isOwner ? `
          <div style="display:flex;gap:4px;" onclick="event.stopPropagation()">
            <button class="v10-dot-btn" onclick="v10SAEditUnit('${subj.id}','${u.id}')" title="Edit" style="font-size:.8rem;">✏️</button>
            <button class="v10-dot-btn" onclick="v10SADeleteUnit('${subj.id}','${u.id}')" title="Delete" style="font-size:.8rem;color:var(--red);">🗑</button>
          </div>` : ''}
        </div>
        <div class="v10-unit-name">${u.name}</div>
        <div class="v10-unit-meta">${isOwner ? 'Click to add roadmap &amp; content' : 'Click to view roadmap &amp; content'}</div>
        <div class="v10-unit-badges"><span class="badge badge-amber">DB ✓</span></div>
        <div class="v10-unit-arrow">${isOwner ? 'Click to add roadmap &amp; content →' : 'Click to view roadmap &amp; content →'}</div>
      </div>`;
    }).join('');

    content.innerHTML = `
    <div style="padding:2rem;max-width:1100px;margin:0 auto;width:100%;">
      <button class="back-btn" onclick="window._v10SASubj = null; if (window.location.hash.includes('/view')) { window.v10SAViewSubjects(); } else { window.v10SASubjects(); }">← Back to Subjects</button>
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
        <p style="font-size:.79rem;color:var(--text3);">${isOwner ? 'Click a unit card to open its learning roadmap and upload content' : 'Click a unit card to view its learning roadmap and content'}</p>
        ${isOwner ? `<button class="btn btn-primary btn-sm" onclick="v10SAAddUnit('${subj.id}')">+ Add Unit</button>` : ''}
      </div>
      ${uList.length
        ? `<div class="v10-unit-grid">${unitCards}</div>`
        : `<div style="text-align:center;padding:3rem;color:var(--text3);">
            <div style="font-size:3rem;margin-bottom:1rem;">📚</div>
            <div style="font-weight:600;">No units yet</div>
            <div style="font-size:.82rem;">${isOwner ? 'Click "+ Add Unit" to create units for this subject' : 'No units have been added to this subject yet.'}</div>
          </div>`}
    </div>`;
  };

  // Form-based editing for Sub-Admin content items
  window.aimeasyEditNote = async function(id, subjectName, unitId) {
  if (window.event) window.event.preventDefault();
    const notes = JSON.parse(localStorage.getItem('edusync_admin_notes') || '[]');
    const note = notes.find(n => String(n.id) === String(id) || String(n.dbContentId) === String(id));
    if (!note) return;
    
    if (!isCurrentSubjectOwned()) {
      showToast('You do not have write access to this subject.', 'red');
      return;
    }

    const form = document.querySelector(`#v10-notes-${unitId} .v10-form`);
    if (!form) return;
    
    const select = form.querySelector('.v10-topic-select');
    if (select) select.value = note.topicId || '';
    
    const topicText = form.querySelector(`.v10-topic-text-input`);
    if (topicText) topicText.value = note.topicName || '';
    
    const nlink = document.getElementById(`v10-nlink-${unitId}`);
    if (nlink) nlink.value = note.link || '';
    
    const ndesc = document.getElementById(`v10-ndesc-${unitId}`);
    if (ndesc) ndesc.value = note.description || '';
    
    const submitBtn = form.querySelector('.v10-submit');
    if (submitBtn) {
      submitBtn.textContent = 'Update Note';
      submitBtn.onclick = async function() {
        if (!isCurrentSubjectOwned()) {
          showToast('You do not have write access to this subject.', 'red');
          return;
        }
        const updatedLink = nlink?.value.trim() || '';
        const updatedDesc = ndesc?.value.trim() || '';
        const selectVal = select?.value || '';
        const textVal = topicText?.value.trim() || '';
        const finalTopicName = textVal || (selectVal ? select.options[select.selectedIndex]?.dataset?.title || '' : '');
        
        if (!finalTopicName) {
          showToast('Enter topic text or select a topic', 'red');
          return;
        }

        submitBtn.disabled = true;
        submitBtn.textContent = 'Updating...';
        
        try {
          note.title = finalTopicName;
          note.link = updatedLink;
          note.description = updatedDesc;
          note.topicId = selectVal;
          note.topicName = finalTopicName;
          
          const dbId = note.dbContentId || (String(note.id).startsWith('temp_') ? null : note.id);
          if (dbId) {
            await window.updateContent?.(dbId, {
              title: finalTopicName,
              body: updatedDesc,
              url: updatedLink,
              metadata: {
                ...(note.metadata || {}),
                topicId: selectVal,
                topicText: finalTopicName
              }
            });
          }
          localStorage.setItem('edusync_admin_notes', JSON.stringify(notes));
          showToast('Note updated successfully', 'green');
          await v10RefreshContentPane('notes', subjectName, unitId);
          window.renderSubAdminDashboardLive?.();
        } catch (e) {
          showToast('Update failed: ' + e.message, 'red');
          submitBtn.disabled = false;
          submitBtn.textContent = 'Update Note';
        }
      };
      
      let cancelBtn = form.querySelector('.v10-edit-cancel-btn');
      if (!cancelBtn) {
        cancelBtn = document.createElement('button');
        cancelBtn.className = 'btn btn-ghost btn-sm v10-edit-cancel-btn';
        cancelBtn.textContent = 'Cancel';
        cancelBtn.style.marginTop = '8px';
        cancelBtn.onclick = function() {
          v10RefreshContentPane('notes', subjectName, unitId);
        };
        submitBtn.parentNode.insertBefore(cancelBtn, submitBtn.nextSibling);
      }
    }
  };

  window.aimeasyEditPYQ = async function(id, subjectName, unitId) {
  if (window.event) window.event.preventDefault();
    const pyqs = JSON.parse(localStorage.getItem('edusync_admin_pyqs') || '[]');
    const pyq = pyqs.find(p => String(p.id) === String(id) || String(p.dbContentId) === String(id));
    if (!pyq) return;

    if (!isCurrentSubjectOwned()) {
      showToast('You do not have write access to this subject.', 'red');
      return;
    }

    const form = document.querySelector(`#v10-pyq-${unitId} .v10-form`);
    if (!form) return;

    const select = form.querySelector('.v10-topic-select');
    if (select) select.value = pyq.topicId || '';

    const topicText = form.querySelector(`.v10-topic-text-input`);
    if (topicText) topicText.value = pyq.topicName || '';

    const pyqyr = document.getElementById(`v10-pyqyr-${unitId}`);
    if (pyqyr) pyqyr.value = pyq.year || '';

    const pyqmarks = document.getElementById(`v10-pyqmarks-${unitId}`);
    if (pyqmarks) pyqmarks.value = pyq.marks || pyq.count || '';

    const pyqtxt = document.getElementById(`v10-pyqtxt-${unitId}`);
    if (pyqtxt) pyqtxt.value = pyq.question || '';

    const submitBtn = form.querySelector('.v10-submit');
    if (submitBtn) {
      submitBtn.textContent = 'Update PYQ';
      submitBtn.onclick = async function() {
        if (!isCurrentSubjectOwned()) {
          showToast('You do not have write access to this subject.', 'red');
          return;
        }
        const updatedQuestion = pyqtxt?.value.trim() || '';
        const updatedYear = pyqyr?.value.trim() || '';
        const updatedMarks = pyqmarks?.value.trim() || '';
        const selectVal = select?.value || '';
        const textVal = topicText?.value.trim() || '';
        const finalTopicName = textVal || (selectVal ? select.options[select.selectedIndex]?.dataset?.title || '' : '');

        if (!finalTopicName) { showToast('Enter topic text or select a topic', 'red'); return; }
        if (!updatedQuestion) { showToast('Enter question', 'red'); return; }

        submitBtn.disabled = true;
        submitBtn.textContent = 'Updating...';

        try {
          pyq.question = updatedQuestion;
          pyq.year = updatedYear;
          pyq.marks = updatedMarks;
          pyq.topicId = selectVal;
          pyq.topicName = finalTopicName;

          const dbId = pyq.dbContentId || (String(pyq.id).startsWith('temp_') ? null : pyq.id);
          if (dbId) {
            await window.updateContent?.(dbId, {
              title: updatedQuestion.slice(0, 80),
              body: updatedQuestion,
              metadata: {
                ...(pyq.metadata || {}),
                year: updatedYear,
                marks: updatedMarks,
                topicId: selectVal,
                topicText: finalTopicName
              }
            });
          }
          localStorage.setItem('edusync_admin_pyqs', JSON.stringify(pyqs));
          showToast('PYQ updated successfully', 'green');
          await v10RefreshContentPane('pyq', subjectName, unitId);
          window.renderSubAdminDashboardLive?.();
        } catch (e) {
          showToast('Update failed: ' + e.message, 'red');
          submitBtn.disabled = false;
          submitBtn.textContent = 'Update PYQ';
        }
      };

      let cancelBtn = form.querySelector('.v10-edit-cancel-btn');
      if (!cancelBtn) {
        cancelBtn = document.createElement('button');
        cancelBtn.className = 'btn btn-ghost btn-sm v10-edit-cancel-btn';
        cancelBtn.textContent = 'Cancel';
        cancelBtn.style.marginTop = '8px';
        cancelBtn.onclick = function() {
          v10RefreshContentPane('pyq', subjectName, unitId);
        };
        submitBtn.parentNode.insertBefore(cancelBtn, submitBtn.nextSibling);
      }
    }
  };

  window.aimeasyEditIQ = async function(id, subjectName, unitId) {
  if (window.event) window.event.preventDefault();
    const iqs = JSON.parse(localStorage.getItem('edusync_admin_iqs') || '[]');
    const iq = iqs.find(q => String(q.id) === String(id) || String(q.dbContentId) === String(id));
    if (!iq) return;

    if (!isCurrentSubjectOwned()) {
      showToast('You do not have write access to this subject.', 'red');
      return;
    }

    const form = document.querySelector(`#v10-iq-${unitId} .v10-form`);
    if (!form) return;

    const select = form.querySelector('.v10-topic-select');
    if (select) select.value = iq.topicId || '';

    const topicText = form.querySelector(`.v10-topic-text-input`);
    if (topicText) topicText.value = iq.topicName || '';

    const iqtxt = document.getElementById(`v10-iqtxt-${unitId}`);
    if (iqtxt) iqtxt.value = iq.question || '';

    const iqprio = document.getElementById(`v10-iqprio-${unitId}`);
    if (iqprio) iqprio.value = iq.priority || 'med';

    const submitBtn = form.querySelector('.v10-submit');
    if (submitBtn) {
      submitBtn.textContent = 'Update Important Question';
      submitBtn.onclick = async function() {
        if (!isCurrentSubjectOwned()) {
          showToast('You do not have write access to this subject.', 'red');
          return;
        }
        const updatedQuestion = iqtxt?.value.trim() || '';
        const updatedPriority = iqprio?.value || 'med';
        const selectVal = select?.value || '';
        const textVal = topicText?.value.trim() || '';
        const finalTopicName = textVal || (selectVal ? select.options[select.selectedIndex]?.dataset?.title || '' : '');

        if (!finalTopicName) { showToast('Enter topic text or select a topic', 'red'); return; }
        if (!updatedQuestion) { showToast('Enter question', 'red'); return; }

        submitBtn.disabled = true;
        submitBtn.textContent = 'Updating...';

        try {
          iq.question = updatedQuestion;
          iq.priority = updatedPriority;
          iq.topicId = selectVal;
          iq.topicName = finalTopicName;

          const dbId = iq.dbContentId || (String(iq.id).startsWith('temp_') ? null : iq.id);
          if (dbId) {
            await window.updateContent?.(dbId, {
              title: updatedQuestion.slice(0, 80),
              body: updatedQuestion,
              metadata: {
                ...(iq.metadata || {}),
                priority: updatedPriority,
                topicId: selectVal,
                topicText: finalTopicName
              }
            });
          }
          localStorage.setItem('edusync_admin_iqs', JSON.stringify(iqs));
          showToast('Important Question updated successfully', 'green');
          await v10RefreshContentPane('iq', subjectName, unitId);
          window.renderSubAdminDashboardLive?.();
        } catch (e) {
          showToast('Update failed: ' + e.message, 'red');
          submitBtn.disabled = false;
          submitBtn.textContent = 'Update Important Question';
        }
      };

      let cancelBtn = form.querySelector('.v10-edit-cancel-btn');
      if (!cancelBtn) {
        cancelBtn = document.createElement('button');
        cancelBtn.className = 'btn btn-ghost btn-sm v10-edit-cancel-btn';
        cancelBtn.textContent = 'Cancel';
        cancelBtn.style.marginTop = '8px';
        cancelBtn.onclick = function() {
          v10RefreshContentPane('iq', subjectName, unitId);
        };
        submitBtn.parentNode.insertBefore(cancelBtn, submitBtn.nextSibling);
      }
    }
  };

  window.addEventListener('aimeasy:data-changed', () => {
    if (document.querySelector('.screen.active')?.id === 'screen-app') installStudentBackButtons();
  });

  setTimeout(() => {
    window.subAdminBack = function() {
      window.history.back();
    };

    // Wrap aimeasyCreateSubject to auto-inject createdBy username
    const originalCreateSubject = window.aimeasyCreateSubject;
    if (originalCreateSubject) {
      window.aimeasyCreateSubject = async function(subject) {
        if (window.APP?.subAdminData?.username) {
          subject = {
            ...subject,
            createdBy: window.APP.subAdminData.username
          };
        }
        return originalCreateSubject(subject);
      };
    }

    // Wrap aimeasySaveLinkedContentItem to auto-inject createdBy username
    const originalSaveContent = window.aimeasySaveLinkedContentItem;
    if (originalSaveContent) {
      window.aimeasySaveLinkedContentItem = async function(payload) {
        if (window.APP?.subAdminData?.username) {
          payload = {
            ...payload,
            createdBy: window.APP.subAdminData.username
          };
        }
        return originalSaveContent(payload);
      };
    }

    // Wrap v10DynamicContentPanel to implement read-only mode for other Sub-Admins' content
    const originalDynamicContentPanel = window.v10DynamicContentPanel;
    window.v10DynamicContentPanel = function(subjectName, unitId, mode) {
      const html = originalDynamicContentPanel ? originalDynamicContentPanel(subjectName, unitId, mode) : '';
      if (!isCurrentSubjectOwned() && mode === 'subadmin') {
        let cleanHtml = html
          .replace(/class="v10-submit"/g, 'class="v10-submit" style="display:none;"')
          .replace(/class="v10-submit v10-upload-btn"/g, 'class="v10-submit v10-upload-btn" style="display:none;"')
          .replace(/<input /g, '<input disabled ')
          .replace(/<textarea /g, '<textarea disabled ')
          .replace(/<select /g, '<select disabled ')
          .replace(/class="v10-del v10-edit-btn"/g, 'class="v10-del v10-edit-btn" style="display:none;"')
          .replace(/class="v10-del v10-del-btn"/g, 'class="v10-del v10-del-btn" style="display:none;"')
          .replace(/class="v10-actions-menu"/g, 'class="v10-actions-menu" style="display:none;"');
        return cleanHtml;
      }
      return html;
    };

    // Explicitly expose unit and subject management operations to window for inline click handlers
    
  window.v10SAAddUnit = async function(subjId) {
    document.querySelectorAll('.v10-add-unit-modal').forEach(m => m.remove());
    
    if (!window.aimeasyFetchUnits || !window.aimeasyCreateUnit) {
      showToast('Supabase not ready', 'red');
      return;
    }
    const { data: existingUnits } = await window.aimeasyFetchUnits(subjId);
    const currentCount = (existingUnits || []).length;
    const newSortOrder = currentCount + 1;

    const modalHtml = `
      <div class="v10-popup v10-add-unit-modal" style="position:fixed; top:50%; left:50%; transform:translate(-50%, -50%); background:var(--surface); padding:2rem; border-radius:8px; box-shadow:0 10px 30px rgba(0,0,0,0.5); z-index:9999; min-width:300px;">
        <h3 style="margin-bottom:1rem;">Add New Unit</h3>
        <div class="input-group">
          <label>Unit Number / Sort Order</label>
          <input type="number" id="v10-add-unit-order" class="input" value="${newSortOrder}" />
        </div>
        <div class="input-group">
          <label>Unit Title</label>
          <input type="text" id="v10-add-unit-title" class="input" placeholder="e.g. Introduction to Machine Learning" />
        </div>
        <div style="display:flex; gap:10px; margin-top:1.5rem;">
          <button class="btn btn-primary" onclick="window.submitSAAddUnit('${subjId}')" style="flex:1;">Save Unit</button>
          <button class="btn btn-ghost" onclick="this.closest('.v10-add-unit-modal').remove()">Cancel</button>
        </div>
      </div>
      <div class="v10-add-unit-overlay" style="position:fixed; top:0; left:0; right:0; bottom:0; background:rgba(0,0,0,0.5); z-index:9998;" onclick="this.previousElementSibling.remove(); this.remove();"></div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHtml);
  };

  window.submitSAAddUnit = async function(subjId) {
    const orderInput = document.getElementById('v10-add-unit-order');
    const titleInput = document.getElementById('v10-add-unit-title');
    if (!orderInput || !titleInput) return;
    
    const sort_order = parseInt(orderInput.value) || 1;
    const name = titleInput.value.trim();
    if (!name) {
      showToast('Unit title is required', 'red');
      return;
    }

    const btn = event.target;
    btn.disabled = true;
    btn.textContent = 'Saving...';

    showToast('Creating unit...', 'blue');
    const { data, error } = await window.aimeasyCreateUnit(subjId, {
      name: name,
      title: name,
      sort_order: sort_order
    });
    
    if (error) { 
      showToast('Failed to create unit: ' + error.message, 'red'); 
      btn.disabled = false;
      btn.textContent = 'Save Unit';
      return; 
    }
    
    showToast('✅ Unit added successfully!', 'green');
    document.querySelectorAll('.v10-add-unit-modal, .v10-add-unit-overlay').forEach(el => el.remove());
    await window.v10SAUnitsPage(window._v10SASubj);
  };


    window.v10SAEditUnit = async function(subjId, unitId) {
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
      await window.v10SAUnitsPage(window._v10SASubj);
    };

    window.v10SADeleteUnit = async function(subjId, unitId) {
      if (!confirm('Delete this unit and all its content from the database?')) return;
      if (!window.aimeasyDeleteUnit) { showToast('Supabase not ready', 'red'); return; }

      showToast('Deleting from Supabase...', 'blue');
      const { error } = await window.aimeasyDeleteUnit(unitId);
      if (error) { showToast('Delete failed: ' + error.message, 'red'); return; }
      showToast('Unit deleted from database', 'red');
      await window.v10SAUnitsPage(window._v10SASubj);
    };

    window.v10SaDotMenu = function(btn, id, name) {
      document.querySelectorAll('.v10-popup').forEach(p => p.remove());
      const safeName = name.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
      const popup = document.createElement('div');
      popup.className = 'v10-popup';
      popup.innerHTML = `
        <button class="v10-popup-item" onclick="window.v10SAOpenUnits('${id}')">🔍 Open & Manage</button>
        <button class="v10-popup-item" onclick="window.v10SAEditSubject('${id}')">✏️ Edit Subject</button>
        <button class="v10-popup-item red" onclick="window.v10SADeleteSubject('${id}','${safeName}')">🗑 Delete Subject</button>`;
      btn.closest('.v10-dot-wrap').appendChild(popup);
    };

    window.v10SAEditSubject = async function(id) {
      document.querySelectorAll('.v10-popup').forEach(p => p.remove());
      if (!window.aimeasyFetchSubjects) { showToast('Supabase not ready', 'red'); return; }

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
      window.v10SASubjects();
    };

    window.v10SADeleteSubject = async function(id, name) {
      document.querySelectorAll('.v10-popup').forEach(p => p.remove());
      if (!confirm(`Delete "${name}" from the database?\n\nThis will permanently remove all content for this subject.`)) return;
      if (!window.aimeasyDeleteSubject) { showToast('Supabase not ready', 'red'); return; }

      showToast('Deleting from database...', 'blue');
      const { error } = await window.aimeasyDeleteSubject(id);
      if (error) { showToast('Delete failed: ' + error.message, 'red'); return; }
      showToast('Subject deleted from database', 'red');
      window.v10SASubjects();
    };

    updateRegulationDropdowns();
    updateUniversityDropdowns();
    addMenuIcons();
    replaceUnitButtons();
  }, 0);
})();



  // Global SubAdmin Back Button
  document.addEventListener('DOMContentLoaded', () => {
    const saScreen = document.getElementById('screen-subadmin');
    if (saScreen) {
      const topBar = saScreen.querySelector('.admin-topbar');
      if (topBar && !topBar.querySelector('#sa-global-back')) {
        const btn = document.createElement('button');
        btn.id = 'sa-global-back';
        btn.className = 'btn btn-ghost btn-sm';
        btn.innerHTML = '← Back';
        btn.style.marginRight = 'auto';
        btn.onclick = () => window.history.back();
        topBar.insertBefore(btn, topBar.firstChild);
      }
    }
  });
