const opentype = require("opentype.js");
const fs = require("fs");
const path = require("path");
const mont = opentype.loadSync(path.join(__dirname, "fonts/f4.ttf")); // Montserrat 800
const f = (n) => +n.toFixed(2);

const defs = `
  <defs>
    <linearGradient id="gold" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#fff5cc"/><stop offset="0.45" stop-color="#f2c14e"/><stop offset="1" stop-color="#a8721a"/>
    </linearGradient>
    <radialGradient id="ruby" cx="38%" cy="28%" r="80%">
      <stop offset="0" stop-color="#ff7fa6"/><stop offset="0.45" stop-color="#e0245e"/><stop offset="1" stop-color="#5e0420"/>
    </radialGradient>
    <linearGradient id="trail" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#f2c14e" stop-opacity="0"/><stop offset="0.55" stop-color="#e0ab3e" stop-opacity="0.85"/>
      <stop offset="1" stop-color="#fff2bd"/>
    </linearGradient>
    <filter id="lift" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="3" stdDeviation="3" flood-color="#1a0d00" flood-opacity="0.45"/>
    </filter>
  </defs>`;

const pin = (s) => `
  <g transform="scale(${s})">
    <path d="M0 52 C-10 34 -34 14 -34 -8 A34 34 0 1 1 34 -8 C34 14 10 34 0 52Z" fill="url(#ruby)" stroke="#2a0612" stroke-width="2.4"/>
    <path d="M0 -42 L22 -20 L0 -8 L-22 -20Z" fill="#ff9ab8" opacity="0.85"/>
    <path d="M-22 -20 L0 -8 L-12 26 L-32 -2Z" fill="#b30f43" opacity="0.9"/>
    <path d="M22 -20 L0 -8 L12 26 L32 -2Z" fill="#7e0830" opacity="0.9"/>
    <circle cx="0" cy="-12" r="9" fill="#2a0612" stroke="#ffb3c7" stroke-width="2"/>
    <path d="M-16 -32 Q-6 -40 6 -38" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round" opacity="0.8"/>
  </g>`;

const scepterX = (h, w = 10) => {
  const rod = (rot) => `
    <g transform="rotate(${rot})">
      <rect x="${-w / 2}" y="${-h / 2}" width="${w}" height="${h}" rx="${w / 2}" fill="url(#gold)" stroke="#2a1a02" stroke-width="1.6"/>
      <circle cx="0" cy="${-h / 2 - w * 0.7}" r="${w}" fill="url(#gold)" stroke="#2a1a02" stroke-width="1.6"/>
      <circle cx="${-w * 0.3}" cy="${-h / 2 - w}" r="${w * 0.3}" fill="#fff6d6" opacity="0.9"/>
      <rect x="${-w * 0.9}" y="${h / 2 - w}" width="${w * 1.8}" height="${w * 0.7}" rx="${w * 0.3}" fill="#b07a18" stroke="#2a1a02" stroke-width="1.2"/>
    </g>`;
  return rod(-34) + rod(34) + `<circle r="${w * 0.75}" fill="url(#ruby)" stroke="#2a0612" stroke-width="1.6"/>`;
};

const sparkle = (x, y, s, o = 0.9) =>
  `<path d="M${x} ${y - 10 * s} Q${x} ${y} ${x + 10 * s} ${y} Q${x} ${y} ${x} ${y + 10 * s} Q${x} ${y} ${x - 10 * s} ${y} Q${x} ${y} ${x} ${y - 10 * s}Z" fill="#fff2bd" opacity="${o}"/>`;

// Lay out "RR" + scepter-x centered at cx; returns svg and the x-mark's center.
function wordmark(cx, baseline, size) {
  const gapRR = size * 0.03;
  const rrW = mont.getAdvanceWidth("R", size) * 2 + gapRR;
  const xW = size * 0.6, gap = size * 0.07;
  const x0 = cx - (rrW + gap + xW) / 2;
  let d = "", x = x0;
  for (const ch of "RR") { d += mont.getPath(ch, x, baseline, size).toPathData(2); x += mont.getAdvanceWidth(ch, size) + gapRR; }
  const mx = x0 + rrW + gap + xW / 2, my = baseline - size * 0.36 + size * 0.03;
  return {
    svg: `<g filter="url(#lift)"><path d="${d}" fill="url(#gold)"/>
      <g transform="translate(${f(mx)} ${f(my)})">${scepterX(size * 0.74, size * 0.068)}</g></g>`,
    mx, my, left: x0, right: x0 + rrW + gap + xW,
  };
}

const out = process.argv[2];

// Square logo (token logo): pin hovering over the scepter-x, trail sweeping under the word up to the pin.
{
  const size = 150, base = 330;
  const w = wordmark(250, base, size);
  const pinY = w.my - 150;
  const trail = `<path d="M${f(w.left - 20)} ${base + 30} C${f(w.left + 120)} ${base + 62} ${f(w.right - 10)} ${base + 40} ${f(w.right + 26)} ${f(pinY + 70)}
    C${f(w.right - 30)} ${base + 22} ${f(w.left + 110)} ${base + 40} ${f(w.left - 20)} ${base + 30}Z" fill="url(#trail)"/>`;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">${defs}
  ${trail}
  ${w.svg}
  <g transform="translate(${f(w.mx)} ${f(pinY)})" filter="url(#lift)">${pin(1)}</g>
  ${sparkle(f(w.right + 26), f(pinY + 70), 0.9)}
  ${sparkle(f(w.left + 4), 160, 0.7, 0.75)}
  ${sparkle(f(w.left + 60), 118, 0.45, 0.6)}
</svg>`;
  fs.writeFileSync(`${out}/rroyal-logo.svg`, svg);
}

// Icon for small sizes: scepter-x with the pin above it.
{
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">${defs}
  <g transform="translate(256 318)" filter="url(#lift)">${scepterX(300, 30)}</g>
  <g transform="translate(256 120)" filter="url(#lift)">${pin(1.75)}</g>
</svg>`;
  fs.writeFileSync(`${out}/rroyal-icon.svg`, svg);
}

// Wide wordmark for website headers.
{
  const size = 150;
  const w = wordmark(330, 230, size);
  const pinY = w.my - 150;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 360" width="1200" height="360">${defs}
  ${w.svg}
  <g transform="translate(${f(w.mx)} ${f(pinY + 20)})" filter="url(#lift)">${pin(0.85)}</g>
  <path d="${(() => { let d = "", x = 560; for (const ch of "ROYAL") { d += mont.getPath(ch, x, 200, 112).toPathData(2); x += mont.getAdvanceWidth(ch, 112) + 14; } return d; })()}" fill="url(#gold)" filter="url(#lift)"/>
  <path d="M560 240 C760 270 980 262 1130 214 C980 252 760 256 560 240Z" fill="url(#trail)"/>
  ${sparkle(1130, 214, 0.9)}
</svg>`;
  fs.writeFileSync(`${out}/rroyal-wordmark.svg`, svg);
}
console.log("ok");
