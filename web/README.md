# PERLE — Next.js app

The site, moved from the static page in `../site/` (kept as the reference until the port is signed off).

```
npm install
npm run dev        # http://localhost:3000
npm run build && npm start
```

| Where | What |
|---|---|
| `src/app/` | `layout.tsx` (fonts via `next/font`, the intro's pre-paint script), `page.tsx`, `globals.css`, `icon.svg` |
| `src/components/` | `Hero`, `Dive`, `Buy`, `Footer` render the markup; `Scene` starts the WebGL scene in the browser |
| `src/lib/` | The scene, carried over unchanged: `hero.js` (was `site/main.js`), `oil-sea.js`, `under-oil.js`, `scroll.js` (Lenis from npm), `formulas.js` |
| `public/img/` | The plates, posters, sprites and atlases (from `site/img/`) |

`?poster=1` still renders the bare sea for capturing the loading stills.
