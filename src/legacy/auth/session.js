import { supabase } from '../../services/supabase/client.js';

// Common legacy helpers used across modules
const esc = (value) => String(value ?? '').replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
const js = (value) => String(value ?? '').replace(/\\/g, '\\\\').replace(/'/g, "\\'");
const sb = () => window.__AIMEASY_SUPABASE__;
const todayKeyDb = (date = new Date()) => date.toISOString().slice(0, 10);
const pctFromCgpa = (cgpa) => Math.max(0, Math.min(100, Number(cgpa || 0) * 9.5));

export function logAuth(msg, data) {
  try {
    // Prefix makes it easy to filter in console
    console.log(`[AIIENS Edu][AUTH] ${msg}`, data || '');
  } catch (e) { }
}

export function setLocalLegacySession(user) {
  // Legacy UI expects `edusync_session_user` and `APP.user`/`APP.session`
  try {
    const safeUser = user && typeof user === 'object' ? user : null;
    if (safeUser) {
      localStorage.setItem('edusync_session_user', JSON.stringify(safeUser));
      APP.user = safeUser;
      APP.session = true;
    }
  } catch (e) { }
}

export async function syncSessionFromSupabase({ reason } = {}) {
  // This is the core fix for OAuth redirect + session persistence.
  try {
    // Ensure the singleton client is assigned to the window for legacy access
    window.supabase = supabase;

    logAuth('Getting Supabase session...', { reason });
    const { data, error } = await supabase.auth.getSession();
    if (error) {
      logAuth('getSession error', error);
      return false;
    }

    const session = data?.session || null;
    logAuth('Initial Supabase session result', {
      hasSession: !!session,
      user: session?.user,
    });

    if (!session?.user) {
      return false;
    }

    // Map Supabase user -> legacy user shape expected by UI.
    const u = session.user;
    const legacyUser = {
      id: u.id,
      email: u.email,
      name: u.user_metadata?.full_name || u.user_metadata?.name || u.email?.split('@')?.[0] || 'Student',
      role: APP.role || 'student',
      googleId: u.id,
    };

    setLocalLegacySession(legacyUser);

    return true;

  } catch (e) {
    logAuth('syncSessionFromSupabase exception', { error: String(e) });
    return false;
  }
}

export function resolveAppUser() {
  let stored = null;
  try {
    stored = JSON.parse(localStorage.getItem('edusync_session_user') || 'null');
  } catch (e) { }
  if (stored && typeof stored === 'object') {
    APP.user = { ...stored, ...(APP.user || {}) };
    APP.session = true;
  }
  return APP.user || null;
}

export function setModalOpenState(modalId, open) {
  const modal = document.getElementById(modalId);
  if (!modal) return null;
  modal.classList.toggle('open', open);
  modal.style.removeProperty('pointer-events');
  modal.style.removeProperty('z-index');
  return modal;
}

export function openLogoutModal() {
  setModalOpenState('logout-modal', true);
}

export function closeLogoutModal() {
  setModalOpenState('logout-modal', false);
}

export async function confirmLogout() {
  // Clear all user-specific state prefixed keys to prevent session leak
  for (let i = localStorage.length - 1; i >= 0; i--) {
    const key = localStorage.key(i);
    if (key && (key.startsWith('edusync_') || key.startsWith('aimeasy_'))) {
      localStorage.removeItem(key);
    }
  }

  APP.session = false; APP.user = null;
  APP.calcSemesters = [];
  APP.currentSemId = '';

  closeLogoutModal();
  showToast('👋 Logged out successfully', 'blue');

  if (supabase) {
    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.warn('Supabase signOut failed:', e);
    }
  }

  setTimeout(() => showScreen('screen-landing'), 500);
  document.getElementById('chat-fab').style.display = 'none';
  document.getElementById('chat-window').classList.remove('open');
}

