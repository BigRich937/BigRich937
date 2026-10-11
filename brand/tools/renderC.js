const { chromium } = require(require("child_process").execSync("npm root -g").toString().trim() + "/playwright");
const fs = require("fs");
(async () => {
  const [dir] = process.argv.slice(2);
  const read = (f) => fs.readFileSync(`${dir}/${f}`, "utf8");
  const sized = (svg, w, h = w) => svg.replace(/width="\d+" height="\d+"/, `width="${w}" height="${h}"`);
  const browser = await chromium.launch();
  const shot = async (file, w, h, dest) => {
    const page = await browser.newPage({ viewport: { width: w, height: h } });
    await page.setContent(`<body style="margin:0;background:transparent">${sized(read(file), w, h)}</body>`);
    await page.screenshot({ path: dest, omitBackground: true });
    await page.close();
  };
  for (const s of [1024, 512, 256]) await shot("rroyal-logo.svg", s, s, `${dir}/rroyal-logo-${s}.png`);
  for (const s of [512, 64, 32]) await shot("rroyal-icon.svg", s, s, `${dir}/rroyal-icon-${s}.png`);
  await shot("rroyal-wordmark.svg", 1200, 360, `${dir}/rroyal-wordmark.png`);
  const logo = read("rroyal-logo.svg"), icon = read("rroyal-icon.svg"), word = read("rroyal-wordmark.svg");
  const row = (bg, fg) => `<div style="background:${bg};display:flex;gap:30px;align-items:center;padding:20px;border-radius:14px">
      ${sized(logo, 300)} ${sized(icon, 120)}
      <div style="display:flex;flex-direction:column;gap:10px;align-items:center">${sized(logo, 64)}${sized(icon, 32)}<span style="color:${fg};font:600 14px Inter">64 / 32px</span></div>
      ${sized(word, 520, 156)}</div>`;
  const page = await browser.newPage({ viewport: { width: 1180, height: 760 } });
  await page.setContent(`<body style="margin:0;background:#1d1d22;padding:20px;display:flex;flex-direction:column;gap:20px">
    ${row("#0d1226", "#ccc")}${row("#ffffff", "#444")}</body>`);
  await page.screenshot({ path: `${dir}/preview.png`, fullPage: true });
  await browser.close();
})();
