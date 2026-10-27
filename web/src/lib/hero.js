import { createOilSea } from './oil-sea.js';
import { initScroll } from './scroll.js';
import { DROP_OIL } from './formulas.js';
import { mountDive, ACTS, span } from './under-oil.js';

// The hero and the dive, carried over from the static page as they were: everything below runs
// once in the browser, over the markup that <Hero> and <Dive> render.
export function startHero() {
  // the page is a scroll story: a reload starts it from the top, above the surface
  history.scrollRestoration = 'manual';
  scrollTo(0, 0);
  // a long, soft glide: the dive is a story told by the scroll
  const lenis = initScroll({ lerp: 0.07, wheelMultiplier: 0.85 });

  const hero = document.querySelector('#hero');
  const canvas = hero.querySelector('canvas');
  const still = hero.querySelector('.still');
  const hint = hero.querySelector('.hint');
  const type = [...hero.querySelectorAll('.say, .oil')];
  // ?poster renders the bare sea (no type, dropper or drops, no horizon shift) to be captured as
  // the still that shows while the page loads, so the still and the live sea are the same picture
  const POSTER = new URLSearchParams(location.search).has('poster');
  if (POSTER) document.documentElement.classList.add('poster');

  // The intro (every load, never with reduced motion): hold the blurred sea and the mark until
  // the still and the fonts are in (at least 0.7 s, at most 2.5 s), then fly the mark into the header.
  {
    const root = document.documentElement, intro = document.querySelector('.intro');
    // (whether to play it was decided in the page's head, before the first paint)
    if (!root.classList.contains('loading')) intro.remove();
    else {
      const fill = intro.querySelector('b'), mark = intro.querySelector('.intro-mark');
      requestAnimationFrame(() => requestAnimationFrame(() => { fill.style.transform = 'scaleX(0.75)'; }));
      const still = document.querySelector('.pool .still');
      const ready = Promise.all([still.decode().catch(() => {}), document.fonts?.ready]);
      const wait = (ms) => new Promise((r) => setTimeout(r, ms));
      Promise.all([Promise.race([ready, wait(2500)]), wait(700)]).then(async () => {
        fill.style.transition = 'transform 0.25s ease-out'; fill.style.transform = 'scaleX(1)';
        await wait(260);
        intro.querySelector('.intro-line').style.opacity = 0;
        // fly the letters onto the header's letters: measured on the glyphs themselves (not the
        // boxes, whose line heights differ), so the mark lands at exactly the logo's size and place
        const glyphs = (el) => { const r = document.createRange(); r.selectNodeContents(el); return r.getBoundingClientRect(); };
        const to = glyphs(document.querySelector('.bar .name')), from = glyphs(mark), box = mark.getBoundingClientRect();
        const k = to.width / from.width;
        mark.style.transform = `translate(${to.left - box.left - k * (from.left - box.left)}px, ${to.top - box.top - k * (from.top - box.top)}px) scale(${k})`;
        root.classList.remove('loading');
        document.querySelectorAll('.say, .oil').forEach((el, i) => { el.style.transitionDelay = `${0.25 + i * 0.07}s`; });
        await wait(980);
        root.classList.remove('naming');
        intro.remove();
        document.querySelectorAll('.say, .oil').forEach((el) => { el.style.transitionDelay = ''; });
      });
    }
  }
  const narrow = () => hero.clientWidth / hero.clientHeight < 0.9;
  const clamp = (x) => Math.min(Math.max(x, 0), 1);
  const ease = (x) => x * x * (3 - 2 * x);

  // The scene: a Blender plate (macro camera, rose-gold oil, the bottle) and the camera it was
  // rendered with (Blender is Z-up; the water is z = 0), one for landscape screens and one for
  // portrait. box: where the bottle and the top of its reflection sit in the plate (uv from the top
  // left), kept in frame on every screen; patch: the square of water that carries ripples
  // [cx, cy, size]; first: the dropper's spot over the water; fall: its tip's height; drop: a drop's
  // radius (metres, real size; the fall is slowed); ring: the renderer's parted-rings effect, unused.
  const WIDE = { box: [0.071, 0.644, 0.383, 0.8], patch: [0.07, -0.55, 0.42], drop: 0.0019, fall: 0.068, gravity: 0.025, ring: [0.05, -0.6, 0.065], first: [0.106, -0.52], focus: 0.912, blur: 0.02, waveScale: 0.035, dropperScale: 1.0, reflect: 0.86 };
  // on a phone the bottle lies nearer and lower in the tall frame, and the drops land further off
  const TALL = { ...WIDE, box: [0.136, 0.692, 0.864, 0.8], patch: [0.0, -0.45, 0.42], ring: [0.02, -0.25, 0.03], first: [0.016, -0.42], fall: 0.07, focus: 0.811 };
  const viewFor = () => {
    const shape = narrow() ? 'tall' : 'wide', plate = `/img/sea/plate-macrob-${shape}-rose`;
    return {
      ...(shape === 'tall' ? TALL : WIDE),
      plate: `${plate}.webp`, camera: `${plate}.json`, mask: `${plate}-mask.png`, refl: `${plate}-refl.png`,
      poster: `/img/sea/poster-macrob-${shape}-rose.webp`,
      dropper: POSTER ? null : { transmit: '/img/dropper-transmit.png', glow: '/img/dropper-glow.png', meta: '/img/dropper.json' },
      transmit: '/img/round-transmit-rose.png', glow: '/img/round-glow-rose.png',
      // warm cream reflections; the mid-distance oil mirrors the studio's brightest band, so a
      // slightly warmer, dimmer mirror keeps it a soft pale band instead of washing it white
      tint: [1.0, 0.9, 0.82],
      key: shape,
    };
  };

  // the plate shown before WebGL is ready (and kept if it never is)
  function showStill(view) {
    const src = view.poster ?? view.plate;
    hero.querySelector('source').srcset = src.replace('-wide', '-tall');
    still.src = src.replace('-tall', '-wide');
  }

  // Where the horizon would sit on screen (0..1 from the top) before any shift, from the camera
  // file alone (the same sums the renderer does), so the still can be placed before WebGL is up.
  function horizonOf(cam, plateAspect) {
    const sa = hero.clientWidth / hero.clientHeight, ky = sa > plateAspect ? plateAspect / sa : 1;
    const py = (-cam.forward[2] / (cam.tanY * cam.up[2])) * 0.5 + 0.5;
    return 1 - ((py - 0.5) / ky + 0.5);
  }
  // How far to slide the plate on this screen (fractions of it: dy down, dx left). The horizon goes
  // just under the intro line; the bottle, label and all, stays in frame: clear of the side edges
  // and above the price bar at the bottom. Never so far that the plate's own edge shows.
  function framing(view, cam) {
    if (POSTER) return { dx: 0, dy: 0 };
    const W = hero.clientWidth, H = hero.clientHeight, sa = W / H, pa = narrow() ? 1080 / 1920 : 1920 / 1080;
    const kx = sa > pa ? 1 : sa / pa, ky = sa > pa ? pa / sa : 1;
    const target = (say.getBoundingClientRect().bottom - hero.getBoundingClientRect().top + 28) / H;
    let dy = Math.max(0, target - horizonOf(cam, pa)), dx = 0;
    if (view.box) {
      const [x0, , x1, y1] = view.box, side = 0.03, foot = (hero.querySelector('.stand').offsetHeight + 44) / H;
      const sx0 = (x0 - 0.5) / kx + 0.5, sx1 = (x1 - 0.5) / kx + 0.5;
      if (sx0 < side) dx = sx0 - side;
      else if (sx1 > 1 - side) dx = sx1 - (1 - side);
      dx = Math.min(Math.max(dx, 0.5 - 0.5 / kx), 0.5 / kx - 0.5);
      dy = Math.max(Math.min(dy, 1 - foot - ((y1 - 0.5) / ky + 0.5)), -(0.5 / ky - 0.5));
    }
    return { dx, dy };
  }
  // put the still exactly where the live sea will be, so nothing jumps when it takes over
  let camera = null;
  function frameStill({ dx, dy }) {
    const W = hero.clientWidth, H = hero.clientHeight, pa = narrow() ? 1080 / 1920 : 1920 / 1080;
    const over = Math.max(0, H * pa - W);   // how much wider than the screen the covering still is
    still.style.objectPosition = over ? `${50 + (dx * W / over) * 100}% 50%` : '';
    still.style.transform = `translateY(${dy * H}px)`;
  }
  async function placeStill(view) {
    if (!POSTER) {
      camera = await (await fetch(view.camera)).json();
      frameStill(framing(view, camera));
    }
    still.classList.add('placed');
  }

  // slide the live sea to the same framing (see framing)
  const say = hero.querySelector('.say');
  function fitHorizon() {
    if (!camera) return;
    const f = framing(sea.view, camera);
    sea.setShift(f.dy, f.dx);
    frameStill(f);
  }

  // Pin the dropper to the screen's top right corner, whatever its size: the top of its collar
  // sits against the right edge, level with the header, so the bulb runs up out of frame. Solves
  // for the tip's spot over the water (x) and its height (fall), keeping the view's water depth y.
  const COLLAR = [0.0445, 0.0635];   // collar top relative to the tip, metres (dropper.py, tilted 35°)
  function placeDropper(view) {
    const W = hero.clientWidth, H = hero.clientHeight;
    const btn = hero.querySelector('.bar .buy').getBoundingClientRect(), top = hero.getBoundingClientRect().top;
    const want = [(W - 44) / W, (btn.bottom - top + 6) / H];
    const y = view.first[1];
    let x = view.first[0], fall = view.fall;
    const at = (x, f) => sea.project([x + COLLAR[0], y, f + COLLAR[1]]);
    for (let i = 0; i < 6; i++) {
      const p = at(x, fall), px = at(x + 0.001, fall), pf = at(x, fall + 0.001);
      x += ((want[0] - p[0]) / (px[0] - p[0])) * 0.001;
      fall += ((want[1] - p[1]) / (pf[1] - p[1])) * 0.001;
    }
    return { x, y, tx: x, ty: y, fall };
  }

  let sea = null, dive = null, queue = Promise.resolve(), dropper = null;
  // a resize while the scene is still loading must not start a second load
  function start() { queue = queue.then(load, load); return queue; }
  async function load() {
    const view = viewFor();
    showStill(view);
    await placeStill(view).catch(() => still.classList.add('placed'));
    if (!sea) {
      sea = await createOilSea(canvas, { view, sprite: { env: '/img/env-cards.jpg' }, shares: DROP_OIL.layers.map((l) => l.share), scale: narrow() ? 0.8 : 1 });
      if (!sea) return;
      sea.resize();
      requestAnimationFrame(frame);
    } else if (sea.view.key !== view.key) {
      await sea.setView(view);
    }
    fitHorizon();
    // one drop falls on its own as the page opens
    if (view.dropper) {
      // the dropper is in its place at the top right from the start, lets the first drop go, and stays
      dropper = { ...placeDropper(view), pending: true };
    } else {
      dropper = null;
      if (!POSTER) setTimeout(() => sea.drop(...view.first), 350);
    }
  }

  // Left alone at the top of the page, the dropper lets a drop go 3-5 s after the last one fell.
  // A tap hands it to the visitor for 10 s; scrolling stops it (the scroll has its own drop) until we are back at the top
  // and still for 5 s. Never with reduced motion.
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches, calm = !reduceMotion;
  let nextDrip = performance.now() + 3500, lastTap = -Infinity, lastAway = -Infinity;
  function drip(now, p) {
    if (!calm || !dropper) return;
    if (p > 0) return;
    if (scrubbed || dropper.bead || dropper.pending || now - lastTap < 10000 || now - lastAway < 5000 || now < nextDrip) return;
    dropper.pending = true;
    nextDrip = Infinity;   // set again when this drop leaves the tip
  }

  let then = performance.now(), visible = true;
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; }).observe(hero);
  // (the dive overlaps the hero from the top, so it is out of view only once we are below it)
  let diveShown = true;
  new IntersectionObserver(([e]) => { diveShown = e.isIntersecting; }).observe(document.querySelector('#dive'));
  function frame(now) {
    requestAnimationFrame(frame);
    const dt = Math.min((now - then) / 1000, 0.05);
    then = now;
    // past the dive (the sections below), nothing of it shows: don't draw it at all
    const { p = 0, sink = 0 } = !diveShown ? { p: 1, sink: 1 } : dive ? dive.tick(dt) : {};
    if (p > 0) lastAway = now;   // (noted before anything returns early, however deep we are)
    if (sink >= 1 && !reduceMotion) return;   // (as a still, the dive sits below the sea, not over it)
    // the first stretch of scroll lets one drop fall from the dropper to the sea; the camera
    // follows it in while the type steps back
    const fallen = reduceMotion ? 0 : span(ACTS.DROP, p);
    scrubDrop(fallen);
    follow(fallen, sink);
    type.forEach((el) => { el.style.opacity = fallen > 0 ? 1 - clamp(fallen * 1.5) : ''; });
    if (!visible) return;
    drip(now, p);
    if (dropper) {
      // settle into place; a tap swells a bead of oil at the tip, which falls once it is full
      const v = sea.view, ease = Math.min(dt * 3.2, 1);
      dropper.x += (dropper.tx - dropper.x) * ease;
      dropper.y += (dropper.ty - dropper.y) * ease;
      sea.setDropper([dropper.x, dropper.y, dropper.fall]);
      const settled = Math.hypot(dropper.tx - dropper.x, dropper.ty - dropper.y) < v.drop * 0.3;
      if (settled && dropper.pending && !dropper.bead) {
        dropper.pending = false;
        dropper.bead = sea.drop(dropper.x, dropper.y, v.drop * (0.9 + Math.random() * 0.2), dropper.fall, true);
      }
      if (dropper.bead?.grow === 1) {
        dropper.bead.hang = false; dropper.bead = null;
        // the next one counts from this one's fall (less the 0.7 s a bead takes to swell)
        nextDrip = now + 2300 + Math.random() * 2000;
      }
    } else sea.setDropper(null);
    sea.tick(dt, 0);
    still.style.opacity = 0;   // the live sea takes over from the still (a crossfade, see the CSS)
    // (not while the intro plays: the hint comes in with the rest of the type)
    hint.style.opacity = document.documentElement.classList.contains('loading') ? '' : 1 - clamp(scrollY / innerHeight * 4);
  }

  // The drop of the dive, its fall scrubbed by the scroll (t: 0 at the tip, 1 at the surface).
  // At the surface it is let go to land and ripple; scrolling back up before then takes it away.
  let scrubbed = null;
  function scrubDrop(t) {
    if (!dropper || !sea) return;
    if (t <= 0 || t >= 1) {
      if (scrubbed && t >= 1) scrubbed.hang = false;
      else if (scrubbed) sea.remove(scrubbed);
      scrubbed = null;
      return;
    }
    if (!scrubbed) { scrubbed = sea.drop(dropper.tx, dropper.ty, sea.view.drop * 1.8, dropper.fall, true); scrubbed.grow = 1; }
    scrubbed.top = dropper.fall * (1 - Math.pow(t, 1.6)) + scrubbed.r * 0.9;
  }

  // The camera follows the falling drop: it closes in on it and brings it to the middle of the
  // screen, so that by the time it lands it fills the eye; the surface then takes over below.
  // `shot` keeps where the drop sits on screen and how big it looks, for the dive to pick up.
  let shot = null;
  function follow(t, sink) {
    if (!dropper || !sea) return;
    const W = hero.clientWidth, H = hero.clientHeight, k = ease(t);
    const z = scrubbed ? scrubbed.z : 0;
    const [dx, dy] = sea.project([dropper.tx, dropper.ty, z]);
    const [ex] = sea.project([dropper.tx + sea.view.drop * 1.8, dropper.ty, z]);
    const s = 1 + k * 1.3;   // (no further once it lands, so the dive picks it up where the ripple is)
    const want = [dx * W + (W * 0.5 - dx * W) * k, dy * H + (H * 0.44 - dy * H) * k];
    // (never so far that the sea's edge comes into view)
    const tx = Math.min(0, Math.max(W - s * W, want[0] - s * dx * W)), ty = Math.min(0, Math.max(H - s * H, want[1] - s * dy * H));
    want[0] = tx + s * dx * W; want[1] = ty + s * dy * H;
    sea.setZoom(tx / W, ty / H, s);
    shot = { x: want[0], y: want[1], r: Math.max(4, (ex - dx) * W * s) };
  }

  hero.addEventListener('click', (e) => {
    if (!sea || e.target.closest('a, button')) return;
    const r = canvas.getBoundingClientRect();
    const xy = sea.pick((e.clientX - r.left) / r.width, (e.clientY - r.top) / r.height);
    if (!xy) return;
    // the dropper holds still at the top right: every tap squeezes one more drop from it (not while
    // the scroll is letting its own drop fall)
    if (dropper) { if (!scrubbed) dropper.pending = true; lastTap = performance.now(); }
    else sea.drop(xy[0], xy[1], sea.view.drop * (0.8 + Math.random() * 0.4));
  });
  addEventListener('resize', () => { if (!sea) return; sea.resize(); start(); });

  // the hero stays put (sticky) while the dive section rises over it: we sink into the oil
  const diveEl = document.querySelector('#dive');
  mountDive(diveEl, DROP_OIL, { impact: () => shot }).then((d) => { dive = d; });

  // Among the oils the wheel steps from one to the next like slides: the first turn of a gesture
  // sends the page on to the next oil in that direction, tag fully drawn, as one continuous glide
  // (the target is moved, not a new move started, so nothing stops and restarts). The rest of the
  // gesture, a trackpad's coasting included, holds that target. Before the first oil and after the
  // last, the wheel scrolls as usual. Mouse and trackpad only (Lenis).
  if (lenis && !reduceMotion) {
    const oils = DROP_OIL.layers.length, [a, b] = ACTS.WALK;
    const holds = Array.from({ length: oils }, (_, i) => a + ((i + 0.62) * (b - a)) / oils);
    let target = null, lastWheel = 0;
    addEventListener('wheel', (e) => {
      const dir = Math.sign(e.deltaY), now = performance.now();
      if (!dir) return;
      const gesture = now - lastWheel > 220;   // a pause starts a new gesture
      lastWheel = now;
      if (!gesture && target !== null) { lenis.scrollTo(target, { lerp: 0.075 }); return; }
      const r = diveEl.getBoundingClientRect(), span = r.height - innerHeight, top = r.top + scrollY;
      // from where we are headed already (mid-glide), else from where we are
      const at = target !== null ? (target - top) / span : (scrollY - top) / span;
      const next = dir > 0 ? holds.find((h) => h > at + 0.004) : [...holds].reverse().find((h) => h < at - 0.004);
      const inside = dir > 0 ? at >= a - 0.03 && at < holds[oils - 1] - 0.004 : at > holds[0] + 0.004 && at <= b;
      if (!inside || next === undefined) { target = null; return; }
      target = top + next * span;
      lenis.scrollTo(target, { lerp: 0.075 });
    }, { passive: true });
    // a scroll that is not ours (scrollbar, keys) lets go of the target
    lenis.on('scroll', () => { if (target !== null && Math.abs(lenis.targetScroll - target) > 2) target = null; });
  }
  start();
}
