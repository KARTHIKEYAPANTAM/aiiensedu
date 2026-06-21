import test from 'node:test';
import assert from 'node:assert/strict';
import { buildSubAdminAccountPayload } from '../src/utils/subAdminPayload.js';

test('buildSubAdminAccountPayload includes scope metadata for database persistence', () => {
  const payload = buildSubAdminAccountPayload({
    username: 'ravi_cse',
    password: 'secret',
    branch: 'CSE',
    department: 'Academics',
    regulation: 'R23',
    university: 'JNTUK',
    permissions: ['subjects', 'units', 'content'],
  });

  assert.equal(payload.username, 'ravi_cse');
  assert.equal(payload.password, 'secret');
  assert.equal(payload.branch, 'CSE');
  assert.equal(payload.department, 'Academics');
  assert.equal(payload.regulation, 'R23');
  assert.equal(payload.university, 'JNTUK');
  assert.deepEqual(payload.permissions, ['subjects', 'units', 'content']);
  assert.equal(payload.status, 'active');
});
