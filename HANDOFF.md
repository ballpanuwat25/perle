# PERLE — handoff for the next session

Read this first, then `brief.md` (the full decision log, round by round). Reply to the user in **Thai**; all site copy is **English**.

## What this is
A portfolio piece for Fastwork: the landing page of **PERLE**, a fictional Thai skincare brand selling on Shopee, Lazada and TikTok Shop. The audience is Thai online brands who'd hire a developer for a site of their own; visitors mostly arrive on phones, often inside the TikTok or IG in-app browser.

- **Rules:** no before/after, no treatment claims (Thai FDA). Ingredient roles use CosIng function names only. Shop links are demo-only. Nothing the visitor enters is stored.
- **Range, thin to rich:** Perle Dew Gel ฿590 → Perle Veil Serum ฿690 → **Perle Drop Oil ฿1,190** (the hero product, 30 ml). Formulas live in `site/shared/formulas.js`; each adds to 100.0% in INCI order and is labelled illustrative.

## Where it stands
The direction is chosen and the hero and dive are built as a **static page** in `site/` (`index.html`, `main.js`, `shared/`). It is locked to the chosen look: Funnel Display, the macro + bottle scene, rose-gold oil. The repo is https://github.com/ballpanuwat25/perle.

`design/` is the local-only archive and is not in git: the exploration sketches a–c6 (c6 with its review toggles), the render caches and outputs, and the original copies of the scripts. Work in `site/`, `render/` and `tools/`.

**Moved to Next.js (2026-10-27).** The app is in `web/` (Next 16.4, App Router, TypeScript, plain CSS). The hero and the dive are carried over unchanged: the scene modules sit in `web/src/lib/` (`site/main.js` became `hero.js`, wrapped in `startHero()`), the markup is React components (`web/src/components/`), the styles are `web/src/app/globals.css`, fonts come from `next/font`, Lenis from npm, images from `web/public/img/`. Screenshots at 1920×950 and 390×844 match the static page frame for frame. `site/` stays as the reference until the user signs the port off; then delete it. **Next:** build the remaining sections in React, and redo the type layout and the bottom bar.
Note: Next 16 has breaking changes; read `web/node_modules/next/dist/docs/` before using an API (see `web/AGENTS.md`).

### Built and approved (keep the behaviour when porting)
1. **Intro.** The hero still is shown blurred, with `PERLE` centred over a hairline loader. Once the still and the fonts are in (min 0.7 s, max 2.5 s), the mark flies into the header logo. The flight is measured on the glyph boxes, so it lands exactly. The blur clears and the type cascades in. It plays on every load, but not with reduced motion. The classes are set in `<head>` before first paint.
2. **Hero, "oil sea".**
   - The scene is a Blender plate (macro camera, rose-gold/peach oil) with live WebGL ripples, swell, Fresnel reflections and bottle reflection on top (`site/shared/oil-sea.js`).
   - **Bottle:** the PERLE Boston-round amber bottle (label in Funnel Display + Geist Mono) lies half-sunk at the bottom left, with its reflection rippling in the oil.
   - **Dropper:** an ivory ribbed collar with a bulb, pinned to the top-right corner on every screen size (`placeDropper`). It drips by itself every 3–5 s, counted from the last drop's fall. A tap pauses that for 10 s; scrolling pauses it until the page is back at the top and still for 5 s.
   - **Sky:** white, with a thin soft horizon and a pale band in the middle of the oil.
   - **Type:** a cascade sized by share (Squalane 52% … Vitamin E 0.5%).
   - **Framing:** the plate pans and shifts per screen (`framing()`), so the bottle and label stay in frame from 2560 down to 360 px wide. The loading still is a poster captured from the live render (`?poster=1`) and is framed the same way, so nothing jumps.
3. **Dive** (`site/shared/under-oil.js`). This section overlays the hero (margin −100svh) and is scroll-driven, with acts as fractions of the section's scroll:
   - **Fall** (1.2–8.5%): a drop falls from the dropper, scrubbed by the scroll, while the camera follows it in. The zoom is drawn in the shader so it stays sharp.
   - **Plunge** (8.5–15%): the drop lands and ripples, then the surface sweeps up.
   - **Below the surface:** the same drop is picked up at the same screen spot, trailing bubbles, and swells.
   - **Split** (23–32%): the drop parts into five oil beads. These are Blender renders in an atlas (`img/oils-*.png`, 512 px cells), sized by their share.
   - **Walk** (34–84%): the camera glides and zooms to each oil, then a leader line and tag draw in. A tag holds the share, the name, the INCI name, the source and the CosIng role. Tags pick the clearest of 18 placements.
   - **Merge** (85–93%): the five gather back into one drop, under "Five oils. That's the whole drop." with a **Where to buy** button.
   - **Mouse and trackpad:** smooth scroll via Lenis (lerp 0.07). Among the oils the wheel steps one oil per gesture as a single continuous glide. Touch keeps native scrolling.
   - **Reduced motion:** a still frame with the five oils listed.
4. **Where to buy** (`#buy`): a first draft listing the three official stores.

