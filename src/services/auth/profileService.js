import { supabase } from '../supabase/client.js';
import { authLog, AUTH_STAGES } from './authLogger.js';
import { ROLE, normalizeRole } from './roleRedirectService.js';

const PORTAL_ROLE = {
  student: ROLE.STUDENT,
  creator: ROLE.CONTENT_CREATOR,
  teacher: ROLE.CONTENT_CREATOR,
  content_creator: ROLE.CONTENT_CREATOR,
  subadmin: ROLE.SUBADMIN,
  admin: ROLE.ADMIN,
};

const profileRequestCache = new Map();
const LOGIN_PORTAL_KEY = 'aimeasy_login_portal';
const LOGIN_PORTAL_BACKUP_KEY = 'aimeasy_login_portal_backup';
const ROLE_PROFILE_TABLE = 'profiles';
const LEGACY_PROFILE_TABLE = 'profiles';

function profileCacheKey(authUserId, role = '') {
  return `${authUserId || ''}:${normalizeRole(role) || ''}`;
}

function rememberProfile(row) {
  const authId = row?.id;
  if (!authId) return;
  const result = Promise.resolve({ profile: row, error: null });
  profileRequestCache.set(profileCacheKey(authId, 'legacy'), result);
  profileRequestCache.set(profileCacheKey(authId, row.role), result);
}

function isMissingTableError(error) {
  const message = String(error?.message || '');
  return error?.code === 'PGRST205' ||
    error?.code === '42P01' ||
    message.includes('Could not find the table') ||
    message.includes('relation "public.role_profiles" does not exist');
}

async function maybeSingleProfile(table, { authUserId, email, role }) {
  let query = supabase.from(table).select('*');
  if (authUserId) query = query.eq('id', authUserId);
  if (email) query = query.ilike('email', email);
  if (role) query = query.eq('role', role);
  return query.maybeSingle();
}

async function firstProfile(table, { authUserId, email }) {
  let query = supabase.from(table).select('*');
  if (authUserId) query = query.eq('id', authUserId);
  if (email) query = query.ilike('email', email);
  const { data, error } = await query.limit(1);
  return { data: data?.[0] || null, error };
}

async function fetchRoleScopedProfile(filters) {
  const { data, error } = filters.role
    ? await maybeSingleProfile(ROLE_PROFILE_TABLE, filters)
    : await firstProfile(ROLE_PROFILE_TABLE, filters);

  if (error && isMissingTableError(error)) return { data: null, error: null, unavailable: true };
  return { data, error, unavailable: false };
}

async function fetchLegacyProfile(filters) {
  return filters.role
    ? maybeSingleProfile(LEGACY_PROFILE_TABLE, filters)
    : maybeSingleProfile(LEGACY_PROFILE_TABLE, filters);
}

function forgetProfile(authUserId) {
  if (!authUserId) return;
  for (const key of profileRequestCache.keys()) {
    if (key.startsWith(`${authUserId}:`)) profileRequestCache.delete(key);
  }
}

export function getLoginPortal() {
  try {
    return sessionStorage.getItem(LOGIN_PORTAL_KEY) || localStorage.getItem(LOGIN_PORTAL_BACKUP_KEY) || null;
  } catch {
    return null;
  }
}

export function setLoginPortal(portal) {
  try {
    if (portal) {
      sessionStorage.setItem(LOGIN_PORTAL_KEY, portal);
      localStorage.setItem(LOGIN_PORTAL_BACKUP_KEY, portal);
    } else {
      sessionStorage.removeItem(LOGIN_PORTAL_KEY);
      localStorage.removeItem(LOGIN_PORTAL_BACKUP_KEY);
    }
  } catch {
    /* ignore */
  }
}

export function clearLoginPortal() {
  setLoginPortal(null);
}

export function portalMismatchMessage(portal, dbRole) {
  const portalLabel = {
    student: 'Student Portal',
    creator: 'Content Creator Portal',
    content_creator: 'Content Creator Portal',
    subadmin: 'Sub Admin Portal',
    admin: 'Admin Portal',
  };
  const roleLabel = {
    student: 'Student Portal',
    creator: 'Content Creator Portal',
    content_creator: 'Content Creator Portal',
    subadmin: 'Sub Admin Portal',
    admin: 'Admin Portal',
  };
  const expected = portalLabel[portal] || portal;
  const actual = roleLabel[dbRole] || dbRole;
  return `This account belongs to ${actual}. Please use ${actual} to sign in. (You tried ${expected})`;
}

