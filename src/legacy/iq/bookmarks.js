const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));

function readBookmarks(key, fallback = []) {
  try {
    return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback));
  } catch {
    return fallback;
  }
}

function writeBookmarks(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

export function iqBookmarkStorageKey() {
  const user = window.APP?.user || {};
  const userId = user.id || user.googleId || user.email || 'guest';
  return `edusync_iq_bookmarks_${userId}`;
}

export function isIQBookmarked(index) {
  const q = window._currentIQList?.[index];
  if (!q) return false;
  const id = buildIQBookmarkId(q, index);
  return readBookmarks(iqBookmarkStorageKey(), []).some((item) => item.id === id);
}

function buildIQBookmarkId(q, index) {
  const sid = window.APP?.currentSubject?.id || 'subject';
  const uid = window.APP?.currentUnit || 1;
  return `${sid}-${uid}-${index}-${String(q.q || '').slice(0, 48)}`;
}

export function toggleIQBookmark(index) {
  const q = window._currentIQList?.[index];
  if (!q) return;
  const key = iqBookmarkStorageKey();
  const id = buildIQBookmarkId(q, index);
  let bookmarks = readBookmarks(key, []);
  const existing = bookmarks.findIndex((item) => item.id === id);
  if (existing >= 0) {
    bookmarks.splice(existing, 1);
    window.showToast?.('Bookmark removed', 'amber');
  } else {
    bookmarks.unshift({
      id,
      question: q.q,
      priority: q.priority || 'med',
      tags: q.tags || [],
      subjectId: window.APP?.currentSubject?.id,
      subjectName: window.APP?.currentSubject?.name || 'Subject',
      unitNum: window.APP?.currentUnit || 1,
      bookmarkedAt: new Date().toISOString(),
    });
    window.showToast?.('Question bookmarked', 'green');
  }
  writeBookmarks(key, bookmarks.slice(0, 50));
  window.renderStudentBookmarksPanel?.();
  const ctx = window._currentIQContext;
  if (ctx) window.renderIQ?.(ctx.subjectId, ctx.unitNum);
}

export function copyIQQuestion(index) {
  const q = window._currentIQList?.[index]?.q;
  if (!q) {
    window.showToast?.('Nothing to copy', 'red');
    return;
  }
  const copyText = async () => {
    try {
      await navigator.clipboard.writeText(q);
      window.showToast?.('Copied to clipboard', 'blue');
    } catch {
      const area = document.createElement('textarea');
      area.value = q;
      document.body.appendChild(area);
      area.select();
      document.execCommand('copy');
      area.remove();
      window.showToast?.('Copied to clipboard', 'blue');
    }
  };
  copyText();
}

export function exportIQListToPdf() {
  const items = window._currentIQList || [];
  if (!items.length) {
    window.showToast?.('No questions to export', 'red');
    return;
  }
  const subject = window.APP?.currentSubject?.name || 'Subject';
  const unit = window.APP?.currentUnit || 1;
  const rows = items
    .map(
      (q, i) => `<div style="margin-bottom:14px;padding-bottom:10px;border-bottom:1px solid #ddd;">
        <strong>Q${i + 1}.</strong> ${esc(q.q)}
        <div style="font-size:12px;color:#666;margin-top:4px;">Priority: ${esc(q.priority || 'med')} · Tags: ${esc((q.tags || []).join(', ') || '—')}</div>
      </div>`,
    )
    .join('');
  const html = `<!DOCTYPE html><html><head><title>${esc(subject)} Unit ${unit} IQs</title>
    <style>body{font-family:Arial,sans-serif;padding:24px;color:#111;} h1{font-size:20px;}</style></head>
    <body><h1>${esc(subject)} — Unit ${unit} Important Questions</h1>${rows}</body></html>`;
  const popup = window.open('', '_blank');
  if (!popup) {
    window.showToast?.('Allow pop-ups to export PDF', 'red');
    return;
  }
  popup.document.write(html);
  popup.document.close();
  popup.focus();
  popup.print();
}

export function renderStudentBookmarksPanel() {
  const el = document.getElementById('student-bookmarks-list');
  if (!el) return;

  const iqBookmarks = readBookmarks(iqBookmarkStorageKey(), []);
  hydrateMarkedReviewsForPanel();
  const reviewItems = getReviewBookmarkItems();

  if (!iqBookmarks.length && !reviewItems.length) {
    el.innerHTML = '<p style="color:var(--text3);font-size:0.83rem;padding:1rem 0;text-align:center;">No bookmarks yet. Bookmark IQ questions or mark video topics for review.</p>';
    return;
  }

  const iqHtml = iqBookmarks.slice(0, 5).map((item) => `
    <div class="recent-item">
      <div class="recent-thumb" style="background:var(--amber-light);">⭐</div>
      <div class="recent-info">
        <div class="recent-title">${esc(item.question)}</div>
        <div class="recent-sub">${esc(item.subjectName)} · Unit ${esc(item.unitNum)}</div>
      </div>
      <button class="btn btn-ghost btn-sm" onclick="removeIQBookmarkById('${String(item.id).replace(/\\/g, '\\\\').replace(/'/g, "\\'")}')">Remove</button>
    </div>`).join('');

  const reviewHtml = reviewItems.slice(0, 5).map((item) => `
    <div class="recent-item">
      <div class="recent-thumb" style="background:var(--primary-light);">🔖</div>
      <div class="recent-info">
        <div class="recent-title">${esc(item.label)}</div>
        <div class="recent-sub">Marked for review</div>
      </div>
      <button class="btn btn-primary btn-sm" onclick="openReviewBookmark('${esc(item.subjectId).replace(/'/g, "\\'")}', ${Number(item.unitId) || 1}, ${Number(item.topicIndex) || 0})">Open</button>
    </div>`).join('');

  el.innerHTML = iqHtml + reviewHtml;
}

function hydrateMarkedReviewsForPanel() {
  try {
    const userId = window.APP?.user?.id || window.APP?.user?.googleId || window.APP?.user?.email || 'guest';
    const saved = JSON.parse(localStorage.getItem(`edusync_marked_reviews_${userId}`) || '[]');
    window.APP = window.APP || {};
    window.APP.markedReviews = new Set(saved);
  } catch {
    window.APP = window.APP || {};
    window.APP.markedReviews = window.APP.markedReviews || new Set();
  }
}

function getReviewBookmarkItems() {
  const reviews = [...(window.APP?.markedReviews || [])];
  return reviews.map((key) => {
    const [subjectId, unitId, topicIndex] = String(key).split('-');
    return {
      subjectId,
      unitId,
      topicIndex,
      label: `${subjectId} · Unit ${unitId} · Topic ${Number(topicIndex) + 1}`,
    };
  });
}

export function removeIQBookmarkById(id) {
  const key = iqBookmarkStorageKey();
  const next = readBookmarks(key, []).filter((item) => item.id !== id);
  writeBookmarks(key, next);
  window.showToast?.('Bookmark removed', 'amber');
  renderStudentBookmarksPanel();
}

export function openReviewBookmark(subjectId, unitId, topicIndex) {
  window.navigateTo?.('subjects');
  window.setTimeout(() => {
    window.openSubject?.(subjectId);
    window.setTimeout(() => {
      window.openUnit?.(Number(unitId));
      window.setTimeout(() => {
        window.navigateTo?.('unit-content');
        window.switchTab?.('videos');
        window.selectVideoItemFlat?.(Number(topicIndex));
      }, 150);
    }, 150);
  }, 150);
}
