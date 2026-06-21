export const storageService = {
  read(key, fallback = null) {
    try {
      const val = localStorage.getItem(key);
      if (val === null) return fallback;
      return JSON.parse(val) ?? fallback;
    } catch {
      return fallback;
    }
  },

  write(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      window.dispatchEvent(new CustomEvent('edusync:data-sync', { detail: { key } }));
    } catch (e) {
      console.warn(`Failed to write to localStorage for key "${key}":`, e);
    }
  },

  remove(key) {
    try {
      localStorage.removeItem(key);
    } catch (e) {
      console.warn(`Failed to remove key "${key}" from localStorage:`, e);
    }
  },

  readSession(key, fallback = null) {
    try {
      const val = sessionStorage.getItem(key);
      if (val === null) return fallback;
      return JSON.parse(val) ?? fallback;
    } catch {
      return fallback;
    }
  },

  writeSession(key, value) {
    try {
      sessionStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.warn(`Failed to write to sessionStorage for key "${key}":`, e);
    }
  },

  removeSession(key) {
    try {
      sessionStorage.removeItem(key);
    } catch (e) {
      console.warn(`Failed to remove key "${key}" from sessionStorage:`, e);
    }
  }
};

export default storageService;
