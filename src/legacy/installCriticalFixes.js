
/**
 * Critical system fixes — auth, roles, navigation, video, search, content, admin stats.
 * Loaded after legacy scripts; patches window globals without changing UI markup.
 */
import { hydrateProfileAcademicDropdowns } from '../services/academic/academicCatalog.js';
import { fetchAdminDashboardStats, fetchLandingStats } from '../services/admin/adminStatsService.js';
import { authLog, AUTH_STAGES } from '../services/auth/authLogger.js';
import { getSessionOnce, invalidateSessionCache, signInWithGoogle, withAuthTimeout, completeOAuthCallbackFromUrl } from '../services/auth/authService.js';
import {
  clearLoginPortal,
  isCreatorProfileComplete,
  isProfileAcademicComplete,
  isProfileFullyComplete,
  isProfilePersonalComplete,
  profileToLegacyUser,
  setLoginPortal,
  upsertProfileFromLegacy,
} from '../services/auth/profileService.js';
import { isOAuthCallbackUrl, routeAfterAuth } from '../services/auth/postAuthRouter.js';
import { ROLE, applyDashboardRedirect, normalizeRole } from '../services/auth/roleRedirectService.js';
import { setCurrentBranch } from '../services/auth/branchContext.js';
import { createContentItem, deleteContentItem, listContentItems, normalizeContentType, updateContentItem } from '../services/content/contentRepository.js';
import {
  fetchCurriculumStats,
  fetchUnitRoadmap,
  saveLinkedContentItem,
  saveUnitRoadmap,
  fetchSubjects,
  createSubject,
  updateSubject,
  deleteSubject,
  fetchUnits,
  createUnit,
  updateUnit,
  deleteUnit,
} from '../services/curriculum/curriculumRepository.js';
import {
  createCurriculumBlueprint,
  fetchWorkflowDashboardCounts,
  listCurriculumContent,
  listCurriculums,
  saveCurriculumContent,
  updateCurriculumStatus,
} from '../services/curriculum/curriculumWorkflowRepository.js';
import { stopVideoPlayer } from '../services/media/stopVideoPlayer.js';
import { searchStudentContent } from '../services/search/studentSearch.js';

