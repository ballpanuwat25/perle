// Usage: (cd web && npm run build && npx next start -p 4030), then
//   node tools/cover-capture.cjs <shotsDir> desk|phone|og   (ONLY=hero,merge to retake some)
// Needs Playwright (preinstalled in cloud sessions). WebGL in software is slow: allow ~1 h.
// Captures the moments for the portfolio covers from the live site (WebGL in software: slow, so long waits)
const { chromium } = require('playwright');
const [,, out, which] = process.argv;
const shoot = async (b, { w, h, dpr, mobile }, plan) => {
  const p = await b.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: dpr, isMobile: mobile, hasTouch: mobile });
  p.setDefaultTimeout(300000);
  await p.goto('http://localhost:4030/');
  await p.waitForFunction(() => !document.documentElement.classList.contains('loading'), null, { timeout: 120000 });
  await p.waitForTimeout(6000);
  const dive = async (f, ms) => { await p.evaluate((f) => { const d = document.querySelector('#dive'); scrollTo(0, d.offsetTop + (d.offsetHeight - innerHeight) * f); }, f); await p.waitForTimeout(ms); };
  const to = async (sel, extra = 0, ms = 1500) => { await p.evaluate(([q, e]) => scrollTo(0, document.querySelector(q).getBoundingClientRect().top + scrollY + e), [sel, extra]); await p.waitForTimeout(ms); };
  for (const [name, act] of plan) { await act({ p, dive, to }); await p.screenshot({ path: `${out}/${which}-${name}.png` }); console.log('shot', which, name); }
  await p.close();
};
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const desk = [
    ['hero', async () => {}],
    ['drop', async ({ dive }) => dive(0.07, 9000)],
    ['split', async ({ dive }) => dive(0.3, 12000)],
    ['tag', async ({ dive }) => dive(0.402, 12000)],
    ['tag2', async ({ dive }) => dive(0.502, 12000)],
    ['merge', async ({ dive }) => dive(0.975, 14000)],
    ['claims', async ({ p, to }) => { await to('#claims'); const c = await p.evaluate(() => { const e = document.querySelector('#claims'); return e.offsetTop + (e.offsetHeight - innerHeight) * 0.45; }); await p.evaluate((y) => scrollTo(0, y), c); await p.waitForTimeout(1500); }],
    ['said', async ({ p }) => { const c = await p.evaluate(() => { const e = document.querySelector('#claims'); return e.offsetTop + (e.offsetHeight - innerHeight) * 0.95; }); await p.evaluate((y) => scrollTo(0, y), c); await p.waitForTimeout(1500); }],
    ['finder', async ({ p, to }) => { await to('#finder', -60); for (const t of ['Tight', 'A little slip', 'Two']) { await p.getByRole('button', { name: t, exact: true }).click(); await p.waitForTimeout(700); } }],
    ['buy', async ({ p, to }) => { await to('#buy'); await p.getByRole('button', { name: 'shopee.co.th/perle.offical' }).click(); await p.waitForTimeout(800); }],
    ['footer', async ({ p }) => { await p.evaluate(() => scrollTo(0, document.body.scrollHeight)); await p.waitForTimeout(1200); }],
  ];
  const only = process.env.ONLY?.split(','); const pick = (l) => (only ? l.filter(([n]) => only.includes(n)) : l);
  if (which === 'desk') await shoot(b, { w: 1440, h: 900, dpr: 2 }, pick(desk));
  if (which === 'phone') await shoot(b, { w: 390, h: 844, dpr: 3, mobile: true }, pick(desk).filter(([n]) => ['hero', 'tag', 'merge', 'claims', 'finder', 'buy'].includes(n)));
  if (which === 'og') await shoot(b, { w: 1200, h: 630, dpr: 2 }, [['hero', async () => {}]]);
  await b.close();
})();
