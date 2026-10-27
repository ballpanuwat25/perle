# Brief — skincare portfolio piece

## The job
- **What it is:** portfolio piece for Fastwork, fictional brand. Footer credit says so.
- **Who reads it:** Thai online brands already selling on Shopee, Lazada, TikTok Shop who want a site of their own. Visitors on the demo come mostly from phones, often inside the TikTok or IG in-app browser.
- **Language:** English across the whole site (decided 2026-10-26). Brand, product names, copy and INCI all English.
- **Pages and sections:** one page. Hero, product ladder, inside the bottle, what we don't say, routine finder, where to buy, check the official shop, footer.
- **Portfolio cover:** full-page strip plus a 1200×630 share image taken from the live hero. Alternate light and dark sections.

## What is real
- **Photos:** none. Products are 3D (procedural sketches now, Blender later).
- **Numbers:** formulas add up to 100.0 %, listed in INCI order. Percentages and viscosities are illustrative and say so.
- **Not built:** shop links open a "demo link" note, never a real shop. The finder runs in the browser and stores nothing.
- **Rules:** no before/after, no treatment claims (Thai FDA advertising rules). INCI roles use CosIng function names.

## The idea
Three directions, one brand each:
- **A · STRATA** — cut the bottle open and read the formula as layers, largest share first.
- **B · RHEO** — the screen is a swatch tile; drag to feel how each texture runs, stretches or melts. Section 2 is A's cut-open bottle.
- **C · PERLE** — go too far: the page is inside one drop of oil, dived into on scroll.

### Round 2 (2026-10-26): PERLE, layout first
The user liked C but wants the layout itself to be unusual, with 3D in support. References: Dribbble "landing page skincare"; what stands out there is oversized type with images slotted in, broken editorial grids and dense collage, almost all built on model photos, which we do not have. Our image is the drop, used as a lens: a magnified copy of the real page inside a drop-shaped clip, with a small WebGL layer for rim, gloss and gold tint. Light, real text, no refraction texture.
- **C1 · Fine print** — a broadsheet: giant words locked into a 12-column grid of tiny, complete product facts. The drop hangs on a thread from the top rule and you slide it over the fine print to read it. Section 2: "Left out", the things not in the bottle, struck through by an oil line on scroll.
- **C2 · Share-sized** — a type poster where each ingredient's size is its share of the formula (Squalane huge, Vitamin E tiny); the drop follows the pointer and makes the small ones readable. Section 2: one 30 µL drop broken into microlitres.
- **C3 · Pipette** (too far) — the page is a dropper: a vertical ml scale runs the full height, type is set sideways along it, and facts hang at their graduation marks. Scroll draws oil down the scale.

### Round 3 (2026-10-26): modern type, no pointer-chasing
- The user liked the layouts but found the serif old and the pointer-following drop strange.
- **Type** is now chosen live with a toggle on C1–C3: Archivo condensed 600, Funnel Display 500, Geist Light; body Geist, numbers Geist Mono.
- **Drop behaviour** is also a toggle on C1 and C2: *Scroll reads* (the hero pins and the drop steps through a fixed reading path) or *Tap to drop* (a tap drops a new drop that lands and stays; max three). C3's drop stays at the pipette tip and no longer leans toward the pointer.

### Round 4 (2026-10-26): photos and a rendered drop on C2
- The user picked C2 and Funnel Display; the page lacked an image, and the drop needed to look real.
- **Photos** (Unsplash License, credited in the footer and `design/directions/img/CREDITS.md`), behind a `bg` toggle: amber oil droplets on dark (Pawel Czerwinski), golden oil cells (Susan Wilkinson), a dropper releasing oil on a light surface (Colin Lloyd). Each sits inside the poster, so the drop magnifies the photo too.
- **Drop** rendered in Blender (`design/render_drop.py`, `design/maps.py`): a difference matte over black and white gives a transmit map (multiply) and a glow map (plus-lighter), laid over the magnified page clone at the lens's exact silhouette.

