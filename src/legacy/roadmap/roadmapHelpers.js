// Common legacy helpers used across modules
const esc = (value) => String(value ?? '').replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
const js = (value) => String(value ?? '').replace(/\\/g, '\\\\').replace(/'/g, "\\'");
const sb = () => window.__AIMEASY_SUPABASE__;
const todayKeyDb = (date = new Date()) => date.toISOString().slice(0, 10);
const pctFromCgpa = (cgpa) => Math.max(0, Math.min(100, Number(cgpa || 0) * 9.5));

export function toggleRoadmapSidebar() {
  const sidebar = document.getElementById('video-sidebar');
  const icon = document.getElementById('sidebar-toggle-icon');
  if (!sidebar) return;
  const isCollapsed = sidebar.classList.toggle('collapsed');
  if (icon) icon.textContent = isCollapsed ? '▶' : '◀';
  try { localStorage.setItem('edusync_roadmap_open', isCollapsed ? '0' : '1'); } catch (e) { }
}

export function restoreRoadmapSidebarState() {
  try {
    const open = localStorage.getItem('edusync_roadmap_open');
    if (open === '0') {
      const sidebar = document.getElementById('video-sidebar');
      const icon = document.getElementById('sidebar-toggle-icon');
      if (sidebar) sidebar.classList.add('collapsed');
      if (icon) icon.textContent = '▶';
    }
  } catch (e) { }
}

export function openRoadmapCreator(subjectId, subjectName) {
  const creator = document.getElementById('sa-roadmap-creator');
  if (!creator) return;
  creator.style.display = 'block';
  creator.scrollIntoView({ behavior: 'smooth', block: 'start' });
  const label = document.getElementById('sa-roadmap-subject-label');
  if (label) label.textContent = subjectName;
  creator.dataset.subjectId = subjectId;
  creator.dataset.subjectName = subjectName;

  const roadmaps = JSON.parse(localStorage.getItem('edusync_roadmaps') || '{}');
  const existing = roadmaps[subjectId] || Array.from({ length: 5 }, (_, i) => ({
    unit: i + 1,
    topics: ['', '', '', '', '']
  }));

  const unitNames = [
    'Unit 1 - Foundations',
    'Unit 2 — Advanced Algorithms & Theory',
    'Unit 3 — Design Patterns & Architecture',
    'Unit 4 — Integration & Performance',
    'Unit 5 - Emerging Topics'
  ];

  const container = document.getElementById('sa-roadmap-units');
  container.innerHTML = existing.map((unit, ui) => `
    <div style="border:1px solid var(--border);border-radius:var(--radius-md);overflow:hidden;">
      <div style="padding:10px 14px;background:linear-gradient(135deg,var(--primary-light),var(--lavender-light));font-weight:700;font-size:0.9rem;display:flex;align-items:center;gap:8px;">
        <span style="width:28px;height:28px;background:var(--primary);color:#fff;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:0.8rem;flex-shrink:0;">${ui + 1}</span>
        ${unitNames[ui]}
      </div>
      <div style="padding:12px 14px;display:flex;flex-direction:column;gap:8px;" id="roadmap-unit-${ui}">
        ${unit.topics.map((t, ti) => `
          <div style="display:flex;align-items:center;gap:8px;">
            <div style="display:flex;flex-direction:column;align-items:center;gap:2px;">
              <div style="width:14px;height:14px;border-radius:50%;background:${t.trim() ? 'var(--primary)' : 'var(--border)'};border:2px solid var(--surface);flex-shrink:0;"></div>
              ${ti < unit.topics.length - 1 ? '<div style="width:2px;height:16px;background:var(--border);"></div>' : ''}
            </div>
            <input class="input" placeholder="Subtopic ${ti + 1} (e.g. Introduction to Trees)" value="${t}" style="flex:1;font-size:0.85rem;padding:7px 11px;" oninput="refreshRoadmapDots(${ui})" id="topic-${ui}-${ti}">
            <button onclick="removeRoadmapTopic(${ui},${ti})" class="btn-icon" style="padding:6px;font-size:0.8rem;" title="Remove">✕</button>
          </div>
        `).join('')}
        <button class="btn btn-ghost btn-sm" onclick="addRoadmapTopic(${ui})" style="align-self:flex-start;margin-top:4px;">+ Add Topic</button>
      </div>
    </div>
  `).join('');
}

export function refreshRoadmapDots(unitIdx) {
  const container = document.getElementById(`roadmap-unit-${unitIdx}`);
  if (!container) return;
  container.querySelectorAll('input').forEach((inp, i) => {
    const dot = container.querySelectorAll('.roadmap-dot')[i];
    if (dot) dot.style.background = inp.value.trim() ? 'var(--primary)' : 'var(--border)';
  });
}

export function addRoadmapTopic(unitIdx) {
  const container = document.getElementById(`roadmap-unit-${unitIdx}`);
  if (!container) return;
  const inputs = container.querySelectorAll('input');
  const newIdx = inputs.length;
  const wrapper = document.createElement('div');
  wrapper.style.cssText = 'display:flex;align-items:center;gap:8px;';
  wrapper.innerHTML = `
    <div style="display:flex;flex-direction:column;align-items:center;gap:2px;">
      <div style="width:14px;height:14px;border-radius:50%;background:var(--border);border:2px solid var(--surface);flex-shrink:0;"></div>
    </div>
    <input class="input" placeholder="Subtopic ${newIdx + 1}" style="flex:1;font-size:0.85rem;padding:7px 11px;" id="topic-${unitIdx}-${newIdx}">
    <button onclick="this.parentElement.remove()" class="btn-icon" style="padding:6px;font-size:0.8rem;" title="Remove">✕</button>`;
  container.insertBefore(wrapper, container.lastElementChild);
}

export function removeRoadmapTopic(unitIdx, topicIdx) {
  const input = document.getElementById(`topic-${unitIdx}-${topicIdx}`);
  if (input) input.closest('div[style*="display:flex"]').remove();
}

export function updateRoadmapTopicSelector() {
  const subjectName = document.getElementById('sa-vsubject')?.value;
  const unit = document.getElementById('sa-vunit')?.value;
  const group = document.getElementById('sa-vtopic-group');
  const sel = document.getElementById('sa-vtopic');
  if (!group || !sel) return;
  if (!subjectName || !unit) { group.style.display = 'none'; return; }

  // Find subject id from name
  const customSubjects = JSON.parse(localStorage.getItem('edusync_custom_subjects') || '[]');
  const subj = customSubjects.find(s => s.name === subjectName);
  if (!subj) { group.style.display = 'none'; return; }

  const roadmaps = JSON.parse(localStorage.getItem('edusync_roadmaps') || '{}');
  const roadmap = roadmaps[subj.id];
  if (!roadmap) { group.style.display = 'none'; return; }

  const unitData = roadmap.find(u => u.unit === parseInt(unit));
  if (!unitData || !unitData.topics.length) { group.style.display = 'none'; return; }

  sel.innerHTML = '<option value="">Select a topic (optional)</option>' +
    unitData.topics.map(t => `<option value="${t}">${t}</option>`).join('');
  group.style.display = 'block';
}

export function v10RoadmapPanel(subjId, unitId, topics) {
  const rows = topics.length ? topics.map((t, i) => v10TopicRowHTML(
    subjId,
    unitId,
    i,
    t.name || t.topicName || '',
    Array.isArray(t.youtubeUrls) ? t.youtubeUrls : (t.youtubeUrl || t.url ? [t.youtubeUrl || t.url] : ['']),
    topics.length,
    t.id || ''
  )).join('')
    : `<div id="v10-rm-empty-${unitId}" style="text-align:center;padding:1.8rem;color:var(--text3);">
        <div style="font-size:2.2rem;margin-bottom:8px;">📍</div>
        <div style="font-weight:600;font-size:.88rem;">No topics yet</div>
        <div style="font-size:.76rem;margin-top:4px;">Click "+ Add Topic" to build the roadmap</div>
       </div>`;

  return `
  <div class="v10-panel">
    <div class="v10-panel-head">
      <h4>📍 Learning Roadmap</h4>
      <button class="btn btn-primary btn-sm" onclick="v10AddTopic('${subjId}','${unitId}')">+ Add Topic</button>
    </div>
    <div class="v10-panel-body">
      <div id="v10-topics-${unitId}">${rows}</div>
      <button class="btn btn-ghost" style="width:100%;margin-top:.6rem;" onclick="v10AddTopic('${subjId}','${unitId}')">+ Add Topic to Roadmap</button>
      <button class="v10-submit" onclick="v10SaveRoadmap('${subjId}','${unitId}')">💾 Save Learning Roadmap</button>
    </div>
  </div>`;
}

export function v10SaveRoadmap(subjId, unitId) {
  const container = document.getElementById('v10-topics-' + unitId);
  if (!container) return;
  const topics = [];
  container.querySelectorAll('.v10-topic-row').forEach(row => {
    const name = row.querySelector('.v10-topic-fields input:first-child')?.value.trim();
    const urls = Array.from(row.querySelectorAll('.v10-url-input'))
      .map(input => input.value.trim())
      .filter(Boolean);
    const primaryUrl = urls[0] || '';
    if (name) {
      const topicId = row.dataset.topicId || Date.now() + Math.random();
      const topic = {
        id: topicId,
        topicName: name,
        youtubeUrl: primaryUrl,
        youtubeUrls: urls,
        name,
        url: primaryUrl,
        urls: urls,
        notes: [],
        pyqs: [],
        importantQuestions: []
      };
      console.log('Saving Topic:', topic);
      topics.push(topic);
    }
  });

  /* Save to edusync_units */
  let units = JSON.parse(localStorage.getItem('edusync_units_' + subjId) || '[]');
  if (!units.length) units = Array.from({ length: 5 }, (_, i) => ({ id: i + 1, name: `Unit ${i + 1}`, topics: [] }));
  const ui = units.findIndex(u => u.id === unitId);
  if (ui >= 0) units[ui].topics = topics;
  else units.push({ id: unitId, name: `Unit ${unitId}`, topics });
  localStorage.setItem('edusync_units_' + subjId, JSON.stringify(units));

  /* Also sync edusync_roadmaps for student view */
  const roadmaps = JSON.parse(localStorage.getItem('edusync_roadmaps') || '{}');
  if (!roadmaps[subjId]) roadmaps[subjId] = [];
  let rm = roadmaps[subjId].find(r => r.unit === unitId);
  if (rm) rm.topics = topics.map(t => t.name);
  else roadmaps[subjId].push({ unit: unitId, topics: topics.map(t => t.name) });

  /* Topics are stored as unified topic objects in edusync_units_*; do not save separate admin video records. */

  localStorage.setItem('edusync_roadmaps', JSON.stringify(roadmaps));
  showToast('✅ Learning Roadmap saved! Students will see this.', 'green');
}

export function v10FormatRoadmapError(error) {
  if (!error) return 'Unknown Supabase error';
  return [
    error.code,
    error.message,
    error.details,
    error.hint,
  ].filter(Boolean).join(' | ') || JSON.stringify(error);
}

export function v10SavedRoadmapTree(topics, subjId, unitId) {
  const list = Array.isArray(topics) ? topics : [];
  if (!list.length) return '<div class="v10-saved-roadmap-empty">Saved roadmap will appear here after save.</div>';
  return `<div class="v10-saved-roadmap"><div class="v10-items-head">Saved Roadmap (${list.length})</div>${list.map((topic, ti) => {
    const videos = Array.isArray(topic.videos) && topic.videos.length
      ? topic.videos
      : (topic.youtubeUrls || topic.urls || []).map((url) => ({ url, description: '' }));
    const topicName = topic.name || topic.topicName || `Topic ${ti + 1}`;
    return `<div class="v10-saved-topic" data-topic-index="${ti}">
      <div class="v10-saved-topic-head" style="display:flex;gap:8px;align-items:center;margin-bottom:8px;">
        <input class="input v10-saved-topic-input" value="${String(topicName).replace(/"/g, '&quot;')}" onchange="v10EditSavedRoadmapTopic(${subjId},${unitId},${ti},this.value)" style="font-weight:700;font-size:.82rem;min-width:0;flex:1;" />
        <details class="v10-actions-menu"><summary title="Actions">...</summary><div class="v10-actions-dropdown">
          <button onclick="this.closest('details').removeAttribute('open');this.closest('.v10-saved-topic').querySelector('.v10-saved-topic-input')?.focus()">Edit</button>
          <button class="danger" onclick="v10DeleteSavedRoadmapTopic(${subjId},${unitId},${ti})">Delete</button>
        </div></details>
      </div>
      <div class="roadmap-video-tree">${videos.length ? videos.map((video, vi) => `<div class="roadmap-video-child" style="display:grid;grid-template-columns:minmax(0,1fr) auto;gap:6px;align-items:start;margin-top:6px;">
        <input class="input" value="${String(video.description || '').replace(/"/g, '&quot;')}" placeholder="Description ${vi + 1}" onchange="v10EditSavedRoadmapVideo(${subjId},${unitId},${ti},${vi},'description',this.value)" style="font-size:.76rem;" />
        <details class="v10-actions-menu"><summary title="Actions">...</summary><div class="v10-actions-dropdown">
          <button onclick="this.closest('.roadmap-video-child').querySelector('input')?.focus()">Edit</button>
          <button class="danger" onclick="v10DeleteSavedRoadmapVideo(${subjId},${unitId},${ti},${vi})">Delete</button>
        </div></details>
        <input class="input" value="${String(video.url || '').replace(/"/g, '&quot;')}" placeholder="Video URL ${vi + 1}" onchange="v10EditSavedRoadmapVideo(${subjId},${unitId},${ti},${vi},'url',this.value)" style="font-size:.76rem;grid-column:1 / -1;" />
      </div>`).join('') : '<div class="roadmap-video-child">No videos added yet</div>'}</div>
    </div>`;
  }).join('')}</div>`;
}

