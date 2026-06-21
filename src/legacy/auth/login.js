// Common legacy helpers used across modules
const esc = (value) => String(value ?? '').replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
const js = (value) => String(value ?? '').replace(/\\/g, '\\\\').replace(/'/g, "\\'");
const sb = () => window.__AIMEASY_SUPABASE__;
const todayKeyDb = (date = new Date()) => date.toISOString().slice(0, 10);
const pctFromCgpa = (cgpa) => Math.max(0, Math.min(100, Number(cgpa || 0) * 9.5));

export function selectRoleAndNavigate(role) {
  const logLabel = role === 'content_creator' ? 'Creator' : role === 'student' ? 'Student' : role;
  console.log(`[ROLE CLICK] ${logLabel}`);
  APP.role = role;
  document.querySelectorAll('.role-card').forEach(c => c.classList.remove('selected'));
  const cardId = role === 'content_creator' ? 'role-creator' : 'role-' + role;
  document.getElementById(cardId)?.classList.add('selected');
  // Small delay for visual feedback, then navigate to auth
  setTimeout(() => proceedWithRole(), 220);
}

export function proceedWithRole_OLD() {
  if (APP.role === 'teacher') {
    showScreen('screen-teacher');
    return;
  }
  if (APP.session && APP.user) {
    showLoading('Signing you in...');
    setTimeout(() => { hideLoading(); launchApp(); }, 900);
    return;
  }
  showScreen('screen-profile');
}

export function profileStep2() {
  alert("profileStep2 called");
  const name = document.getElementById('p-name').value.trim();
  const college = document.getElementById('p-college').value.trim();
  const phone = document.getElementById('p-phone').value.trim();

  if (!name) {
    showToast('Please enter your full name', 'red');
    return;
  }

  if (!college) {
    showToast('College name is mandatory', 'red');
    return;
  }

  if (!phone) {
    showToast('Mobile number is mandatory', 'red');
    return;
  }

  if (!/^[0-9]{10}$/.test(phone)) {
    showToast('Mobile number must be exactly 10 digits', 'red');
    return;
  }

  APP.user = { name, college, phone };
  document.getElementById('profile-step1').style.display = 'none';
  document.getElementById('profile-step2').style.display = 'block';
  document.getElementById('step1').className = 'profile-step done';
  document.getElementById('step2').className = 'profile-step active';
}

export function backToStep1() {
  document.getElementById('profile-step1').style.display = 'block';
  document.getElementById('profile-step2').style.display = 'none';
  document.getElementById('step1').className = 'profile-step active';
  document.getElementById('step2').className = 'profile-step';
}

export function submitProfile_OLD() {
  const uni = document.getElementById('p-university').value;
  const reg = document.getElementById('p-regulation').value;
  const sem = document.getElementById('p-semester').value;
  if (!uni || !reg || !sem) { showToast('Please fill all academic fields', 'red'); return; }
  APP.user = { ...APP.user, university: uni, regulation: reg, year: sem.split('-')[0], semester: sem };
  sessionStorage.setItem('edusync_user', JSON.stringify(APP.user));
  APP.session = true;
  showLoading('Setting up your personalized dashboard...');
  setTimeout(() => { hideLoading(); launchApp(); }, 1200);
}

export function previewPhoto(e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = ev => {
    const c = document.getElementById('photo-circle');
    c.innerHTML = `<img src="${ev.target.result}" alt="Profile">`;
    if (APP.user) APP.user.photo = ev.target.result;
  };
  reader.readAsDataURL(file);
}
