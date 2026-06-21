const fs = require("fs");
const content = fs.readFileSync("src/legacy/legacy-patches.js", "utf8");
const match = content.match(/window\.v10DeleteNote\s*=\s*async function.*?};/s);
console.log(match ? match[0].substring(0, 1000) : "Not found");
