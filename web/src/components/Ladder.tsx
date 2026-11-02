import { RANGE } from "@/lib/range";
import s from "./Ladder.module.css";

// The range, thin to rich: the order they go on in. Each still is a generated photo with the PERLE label laid on (render/ladder_stills.py).
export function Ladder() {
  return (
    <section className={s.ladder} id="range" aria-labelledby="range-title">
      <header className={s.head}>
        <h2 id="range-title">Thin to rich.</h2>
        <p>Three textures, put on in this order. Each one lists what is in it, largest share first.</p>
      </header>
      <div className={s.scale} aria-hidden="true"><span>Thin</span><i /><span>Rich</span></div>
      <ol className={s.steps}>
        {RANGE.map((p) => (
          <li key={p.id} className={s.step} data-texture={p.id}>
            <picture className={s.still}>
              <source media="(max-width: 860px)" srcSet={`/img/range/range-${p.id}-wide.webp`} />
              <img src={`/img/range/range-${p.id}-tall.webp`} alt={`${p.formula.product}, ${p.formula.size}, beside a swatch of its texture`} loading="lazy" decoding="async" width={1100} height={1375} />
            </picture>
            <p className={`mono ${s.meta}`}>Step {p.step} · {p.texture}</p>
            <h3>{p.formula.product}</h3>
            <p className={s.feel}>{p.feel}</p>
            <ul className={s.inci} aria-label="Top ingredients by share">
              {p.formula.layers.slice(0, 3).map((l) => (
                <li key={l.inci}><span>{l.inci}</span><span className="mono">{l.share.toFixed(1)}%</span></li>
              ))}
            </ul>
            <div className={s.buy}>
              <span className="mono">{p.formula.size} · {p.formula.price}</span>
              <a href="#buy">Where to buy</a>
            </div>
          </li>
        ))}
      </ol>
      <p className={`mono ${s.note}`}>Formulas are illustrative. Shares add up to 100%.</p>
    </section>
  );
}
