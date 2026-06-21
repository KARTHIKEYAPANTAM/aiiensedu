const fs = require("fs");
let content = fs.readFileSync("src/legacy/legacy-patches.js", "utf8");

// Wrap v10UploadNote, v10UploadPYQ, v10UploadIQ
const replacements = [
    [/window\.v10UploadNote\s*=\s*async function.*?\(subjectName,\s*unitId\)\s*\{/, "window.v10UploadNote = async function (subjectName, unitId) {\n  if (window._isSavingContent) return;\n  window._isSavingContent = true;\n  const _btn = event?.target;\n  if (_btn) { _btn.disabled = true; _btn.dataset.original = _btn.textContent; _btn.textContent = 'Saving...'; }\n  try {"],
    [/showToast\('Note saved successfully!', 'green'\);/, "showToast('Note saved successfully!', 'green');\n  } finally {\n    window._isSavingContent = false;\n    if (_btn) { _btn.disabled = false; _btn.textContent = _btn.dataset.original; }\n  }"],
    [/showToast\('DB save failed: ' \+ saved\.error\.message, 'red'\); return;/, "showToast('DB save failed: ' + saved.error.message, 'red'); return;\n  } finally {\n    window._isSavingContent = false;\n    if (_btn) { _btn.disabled = false; _btn.textContent = _btn.dataset.original; }\n  }"]
];

for (const [r, n] of replacements) {
    content = content.replace(r, n);
}

fs.writeFileSync("src/legacy/legacy-patches.js", content, "utf8");
console.log("Fixed Save Button Multiple Clicks");