export function v10RoadmapPanelEnhanced(subjId, unitId, topics) {
  const rows = topics.length ? topics.map((t, i) => v10TopicRowHTML(
    subjId,
    unitId,
    i,
    t.name || t.topicName || '',
    Array.isArray(t.videos) && t.videos.length
      ? t.videos
      : (Array.isArray(t.youtubeUrls) ? t.youtubeUrls : (t.youtubeUrl || t.url ? [t.youtubeUrl || t.url] : [''])),
    topics.length,
    t.id || ''
  )).join('')
    : `<div id="v10-rm-empty-${unitId}" style="text-align:center;padding:1.8rem;color:var(--text3);">
        <div style="font-weight:600;font-size:.88rem;">No topics yet</div>
        <div style="font-size:.76rem;margin-top:4px;">Click "+ Add Topic" to build the roadmap</div>
       </div>`;

  return `
  <div class="v10-panel">
    <div class="v10-panel-head">
      <h4>Learning Roadmap</h4>
      <div class="v10-panel-actions">
        <button class="btn btn-primary btn-sm"onclick="v10AddTopic('${subjId}','${unitId}',false)">+ Add Main Topic</button>
        <button class="btn btn-ghost btn-sm"onclick="v10AddTopic('${subjId}','${unitId}',true)">+ Add Sub Topic</button>
      </div>
    </div>
    <div class="v10-panel-body">
      <div id="v10-topics-${unitId}">${rows}</div>
      <button class="v10-submit"onclick="v10SaveRoadmap('${subjId}','${unitId}')">Save Learning Roadmap</button>
      <div id="v10-saved-roadmap-${unitId}" style="margin-top:1rem;">${v10SavedRoadmapTree(topics, subjId, unitId)}</div>
    </div>
  </div>`;
}

