import { CENTELLA_GEL, DROP_OIL, LAYER_SERUM, type Formula } from "./formulas";

// The range, thin to rich: the order they go on in, and the order of the ladder.
export type Product = {
  id: "gel" | "serum" | "oil";
  step: string;
  texture: string;
  feel: string;
  formula: Formula;
};

export const RANGE: Product[] = [
  { id: "gel", step: "01", texture: "Gel", feel: "Water-light. Spreads thin and is gone in a moment.", formula: CENTELLA_GEL },
  { id: "serum", step: "02", texture: "Serum", feel: "A silky veil. Lighter than it looks, a little slip.", formula: LAYER_SERUM },
  { id: "oil", step: "03", texture: "Oil", feel: "Five oils, nothing else. A few drops, pressed in last.", formula: DROP_OIL },
];

// The official stores. Demo only: PERLE is fictional, so none of these exist.
export const SHOPS = [
  { id: "shopee", name: "Shopee", store: "PERLE Official Store", where: "Shopee Mall", handle: "perle.official", url: "shopee.co.th/perle.official" },
  { id: "lazada", name: "Lazada", store: "PERLE Official", where: "LazMall", handle: "perle-official", url: "lazada.co.th/shop/perle-official" },
  { id: "tiktok", name: "TikTok Shop", store: "@perle.official", where: "TikTok Shop", handle: "perle.official", url: "tiktok.com/@perle.official" },
] as const;
