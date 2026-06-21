// Common legacy helpers used across modules
const esc = (value) => String(value ?? '').replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
const js = (value) => String(value ?? '').replace(/\\/g, '\\\\').replace(/'/g, "\\'");
const sb = () => window.__AIMEASY_SUPABASE__;
const todayKeyDb = (date = new Date()) => date.toISOString().slice(0, 10);
const pctFromCgpa = (cgpa) => Math.max(0, Math.min(100, Number(cgpa || 0) * 9.5));

export async function renderVideoList(subjectId, unitNum) {
  // Database is the source of truth for sub-admin roadmap topics.
  let roadmapTopics = null;
  if (subjectId) {
    const rawId = String(subjectId).startsWith('custom_') ? String(subjectId).replace('custom_', '') : subjectId;
    const dbSubject = APP.currentSubject;
    if (window.aimeasyFetchUnitRoadmap && dbSubject) {
      const { data, error } = await window.aimeasyFetchUnitRoadmap({
        subject: dbSubject,
        unit: { id: unitNum, name: `Unit ${unitNum}`, dbUnitId: dbSubject?.dbUnitIds?.[unitNum] },
      });
      if (error) {
        console.warn('[ROADMAP] Student Load Failed', error);
        console.warn('[STUDENT] Roadmap Failed', error);
        showToast?.('Roadmap load failed: ' + (error.message || JSON.stringify(error)), 'red');
      } else {
        console.log('[ROADMAP] Student Load Success', {
          subjectId: data?.subjectId,
          unitId: data?.unitId,
          topicCount: data?.unit?.topics?.length || 0,
        });
        console.log('[STUDENT] Roadmap Loaded', {
          subjectId: data?.subjectId,
          unitId: data?.unitId,
          topicCount: data?.unit?.topics?.length || 0,
        });
        roadmapTopics = data?.unit?.topics || [];
      }
    }
  }

  // Student roadmap must come only from Supabase records created by SubAdmin.
  const topics = Array.isArray(roadmapTopics) ? roadmapTopics : [];
  console.log('Topics:', topics);
  const list = document.getElementById('video-list');
  APP.currentVideoIndex = 0;

  // Remove duplicate topics (case-insensitive comparison)
  const uniqueTopics = [];
  const seenTopics = new Set();
  topics.forEach(t => {
    const title = typeof t === 'string' ? t : (t.topicName || t.name || '').toString();
    const normalized = title.toLowerCase().trim();
    if (!seenTopics.has(normalized)) {
      seenTopics.add(normalized);
      uniqueTopics.push(t);
    }
  });

  // Roadmap only renders topic items; videos are a property on the topic.
  const builtinItems = uniqueTopics.map((t, i) => {
    const title = typeof t === 'string' ? t : (t.topicName || t.name || 'Untitled');
    const videos = typeof t === 'string'
      ? []
      : Array.isArray(t.videos)
        ? t.videos.map(video => ({
          url: (video.url || video.youtubeUrl || '').trim(),
          description: video.description || video.title || '',
        })).filter(video => video.url || video.description)
        : [];
    const urls = videos.length
      ? videos.map(video => video.url).filter(Boolean)
      : typeof t === 'string'
        ? []
        : Array.isArray(t.youtubeUrls)
          ? t.youtubeUrls.filter(Boolean)
          : [(t.youtubeUrl || t.url || '').trim()].filter(Boolean);
    const url = urls[0] || null;
    const extraUrls = urls.slice(1);
    return { type: 'builtin', title, url, urls, videos, extraUrls, description: videos[0]?.description || '', index: i, topicIndex: i };
  });

  APP._videoItems = builtinItems;

  list.innerHTML = APP._videoItems.map((item, i) => {
    const isCompleted = item.type === 'builtin' && APP.markedReviews.has(`${subjectId}-${unitNum}-${i}`) ? false : item.type === 'builtin' && i < 2;
    const dur = 'Video';
    const badge = item.type === 'admin' ? ' <span style="font-size:0.65rem;background:var(--teal);color:#fff;padding:1px 5px;border-radius:50px;">▶ VIDEO</span>' :
      item.type === 'approved' ? ' <span style="font-size:0.65rem;background:var(--primary);color:#fff;padding:1px 5px;border-radius:50px;">LINK</span>' : '';
    const extraLinks = item.extraUrls?.length ? `<div class="video-item-extras">${item.extraUrls.map((u, j) => `<button class="video-extra-btn" onclick="event.stopPropagation(); selectTopicUrl(${i},${j + 1})">Video ${j + 2}</button>`).join('')}</div>` : '';
    const videoTree = item.videos?.length ? `<div class="roadmap-video-tree">${item.videos.map((video, vi) => video.description ? `<div class="roadmap-video-child">${vi === item.videos.length - 1 ? '└──' : '├──'} ${video.description}</div>` : '').join('')}</div>` : '';
    return `<div class="video-item ${isCompleted ? 'completed' : ''} ${i === 0 ? 'active' : ''}" id="vi-${i}" onclick="selectVideo(${i},'${item.title.replace(/'/g, '&#39;')}')">
      <div class="video-connector"></div>
      <div class="video-item-dot">${isCompleted ? '✓' : i + 1}</div>
      <div class="video-item-info">
        <div class="video-item-title">${item.title}${badge}</div>
        ${videoTree}
        <div class="video-item-dur">${item.url ? '▶ Embedded Video' : 'No video URL yet'}</div>
        ${extraLinks}
      </div>
    </div>`;
  }).join('');

  list.querySelectorAll('.video-item-dur').forEach(el => el.remove());

  // Select first item
  if (APP._videoItems.length > 0) {
    selectVideoItem(0);
  } else {
    // Show no content message
    const wrapper = document.getElementById('video-embed-wrapper') || document.querySelector('.video-embed-wrapper');
    if (wrapper) {
      wrapper.innerHTML = `
        <div class="video-placeholder">
          <div style="font-size:3.5rem;margin-bottom:4px;">🎬</div>
          <div style="opacity:0.75;font-size:0.95rem;color:#fff;">No roadmap available yet</div>
          <div style="font-size:0.8rem;opacity:0.6;margin-top:1rem;">SubAdmin has not saved roadmap videos for this unit</div>
        </div>`;
    }
    document.getElementById('video-topic-desc').textContent = 'No roadmap records are saved for this subject and unit yet.';
  }
}
