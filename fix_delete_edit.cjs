const fs = require("fs");
let content = fs.readFileSync("src/legacy/legacy-patches.js", "utf8");

content = content.replace(
    /window\.v10DeleteNote = async function \(id, subjectName, unitId\) \{/g,
    "window.v10DeleteNote = async function (id, subjectName, unitId) {\n  if (window.event) window.event.preventDefault();\n  const _btn = window.event?.target;\n  if (_btn) { _btn.disabled = true; _btn.textContent = '...'; }"
);

content = content.replace(
    /window\.v10DeletePYQ = async function \(id, subjectName, unitId\) \{/g,
    "window.v10DeletePYQ = async function (id, subjectName, unitId) {\n  if (window.event) window.event.preventDefault();\n  const _btn = window.event?.target;\n  if (_btn) { _btn.disabled = true; _btn.textContent = '...'; }"
);

content = content.replace(
    /window\.v10DeleteIQ = async function \(id, subjectName, unitId\) \{/g,
    "window.v10DeleteIQ = async function (id, subjectName, unitId) {\n  if (window.event) window.event.preventDefault();\n  const _btn = window.event?.target;\n  if (_btn) { _btn.disabled = true; _btn.textContent = '...'; }"
);

// Edit buttons (they populate the form, which could be slow or buggy)
content = content.replace(
    /window\.aimeasyEditNote = async function\(id, subjectName, unitId\) \{/g,
    "window.aimeasyEditNote = async function(id, subjectName, unitId) {\n  if (window.event) window.event.preventDefault();"
);
content = content.replace(
    /window\.aimeasyEditPYQ = async function\(id, subjectName, unitId\) \{/g,
    "window.aimeasyEditPYQ = async function(id, subjectName, unitId) {\n  if (window.event) window.event.preventDefault();"
);
content = content.replace(
    /window\.aimeasyEditIQ = async function\(id, subjectName, unitId\) \{/g,
    "window.aimeasyEditIQ = async function(id, subjectName, unitId) {\n  if (window.event) window.event.preventDefault();"
);


fs.writeFileSync("src/legacy/legacy-patches.js", content, "utf8");
console.log("Patched Delete and Edit to prevent navigation and indicate loading");
