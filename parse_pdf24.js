const fs = require('fs');
const html = fs.readFileSync('pdf24_id.html', 'utf8');

// Match tiles or cards on PDF24
const tileRegex = /<a[^>]*class="[^"]*tile[^"]*"[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi;
let match;
const tiles = [];

while ((match = tileRegex.exec(html)) !== null) {
  const href = match[1];
  const inner = match[2];
  
  // Extract title and description
  const titleMatch = inner.match(/<h3[^>]*>([\s\S]*?)<\/h3>/i) || inner.match(/<div[^>]*class="[^"]*title[^"]*"[^>]*>([\s\S]*?)<\/div>/i);
  const descMatch = inner.match(/<p[^>]*>([\s\S]*?)<\/p>/i) || inner.match(/<div[^>]*class="[^"]*desc[^"]*"[^>]*>([\s\S]*?)<\/div>/i);
  
  const title = titleMatch ? titleMatch[1].replace(/<[^>]+>/g, '').trim() : '';
  const desc = descMatch ? descMatch[1].replace(/<[^>]+>/g, '').trim() : '';
  
  tiles.push({ href, title, desc });
}

console.log('Found tiles count:', tiles.length);
if (tiles.length === 0) {
  // Try generic anchor matching
  const aRegex = /<a[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi;
  while ((match = aRegex.exec(html)) !== null) {
    const href = match[1];
    if (href.startsWith('/id/') || href.includes('pdf24.org/id/')) {
      const text = match[2].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
      if (text.length > 5 && text.length < 150) {
        tiles.push({ href, text });
      }
    }
  }
  console.log('Fallback anchor count:', tiles.length);
}

fs.writeFileSync('pdf24_extracted.json', JSON.stringify(tiles, null, 2));
console.log('Saved to pdf24_extracted.json');