### Round 5 (2026-10-26): C4 · Splash
- The user liked the dropper photo and asked for a whole scene instead: a white background, a round drop that wobbles as it falls, a golden pool below, and ripples on impact. Realism over interactivity.
- **Built in Blender** (`design/splash/splash.py`): white seamless sweep shaded darker toward the horizon so the ripples have light and dark to reflect; the pool is a transmissive slab of oil over a white floor (its gold comes from absorption, not base colour); two Wave modifiers make the impact rings and the rebound droplet's rings; 105 mm lens at f/2. Standard view transform, because AgX pushed the orange toward pink. 100 frames wide (1600×900) and tall (720×1280).
- **On the page** (`c4.html`): the first view is a still of the drop hanging mid-air (an `<img>`, so it is the LCP and the buy button works at once); the canvas takes over once frames load, trembling the drop between neighbouring frames while idle. Scroll pins the hero and plays the fall, the impact and the rings; each oil name appears as a ring passes. Phones get every other frame at 540 px.

### Round 6 (2026-10-26): C5 · Pool, live
- The user wanted C2's share-sized type over C4's white-and-gold scene, yellow like the dropper photo, a high camera (about 45°), one drop falling on arrival, more drops on tap, and scroll that opens the oil to show what is in it; plain white, no grey band.
- Taps at any point rule out a pre-rendered sequence, so the pool is drawn live (`shared/oil-pool.js`): a GPU wave-equation height field, a ray-traced surface that reflects a white studio and refracts down to a white table, gold from absorption along that path, caustics from the field's curvature, and drops as glass ellipsoids that wobble, refract, cast soft shadows and rebound. 144 fps on the desktop GPU.
- Scroll raises the camera toward top-down and splits the pool into rings whose areas are each oil's share; the cascade names fly to their rings.
- The C4 Blender render finished its wide set (100 frames); its tall set stopped at 6 frames when the earlier session ended. C4 stays as it is.

### Round 7 (2026-10-26): C6 · Oil sea
- The user wanted a sea of oil to the horizon instead of a round pool, two camera angles (eye level, and 15° down), and more realistic colour; they asked whether to use Gemini for the background.
- Chosen split: Blender renders the still plate (`design/splash/plate.py`: transmissive oil slab to the horizon over a white floor, white sky, no grey band) and exports its camera; Blender renders a round bead drop (`drop_round.py`, `maps_round.py`) as transmit + glow maps; code ripples the plate (`shared/oil-sea.js`): a wave field on a patch of the water, refraction offsets, Fresnel on the crests, caustics, drop shadow and reflection. Gemini was not used because the code needs the exact camera to place ripples in perspective.
- The 15° view needs a 30 mm lens to keep the horizon in frame. Plates are 18–26 KB each as WebP; the page needs no frame sequence.

### Round 8 (2026-10-26): C6 realism pass
- The user felt C6 still wasn't real and suspected contrast. Diagnosis: nothing dark to reflect, ripples sharp over a blurred plate, too-clean finish.
- Studio Small 09 HDRI (Poly Haven, CC0, Sergej Majboroda) with three black flags painted in just above eye level (`design/splash/env_bake.py`); the same image lights Blender and feeds the page's reflections (`img/env-cards.jpg`, 60 KB).
- Blender now renders only the oil's body (camera rays hit a pure Refraction BSDF, so no surface reflection is baked); the page adds every reflection with the oil's Fresnel in linear light, so reflections move with the swell. Plates are 11–16 KB.
- The page adds a swell rolling toward the camera (six waves, slowed for oil), oil-like ripples (slower, with viscosity), focus blur by distance from the focal plane, and a film finish (S-curve, vignette, grain). At eye level the reflection is halved, or the grazing mirror washes the gold out.

## The moment
- **A hero:** drag down the bottle to cut it; the halves part and the layers show. Touch: scroll cuts. Idle: the blade nicks the cap as a hint.
- **B hero:** drag across the tile to swatch; four lids pick the texture. Idle: one gel-cream stroke draws itself.
- **C hero:** pointer sways the hanging drop and the headline bends through it. Idle: the drop swells at the dropper tip.
- **Scroll:** A and B section 2 pin and scrub the layers apart beside the INCI list (GSAP ScrollTrigger). C pins and scrubs a dive into the drop.
- **Layout break:** the INCI column in A/B runs as one long typeset list beside the stack; C has no grid at all.

