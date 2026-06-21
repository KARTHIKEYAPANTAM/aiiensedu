const fs = require("fs");
let content = fs.readFileSync("src/legacy/legacy-patches.js", "utf8");

const replacements = [
    [/window\.v10UploadPYQ\s*=\s*async function.*?\(subjectName,\s*unitId\)\s*\{/, "window.v10UploadPYQ = async function (subjectName, unitId) {\n  if (window._isSavingContentPYQ) return;\n  window._isSavingContentPYQ = true;\n  const _btn = event?.target;\n  if (_btn) { _btn.disabled = true; _btn.dataset.original = _btn.textContent; _btn.textContent = 'Saving...'; }\n  try {"],
    [/showToast\('PYQ saved under topic.', 'green'\);/, "showToast('PYQ saved under topic.', 'green');\n  } finally {\n    window._isSavingContentPYQ = false;\n    if (_btn) { _btn.disabled = false; _btn.textContent = _btn.dataset.original; }\n  }"],
    
    [/window\.v10UploadIQ\s*=\s*async function.*?\(subjectName,\s*unitId\)\s*\{/, "window.v10UploadIQ = async function (subjectName, unitId) {\n  if (window._isSavingContentIQ) return;\n  window._isSavingContentIQ = true;\n  const _btn = event?.target;\n  if (_btn) { _btn.disabled = true; _btn.dataset.original = _btn.textContent; _btn.textContent = 'Saving...'; }\n  try {"],
    [/showToast\('Important question saved under topic.', 'green'\);/, "showToast('Important question saved under topic.', 'green');\n  } finally {\n    window._isSavingContentIQ = false;\n    if (_btn) { _btn.disabled = false; _btn.textContent = _btn.dataset.original; }\n  }"]
];

for (const [r, n] of replacements) {
    content = content.replace(r, n);
}

fs.writeFileSync("src/legacy/legacy-patches.js", content, "utf8");
console.log("Fixed PYQ and IQ Save Buttons");
