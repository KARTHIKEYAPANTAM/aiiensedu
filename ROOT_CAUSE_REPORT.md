# Root Cause Report — OAuth / Session / Navigation Failures

## Executive Summary

OAuth PKCE exchange could succeed while the application immediately reported `hasSession: false`, skipped post-auth routing, and issued unauthenticated database requests (401). The failures were caused by **startup race conditions** in the auth bootstrap path, not by Cloud Workstations URLs or hardcoded localhost logic in application source code.

---

## Root Cause 1 — AuthProvider boot race (PRIMARY)

**Symptom:** `exchangeCodeForSession` logs success; AuthProvider logs `hasSession: false`; only PKCE verifier visible in localStorage.

**Mechanism:**

1. On OAuth return (`?code=...`), `AuthProvider` called `getSessionOnce()` **before** the PKCE code was exchanged.
2. That call cached a **null session for up to 5 seconds** (`SESSION_CACHE_TTL` in `authService.js`).
3. `onAuthStateChange` ignored `SIGNED_IN` events while init was in flight (`if (!initCompleteRef.current) return`).
4. Init completed with `hasSession: false` even though exchange later succeeded.
5. React state stayed null; legacy routing saw no session; Supabase REST calls ran as **anon** → 401 on `subjects`, `units`, `topics`, `content_items`.

**Affected files / lines:**

| File | Lines | Issue |
|------|-------|-------|
| `src/services/auth/AuthProvider.jsx` | 145–181, 193–198 | Init `getSessionOnce()` before OAuth exchange; dropped auth events during init |
| `src/services/auth/authService.js` | 100–120 | Session cache could serve stale null during OAuth callback |

---

## Root Cause 2 — Late `window.__AIMEASY_SUPABASE__` assignment

**Symptom:** `syncSessionFromSupabase` returned `false` on early boot; OAuth navigation marked handled and never retried.

**Mechanism:**

1. Legacy auth/sync code reads `window.__AIMEASY_SUPABASE__`.
2. That global was only set inside `AuthenticatedLegacyApp` **after** React auth loading finished.
3. `installCriticalFixes.js` app-boot hook (line ~1076) and early navigation handlers could run when the global was still `undefined`.
4. `installBrowserNavigation.js` set `oauthNavigationHandled = true` **before** sync succeeded, blocking retry.

**Affected files / lines:**

| File | Lines | Issue |
|------|-------|-------|
| `src/App.jsx` | 88 (before fix) | `__AIMEASY_SUPABASE__` set too late |
| `src/legacy/installCriticalFixes.js` | 214–215, 1076–1079 | Sync aborted when global missing |
| `src/legacy/installBrowserNavigation.js` | 238–241, 517–521 | OAuth flag set before successful sync |

---

## Root Cause 3 — OAuth success not validated

**Symptom:** Log said "OAuth callback session restored" but no `sb-*-auth-token` in localStorage.

**Mechanism:** `exchangeOAuthCodeOnce()` treated any non-error response as success without checking `data.session`. A consumed/empty exchange could log success while leaving no persisted session.

**Affected files / lines:**

| File | Lines | Issue |
|------|-------|-------|
| `src/services/auth/authService.js` | 88–95 (before fix) | No session validation after exchange |

---

## Root Cause 4 — Loading overlay crash

**Symptom:** Uncaught exception during Google sign-in / OAuth handling.

**Mechanism:** Legacy `showLoading()` / `hideLoading()` dereferenced `#loading-overlay` without a null check. During early OAuth (before `LegacyAppShell` mounts), the DOM element does not exist.

**Affected files / lines:**

| File | Lines | Issue |
|------|-------|-------|
| `src/legacy/utils/helpers.js` | 1–12 | Missing null guard on overlay element |

---

## Root Cause 5 — `routeAfterAuth` never reached (downstream of RC1/RC2)

**Symptom:** User stuck on landing/auth; dashboard navigation skipped.

**Mechanism:** `syncSessionFromSupabase()` exits early at "Session Missing" when `getSessionOnce()` returns null after failed/skipped OAuth completion. Without a session user object, `routeAfterAuth()` is never called with valid auth context.

**Affected files / lines:**

| File | Lines | Issue |
|------|-------|-------|
| `src/legacy/installCriticalFixes.js` | 317–321, 350–359 | Session guard blocks routing |
| `src/services/auth/postAuthRouter.js` | 110+ | Never invoked without session |

---

## Investigation Answers

| Question | Finding |
|----------|---------|
| **1. Why exchange succeeds but session missing?** | Boot race: cached null session + ignored `SIGNED_IN` + no post-exchange session verification. |
| **2. Why only PKCE verifier in localStorage?** | Verifier is written at OAuth start; auth token (`sb-*-auth-token`) is written only after successful exchange + persist. Exchange appeared successful in logs but React/legacy path never confirmed persisted session. |
| **3. Why AuthProvider `hasSession:false`?** | Init completed before OAuth exchange; auth state events during init were discarded. |
| **4. Cloud Workstations URLs?** | **Not a code bug.** `redirectTo` uses `window.location.origin + pathname + #/auth` dynamically. Cloud Workstations URL must be registered in Supabase Auth redirect allow-list. |
| **5. Localhost assumptions?** | **Not in auth source.** `package.json` dev script binds `127.0.0.1`; runtime OAuth uses current origin. |
| **6. Supabase redirect mismatch?** | Possible **deployment** issue if Cloud Workstations origin is not in Supabase dashboard; would cause exchange errors (not the primary in-app race). |
| **7. Startup race?** | **Yes — primary root cause.** |
| **8. RLS causing 401?** | **Secondary.** 401s occur because requests ran without JWT (anon) when session was missing. RLS expects `authenticated` role for protected tables. |
| **9. DB requests before auth completes?** | **Yes.** `hydrateLegacyState()` and curriculum fetches could run while AuthProvider still reported no session. |

---

## Not Root Causes (ruled out)

- Dual Supabase clients (single `createClient` in `client.js`)
- Storage bridge intercepting `sb-*` keys (bridge only intercepts `edusync_` / `aiiens_` / `aimeasy_` prefixes)
- Hardcoded localhost in OAuth redirect URL construction
