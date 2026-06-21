const state = {
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

export default state;
