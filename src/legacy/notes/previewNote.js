// Common legacy helpers used across modules
const esc = (value) => String(value ?? '').replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
const js = (value) => String(value ?? '').replace(/\\/g, '\\\\').replace(/'/g, "\\'");
const sb = () => window.__AIMEASY_SUPABASE__;
const todayKeyDb = (date = new Date()) => date.toISOString().slice(0, 10);
const pctFromCgpa = (cgpa) => Math.max(0, Math.min(100, Number(cgpa || 0) * 9.5));

export function previewNoteInline(link, title) {
  if (!link) { showToast('No preview available for this note', 'amber'); return; }
  const modal = document.getElementById('note-preview-modal');
  const bodyEl = document.getElementById('note-preview-body');
  const titleEl = document.getElementById('note-preview-title');
  const dlBtn = document.getElementById('note-download-btn');
  titleEl.textContent = title || 'Note Preview';
  dlBtn.onclick = function () { downloadNote(link, title); };
  // Determine embed strategy
  let embedHTML = '';
  if (link.includes('drive.google.com')) {
    // Convert Google Drive share links to embed format
    const fileIdMatch = link.match(/\/d\/([a-zA-Z0-9_-]+)/);
    const embedUrl = fileIdMatch
      ? `https://drive.google.com/file/d/${fileIdMatch[1]}/preview`
      : link.replace('/view', '/preview').replace('?usp=sharing', '');
    embedHTML = `<iframe src="${embedUrl}" allow="autoplay"></iframe>`;
  } else if (link.endsWith('.pdf') || link.includes('pdf')) {
    embedHTML = `<iframe src="${link}#toolbar=1&navpanes=0"></iframe>`;
  } else {
    embedHTML = `<iframe src="${link}"></iframe>`;
  }
  bodyEl.innerHTML = embedHTML;
  modal.classList.add('open');
  document.body.style.overflow = 'hidden';
}

export function closeNotePreview() {
  const modal = document.getElementById('note-preview-modal');
  modal.classList.remove('open');
  document.body.style.overflow = '';
  // Clear iframe to stop any media
  document.getElementById('note-preview-body').innerHTML = '';
}
