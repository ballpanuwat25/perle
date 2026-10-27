"use client";

import { useEffect } from "react";

// Starts the hero and the dive once the page is in the browser. The scene keeps its own state and
// listeners for the life of the page, so it starts once only (not again on a dev re-mount).
let started = false;

export function Scene() {
  useEffect(() => {
    if (started) return;
    started = true;
    import("@/lib/hero").then(({ startHero }) => startHero());
  }, []);
  return null;
}
