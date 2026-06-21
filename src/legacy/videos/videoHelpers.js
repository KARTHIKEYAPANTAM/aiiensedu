// Common legacy helpers used across modules
const esc = (value) => String(value ?? '').replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
const js = (value) => String(value ?? '').replace(/\\/g, '\\\\').replace(/'/g, "\\'");
const sb = () => window.__AIMEASY_SUPABASE__;
const todayKeyDb = (date = new Date()) => date.toISOString().slice(0, 10);
const pctFromCgpa = (cgpa) => Math.max(0, Math.min(100, Number(cgpa || 0) * 9.5));

export function convertYouTubeToEmbed(url) {
  if (!url) return null;
  const videoIdMatch = String(url).match(/(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/watch\?(?:.*&)?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)([^&?\/\s]+)/);
  const videoId = videoIdMatch ? videoIdMatch[1] : null;
  console.log('[VIDEO] URL Parsed', { url, videoId });
  return videoId;
}

export function studentVideoResumeKey(item, idx) {
  const sid = APP.currentSubject?.id || 'default';
  const uid = APP.currentUnit || 1;
  return `student-video:${sid}:${uid}:${idx}:${item?.url || ''}`;
}

export function studentVideoStartSeconds(item, idx) {
  const key = studentVideoResumeKey(item, idx);
  return Math.max(0, Math.floor(Number(sessionStorage.getItem(key) || 0)));
}

export function storeStudentVideoPosition(item, idx, seconds) {
  if (!item?.url || !Number.isFinite(seconds)) return;
  sessionStorage.setItem(studentVideoResumeKey(item, idx), String(Math.max(0, Math.floor(seconds))));
}

export function ensureYouTubeIframeApi(callback) {
  if (window.YT?.Player) {
    callback();
    return;
  }
  const pending = window.__aimeasyYouTubeReadyCallbacks || [];
  pending.push(callback);
  window.__aimeasyYouTubeReadyCallbacks = pending;
  if (!document.getElementById('youtube-iframe-api')) {
    const script = document.createElement('script');
    script.id = 'youtube-iframe-api';
    script.src = 'https://www.youtube.com/iframe_api';
    document.head.appendChild(script);
  }
  const previousReady = window.onYouTubeIframeAPIReady;
  window.onYouTubeIframeAPIReady = function onYouTubeIframeAPIReady() {
    if (typeof previousReady === 'function') previousReady();
    const callbacks = window.__aimeasyYouTubeReadyCallbacks || [];
    window.__aimeasyYouTubeReadyCallbacks = [];
    callbacks.forEach(fn => fn());
  };
}

export function renderStudentYouTubeVideo(wrapper, item, idx, videoId, title) {
  const startSeconds = studentVideoStartSeconds(item, idx);
  wrapper.innerHTML = '<div id="student-video-player" style="width:100%;height:100%;border-radius:var(--radius-lg);overflow:hidden;"></div>';
  console.log('[VIDEO] Embed Created', { videoId, title, startSeconds });
  window.aimeasyStudentVideoPlayer = null;
  ensureYouTubeIframeApi(() => {
    const host = document.getElementById('student-video-player');
    if (!host) return;
    window.aimeasyStudentVideoPlayer = new YT.Player('student-video-player', {
      width: '100%',
      height: '100%',
      videoId,
      playerVars: {
        autoplay: 1,
        start: startSeconds,
        rel: 0,
      },
      events: {
        onReady(event) {
          if (startSeconds > 0) event.target.seekTo(startSeconds, true);
          event.target.playVideo();
          console.log('[VIDEO] Player Loaded', { videoId, title });
          console.log('[STUDENT] Video Loaded', { videoId, title });
        },
        onStateChange(event) {
          const player = event.target;
          if (player?.getCurrentTime) {
            storeStudentVideoPosition(item, idx, player.getCurrentTime());
          }
        }
      }
    });
  });
  const fallbackSrc = `https://www.youtube.com/embed/${videoId}?autoplay=1&enablejsapi=1&start=${startSeconds}`;
  window.setTimeout(() => {
    const host = document.getElementById('student-video-player');
    if (host && !host.querySelector('iframe') && !window.aimeasyStudentVideoPlayer) {
      host.outerHTML = `<iframe id="student-video-player" width="100%" height="100%" src="${fallbackSrc}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen style="border-radius:var(--radius-lg);"></iframe>`;
    }
  }, 1200);
}

export function aimeasySaveStudentVideoPositionaimeasySaveStudentVideoPosition() {
  const item = APP._videoItems?.[APP.currentVideoIndex];
  const player = window.aimeasyStudentVideoPlayer;
  if (item?.url && player?.getCurrentTime) {
    try {
      storeStudentVideoPosition(item, APP.currentVideoIndex, player.getCurrentTime());
    } catch (e) { }
  }
  try {
    player?.stopVideo?.();
    player?.destroy?.();
  } catch (e) { }
  window.aimeasyStudentVideoPlayer = null;
}

export function aimeasyResumeStudentVideoaimeasyResumeStudentVideo() {
  const item = APP._videoItems?.[APP.currentVideoIndex];
  if (item?.url) selectVideoItem(APP.currentVideoIndex);
}

export function playCurrentVideo() {
  const item = APP._videoItems?.[APP.currentVideoIndex];
  if (item?.url) {
    openApprovedVideo(item.url);
  } else {
    showToast('▶ This topic has no video URL yet. Sub admin can add one!', 'blue');
  }
}

export function playVideo() { playCurrentVideo(); }

export function submitVideoSuggestion() {
  const input = document.getElementById('suggest-url-input');
  const url = input.value.trim();
  if (!url) { showToast('Please enter a URL', 'red'); return; }
  if (!url.startsWith('http')) { showToast('Please enter a valid URL', 'red'); return; }
  // Store in localStorage as pending request
  const requests = JSON.parse(localStorage.getItem('edusync_url_requests') || '[]');
  const req = {
    id: Date.now(),
    url,
    subject: APP.currentSubject?.name || 'Unknown',
    unit: APP.currentUnit || 1,
    submittedBy: APP.user?.name || 'Student',
    submittedAt: new Date().toLocaleString(),
    status: 'pending'
  };
  requests.push(req);
  localStorage.setItem('edusync_url_requests', JSON.stringify(requests));
  input.value = '';
  renderPendingUrls();
  showToast('✅ URL submitted! Awaiting admin approval.', 'green');
}

export function openApprovedVideo(url) {
  // Re-render the video list so the approved video now shows in the sidebar
  const sid = APP.currentSubject?.id || 'os';
  const uid = APP.currentUnit || 1;
  renderVideoList(sid, uid);
  // Find the item index for this URL and select it
  const idx = (APP._videoItems || []).findIndex(v => v.url === url);
  if (idx >= 0) {
    selectVideoItem(idx);
    showToast('▶ Playing approved video!', 'green');
  } else {
    // Fallback: embed directly
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
      const videoId = url.match(/(?:v=|youtu\.be\/|embed\/)([^&?/]+)/)?.[1];
      if (videoId) {
        document.querySelector('.video-embed-wrapper').innerHTML = `<iframe width="100%" height="100%" src="https://www.youtube.com/embed/${videoId}" frameborder="0" allowfullscreen style="border-radius:var(--radius-lg);"></iframe>`;
        return;
      }
    }
    window.open(url, '_blank');
  }
}