export function v10RoadmapRows(unitId) {
  return Array.from(document.querySelectorAll(`#v10-topics-${unitId} .v10-topic-row`));
}

export function v10EditSavedRoadmapTopic(subjId, unitId, topicIdx, value) {
  const row = v10SavedRow(unitId, topicIdx);
  const input = row?.querySelector('.v10-topic-fields input:first-child');
  if (!input) return;
  input.value = value;
  v10DotUpdate?.(unitId, topicIdx, value);
  v10SaveRoadmap(subjId, unitId);
}

export function v10EditSavedRoadmapVideo(subjId, unitId, topicIdx, videoIdx, field, value) {
  const row = v10SavedRow(unitId, topicIdx);
  const videoRow = row?.querySelectorAll('.v10-url-row')?.[videoIdx];
  if (!videoRow) return;
  const target = field === 'description'
    ? videoRow.querySelector('.v10-video-desc-input')
    : videoRow.querySelector('.v10-url-input');
  if (!target) return;
  target.value = value;
  v10SaveRoadmap(subjId, unitId);
}

export function v10DeleteSavedRoadmapVideo(subjId, unitId, topicIdx, videoIdx) {
  const row = v10SavedRow(unitId, topicIdx);
  const videoRows = row ? Array.from(row.querySelectorAll('.v10-url-row')) : [];
  const videoRow = videoRows[videoIdx];
  if (!videoRow) return;
  if (videoRows.length === 1) {
    const urlInput = videoRow.querySelector('.v10-url-input');
    const descInput = videoRow.querySelector('.v10-video-desc-input');
    if (urlInput) urlInput.value = '';
    if (descInput) descInput.value = '';
  } else {
    videoRow.remove();
  }
  v10SaveRoadmap(subjId, unitId);
}

