// Common legacy helpers used across modules
const esc = (value) => String(value ?? '').replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
const js = (value) => String(value ?? '').replace(/\\/g, '\\\\').replace(/'/g, "\\'");
const sb = () => window.__AIMEASY_SUPABASE__;
const todayKeyDb = (date = new Date()) => date.toISOString().slice(0, 10);
const pctFromCgpa = (cgpa) => Math.max(0, Math.min(100, Number(cgpa || 0) * 9.5));

export function selectVideoItem(idx) {
  APP.currentVideoIndex = idx;
  document.querySelectorAll('.video-item').forEach((el, i) => el.classList.toggle('active', i === idx));
  const item = APP._videoItems?.[idx];
  console.log('Selected Topic:', item);
  if (!item) return;

  const title = item.title;
  const url = item.url;
  console.log('[VIDEO] URL Loaded', { url, title });

  const nowLabel = document.getElementById('now-playing-label');
  if (nowLabel) nowLabel.textContent = title;
  const topicTitleEl = document.getElementById('video-topic-title');
  if (topicTitleEl) topicTitleEl.textContent = title;

  const sid = APP.currentSubject?.id || 'os';
  const uid = APP.currentUnit || 1;
  const isReview = APP.markedReviews.has(`${sid}-${uid}-${idx}`);
  const rb = document.getElementById('review-btn');
  if (rb) {
    rb.classList.toggle('marked', isReview);
    rb.textContent = isReview ? '🔖 Marked for Review' : '🔖 Mark for Review';
  }

  const wrapper = document.getElementById('video-embed-wrapper') || document.querySelector('.video-embed-wrapper');
  if (!wrapper) {
    console.error('Element not found: video-embed-wrapper');
    return;
  }
  const descEl = document.getElementById('video-topic-desc');
  const placeholder = wrapper.querySelector('.video-placeholder');

  if (url && (url.includes('youtube.com') || url.includes('youtu.be'))) {
    const videoId = convertYouTubeToEmbed(url);
    if (videoId) {
      renderStudentYouTubeVideo(wrapper, item, idx, videoId, title);
      if (placeholder) placeholder.style.display = 'none';
      if (descEl) descEl.textContent = item.description || `Now watching: ${title}`;
      renderTopicInlineNotes(title, sid, uid, idx);
      return;
    }
  }

  if (url) {
    wrapper.innerHTML = `
      <div class="video-placeholder">
        <div style="font-size:3rem;opacity:0.7;">🔗</div>
        <div style="color:#fff;font-size:0.9rem;opacity:0.9;text-align:center;padding:0 1rem;">${title}</div>
        <button class="play-btn-big" onclick="window.open('${url}','_blank')" style="font-size:1rem;">Open ↗</button>
        <div style="opacity:0.6;font-size:0.8rem;color:#fff;">Opens in new tab</div>
      </div>`;
    if (descEl) descEl.textContent = item.description || `External video: ${title}.`;
    renderTopicInlineNotes(title, sid, uid, idx);
    return;
  }

  wrapper.innerHTML = `
    <div class="video-placeholder">
      <div style="font-size:3.5rem;margin-bottom:4px;">🎬</div>
      <div class="play-btn-big" onclick="playCurrentVideo()">▶</div>
      <div style="opacity:0.75;font-size:0.95rem;color:#fff;margin-top:6px;">${title}</div>
    </div>`;
  if (descEl) descEl.textContent = `This topic covers "${title}" — video coming soon.`;
  renderTopicInlineNotes(title, sid, uid, idx);
}

export function selectTopicUrl(topicIndex, urlIndex) {
  const item = APP._videoItems?.[topicIndex];
  if (!item) return;
  const url = item.urls?.[urlIndex];
  if (!url) return;

  APP.currentVideoIndex = topicIndex;
  document.querySelectorAll('.video-item').forEach((el, i) => el.classList.toggle('active', i === topicIndex));
  const title = item.title;
  console.log('[VIDEO] URL Loaded', { url, title });
  const nowLabel = document.getElementById('now-playing-label');
  if (nowLabel) nowLabel.textContent = title;
  const topicTitleEl = document.getElementById('video-topic-title');
  if (topicTitleEl) topicTitleEl.textContent = title;

  const sid = APP.currentSubject?.id || 'os';
  const uid = APP.currentUnit || 1;
  const isReview = APP.markedReviews.has(`${sid}-${uid}-${topicIndex}`);
  const rb = document.getElementById('review-btn');
  if (rb) {
    rb.classList.toggle('marked', isReview);
    rb.textContent = isReview ? '🔖 Marked for Review' : '🔖 Mark for Review';
  }

  const wrapper = document.getElementById('video-embed-wrapper') || document.querySelector('.video-embed-wrapper');
  if (!wrapper) {
    console.error('Element not found: video-embed-wrapper');
    return;
  }
  const descEl = document.getElementById('video-topic-desc');

  if (url.includes('youtube.com') || url.includes('youtu.be')) {
    const videoId = convertYouTubeToEmbed(url);
    if (videoId) {
      renderStudentYouTubeVideo(wrapper, item, topicIndex, videoId, title);
      if (descEl) descEl.textContent = item.videos?.[urlIndex]?.description || `Now watching: ${title}`;
      renderTopicInlineNotes(title, sid, uid, topicIndex);
      return;
    }
  }

  wrapper.innerHTML = `
      <div class="video-placeholder">
        <div style="font-size:3rem;opacity:0.7;">🔗</div>
        <div style="color:#fff;font-size:0.9rem;opacity:0.9;text-align:center;padding:0 1rem;">${title}</div>
        <button class="play-btn-big" onclick="window.open('${url}','_blank')" style="font-size:1rem;">Open ↗</button>
        <div style="opacity:0.6;font-size:0.8rem;color:#fff;">Opens in new tab</div>
      </div>`;
  if (descEl) descEl.textContent = item.videos?.[urlIndex]?.description || `External video: ${title}.`;
  renderTopicInlineNotes(title, sid, uid, topicIndex);
}

export async function renderTopicInlineNotes(topicTitle, subjectId, unitNum, topicIdx) {
  const el = document.getElementById('topic-inline-notes');
  if (!el) return;

  const subject = APP.currentSubject;
  const unitId = unitNum || APP.currentUnit || 1;
  let topicData = null;
  let topicNotes = [];

  if (window.aimeasyFetchUnitRoadmap && window.aimeasyListContent && subject) {
    const ctx = await window.aimeasyFetchUnitRoadmap({
      subject,
      unit: { id: unitId, name: `Unit ${unitId}`, dbUnitId: subject?.dbUnitIds?.[unitId] },
    });
    if (ctx?.data?.subjectId && ctx?.data?.unitId) {
      topicData = (ctx.data.topics || [])[topicIdx] || null;
      const { data } = await window.aimeasyListContent({ subjectId: ctx.data.subjectId, unitId: ctx.data.unitId, contentType: 'note' });
      if (data) {
        topicNotes = data.filter(n => {
          const meta = n.metadata || {};
          return meta.topicIndex === topicIdx || (meta.topicTitle && meta.topicTitle.toLowerCase() === topicTitle.toLowerCase());
        }).map(n => ({
          title: n.title || 'Untitled Note',
          type: n.url?.endsWith('.pdf') ? 'pdf' : (n.url?.endsWith('.doc') || n.url?.endsWith('.docx') ? 'doc' : 'link'),
          link: n.url
        }));
      }
    }
  }

  if (!topicData && !topicNotes.length) {
    el.style.display = 'none';
    return;
  }
  el.style.display = 'block';
  let html = `<div style="font-size:0.78rem;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;color:var(--text3);margin-bottom:8px;">📋 Topic Notes</div>`;
  if (topicData?.description) {
    html += `<p style="font-size:0.85rem;color:var(--text2);line-height:1.65;margin-bottom:10px;">${topicData.description}</p>`;
  }
  if (topicData?.keyPoints?.length) {
    html += `<ul style="padding-left:1.2rem;margin-bottom:10px;">` +
      topicData.keyPoints.map(p => `<li style="font-size:0.83rem;color:var(--text2);margin-bottom:4px;">${p}</li>`).join('') +
      `</ul>`;
  }
  topicNotes.forEach(n => {
    html += `<div class="note-row" style="margin-bottom:6px;" onclick="previewNoteInline('${(n.link || '').replace(/'/g, "\\'")}','${n.title.replace(/'/g, "\\'")}')">
      <div class="note-icon">${n.type === 'pdf' ? '📄' : n.type === 'doc' ? '📝' : '🔗'}</div>
      <div class="note-info"><div class="note-title">${n.title}</div><div class="note-desc">Tap to preview</div></div>
      <div class="note-actions"></div>
    </div>`;
  });
  el.innerHTML = html;
}

export function selectVideo(idx, title, subjectId, unitNum) {
  // If called from video item click, delegate to selectVideoItem
  selectVideoItem(idx);
}