export function uploadVideo() {
  const title = document.getElementById('sa-vtitle').value.trim();
  const url = document.getElementById('sa-vurl').value.trim();
  const subject = document.getElementById('sa-vsubject').value.trim();
  const unit = document.getElementById('sa-vunit').value;
  const topic = document.getElementById('sa-vtopic')?.value || '';
  if (!title || !url) { showToast('Please fill title and URL', 'red'); return; }
  if (!url.startsWith('http')) { showToast('Please enter a valid URL', 'red'); return; }
  // Save video to localStorage so students can see it
  const videos = JSON.parse(localStorage.getItem('edusync_admin_videos') || '[]');
  videos.push({
    id: Date.now(),
    title, url, subject, unit: parseInt(unit) || 1,
    topic: topic || '',
    uploadedAt: new Date().toLocaleString(),
    uploadedBy: APP.subAdminData?.username || 'Sub Admin'
  });
  localStorage.setItem('edusync_admin_videos', JSON.stringify(videos));
  showToast('✅ Video uploaded! Students can now see it.', 'green');
  document.getElementById('sa-vtitle').value = '';
  document.getElementById('sa-vurl').value = '';
  // Show uploaded videos list
  renderUploadedVideosList();
}

export function renderUploadedVideosList() {
  const listEl = document.getElementById('sa-videos-list');
  if (!listEl) return;
  const videos = JSON.parse(localStorage.getItem('edusync_admin_videos') || '[]');
  if (!videos.length) { listEl.innerHTML = ''; return; }
  listEl.innerHTML = '<h4 style="margin-bottom:8px;font-size:0.85rem;">Uploaded Videos (' + videos.length + ')</h4>' +
    videos.map(v => `
      <div style="display:flex;align-items:center;gap:8px;padding:8px 12px;background:var(--surface2);border:1px solid var(--border);border-radius:var(--radius-sm);margin-bottom:6px;font-size:0.82rem;">
        <span style="flex:1;font-weight:600;">🎬 ${v.title}</span>
        <span class="badge badge-teal">${v.subject || 'All'}</span>
        <span class="badge badge-lavender">Unit ${v.unit || 1}</span>
        <span class="badge badge-green">Live</span>
        <!-- Sub Admin cannot delete -->
      </div>`).join('');
}