export function v10DeleteSavedRoadmapTopic(subjId, unitId, topicIdx) {
  const row = v10SavedRow(unitId, topicIdx);
  if (!row) return;
  row.remove();
  v10SaveRoadmap(subjId, unitId);
}

export async function v10SaveRoadmapEnhanced(subjId, unitId) {
  console.log('[ROADMAP] Save Started');
  const container = document.getElementById('v10-topics-' + unitId);
  if (!container) return;
  const topics = [];
  container.querySelectorAll('.v10-topic-row').forEach((row, index) => {
    const name = row.querySelector('.v10-topic-fields input:first-child')?.value.trim();
    const videos = v10NormalizeVideosFromRow(row);
    if (!name) return;
    const topicId = row.dataset.topicId || `${Date.now()}-${index}`;
    const urls = videos.map(video => video.url).filter(Boolean);
    topics.push({
      id: topicId,
      topicName: name,
      name,
      videos,
      youtubeUrl: urls[0] || '',
      youtubeUrls: urls,
      url: urls[0] || '',
      urls,
    });
  });

    const subject = JSON.parse(localStorage.getItem('edusync_custom_subjects') || '[]').find(s => String(s.id) === String(subjId)) || window._v10SASubj || window._v11AdminSubj;
  const units = JSON.parse(localStorage.getItem('edusync_units_' + subjId) || '[]');
  const unit = units.find(u => parseInt(u.id) === parseInt(unitId)) || { id: unitId, name: `Unit ${unitId}` };
  if (!window.aimeasySaveUnitRoadmap || !subject) {
    showToast('Roadmap DB save is unavailable. Supabase is the required source of truth.', 'red');
    return;
  }
  const { data, error } = await window.aimeasySaveUnitRoadmap({ subject, unit, topics });
  if (error) {
    const exact = v10FormatRoadmapError(error);
    console.error('[ROADMAP] Save Failed', error);
    showToast('Roadmap DB sync failed: ' + exact, 'red');
    return;
  }
    if (typeof window.v10PersistSubjectDbIds === 'function') {
      window.v10PersistSubjectDbIds(subjId, unitId, data);
    }
  await v10ReloadUnitRoadmapFromDb(subjId, unitId, { ...subject, dbSubjectId: data.subjectId }, { ...unit, dbUnitId: data.unitId });
    if (document.getElementById('sa-content')) {
      window.v10SAUnitDetail?.(subjId, unitId);
    } else if (document.getElementById('admin-content')) {
      window.v11AdminUnitDetail?.(subjId, unitId);
    }
  showToast('Learning Roadmap saved and refreshed.', 'green');
}

