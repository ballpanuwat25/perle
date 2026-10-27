import { RANGE } from "@/lib/range";
import s from "./Footer.module.css";

// Who made this, and what is real: the brand is fictional, the formulas illustrative.
// TODO: fill in SITE_BY and CONTACT
const SITE_BY = { name: "—", href: "#" };
const CONTACT = { label: "—", href: "#" };

export function Footer() {
  return (
    <footer className={s.footer}>
      <p className={s.mark} aria-hidden="true">PERLE</p>
      <div className={s.cols}>
        <div>
          <h4 className="mono">Range</h4>
          <ul>{RANGE.map((p) => <li key={p.id}><a href="#range">{p.formula.product}</a> <span className="mono">{p.formula.price}</span></li>)}</ul>
        </div>
        <div>
          <h4 className="mono">This page</h4>
          <ul>
            <li><a href="#dive">The five oils</a></li>
            <li><a href="#claims">What we don’t say</a></li>
            <li><a href="#finder">Find yours</a></li>
            <li><a href="#buy">Where to buy</a></li>
          </ul>
        </div>
        <div>
          <h4 className="mono">Made with</h4>
          <ul>
            <li>Blender (Cycles) for the oil, bottle and dropper</li>
            <li>WebGL for the ripples and the dive</li>
            <li>“Studio Small 09” HDRI, Poly Haven (CC0)</li>
            <li>Funnel Display, Geist, Geist Mono (SIL OFL)</li>
          </ul>
        </div>
      </div>
      <div className={s.fine}>
        <p><strong>PERLE is fictional.</strong> A portfolio piece: there is no product, the formulas and shares are illustrative, and the shop links go nowhere.</p>
        <p>Site by <a href={SITE_BY.href}>{SITE_BY.name}</a> · <a href={CONTACT.href}>{CONTACT.label}</a></p>
      </div>
    </footer>
  );
}
