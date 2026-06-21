// ═══════════════════════════════════════════════════
//  STATE
// ═══════════════════════════════════════════════════
export const APP = {
  role: 'student',
  user: null,
  session: false,
  currentSubject: null,
  currentUnit: null,
  currentVideoIndex: 0,
  markedReviews: new Set(),
  backlogSubjects: [],
  calcRows: [],
  chatOpen: false,
  calcSemesters: [],
  currentSemId: null,
  adminType: null,
  subAdminData: null,
};
window.APP = APP;

// Base helpers placed directly on window for backwards compatibility
window.esc = (value) => String(value ?? '').replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
window.js = (value) => String(value ?? '').replace(/\\/g, '\\\\').replace(/'/g, "\\'");
window.sb = () => window.__AIMEASY_SUPABASE__;


// === FEATURE IMPORTS ===
import { logAuth, setLocalLegacySession, syncSessionFromSupabase, resolveAppUser, setModalOpenState, openLogoutModal, closeLogoutModal, confirmLogout, syncGoogleAuthScreen, proceedWithRole, googleSignIn, selectRoleAndNavigate, proceedWithRole_OLD, profileStep2, backToStep1, submitProfile_OLD, previewPhoto } from './auth/index.js';
import { hideLoading, showLoading, showToast, recordStudyActivity, updateStudyStreak, GRADES, initCalc, clearCalc, renderCalc, calculateGPA, loadCalcState } from './utils/index.js';
import { showScreen, selectRole, launchApp, currentHashPath, shouldPreserveStudentRouteOnLaunch, updateDashGreeting, updateSidebarProfile, navigateTo, toggleSidebar, closeSidebar, toggleReview, toggleReviewPersistedTopicState, addSemester, switchSem, renderSemTabs, renderCalcSemTitle, addCalcRow, removeCalcRow, renderSkillsPage, openSkillCourse, renderBacklog, openBacklogSubject, openSubjectFromRecent, buildHeatmap, toggleChat, openChat, sendChat, quickChat, addChatMsg, showTyping, removeTyping, handleSearch, renderPendingUrls, createSubject, renderSASubjects, uploadNotes, renderUploadedNotesList, renderSAUrlRequests, toggleSASidebar, closeSASidebar, switchSASection, renderSASection, openSACreateSubjectForm, renderSASectionFull, v10DotMenu, v10SASubjects, v10SaDotMenu, v10SAEditSubject, v10SADeleteSubject, v10SACreateSubject, v10TopicRowHTML, v10DotUpdate, v10RemoveTopic, v10RenumberDots, v10AddTopic, v10AddTopicUrl, v10RemoveTopicUrl, v10ContentPanel, v10SwitchTab, v10NotesForm, v10UploadNote, v10DeleteNote, v10TopicSelect, v10TopicNameById, v10SubjectForDb, v10BranchForSubject, v10SameBranchContent, v10PersistSubjectDbIds, v10EscapeAttr, v10EscapeJs, v10TopicFieldsHTML, v10ApplyTopicSelection, v10ReadTopicInput, v10ContentActionMenu, v10RefreshContentPane, v10TopicRowHTMLEnhanced, v10AddTopicUrlEnhanced, v10SavedRow, v10ContentPanelLinked, v10NotesFormLinked, v10UploadNoteLinked, v10DeleteNoteLinked, v10NotesFormTopicText, v10UploadNoteTopicText, v10NotesFormMenuActions, v10CloseActionMenus, v10ToggleActionMenuv10ToggleActionMenuPortal, v10ContentActionMenuFixed, v10FileUploadArea, v10UploadDragOverv10UploadDragOver, v10UploadDragLeavev10UploadDragLeave, v10UploadDropv10UploadDrop, v10HandleUploadFilev10HandleUploadFilePersistent, v10NotesFormDropZone, v10UploadNoteReliable, updateLandingStats, getSubjectProgress, readStudentJson, writeStudentJson, todayKey, startOfWeek, getStudentAssignedSubjects, contentItemsForSubject, totalLearningItems, markTopicCompleted, weeklyDashboardStats, achievementList, formatRecentTime, updateStudentDashboardMetrics, addToRecentlyOpened, v10Html, v10CloseActionMenusPortal, v10ContentActionMenuPortal, v10TopicRowHTMLSubtopics, v10AddTopicUrlSubtopic, reviewStorageKey, hydrateMarkedReviews, persistMarkedReviews, syncTopicProgressToDb, topicReviewKey, switchTabPersistStudentState, fetchApprovedTopicSuggestions, selectTopicUrlFlat, aimeasySafePathPart, aimeasyFileExt, aimeasyPreviewableNoteUrl, aimeasyUploadContentFile, v10UploadNoteWaitForPersistentFile, previewNoteInlinePersistent, downloadNotePersistent, CURRICULUM_STATUS, aimWriteJson, aimStatusBadge, aimLocalCurriculums, aimSaveLocalCurriculum, aimLoadCurriculums, aimCurriculumForm, aimCreateCurriculumBlueprintaimCreateCurriculumBlueprint, aimReviewCurriculumaimReviewCurriculum, switchSASectionCurriculum, aimCreatorDashboardCounts, renderCRDashboardrenderCRDashboardWorkflow, renderCRAddContentrenderCRAddContentWorkflow, aimSaveCreatorCurriculumContentaimSaveCreatorCurriculumContent, aimSendCurriculumForReviewaimSendCurriculumForReview, installAiiensProductionExperiencePatch, installLegacyInlineHandlerGlobals } from './dashboard/index.js';
import { renderSubjects, switchSemester, buildSemSwitcher, openSubject, updateSemesterOptions, submitProfile } from './subjects/index.js';
import { renderUnits, openUnit, switchTab, backToUnits, loadStudentUnitContentFromDb, openSASubjectUnits, renderSAUnitsPage, v10SAOpenUnits, v10SAUnitsPage, v10SAAddUnit, v10SAEditUnit, v10SADeleteUnit, v10UnitMenu, v10SAUnitDetail, v10UnitTopics, v10UnitForDb, v10StoreUnitTopics, v10ReloadUnitRoadmapFromDb, v10GetDbContextForUnit, v10MergeUnitContentRows, v10ReloadUnitContentFromDb, markUnitCompletedIfReady, studentUnitStateKey, readStudentUnitState, writeStudentUnitState } from './units/index.js';
import { renderVideoList, convertYouTubeToEmbed, studentVideoResumeKey, studentVideoStartSeconds, storeStudentVideoPosition, ensureYouTubeIframeApi, renderStudentYouTubeVideo, aimeasySaveStudentVideoPositionaimeasySaveStudentVideoPosition, aimeasyResumeStudentVideoaimeasyResumeStudentVideo, playCurrentVideo, playVideo, submitVideoSuggestion, openApprovedVideo, uploadVideo, renderUploadedVideosList, v10NormalizeVideosFromRow, v10VideoSubTopic, v10NormalizeVideosFromRowSubtopics, renderVideoListDbSubtopics, selectVideoItemFlat, prevVideoFlat, nextVideoFlat, selectVideoItem, selectTopicUrl, renderTopicInlineNotes, selectVideo, prevVideo, nextVideo } from './videos/index.js';
import { toggleRoadmapSidebar, restoreRoadmapSidebarState, openRoadmapCreator, refreshRoadmapDots, addRoadmapTopic, removeRoadmapTopic, updateRoadmapTopicSelector, v10RoadmapPanel, v10SaveRoadmap, v10FormatRoadmapError, v10SavedRoadmapTree, v10RoadmapPanelEnhanced, v10RoadmapRows, v10EditSavedRoadmapTopic, v10EditSavedRoadmapVideo, v10DeleteSavedRoadmapVideo, v10DeleteSavedRoadmapTopic, v10SaveRoadmapEnhanced, v10VideosFromRoadmapPanel, v10RoadmapTopicActionMenu, v10SavedRoadmapTreeFixed, v10OpenRoadmapEditModalv10OpenRoadmapEditModalSubtopic, v10SaveRoadmapEditModalv10SaveRoadmapEditModalSubtopic, v10DeleteSavedRoadmapTopicConfirmed, v10SavedRoadmapTreeSubtopics, syncRoadmapNodeStates } from './roadmap/index.js';
import { renderNotes, previewNoteInline, closeNotePreview, downloadNote } from './notes/index.js';
import { renderPYQ, togglePYQ, filterPYQ, uploadPYQ, renderUploadedPYQList, v10PYQForm, v10UploadPYQ, v10DeletePYQ, v10PYQFormLinked, v10UploadPYQLinked, v10DeletePYQLinked, v10PYQFormTopicText, v10UploadPYQTopicText, v10PYQFormMenuActions, v10PYQFormDropZone, v10UploadPYQReliable } from './pyqs/index.js';
import { renderIQ, uploadIQ, renderUploadedIQList, v10IQForm, v10UploadIQ, v10DeleteIQ, v10IQFormLinked, v10UploadIQLinked, v10DeleteIQLinked, v10IQFormTopicText, v10UploadIQTopicText, v10IQFormMenuActions, v10IQFormDropZone, v10UploadIQReliable } from './iq/index.js';
import { saveCalcState, saveCurrentSemRows, subAdminBack_LEGACY, saveRoadmap, saAddTopic, saDeleteTopic, subAdminBack, saCreateSubjectNew, saEditSubject, saDeleteSubjectConfirm, renderSubAdminCurriculumrenderSubAdminCurriculum, launchTeacherPortal, teacherLogout, saCreateSubject, saDeleteSubject, saAddUnit, saEditUnit, saDeleteUnit } from './subadmin/index.js';
import { toggleAdminDropdown, closeAdminDropdownOutside, openAdminLogin, closeAdminLogin, submitAdminLogin, launchAdminDashboard_LEGACY, renderAdminDashboard, adminCreateSubject, adminDeleteSubject, adminUploadVideo, adminDeleteVideo, adminUploadNotes, adminDeleteNote, adminUploadPYQ, adminDeletePYQ, adminUploadIQ, adminDeleteIQ, adminCreateSkill, adminDeleteSkill, adminAddSkillVideo, adminDeleteSkillVideo, adminAddSkillNote, adminDeleteSkillNote, adminApproveUrl, adminRejectUrl, adminLogout, deleteAdminNote, deleteAdminPYQ, deleteAdminIQ, deleteAdminVideo, toggleAdminSidebar, closeAdminSidebar, switchAdminSection, renderAdminSection, launchAdminDashboard, renderAdminSectionFull, adminOpenSubject, adminManageContent, adminAddContentNote, adminAddContentPYQ, adminAddContentIQ, adminAddContentVideo, adminEditNote, adminEditPYQ, adminEditIQ, adminEditVideo, adminDeleteNoteConfirm, adminDeletePYQConfirm, adminDeleteIQConfirm, adminDeleteVideoConfirm, adminAddUnit, adminEditUnit, adminDeleteUnit, adminAddTopic, adminEditTopic, adminDeleteTopic, adminEditSubjectModal, adminDeleteSubjectConfirm, adminCreateSkillV2, adminAddSkillVideoV2, getAdminModals, v10AdminSubjects, v10AdminViewSubject, v10AdminEditSubject, v10AdminDeleteSubject, v10AdminOpenSubject, v10AdminOpenSubjectObj, v10AdminAddUnit, v10AdminEditUnit, v10AdminDeleteUnit, v10AdminUnitDetail, patchAdminSubjectsNav, installStudentDashboardAndWorkshopPatch, adminCreateSubAdmin, adminDeleteSubAdmin, launchSubAdmin_LEGACY, switchSubAdminTab, openCreateSubAdminModal, closeCreateSubAdminModal, renderExistingSubAdmins, createSubAdmin, launchSubAdmin, adminEditSubAdminEntry, adminAddFeature, adminDeleteFeature, adminEditFeature } from './admin/index.js';



// === WINDOW & GLOBAL BINDINGS ===
window.logAuth = globalThis.logAuth = logAuth;
window.setLocalLegacySession = globalThis.setLocalLegacySession = setLocalLegacySession;
window.syncSessionFromSupabase = globalThis.syncSessionFromSupabase = syncSessionFromSupabase;
window.resolveAppUser = globalThis.resolveAppUser = resolveAppUser;
window.setModalOpenState = globalThis.setModalOpenState = setModalOpenState;
window.openLogoutModal = globalThis.openLogoutModal = openLogoutModal;
window.closeLogoutModal = globalThis.closeLogoutModal = closeLogoutModal;
window.confirmLogout = globalThis.confirmLogout = confirmLogout;
window.syncGoogleAuthScreen = globalThis.syncGoogleAuthScreen = syncGoogleAuthScreen;
window.proceedWithRole = globalThis.proceedWithRole = proceedWithRole;
window.googleSignIn = globalThis.googleSignIn = googleSignIn;
window.selectRoleAndNavigate = globalThis.selectRoleAndNavigate = selectRoleAndNavigate;
window.proceedWithRole_OLD = globalThis.proceedWithRole_OLD = proceedWithRole_OLD;
window.profileStep2 = globalThis.profileStep2 = profileStep2;
window.backToStep1 = globalThis.backToStep1 = backToStep1;
window.submitProfile_OLD = globalThis.submitProfile_OLD = submitProfile_OLD;
window.previewPhoto = globalThis.previewPhoto = previewPhoto;
window.hideLoading = globalThis.hideLoading = hideLoading;
window.showLoading = globalThis.showLoading = showLoading;
window.showToast = globalThis.showToast = showToast;
window.recordStudyActivity = globalThis.recordStudyActivity = recordStudyActivity;
window.updateStudyStreak = globalThis.updateStudyStreak = updateStudyStreak;
window.loadCalcState = globalThis.loadCalcState = loadCalcState;
window.GRADES = globalThis.GRADES = GRADES;
window.initCalc = globalThis.initCalc = initCalc;
window.clearCalc = globalThis.clearCalc = clearCalc;
window.renderCalc = globalThis.renderCalc = renderCalc;
window.calculateGPA = globalThis.calculateGPA = calculateGPA;
window.showScreen = globalThis.showScreen = showScreen;
window.selectRole = globalThis.selectRole = selectRole;
window.launchApp = globalThis.launchApp = launchApp;
window.currentHashPath = globalThis.currentHashPath = currentHashPath;
window.shouldPreserveStudentRouteOnLaunch = globalThis.shouldPreserveStudentRouteOnLaunch = shouldPreserveStudentRouteOnLaunch;
window.updateDashGreeting = globalThis.updateDashGreeting = updateDashGreeting;
window.updateSidebarProfile = globalThis.updateSidebarProfile = updateSidebarProfile;
window.navigateTo = globalThis.navigateTo = navigateTo;
window.toggleSidebar = globalThis.toggleSidebar = toggleSidebar;
window.closeSidebar = globalThis.closeSidebar = closeSidebar;
window.toggleReview = globalThis.toggleReview = toggleReview;
window.toggleReviewPersistedTopicState = globalThis.toggleReviewPersistedTopicState = toggleReviewPersistedTopicState;
window.addSemester = globalThis.addSemester = addSemester;
window.switchSem = globalThis.switchSem = switchSem;
window.renderSemTabs = globalThis.renderSemTabs = renderSemTabs;
window.renderCalcSemTitle = globalThis.renderCalcSemTitle = renderCalcSemTitle;
window.addCalcRow = globalThis.addCalcRow = addCalcRow;
window.removeCalcRow = globalThis.removeCalcRow = removeCalcRow;
window.renderSkillsPage = globalThis.renderSkillsPage = renderSkillsPage;
window.openSkillCourse = globalThis.openSkillCourse = openSkillCourse;
window.renderBacklog = globalThis.renderBacklog = renderBacklog;
window.openBacklogSubject = globalThis.openBacklogSubject = openBacklogSubject;
window.openSubjectFromRecent = globalThis.openSubjectFromRecent = openSubjectFromRecent;
window.buildHeatmap = globalThis.buildHeatmap = buildHeatmap;
window.toggleChat = globalThis.toggleChat = toggleChat;
window.openChat = globalThis.openChat = openChat;
window.sendChat = globalThis.sendChat = sendChat;
window.quickChat = globalThis.quickChat = quickChat;
window.addChatMsg = globalThis.addChatMsg = addChatMsg;
window.showTyping = globalThis.showTyping = showTyping;
window.removeTyping = globalThis.removeTyping = removeTyping;
window.handleSearch = globalThis.handleSearch = handleSearch;
window.renderPendingUrls = globalThis.renderPendingUrls = renderPendingUrls;
window.createSubject = globalThis.createSubject = createSubject;
window.renderSASubjects = globalThis.renderSASubjects = renderSASubjects;
window.uploadNotes = globalThis.uploadNotes = uploadNotes;
window.renderUploadedNotesList = globalThis.renderUploadedNotesList = renderUploadedNotesList;
window.renderSAUrlRequests = globalThis.renderSAUrlRequests = renderSAUrlRequests;
window.toggleSASidebar = globalThis.toggleSASidebar = toggleSASidebar;
window.closeSASidebar = globalThis.closeSASidebar = closeSASidebar;
window.switchSASection = globalThis.switchSASection = switchSASection;
window.renderSASection = globalThis.renderSASection = renderSASection;
window.openSACreateSubjectForm = globalThis.openSACreateSubjectForm = openSACreateSubjectForm;
window.renderSASectionFull = globalThis.renderSASectionFull = renderSASectionFull;
window.v10DotMenu = globalThis.v10DotMenu = v10DotMenu;
window.v10SASubjects = globalThis.v10SASubjects = v10SASubjects;
window.v10SaDotMenu = globalThis.v10SaDotMenu = v10SaDotMenu;
window.v10SAEditSubject = globalThis.v10SAEditSubject = v10SAEditSubject;
window.v10SADeleteSubject = globalThis.v10SADeleteSubject = v10SADeleteSubject;
window.v10SACreateSubject = globalThis.v10SACreateSubject = v10SACreateSubject;
window.v10TopicRowHTML = globalThis.v10TopicRowHTML = v10TopicRowHTML;
window.v10DotUpdate = globalThis.v10DotUpdate = v10DotUpdate;
window.v10RemoveTopic = globalThis.v10RemoveTopic = v10RemoveTopic;
window.v10RenumberDots = globalThis.v10RenumberDots = v10RenumberDots;
window.v10AddTopic = globalThis.v10AddTopic = v10AddTopic;
window.v10AddTopicUrl = globalThis.v10AddTopicUrl = v10AddTopicUrl;
window.v10RemoveTopicUrl = globalThis.v10RemoveTopicUrl = v10RemoveTopicUrl;
window.v10ContentPanel = globalThis.v10ContentPanel = v10ContentPanel;
window.v10SwitchTab = globalThis.v10SwitchTab = v10SwitchTab;
window.v10NotesForm = globalThis.v10NotesForm = v10NotesForm;
window.v10UploadNote = globalThis.v10UploadNote = v10UploadNote;
window.v10DeleteNote = globalThis.v10DeleteNote = v10DeleteNote;
window.v10TopicSelect = globalThis.v10TopicSelect = v10TopicSelect;
window.v10TopicNameById = globalThis.v10TopicNameById = v10TopicNameById;
window.v10SubjectForDb = globalThis.v10SubjectForDb = v10SubjectForDb;
window.v10BranchForSubject = globalThis.v10BranchForSubject = v10BranchForSubject;
window.v10SameBranchContent = globalThis.v10SameBranchContent = v10SameBranchContent;
window.v10PersistSubjectDbIds = globalThis.v10PersistSubjectDbIds = v10PersistSubjectDbIds;
window.v10EscapeAttr = globalThis.v10EscapeAttr = v10EscapeAttr;
window.v10EscapeJs = globalThis.v10EscapeJs = v10EscapeJs;
window.v10TopicFieldsHTML = globalThis.v10TopicFieldsHTML = v10TopicFieldsHTML;
window.v10ApplyTopicSelection = globalThis.v10ApplyTopicSelection = v10ApplyTopicSelection;
window.v10ReadTopicInput = globalThis.v10ReadTopicInput = v10ReadTopicInput;
window.v10ContentActionMenu = globalThis.v10ContentActionMenu = v10ContentActionMenu;
window.v10RefreshContentPane = globalThis.v10RefreshContentPane = v10RefreshContentPane;
window.v10TopicRowHTMLEnhanced = globalThis.v10TopicRowHTMLEnhanced = v10TopicRowHTMLEnhanced;
window.v10AddTopicUrlEnhanced = globalThis.v10AddTopicUrlEnhanced = v10AddTopicUrlEnhanced;
window.v10SavedRow = globalThis.v10SavedRow = v10SavedRow;
window.v10ContentPanelLinked = globalThis.v10ContentPanelLinked = v10ContentPanelLinked;
window.v10NotesFormLinked = globalThis.v10NotesFormLinked = v10NotesFormLinked;
window.v10UploadNoteLinked = globalThis.v10UploadNoteLinked = v10UploadNoteLinked;
window.v10DeleteNoteLinked = globalThis.v10DeleteNoteLinked = v10DeleteNoteLinked;
window.v10NotesFormTopicText = globalThis.v10NotesFormTopicText = v10NotesFormTopicText;
window.v10UploadNoteTopicText = globalThis.v10UploadNoteTopicText = v10UploadNoteTopicText;
window.v10NotesFormMenuActions = globalThis.v10NotesFormMenuActions = v10NotesFormMenuActions;
window.v10CloseActionMenus = globalThis.v10CloseActionMenus = v10CloseActionMenus;
window.v10ToggleActionMenuv10ToggleActionMenuPortal = globalThis.v10ToggleActionMenuv10ToggleActionMenuPortal = v10ToggleActionMenuv10ToggleActionMenuPortal;
window.v10ContentActionMenuFixed = globalThis.v10ContentActionMenuFixed = v10ContentActionMenuFixed;
window.v10FileUploadArea = globalThis.v10FileUploadArea = v10FileUploadArea;
window.v10UploadDragOverv10UploadDragOver = globalThis.v10UploadDragOverv10UploadDragOver = v10UploadDragOverv10UploadDragOver;
window.v10UploadDragLeavev10UploadDragLeave = globalThis.v10UploadDragLeavev10UploadDragLeave = v10UploadDragLeavev10UploadDragLeave;
window.v10UploadDropv10UploadDrop = globalThis.v10UploadDropv10UploadDrop = v10UploadDropv10UploadDrop;
window.v10HandleUploadFilev10HandleUploadFilePersistent = globalThis.v10HandleUploadFilev10HandleUploadFilePersistent = v10HandleUploadFilev10HandleUploadFilePersistent;
window.v10NotesFormDropZone = globalThis.v10NotesFormDropZone = v10NotesFormDropZone;
window.v10UploadNoteReliable = globalThis.v10UploadNoteReliable = v10UploadNoteReliable;
window.updateLandingStats = globalThis.updateLandingStats = updateLandingStats;
window.getSubjectProgress = globalThis.getSubjectProgress = getSubjectProgress;
window.readStudentJson = globalThis.readStudentJson = readStudentJson;
window.writeStudentJson = globalThis.writeStudentJson = writeStudentJson;
window.todayKey = globalThis.todayKey = todayKey;
window.startOfWeek = globalThis.startOfWeek = startOfWeek;
window.getStudentAssignedSubjects = globalThis.getStudentAssignedSubjects = getStudentAssignedSubjects;
window.contentItemsForSubject = globalThis.contentItemsForSubject = contentItemsForSubject;
window.totalLearningItems = globalThis.totalLearningItems = totalLearningItems;
window.markTopicCompleted = globalThis.markTopicCompleted = markTopicCompleted;
window.weeklyDashboardStats = globalThis.weeklyDashboardStats = weeklyDashboardStats;
window.achievementList = globalThis.achievementList = achievementList;
window.formatRecentTime = globalThis.formatRecentTime = formatRecentTime;
window.updateStudentDashboardMetrics = globalThis.updateStudentDashboardMetrics = updateStudentDashboardMetrics;
window.addToRecentlyOpened = globalThis.addToRecentlyOpened = addToRecentlyOpened;
window.v10Html = globalThis.v10Html = v10Html;
window.v10CloseActionMenusPortal = globalThis.v10CloseActionMenusPortal = v10CloseActionMenusPortal;
window.v10ContentActionMenuPortal = globalThis.v10ContentActionMenuPortal = v10ContentActionMenuPortal;
window.v10TopicRowHTMLSubtopics = globalThis.v10TopicRowHTMLSubtopics = v10TopicRowHTMLSubtopics;
window.v10AddTopicUrlSubtopic = globalThis.v10AddTopicUrlSubtopic = v10AddTopicUrlSubtopic;
window.reviewStorageKey = globalThis.reviewStorageKey = reviewStorageKey;
window.hydrateMarkedReviews = globalThis.hydrateMarkedReviews = hydrateMarkedReviews;
window.persistMarkedReviews = globalThis.persistMarkedReviews = persistMarkedReviews;
window.syncTopicProgressToDb = globalThis.syncTopicProgressToDb = syncTopicProgressToDb;
window.topicReviewKey = globalThis.topicReviewKey = topicReviewKey;
window.switchTabPersistStudentState = globalThis.switchTabPersistStudentState = switchTabPersistStudentState;
window.fetchApprovedTopicSuggestions = globalThis.fetchApprovedTopicSuggestions = fetchApprovedTopicSuggestions;
window.selectTopicUrlFlat = globalThis.selectTopicUrlFlat = selectTopicUrlFlat;
window.aimeasySafePathPart = globalThis.aimeasySafePathPart = aimeasySafePathPart;
window.aimeasyFileExt = globalThis.aimeasyFileExt = aimeasyFileExt;
window.aimeasyPreviewableNoteUrl = globalThis.aimeasyPreviewableNoteUrl = aimeasyPreviewableNoteUrl;
window.aimeasyUploadContentFile = globalThis.aimeasyUploadContentFile = aimeasyUploadContentFile;
window.v10UploadNoteWaitForPersistentFile = globalThis.v10UploadNoteWaitForPersistentFile = v10UploadNoteWaitForPersistentFile;
window.previewNoteInlinePersistent = globalThis.previewNoteInlinePersistent = previewNoteInlinePersistent;
window.downloadNotePersistent = globalThis.downloadNotePersistent = downloadNotePersistent;
window.CURRICULUM_STATUS = globalThis.CURRICULUM_STATUS = CURRICULUM_STATUS;
window.aimWriteJson = globalThis.aimWriteJson = aimWriteJson;
window.aimStatusBadge = globalThis.aimStatusBadge = aimStatusBadge;
window.aimLocalCurriculums = globalThis.aimLocalCurriculums = aimLocalCurriculums;
window.aimSaveLocalCurriculum = globalThis.aimSaveLocalCurriculum = aimSaveLocalCurriculum;
window.aimLoadCurriculums = globalThis.aimLoadCurriculums = aimLoadCurriculums;
window.aimCurriculumForm = globalThis.aimCurriculumForm = aimCurriculumForm;
window.aimCreateCurriculumBlueprintaimCreateCurriculumBlueprint = globalThis.aimCreateCurriculumBlueprintaimCreateCurriculumBlueprint = aimCreateCurriculumBlueprintaimCreateCurriculumBlueprint;
window.aimReviewCurriculumaimReviewCurriculum = globalThis.aimReviewCurriculumaimReviewCurriculum = aimReviewCurriculumaimReviewCurriculum;
window.switchSASectionCurriculum = globalThis.switchSASectionCurriculum = switchSASectionCurriculum;
window.aimCreatorDashboardCounts = globalThis.aimCreatorDashboardCounts = aimCreatorDashboardCounts;
window.renderCRDashboardrenderCRDashboardWorkflow = globalThis.renderCRDashboardrenderCRDashboardWorkflow = renderCRDashboardrenderCRDashboardWorkflow;
window.renderCRAddContentrenderCRAddContentWorkflow = globalThis.renderCRAddContentrenderCRAddContentWorkflow = renderCRAddContentrenderCRAddContentWorkflow;
window.aimSaveCreatorCurriculumContentaimSaveCreatorCurriculumContent = globalThis.aimSaveCreatorCurriculumContentaimSaveCreatorCurriculumContent = aimSaveCreatorCurriculumContentaimSaveCreatorCurriculumContent;
window.aimSendCurriculumForReviewaimSendCurriculumForReview = globalThis.aimSendCurriculumForReviewaimSendCurriculumForReview = aimSendCurriculumForReviewaimSendCurriculumForReview;
window.installAiiensProductionExperiencePatch = globalThis.installAiiensProductionExperiencePatch = installAiiensProductionExperiencePatch;
window.installLegacyInlineHandlerGlobals = globalThis.installLegacyInlineHandlerGlobals = installLegacyInlineHandlerGlobals;
window.renderSubjects = globalThis.renderSubjects = renderSubjects;
window.switchSemester = globalThis.switchSemester = switchSemester;
window.buildSemSwitcher = globalThis.buildSemSwitcher = buildSemSwitcher;
window.openSubject = globalThis.openSubject = openSubject;
window.updateSemesterOptions = globalThis.updateSemesterOptions = updateSemesterOptions;
window.submitProfile = globalThis.submitProfile = submitProfile;
window.renderUnits = globalThis.renderUnits = renderUnits;
window.openUnit = globalThis.openUnit = openUnit;
window.switchTab = globalThis.switchTab = switchTab;
window.backToUnits = globalThis.backToUnits = backToUnits;
window.loadStudentUnitContentFromDb = globalThis.loadStudentUnitContentFromDb = loadStudentUnitContentFromDb;
window.openSASubjectUnits = globalThis.openSASubjectUnits = openSASubjectUnits;
window.renderSAUnitsPage = globalThis.renderSAUnitsPage = renderSAUnitsPage;
window.v10SAOpenUnits = globalThis.v10SAOpenUnits = v10SAOpenUnits;
window.v10SAUnitsPage = globalThis.v10SAUnitsPage = v10SAUnitsPage;
window.v10SAAddUnit = globalThis.v10SAAddUnit = v10SAAddUnit;
window.v10SAEditUnit = globalThis.v10SAEditUnit = v10SAEditUnit;
window.v10SADeleteUnit = globalThis.v10SADeleteUnit = v10SADeleteUnit;
window.v10UnitMenu = globalThis.v10UnitMenu = v10UnitMenu;
window.v10SAUnitDetail = globalThis.v10SAUnitDetail = v10SAUnitDetail;
window.v10UnitTopics = globalThis.v10UnitTopics = v10UnitTopics;
window.v10UnitForDb = globalThis.v10UnitForDb = v10UnitForDb;
window.v10StoreUnitTopics = globalThis.v10StoreUnitTopics = v10StoreUnitTopics;
window.v10ReloadUnitRoadmapFromDb = globalThis.v10ReloadUnitRoadmapFromDb = v10ReloadUnitRoadmapFromDb;
window.v10GetDbContextForUnit = globalThis.v10GetDbContextForUnit = v10GetDbContextForUnit;
window.v10MergeUnitContentRows = globalThis.v10MergeUnitContentRows = v10MergeUnitContentRows;
window.v10ReloadUnitContentFromDb = globalThis.v10ReloadUnitContentFromDb = v10ReloadUnitContentFromDb;
window.markUnitCompletedIfReady = globalThis.markUnitCompletedIfReady = markUnitCompletedIfReady;
window.studentUnitStateKey = globalThis.studentUnitStateKey = studentUnitStateKey;
window.readStudentUnitState = globalThis.readStudentUnitState = readStudentUnitState;
window.writeStudentUnitState = globalThis.writeStudentUnitState = writeStudentUnitState;
window.renderVideoList = globalThis.renderVideoList = renderVideoList;
window.convertYouTubeToEmbed = globalThis.convertYouTubeToEmbed = convertYouTubeToEmbed;
window.studentVideoResumeKey = globalThis.studentVideoResumeKey = studentVideoResumeKey;
window.studentVideoStartSeconds = globalThis.studentVideoStartSeconds = studentVideoStartSeconds;
window.storeStudentVideoPosition = globalThis.storeStudentVideoPosition = storeStudentVideoPosition;
window.ensureYouTubeIframeApi = globalThis.ensureYouTubeIframeApi = ensureYouTubeIframeApi;
window.renderStudentYouTubeVideo = globalThis.renderStudentYouTubeVideo = renderStudentYouTubeVideo;
window.aimeasySaveStudentVideoPositionaimeasySaveStudentVideoPosition = globalThis.aimeasySaveStudentVideoPositionaimeasySaveStudentVideoPosition = aimeasySaveStudentVideoPositionaimeasySaveStudentVideoPosition;
window.aimeasyResumeStudentVideoaimeasyResumeStudentVideo = globalThis.aimeasyResumeStudentVideoaimeasyResumeStudentVideo = aimeasyResumeStudentVideoaimeasyResumeStudentVideo;
window.playCurrentVideo = globalThis.playCurrentVideo = playCurrentVideo;
window.playVideo = globalThis.playVideo = playVideo;
window.submitVideoSuggestion = globalThis.submitVideoSuggestion = submitVideoSuggestion;
window.openApprovedVideo = globalThis.openApprovedVideo = openApprovedVideo;
window.uploadVideo = globalThis.uploadVideo = uploadVideo;
window.renderUploadedVideosList = globalThis.renderUploadedVideosList = renderUploadedVideosList;
window.v10NormalizeVideosFromRow = globalThis.v10NormalizeVideosFromRow = v10NormalizeVideosFromRow;
window.v10VideoSubTopic = globalThis.v10VideoSubTopic = v10VideoSubTopic;
window.v10NormalizeVideosFromRowSubtopics = globalThis.v10NormalizeVideosFromRowSubtopics = v10NormalizeVideosFromRowSubtopics;
window.renderVideoListDbSubtopics = globalThis.renderVideoListDbSubtopics = renderVideoListDbSubtopics;
window.selectVideoItemFlat = globalThis.selectVideoItemFlat = selectVideoItemFlat;
window.prevVideoFlat = globalThis.prevVideoFlat = prevVideoFlat;
window.nextVideoFlat = globalThis.nextVideoFlat = nextVideoFlat;
window.selectVideoItem = globalThis.selectVideoItem = selectVideoItem;
window.selectTopicUrl = globalThis.selectTopicUrl = selectTopicUrl;
window.renderTopicInlineNotes = globalThis.renderTopicInlineNotes = renderTopicInlineNotes;
window.selectVideo = globalThis.selectVideo = selectVideo;
window.prevVideo = globalThis.prevVideo = prevVideo;
window.nextVideo = globalThis.nextVideo = nextVideo;
window.toggleRoadmapSidebar = globalThis.toggleRoadmapSidebar = toggleRoadmapSidebar;
window.restoreRoadmapSidebarState = globalThis.restoreRoadmapSidebarState = restoreRoadmapSidebarState;
window.openRoadmapCreator = globalThis.openRoadmapCreator = openRoadmapCreator;
window.refreshRoadmapDots = globalThis.refreshRoadmapDots = refreshRoadmapDots;
window.addRoadmapTopic = globalThis.addRoadmapTopic = addRoadmapTopic;
window.removeRoadmapTopic = globalThis.removeRoadmapTopic = removeRoadmapTopic;
window.updateRoadmapTopicSelector = globalThis.updateRoadmapTopicSelector = updateRoadmapTopicSelector;
window.v10RoadmapPanel = globalThis.v10RoadmapPanel = v10RoadmapPanel;
window.v10SaveRoadmap = globalThis.v10SaveRoadmap = v10SaveRoadmap;
window.v10FormatRoadmapError = globalThis.v10FormatRoadmapError = v10FormatRoadmapError;
window.v10SavedRoadmapTree = globalThis.v10SavedRoadmapTree = v10SavedRoadmapTree;
window.v10RoadmapPanelEnhanced = globalThis.v10RoadmapPanelEnhanced = v10RoadmapPanelEnhanced;
window.v10RoadmapRows = globalThis.v10RoadmapRows = v10RoadmapRows;
window.v10EditSavedRoadmapTopic = globalThis.v10EditSavedRoadmapTopic = v10EditSavedRoadmapTopic;
window.v10EditSavedRoadmapVideo = globalThis.v10EditSavedRoadmapVideo = v10EditSavedRoadmapVideo;
window.v10DeleteSavedRoadmapVideo = globalThis.v10DeleteSavedRoadmapVideo = v10DeleteSavedRoadmapVideo;
window.v10DeleteSavedRoadmapTopic = globalThis.v10DeleteSavedRoadmapTopic = v10DeleteSavedRoadmapTopic;
window.v10SaveRoadmapEnhanced = globalThis.v10SaveRoadmapEnhanced = v10SaveRoadmapEnhanced;
window.v10VideosFromRoadmapPanel = globalThis.v10VideosFromRoadmapPanel = v10VideosFromRoadmapPanel;
window.v10RoadmapTopicActionMenu = globalThis.v10RoadmapTopicActionMenu = v10RoadmapTopicActionMenu;
window.v10SavedRoadmapTreeFixed = globalThis.v10SavedRoadmapTreeFixed = v10SavedRoadmapTreeFixed;
window.v10OpenRoadmapEditModalv10OpenRoadmapEditModalSubtopic = globalThis.v10OpenRoadmapEditModalv10OpenRoadmapEditModalSubtopic = v10OpenRoadmapEditModalv10OpenRoadmapEditModalSubtopic;
window.v10SaveRoadmapEditModalv10SaveRoadmapEditModalSubtopic = globalThis.v10SaveRoadmapEditModalv10SaveRoadmapEditModalSubtopic = v10SaveRoadmapEditModalv10SaveRoadmapEditModalSubtopic;
window.v10DeleteSavedRoadmapTopicConfirmed = globalThis.v10DeleteSavedRoadmapTopicConfirmed = v10DeleteSavedRoadmapTopicConfirmed;
window.v10SavedRoadmapTreeSubtopics = globalThis.v10SavedRoadmapTreeSubtopics = v10SavedRoadmapTreeSubtopics;
window.syncRoadmapNodeStates = globalThis.syncRoadmapNodeStates = syncRoadmapNodeStates;
window.renderNotes = globalThis.renderNotes = renderNotes;
window.previewNoteInline = globalThis.previewNoteInline = previewNoteInline;
window.closeNotePreview = globalThis.closeNotePreview = closeNotePreview;
window.downloadNote = globalThis.downloadNote = downloadNote;
window.renderPYQ = globalThis.renderPYQ = renderPYQ;
window.togglePYQ = globalThis.togglePYQ = togglePYQ;
window.filterPYQ = globalThis.filterPYQ = filterPYQ;
window.uploadPYQ = globalThis.uploadPYQ = uploadPYQ;
window.renderUploadedPYQList = globalThis.renderUploadedPYQList = renderUploadedPYQList;
window.v10PYQForm = globalThis.v10PYQForm = v10PYQForm;
window.v10UploadPYQ = globalThis.v10UploadPYQ = v10UploadPYQ;
window.v10DeletePYQ = globalThis.v10DeletePYQ = v10DeletePYQ;
window.v10PYQFormLinked = globalThis.v10PYQFormLinked = v10PYQFormLinked;
window.v10UploadPYQLinked = globalThis.v10UploadPYQLinked = v10UploadPYQLinked;
window.v10DeletePYQLinked = globalThis.v10DeletePYQLinked = v10DeletePYQLinked;
window.v10PYQFormTopicText = globalThis.v10PYQFormTopicText = v10PYQFormTopicText;
window.v10UploadPYQTopicText = globalThis.v10UploadPYQTopicText = v10UploadPYQTopicText;
window.v10PYQFormMenuActions = globalThis.v10PYQFormMenuActions = v10PYQFormMenuActions;
window.v10PYQFormDropZone = globalThis.v10PYQFormDropZone = v10PYQFormDropZone;
window.v10UploadPYQReliable = globalThis.v10UploadPYQReliable = v10UploadPYQReliable;
window.renderIQ = globalThis.renderIQ = renderIQ;
window.uploadIQ = globalThis.uploadIQ = uploadIQ;
window.renderUploadedIQList = globalThis.renderUploadedIQList = renderUploadedIQList;
window.v10IQForm = globalThis.v10IQForm = v10IQForm;
window.v10UploadIQ = globalThis.v10UploadIQ = v10UploadIQ;
window.v10DeleteIQ = globalThis.v10DeleteIQ = v10DeleteIQ;
window.v10IQFormLinked = globalThis.v10IQFormLinked = v10IQFormLinked;
window.v10UploadIQLinked = globalThis.v10UploadIQLinked = v10UploadIQLinked;
window.v10DeleteIQLinked = globalThis.v10DeleteIQLinked = v10DeleteIQLinked;
window.v10IQFormTopicText = globalThis.v10IQFormTopicText = v10IQFormTopicText;
window.v10UploadIQTopicText = globalThis.v10UploadIQTopicText = v10UploadIQTopicText;
window.v10IQFormMenuActions = globalThis.v10IQFormMenuActions = v10IQFormMenuActions;
window.v10IQFormDropZone = globalThis.v10IQFormDropZone = v10IQFormDropZone;
window.v10UploadIQReliable = globalThis.v10UploadIQReliable = v10UploadIQReliable;
window.saveCalcState = globalThis.saveCalcState = saveCalcState;
window.saveCurrentSemRows = globalThis.saveCurrentSemRows = saveCurrentSemRows;
window.subAdminBack_LEGACY = globalThis.subAdminBack_LEGACY = subAdminBack_LEGACY;
window.saveRoadmap = globalThis.saveRoadmap = saveRoadmap;
window.saAddTopic = globalThis.saAddTopic = saAddTopic;
window.saDeleteTopic = globalThis.saDeleteTopic = saDeleteTopic;
window.subAdminBack = globalThis.subAdminBack = subAdminBack;
window.saCreateSubjectNew = globalThis.saCreateSubjectNew = saCreateSubjectNew;
window.saEditSubject = globalThis.saEditSubject = saEditSubject;
window.saDeleteSubjectConfirm = globalThis.saDeleteSubjectConfirm = saDeleteSubjectConfirm;
window.renderSubAdminCurriculumrenderSubAdminCurriculum = globalThis.renderSubAdminCurriculumrenderSubAdminCurriculum = renderSubAdminCurriculumrenderSubAdminCurriculum;
window.launchTeacherPortal = globalThis.launchTeacherPortal = launchTeacherPortal;
window.teacherLogout = globalThis.teacherLogout = teacherLogout;
window.saCreateSubject = globalThis.saCreateSubject = saCreateSubject;
window.saDeleteSubject = globalThis.saDeleteSubject = saDeleteSubject;
window.saAddUnit = globalThis.saAddUnit = saAddUnit;
window.saEditUnit = globalThis.saEditUnit = saEditUnit;
window.saDeleteUnit = globalThis.saDeleteUnit = saDeleteUnit;
window.toggleAdminDropdown = globalThis.toggleAdminDropdown = toggleAdminDropdown;
window.closeAdminDropdownOutside = globalThis.closeAdminDropdownOutside = closeAdminDropdownOutside;
window.openAdminLogin = globalThis.openAdminLogin = openAdminLogin;
window.closeAdminLogin = globalThis.closeAdminLogin = closeAdminLogin;
window.submitAdminLogin = globalThis.submitAdminLogin = submitAdminLogin;
window.launchAdminDashboard_LEGACY = globalThis.launchAdminDashboard_LEGACY = launchAdminDashboard_LEGACY;
window.renderAdminDashboard = globalThis.renderAdminDashboard = renderAdminDashboard;
window.adminCreateSubject = globalThis.adminCreateSubject = adminCreateSubject;
window.adminDeleteSubject = globalThis.adminDeleteSubject = adminDeleteSubject;
window.adminUploadVideo = globalThis.adminUploadVideo = adminUploadVideo;
window.adminDeleteVideo = globalThis.adminDeleteVideo = adminDeleteVideo;
window.adminUploadNotes = globalThis.adminUploadNotes = adminUploadNotes;
window.adminDeleteNote = globalThis.adminDeleteNote = adminDeleteNote;
window.adminUploadPYQ = globalThis.adminUploadPYQ = adminUploadPYQ;
window.adminDeletePYQ = globalThis.adminDeletePYQ = adminDeletePYQ;
window.adminUploadIQ = globalThis.adminUploadIQ = adminUploadIQ;
window.adminDeleteIQ = globalThis.adminDeleteIQ = adminDeleteIQ;
window.adminCreateSkill = globalThis.adminCreateSkill = adminCreateSkill;
window.adminDeleteSkill = globalThis.adminDeleteSkill = adminDeleteSkill;
window.adminAddSkillVideo = globalThis.adminAddSkillVideo = adminAddSkillVideo;
window.adminDeleteSkillVideo = globalThis.adminDeleteSkillVideo = adminDeleteSkillVideo;
window.adminAddSkillNote = globalThis.adminAddSkillNote = adminAddSkillNote;
window.adminDeleteSkillNote = globalThis.adminDeleteSkillNote = adminDeleteSkillNote;
window.adminApproveUrl = globalThis.adminApproveUrl = adminApproveUrl;
window.adminRejectUrl = globalThis.adminRejectUrl = adminRejectUrl;
window.adminLogout = globalThis.adminLogout = adminLogout;
window.deleteAdminNote = globalThis.deleteAdminNote = deleteAdminNote;
window.deleteAdminPYQ = globalThis.deleteAdminPYQ = deleteAdminPYQ;
window.deleteAdminIQ = globalThis.deleteAdminIQ = deleteAdminIQ;
window.deleteAdminVideo = globalThis.deleteAdminVideo = deleteAdminVideo;
window.toggleAdminSidebar = globalThis.toggleAdminSidebar = toggleAdminSidebar;
window.closeAdminSidebar = globalThis.closeAdminSidebar = closeAdminSidebar;
window.switchAdminSection = globalThis.switchAdminSection = switchAdminSection;
window.renderAdminSection = globalThis.renderAdminSection = renderAdminSection;
window.launchAdminDashboard = globalThis.launchAdminDashboard = launchAdminDashboard;
window.renderAdminSectionFull = globalThis.renderAdminSectionFull = renderAdminSectionFull;
window.adminOpenSubject = globalThis.adminOpenSubject = adminOpenSubject;
window.adminManageContent = globalThis.adminManageContent = adminManageContent;
window.adminAddContentNote = globalThis.adminAddContentNote = adminAddContentNote;
window.adminAddContentPYQ = globalThis.adminAddContentPYQ = adminAddContentPYQ;
window.adminAddContentIQ = globalThis.adminAddContentIQ = adminAddContentIQ;
window.adminAddContentVideo = globalThis.adminAddContentVideo = adminAddContentVideo;
window.adminEditNote = globalThis.adminEditNote = adminEditNote;
window.adminEditPYQ = globalThis.adminEditPYQ = adminEditPYQ;
window.adminEditIQ = globalThis.adminEditIQ = adminEditIQ;
window.adminEditVideo = globalThis.adminEditVideo = adminEditVideo;
window.adminDeleteNoteConfirm = globalThis.adminDeleteNoteConfirm = adminDeleteNoteConfirm;
window.adminDeletePYQConfirm = globalThis.adminDeletePYQConfirm = adminDeletePYQConfirm;
window.adminDeleteIQConfirm = globalThis.adminDeleteIQConfirm = adminDeleteIQConfirm;
window.adminDeleteVideoConfirm = globalThis.adminDeleteVideoConfirm = adminDeleteVideoConfirm;
window.adminAddUnit = globalThis.adminAddUnit = adminAddUnit;
window.adminEditUnit = globalThis.adminEditUnit = adminEditUnit;
window.adminDeleteUnit = globalThis.adminDeleteUnit = adminDeleteUnit;
window.adminAddTopic = globalThis.adminAddTopic = adminAddTopic;
window.adminEditTopic = globalThis.adminEditTopic = adminEditTopic;
window.adminDeleteTopic = globalThis.adminDeleteTopic = adminDeleteTopic;
window.adminEditSubjectModal = globalThis.adminEditSubjectModal = adminEditSubjectModal;
window.adminDeleteSubjectConfirm = globalThis.adminDeleteSubjectConfirm = adminDeleteSubjectConfirm;
window.adminCreateSkillV2 = globalThis.adminCreateSkillV2 = adminCreateSkillV2;
window.adminAddSkillVideoV2 = globalThis.adminAddSkillVideoV2 = adminAddSkillVideoV2;
window.getAdminModals = globalThis.getAdminModals = getAdminModals;
window.v10AdminSubjects = globalThis.v10AdminSubjects = v10AdminSubjects;
window.v10AdminViewSubject = globalThis.v10AdminViewSubject = v10AdminViewSubject;
window.v10AdminEditSubject = globalThis.v10AdminEditSubject = v10AdminEditSubject;
window.v10AdminDeleteSubject = globalThis.v10AdminDeleteSubject = v10AdminDeleteSubject;
window.v10AdminOpenSubject = globalThis.v10AdminOpenSubject = v10AdminOpenSubject;
window.v10AdminOpenSubjectObj = globalThis.v10AdminOpenSubjectObj = v10AdminOpenSubjectObj;
window.v10AdminAddUnit = globalThis.v10AdminAddUnit = v10AdminAddUnit;
window.v10AdminEditUnit = globalThis.v10AdminEditUnit = v10AdminEditUnit;
window.v10AdminDeleteUnit = globalThis.v10AdminDeleteUnit = v10AdminDeleteUnit;
window.v10AdminUnitDetail = globalThis.v10AdminUnitDetail = v10AdminUnitDetail;
window.patchAdminSubjectsNav = globalThis.patchAdminSubjectsNav = patchAdminSubjectsNav;
window.installStudentDashboardAndWorkshopPatch = globalThis.installStudentDashboardAndWorkshopPatch = installStudentDashboardAndWorkshopPatch;
window.adminCreateSubAdmin = globalThis.adminCreateSubAdmin = adminCreateSubAdmin;
window.adminDeleteSubAdmin = globalThis.adminDeleteSubAdmin = adminDeleteSubAdmin;
window.launchSubAdmin_LEGACY = globalThis.launchSubAdmin_LEGACY = launchSubAdmin_LEGACY;
window.switchSubAdminTab = globalThis.switchSubAdminTab = switchSubAdminTab;
window.openCreateSubAdminModal = globalThis.openCreateSubAdminModal = openCreateSubAdminModal;
window.closeCreateSubAdminModal = globalThis.closeCreateSubAdminModal = closeCreateSubAdminModal;
window.renderExistingSubAdmins = globalThis.renderExistingSubAdmins = renderExistingSubAdmins;
window.createSubAdmin = globalThis.createSubAdmin = createSubAdmin;
window.launchSubAdmin = globalThis.launchSubAdmin = launchSubAdmin;
window.adminEditSubAdminEntry = globalThis.adminEditSubAdminEntry = adminEditSubAdminEntry;
window.adminAddFeature = globalThis.adminAddFeature = adminAddFeature;
window.adminDeleteFeature = globalThis.adminDeleteFeature = adminDeleteFeature;
window.adminEditFeature = globalThis.adminEditFeature = adminEditFeature;



// ═══════════════════════════════════════════════════
//  BOOTSTRAP & INITIALIZATION
// ═══════════════════════════════════════════════════
window.addEventListener('load', async () => {
  setTimeout(() => window.hideLoading?.(), 200);
  window.updateLandingStats?.();
  window.buildHeatmap?.();
  await window.initCalc?.();
});

document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    window.closeLogoutModal?.();
    if (window.APP?.chatOpen) window.toggleChat?.();
  }
});

// Run automatically to keep notification dots in sync
setInterval(() => {
  if (typeof window.updateNotificationDots === 'function') {
    window.updateNotificationDots();
  }
}, 2000);

window.addEventListener('storage', (event) => {
  if (/^(edusync_custom_subjects|edusync_units_|edusync_admin_|edusync_url_requests|edusync_subadmins|edusync_universities|edusync_deleted_universities|edusync_regulations|aimeasy_cached_regulations)/.test(event.key || '')) {
    window.refreshActiveAdminSurfaces?.();
  }
});

window.addEventListener('hashchange', () => {
  if (window.location.hash.includes('live-workshops') && typeof window.openLiveWorkshops === 'function') {
    window.openLiveWorkshops();
  }
});

setTimeout(() => {
  if (typeof window.ensureLiveWorkshopSurfaces === 'function') window.ensureLiveWorkshopSurfaces();
  if (typeof window.installProfileAutosave === 'function') window.installProfileAutosave();
  if (window.location.hash.includes('live-workshops') && typeof window.openLiveWorkshops === 'function') {
    window.openLiveWorkshops();
  }
}, 300);
