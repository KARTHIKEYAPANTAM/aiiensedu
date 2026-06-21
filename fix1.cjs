const fs = require("fs");
function replaceInFile(filePath, replacements) {
    let content = fs.readFileSync(filePath, "utf8");
    for (const [search, replace] of replacements) {
        content = content.replace(search, replace);
    }
    fs.writeFileSync(filePath, content, "utf8");
    console.log(`Updated ${filePath}`);
}

replaceInFile("src/legacy/legacy-patches.js", [
    [
        `window.v10SAUnitDetail = async function (subjId, unitId) {\n  window._v10SASubjId = subjId;\n  window._v10SAUnitId = unitId;`,
        `window.v10SAUnitDetail = async function (subjId, unitId) {\n  window._v10SASubjId = subjId;\n  window._v10SAUnitId = unitId;\n  const saContent = document.getElementById("sa-content");\n  if (saContent) saContent.innerHTML = "<div style=\\"padding:2rem;text-align:center;\\"><div class=\\"loading-spinner\\" style=\\"margin: 3rem auto 1rem;\\"></div><p style=\\"color:var(--text3);\\">Opening Unit...</p></div>";`
    ]
]);

replaceInFile("src/legacy/aimeasy-fixes.js", [
    [
        `window.v10SAOpenUnits = async function (subjId) {\n    document.querySelectorAll('.v10-popup').forEach(p => p.remove());`,
        `window.v10SAOpenUnits = async function (subjId) {\n    document.querySelectorAll(".v10-popup").forEach(p => p.remove());\n    const saContent = document.getElementById("sa-content");\n    if (saContent) saContent.innerHTML = "<div style=\\"padding:2rem;text-align:center;\\"><div class=\\"loading-spinner\\" style=\\"margin: 3rem auto 1rem;\\"></div><p style=\\"color:var(--text3);\\">Opening Units...</p></div>";`
    ]
]);
