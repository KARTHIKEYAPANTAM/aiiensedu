import {
  fetchSubjects,
  createSubject,
  updateSubject,
  deleteSubject,
  fetchUnits,
  createUnit,
  updateUnit,
  deleteUnit,
  fetchCurriculumStats,
  fetchUnitRoadmap,
  saveLinkedContentItem,
  saveUnitRoadmap,
} from './curriculum/curriculumRepository.js';

import {
  createContentItem,
  deleteContentItem,
  listContentItems,
  updateContentItem,
} from './content/contentRepository.js';

export const apiService = {
  fetchSubjects,
  createSubject,
  updateSubject,
  deleteSubject,
  fetchUnits,
  createUnit,
  updateUnit,
  deleteUnit,
  fetchCurriculumStats,
  fetchUnitRoadmap,
  saveLinkedContentItem,
  saveUnitRoadmap,
  createContentItem,
  deleteContentItem,
  listContentItems,
  updateContentItem,
};

export default apiService;
export {
  fetchSubjects,
  createSubject,
  updateSubject,
  deleteSubject,
  fetchUnits,
  createUnit,
  updateUnit,
  deleteUnit,
  fetchCurriculumStats,
  fetchUnitRoadmap,
  saveLinkedContentItem,
  saveUnitRoadmap,
  createContentItem,
  deleteContentItem,
  listContentItems,
  updateContentItem,
};
