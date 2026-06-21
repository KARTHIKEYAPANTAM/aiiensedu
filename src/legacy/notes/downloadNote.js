// Common legacy helpers used across modules
const esc = (value) => String(value ?? '').replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
const js = (value) => String(value ?? '').replace(/\\/g, '\\\\').replace(/'/g, "\\'");
const sb = () => window.__AIMEASY_SUPABASE__;
const todayKeyDb = (date = new Date()) => date.toISOString().slice(0, 10);
const pctFromCgpa = (cgpa) => Math.max(0, Math.min(100, Number(cgpa || 0) * 9.5));

export function downloadNote(link, title) {
  if (!link) { showToast('No download available', 'amber'); return; }
  // For Google Drive links convert to direct download
  const fileIdMatch = link.match(/\/d\/([a-zA-Z0-9_-]+)/);
  if (fileIdMatch) {
    const dlUrl = `https://drive.google.com/uc?export=download&id=${fileIdMatch[1]}`;
    const a = document.createElement('a');
    a.href = dlUrl;
    a.download = title || 'note';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  } else {
    window.open(link, '_blank');
  }
  showToast('📥 Downloading...', 'green');
}
