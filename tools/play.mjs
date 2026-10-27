// Drives a sketch page in headless Chrome: runs a list of steps (drag, click, wait, scroll, shot).
//   node play.mjs <url> <outDir> <width> <height> <stepsJson>
import { mkdirSync } from 'node:fs';
import { homedir } from 'node:os';
import { pathToFileURL } from 'node:url';

const { Browser, sleep } = await import(pathToFileURL(`${homedir()}/.claude/skills/design-taste-frontend/scripts/lib/cdp.mjs`).href);
const [url, outDir, w, h, stepsJson] = process.argv.slice(2);
const steps = JSON.parse(stepsJson);
mkdirSync(outDir, { recursive: true });
const W = +w, H = +h, mobile = W < 700;
const browser = await Browser.launch({ width: W, height: H, extraArgs: ['--use-angle=d3d11', '--enable-gpu', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ width: W, height: H, mobile });
await page.send('Page.bringToFront');
await page.send('Emulation.setFocusEmulationEnabled', { enabled: true });
if (process.env.REDUCE) await page.send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
await page.goto(url, { settleMs: +(process.env.SETTLE ?? 2500) });
const mouse = (type, x, y) => page.send('Input.dispatchMouseEvent', { type, x, y, button: 'left', buttons: type === 'mouseReleased' ? 0 : 1, clickCount: 1, pointerType: 'mouse' });
let n = 0;
for (const s of steps) {
  if (s.wait) await sleep(s.wait);
  if (s.click) { await mouse('mousePressed', ...s.click); await mouse('mouseReleased', ...s.click); }
  if (s.drag) {
    const [x0, y0, x1, y1, ms = 600, hold = 0] = s.drag;
    await mouse('mousePressed', x0, y0);
    const k = 30;
    for (let i = 1; i <= k; i++) { await mouse('mouseMoved', x0 + (x1 - x0) * i / k, y0 + (y1 - y0) * i / k); await sleep(ms / k); }
    if (hold) { const t = Date.now(); while (Date.now() - t < hold) { await mouse('mouseMoved', x1, y1); await sleep(30); } }
    await mouse('mouseReleased', x1, y1);
  }
  if (s.wheel) {
    const [dy, n = 10, x = 700, y = 500] = s.wheel;
    for (let i = 0; i < n; i++) { await page.send('Input.dispatchMouseEvent', { type: 'mouseWheel', x, y, deltaX: 0, deltaY: dy }); await sleep(40); }
  }
  if (s.scrollTo !== undefined) { await page.eval(`scrollTo(0, ${s.scrollTo})`); }
  if (s.js) await page.eval(s.js);
  if (s.log) console.log(JSON.stringify(await page.eval(s.log)));
  if (s.shot) { await page.screenshot({ path: `${outDir}/${W}-${String(n++).padStart(2, '0')}-${s.shot}.jpg` }); }
}
console.log(`errors ${JSON.stringify(page.consoleErrors)}`);
await browser.close();
