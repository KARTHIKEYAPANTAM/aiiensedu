// Common legacy helpers used across modules
const esc = (value) => String(value ?? '').replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
const js = (value) => String(value ?? '').replace(/\\/g, '\\\\').replace(/'/g, "\\'");
const sb = () => window.__AIMEASY_SUPABASE__;
const todayKeyDb = (date = new Date()) => date.toISOString().slice(0, 10);
const pctFromCgpa = (cgpa) => Math.max(0, Math.min(100, Number(cgpa || 0) * 9.5));

export function updateSemesterOptions() {
  const year = document.getElementById('p-year')?.value;
  const semSelect = document.getElementById('p-semester');
  if (!semSelect || !document.getElementById('p-year')) return;
  semSelect.innerHTML = '';
  if (!year) {
    semSelect.innerHTML = '<option value="">Select Year first</option>';
    return;
  }
  const semMap = {
    '1': [{ v: '1-1', l: 'Sem 1-1' }, { v: '1-2', l: 'Sem 1-2' }],
    '2': [{ v: '2-1', l: 'Sem 2-1' }, { v: '2-2', l: 'Sem 2-2' }],
    '3': [{ v: '3-1', l: 'Sem 3-1' }, { v: '3-2', l: 'Sem 3-2' }],
    '4': [{ v: '4-1', l: 'Sem 4-1' }, { v: '4-2', l: 'Sem 4-2' }],
  };
  semSelect.innerHTML = '<option value="">Select Semester</option>' +
    semMap[year].map(s => `<option value="${s.v}">${s.l}</option>`).join('');
}

export function submitProfile() {
  const uni = document.getElementById('p-university').value;
  const reg = document.getElementById('p-regulation').value;
  const branch = document.getElementById('p-branch').value;
  const year = document.getElementById('p-year').value;
  const sem = document.getElementById('p-semester').value;
  if (!uni || !reg || !branch || !year || !sem) { showToast('Please fill all academic fields', 'red'); return; }

  const nextUser = {
    ...(APP.user || {}),
    university: uni,
    university_name: uni,
    university_id: APP.user?.university_id || null,

    regulation: reg,
    regulation_code: reg,
    regulation_id: APP.user?.regulation_id || null,

    branch,
    branch_name: branch,
    branch_id: APP.user?.branch_id || null,

    year,
    semester: sem,

    // Mark onboarding completion for both legacy + new profile completion checks
    onboarding_completed: true,
    onboarding_completed_at: new Date().toISOString(),
  };

  APP.user = nextUser;

  // Persist for legacy routing
  localStorage.setItem('edusync_session_user', JSON.stringify(nextUser));
  if (nextUser.googleId) {
    localStorage.setItem('edusync_user_' + nextUser.googleId, JSON.stringify(nextUser));
  }

  showLoading('Setting up your personalized dashboard...');

  // If Supabase flow exists, also upsert onboarding_completed so new auth/profile gating passes.
  // This makes the “Go to Dashboard” button work reliably after Google redirect.
  (async () => {
    try {
      const supabase = window.__AIMEASY_SUPABASE__;
      const authUser = supabase?.auth?.getUser ? (await supabase.auth.getUser()).data?.user : null;
      const authId = authUser?.id || nextUser?.id;

      if (supabase && authId) {
        // Use existing profileService if it was attached globally; otherwise do minimal upsert here.
        if (typeof window.ensureProfileForAuthUser === 'function') {
          await window.ensureProfileForAuthUser(authUser || { id: authId, email: nextUser.email }, window.APP?.role || 'student');
        } else {
          // Minimal upsert matching profileService field names
          await supabase.from('profiles').upsert({
            id: authId,
            full_name: nextUser.full_name || nextUser.name || null,
            name: nextUser.name || nextUser.full_name || null,
            email: nextUser.email || null,
            role: nextUser.role || (window.APP?.role || 'student'),

            phone_number: nextUser.phone_number || nextUser.phone || null,
            phone: nextUser.phone || nextUser.phone_number || null,

            university_id: nextUser.university_id || null,
            university_name: nextUser.university_name || null,

            regulation_id: nextUser.regulation_id || null,
            regulation_code: nextUser.regulation_code || nextUser.regulation || null,

            branch_id: nextUser.branch_id || null,
            branch_name: nextUser.branch_name || nextUser.branch || null,

            semester: nextUser.semester || null,
            year: nextUser.year || null,

            onboarding_completed: true,
            onboarding_completed_at: new Date().toISOString(),
          }, { onConflict: 'id' });
        }
      }
    } catch (e) {
      // Don’t block dashboard launch on Supabase issues; legacy fallback still works.
      console.warn('submitProfile Supabase upsert failed:', e);
    } finally {
      hideLoading();
      launchApp();
    }
  })();
}
