"use client";

import { useState } from "react";
import { SHOPS } from "@/lib/range";
import { checkShop, type Verdict } from "@/lib/check-shop";
import s from "./Buy.module.css";

// Where to buy, and a check that a shop is really ours. The stores are demo links (PERLE is
// fictional); the check runs in the page and nothing is sent or kept.
const EXAMPLES = ["shopee.co.th/perle.official", "shopee.co.th/perle.offical", "tiktok.com/@glowshop.th"];

export function Buy() {
  const [demo, setDemo] = useState<string | null>(null);
  const [text, setText] = useState("");
  const [verdict, setVerdict] = useState<Verdict | null>(null);
  const check = (value: string) => { setText(value); setVerdict(checkShop(value)); };

  return (
    <section className={s.buy} id="buy" aria-labelledby="buy-title">
      <div className={s.stores}>
        <h2 id="buy-title">Where to buy</h2>
        <p>PERLE is sold only through these three stores. Anything else is not us.</p>
        <ul className={s.shops}>
          {SHOPS.map((shop) => (
            <li key={shop.id}>
              <a href={`https://${shop.url}`} onClick={(e) => { e.preventDefault(); setDemo(shop.name); }}>
                <strong>{shop.name}</strong>
                <span className="mono">{shop.store} · {shop.where}</span>
              </a>
            </li>
          ))}
        </ul>
        <p className={`mono ${s.demo}`} role="status">{demo ? `Demo link: PERLE is fictional, so there is no ${demo} store to open.` : " "}</p>
      </div>

      <div className={s.check}>
        <h3>Check a shop</h3>
        <p>Paste a store link from Shopee, Lazada or TikTok Shop to see if it is ours.</p>
        <form onSubmit={(e) => { e.preventDefault(); check(text); }}>
          <label className="sr-only" htmlFor="shop-link">Shop link</label>
          <input id="shop-link" type="text" inputMode="url" autoComplete="off" spellCheck={false} placeholder="shopee.co.th/…" value={text}
            onChange={(e) => { setText(e.target.value); setVerdict(null); }} />
          <button type="submit">Check</button>
        </form>
        <p className={s.try}><span className="mono">Try</span>{EXAMPLES.map((x) => <button key={x} type="button" onClick={() => check(x)}>{x}</button>)}</p>
        <div className={s.verdict} aria-live="polite">{verdict && <Answer v={verdict} />}</div>
        <p className={`mono ${s.fine}`}>Nothing you paste is sent or saved.</p>
      </div>
    </section>
  );
}

function Answer({ v }: { v: Verdict }) {
  switch (v.kind) {
    case "official":
      return <p data-kind="ok"><strong>Official.</strong> That is {v.shop.store} on {v.shop.where}.</p>;
    case "lookalike":
      return <p data-kind="no"><strong>Not us.</strong> “{v.handle}” is a lookalike of our {v.platform} store, “{v.ours}”. Please don’t order from it.</p>;
    case "not-us":
      return <p data-kind="no"><strong>Not us.</strong> “{v.handle}” on {v.platform} is not a PERLE store.</p>;
    default:
      return <p data-kind="?"><strong>Can’t tell.</strong> That doesn’t look like a Shopee, Lazada or TikTok Shop store link.</p>;
  }
}
