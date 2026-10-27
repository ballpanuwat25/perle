import { RANGE } from "@/lib/range";
import s from "./Ladder.module.css";

// The range, thin to rich: the order they go on in. Each still is a Blender render (to come).
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
            <div className={s.still} role="img" aria-label={`${p.formula.product}, ${p.formula.size}`}>
              <span className="mono">Still to render</span>
            </div>
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
