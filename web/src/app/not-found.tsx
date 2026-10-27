import s from "./not-found.module.css";

// A missed drop: the calm sea, still, and the way back.
export default function NotFound() {
  return (
    <main className={s.missed}>
      <picture>
        <source media="(max-aspect-ratio: 9/10)" srcSet="/img/sea/poster-macrob-tall-rose.webp" />
        <img src="/img/sea/poster-macrob-wide-rose.webp" alt="" />
      </picture>
      <div className={s.text}>
        <p className="mono">404</p>
        <h1>This drop missed.</h1>
        <p>The page you were after isn’t here.</p>
        {/* plain links on purpose: the home page's WebGL scene starts on a full load, not a client navigation */}
        {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
        <nav><a href="/">Back to the oil</a><a href="/#buy">Where to buy</a></nav>
      </div>
    </main>
  );
}