### Round 9 (2026-10-26): bottle scene polish
- Dropper fixed top-right, held a set distance from the screen edge; the glass header's Where to buy sits over its bulb. Taps release a drop from it (slowed fall).
- Bottle: 30 ml Boston round (domed shoulder, threaded neck, lip), yellow-brown amber, larger and higher in frame; phone plate places it further back so it fits whole.
- Header is now a frosted glass bar. Flat-ring label stacking for the low macro view.
- Bottle moved left/down into the user's marked area (wide plate x ≈ 9–40%), scale 1.28. Label redrawn in the site fonts (Funnel Display + Geist Mono) at the cylinder's true 3:1 proportions: `splash/label.html` screenshot, turned 90°, saved as `label.png`.

### Round 10 (2026-10-26): grounding and the dropper
- Bottle reflection: plate.py renders a mirror pass of the bottle plus where it falls (`-refl.png`, RGBA, half size); the shader mixes it into the oil's reflection with Fresnel, bent by the ripples.
- Sky: rises out of the far haze in the oil's colour, paler higher up (shader `skyAt`), no white sky or hard horizon. Applies to all views.
- Plate focus on the label face (0.912 m wide, 1.065 m tall) at f/4.
- Dropper: ivory ribbed collar + round bulb, lit with the sea plate's HDRI and top light; glass wall modelled as one closed outline with a gentle taper and rounded tip; plug under the collar.
- Drops: 1.9 mm radius; a bead grows at the tip and hangs until a tap; rebound limited to ~2.5 drop radii.
- Follow-up: the bead forms only on a tap and falls once full (nothing left hanging). The pipette ends in a rounded, slightly flared oil-filled knob. The sky is white again and fades smoothly from light peach at the horizon to white within a short band.

### Round 11 (2026-10-27): the dive
- Dropper pinned to the screen's top-right corner on every size (collar against the right edge, level with the header), solved per screen in `placeDropper`.
- Bottle: wide plate a touch further left; tall plate (phones and portrait tablets) puts it lower, nearer the camera, under the type.
- Hero is sticky; the new `#dive` section rises over it, its top edge drawn as the underside of the surface (`shared/under-oil.js`). Below: peach-to-amber oil, light shafts, caustics, motes, and the five oils as beads (Blender, `drop_round.py` under-oil lighting, IOR 1.12; atlas via `maps_oils.py`), radius ~ sqrt(share). Scroll walks focus bead by bead with a leader line and tag (name, share, source, CosIng role); tags pick the clearest of six placements. Closes on "Five oils. That's the whole drop."
- The ring-parting scroll step in the hero is removed; the dive tells the ingredients instead.
- Dive, take two: the stage lies over the hero from the start (margin -100svh, taps pass through) so the surface line's pace is eased (slow, then a plunge). Scroll opens with a drop from the dropper; underwater the same drop falls in under the tip with bubbles, swells to the area of all five oils, and parts into them. The hero leans in as we sink (sea scales up 12%, type fades from a quarter of the way). Acts: rise 0-16%, fall 5-30%, split 28-40%, walk 42-90%.
- Dive, take three (continuity): the first 7% of scroll scrubs one drop's fall from the dropper (oil-sea `remove`, a hanging bead whose top the page moves), the camera following it (canvas translate+scale, clamped so the sea always fills the frame) to the middle of the screen. It lands and ripples; the surface sweeps up (7-15%) and the dive picks the drop up at the same screen point (`impact` → `shot`), then it sinks, swells and parts as before.
- Fixes: DROP act starts at 1.2% so the px a smooth scroll leaves at the top don't hang a bead at the tip; taps don't add a bead while the scroll's drop exists; no extra zoom after landing; the dive reads the landing spot every frame (a jump-scroll could latch a stale one) and starts sinking only after the surface has passed it. Dive section shortened to 480vh; acts DROP 1.2-8.5, RISE 8.5-15, FALL 12.5-25, SPLIT 23-32, WALK 34-90.
- Idle drip: at the top of the page the dropper lets a drop go every 3-5 s; a tap pauses it 10 s, scrolling pauses it until back at the top and still for 5 s; none with reduced motion.
- Dive refinements: the camera glides and zooms to each oil (bead held at ~16% of the screen, up to 3.2x, so vitamin E reads); beads breathe out of round; squalane re-rendered pale gold with a softer sheen; tags drop the halo, add the INCI name; at the end the five gather back into the drop, with "Where to buy" leading to a new #buy section (Shopee / Lazada / TikTok Shop official stores, with a check-the-name note). Reduced motion: the dive is one still after the sea, all five beads in place and the tags as a list. Acts: WALK 34-84, MERGE 85-93.
- Dive polish: atlas cells 512 px (beads stay sharp when the camera closes in); framing target ~27% of the short side (26% on phones), zoom up to 3.6x; out-of-focus beads softer-blurred (0.7 + 3·Δz); a tag appears only once the camera has come to rest on its bead.
- Dive walk now scrubbed by scroll: each oil's stretch = camera move (35%) → tag draws in (15%) → hold → tag fades (last 12%); no time-based waits, so a fast scroll still passes the tags. Near-camera filler beads removed (they competed with the focus). Leader dot sits r·1.1 + 8 px off the rim. Checked at 1920, 1440, 768 and 390 wide.
- Scroll feel: Lenis on c6 softened (lerp 0.07, wheel ×0.85; `initScroll` now takes options and returns the instance). Resting the wheel inside the walk settles on the nearest oil's hold point (tag fully drawn) over 0.7 s. Touch keeps native scrolling.
- Settle is now directional: resting the wheel among the oils carries on to the next oil in the scroll direction (previous when scrolling up), 0.9 s, so no tag is left half drawn.
- Wheel among the oils now steps like slides with no stop-start: the first wheel event of a gesture moves Lenis's target to the next oil (scrollTo with lerp 0.075, continuing the glide); the rest of the gesture (gap < 220 ms, trackpad coasting) holds it. Outside the walk the wheel scrolls normally.