export function isProfilePersonalComplete(profile) {
  const p = profile || {};
  return !!((p.full_name || p.name) && (p.phone_number || p.phone));
}

export function isCreatorProfileComplete(profile) {
  const p = profile || {};
  if (!isProfilePersonalComplete(p) || !p.role_type) return false;
  if (p.role_type !== 'teacher') return true;
  return !!(p.qualification && p.experience);
}

export function isStudentPersonalComplete(profile) {
  return isProfilePersonalComplete(profile) && !!profile?.college;
}

export function isProfileAcademicComplete(profile) {
  const p = profile || {};

  return !!(
    (p.university || p.university_name || p.university_id) &&
    (p.regulation || p.regulation_code || p.regulation_id) &&
    (p.branch || p.branch_name || p.branch_id) &&
    p.year &&
    p.semester
  );
}

export function isProfileFullyComplete(profile) {
  return !!profile?.onboarding_completed;
}

export function profileToLegacyUser(row) {
  if (!row) return null;
  const branch = row.branch_name || row.branch || '';
  return {
    id: row.id,
    googleId: row.id,
    email: row.email,
    role: normalizeRole(row.role),
    name: row.full_name || row.name,
    full_name: row.full_name || row.name,
    phone: row.phone_number || row.phone,
    phone_number: row.phone_number || row.phone,
    college: row.college,
    role_type: row.role_type,
    qualification: row.qualification,
    experience: row.experience,
    university: row.university_name || '',
    university_id: row.university_id,
    regulation: row.regulation_code || '',
    regulation_id: row.regulation_id,
    branch,
    branch_name: branch,
    branch_id: row.branch_id,
    year: row.year,
    semester: row.semester,
    photo: row.photo_url || '',
    onboarding_completed: !!row.onboarding_completed,
  };
}

export async function fetchProfileByAuthId(authUserId) {
  return fetchProfileByAuthIdAndRole(authUserId, normalizeRole(getLoginPortal()));
}

export async function fetchProfileByAuthIdAndRole(authUserId, role) {
  if (!supabase || !authUserId) return { profile: null, error: null };
  const normalizedRole = normalizeRole(role);
  const key = profileCacheKey(authUserId, normalizedRole || 'legacy');
  if (profileRequestCache.has(key)) return profileRequestCache.get(key);

  const request = (async () => {
    let data = null;
    let error = null;

    if (normalizedRole) {
      const roleScoped = await fetchRoleScopedProfile({ authUserId, role: normalizedRole });
      data = roleScoped.data;
      error = roleScoped.error;
      if (!data && !error) {
        const legacy = await fetchLegacyProfile({ authUserId, role: normalizedRole });
        data = legacy.data;
        error = legacy.error;
      }
    } else {
      const legacy = await fetchLegacyProfile({ authUserId });
      data = legacy.data;
      error = legacy.error;
      if (!data && !error) {
        const roleScoped = await fetchRoleScopedProfile({ authUserId });
        data = roleScoped.data;
        error = roleScoped.error;
      }
    }

    if (error) {
      console.warn('fetchProfileByAuthId error', error.message);
      profileRequestCache.delete(key);
      return { profile: null, error };
    }
    if (data) {
      authLog(AUTH_STAGES.PROFILE_EXISTS, { id: authUserId, role: data.role });
      console.log('[AUTH] Profile Loaded', {
        userId: authUserId,
        role: data.role,
        onboarding_completed: Boolean(data.onboarding_completed),
      });
    } else authLog(AUTH_STAGES.PROFILE_NOT_FOUND, { id: authUserId, role: normalizedRole });
    return { profile: data, error: null };
  })();

  profileRequestCache.set(key, request);
  return request;
}

export async function fetchProfileByEmail(email, role) {
  if (!supabase || !email) return { profile: null, error: null };
  const normalizedRole = normalizeRole(role);
  let data = null;
  let error = null;

  if (normalizedRole) {
    const roleScoped = await fetchRoleScopedProfile({ email, role: normalizedRole });
    data = roleScoped.data;
    error = roleScoped.error;
    if (!data && !error) {
      const legacy = await fetchLegacyProfile({ email, role: normalizedRole });
      data = legacy.data;
      error = legacy.error;
    }
  } else {
    const legacy = await fetchLegacyProfile({ email });
    data = legacy.data;
    error = legacy.error;
    if (!data && !error) {
      const roleScoped = await fetchRoleScopedProfile({ email });
      data = roleScoped.data;
      error = roleScoped.error;
    }
  }

  if (error) {
    console.warn('fetchProfileByEmail error', error.message);
    return { profile: null, error };
  }
  if (data) rememberProfile(data);
  return { profile: data, error: null };
}

