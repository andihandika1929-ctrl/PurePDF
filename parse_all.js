const fs = require('fs');
const html = fs.readFileSync('pdf24_all.html', 'utf8');

// Match all tool tiles/cards on the page
const regex = /<a[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi;
let match;
const toolsMap = new Map();

while ((match = regex.exec(html)) !== null) {
  const href = match[1];
  const inner = match[2];
  
  if (href.startsWith('/id/') && !href.includes('semua-alat') && href !== '/id/' && !href.includes('creator') && !href.includes('kontak') && !href.includes('terms') && !href.includes('privacy') && !href.includes('legal')) {
    const text = inner.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    if (text.length > 2 && text.length < 80 && !toolsMap.has(href)) {
      toolsMap.set(href, text);
    }
  }
}

const list = Array.from(toolsMap.entries()).map(([href, text]) => ({ href, text }));
console.log('Total PDF24 tools found:', list.length);
fs.writeFileSync('pdf24_all_tools.json', JSON.stringify(list, null, 2));
