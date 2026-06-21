import { renderUnits } from '../units/renderUnits.js';

// Make it globally available
window.openSubject = openSubject;

export function openSubject(id) {
    if (!id) return;

    const subj = window.APP?.subjects?.find(s => s.id === id);

    if (!subj) {
        console.error(`[openSubject] Subject with id ${id} not found in APP.subjects`);
        return;
    }

    // Set the modern, canonical state object. This is always done.
    window.APP.currentSubject = subj;

    // --- ENTRY POINT BRIDGE ---
    // If the user is a SubAdmin, we route to the legacy unit management page.
    if (window.APP?.userProfile?.role === 'subadmin') {
        
        // 1. Create the legacy state object (_v10SASubj) by mapping from the modern one.
        const legacySubj = {
            id: subj.id,
            name: subj.name,
            code: subj.code || '',
            sem: subj.semester || '',
            semester: subj.semester || '',
            reg: subj.regulation || 'R23',
            regulation_code: subj.regulation || 'R23',
            uni: subj.university || 'JNTUK',
            university_name: subj.university || 'JNTUK',
            branch: subj.branch || 'CSE',
            credits: subj.credits || 3
        };
        window._v10SASubj = legacySubj;

        // 2. Call the legacy rendering function for the units page.
        // This function is defined in src/legacy/units/unitHelpers.js
        if (window.v10SAUnitsPage) {
            window.v10SAUnitsPage(legacySubj);
        } else {
            console.error('[openSubject] Legacy function v10SAUnitsPage not found.');
        }

        // 3. CRITICAL: Stop execution to prevent a double-render.
        // The default `renderUnits()` call below will not be reached for SubAdmins.
        return;
    }
    // --- END BRIDGE ---


    // Default execution path for all non-SubAdmin roles (students, admins).
    renderUnits();
}
