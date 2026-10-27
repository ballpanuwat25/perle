import Lenis from 'lenis';

// Smooth wheel scrolling (Lenis) on mouse and trackpad; touch keeps the device's own, and so does
// reduced motion. Returns the Lenis instance, or null where it is not used.
export function initScroll({ lerp = 0.12, wheelMultiplier = 1 } = {}) {
  if (!matchMedia('(pointer: fine)').matches || matchMedia('(prefers-reduced-motion: reduce)').matches) return null;
  const lenis = new Lenis({ lerp, wheelMultiplier });
  const raf = (t) => { lenis.raf(t); requestAnimationFrame(raf); };
  requestAnimationFrame(raf);
  return lenis;
}