export function syncGoogleAuthScreen() {
  if (!APP.role) APP.role = localStorage.getItem('aimeasy_active_role') || 'student';

  const isTeacher = APP.role === 'teacher' || APP.role === 'content_creator' || APP.role === 'creator';
  const titleEl = document.getElementById('google-auth-title');
  const subEl = document.getElementById('google-auth-sub');
  const roleTagEl = document.getElementById('google-auth-role-tag');
  if (titleEl) titleEl.textContent = isTeacher ? 'Sign in as Teacher' : 'Sign in as Student';
  if (subEl) {
    subEl.textContent = isTeacher
      ? 'Choose your Google account to continue as a Teacher. Your content, courses, and teaching resources will be synced automatically.'
      : 'Choose your Google account to continue as a Student. Your progress will be synced automatically.';
  }
  if (roleTagEl) {
    roleTagEl.textContent = isTeacher ? 'Teacher Login' : 'Student Login';
    roleTagEl.style.background = isTeacher ? 'var(--teal-light)' : 'var(--primary-light)';
    roleTagEl.style.color = isTeacher ? 'var(--teal)' : 'var(--primary)';
  }

  const teacherAccounts = document.getElementById('teacher-accounts');
  const studentAccounts = document.getElementById('student-accounts');
  if (teacherAccounts) teacherAccounts.style.display = isTeacher ? 'block' : 'none';
  if (studentAccounts) studentAccounts.style.display = isTeacher ? 'none' : 'block';
}

export function proceedWithRole() {
  // Teacher bypass
  if (APP.role === 'teacher') {
    if (APP.session && APP.user) {
      showLoading('Signing you in...');
      setTimeout(() => { hideLoading(); launchTeacherPortal(APP.user); }, 900);
      return;
    }
  }

  // Student: if logged in, decide whether we must ask personal/academic
  if (APP.session && APP.user && APP.role !== 'teacher') {
    const user = APP.user || {};
    const hasPersonal = !!(user.name && user.phone);
    const hasAcademic = !!(user.university && user.regulation && user.branch && user.semester);

    if (!hasPersonal) {
      showScreen('screen-profile');
      document.getElementById('profile-step1')?.style && (document.getElementById('profile-step1').style.display = 'block');
      document.getElementById('profile-step2')?.style && (document.getElementById('profile-step2').style.display = 'none');
      document.getElementById('step1')?.classList.add('active');
      document.getElementById('step2')?.classList.remove('active');
      return;
    }

    if (!hasAcademic) {
      showScreen('screen-profile');
      document.getElementById('profile-step1')?.style && (document.getElementById('profile-step1').style.display = 'none');
      document.getElementById('profile-step2')?.style && (document.getElementById('profile-step2').style.display = 'block');
      document.getElementById('step1')?.classList.add('done');
      document.getElementById('step2')?.classList.add('active');
      document.getElementById('step2')?.classList.remove('done');
      return;
    }

    showLoading('Signing you in...');
    setTimeout(() => { hideLoading(); launchApp(); }, 900);
    return;
  }

  if (!APP.role) APP.role = 'student';
  syncGoogleAuthScreen();
  showScreen('screen-google-auth');
}

export function googleSignIn(accountType) {
  // IMPORTANT: `accountType` is kept for legacy UI buttons.
  // Real OAuth should happen for actual Google account selection.
  showLoading('Authenticating with Google...');

  try {
    if (!supabase) {
      window.__aimeasyOAuthStartInFlight = false;
      hideLoading();
      logAuth('Supabase client missing; falling back to legacy mock');
      showToast('Auth not configured (Supabase missing)', 'red');
      return;
    }

    logAuth('OAuth Started (googleSignIn)', {
      accountType,
      role: APP.role,
      href: window.location.href,
    });
    try {
      sessionStorage.setItem('aimeasy_login_portal', APP.role === 'content_creator' ? 'content_creator' : 'student');
    } catch (e) { }

    window.aimeasyStartGoogleOAuth(APP.role)
      .then(({ data, error }) => {
        logAuth('OAuth signInWithOAuth returned', { data, error });
        if (error) {
          window.__aimeasyOAuthStartInFlight = false;
          hideLoading();
          showToast(`Google sign-in error: ${error.message || String(error)}`, 'red');
        }
      })
      .catch((e) => {
        window.__aimeasyOAuthStartInFlight = false;
        logAuth('OAuth signInWithOAuth threw', { error: String(e) });
        hideLoading();
        showToast('Google sign-in failed. Check console logs.', 'red');
      });
  } catch (e) {
    window.__aimeasyOAuthStartInFlight = false;
    logAuth('googleSignIn exception', { error: String(e) });
    hideLoading();
  }
}
