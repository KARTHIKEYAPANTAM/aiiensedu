import test from 'node:test';
import assert from 'node:assert/strict';
import { persistLegacyAdminSession } from '../src/utils/adminSessionStorage.js';

test('persistLegacyAdminSession stores full sub-admin session metadata for refresh restoration', () => {
  const storage = {};
  globalThis.localStorage = {
    getItem(key) { return storage[key] ?? null; },
    setItem(key, value) { storage[key] = String(value); },
    removeItem(key) { delete storage[key]; },
  };

  persistLegacyAdminSession({
    type: 'subadmin',
    username: 'ravi',
    data: {
      username: 'ravi',
      branch: 'CSE',
      department: 'Academics',
      regulation: 'R23',
      university: 'JNTUK',
    },
  });

  const saved = JSON.parse(storage.edusync_admin_session);
  assert.equal(saved.type, 'subadmin');
  assert.equal(saved.username, 'ravi');
  assert.equal(saved.data.username, 'ravi');
  assert.equal(saved.data.branch, 'CSE');
});
