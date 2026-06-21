// Common legacy helpers used across modules
const esc = (value) => String(value ?? '').replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
const js = (value) => String(value ?? '').replace(/\\/g, '\\\\').replace(/'/g, "\\'");
const sb = () => window.__AIMEASY_SUPABASE__;
const todayKeyDb = (date = new Date()) => date.toISOString().slice(0, 10);
const pctFromCgpa = (cgpa) => Math.max(0, Math.min(100, Number(cgpa || 0) * 9.5));

export function prevVideo() {
  const items = document.querySelectorAll('.video-item');
  if (APP.currentVideoIndex > 0) {
    APP.currentVideoIndex--;
    selectVideoItem(APP.currentVideoIndex);
    showToast('← Previous topic', 'blue');
  } else {
    showToast('This is the first topic', 'amber');
  }
}
