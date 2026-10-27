// After the dive: where to buy it, and how to know the store is ours. (Demo links.)
const SHOPS = [
  { name: "Shopee", store: "PERLE Official Store · Shopee Mall" },
  { name: "Lazada", store: "PERLE Official · LazMall" },
  { name: "TikTok Shop", store: "@perle.official" },
];

export function Buy() {
  return (
    <section className="buy" id="buy">
      <h2>Where to buy</h2>
      <p>Perle is sold only through the stores below. Before you order, check that the store name matches exactly; anything else is not us.</p>
      <ul className="shops">
        {SHOPS.map((s) => (
          <li key={s.name}><a href="#"><strong>{s.name}</strong><span>{s.store}</span></a></li>
        ))}
      </ul>
    </section>
  );
}
