const fs = require("fs");
const content = fs.readFileSync("src/legacy/aimeasy-fixes.js", "utf8");
const match = content.match(/window\.v10UploadNote\s*=\s*async function.*?};/s);
console.log(match ? match[0].substring(0, 1500) : "Not found");