export function v10VideosFromRoadmapPanel(subjectName, unitId) {
  const topics = v10UnitTopics(unitId);
  const rows = topics.flatMap((topic, ti) => {
    const videos = Array.isArray(topic.videos) && topic.videos.length
      ? topic.videos
      : (topic.youtubeUrls || topic.urls || []).map(url => ({ url, description: '' }));
    return videos.map((video, vi) => ({ topic, ti, video, vi }));
  });
  return `<div class="v10-items"><div class="v10-items-head">Videos from Learning Roadmap (${rows.length})</div>
    ${rows.length ? rows.map(({ topic, ti, video, vi }) => `<div class="v10-item"><span>${vi === rows.length - 1 ? '└' : '├'}</span><div class="v10-item-body"><div class="v10-item-title">${topic.name || topic.topicName || `Topic ${ti + 1}`}</div><div class="v10-item-meta">${video.description || `Video ${vi + 1}`}</div><div class="v10-item-meta" style="color:var(--primary);word-break:break-all;">${video.url || ''}</div></div></div>`).join('') : '<p style="color:var(--text3);font-size:.83rem;padding:1rem;">No roadmap videos yet.</p>'}
  </div>`;
}

export function v10RoadmapTopicActionMenu(subjId, unitId, topicIdx) {
  return `<div class="v10-actions-menu">
    <button type="button" class="v10-actions-trigger" title="Actions" onclick="v10ToggleActionMenu(this)">...</button>
    <div class="v10-actions-dropdown">
      <button type="button" onclick="v10CloseActionMenus();v10OpenRoadmapEditModal(${subjId},${unitId},${topicIdx})">Edit Topic</button>
      <button type="button" class="danger" onclick="v10CloseActionMenus();v10DeleteSavedRoadmapTopic(${subjId},${unitId},${topicIdx})">Delete Topic</button>
    </div>
  </div>`;
}

