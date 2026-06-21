import {
  hasRemoteBackend,
  loadRemoteState,
  removeRemoteKey,
  saveRemoteKey,
} from './appState.js';

const PATCH_FLAG = '__aimeasyStorageBridgeInstalled';

let isHydrating = false;
const HYDRATION_TIMEOUT_MS = 1500;

// Initialize memory stores on window
if (!window.__aiiensMemoryStore) window.__aiiensMemoryStore = {};
if (!window.__aiiensSessionMemoryStore) window.__aiiensSessionMemoryStore = {};

function isAcademicKey(key) {
  if (typeof key !== 'string') return false;
  const allowedPreferences = [
    'theme', 'dark_mode', 'language', 'intro_hidden',
    'aimeasy_theme', 'aimeasy_dark_mode', 'aimeasy_language',
    'aimeasy_intro_hidden', 'aimeasy_splash_hidden', 'aiiens_theme',
    'aiiens_dark_mode', 'aiiens_language', 'aiiens_intro_hidden',
    'aiiens_splash_hidden', 'aimeasy_login_portal', 'aimeasy_login_portal_backup',
    'aimeasy_cached_regulations'
  ];
  if (allowedPreferences.includes(key)) return false;

  return key.startsWith('edusync_') || key.startsWith('aiiens_') || key.startsWith('aimeasy_');
}

function getMemoryStore(storageInstance) {
  if (storageInstance === window.localStorage) {
    return window.__aiiensMemoryStore;
  }
  if (storageInstance === window.sessionStorage) {
    return window.__aiiensSessionMemoryStore;
  }
  return null;
}

async function migrateLegacyLocalStateToRemote(remoteState = {}) {
  if (!hasRemoteBackend()) return;

  const keysToMigrate = [];
  const originalGetItem = Storage.prototype.getItem;
  const originalRemoveItem = Storage.prototype.removeItem;

  for (let i = 0; i < localStorage.length; i += 1) {
    const key = localStorage.key(i);
    if (!isAcademicKey(key)) continue;

    const value = originalGetItem.call(window.localStorage, key);
    if (value != null) {
      const targetKey = key.replace(/^edusync_/, 'aiiens_');
      keysToMigrate.push({ from: key, to: targetKey, value });
    }
  }

  if (!keysToMigrate.length) return;

  await Promise.all(
    keysToMigrate.map(async ({ from, to, value }) => {
      await saveRemoteKey(to, value);
      window.__aiiensMemoryStore[to] = value;
      originalRemoveItem.call(window.localStorage, from);
    })
  );
  console.log('[AIM EASY backend] Migrated legacy local keys to Supabase and cleared from localStorage:', keysToMigrate.map((item) => item.to));
}

let resolveHydration;
window.__aiiensHydrationPromise = new Promise((resolve) => {
  resolveHydration = resolve;
});

export async function hydrateLegacyState() {
  if (!hasRemoteBackend()) {
    window.__AIMEASY_BACKEND_MODE__ = 'local';
    window.__aiiensStateHydrated = true;
    resolveHydration();
    return;
  }

  isHydrating = true;
  try {
    const remoteState = await Promise.race([
      loadRemoteState(),
      new Promise((resolve) => window.setTimeout(() => resolve({}), HYDRATION_TIMEOUT_MS)),
    ]);

    Object.entries(remoteState).forEach(([key, value]) => {
      if (isAcademicKey(key) && value != null) {
        const targetKey = key.replace(/^edusync_/, 'aiiens_');
        window.__aiiensMemoryStore[targetKey] = value;
      } else if (value != null) {
        Storage.prototype.setItem.call(window.localStorage, key, value);
      }
    });

    await migrateLegacyLocalStateToRemote(remoteState);
  } catch (error) {
    console.warn('[AIM EASY backend] Hydration failed:', error.message);
  } finally {
    isHydrating = false;
    window.__aiiensStateHydrated = true;
    resolveHydration();
  }

  window.__AIMEASY_BACKEND_MODE__ = 'supabase';
}

export function installLegacyStorageBridge() {
  if (window[PATCH_FLAG]) return;

  const originalGetItem = Storage.prototype.getItem;
  const originalSetItem = Storage.prototype.setItem;
  const originalRemoveItem = Storage.prototype.removeItem;
  const originalClear = Storage.prototype.clear;
  const originalKey = Storage.prototype.key;

  Storage.prototype.getItem = function patchedGetItem(key) {
    const memStore = getMemoryStore(this);
    if (memStore && isAcademicKey(key)) {
      const targetKey = key.replace(/^edusync_/, 'aiiens_');
      return memStore[targetKey] !== undefined ? memStore[targetKey] : null;
    }
    return originalGetItem.call(this, key);
  };

  Storage.prototype.setItem = function patchedSetItem(key, value) {
    const memStore = getMemoryStore(this);
    if (memStore && isAcademicKey(key)) {
      const targetKey = key.replace(/^edusync_/, 'aiiens_');
      memStore[targetKey] = String(value);
      if (this === window.localStorage && !isHydrating) {
        saveRemoteKey(targetKey, String(value));
      }
      return;
    }
    originalSetItem.call(this, key, value);
  };

  Storage.prototype.removeItem = function patchedRemoveItem(key) {
    const memStore = getMemoryStore(this);
    if (memStore && isAcademicKey(key)) {
      const targetKey = key.replace(/^edusync_/, 'aiiens_');
      delete memStore[targetKey];
      if (this === window.localStorage && !isHydrating) {
        removeRemoteKey(targetKey);
      }
      return;
    }
    originalRemoveItem.call(this, key);
  };

  Storage.prototype.clear = function patchedClear() {
    const memStore = getMemoryStore(this);
    if (memStore) {
      const keys = Object.keys(memStore);
      keys.forEach((key) => {
        delete memStore[key];
        if (this === window.localStorage && !isHydrating) {
          removeRemoteKey(key);
        }
      });
    }
    originalClear.call(this);
  };

  Storage.prototype.key = function patchedKey(index) {
    const memStore = getMemoryStore(this);
    if (memStore) {
      const localKeys = [];
      let i = 0;
      while (true) {
        const k = originalKey.call(this, i);
        if (k === null) break;
        localKeys.push(k);
        i++;
      }
      const memoryKeys = Object.keys(memStore);
      const mergedKeys = Array.from(new Set([...localKeys, ...memoryKeys]));
      return mergedKeys[index] !== undefined ? mergedKeys[index] : null;
    }
    return originalKey.call(this, index);
  };

  Object.defineProperty(Storage.prototype, 'length', {
    get() {
      const memStore = getMemoryStore(this);
      if (memStore) {
        const localKeys = [];
        let i = 0;
        while (true) {
          const k = originalKey.call(this, i);
          if (k === null) break;
          localKeys.push(k);
          i++;
        }
        const memoryKeys = Object.keys(memStore);
        const mergedKeys = new Set([...localKeys, ...memoryKeys]);
        return mergedKeys.size;
      }
      let i = 0;
      while (true) {
        if (originalKey.call(this, i) === null) break;
        i++;
      }
      return i;
    },
    configurable: true,
  });

  window[PATCH_FLAG] = true;
}
