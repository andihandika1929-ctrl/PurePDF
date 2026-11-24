const fs = require('fs');

function inspectPage(filename, label) {
  if (!fs.existsSync(filename)) return;
  const html = fs.readFileSync(filename, 'utf8');
  console.log(`\n================== ${label} (${filename}) ==================`);

  // Find forms, inputs, selects, labels, descriptions
  const inputs = [...html.matchAll(/<(?:input|select|button)[^>]*>/gi)].map(m => m[0]);
  const labels = [...html.matchAll(/<label[^>]*>([\s\S]*?)<\/label>/gi)].map(m => m[1].replace(/<[^>]+>/g, '').trim());
  const options = [...html.matchAll(/<option[^>]*value="([^"]*)"[^>]*>([\s\S]*?)<\/option>/gi)].map(m => ({ val: m[1], text: m[2].trim() }));
  
  console.log('Labels:', labels);
  if (options.length > 0) {
    console.log('Options sample:', options.slice(0, 15));
  }

  // Look for text explaining settings / parameters
  const headings = [...html.matchAll(/<h[234][^>]*>([\s\S]*?)<\/h[234]>/gi)].map(m => m[1].replace(/<[^>]+>/g, '').trim());
  console.log('Headings:', headings);
}

inspectPage('pdf24_compress.html', 'KOMPRES PDF');
inspectPage('pdf24_split.html', 'PISAHKAN PDF');
inspectPage('pdf24_redact.html', 'HITAMKAN PDF');
inspectPage('pdf24_overlay.html', 'OVERLAY PDF');
inspectPage('pdf24_ocr.html', 'OCR PDF');
