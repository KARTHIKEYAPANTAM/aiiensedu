import { mapDbSubjectToUi, mapLocalStorageSubjectToUi, mergeSubjectSources } from './subjectAdapter.js';

// Mock Data
const mockDbSubject = {
  id: '8d7f6e7a-9c3b-4f8e-b8a5-d0f1c2b3a4b5',
  name: 'Operating Systems',
  code: 'CS301',
  branch: 'CSE',
  regulation_code: 'R18',
  semester: '3-1',
  university_name: 'AIIENS University',
  year: 2023,
  credits: 3,
  status: 'Published',
};

const mockLocalSubject = {
  id: 1678886400000,
  name: 'Web Development Fundamentals',
  code: 'WD101',
  branch: 'IT',
  sem: '2-2',
  reg: 'R19',
  uni: 'Tech University',
  year: 2024,
  credits: '4',
};

const mockDuplicateLocalSubject = {
    id: 1679999999999,
    name: 'Operating Systems', // Same name and branch as mockDbSubject
    code: 'CS301-Legacy',
    branch: 'CSE',
    sem: '3-1',
    reg: 'R18',
    uni: 'AIIENS University',
    year: 2023,
    credits: '3',
}

// Verification Helpers
function assert(condition, message) {
  if (!condition) {
    throw new Error(`Assertion Failed: ${message}`);
  }
}

function verifyShape(subject, source) {
    console.log(`Verifying shape for ${source}...`);
    assert(subject, 'Subject should not be null');
    assert(typeof subject.id === 'string', '`id` must be a string');
    assert(subject.rawId, '`rawId` must exist');
    assert(typeof subject.isCustom === 'boolean', '`isCustom` must be a boolean');
    assert(typeof subject.name === 'string', '`name` must be a string');
    assert(typeof subject.credits === 'number', '`credits` must be a number');
    assert(subject.sem === subject.semester, '`sem` and `semester` must be consistent');
    console.log('Shape Verified.');
}


function runAdapterTests() {
    console.log('--- Running Adapter Verification ---');

    // Test 1: DB Subject to UI Mapping
    const uiDbSubject = mapDbSubjectToUi(mockDbSubject);
    verifyShape(uiDbSubject, 'DB Subject');
    assert(uiDbSubject.id === '8d7f6e7a-9c3b-4f8e-b8a5-d0f1c2b3a4b5', 'DB subject `id` is incorrect');
    assert(uiDbSubject.rawId === '8d7f6e7a-9c3b-4f8e-b8a5-d0f1c2b3a4b5', 'DB subject `rawId` is incorrect');
    assert(uiDbSubject.isCustom === false, 'DB subject `isCustom` should be false');
    assert(uiDbSubject.credits === 3, 'DB subject `credits` should be a number');
    assert(uiDbSubject.sem === '3-1', 'DB subject `sem` is incorrect');

    // Test 2: LocalStorage Subject to UI Mapping
    const uiLocalSubject = mapLocalStorageSubjectToUi(mockLocalSubject);
    verifyShape(uiLocalSubject, 'LocalStorage Subject');
    assert(uiLocalSubject.id === 'custom_1678886400000', 'LocalStorage subject `id` should be prefixed');
    assert(uiLocalSubject.rawId === 1678886400000, 'LocalStorage subject `rawId` is incorrect');
    assert(uiLocalSubject.isCustom === true, 'LocalStorage subject `isCustom` should be true');
    assert(uiLocalSubject.credits === 4, 'LocalStorage subject `credits` should be a number');
    assert(uiLocalSubject.semester === '2-2', 'LocalStorage subject `semester` is incorrect');

    // Test 3: Merge Logic
    const merged = mergeSubjectSources([mockDbSubject], [mockLocalSubject]);
    console.log('Verifying merge logic...');
    assert(merged.length === 2, 'Merge should result in 2 subjects');
    verifyShape(merged[0], 'Merged DB Subject');
    verifyShape(merged[1], 'Merged LocalStorage Subject');
    console.log('Merge Verified.');

    // Test 4: De-duplication Logic
    const mergedWithDup = mergeSubjectSources([mockDbSubject], [mockDuplicateLocalSubject, mockLocalSubject]);
    console.log('Verifying de-duplication logic...');
    assert(mergedWithDup.length === 2, 'De-duplication should result in 2 subjects');
    const operatingSystems = mergedWithDup.find(s => s.name === 'Operating Systems');
    assert(operatingSystems.isCustom === false, 'De-duplication should prioritize the DB version');
    console.log('De-duplication Verified.');

    console.log('--- Adapter Verification Complete: All tests passed! ---');
}

// To run, you would typically open a browser console and import this file.
// Since we are in a backend environment, we will just log the intention.
console.log('subjectAdapter.test.js created. To verify, run `runAdapterTests()` in a JS environment.');

// You can also self-execute for immediate feedback in some environments.
// runAdapterTests();