### Decided before the move to Next.js (2026-10-27)
- No more 3D: the hero and the dive carry it; the rest is layout and Blender stills.
- Range renamed for PERLE, ordered thin to rich: **Perle Dew Gel** (฿590) → **Perle Veil Serum** (฿690) → **Perle Drop Oil** (฿1,190). (Old sketches A/B keep their own copy.)
- Remaining sections: product ladder (three stills, thin → rich), what we don't say (claims struck through by an oil line), routine finder (3 questions about how skin feels, not conditions; nothing stored), where to buy + check a shop link, footer (fictional-brand credit, site by, contact).
- Intro: blurred hero still + PERLE centred + a hairline loader; once the still and fonts are in, PERLE rises into the header, the blur clears, the type cascades in; WebGL swaps in when ready and the first drop falls. Capped at 2.5 s; plays on every load (not with reduced motion).
- 404: "This drop missed." on a calm still sea, links home and to where to buy. Favicon: an amber bead with a highlight (SVG, dark-tab variant).
- Built in the sketch: the still is now a poster captured from the live render (`?poster=1` mode: bare sea, no type/dropper/drops, no horizon shift; `poster-macrob-{wide,tall}-rose.webp`, ~30-40 KB) and crossfades into the live sea. The intro runs as decided (classes set in `<head>` before first paint; min 0.7 s, max 2.5 s; every load).
- Load without a jump: the still now gets the live sea's horizon shift up front (`placeStill` computes it from the camera JSON with the renderer's sums, and the still stays hidden until placed); the intro only blurs (no zoom) and the dropper starts in place. Bottle height through the load now varies ~3-7 px (blur in the measure) instead of jumping 46-88 px.
- Intro mark lands on the logo exactly: the flight is measured on the glyph boxes (Range rects), not element boxes whose line heights differ; it ends at the logo's x, y and width to the pixel before the swap.
- Responsive framing: the plate now also pans sideways (`shiftX` in oil-sea, `framing()` in c6 from each plate's bottle box) to keep the bottle and label clear of the side edges on screens narrower than 16:9, and the downward horizon shift is capped to keep the bottle above the price bar (never exposing the plate's edge). The still uses object-position + translateY to match (within 0-4 px). Checked 2560×1080 down to 360×780: the bottle and label are in frame everywhere; on short phones (375×667, 360×780) the price bar and the tap hint sit over the label, to fix in the Next.js bottom layout.
