const fs = require("fs");
let content = fs.readFileSync("src/legacy/installCriticalFixes.js", "utf8");
content = content.replace("const { data, error } = await fetchCurriculumStats();", "const sa = window.APP?.subAdminData || {};\n    const { data, error } = await fetchCurriculumStats(sa.username);");
fs.writeFileSync("src/legacy/installCriticalFixes.js", content, "utf8");
console.log("Updated installCriticalFixes.js");
