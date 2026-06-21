export function hideLoading() {
  const ol = document.getElementById('loading-overlay');
  if (!ol) return;
  ol.classList.add('hidden');
  setTimeout(() => { ol.style.display = 'none'; }, 400);
}

export function showLoading(text) {
  const ol = document.getElementById('loading-overlay');
  if (!ol) return;
  const txt = ol.querySelector('.loading-text');
  if (txt) txt.textContent = text || 'Loading...';
  ol.style.display = 'flex';
  ol.classList.remove('hidden');
}

let toastTimeout;
export function showToast(msg, type) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = `toast show ${type || ''}`;
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => t.classList.remove('show'), 2800);
}

export function recordStudyActivity(type, details = {}) {
  const now = new Date();
  const events = readStudentJson('edusync_study_activity', []);
  events.unshift({ type, ...details, at: now.toISOString(), day: todayKey(now) });
  writeStudentJson('edusync_study_activity', events.slice(0, 600));
  updateStudyStreak(now);
}

export function updateStudyStreak(now = new Date()) {
  const events = readStudentJson('edusync_study_activity', []);
  const days = [...new Set(events.map(event => event.day).filter(Boolean))].sort().reverse();
  const today = todayKey(now);
  const yesterdayDate = new Date(now);
  yesterdayDate.setDate(yesterdayDate.getDate() - 1);
  const yesterday = todayKey(yesterdayDate);
  let current = 0;
  if (days.includes(today) || days.includes(yesterday)) {
    const cursor = new Date(days.includes(today) ? now : yesterdayDate);
    while (days.includes(todayKey(cursor))) {
      current++;
      cursor.setDate(cursor.getDate() - 1);
    }
  }
  const best = Math.max(current, parseInt(localStorage.getItem('edusync_best_streak') || '0'));
  localStorage.setItem('edusync_streak', String(current));
  localStorage.setItem('edusync_best_streak', String(best));
  localStorage.setItem('edusync_last_active_date', events[0]?.day || '');
}
