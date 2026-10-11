// Final RRoyal logo set: Cinzel, Я x R, ruby pin at the center of the scepter X.
const opentype = require("opentype.js");
const fs = require("fs");
const path = require("path");
const { logo } = require("./logoMirror.js");
const font = opentype.loadSync(path.join(__dirname, "fontsL/Cinzel.ttf"));
const out = process.argv[2];
fs.mkdirSync(out, { recursive: true });
const SETTINGS = { gap: -0.26, pinMiddle: true };

// 1. Main logo (token logo): monogram + delivery trail + sparkles.
fs.writeFileSync(`${out}/rroyal-logo.svg`, logo(font, "left", 0.065, SETTINGS));

// 2. Icon for small sizes: monogram only, scaled up to fill the square.
const icon = logo(font, "left", 0.075, { ...SETTINGS, trail: false, sparkles: false })
  .replace(/(<\/defs>)([\s\S]*)(<\/svg>)/, (_, d, body, end) => `${d}<g transform="translate(256 256) scale(1.32) translate(-256 -268)">${body}</g>${end}`);
fs.writeFileSync(`${out}/rroyal-icon.svg`, icon);

// 3. Wide wordmark for headers: monogram on the left, "RROYAL" in Cinzel on the right.
const mono = logo(font, "left", 0.065, { ...SETTINGS, sparkles: false });
const defs = mono.match(/<defs>[\s\S]*<\/defs>/)[0];
const body = mono.replace(/^[\s\S]*<\/defs>/, "").replace(/<\/svg>\s*$/, "");
let d = "", x = 0;
const size = 108, track = 16;
for (const ch of "RROYAL") { d += font.getPath(ch, x, 0, size).toPathData(2); x += font.getAdvanceWidth(ch, size) + track; }
const wordW = x - track;
const wide = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 360" width="1200" height="360">${defs}
  <g transform="translate(20 -76) scale(0.98)">${body}</g>
  <path d="${d}" transform="translate(${560 + (600 - wordW) / 2} 222)" fill="url(#gold)" filter="url(#lift)"/>
  <rect x="${560 + (600 - wordW) / 2}" y="250" width="${wordW}" height="2" fill="url(#gold)" opacity="0.6"/>
</svg>`;
fs.writeFileSync(`${out}/rroyal-wordmark.svg`, wide);
console.log("ok");
