# Fix Report — OAuth Session Restoration

## Changes Implemented

### 1. `src/services/supabase/client.js`

**Change:** Assign `window.__AIMEASY_SUPABASE__` and `window.supabase` immediately when the client is created.

**Reason:** Legacy sync/routing code requires the global Supabase client before React mounts.

---

### 2. `src/services/auth/authService.js`

**Changes:**

- Added `parseOAuthCodeFromUrl()`, `clearOAuthParamsFromUrl()`, `completeOAuthCallbackFromUrl()`.
- Centralized deduplicated OAuth callback promise on `window.__aimeasyOAuthCallbackPromise`.
- `exchangeOAuthCodeOnce()` now validates `data.session` exists and throws if missing.
- Post-exchange session verification via `getSession()`.

**Reason:** Single authoritative OAuth completion path; prevent false-positive "success" logs without persisted session.

---

### 3. `src/services/auth/AuthProvider.jsx`

**Changes:**

- On OAuth callback URL, await `completeOAuthCallbackFromUrl()` **before** `getSessionOnce()`.
- Queue auth state events received during init (`pendingAuthEventRef`) and apply after init completes.
- Set `window.__Aimeasy_SUPABASE__` fallback during OAuth handling.

**Reason:** Eliminates boot race where init cached null session and dropped `SIGNED_IN` events.

---

### 4. `src/legacy/installCriticalFixes.js`

**Changes:**

- `completeOAuthCallback()` delegates to shared `completeOAuthCallbackFromUrl()`.
- `syncSessionFromSupabase` uses `window.__AIMEASY_SUPABASE__ || window.supabase` fallback.

**Reason:** Legacy sync works even if React handoff is delayed.

---

### 5. `src/legacy/installBrowserNavigation.js`

**Changes:**

- Set `oauthNavigationHandled` only **after** successful `requestAuthSync()`.
- On failure, allow retry on subsequent navigation attempts.

**Reason:** Prevent one failed early sync from permanently blocking OAuth completion.

---

### 6. `src/legacy/utils/helpers.js`

**Change:** Null-safe `showLoading()` / `hideLoading()`.

**Reason:** Prevent crash when `#loading-overlay` is not yet in DOM during early OAuth UI.

---

### 7. `src/App.jsx`

**Change:** Set `window.__AIMEASY_SUPABASE__ = supabase` at module load (alongside existing `window.supabase`).

**Reason:** Redundant safety so React entry also exposes client early.

---

## Verification Performed

| Check | Result |
|-------|--------|
| IDE linter on modified auth files | No errors |
| `npm run build` | Not run in this environment (Node/npm unavailable in shell) |
| Static review of auth flow | OAuth callback now completes before AuthProvider session read |
| Static review of navigation guards | Failed OAuth sync no longer permanently blocks retry |

## Recommended Manual Verification (Cloud Workstations)

1. Add exact callback URL to Supabase Auth → URL Configuration, e.g.  
   `https://<your-id>.cloudworkstations.dev/` or with path if used.
2. Sign in with Google as student.
3. Confirm in DevTools → Application → Local Storage:
   - `sb-<project-ref>-auth-token` present (not only code verifier).
4. Confirm console sequence:
   - `[AUTH] OAuth callback session verified`
   - `[AUTH] Auth Completed { hasSession: true }`
   - `[ROUTE] Redirect executed` or onboarding route.
5. Confirm `subjects` / `units` requests include `Authorization: Bearer ...` (not 401).

## Deployment Note

Register the Cloud Workstations origin in Supabase **Redirect URLs**. The app builds `redirectTo` from `window.location.origin` — no code change needed for non-localhost hosts once Supabase allow-list is updated.
