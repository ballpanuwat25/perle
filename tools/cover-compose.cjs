// Usage: node tools/cover-compose.cjs <shotsDir> portfolio [strip|devices|dive|phones]
// (the strip expects desk-finder-crop.png: desk-finder.png cut where the dark Where to buy starts)
// Lays the captured shots out as portfolio covers (HTML rendered to JPG)
const { chromium } = require('playwright');
const fs = require('fs');
const [,, dir, out] = process.argv;
const img = (n) => `file://${dir}/${n}.png`;
const base = `*{box-sizing:border-box;margin:0} body{margin:0} img{display:block;width:100%}`;
const pages = {
  // a long page: the story top to bottom, as one strip
  strip: { w: 1440, html: `<style>${base} body{background:#efe9df;padding:56px} .card{border-radius:28px;overflow:hidden;box-shadow:0 30px 80px rgb(60 40 20/.18)}</style>
    <div class="card">${['desk-hero', 'desk-tag', 'desk-merge', 'desk-claims', 'desk-said', 'desk-finder-crop', 'desk-buy'].map((n) => `<img src="${img(n)}">`).join('')}</div>` },
  // desktop and phone together
  devices: { w: 1920, h: 1200, html: `<style>${base} body{width:1920px;height:1200px;background:radial-gradient(120% 90% at 30% 20%,#f6efe4,#e6d5bd);position:relative;overflow:hidden}
    .desk{position:absolute;left:80px;top:150px;width:1300px;border-radius:18px;overflow:hidden;box-shadow:0 40px 100px rgb(60 40 20/.28);background:#fff}
    .desk .chrome{height:40px;background:#f3eee6;display:flex;align-items:center;gap:8px;padding:0 16px} .desk .chrome i{width:12px;height:12px;border-radius:50%;background:#d9cfc0}
    .phone{position:absolute;right:96px;top:110px;width:420px;padding:14px;border-radius:64px;background:#16100a;box-shadow:0 50px 110px rgb(30 20 10/.45)}
    .phone img{border-radius:52px}</style>
    <div class="desk"><div class="chrome"><i></i><i></i><i></i></div><img src="${img('desk-hero')}"></div>
    <div class="phone"><img src="${img('phone-hero')}"></div>` },
  // the dive, four moments
  dive: { w: 1920, h: 1200, html: `<style>${base} body{width:1920px;height:1200px;background:#16100a;padding:48px;display:grid;grid-template-columns:1fr 1fr;gap:24px}
    img{height:100%;object-fit:cover;border-radius:16px}</style>
    ${['desk-drop', 'desk-split', 'desk-tag2', 'desk-merge'].map((n) => `<img src="${img(n)}">`).join('')}` },
  // the phone screens side by side
  phones: { w: 1920, h: 1200, html: `<style>${base} body{width:1920px;height:1200px;background:#efe9df;display:flex;align-items:center;justify-content:center;gap:28px}
    .phone{width:340px;padding:11px;border-radius:52px;background:#3a2c1e;box-shadow:0 36px 80px rgb(30 20 10/.3),inset 0 0 0 1px rgb(255 255 255/.12)} .phone img{border-radius:42px;outline:1px solid rgb(255 255 255/.1);outline-offset:-1px}
    .phone:nth-child(even){translate:0 60px}</style>
    ${['phone-hero', 'phone-tag', 'phone-claims', 'phone-finder', 'phone-buy'].map((n) => `<div class="phone"><img src="${img(n)}"></div>`).join('')}` },
};
(async () => {
  const b = await chromium.launch();
  for (const [name, { w, h, html }] of Object.entries(pages)) {
    if (process.argv[4] && !process.argv.slice(4).includes(name)) continue;
    const p = await b.newPage({ viewport: { width: w, height: h ?? 1000 }, deviceScaleFactor: 1 });
    fs.writeFileSync(`${dir}/_${name}.html`, `<!doctype html><meta charset=utf-8>${html}`);
    await p.goto(`file://${dir}/_${name}.html`); await p.waitForTimeout(500);
    await p.screenshot({ path: `${out}/perle-${name}.jpg`, quality: 90, fullPage: !h });
    console.log('made', name); await p.close();
  }
  await b.close();
})();
