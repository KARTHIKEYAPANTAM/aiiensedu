// 1. Core state registration
import appState from './core/appState.js';
window.APP = appState;

// 2. Load legacy base scripts (so they initialize their globals and DOM structure)
import './legacy/legacy-app.js';
import './legacy/legacy-patches.js';
import './legacy/aimeasy-fixes.js';

// 3. Load other legacy fixes
import { installCriticalFixes } from './legacy/installCriticalFixes.js';
import { installSubAdminFixes } from './legacy/installSubAdminFixes.js';
import { installAdminSubjectCrud } from './legacy/installAdminSubjectCrud.js';
import { installIntroSplash } from './legacy/installIntroSplash.js';
import { installBackButtonFixes } from './legacy/installBackButtonFixes.js';
import { installInlineHandlerFallbacks } from './legacy/runLegacyScripts.js';

// Apply legacy fixes immediately to define globals
installBackButtonFixes();
installInlineHandlerFallbacks();
installCriticalFixes();
installSubAdminFixes();
installAdminSubjectCrud();
installIntroSplash();

// Production experience patches (admin routing, notifications, live workshops, subadmin CRUD)
window.installAiiensProductionExperiencePatch?.();
window.installLegacyInlineHandlerGlobals?.();
window.installStudentDashboardAndWorkshopPatch?.();

console.log('[main.js] AIIENS Edu bootstrapped successfully.');
