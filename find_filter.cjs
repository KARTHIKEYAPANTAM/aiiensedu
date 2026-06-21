const fs = require("fs");
const content = fs.readFileSync("src/legacy/legacy-app.js", "utf8");
const lines = content.split("\n");
lines.forEach((line, i) => {
    if (line.includes(".filter(") && (line.includes("admin") || line.includes("uploadedBy") || line.includes("created_by"))) {
        console.log(`L${i+1}: ${line.trim()}`);
    }
});