export async function ensureProfileForAuthUser(authUser, selectedRole = ROLE.STUDENT) {
  if (!supabase || !authUser?.id) return { profile: null, error: new Error('No Supabase session') };
  const role = normalizeRole(selectedRole) || ROLE.STUDENT;

  const found = await fetchProfileByAuthIdAndRole(authUser.id, role);
  if (found.profile || found.error) return found;

  const byEmail = await fetchProfileByEmail(authUser.email, role);
  if (byEmail.profile || byEmail.error) return byEmail;

  const row = {
    id: authUser.id,
    email: authUser.email || null,
    role,
    full_name: authUser.user_metadata?.full_name || authUser.user_metadata?.name || null,
    onboarding_completed: false,
  };

  forgetProfile(authUser.id);
  const { data, error } = await upsertRoleScopedProfile(row, authUser.id);

  if (error) {
    console.warn('ensureProfileForAuthUser error', error.message);
    return { profile: null, error };
  }

  rememberProfile(data);
  authLog(AUTH_STAGES.PROFILE_CREATED, { id: authUser.id, email: row.email, role: row.role });
  console.log('[AUTH] Profile Created', {
    userId: authUser.id,
    role: data.role,
    onboarding_completed: Boolean(data.onboarding_completed),
  });
  return { profile: data, error: null, created: true };
}

async function upsertRoleScopedProfile(row, authUserId) {
  forgetProfile(authUserId);
  const roleScoped = await supabase
    .from(ROLE_PROFILE_TABLE)
    .upsert({ ...row, id: authUserId }, { onConflict: 'id' })
    .select()
    .single();
  if (!roleScoped.error || !isMissingTableError(roleScoped.error)) return roleScoped;

  return supabase
    .from(LEGACY_PROFILE_TABLE)
    .upsert({ ...row, id: authUserId }, { onConflict: 'id' })
    .select()
    .single();
}

export async function ensureStudentProfile(authUser) {
  return ensureProfileForAuthUser(authUser, ROLE.STUDENT);
}

export async function upsertProfileFromLegacy(user, authUser) {
  if (!supabase || !authUser?.id) return { profile: null, error: new Error('No Supabase session') };
  const requestedRole = normalizeRole(user.role || getLoginPortal()) || ROLE.STUDENT;
  const existing = await fetchProfileByAuthIdAndRole(authUser.id, requestedRole);
  const role = normalizeRole(existing.profile?.role || requestedRole) || ROLE.STUDENT;
  const onboardingComplete =
    role === ROLE.CONTENT_CREATOR
      ? isCreatorProfileComplete(user)
      : isStudentPersonalComplete(user) && isProfileAcademicComplete(user);
  const row = {
    id: authUser.id,
    email: authUser.email || user.email,
    role,
    full_name: user.full_name || user.name || null,
    name: user.name || user.full_name || null,
    phone: user.phone_number || user.phone || null,
    phone_number: user.phone_number || user.phone || null,
    college: user.college || null,
    role_type: user.role_type || null,
    qualification: user.role_type === 'teacher' ? user.qualification || null : null,
    experience: user.role_type === 'teacher' ? user.experience || null : null,
    university_id: user.university_id || null,
    university_name: user.university || user.university_name || null,
    regulation_id: user.regulation_id || null,
    regulation_code: user.regulation || user.regulation_code || null,
    branch_id: user.branch_id || null,
    branch_name: user.branch || user.branch_name || null,
    year: user.year || null,
    semester: user.semester || null,
    photo_url: user.photo || user.photo_url || null,
    onboarding_completed: onboardingComplete,
    onboarding_completed_at: onboardingComplete ? new Date().toISOString() : null,
  };
  const { data, error } = await upsertRoleScopedProfile(row, authUser.id);
  if (data) rememberProfile(data);
  return { profile: data, error };
}

export function validatePortalRole(portal, dbRole) {
  const expected = PORTAL_ROLE[portal];
  const actual = normalizeRole(dbRole);
  if (!expected || !actual) return { ok: false, message: 'Invalid portal or role.' };
  if (expected !== actual) {
    authLog(AUTH_STAGES.ROLE_MISMATCH, { portal, dbRole });
    return { ok: false, message: portalMismatchMessage(portal, actual) };
  }
  return { ok: true, message: '' };
}
