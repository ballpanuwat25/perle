export type Layer = { inci: string; name: string; share: number; role: string; color: string };
export type Formula = { product: string; size: string; price: string; layers: Layer[] };
export const LAYER_SERUM: Formula;
export const CENTELLA_GEL: Formula;
export const DROP_OIL: Formula;
