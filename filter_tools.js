const fs = require('fs');
const tools = JSON.parse(fs.readFileSync('pdf24_all_tools.json', 'utf8'));

// Filter out duplicates and sublinks
const cleanTools = tools.filter(t => {
  const parts = t.href.split('/').filter(Boolean);
  return parts.length === 2; // e.g. /id/kompres-pdf
});

console.log('Clean top-level tools count:', cleanTools.length);
console.log(JSON.stringify(cleanTools, null, 2));
