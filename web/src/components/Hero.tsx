import { DROP_OIL } from "@/lib/formulas";

// The oil sea. The still shows at once (and stays if WebGL is missing); <Scene> brings it to life.
export function Hero() {
  return (
    <section className="pool" id="hero">
      <picture>
        <source media="(max-aspect-ratio: 9/10)" srcSet="/img/sea/poster-macrob-tall-rose.webp" />
        <img className="still" src="/img/sea/poster-macrob-wide-rose.webp" alt="A bottle of PERLE Drop Oil lying in a calm sea of peach oil under a white sky" />
      </picture>
      <canvas aria-label="A sea of golden oil. Tap it to let a drop fall." />
      <div className="intro" aria-hidden="true"><span className="intro-mark">PERLE</span><i className="intro-line"><b /></i></div>
      <div className="bar"><span className="name">PERLE</span><nav><a href="#">Ingredients</a><a href="#">Find yours</a><a className="buy" href="#">Where to buy</a></nav></div>
      <div className="say">
        <h1>What’s in a drop.</h1>
        <p>Each oil is set at its share of the formula. Scroll to sink in and meet them one by one.</p>
      </div>
      {/* the cascade: each oil at its share of the formula */}
      {DROP_OIL.layers.map((l, i) => (
        <p key={l.inci} className={`oil o${i + 1}`}>{l.name}<small>{l.share.toFixed(1)}%</small></p>
      ))}
      <p className="hint">Tap the oil for another drop</p>
      <div className="stand"><span>{DROP_OIL.product} <span className="mono">{DROP_OIL.size} · {DROP_OIL.price}</span></span><a href="#">Where to buy</a></div>
    </section>
  );
}
