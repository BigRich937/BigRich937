const { chromium } = require(require("child_process").execSync("npm root -g").toString().trim() + "/playwright");
const fs = require("fs");
(async () => {
  const dir = process.argv[2];
  const meta = JSON.parse(fs.readFileSync(`${dir}/meta.json`, "utf8"));
  const sized = (svg, s) => svg.replace(/width="\d+" height="\d+"/, `width="${s}" height="${s}"`);
  const cells = meta.map((m, i) => `<div style="background:#0d1226;border-radius:16px;padding:8px 8px 14px;text-align:center">
      ${sized(fs.readFileSync(`${dir}/rrx-${m.id}.svg`, "utf8"), 520)}
      <div style="font:700 20px Inter;color:#f2c14e">${i + 1}. ${m.name}</div>
      <div style="font:500 14px Inter;color:#9aa3c7;margin-top:2px">${m.vibe}</div></div>`).join("");
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1160, height: 300 } });
  await page.setContent(`<body style="margin:0;background:#1b1b20;padding:20px;display:grid;grid-template-columns:repeat(2,1fr);gap:18px">${cells}</body>`);
  await page.screenshot({ path: `${dir}/rrx-font-options.png`, fullPage: true });
  for (const m of meta) {
    const p = await browser.newPage({ viewport: { width: 512, height: 512 } });
    await p.setContent(`<body style="margin:0;background:transparent">${fs.readFileSync(`${dir}/rrx-${m.id}.svg`, "utf8")}</body>`);
    await p.screenshot({ path: `${dir}/rrx-${m.id}.png`, omitBackground: true });
    await p.close();
  }
  await browser.close();
})();
