export const AppState = {
  adminLoginType: null,
  selectedRole: null,
  currentSubject: null,
  currentUnit: null,
  currentVideo: null,
  UNIT_TOPICS: null,
};

// expose globally for legacy code
if (typeof window !== 'undefined') {
  window.AppState = AppState;
}
