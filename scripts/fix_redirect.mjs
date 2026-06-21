import fs from 'fs';
const file = 'src/services/auth/roleRedirectService.js';
let content = fs.readFileSync(file, 'utf8');
const oldStr =   } else if (role === ROLE.SUBADMIN) {
    window.APP.adminType = ROLE.SUBADMIN;
    window.__aimeasyPreserveRoleRoute = preservePath;
    window.launchSubAdmin?.();;
const newStr =   } else if (role === ROLE.SUBADMIN) {
    window.APP.adminType = ROLE.SUBADMIN;
    window.APP.subAdminData = window.APP.subAdminData || { 
      username: profile?.full_name || profile?.email || 'Sub Admin',
      id: profile?.id,
      branch: profile?.branch_name,
      role 
    };
    window.__aimeasyPreserveRoleRoute = preservePath;
    window.launchSubAdmin?.();;
if (content.includes(oldStr)) {
  content = content.replace(oldStr, newStr);
  fs.writeFileSync(file, content);
  console.log('Replaced successfully');
} else {
  console.log('String not found');
}