export function installCriticalFixes() {
  if (window.__aimeasyCriticalFixesInstalled) return;
  window.__aimeasyCriticalFixesInstalled = true;

  window.stopVideoPlayer = stopVideoPlayer;
  window.aimeasyRouteAfterAuth = routeAfterAuth;
  window.aimeasyStartGoogleOAuth = signInWithGoogle;
  window.aimeasyHydrateProfileDropdowns = hydrateProfileAcademicDropdowns;
  window.__aimeasyAuthSyncInFlight = null;
  window.__aimeasyCentralAuthInstalled = true;
  window.__aimeasyAuthBootstrapComplete = true;

  if (!window.__aimeasyLandingClicksInstalled) {
    window.__aimeasyLandingClicksInstalled = true;
    document.addEventListener('click', (event) => {
      const adminToggle = event.target.closest('#admin-icon-btn, .admin-icon-btn');
      if (adminToggle) {
        event.preventDefault();
        event.stopPropagation();
        window.toggleAdminDropdown?.(event);
        return;
      }
      const adminItem = event.target.closest('.admin-dropdown-item');
      if (adminItem) {
        event.preventDefault();
        event.stopPropagation();
        const label = (adminItem.textContent || '').toLowerCase();
        window.openAdminLogin?.(label.includes('sub admin') ? 'subadmin' : 'admin');
        return;
      }
      const roleCard = event.target.closest('.role-card');
      if (roleCard && document.getElementById('screen-landing')?.classList.contains('active')) {
        if (roleCard.id === 'role-student' || roleCard.classList.contains('student')) {
          window.selectRoleAndNavigate?.('student');
        } else if (roleCard.id === 'role-creator' || roleCard.classList.contains('teacher')) {
          window.selectRoleAndNavigate?.('content_creator');
        }
      }
      if (!event.target.closest('#admin-dropdown-wrap')) {
        document.getElementById('admin-dropdown')?.classList.remove('open');
      }
    }, true);
  }

  function getStoredLoginPortal() {
    return sessionStorage.getItem('aimeasy_login_portal') || localStorage.getItem('aimeasy_login_portal_backup');
  }

  function isLiveWorkshopLoginRequest() {
    try {
      return getStoredLoginPortal() === 'live_workshop'
        || sessionStorage.getItem('aiiens_live_workshop_auth') === '1'
        || (window.location.hash || '').includes('live-workshops');
    } catch {
      return (window.location.hash || '').includes('live-workshops');
    }
  }

  function hasActiveLegacyAdminSession() {
    const route = (window.location.hash || '').replace(/^#/, '');
    return /^\/(admin|subadmin|creator)(\/|$)/.test(route) && Boolean(window.APP?.adminType);
  }

  function cleanHashUrl(path) {
    return `${window.location.pathname}#${path}`;
  }

  function clearLiveWorkshopPortalMarker() {
    try {
      sessionStorage.removeItem('aiiens_live_workshop_auth');
    } catch {
      /* ignore */
    }
  }

  window.updateGoogleAuthTermsState = function updateGoogleAuthTermsState() {
    const checkbox = document.getElementById('google-auth-terms');
    const button = document.getElementById('google-auth-continue');
    if (button) button.disabled = !checkbox?.checked;
  };
  async function routeExistingSessionToDashboard({ selectedRole, reason } = {}) {
    try {
      const normalizedRole = normalizeRole(selectedRole || window.APP?.role || getStoredLoginPortal());
      const { data, error } = await withAuthTimeout(getSessionOnce(), 'routeExistingSession.getSession');
      if (error) {
        console.warn('Supabase getSession error:', error.message);
        return false;
      }
      if (!data?.session?.user) {
        console.log('[AUTH] Session Missing', { reason });
        return false;
      }

      const authUser = data.session.user;
      console.log('[AUTH] Session Found', { userId: authUser.id, reason });
      console.log('[AUTH] Existing User', { userId: authUser.id });
      console.log('[ONBOARDING] Existing session profile review', { userId: authUser.id, reason });

      return withAuthTimeout(
        routeAfterAuth(authUser, { reason, selectedRole: normalizedRole || undefined }),
        'routeExistingSession.routeAfterAuth',
      );
    } catch (e) {
      console.warn('routeExistingSessionToDashboard failed:', e);
      return false;
    }
  }

  function openCreatorAccess() {
    localStorage.removeItem('aiiens_admin_session');
    setLoginPortal(ROLE.CONTENT_CREATOR);
    if (window.APP) {
      window.APP.role = ROLE.CONTENT_CREATOR;
      window.APP.adminType = null;
      window.APP.subAdminData = null;
      window.APP.session = false;
      window.APP.user = null;
    }
    window.__aimeasyPreserveRoleRoute = '';
    document.querySelectorAll('.role-card').forEach((card) => card.classList.remove('selected'));
    document.getElementById('role-creator')?.classList.add('selected');
    // Business rule: session exists → dashboard (no Google auth, no onboarding).
    if (window.__AIMEASY_SUPABASE__?.auth?.getSession) {
      window.__AIMEASY_SUPABASE__.auth.getSession().then(({ data }) => {
        if (data?.session?.user) {
          routeExistingSessionToDashboard({ selectedRole: ROLE.CONTENT_CREATOR, reason: 'role-selection-existing-session' });
        } else {
          syncGoogleAuthScreen();
          window.showScreen?.('screen-google-auth');
          window.setTimeout(() => window.updateGoogleAuthTermsState?.(), 0);
        }
      });
      return;
    }
    syncGoogleAuthScreen();
    window.showScreen?.('screen-google-auth');
    window.setTimeout(() => window.updateGoogleAuthTermsState?.(), 0);
  }

  function syncGoogleAuthScreen() {
    const isWorkshop = isLiveWorkshopLoginRequest();
    const role = isWorkshop ? 'live_workshop' : (normalizeRole(window.APP?.role || getStoredLoginPortal()) || ROLE.STUDENT);
    const isCreator = role === ROLE.CONTENT_CREATOR;
    const titleEl = document.getElementById('google-auth-title');
    const subEl = document.getElementById('google-auth-sub');
    const roleTagEl = document.getElementById('google-auth-role-tag');
    if (titleEl) titleEl.textContent = isWorkshop ? 'Sign in for Live Workshop' : (isCreator ? 'Sign in as Teacher' : 'Sign in as Student');
    if (subEl) {
      subEl.textContent = isWorkshop
        ? 'Choose your Google account to continue to Live Workshops.'
        : isCreator
        ? 'Choose your Google account to continue as a Teacher. Your content, courses, and teaching resources will be synced automatically.'
        : 'Choose your Google account to continue as a Student. Your progress will be synced automatically.';
    }
    if (roleTagEl) {
      roleTagEl.textContent = isWorkshop ? 'Live Workshop Login' : (isCreator ? 'Teacher Login' : 'Student Login');
      roleTagEl.style.background = isCreator ? 'var(--teal-light)' : 'var(--primary-light)';
      roleTagEl.style.color = isCreator ? 'var(--teal)' : 'var(--primary)';
    }
    document.querySelectorAll('.google-auth-divider, .google-auth-mock-accounts').forEach((el) => {
      el.style.display = 'none';
    });
  }

  async function completeOAuthCallback(supabase) {
    const session = await completeOAuthCallbackFromUrl();
    if (session) {
      authLog(AUTH_STAGES.SUCCESS, { source: 'exchangeCodeForSession' });
      return session;
    }

    if (typeof supabase.auth.getSessionFromUrl === 'function') {
      const hash = window.location.hash || '';
      const rawHash = hash.replace(/^#/, '');
      if (rawHash.startsWith('/auth') && /access_token|refresh_token/.test(rawHash)) {
        const tokenFragment = rawHash.replace(/^\/auth[/?&]?/, '');
        window.history.replaceState(window.history.state, '', `${window.location.pathname}#${tokenFragment}`);
      }
      await supabase.auth.getSessionFromUrl();
    }
  }

  // ─── Issue 1 & 2: Central Supabase post-auth (student Google only) ───
  window.syncSessionFromSupabase = async function syncSessionFromSupabaseFixed({ reason } = {}) {
    if (window.__aimeasyAuthSyncInFlight) return window.__aimeasyAuthSyncInFlight;
    const supabase = window.__AIMEASY_SUPABASE__ || window.supabase;
    if (!supabase) return false;

    window.__aimeasyAuthSyncInFlight = (async () => {
      window.__aimeasyAuthRestoring = true;
      window.__aimeasyAuthBootstrapComplete = false;
      authLog(AUTH_STAGES.START, {
        reason,
        hash: window.location.hash,
        search: window.location.search,
      });

      // Restore legacy admin/subadmin/creator session if exists
      let adminSession = null;
      try {
        adminSession = JSON.parse(localStorage.getItem('aiiens_admin_session') || localStorage.getItem('edusync_admin_session') || 'null');
      } catch (e) {
        console.warn('Failed to parse admin session:', e);
      }

      if (adminSession && adminSession.type) {
        if (!window.APP) {
          window.APP = {
            role: 'student',
            user: null,
            session: false,
            adminType: null,
            subAdminData: null
          };
        }
        window.APP.role = adminSession.type;
        window.APP.adminType = adminSession.type === 'content_creator' ? 'content_creator' : adminSession.type;
        window.APP.session = true;
        if (adminSession.type === 'admin') {
          window.APP.user = adminSession.data || { username: adminSession.username || 'admin' };
        } else {
          window.APP.subAdminData = adminSession.data || { username: adminSession.username || 'subadmin' };
          window.APP.user = adminSession.data || { username: adminSession.username || 'subadmin' };
        }
        console.log('[SESSION RESTORE] Restored legacy admin/subadmin/creator session:', adminSession);
        
        window.__aimeasyAuthBootstrapComplete = true;
        window.__aimeasyAuthRestoring = false;
        window.dispatchEvent(new CustomEvent('aimeasy:auth-bootstrap-complete'));
        
        if (adminSession.type === 'content_creator') {
          window.syncCreatorProfileFields?.();
        }
        
        return true;
      }

      const initialSession = await withAuthTimeout(getSessionOnce(), 'syncSessionFromSupabase.initialSession');
      if (initialSession.error) {
        console.warn('Supabase getSession error:', initialSession.error.message);
        window.hideLoading?.();
        return false;
      }

      const hasRestoredSession = Boolean(initialSession.data?.session?.user);
      if (
        hasRestoredSession &&
        hasActiveLegacyAdminSession() &&
        !isOAuthCallbackUrl() &&
        String(reason || '').startsWith('startup')
      ) {
        console.log('[AUTH] Supabase restore skipped; legacy admin session is active', { reason });
        window.__aimeasyAuthBootstrapComplete = true;
        return true;
      }

      if (isOAuthCallbackUrl()) {
        if (hasRestoredSession) {
          console.log('[AUTH] OAuth callback skipped; session already restored', {
            reason,
            userId: initialSession.data.session.user.id,
          });
          window.history.replaceState(window.history.state, '', `${window.location.pathname}#/auth`);
        } else {
          try {
            await withAuthTimeout(completeOAuthCallback(supabase), 'syncSessionFromSupabase.oauthCallback');
            invalidateSessionCache();
          } catch (e) {
            console.warn('OAuth callback completion:', e);
            const { data } = await supabase.auth.getSession();
            window.history.replaceState(window.history.state, '', `${window.location.pathname}#/auth`);
            window.hideLoading?.();
            if (!data?.session?.user) {
            window.showToast?.('Google sign-in could not be completed. Please try again.', 'red');
            }
            return false;
          }
        }
      }

      const { data, error } = hasRestoredSession
        ? initialSession
        : await withAuthTimeout(getSessionOnce(), 'syncSessionFromSupabase.finalSession');
      if (error) {
        console.warn('Supabase getSession error:', error.message);
        window.hideLoading?.();
        return false;
      }
      if (!data?.session?.user) {
        authLog('SESSION MISSING', { reason });
        console.log('[AUTH] Session Missing', { reason });
        window.hideLoading?.();
        return false;
      }
      authLog(AUTH_STAGES.SESSION_FOUND, { userId: data.session.user.id, reason });
      console.log('[AUTH] Session Found', { userId: data.session.user.id, reason });
      console.log('[AUTH] Session Restored', { userId: data.session.user.id, reason });
      console.log('[AUTH] User Authenticated', { userId: data.session.user.id });
console.log('CURRENT APP ROLE', window.APP?.role);

if (
  window.APP?.role === 'student' &&
  typeof window.hydrateLegacyState === 'function'
) {
  console.log(
    '[AUTH] Hydrating legacy state for student',
    data.session.user.id
  );

  await window.hydrateLegacyState();

} else {

  console.log(
    '[AUTH] Skipping legacy hydration',
    window.APP?.role
  );

}
      const portal = getStoredLoginPortal();

      window.__aimeasyRoutingInProgress = true;
      try {
        console.log('[ROUTE] Final Route', {
          target: isProfileFullyComplete(window.APP?.user) ? 'role-dashboard' : 'post-auth-onboarding',
          userId: data.session.user.id,
        });
        const routed = await withAuthTimeout(
          routeAfterAuth(data.session.user, { reason, selectedRole: portal || undefined }),
          'syncSessionFromSupabase.routeAfterAuth',
        );
        window.__aimeasyAuthBootstrapComplete = true;
        return routed;
      } finally {
        window.__aimeasyRoutingInProgress = false;
      }
    })().catch((error) => {
      console.warn('[AUTH] syncSessionFromSupabase failed', error);
      window.hideLoading?.();
      console.log('[AUTH] Auth Completed', { initialized: true, hasSession: false, error: error?.message || String(error) });
      return false;
    }).finally(() => {
      if (window.__aimeasyAuthBootstrapComplete === false) {
        window.__aimeasyAuthBootstrapComplete = true;
      }
      if (normalizeRole(window.APP?.role || window.APP?.user?.role) === ROLE.STUDENT) {
        window.setTimeout(() => window.updateSidebarProfile?.(), 0);
      }
      window.dispatchEvent(new CustomEvent('aimeasy:auth-bootstrap-complete'));
      window.__aimeasyAuthSyncInFlight = null;
      window.__aimeasyAuthRestoring = false;
      window.aimeasyRefreshProfile?.();
    });

    return window.__aimeasyAuthSyncInFlight;
  };

  // ─── Issue 7: Block teacher Google mock → creator shortcut ───
  if (window.googleSignIn) {
    window.googleSignIn = function googleSignInStudentOnly(accountType) {
      if (window.__aimeasyOAuthStartInFlight) return;
      const terms = document.getElementById('google-auth-terms');
      if (terms && !terms.checked) {
        window.showToast?.('Please accept the Terms & Conditions to continue.', 'red');
        return;
      }
      const selectedRole = isLiveWorkshopLoginRequest()
        ? 'live_workshop'
        : (normalizeRole(window.APP?.role || getStoredLoginPortal()) || ROLE.STUDENT);
      authLog(AUTH_STAGES.START, { accountType, selectedRole });
      if (selectedRole !== 'live_workshop') clearLiveWorkshopPortalMarker();
      setLoginPortal(selectedRole);
      window.__aimeasyOAuthStartInFlight = true;
      window.showLoading?.('Authenticating with Google...');
      return signInWithGoogle(selectedRole).catch((error) => {
        window.__aimeasyOAuthStartInFlight = false;
        window.hideLoading?.();
        window.showToast?.(`Google sign-in error: ${error.message || String(error)}`, 'red');
      });
    };
  }

  // ─── Role selection: portal in sessionStorage only (not role override) ───
  const origSelectRole = window.selectRoleAndNavigate;
  if (origSelectRole && !origSelectRole.isPatched) {
    window.selectRoleAndNavigate = function selectRoleAndNavigatePortal(role) {
      if (role === 'student') {
        clearLiveWorkshopPortalMarker();
        localStorage.removeItem('edusync_admin_session');
        if (window.APP) {
          window.APP.adminType = null;
          window.APP.subAdminData = null;
          window.APP.session = false;
          window.APP.user = null;
        }
        setLoginPortal(ROLE.STUDENT);
      }
      else if (role === 'teacher' || role === 'creator' || role === ROLE.CONTENT_CREATOR) {
        clearLiveWorkshopPortalMarker();
        openCreatorAccess();
        return;
      } else {
        clearLiveWorkshopPortalMarker();
        clearLoginPortal();
      }
      return origSelectRole.call(this, role);
    };
    window.selectRoleAndNavigate.isPatched = true;
  }

  const origProceed = window.proceedWithRole;
  if (origProceed && !origProceed.isPatched) {
    window.proceedWithRole = function proceedWithRolePortal() {
      const role = normalizeRole(window.APP?.role) || ROLE.STUDENT;
      if (role === ROLE.CONTENT_CREATOR) {
        clearLiveWorkshopPortalMarker();
        openCreatorAccess();
        return;
      }
      if (role === ROLE.STUDENT) {
        clearLiveWorkshopPortalMarker();
        localStorage.removeItem('edusync_admin_session');
        if (window.APP) {
          window.APP.adminType = null;
          window.APP.subAdminData = null;
          window.APP.session = false;
          window.APP.user = null;
        }
        window.__aimeasyPreserveRoleRoute = '';
        setLoginPortal(ROLE.STUDENT);
        // Business rule: if session exists, go straight to dashboard (skip onboarding).
        try {
          if (window.__AIMEASY_SUPABASE__?.auth?.getSession) {
            window.__AIMEASY_SUPABASE__.auth.getSession().then(({ data }) => {
              if (data?.session?.user) {
                routeExistingSessionToDashboard({ selectedRole: ROLE.STUDENT, reason: 'role-selection-existing-session' });
              } else {
                syncGoogleAuthScreen();
                window.showScreen?.('screen-google-auth');
                window.setTimeout(() => window.updateGoogleAuthTermsState?.(), 0);
              }
            });
            return;
          }
        } catch {
          /* ignore */
        }
        syncGoogleAuthScreen();
        window.showScreen?.('screen-google-auth');
        window.setTimeout(() => window.updateGoogleAuthTermsState?.(), 0);
        return;
      }
      syncGoogleAuthScreen();
      const result = origProceed.apply(this, arguments);
      window.setTimeout(() => window.updateGoogleAuthTermsState?.(), 0);
      return result;
    };
    window.proceedWithRole.isPatched = true;
  }

  // Remove localStorage role override wrappers
  try {
    localStorage.removeItem('aimeasy_active_role');
    localStorage.removeItem('aimeasy_oauth_role');
  } catch {
    /* ignore */
  }

  // ─── Profile submit → Supabase profiles + dashboard ───
  const origShowScreenForAuthGuard = window.showScreen;
  if (origShowScreenForAuthGuard && !origShowScreenForAuthGuard.isPatched) {
    window.showScreen = function showScreenAuthGuard(id, role) {
      if (id === 'screen-google-auth') {
        syncGoogleAuthScreen();
        if (window.APP?.session && window.APP?.user) {
          if (!window.__aimeasyAuthBootstrapComplete || window.__aimeasyAuthRestoring) return;
          window.syncSessionFromSupabase?.({ reason: 'blocked-auth-screen-authenticated' });
          return;
        }
 
        if (!window.__aimeasyAuthBootstrapComplete || window.__aimeasyAuthRestoring) return;
        window.__AIMEASY_SUPABASE__?.auth?.getSession?.().then(({ data }) => {
          if (data?.session?.user) {
            window.syncSessionFromSupabase?.({ reason: 'blocked-auth-screen-supabase-session' });
          }
        });
      }
 
      const result = origShowScreenForAuthGuard.call(this, id, role);
      if (id === 'screen-landing') {
        window.setTimeout(() => window.updateLandingStats?.(), 0);
      }
      return result;
    };
    window.showScreen.isPatched = true;
  }

  window.syncCreatorProfileFields = function syncCreatorProfileFields() {
    const isCreator = normalizeRole(window.APP?.user?.role || window.APP?.role) === ROLE.CONTENT_CREATOR;
    const roleFields = document.getElementById('creator-profile-fields');
    const collegeGroup = document.getElementById('profile-college-group');
    const academicStep = document.getElementById('step2');
    if (roleFields) roleFields.style.display = isCreator ? 'block' : 'none';
    if (collegeGroup) collegeGroup.style.display = isCreator ? 'none' : '';
    if (academicStep) academicStep.style.display = isCreator ? 'none' : '';
    const teacherFields = document.getElementById('creator-teacher-fields');
    if (teacherFields) {
      teacherFields.style.display = document.getElementById('p-role-type')?.value === 'teacher' ? 'block' : 'none';
    }
  };

  function setAcademicSubmitLoading(isLoading) {
    const button = document.querySelector('#profile-step2 button[onclick*="submitProfile"]');
    if (!button) return;
    if (isLoading) {
      if (!button.dataset.originalText) button.dataset.originalText = button.innerHTML;
      button.disabled = true;
      button.innerHTML = 'Saving...';
      button.setAttribute('aria-busy', 'true');
    } else {
      button.disabled = false;
      button.innerHTML = button.dataset.originalText || 'Go to Dashboard';
      button.removeAttribute('aria-busy');
    }
  }

  async function refreshProfileState() {
    try {
      const refreshed = await window.aimeasyRefreshProfile?.();
      window.dispatchEvent(new CustomEvent('aimeasy:profile-updated'));
      return refreshed;
    } catch (e) {
      console.warn('Profile state refresh failed:', e);
      return null;
    }
  }

  window.submitProfile = async function submitProfileDbBacked() {
    console.log('Button clicked');
    setAcademicSubmitLoading(true);
    const existing = { ...(window.APP?.user || {}) };
    const dbRole = normalizeRole(existing.role || window.APP?.role) || ROLE.STUDENT;
    try {
      if (dbRole === ROLE.CONTENT_CREATOR) {
        window.APP.user = {
          ...existing,
          ...(window.APP?.user || {}),
          role: dbRole,
          role_type: document.getElementById('p-role-type')?.value || existing.role_type,
          qualification: document.getElementById('p-qualification')?.value?.trim() || existing.qualification,
          experience: document.getElementById('p-experience')?.value?.trim() || existing.experience,
        };
        if (!isCreatorProfileComplete(window.APP.user)) {
          window.showToast?.('Please complete your profile details first.', 'red');
          return;
        }
        window.APP.session = true;
        window.showLoading?.('Saving your profile...');
        window.APP.user.role = normalizeRole(window.APP.user.role || window.APP?.role) || ROLE.STUDENT;
        const { profile, error } = await upsertProfileFromLegacy(window.APP.user, {
          id: window.APP.user.id || window.APP.user.googleId,
          email: window.APP.user.email,
        });
        if (error) {
          window.showToast?.('Could not save profile: ' + error.message, 'red');
          return;
        }
        if (profile) {
          console.log('Academic data saved');
          console.log('onboarding_completed updated');
          window.APP.user = profileToLegacyUser(profile);
        }
        localStorage.setItem('aiiens_session_user', JSON.stringify(window.APP.user));
        await refreshProfileState();
        clearLoginPortal();
        window.__aimeasyLastAuthRoute = null;
        console.log('Redirecting to dashboard');
        window.history?.replaceState?.({ aimeasyPath: '/creator', aimeasyIndex: 1 }, '', cleanHashUrl('/creator'));
        applyDashboardRedirect(window.APP.user);
        return;
      }

      const uni = document.getElementById('p-university')?.value?.trim();
      const reg = document.getElementById('p-regulation')?.value?.trim();
      const branch = document.getElementById('p-branch')?.value?.trim();
      const year = document.getElementById('p-year')?.value?.trim();
      const sem = document.getElementById('p-semester')?.value?.trim();
      if (!uni || !reg || !branch || !year || !sem) {
        window.showToast?.('Please fill all academic fields', 'red');
        return;
      }

      window.APP.user = {
        ...existing,
        ...(window.APP?.user || {}),
        university: uni,
        university_name: uni,
        university_id: existing.university_id || window.APP?.user?.university_id || null,
        regulation: reg,
        regulation_code: reg,
        regulation_id: existing.regulation_id || window.APP?.user?.regulation_id || null,
        branch,
        branch_name: branch,
        branch_id: existing.branch_id || window.APP?.user?.branch_id || null,
        year,
        semester: sem,
        role: dbRole,
      };
      window.APP.session = true;
      setCurrentBranch(branch);
      localStorage.setItem('aiiens_session_user', JSON.stringify(window.APP.user));
      if (window.APP.user.googleId) {
        localStorage.setItem('aiiens_user_' + window.APP.user.googleId, JSON.stringify(window.APP.user));
      }

      const supabase = window.__AIMEASY_SUPABASE__;
      if (!supabase) {
        window.showToast?.('Could not save profile: Supabase is not configured.', 'red');
        return;
      }
      if (!window.APP?.user?.id && !window.APP?.user?.googleId) {
        window.showToast?.('Could not save profile: missing authenticated user.', 'red');
        return;
      }
      if (!isProfileAcademicComplete(window.APP.user)) {
        window.showToast?.('Please fill all academic fields', 'red');
        return;
      }

      window.showLoading?.('Saving your profile...');
      window.APP.user.role = normalizeRole(window.APP.user.role || window.APP?.role) || ROLE.STUDENT;
      const { profile, error } = await upsertProfileFromLegacy(window.APP.user, {
        id: window.APP.user.id || window.APP.user.googleId,
        email: window.APP.user.email,
      });
      if (error) {
        window.showToast?.('Could not save profile: ' + error.message, 'red');
        return;
      }
      if (!profile) {
        window.showToast?.('Could not save profile. Please try again.', 'red');
        return;
      }

      console.log('Academic data saved');
      window.APP.user = profileToLegacyUser(profile);
      setCurrentBranch(window.APP.user.branch || window.APP.user.branch_name);
      if (!window.APP.user.onboarding_completed) {
        window.showToast?.('Could not complete onboarding. Please try again.', 'red');
        return;
      }
      console.log('onboarding_completed updated');
      localStorage.setItem('aiiens_session_user', JSON.stringify(window.APP.user));
      if (window.APP.user.googleId || window.APP.user.id) {
        localStorage.setItem('aiiens_user_' + (window.APP.user.googleId || window.APP.user.id), JSON.stringify(window.APP.user));
      }

      await refreshProfileState();
      clearLoginPortal();
      window.__aimeasyLastAuthRoute = null;
      authLog(AUTH_STAGES.REDIRECT_DASHBOARD, {});
      console.log('Redirecting to dashboard');
      window.history?.replaceState?.({ aimeasyPath: '/student', aimeasyIndex: 1 }, '', cleanHashUrl('/student'));
      applyDashboardRedirect(window.APP.user);
    } catch (error) {
      console.warn('submitProfile save failed:', error);
      window.showToast?.('Could not save profile: ' + (error?.message || String(error)), 'red');
    } finally {
      window.hideLoading?.();
      setAcademicSubmitLoading(false);
    }
  };

  window.profileStep2 = async function profileStep2Db() {
    const existing = { ...(window.APP?.user || {}) };
    const name = document.getElementById('p-name')?.value?.trim();
    const phone = document.getElementById('p-phone')?.value?.trim();
    const role = normalizeRole(existing.role || window.APP?.role) || ROLE.STUDENT;
    if (!name) {
  window.showToast?.('Please enter your full name.', 'red');
  return;
}

const college = document.getElementById('p-college')?.value?.trim();

if (role === ROLE.STUDENT && !college) {
  window.showToast?.('College name is mandatory.', 'red');
  return;
}
if (!name) {
  window.showToast?.('Please enter your full name.', 'red');
  return;
}
if (!phone) {
  window.showToast?.('Mobile number is mandatory.', 'red');
  return;
}

if (!/^[0-9]{10}$/.test(phone)) {
  window.showToast?.('Mobile number must be exactly 10 digits.', 'red');
  return;
}
    window.APP.user = {
      ...existing,
      name,
      full_name: name,
      phone,
      phone_number: phone,
      college: college || existing.college,
      role,
      role_type: document.getElementById('p-role-type')?.value || existing.role_type,
      qualification: document.getElementById('p-qualification')?.value?.trim() || existing.qualification,
      experience: document.getElementById('p-experience')?.value?.trim() || existing.experience,
    };
    if (role === ROLE.CONTENT_CREATOR && !isCreatorProfileComplete(window.APP.user)) {
      window.showToast?.('Complete the creator role details before continuing.', 'red');
      return;
    }
    const supabase = window.__AIMEASY_SUPABASE__;
    if (supabase && window.APP?.user) {
      if (!isProfilePersonalComplete(window.APP.user)) return;
      window.APP.user.role = normalizeRole(window.APP.user.role || window.APP?.role) || ROLE.STUDENT;
      const { profile, error } = await upsertProfileFromLegacy(window.APP.user, {
        id: window.APP.user.id || window.APP.user.googleId,
        email: window.APP.user.email,
      });
      if (error) {
        window.showToast?.('Could not save profile: ' + error.message, 'red');
        return;
      }
      if (profile) window.APP.user = profileToLegacyUser(profile);
      authLog(AUTH_STAGES.REDIRECT_ACADEMIC, {});
      if (window.APP.user.role === ROLE.CONTENT_CREATOR && isProfileFullyComplete(window.APP.user)) {
        clearLoginPortal();
        window.hideLoading?.();
        applyDashboardRedirect(window.APP.user);
      }
    }
    if (role !== ROLE.CONTENT_CREATOR) {
      document.getElementById('profile-step1').style.display = 'none';
      document.getElementById('profile-step2').style.display = 'block';
      document.getElementById('step1')?.classList.add('done');
      document.getElementById('step2')?.classList.add('active');
      window.history?.replaceState?.({ aimeasyPath: '/academic-details', aimeasyIndex: 1 }, '', cleanHashUrl('/academic-details'));
    }
  };

  // ─── Issue 4: Stop video on navigation ───
  if (window.navigateTo) {
    const origNav = window.navigateTo;
    window.navigateTo = function navigateToStopVideo(page) {
      stopVideoPlayer();
      return origNav.call(this, page);
    };
  }
  ['backToUnits', 'openSubject', 'openUnit', 'switchTab'].forEach((fn) => {
    if (!window[fn]) return;
    const orig = window[fn];
    window[fn] = function patchedStopVideo(...args) {
      const nextTab = fn === 'switchTab' ? String(args[0] || '') : '';
      const leavingVideos = fn !== 'switchTab' || (window.APP?.currentTab === 'videos' && nextTab !== 'videos');
      if (leavingVideos) stopVideoPlayer();
      const result = orig.apply(this, args);
      if (fn === 'switchTab' && nextTab === 'videos') {
        window.aimeasyResumeStudentVideo?.();
      }
      return result;
    };
  });

  // ─── Issue 5: Live search ───
  window.handleSearch = async function handleSearchLive(query) {
    const q = String(query || '').trim();
    let box = document.getElementById('search-results-dropdown');
    if (!box) {
      const wrap = document.getElementById('global-search')?.closest('.search-wrap') || document.getElementById('global-search')?.parentElement;
      if (wrap) {
        box = document.createElement('div');
        box.id = 'search-results-dropdown';
        box.className = 'search-results-dropdown';
        wrap.appendChild(box);
      }
    }
    if (!q) {
      if (box) box.innerHTML = '';
      return;
    }
    const results = await searchStudentContent(q);
    if (!box) return;
    if (!results.length) {
      box.innerHTML = '<div class="search-result-empty">No matches found</div>';
      return;
    }
    box.innerHTML = results
      .map(
        (r, i) =>
          `<button type="button" class="search-result-item" data-idx="${i}"><strong>${r.label}</strong><span>${r.sub || r.type}</span></button>`,
      )
      .join('');
    box.querySelectorAll('.search-result-item').forEach((btn) => {
      btn.addEventListener('click', () => {
        const r = results[Number(btn.dataset.idx)];
        if (r?.action?.kind === 'legacySubject' && r.action.raw) {
          window.openSubject?.(r.action.raw);
        } else if (r?.action?.kind === 'subject') {
          window.navigateTo?.('subjects');
          window.setTimeout(async () => {
            if (typeof window.renderSubjects === 'function') await window.renderSubjects();
            const subject = window.APP?.subjects?.find(
              (s) => s.id === r.action.id || s.name === r.action.name,
            );
            if (subject) {
              window.openSubject?.(subject.id);
              window.showToast?.(`Opened ${r.label}`, 'green');
            } else {
              window.showToast?.(`Subject: ${r.label}`, 'blue');
            }
          }, 200);
        } else if (r?.action?.kind === 'content') {
          window.navigateTo?.('unit-content');
          window.switchTab?.(r.action.item?.content_type === 'note' ? 'notes' : r.action.item?.content_type === 'pyq' ? 'pyq' : r.action.item?.content_type === 'iq' ? 'iq' : 'videos');
          window.showToast?.(`Opened ${r.label}`, 'green');
        } else {
          window.navigateTo?.('unit-content');
          window.switchTab?.('videos');
        }
        box.innerHTML = '';
      });
    });
  };

  // ─── Issue 6: subAdminBack must not clear student session ───
  window.subAdminBack = function subAdminBackNavOnly() {
    window.showScreen?.('screen-landing');
    window.history?.replaceState?.({ aimeasyPath: '/landing', aimeasyIndex: 0 }, '', cleanHashUrl('/landing'));
  };

  // ─── Issue 8: Admin dashboard from DB ───
  window.renderAdminDashboardLive = async function renderAdminDashboardLiveDb() {
    const stats = await fetchAdminDashboardStats();
    const content = document.getElementById('admin-content');
    if (!content) return;
    if (!stats) {
      content.innerHTML = '<p style="padding:1rem;color:var(--text2);">Connect Supabase to load live dashboard metrics.</p>';
      return;
    }
    content.innerHTML = `
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:12px;">
        ${[
          ['Total Students', stats.students],
          ['Total Users', stats.users],
          ['Total Content Creators', stats.creators],
          ['Total Sub Admins', stats.subAdmins],
          ['Total Subjects', stats.subjects],
          ['Total Branches', stats.branches],
          ['Total Semesters', stats.semesters],
          ['Total Units', stats.units],
          ['Total Topics', stats.topics],
          ['Total Videos', stats.videos],
          ['Total Notes', stats.notes],
          ['Total PYQs', stats.pyqs],
          ['Total Regulations', stats.regulations],
        ]
          .map(
            ([label, val]) => `
          <div class="admin-stat-card">
            <div style="font-size:2rem;font-weight:800;">${val}</div>
            <div style="font-size:0.8rem;color:var(--text2);">${label}</div>
          </div>`,
          )
          .join('')}
      </div>
      <p style="margin-top:1rem;font-size:0.82rem;color:var(--text3);">Live database counts from Supabase.</p>`;
  };

  window.updateLandingStats = async function updateLandingStatsLive() {
    const setText = (id, value) => {
      const element = document.getElementById(id);
      if (element) element.textContent = String(value ?? 0);
    };

    setText('stat-students', 0);
    setText('stat-subjects', 0);
    setText('stat-pyqs', 0);
    setText('stat-satisfaction', 0);
    setText('stat-workshop-participants', 0);

    const stats = await fetchLandingStats();
    setText('stat-students', stats.signups || stats.users || stats.students);
    setText('stat-subjects', stats.subjects);
    setText('stat-pyqs', stats.creators);
    setText('stat-satisfaction', stats.regulations);
    setText('stat-workshop-participants', stats.workshopParticipants);
  };
  window.setTimeout(() => window.updateLandingStats?.(), 0);

  // ─── Issue 9: Profile dropdowns from DB ───
  document.addEventListener('DOMContentLoaded', () => {
    hydrateProfileAcademicDropdowns();
  });
  window.setTimeout(() => hydrateProfileAcademicDropdowns(), 500);

  // ─── Issue 3: Persist v10 uploads to content_items when possible ───
  window.aimeasyPersistContent = async function aimeasyPersistContent(payload) {
    if (window.APP?.subAdminData?.username) payload = { ...payload, createdBy: window.APP.subAdminData.username };
    const { data, error } = await createContentItem(payload);
    if (error) {
      window.showToast?.('Save failed: ' + error.message, 'red');
      return null;
    }
    notifyCurriculumChanged({ type: 'content' });
    return data;
  };

  window.aimeasyListContent = listContentItems;
  window.aimeasyDeleteContent = withCurriculumRefresh(deleteContentItem, 'content');
  window.aimeasyUpdateContent = withCurriculumRefresh(updateContentItem, 'content');
  window.aimeasyNormalizeContentType = normalizeContentType;
  function notifyCurriculumChanged(detail = {}) {
    window.dispatchEvent(new CustomEvent('aimeasy:data-changed', { detail }));
    window.aiiensRefreshActiveAdminSurfaces?.();
    if (document.querySelector('.screen.active')?.id === 'screen-app' && window.APP?.currentSubject && window.APP?.currentUnit) {
      const subjectId = window.APP.currentSubject.id || window.APP.currentSubject.rawId || window.APP.currentSubject;
      const unitId = window.APP.currentUnit;
      window.renderVideoList?.(subjectId, unitId);
      window.renderNotes?.(subjectId, unitId);
      window.renderPYQ?.(null, subjectId, unitId);
      window.renderIQ?.(subjectId, unitId);
    }
    window.renderSubAdminDashboardLive?.();
    window.renderAdminDashboardLive?.();
    window.updateLandingStats?.();
  }

  function withCurriculumRefresh(fn, type) {
    return async function refreshedCurriculumMutation(...args) {
      const result = await fn(...args);
      if (!result?.error) notifyCurriculumChanged({ type });
      return result;
    };
  }

  window.aimeasyFetchAdminDashboardStats = fetchAdminDashboardStats;
  window.aimeasySaveUnitRoadmap = withCurriculumRefresh(saveUnitRoadmap, 'roadmap');
  window.aimeasyFetchUnitRoadmap = fetchUnitRoadmap;
  window.aimeasySaveLinkedContentItem = withCurriculumRefresh(async (payload) => { if (window.APP?.subAdminData?.username) { payload = { ...payload, createdBy: window.APP.subAdminData.username }; } return saveLinkedContentItem(payload); }, 'content');
  window.aimeasyFetchCurriculumStats = fetchCurriculumStats;
  window.aimeasyFetchSubjects = fetchSubjects;
  window.aimeasyCreateSubject = withCurriculumRefresh(async (subj) => { if (window.APP?.subAdminData?.username) { subj = { ...subj, createdBy: window.APP.subAdminData.username }; } return createSubject(subj); }, 'subject');
  window.aimeasyUpdateSubject = withCurriculumRefresh(updateSubject, 'subject');
  window.aimeasyDeleteSubject = withCurriculumRefresh(deleteSubject, 'subject');
  window.aimeasyFetchUnits = fetchUnits;
  window.aimeasyCreateUnit = withCurriculumRefresh(createUnit, 'unit');
  window.aimeasyUpdateUnit = withCurriculumRefresh(updateUnit, 'unit');
  window.aimeasyDeleteUnit = withCurriculumRefresh(deleteUnit, 'unit');
  window.aimeasyCreateCurriculumBlueprint = createCurriculumBlueprint;
  window.aimeasyListCurriculums = listCurriculums;
  window.aimeasyListCurriculumContent = listCurriculumContent;
  window.aimeasySaveCurriculumContent = saveCurriculumContent;
  window.aimeasyUpdateCurriculumStatus = updateCurriculumStatus;
  window.aimeasyFetchWorkflowDashboardCounts = fetchWorkflowDashboardCounts;

  window.renderSubAdminDashboardLive = async function renderSubAdminDashboardLiveDb() {
    const activeSaTab = document.querySelector('.admin-nav-item.active')?.id?.replace('sa-nav-', '');
    if (activeSaTab && activeSaTab !== 'dashboard') return;
    const content = document.getElementById('sa-content');
    if (!content) return;
    const sa = window.APP?.subAdminData || {};
    const { data, error } = await fetchCurriculumStats(sa.username);
    if (error || !data) {
      content.innerHTML = '<p style="padding:1rem;color:var(--text2);">Connect Supabase to load live dashboard metrics.</p>';
      return;
    }
    const cards = [
      ['Total Subjects', data.subjects, 'var(--primary)'],
      ['Total Units', data.units, 'var(--teal)'],
      ['Total Topics', data.topics, 'var(--lavender)'],
      ['Total Videos', data.videos, 'var(--blue)'],
      ['Total Notes', data.notes, 'var(--amber)'],
      ['Total PYQs', data.pyqs, 'var(--green)'],
      ['Important Questions', data.iqs, 'var(--red)'],
      ['Learning Roadmap Topics', data.roadmapTopics, 'var(--primary)'],
    ];
    content.innerHTML = `
      <div style="padding:2rem;max-width:1100px;margin:0 auto;width:100%;">
        <div style="margin-bottom:1.6rem;">
          <h2 style="font-size:1.4rem;font-weight:800;letter-spacing:-0.02em;margin-bottom:4px;">Sub Admin Dashboard</h2>
          <p style="font-size:0.82rem;color:var(--text3);">Live curriculum metrics from Supabase.</p>
        </div>
        <div class="admin-grid" style="margin-bottom:1.6rem;">
          ${cards.map(([label, value, color]) => `
            <div class="admin-stat-card">
              <div class="admin-stat-accent" style="background:${color};"></div>
              <div style="font-size:2.1rem;font-weight:800;color:${color};">${value}</div>
              <div style="font-size:0.84rem;font-weight:600;margin-top:4px;">${label}</div>
            </div>`).join('')}
        </div>
      </div>`;
  };

  window.__AIMEASY_SUPABASE__?.channel?.('curriculum-dashboard')
    ?.on('postgres_changes', { event: '*', schema: 'public', table: 'subjects' }, () => notifyCurriculumChanged({ type: 'subject' }))
    ?.on('postgres_changes', { event: '*', schema: 'public', table: 'units' }, () => notifyCurriculumChanged({ type: 'unit' }))
    ?.on('postgres_changes', { event: '*', schema: 'public', table: 'topics' }, () => notifyCurriculumChanged({ type: 'topic' }))
    ?.on('postgres_changes', { event: '*', schema: 'public', table: 'topic_videos' }, () => notifyCurriculumChanged({ type: 'video' }))
    ?.on('postgres_changes', { event: '*', schema: 'public', table: 'content_items' }, () => notifyCurriculumChanged({ type: 'content' }))
    ?.on('postgres_changes', { event: '*', schema: 'public', table: 'live_workshop_registrations' }, () => window.updateLandingStats?.())
    ?.on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => {
      notifyCurriculumChanged({ type: 'role_profile' });
    })
    ?.subscribe?.();

  function normalizeRequestedMenuLabels() {
    const saSubjects = document.getElementById('sa-nav-subjects');
    const saCurriculum = document.getElementById('sa-nav-curriculum');
    const crDashboard = document.getElementById('cr-nav-dashboard');
    const crChoose = document.getElementById('cr-nav-choosing');
    const crAdded = document.getElementById('cr-nav-addcontent');
    if (saSubjects) saSubjects.innerHTML = '<span>📚</span> Create Subject';
    if (saCurriculum) saCurriculum.innerHTML = '<span>🗂️</span> Curriculum';
    if (crDashboard) crDashboard.innerHTML = '<span>📊</span> Dashboard';
    if (crChoose) crChoose.innerHTML = '<span>➕</span> Choose';
    if (crAdded) crAdded.innerHTML = '<span>✅</span> Added';
  }
  normalizeRequestedMenuLabels();
  window.addEventListener('load', () => window.setTimeout(normalizeRequestedMenuLabels, 0));

  function wrapContentUpload(fnName, contentType) {
    const orig = window[fnName];
    if (!orig) return;
    window[fnName] = async function wrappedContentUpload(...args) {
      const result = orig.apply(this, args);
      const supabase = window.__AIMEASY_SUPABASE__;
      if (!supabase) return result;
      try {
        const subjectName = args[0];
        const unitId = args[1];
        const subj = (JSON.parse(localStorage.getItem('edusync_custom_subjects') || '[]')).find(
          (s) => s.name === subjectName,
        );
        if (subj?.dbSubjectId && subj?.dbUnitIds?.[unitId]) {
          const payload = { subjectId: subj.dbSubjectId, unitId: subj.dbUnitIds[unitId], contentType };
          if (contentType === 'note') {
            payload.title = document.getElementById('v10-ntitle-' + unitId)?.value || 'Note';
            payload.url = document.getElementById('v10-nlink-' + unitId)?.value || '';
          }
          if (contentType === 'pyq') {
            payload.title = document.getElementById('v10-pyqtxt-' + unitId)?.value?.slice(0, 80) || 'PYQ';
            payload.body = document.getElementById('v10-pyqtxt-' + unitId)?.value || '';
          }
          const saved = await createContentItem(payload);
          if (saved.error) window.showToast?.('DB save failed: ' + saved.error.message, 'red');
        }
      } catch (e) {
        console.warn(fnName, 'db mirror failed', e);
      }
      return result;
    };
  }

  // wrapContentUpload('v10UploadNote', 'note');
  // wrapContentUpload('v10UploadPYQ', 'pyq');
  // wrapContentUpload('v10UploadIQ', 'iq');

  if (window.__AIMEASY_SUPABASE__) {
    window.setTimeout(async () => {
      await window.syncSessionFromSupabase?.({ reason: 'app-boot' });
    }, 0);
  }

  // Auth state listener → student router only
  window.syncGoogleAuthScreen = syncGoogleAuthScreen;
}
