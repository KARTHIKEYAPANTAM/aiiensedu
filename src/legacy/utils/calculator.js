// Common legacy helpers used across modules
const esc = (value) => String(value ?? '').replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
const js = (value) => String(value ?? '').replace(/\\/g, '\\\\').replace(/'/g, "\\'");
const sb = () => window.__AIMEASY_SUPABASE__;
const todayKeyDb = (date = new Date()) => date.toISOString().slice(0, 10);
const pctFromCgpa = (cgpa) => Math.max(0, Math.min(100, Number(cgpa || 0) * 9.5));

export async function initCalc() {
  if (window.__aiiensHydrationPromise) {
    await window.__aiiensHydrationPromise;
  }
  loadCalcState();

  if (!APP.calcSemesters.length) {
    APP.calcSemesters.push({ id: 'sem-1', label: 'Semester 1', rows: [], sgpa: null });
    APP.currentSemId = 'sem-1';
  }
  renderSemTabs();
  renderCalcSemTitle();
  if (!document.getElementById('calc-tbody').children.length) {
    const sem = APP.calcSemesters.find(s => s.id === APP.currentSemId);
    if (sem && sem.rows && sem.rows.length) {
      sem.rows.forEach(r => addCalcRow(r.name, r.credits, r.grade));
    } else {
      DEFAULT_SUBJECTS.forEach(s => addCalcRow(s));
    }
  }

  // Restore SGPA & CGPA UI displays
  const sem = APP.calcSemesters.find(s => s.id === APP.currentSemId);
  if (sem && sem.sgpa !== null) {
    const sgpaEl = document.getElementById('sgpa-result');
    if (sgpaEl) sgpaEl.textContent = sem.sgpa.toFixed(2);
  } else {
    const sgpaEl = document.getElementById('sgpa-result');
    if (sgpaEl) sgpaEl.textContent = '–';
  }

  const calcdSems = APP.calcSemesters.filter(s => s.sgpa !== null);
  const cgpaEl = document.getElementById('cgpa-result');
  if (cgpaEl) {
    if (calcdSems.length > 0) {
      const cgpa = Math.min(10, calcdSems.reduce((s, x) => s + x.sgpa, 0) / calcdSems.length);
      cgpaEl.textContent = cgpa.toFixed(2);
      const summaryEl = document.getElementById('all-sems-summary');
      const listEl = document.getElementById('all-sems-list');
      if (summaryEl && listEl && calcdSems.length > 1) {
        summaryEl.style.display = 'block';
        listEl.innerHTML = calcdSems.map(s =>
          '<div style="display:flex;justify-content:space-between;padding:5px 0;border-bottom:1px solid var(--border);font-size:0.82rem;">' +
          '<span style="font-weight:600;">' + s.label + '</span>' +
          '<span style="color:var(--primary);font-weight:700;">' + s.sgpa.toFixed(2) + '</span></div>'
        ).join('') +
          '<div style="display:flex;justify-content:space-between;padding:8px 0;font-size:0.88rem;">' +
          '<span style="font-weight:700;">Overall CGPA</span>' +
          '<span style="color:var(--teal);font-weight:800;">' + cgpa.toFixed(2) + '</span></div>';
      }
    } else {
      cgpaEl.textContent = '–';
    }
  }
}

export function clearCalc() {
  document.getElementById('calc-tbody').innerHTML = '';
  APP.calcRows = [];
  document.getElementById('sgpa-result').textContent = '–';
  document.getElementById('sgpa-grade').textContent = 'Calculate to see your grade';
  document.getElementById('backlog-warn').style.display = 'none';
  const sem = APP.calcSemesters.find(s => s.id === APP.currentSemId);
  if (sem) { sem.rows = []; sem.sgpa = null; }
  renderSemTabs();
  saveCalcState();
  showToast('Semester cleared', 'blue');
}

export async function renderCalc() {
  if (!APP.calcSemesters.length) {
    await initCalc();
  } else {
    renderSemTabs();
    renderCalcSemTitle();
    if (!document.getElementById('calc-tbody').children.length) {
      const sem = APP.calcSemesters.find(s => s.id === APP.currentSemId);
      if (sem && sem.rows.length) {
        sem.rows.forEach(r => addCalcRow(r.name, r.credits, r.grade));
      } else {
        DEFAULT_SUBJECTS.forEach(s => addCalcRow(s));
      }
    }
  }
}

export function calculateGPA() {
  const rows = document.querySelectorAll('#calc-tbody tr');
  let totalPoints = 0, totalCredits = 0;
  const failed = [], gradeCount = {};
  rows.forEach(row => {
    const inputs = row.querySelectorAll('input,select');
    const credits = parseInt(inputs[1]?.value) || 0;
    const grade = inputs[2]?.value || 'F';
    const pts = GRADES[grade] ?? 0;
    totalPoints += credits * pts;
    totalCredits += credits;
    if (grade === 'F' || grade === 'Fail') failed.push(inputs[0]?.value || 'Unknown Subject');
    gradeCount[grade] = (gradeCount[grade] || 0) + 1;
  });
  if (!totalCredits) { showToast('Add subjects first', 'red'); return; }
  const sgpa = parseFloat((totalPoints / totalCredits).toFixed(2));

  // Store in current semester
  const sem = APP.calcSemesters.find(s => s.id === APP.currentSemId);
  if (sem) sem.sgpa = sgpa;
  saveCurrentSemRows();
  renderSemTabs();

  document.getElementById('sgpa-result').textContent = sgpa.toFixed(2);
  // Real CGPA = average of all calculated sems
  const calcdSems = APP.calcSemesters.filter(s => s.sgpa !== null);
  if (calcdSems.length > 0) {
    const cgpa = Math.min(10, calcdSems.reduce((s, x) => s + x.sgpa, 0) / calcdSems.length);
    document.getElementById('cgpa-result').textContent = cgpa.toFixed(2);
    const summaryEl = document.getElementById('all-sems-summary');
    const listEl = document.getElementById('all-sems-list');
    if (summaryEl && listEl && calcdSems.length > 1) {
      summaryEl.style.display = 'block';
      listEl.innerHTML = calcdSems.map(s =>
        '<div style="display:flex;justify-content:space-between;padding:5px 0;border-bottom:1px solid var(--border);font-size:0.82rem;">' +
        '<span style="font-weight:600;">' + s.label + '</span>' +
        '<span style="color:var(--primary);font-weight:700;">' + s.sgpa.toFixed(2) + '</span></div>'
      ).join('') +
        '<div style="display:flex;justify-content:space-between;padding:8px 0;font-size:0.88rem;">' +
        '<span style="font-weight:700;">Overall CGPA</span>' +
        '<span style="color:var(--teal);font-weight:800;">' + cgpa.toFixed(2) + '</span></div>';
    }
  } else {
    document.getElementById('cgpa-result').textContent = sgpa.toFixed(2);
  }
  saveCalcState();
  const gradeLabel = sgpa >= 9 ? 'Outstanding 🏆' : sgpa >= 8 ? 'Excellent 🌟' : sgpa >= 7 ? 'Very Good 👍' : sgpa >= 6 ? 'Good ✅' : sgpa >= 5 ? 'Average ⚠️' : 'Needs Improvement 📚';
  document.getElementById('sgpa-grade').textContent = gradeLabel;

  // Grade distribution bars
  const colors = { O: 'var(--green)', 'A+': 'var(--teal)', A: 'var(--primary)', 'B+': 'var(--lavender)', B: 'var(--amber)', C: '#f97316', F: 'var(--red)' };
  const maxCount = Math.max(...Object.values(gradeCount), 1);
  document.getElementById('grade-dist').innerHTML = `
    <div style="display:flex;gap:4px;align-items:flex-end;height:60px;margin-bottom:6px;">
      ${Object.entries(GRADES).map(([g]) => {
    const cnt = gradeCount[g] || 0;
    const h = cnt ? Math.max(8, (cnt / maxCount) * 52) : 0;
    return `<div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:2px;">
          <div style="width:100%;height:${h}px;border-radius:4px 4px 0 0;background:${colors[g] || 'var(--border)'};transition:height 0.5s;"></div>
          <div style="font-size:0.65rem;font-weight:700;color:var(--text3);">${g}</div>
        </div>`;
  }).join('')}
    </div>`;

  // Backlogs
  if (failed.length > 0) {
    APP.backlogSubjects = [...new Set([...APP.backlogSubjects, ...failed])];
    document.getElementById('backlog-badge').textContent = APP.backlogSubjects.length;
    document.getElementById('backlog-warn').style.display = 'block';
    document.getElementById('backlog-warn-subjects').textContent = `Subjects moved to Backlog: ${failed.join(', ')}`;
    showToast(`⚠️ ${failed.length} backlog subject(s) detected!`, 'red');
  } else {
    document.getElementById('backlog-warn').style.display = 'none';
    showToast(`✅ SGPA: ${sgpa} — Great work!`, 'green');
  }
}
