export function v10Esc(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function v10Js(value) {
  return String(value ?? '').replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

export function v10Slug(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function readStudentJson(key, fallback = []) {
  try {
    return JSON.parse(localStorage.getItem(key) || '') ?? fallback;
  } catch {
    return fallback;
  }
}

export function writeStudentJson(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    window.dispatchEvent(new CustomEvent('edusync:data-sync', { detail: { key } }));
  } catch (e) {
    console.error('Storage write error:', e);
  }
}

export function todayKey(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

let toastTimeout;
export function showToast(msg, type = 'blue') {
  const t = document.getElementById('toast');
  if (!t) return;
  t.textContent = msg;
  t.className = `toast show ${type || ''}`;
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => t.classList.remove('show'), 2800);
}

export function showLoading(text) {
  const ol = document.getElementById('loading-overlay');
  if (!ol) return;
  const txt = ol.querySelector('.loading-text');
  if (txt) txt.textContent = text || 'Loading...';
  ol.style.display = 'flex';
  ol.classList.remove('hidden');
}

export function hideLoading() {
  const ol = document.getElementById('loading-overlay');
  if (!ol) return;
  ol.classList.add('hidden');
  setTimeout(() => { ol.style.display = 'none'; }, 400);
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

export function recordStudyActivity(type, details = {}) {
  const now = new Date();
  const events = readStudentJson('edusync_study_activity', []);
  events.unshift({ type, ...details, at: now.toISOString(), day: todayKey(now) });
  writeStudentJson('edusync_study_activity', events.slice(0, 600));
  updateStudyStreak(now);
}

export function v11CloseAllPopups() {
  document.querySelectorAll('.adm-popup,.v10-popup,.aimeasy-unit-menu').forEach(p => p.remove());
}

export function v11Confirm(msg, onYes) {
  v11CloseAllPopups();
  const el = document.createElement('div');
  el.className = 'v11-confirm-modal';
  el.innerHTML = `<div class="v11-confirm-box">
    <div style="font-size:1.6rem;margin-bottom:.8rem;">⚠️</div>
    <h3 style="font-size:1.05rem;margin-bottom:.6rem;">Confirm Action</h3>
    <p style="font-size:.87rem;color:var(--text2);line-height:1.5;margin-bottom:1.4rem;">${v10Esc(msg)}</p>
    <div style="display:flex;gap:10px;justify-content:flex-end;">
      <button class="btn btn-ghost btn-sm" id="v11-no-btn">Cancel</button>
      <button class="btn btn-danger btn-sm" id="v11-yes-btn">Yes, Delete</button>
    </div>
  </div>`;
  document.body.appendChild(el);
  el.querySelector('#v11-no-btn').onclick = () => el.remove();
  el.querySelector('#v11-yes-btn').onclick = () => { el.remove(); onYes(); };
  el.addEventListener('click', e => { if (e.target === el) el.remove(); });
}
