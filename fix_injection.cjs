const fs = require("fs");
let content = fs.readFileSync("src/legacy/installCriticalFixes.js", "utf8");
content = content.replace(
    "window.aimeasyCreateSubject = withCurriculumRefresh(createSubject, 'subject');",
    "window.aimeasyCreateSubject = withCurriculumRefresh(async (subj) => { if (window.APP?.subAdminData?.username) { subj = { ...subj, createdBy: window.APP.subAdminData.username }; } return createSubject(subj); }, 'subject');"
);
content = content.replace(
    "window.aimeasySaveLinkedContentItem = withCurriculumRefresh(saveLinkedContentItem, 'content');",
    "window.aimeasySaveLinkedContentItem = withCurriculumRefresh(async (payload) => { if (window.APP?.subAdminData?.username) { payload = { ...payload, createdBy: window.APP.subAdminData.username }; } return saveLinkedContentItem(payload); }, 'content');"
);
fs.writeFileSync("src/legacy/installCriticalFixes.js", content, "utf8");
console.log("Updated installCriticalFixes.js for createdBy injection.");
