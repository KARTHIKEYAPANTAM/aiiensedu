const fs = require("fs");
let content = fs.readFileSync("src/legacy/aimeasy-fixes.js", "utf8");

const backBtnCode = `
  // Global SubAdmin Back Button
  document.addEventListener('DOMContentLoaded', () => {
    const saScreen = document.getElementById('screen-subadmin');
    if (saScreen) {
      const topBar = saScreen.querySelector('.admin-topbar');
      if (topBar && !topBar.querySelector('#sa-global-back')) {
        const btn = document.createElement('button');
        btn.id = 'sa-global-back';
        btn.className = 'btn btn-ghost btn-sm';
        btn.innerHTML = '← Back';
        btn.style.marginRight = 'auto';
        btn.onclick = () => window.history.back();
        topBar.insertBefore(btn, topBar.firstChild);
      }
    }
  });
`;

if (!content.includes('sa-global-back')) {
    content += "\n" + backBtnCode;
    fs.writeFileSync("src/legacy/aimeasy-fixes.js", content, "utf8");
    console.log("Added global back button");
}