export function v10NormalizeVideosFromRow(row) {
  return Array.from(row.querySelectorAll('.v10-url-row')).map((urlRow) => ({
    url: urlRow.querySelector('.v10-url-input')?.value.trim() || '',
    description: urlRow.querySelector('.v10-video-desc-input')?.value.trim() || '',
  })).filter(video => video.url || video.description);
}

export function v10VideoSubTopic(video, index) {
  return (video?.subTopicName || video?.description || video?.sub_topic_name || video?.title || `Resource ${index + 1}`).trim();
}

export function v10NormalizeVideosFromRowSubtopics(row) {
  const urlRow = row.querySelector('.v10-url-row');
  if (!urlRow) return [];
  const video = {
    subTopicName: urlRow.querySelector('.v10-subtopic-input')?.value.trim() || '',
    url: urlRow.querySelector('.v10-url-input')?.value.trim() || '',
    description: urlRow.querySelector('.v10-video-desc-input')?.value.trim() || '',
  };
  return [video].filter(v => v.subTopicName || v.url || v.description);
}

export async function renderVideoListDbSubtopics(subjectId, unitNum) {
  let roadmapTopics = [];
  let roadmapContext = null;
  if (subjectId) {
    const dbSubject = APP.currentSubject;
    if (window.aimeasyFetchUnitRoadmap && dbSubject) {
      const { data, error } = await window.aimeasyFetchUnitRoadmap({
        subject: dbSubject,
        unit: { id: unitNum, name: `Unit ${unitNum}` },
      });
      if (error) {
        console.warn('[STUDENT] Roadmap Failed', error);
        showToast?.('Roadmap load failed: ' + (error.message || JSON.stringify(error)), 'red');
      } else {
        roadmapTopics = data?.topics || [];
        roadmapContext = data || null;
      }
    }
  }

  const list = document.getElementById('video-list');
  if (!list) return;
  hydrateMarkedReviews();
  const unitState = readStudentUnitState(APP.currentSubject?.id || subjectId, unitNum);
  APP.currentVideoIndex = Math.max(0, Number(unitState.videoIndex || 0));
  APP._videoItems = [];

  const approvedSuggestions = await fetchApprovedTopicSuggestions(roadmapContext?.subjectId, roadmapContext?.unitId);
  const suggestionsByTopic = approvedSuggestions.reduce((map, row) => {
    const key = String(row.topic_id || '');
    if (!key) return map;
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(row);
    return map;
  }, new Map());

  const groupedHtml = roadmapTopics.map((topic, topicIndex) => {
    const topicTitle = topic.topicName || topic.name || `Topic ${topicIndex + 1}`;
    const adminVideos = Array.isArray(topic.videos) && topic.videos.length
      ? topic.videos
      : (topic.youtubeUrls || topic.urls || []).map((url) => ({ url, description: '' }));
    const suggestedVideos = (suggestionsByTopic.get(String(topic.id || topic.dbContentId || '')) || []).map((row) => ({
      id: row.id,
      url: row.url,
      title: row.title || 'Suggested URL',
      description: row.description || '',
      source: 'suggestion',
    }));
    const sourceVideos = [...adminVideos, ...suggestedVideos]
      .map((video) => ({
        id: video.id || video.dbContentId || '',
        url: (video.url || video.youtubeUrl || '').trim(),
        title: video.title || video.description || topicTitle,
        description: video.description || '',
        source: video.source || 'admin',
      }))
      .filter((video) => video.url || video.description);
    const displayVideos = sourceVideos.length ? sourceVideos : [{ url: '', title: topicTitle, description: '', source: 'admin' }];
    const baseIndex = APP._videoItems.length;
    displayVideos.forEach((video, videoIndex) => APP._videoItems.push({
      type: video.source === 'suggestion' ? 'suggested' : 'roadmap',
      id: topic.id || topic.dbContentId || '',
      topicId: topic.id || topic.dbContentId || '',
      suggestionId: video.source === 'suggestion' ? video.id : '',
      title: topicTitle,
      url: video.url,
      description: video.description || '',
      topicIndex,
      videoIndex,
    }));
    const extraButtons = displayVideos.length > 1 ? `<div class="video-item-extras">${displayVideos.map((video, videoIndex) => {
      const label = video.source === 'suggestion' ? `Suggested ${videoIndex}` : `Video ${videoIndex + 1}`;
      return `<button type="button" class="video-extra-btn" onclick="event.stopPropagation(); selectTopicUrl(${topicIndex},${videoIndex})">${v10Html(label)}</button>`;
    }).join('')}</div>` : '';
    const hasApproved = displayVideos.some((video) => video.source === 'suggestion');
    return `<button type="button" class="video-item ${topicIndex === APP.currentVideoIndex ? 'active' : ''}" data-topic-index="${topicIndex}" onclick="selectVideoItem(${baseIndex})">
      <div class="video-connector"></div>
      <div class="video-item-dot">${topicIndex + 1}</div>
      <div class="video-item-info">
        <div class="video-item-title">${v10Html(topicTitle)}${hasApproved ? ' <span class="badge badge-green">Suggested URLs</span>' : ''}</div>
        ${extraButtons}
      </div>
    </button>`;
  }).join('');

  list.innerHTML = groupedHtml;
  if (APP._videoItems.length) {
    const restoredIndex = Math.min(APP.currentVideoIndex, APP._videoItems.length - 1);
    selectVideoItem(restoredIndex);
    const restoredTab = unitState.tab || APP.currentTab;
    if (restoredTab && restoredTab !== 'videos') window.setTimeout(() => switchTab(restoredTab), 0);
  } else {
    const wrapper = document.getElementById('video-embed-wrapper') || document.querySelector('.video-embed-wrapper');
    if (wrapper) {
      wrapper.innerHTML = `<div class="video-placeholder"><div style="font-size:3.5rem;margin-bottom:4px;">Video</div><div style="opacity:0.75;font-size:0.95rem;color:#fff;">No roadmap available yet</div><div style="font-size:0.8rem;opacity:0.6;margin-top:1rem;">SubAdmin has not saved roadmap videos for this unit</div></div>`;
    }
    const descEl = document.getElementById('video-topic-desc');
    if (descEl) descEl.textContent = 'No roadmap records are saved for this subject and unit yet.';
  }
}

