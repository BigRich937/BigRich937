// Symmetric monogram: one R mirrored, scepter-x in the middle, ruby pin above, trail below.
const opentype = require("opentype.js");
const fs = require("fs");
const path = require("path");
const src = fs.readFileSync(path.join(__dirname, "logoC.js"), "utf8");
const pick = (name) => src.slice(src.indexOf(`const ${name}`), src.indexOf(";\n\n", src.indexOf(`const ${name}`)) + 1);
eval(pick("defs") + pick("pin") + pick("scepterX") + pick("sparkle") + "\nglobalThis.parts={defs,pin,scepterX,sparkle};");
const { defs, pin, scepterX, sparkle } = globalThis.parts;
const f = (n) => +n.toFixed(2);

// mirror: "left" = Я x R (bowls face outward), "right" = R x Я (bowls face inward)
function logo(font, mirror, rodRatio, opts = {}) {
  const GAP = opts.gap ?? GAP_ARG, PIN_MIDDLE = opts.pinMiddle ?? PIN_MIDDLE_ARG;
  const showTrail = opts.trail ?? true, showSparkles = opts.sparkles ?? true;
  const measure = (size) => {
    const bb = font.getPath("R", 0, 0, size).getBoundingBox();
    const capH = -bb.y1, rW = bb.x2 - bb.x1; // use ink width so spacing is even on both sides
    const xW = capH * 0.82, gap = capH * GAP;
    return { capH, rW, x1: bb.x1, xW, gap, total: rW * 2 + xW + gap * 2 };
  };
  const size = 150 * (340 / measure(150).total);
  const m = measure(size);
  const cx = 256;
  const above = PIN_MIDDLE ? m.capH * 1.08 : m.capH / 2 - m.capH * 0.04 + m.capH * 0.5 + 92 + 46, below = 62;
  const base = 256 + (above - below) / 2;
  const left = cx - m.total / 2, right = cx + m.total / 2;
  const d = font.getPath("R", -m.x1, 0, size).toPathData(2); // ink starts at x=0
  const R = (x, flip) => flip
    ? `<path d="${d}" transform="translate(${f(x + m.rW)} ${f(base)}) scale(-1 1)" fill="url(#gold)"/>`
    : `<path d="${d}" transform="translate(${f(x)} ${f(base)})" fill="url(#gold)"/>`;
  const leftR = R(left, mirror === "left");
  const rightR = R(right - m.rW, mirror === "right");
  const mx = cx, my = base - m.capH / 2 + m.capH * 0.04;
  const pinY = PIN_MIDDLE ? my - m.capH * 0.95 : my - m.capH * 0.5 - 92; // also anchors the sparkles
  const pinScale = (m.capH * 0.62) / 94;
  const pinSvg = PIN_MIDDLE
    ? `<g transform="translate(${f(mx)} ${f(my - m.capH * 0.06)}) scale(${f(pinScale)})" filter="url(#lift)">${pin(1)}</g>`
    : `<g transform="translate(${f(mx)} ${f(pinY)})" filter="url(#lift)">${pin(1)}</g>`;
  const trail = `<path d="M${f(left - 22)} ${f(base + 26)} C${f(left + 110)} ${f(base + 64)} ${f(right - 20)} ${f(base + 42)} ${f(right + 22)} ${f(base - m.capH * 0.7)}
    C${f(right - 34)} ${f(base + 22)} ${f(left + 100)} ${f(base + 40)} ${f(left - 22)} ${f(base + 26)}Z" fill="url(#trail)"/>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">${defs}
  ${showTrail ? trail : ""}
  <g filter="url(#lift)">${leftR}${rightR}
    <g transform="translate(${f(mx)} ${f(my)})">${scepterX(m.capH * 1.02, m.capH * rodRatio)}</g></g>
  ${pinSvg}
  ${showSparkles ? sparkle(f(right + 22), f(base - m.capH * 0.7), 0.9) + sparkle(f(left + 10), f(pinY + 34), 0.7, 0.75) + sparkle(f(right - 24), f(pinY + 6), 0.5, 0.65) : ""}
</svg>`;
}

const GAP_ARG = Number(process.argv[3] ?? 0.14);
const PIN_MIDDLE_ARG = process.argv[5] === "pin-middle";
const only = process.argv[4] ? process.argv[4].split(",") : null;
module.exports = { logo };
if (require.main === module) {
const out = process.argv[2];
fs.mkdirSync(out, { recursive: true });
const VARIANTS = [
  ["1-cinzel-out", "Cinzel Medium", "Cinzel.ttf", "left", "Я x R: curves face outward"],
  ["2-cinzel-in", "Cinzel Medium", "Cinzel.ttf", "right", "R x Я: curves face the x"],
  ["3-cormorant-out", "Cormorant Garamond", "CormorantGaramond.ttf", "left", "Я x R: curves face outward"],
  ["4-cormorant-in", "Cormorant Garamond", "CormorantGaramond.ttf", "right", "R x Я: curves face the x"],
];
const meta = [];
for (const [id, name, file, mirror, vibe] of VARIANTS.filter(([id]) => !only || only.includes(id))) {
  const font = opentype.loadSync(path.join(__dirname, "fontsL", file));
  fs.writeFileSync(`${out}/rrx-${id}.svg`, logo(font, mirror, 0.065));
  meta.push({ id, name, vibe });
}
fs.writeFileSync(`${out}/meta.json`, JSON.stringify(meta));
console.log("ok");
}