export function v10SavedRoadmapTreeFixed(topics, subjId, unitId) {
  const list = Array.isArray(topics) ? topics : [];
  if (!list.length) return '<div class="v10-saved-roadmap-empty">Saved roadmap will appear here after save.</div>';
  return `<div class="v10-saved-roadmap"><div class="v10-items-head">Saved Roadmap (${list.length})</div>${list.map((topic, ti) => {
    const videos = Array.isArray(topic.videos) && topic.videos.length
      ? topic.videos
      : (topic.youtubeUrls || topic.urls || []).map((url) => ({ url, description: '' }));
    const topicName = topic.name || topic.topicName || `Topic ${ti + 1}`;
    return `<div class="v10-saved-topic" data-topic-index="${ti}">
      <div class="v10-saved-topic-head">
        <div class="v10-saved-topic-title">${topicName}</div>
        ${v10RoadmapTopicActionMenu(subjId, unitId, ti)}
      </div>
      <div class="roadmap-video-tree">${videos.length ? videos.map((video, vi) => `<div class="roadmap-video-child"><strong>Video ${vi + 1}:</strong> ${video.description || 'No description'}<br><span>${video.url || 'No URL'}</span></div>`).join('') : '<div class="roadmap-video-child">No videos added yet</div>'}</div>
    </div>`;
  }).join('')}</div>`;
}

export function v10OpenRoadmapEditModalv10OpenRoadmapEditModalSubtopic(subjId, unitId, topicIdx) {
  const row = v10SavedRow(unitId, topicIdx);
  if (!row) return;
  const topicInput = row.querySelector('.v10-topic-fields input:first-child');
  const videoRow = row.querySelector('.v10-url-row');
  const subTopicInput = videoRow?.querySelector('.v10-subtopic-input');
  const urlInput = videoRow?.querySelector('.v10-url-input');
  const descInput = videoRow?.querySelector('.v10-video-desc-input');
  const modal = document.createElement('div');
  modal.className = 'v10-edit-modal';
  modal.innerHTML = `<div class="v10-edit-box">
    <h3>Edit Topic</h3>
    <label>Topic<input class="input" id="v10-edit-topic-name" value="${v10EscapeAttr(topicInput?.value || '')}"></label>
    <label>Sub Topic Name<input class="input" id="v10-edit-subtopic-name" value="${v10EscapeAttr(subTopicInput?.value || '')}"></label>
    <label>Video URL<input class="input" id="v10-edit-topic-url" value="${v10EscapeAttr(urlInput?.value || '')}"></label>
    <label>Description<textarea class="input" id="v10-edit-topic-desc" rows="4">${v10Html(descInput?.value || '')}</textarea></label>
    <div class="v10-edit-actions">
      <button class="btn btn-ghost" onclick="this.closest('.v10-edit-modal').remove()">Cancel</button>
      <button class="btn btn-primary" onclick="v10SaveRoadmapEditModal(${subjId},${unitId},${topicIdx})">Save Changes</button>
    </div>
  </div>`;
  document.body.appendChild(modal);
}

