// Screenshots label-face.html once per product, at 2x, for ladder_stills.py to lay on the bottles.
//   node label_faces.mjs <outDir>   -> <outDir>/face-gel.png, face-serum.png, face-oil.png
import { mkdirSync } from 'node:fs';
import { homedir } from 'node:os';
import { pathToFileURL } from 'node:url';

const { Browser } = await import(pathToFileURL(`${homedir()}/.claude/skills/design-taste-frontend/scripts/lib/cdp.mjs`).href);
const out = process.argv[2];
mkdirSync(out, { recursive: true });
const html = pathToFileURL(new URL('./label-face.html', import.meta.url).pathname.replace(/^\/(\w:)/, '$1')).href;
const browser = await Browser.launch({ width: 1200, height: 640 });
const page = await browser.newPage({ width: 1200, height: 640, dsf: 2 });
for (const [id, what] of [['gel', 'DEW GEL'], ['serum', 'VEIL SERUM'], ['oil', 'DROP OIL']]) {
  await page.goto(`${html}?what=${encodeURIComponent(what)}`, { settleMs: 1200 });
  await page.eval('document.fonts.ready.then(() => document.fonts.size)');
  await page.screenshot({ path: `${out}/face-${id}.png`, format: 'png' });
}
await browser.close();
