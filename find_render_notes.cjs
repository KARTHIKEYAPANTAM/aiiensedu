const fs = require("fs");
const content = fs.readFileSync("src/legacy/legacy-app.js", "utf8");
const match = content.match(/async function renderNotes.*?<\/div>`;\n}/s);
console.log(match ? match[0].substring(0, 1000) + "...\n" + match[0].substring(match[0].length - 1000) : "Not found");
