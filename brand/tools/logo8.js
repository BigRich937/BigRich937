// Same RRx logo (scepter x, ruby pin, delivery trail) set in 8 different fonts.
const opentype = require("opentype.js");
const fs = require("fs");
const path = require("path");
const src = fs.readFileSync(path.join(__dirname, "logoC.js"), "utf8");
// Reuse defs / pin / scepterX / sparkle from logoC.js
const pick = (name) => src.slice(src.indexOf(`const ${name}`), src.indexOf(";\n\n", src.indexOf(`const ${name}`)) + 1);
eval(pick("defs") + pick("pin") + pick("scepterX") + pick("sparkle") + "\nglobalThis.parts={defs,pin,scepterX,sparkle};");
const { defs, pin, scepterX, sparkle } = globalThis.parts;
const f = (n) => +n.toFixed(2);

const LIGHT = process.argv[3] === "light";
const FONT_DIR = LIGHT ? "fontsL" : "fonts8";
const FONTS = LIGHT ? [
  ["1-cinzel", "Cinzel Medium", "Cinzel.ttf", "Roman royal capitals"],
  ["2-playfair", "Playfair Display Medium", "PlayfairDisplay.ttf", "Luxury high-contrast serif"],
  ["3-cormorant", "Cormorant Garamond", "CormorantGaramond.ttf", "Elegant classic serif"],
  ["4-marcellus", "Marcellus", "Marcellus.ttf", "Flared, carved-in-stone"],
  ["5-orbitron", "Orbitron Medium", "Orbitron.ttf", "Futuristic crypto-tech"],
  ["6-unbounded", "Unbounded Regular", "Unbounded.ttf", "Wide modern Web3"],
  ["7-josefin", "Josefin Sans", "JosefinSans.ttf", "Geometric, vintage-chic"],
  ["8-raleway", "Raleway", "Raleway.ttf", "Thin, clean and elegant"],
] : [
  ["1-cinzel", "Cinzel", "Cinzel.ttf", "Roman royal capitals"],
  ["2-playfair", "Playfair Display", "PlayfairDisplay.ttf", "Luxury high-contrast serif"],
  ["3-abril", "Abril Fatface", "AbrilFatface.ttf", "Bold fashion-magazine serif"],
  ["4-bebas", "Bebas Neue", "BebasNeue.ttf", "Tall, condensed, sporty"],
  ["5-orbitron", "Orbitron", "Orbitron.ttf", "Futuristic crypto-tech"],
  ["6-unbounded", "Unbounded", "Unbounded.ttf", "Wide modern Web3"],
  ["7-bungee", "Bungee", "Bungee.ttf", "Chunky street-sign bold"],
  ["8-righteous", "Righteous", "Righteous.ttf", "Rounded retro-futuristic"],
];

function logo(font) {
  // Size the word so "RR" + x is ~330px wide, whatever the font.
  const measure = (size) => {
    const capH = -font.getPath("R", 0, 0, size).getBoundingBox().y1;
    const gapRR = size * 0.03, rrW = font.getAdvanceWidth("R", size) * 2 + gapRR;
    const xW = capH * 0.82, gap = capH * 0.1;
    return { capH, gapRR, rrW, xW, gap, total: rrW + gap + xW };
  };
  const size = 150 * (330 / measure(150).total);
  const m = measure(size);
  const cx = 250;
  // Center the artwork vertically: from the pin top (~capH*1.5 + 134 above the baseline) to the trail bottom (~62 below).
  const above = m.capH / 2 - m.capH * 0.04 + m.capH * 0.5 + 92 + 46, below = 62;
  const base = 256 + (above - below) / 2;
  const x0 = cx - m.total / 2;
  let d = "", x = x0;
  for (const ch of "RR") { d += font.getPath(ch, x, base, size).toPathData(2); x += font.getAdvanceWidth(ch, size) + m.gapRR; }
  const mx = x0 + m.rrW + m.gap + m.xW / 2, my = base - m.capH / 2 + m.capH * 0.04;
  const left = x0, right = x0 + m.total;
  const pinY = my - m.capH * 0.5 - 92;
  const trail = `<path d="M${f(left - 20)} ${f(base + 30)} C${f(left + 120)} ${f(base + 62)} ${f(right - 10)} ${f(base + 40)} ${f(right + 26)} ${f(pinY + 70)}
    C${f(right - 30)} ${f(base + 22)} ${f(left + 110)} ${f(base + 40)} ${f(left - 20)} ${f(base + 30)}Z" fill="url(#trail)"/>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">${defs}
  ${trail}
  <g filter="url(#lift)"><path d="${d}" fill="url(#gold)"/>
    <g transform="translate(${f(mx)} ${f(my)})">${scepterX(m.capH * 1.02, m.capH * (LIGHT ? 0.065 : 0.095))}</g></g>
  <g transform="translate(${f(mx)} ${f(pinY)})" filter="url(#lift)">${pin(1)}</g>
  ${sparkle(f(right + 26), f(pinY + 70), 0.9)}
  ${sparkle(f(left + 4), f(pinY + 30), 0.7, 0.75)}
  ${sparkle(f(left + 60), f(pinY - 12), 0.45, 0.6)}
</svg>`;
}

const out = process.argv[2];
fs.mkdirSync(out, { recursive: true });
const meta = [];
for (const [id, name, file, vibe] of FONTS) {
  const font = opentype.loadSync(path.join(__dirname, FONT_DIR, file));
  fs.writeFileSync(`${out}/rrx-${id}.svg`, logo(font));
  meta.push({ id, name, vibe });
}
fs.writeFileSync(`${out}/meta.json`, JSON.stringify(meta));
console.log("ok");