export function selectVideoItemFlat(idx) {
  APP.currentVideoIndex = idx;
  const item = APP._videoItems?.[idx];
  if (!item) return;
  document.querySelectorAll('.video-item').forEach(el => el.classList.toggle('active', Number(el.dataset.topicIndex) === item.topicIndex));
  writeStudentUnitState({ videoIndex: idx, topicIndex: item.topicIndex, tab: APP.currentTab || 'videos' });
  syncRoadmapNodeStates();

  const displayTitle = item.title;
  const nowLabel = document.getElementById('now-playing-label');
  if (nowLabel) nowLabel.textContent = displayTitle;
  const topicTitleEl = document.getElementById('video-topic-title');
  if (topicTitleEl) topicTitleEl.textContent = displayTitle;

  const sid = APP.currentSubject?.id || 'os';
  const uid = APP.currentUnit || 1;
  recordStudyActivity('video_opened', { subjectId: sid, subjectName: APP.currentSubject?.name || '', unitId: uid, topicIndex: item.topicIndex });
  const reviewKey = topicReviewKey(sid, uid, item.topicIndex);
  const rb = document.getElementById('review-btn');
  if (rb) {
    const isReview = APP.markedReviews.has(reviewKey);
    rb.classList.toggle('marked', isReview);
    rb.textContent = isReview ? 'Marked for Review' : 'Mark for Review';
  }

  const wrapper = document.getElementById('video-embed-wrapper') || document.querySelector('.video-embed-wrapper');
  const descEl = document.getElementById('video-topic-desc');
  if (!wrapper) return;
  const url = item.url || '';
  const videoId = convertYouTubeToEmbed(url);
  if (videoId) {
    renderStudentYouTubeVideo(wrapper, item, idx, videoId, displayTitle);
    if (descEl) descEl.textContent = '';
    renderTopicInlineNotes(item.title, sid, uid, item.topicIndex);
    window.renderPendingUrls?.();
    return;
  }
  if (url) {
    if (/\.(mp4|webm|ogg)(\?|#|$)/i.test(url)) {
      wrapper.innerHTML = `<video src="${v10EscapeAttr(url)}" controls autoplay playsinline style="width:100%;height:100%;border-radius:var(--radius-lg);background:#000;"></video>`;
    } else {
      wrapper.innerHTML = `<iframe src="${v10EscapeAttr(url)}" frameborder="0" allowfullscreen></iframe>`;
    }
    if (descEl) descEl.textContent = '';
    renderTopicInlineNotes(item.title, sid, uid, item.topicIndex);
    window.renderPendingUrls?.();
    return;
  }
  wrapper.innerHTML = `<div class="video-placeholder"><div style="font-size:3.5rem;margin-bottom:4px;">Video</div><div style="opacity:0.75;font-size:0.95rem;color:#fff;margin-top:6px;">${v10Html(displayTitle)}</div></div>`;
  if (descEl) descEl.textContent = 'Video coming soon.';
  renderTopicInlineNotes(item.title, sid, uid, item.topicIndex);
  window.renderPendingUrls?.();
}

export function prevVideoFlat() {
  if (APP.currentVideoIndex > 0) {
    selectVideoItem(APP.currentVideoIndex - 1);
    showToast('Previous video', 'blue');
  } else {
    showToast('This is the first video', 'amber');
  }
}

export function nextVideoFlat() {
  const total = APP._videoItems?.length || 0;
  const item = APP._videoItems?.[APP.currentVideoIndex];
  const sid = APP.currentSubject?.id || 'os';
  const uid = APP.currentUnit || 1;
  const active = document.querySelector(`.video-item[data-topic-index="${item?.topicIndex ?? APP.currentVideoIndex}"]`);
  active?.classList.add('completed');
  if (item) {
    markTopicCompleted(sid, uid, item.topicIndex);
    syncTopicProgressToDb({ subjectId: sid, unitId: uid, topicIndex: item.topicIndex, topicId: item.id || item.topicId || null, status: 'completed' });
  }
  if (APP.currentVideoIndex < total - 1) {
    selectVideoItem(APP.currentVideoIndex + 1);
    document.querySelector(`.video-item[data-topic-index="${APP._videoItems?.[APP.currentVideoIndex]?.topicIndex ?? APP.currentVideoIndex}"]`)?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    showToast('Progress saved', 'green');
  } else {
    showToast('Unit complete', 'green');
  }
}
