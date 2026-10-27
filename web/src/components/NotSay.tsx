"use client";

import { useEffect, useRef } from "react";
import s from "./NotSay.module.css";

// What we don't say: claims a cosmetic can't make, struck through one by one by a line of oil as
// the page scrolls, then what we say instead.
const CLAIMS = ["Whitening", "Anti-acne", "Anti-aging", "Pore-erasing", "Clinically proven", "Results in 7 days"];

export function NotSay() {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    const el = ref.current!;
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
      el.style.setProperty("--done", "1");
      el.toggleAttribute("data-said", true);
      el.querySelectorAll<HTMLElement>("li").forEach((li) => li.style.setProperty("--k", "1"));
      return;
    }
    const lines = [...el.querySelectorAll<HTMLElement>("li")];
    let raf = 0;
    const update = () => {
      raf = 0;
      const r = el.getBoundingClientRect(), span = r.height - innerHeight;
      const p = Math.min(Math.max(-r.top / span, 0), 1);
      // each claim takes its stretch of the scroll, a little overlapped with the next
      lines.forEach((li, i) => {
        const k = Math.min(Math.max((p - 0.06 - i * 0.1) / 0.13, 0), 1);
        li.style.setProperty("--k", k.toFixed(3));
      });
      const done = Math.min(Math.max((p - 0.72) / 0.12, 0), 1);
      el.style.setProperty("--done", done.toFixed(3));
      el.toggleAttribute("data-said", done > 0.5);   // (its link only takes taps once it shows)
    };
    const ask = () => { if (!raf) raf = requestAnimationFrame(update); };
    update();
    addEventListener("scroll", ask, { passive: true });
    addEventListener("resize", ask);
    return () => { removeEventListener("scroll", ask); removeEventListener("resize", ask); cancelAnimationFrame(raf); };
  }, []);

  return (
    <section ref={ref} className={s.notsay} id="claims" aria-labelledby="claims-title">
      <div className={s.stage}>
        <p className={`mono ${s.kicker}`} id="claims-title">Words you won’t find on our labels</p>
        <div className={s.body}>
        <ul className={s.claims}>
          {CLAIMS.map((c) => (
            <li key={c}><span>{c}</span><i aria-hidden="true" /></li>
          ))}
        </ul>
        <div className={s.say}>
          <h2>We say what’s in it.</h2>
          <p>A cosmetic can’t promise to treat skin, and we won’t try. Every label lists each ingredient by its share, and its job in the formula.</p>
          <a href="#dive">See the five oils</a>
        </div>
        </div>
      </div>
    </section>
  );
}
