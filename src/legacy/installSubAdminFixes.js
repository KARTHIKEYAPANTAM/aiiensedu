import { renderSubAdminShell, renderCreateSubjectForm, renderSubjectCards } from './subadmin/ui.js';

export function installSubAdminFixes() {
  if (window.__subAdminFixesInstalled) return;
  window.__subAdminFixesInstalled = true;

  // ... (other fixes remain untouched)
  
  function getSA() {
    return window.APP?.subAdminData || {};
  }

  function showToast(msg, type = 'blue') {
    window.showToast?.(msg, type);
  }

  // This function is now a high-level orchestrator.
  // It builds the UI from modular components and fetches data, but the create/delete logic remains in separate, untouched functions.
  async function installIsolatedSASubjectsOrchestrator() {
    const _origFetch = window.aimeasyFetchSubjects;
    if (!_origFetch) {
      setTimeout(installIsolatedSASubjectsOrchestrator, 300);
      return;
    }

    window.v10SASubjects = async function v10SASubjectsIsolated() {
      const content = document.getElementById('sa-content');
      if (!content) return;

      content.innerHTML = `<div class="loading-spinner" style="margin: 3rem auto 1rem;"></div>`;
      
      const sa = getSA();
      const filters = { created_by_subadmin_id: sa.username || sa.id };

      const { data, error } = await window.aimeasyFetchSubjects(filters);

      if (error) {
          content.innerHTML = `<p style="color:var(--red);">Failed to load subjects: ${error.message}</p>`;
          return;
      }

      const mySubs = data || [];

      // 1. Render the main page shell
      content.innerHTML = renderSubAdminShell(mySubs.length);

      // 2. Render the create form into its container
      const createFormContainer = document.getElementById('sa-create-subject-form-container');
      if (createFormContainer) {
          createFormContainer.innerHTML = renderCreateSubjectForm();
      }

      // 3. Render the subject cards into their container
      const gridContainer = document.getElementById('sa-subjects-grid-container');
      if (gridContainer) {
          gridContainer.innerHTML = renderSubjectCards(mySubs);
      }
    };

    // The create handler is PRESERVED UNCHANGED. It still relies on globals and specific DOM IDs.
    window.__v10SACreateSubjectFixed = async function () {
      const btn = document.getElementById('v10-sa-create-btn');
      if (btn?.disabled) return;

      const branch = document.getElementById('v10-sa-branch')?.value;
      const sem = document.getElementById('v10-sa-sem')?.value;
      const reg = document.getElementById('v10-sa-reg')?.value;
      const uni = document.getElementById('v10-sa-uni')?.value;
      const name = document.getElementById('v10-sa-name')?.value.trim();
      const credits = document.getElementById('v10-sa-credits')?.value || '3';

      if (!branch || !sem || !reg || !uni || !name) {
        showToast('Please fill all required fields', 'red');
        return;
      }
      if (!window.aimeasyCreateSubject) {
        showToast('Supabase not ready. Please wait and try again.', 'red');
        return;
      }

      if (btn) { btn.disabled = true; btn.textContent = '⏳ Creating...'; }

      const username = getSA().username || getSA().id;
      const dbPayload = {
        name,
        code: '',
        university_name: uni,
        regulation_code: reg,
        branch,
        semester: sem,
        credits: Number(credits) || 3,
        ...(username ? { createdBy: username } : {}),
      };

      showToast('Saving to Supabase...', 'blue');
      const { data, error } = await window.aimeasyCreateSubject(dbPayload);

      if (error) {
        showToast('❌ Failed: ' + error.message, 'red');
        if (btn) { btn.disabled = false; btn.textContent = '✅ Create Subject'; }
        return;
      }

      showToast('✅ Subject created!', 'green');
      await window.v10SASubjects();
    };
    
    // Run the orchestrator after a tick to ensure legacy globals are ready
    setTimeout(() => {
        installIsolatedSASubjectsOrchestrator();
    }, 0);
  }

  // Initialize the fixes
  installIsolatedSASubjectsOrchestrator();

  console.log('[SubAdminFixes] Patches installed (UI Extracted). ✓');
}

