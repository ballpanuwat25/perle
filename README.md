# PERLE — Drop Oil

The landing page of PERLE, a fictional Thai skincare brand, built as a portfolio piece. A bottle of Drop Oil lies in a sea of peach oil, and a dropper lets drops fall into it. Scrolling follows one drop under the surface, where it parts into the five oils of the formula, each sized by its share.

- **3D:** the sea, bottle, dropper and oil beads are Blender (Cycles) renders. The ripples, reflections, camera moves and the dive are drawn live in WebGL2.
- **Code:** a static page with no build step: `site/index.html`, `site/main.js`, `site/shared/`. Lenis is used for smooth wheel scrolling.
- **Copy:** no treatment claims, no before/after. Ingredient roles use CosIng function names; shares are illustrative.

## Run
```
python tools/serve.py 4022 site
```
Then open http://localhost:4022. The server sends no-store headers so edited modules never mix with cached ones.

## Folders

| Folder | What's in it |
|---|---|
| `site/` | The page and the images it loads |
| `render/` | Blender scripts that make those images: the sea plates, the bottle label, the dropper sprite and the oil beads. Before the first render, run `env_bake.py` once to make `hdri/env-cards.exr` from the studio HDRI. |
| `tools/` | The dev server and `play.mjs`, a headless-Chrome step runner for screenshots and checks |
| `HANDOFF.md` | Where the project stands and how to work on it |
| `brief.md` | The full decision log |

## Credits
- **HDRI:** "Studio Small 09" by Poly Haven (CC0).
- **Fonts:** Funnel Display, Geist and Geist Mono (Google Fonts, SIL OFL).

PERLE and its products are fictional.
