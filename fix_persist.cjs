const fs = require("fs");
let content = fs.readFileSync("src/legacy/installCriticalFixes.js", "utf8");
content = content.replace(
    "const { data, error } = await createContentItem(payload);",
    "if (window.APP?.subAdminData?.username) payload = { ...payload, createdBy: window.APP.subAdminData.username };\n    const { data, error } = await createContentItem(payload);"
);
fs.writeFileSync("src/legacy/installCriticalFixes.js", content, "utf8");
console.log("Updated aimeasyPersistContent");
