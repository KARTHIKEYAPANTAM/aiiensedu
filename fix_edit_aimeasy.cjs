const fs = require("fs");
let content = fs.readFileSync("src/legacy/aimeasy-fixes.js", "utf8");

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

fs.writeFileSync("src/legacy/aimeasy-fixes.js", content, "utf8");
console.log("Patched Edit to prevent navigation in aimeasy-fixes.js");