### Still to build (wireframed and agreed)
- **Product ladder:** three Blender stills, thin to rich, each with its step, texture and price.
- **What we don't say:** claims ("Whitening", "Anti-acne"…) struck through by an oil line on scroll, then "We say what's in it."
- **Routine finder:** three questions about how skin *feels*, not conditions, giving 1–3 products and links to buy. Nothing is stored.
- **Where to buy + check a shop:** paste a shop link and see "official / not us".
- **Footer:** "PERLE is fictional", a site-by credit, contact.
- **404:** "This drop missed." on a still calm sea. **Favicon:** an amber bead (SVG, dark-tab variant).
- ~~Bottom bar on short phones~~ done 2026-10-27: on phones the bar is one compact row (name over price, button right) at the bottom, the hint one line above it; the label is clear at 375×667, 360×780, 390×844. Type: % sits right against the word; Moringa and Vitamin E have a readable floor (20/15 px desktop, 16/13 px phone), so they are no longer strictly to scale (the % still gives the share).
- **Type layout** is to be redone in Next.js (the user said so).
- **Testing:** not yet on a real phone, especially two WebGL canvases at once in the TikTok/IG in-app browsers.

## User preferences learned
- They judge by eye and send screenshots with red circles. Answer with your own screenshots at their screen size (often **1881×940 / 1920×950**) and on phone.
- They want honest critique and a recommendation, not a menu.
- **Liked:** the peach / rose-gold tone, Funnel Display, motion that feels physical and continuous, everything sharp. **Disliked:** CG-looking spheres, haze bands, anything that jumps, pops or "feels like a bug", text appearing faded or before the camera stops.
- Ask before big creative forks (they answer quickly). Small fixes: just do them and show proof.

## Portfolio covers
`portfolio/` holds the covers, captured from the live site (2x) and laid out: `perle-hero.jpg` (2880×1800), `perle-strip.jpg` (the page top to bottom, 1440 wide), `perle-devices.jpg`, `perle-dive.jpg`, `perle-phones.jpg` (1920×1200). The link-share image is `web/src/app/opengraph-image.jpg`. Remake with `tools/cover-capture.cjs` + `tools/cover-compose.cjs`. Thin to rich and the footer are left out until the stills are rendered and site-by/contact are filled in.

## Running it
- **Next app:** `cd web && npm install && npm run dev` (port 3000), or `npm run build && npm start`. `?poster=1` works as before.
- **Static preview:** `python tools/serve.py 4022 site` (it sends no-store headers, so edited ES modules never mix with cached ones). In the app this is the launch config `perle-site` in `D:/.claude/launch.json`. The archived sketches are served by `skincare-directions` on port 4021.
- **Headless checks:** `node tools/play.mjs <url> <outDir> <w> <h> '<steps json>'`.
  - Steps: `wait`, `click`, `drag`, `wheel:[dy,n]`, `scrollTo`, `js`, `log` (prints an eval result), `shot`.
  - Env vars: `SETTLE=0` shoots during load; `REDUCE=1` emulates reduced motion.
  - It uses `~/.claude/skills/design-taste-frontend/scripts/lib/cdp.mjs`.
  - Use headless rather than the app's browser pane: a hidden pane pauses `requestAnimationFrame`.
- **Blender 5.2:** `D:\blender.exe -b --factory-startup -P <script> -- <args>`. It renders on CPU only. **Always pass absolute output paths**; relative ones resolve against `C:\`. Render times: a plate is ~5 min at 128 samples, a bead or the dropper ~1–3 min.

## Render pipeline (`render/`)
Before the first render, run `env_bake.py hdri/studio_small_09_2k.hdr hdri` once to make the carded HDRI the other scripts read. Write render outputs into folders under `render/` (they are git-ignored), then publish them into `site/img`.


| Script | What it makes |
|---|---|
| `plate.py <out> macrob <wide\|tall> 128 100 rose` | Sea + bottle plate, mask, bottle reflection pass and reflection mask, camera JSON. The bottle's place, scale and focus are set per shape near the `bottle.location` line. |
| `plates_to_site.py <dir> ../site/img/sea` | WebP plates, masks, reflection PNG (half size, alpha = where it falls) |
| `dropper.py <out> 128 rose` → `maps_dropper.py <out> ../site/img` | Dropper sprite (transmit/glow maps + tip JSON) |
| `drop_round.py <out> 96 <squalane\|ricebran\|camellia\|moringa\|vite>` → `maps_oils.py <out> ../site/img` | The five underwater beads and their atlas |
| `label.html` | The bottle label, drawn in the site fonts; screenshot it, turn it 90°, save as `label.png` |
| `env_bake.py` | The studio HDRI with black cards painted in, shared by Blender and the shader |

**Poster stills:** `http://localhost:4022/?poster=1`, shot at 1920×1080 and 1080×1920, saved as `site/img/sea/poster-macrob-{wide,tall}-rose.webp`. Re-shoot these after any plate or shader change.

## Reference screenshots
`design/reference/` (local only) has the last approved states:
- `s-sheet.jpg`: the drop fall and plunge
- `w-sheet.jpg`: walk, merge and buy
- `dot-s1920.jpg` and `dot-s390.jpg`: tags at every stop
- `intro2-sheet.jpg`: the intro
- `resp2-bottles.jpg`: framing on 13 screen sizes
- `k-rb.jpg`: bead sharpness
- `rm2-1440-00-dive.jpg`: the reduced-motion still

## Outside the project folder
- `D:/.claude/launch.json` holds the preview configs.
- `~/.claude/skills/design-taste-frontend/scripts/lib/cdp.mjs` is what `play.mjs` uses.
- `D:lender.exe` is Blender.

## Gotchas
- After any shader or plate change, check that the still and the live sea still line up (`framing()` / `horizonOf()` in `site/main.js` mirror the renderer's sums).
- The dive reads the landing spot (`shot`) every frame. A fast scroll can jump past the moment the drop lands, so don't latch it.
- Lenis can leave a few px of scroll at the top, so the dive's first act starts at 1.2%.
- `history.scrollRestoration = 'manual'`: the page always starts at the top.
- Windows: `tasklist | grep` can hang in Bash; use PowerShell `Get-Process`.
