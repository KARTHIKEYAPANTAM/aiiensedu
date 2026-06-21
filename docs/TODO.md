# TODO - Sub-Admin Module Fixes

## Step 1: Independent workspace isolation
- [x] Update `src/services/content/roadmapRepository.js` to scope roadmap by `created_by_subadmin_id`.

- [ ] Find all call-sites of `fetchRoadmapBySubject` and pass sub-admin identifier.

## Step 2: Validate legacy isolation patches
- [ ] Verify `src/legacy/installSubAdminFixes.js` already injects `createdBy` and uses `created_by_subadmin_id` correctly.
- [ ] If mismatch found, align payload key with DB column.

## Step 3: Unit single-click open
- [ ] Validate no remaining multi-click handlers for Unit cards/detail in `installSubAdminFixes.js`.

## Step 4: Notes/PYQ/IQ single-click save + UI sync
- [ ] Confirm guards disable button during in-flight save and re-render/update occurs.

## Step 5: Edit/Delete single-click
- [ ] Add/adjust in-flight guards for edit if still required; ensure delete stays on page.

## Step 6: Students visibility (read-only)
- [ ] Ensure student renderers pull from Supabase `content_items` and merge content.

## Step 7: View Subjects access rules
- [ ] Confirm branch-wide listing for sub-admins; edit/delete only for owner.

## Step 8: Back button on every sub-admin page
- [ ] Ensure injected back uses browser history semantics.

## Step 9: Real-time sync
- [ ] Ensure create/update/delete triggers UI refresh without manual reload.

## Step 10: Performance regression checks
- [ ] Ensure click responsiveness and no duplicate requests.

