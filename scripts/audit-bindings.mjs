import fs from 'fs';
import path from 'path';

const searchDir = './src/pages';
const legacyAppFile = './src/legacy/legacy-app.js';

function getFiles(dir, ext) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach((file) => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(getFiles(file, ext));
    } else if (file.endsWith(ext)) {
      results.push(file);
    }
  });
  return results;
}

const htmlFiles = getFiles(searchDir, '.html');
const handlers = [];

// Regular expression to match inline event handlers
// e.g. onclick="someFunction(abc)" or onchange="anotherFunc(this.value)"
const handlerRegex = /\bon(?:click|change|input|submit)\s*=\s*(["'])(.*?)\1/gi;

htmlFiles.forEach((file) => {
  const content = fs.readFileSync(file, 'utf8');
  let match;
  while ((match = handlerRegex.exec(content)) !== null) {
    const expr = match[2].trim();
    // Extract function name(s) from the expression
    // A simple regex to find sequences of word characters before a parenthesis
    // e.g. "showScreen('screen-landing')" -> "showScreen"
    // e.g. "selectRole('student'); closeSidebar()" -> ["selectRole", "closeSidebar"]
    const funcRegex = /\b([a-zA-Z_][a-zA-Z0-9_]*)\s*\(/g;
    let funcMatch;
    while ((funcMatch = funcRegex.exec(expr)) !== null) {
      handlers.push({
        file,
        expr,
        func: funcMatch[1]
      });
    }
  }
});

// Also search in components for HTML templates
const componentHtmlFiles = getFiles('./src/components', '.html');
componentHtmlFiles.forEach((file) => {
  const content = fs.readFileSync(file, 'utf8');
  let match;
  while ((match = handlerRegex.exec(content)) !== null) {
    const expr = match[2].trim();
    const funcRegex = /\b([a-zA-Z_][a-zA-Z0-9_]*)\s*\(/g;
    let funcMatch;
    while ((funcMatch = funcRegex.exec(expr)) !== null) {
      handlers.push({
        file,
        expr,
        func: funcMatch[1]
      });
    }
  }
});

// Extract bound functions from all legacy JS files
// Extract bound functions from all legacy JS files recursively
const windowBindings = new Set();
const legacyFiles = getFiles('./src/legacy', '.js');
legacyFiles.forEach(filePath => {
  const content = fs.readFileSync(filePath, 'utf8');
  const bindingRegex = /\b(?:window|globalThis)\.([a-zA-Z_][a-zA-Z0-9_]*)\s*=/g;
  let bMatch;
  while ((bMatch = bindingRegex.exec(content)) !== null) {
    windowBindings.add(bMatch[1]);
  }
});



const uniqueFunctions = [...new Set(handlers.map(h => h.func))].sort();
console.log(`Found ${uniqueFunctions.length} unique functions referenced in HTML templates:`);

const missing = [];
uniqueFunctions.forEach((func) => {
  // Builtins like console.log or event.stopPropagation or document.getElementById can be skipped
  if (['console', 'event', 'document', 'localStorage', 'sessionStorage', 'alert', 'String', 'Number', 'Boolean'].includes(func)) {
    return;
  }
  const isBound = windowBindings.has(func);
  if (!isBound) {
    // Find where it's used
    const usages = handlers.filter(h => h.func === func).map(h => `${path.basename(h.file)}: ${h.expr}`);
    missing.push({ func, usages });
  }
});

if (missing.length > 0) {
  console.log('\n❌ MISSING WINDOW BINDINGS:');
  missing.forEach((m) => {
    console.log(`- ${m.func}`);
    m.usages.slice(0, 3).forEach(u => console.log(`    usage: ${u}`));
    if (m.usages.length > 3) {
      console.log(`    ... and ${m.usages.length - 3} more`);
    }
  });
} else {
  console.log('\n✅ All functions referenced in HTML are correctly bound to the window object.');
}
