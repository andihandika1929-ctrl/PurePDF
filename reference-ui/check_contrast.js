const fs = require('fs');
const path = require('path');

const tokens = JSON.parse(fs.readFileSync(path.join(__dirname, 'tokens.json'), 'utf8'));

const HEX_REGEX = /^#?([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;
const NEEDS = {
  normal: [4.5, 7.0],
  large: [3.0, 4.5],
  ui: [3.0, 3.0]
};

function parseHex(val) {
  const m = val.trim().match(HEX_REGEX);
  if (!m) return null;
  let h = m[1];
  if (h.length === 3) {
    h = h.split('').map(c => c + c).join('');
  }
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16)
  ];
}

function luminance([r, g, b]) {
  const chan = c => {
    const s = c / 255.0;
    return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * chan(r) + 0.7152 * chan(g) + 0.0722 * chan(b);
}

function ratio(c1, c2) {
  const rgb1 = parseHex(c1);
  const rgb2 = parseHex(c2);
  if (!rgb1 || !rgb2) return null;
  const l1 = luminance(rgb1);
  const l2 = luminance(rgb2);
  const hi = Math.max(l1, l2);
  const lo = Math.min(l1, l2);
  return (hi + 0.05) / (lo + 0.05);
}

console.log('=== WCAG CONTRAST REPORT (replica-design) ===\n');
let hasFailure = false;

(tokens.pairs || []).forEach(p => {
  const [fgKey, bgKey, size = 'normal'] = p;
  const fg = tokens.color[fgKey];
  const bg = tokens.color[bgKey];
  if (!fg || !bg) {
    console.log(`[SKIP] Missing key: ${fgKey} or ${bgKey}`);
    return;
  }
  const r = ratio(fg, bg);
  if (r === null) {
    console.log(`[SKIP] Non-hex color in pair: ${fgKey} (${fg}) vs ${bgKey} (${bg})`);
    return;
  }
  const [aa, aaa] = NEEDS[size] || NEEDS.normal;
  const passAA = r >= aa;
  const passAAA = r >= aaa;
  const status = passAAA ? 'PASS (AAA)' : passAA ? 'PASS (AA)' : 'FAIL';
  if (!passAA) hasFailure = true;
  console.log(`${fgKey} (${fg}) on ${bgKey} (${bg}) [${size}]: ${r.toFixed(2)}:1 -> ${status}`);
});

console.log('\nResult:', hasFailure ? 'FAILURES DETECTED' : 'ALL PAIRS PASS WCAG AA / AAA!');
process.exit(hasFailure ? 1 : 0);