export async function v10SaveRoadmapEditModalv10SaveRoadmapEditModalSubtopic(subjId, unitId, topicIdx) {
  const row = v10SavedRow(unitId, topicIdx);
  if (!row) return;
  const topicInput = row.querySelector('.v10-topic-fields input:first-child');
  const videoRow = row.querySelector('.v10-url-row');
  const subTopicInput = videoRow?.querySelector('.v10-subtopic-input');
  const urlInput = videoRow?.querySelector('.v10-url-input');
  const descInput = videoRow?.querySelector('.v10-video-desc-input');
  if (topicInput) topicInput.value = document.getElementById('v10-edit-topic-name')?.value.trim() || '';
  if (subTopicInput) subTopicInput.value = document.getElementById('v10-edit-subtopic-name')?.value.trim() || '';
  if (urlInput) urlInput.value = document.getElementById('v10-edit-topic-url')?.value.trim() || '';
  if (descInput) descInput.value = document.getElementById('v10-edit-topic-desc')?.value.trim() || '';
  document.querySelector('.v10-edit-modal')?.remove();
  await v10SaveRoadmap(subjId, unitId);
}

export function v10DeleteSavedRoadmapTopicConfirmed(subjId, unitId, topicIdx) {
  if (!confirm('Delete this roadmap topic and its related video URLs/descriptions?')) return;
  console.log('[DB] Topic Deleted', { subjId, unitId, topicIdx });
  v10DeleteSavedRoadmapTopicOriginal(subjId, unitId, topicIdx);
}

export function v10SavedRoadmapTreeSubtopics(topics, subjId, unitId) {
  const list = Array.isArray(topics) ? topics : [];
  if (!list.length) return '<div class="v10-saved-roadmap-empty">Saved roadmap will appear here after save.</div>';
  return `<div class="v10-saved-roadmap"><div class="v10-items-head">Saved Roadmap (${list.length})</div>${list.map((topic, ti) => {
    const videos = Array.isArray(topic.videos) && topic.videos.length
      ? topic.videos
      : (topic.youtubeUrls || topic.urls || []).map((url) => ({ url, subTopicName: '', description: '' }));
    const topicName = topic.name || topic.topicName || `Topic ${ti + 1}`;
    return `<div class="v10-saved-topic" data-topic-index="${ti}">
      <div class="v10-saved-topic-head">
        <div class="v10-saved-topic-title">${v10Html(topicName)}</div>
        <div class="v10-saved-topic-actions">
          <button type="button" class="btn btn-ghost btn-sm" onclick="v10OpenRoadmapEditModal(${subjId},${unitId},${ti})">Edit</button>
          <button type="button" class="btn btn-danger btn-sm" onclick="v10DeleteSavedRoadmapTopic(${subjId},${unitId},${ti})">Delete</button>
        </div>
      </div>
      <div class="roadmap-video-tree">${videos.length ? videos.map((video, vi) => {
      const label = v10Html(video.subTopicName || video.description || 'Topic resource');
      return `<div class="roadmap-video-child"><strong>${label}</strong>${video.url ? `<div class="roadmap-video-url">${v10Html(video.url)}</div>` : ''}</div>`;
    }).join('') : '<div class="roadmap-video-child">No sub topics added yet</div>'}</div>
    </div>`;
  }).join('')}</div>`;
}

export function syncRoadmapNodeStates() {
  const sid = APP.currentSubject?.id || APP.currentSubject?.rawId || 'subject';
  const uid = APP.currentUnit || 1;
  const completed = readStudentJson('edusync_completed_topics', []);
  document.querySelectorAll('.video-item').forEach((node) => {
    const idx = Number(node.dataset.topicIndex || 0);
    const key = topicReviewKey(sid, uid, idx);
    node.classList.toggle('review', APP.markedReviews.has(key));
    node.classList.toggle('completed', completed.includes(key));
    node.classList.toggle('active', idx === APP.currentVideoIndex);
    const isReview = APP.markedReviews.has(key);
    const isCompleted = completed.includes(key);
    node.setAttribute('aria-current', idx === APP.currentVideoIndex ? 'step' : 'false');
    node.setAttribute('aria-label', `${node.textContent.trim()}${isCompleted ? ', completed' : ''}${isReview ? ', marked for review' : ''}`);
    const dot = node.querySelector('.video-item-dot');
    if (dot) dot.textContent = isCompleted ? '✓' : String(idx + 1);
  });
}
