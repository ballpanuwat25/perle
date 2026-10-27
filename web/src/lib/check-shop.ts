import { SHOPS } from "./range";

// Reads a pasted shop link (or a bare handle) and says whether it is one of ours. Runs in the
// browser only; nothing is sent or kept.
export type Verdict =
  | { kind: "official"; shop: (typeof SHOPS)[number] }
  | { kind: "lookalike"; platform: string; handle: string; ours: string }
  | { kind: "not-us"; platform: string; handle: string }
  | { kind: "unknown" };

const PLATFORMS: { id: (typeof SHOPS)[number]["id"]; name: string; hosts: RegExp; handle: (path: string[]) => string | undefined }[] = [
  { id: "shopee", name: "Shopee", hosts: /(^|\.)shopee\.co\.th$/, handle: (p) => p[0] },
  { id: "lazada", name: "Lazada", hosts: /(^|\.)lazada\.co\.th$/, handle: (p) => (p[0] === "shop" ? p[1] : undefined) },
  { id: "tiktok", name: "TikTok Shop", hosts: /(^|\.)tiktok\.com$/, handle: (p) => p.find((s) => s.startsWith("@"))?.slice(1) },
];

// letters apart (Levenshtein), to catch names one or two keystrokes off ours
function distance(a: string, b: string) {
  const row = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    let prev = row[0];
    row[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const next = Math.min(row[j] + 1, row[j - 1] + 1, prev + (a[i - 1] === b[j - 1] ? 0 : 1));
      prev = row[j];
      row[j] = next;
    }
  }
  return row[b.length];
}

export function checkShop(input: string): Verdict {
  const text = input.trim();
  if (!text) return { kind: "unknown" };
  let url: URL;
  try {
    url = new URL(/^https?:\/\//i.test(text) ? text : `https://${text}`);
  } catch {
    return { kind: "unknown" };
  }
  const host = url.hostname.toLowerCase();
  const platform = PLATFORMS.find((p) => p.hosts.test(host));
  if (!platform) return { kind: "unknown" };
  const path = url.pathname.split("/").filter(Boolean).map((s) => decodeURIComponent(s).toLowerCase());
  const handle = platform.handle(path);
  if (!handle) return { kind: "unknown" };
  const shop = SHOPS.find((s) => s.id === platform.id)!;
  if (handle === shop.handle) return { kind: "official", shop };
  const squash = (s: string) => s.replace(/[^a-z0-9]/g, "");
  if (squash(handle).includes("perle") || distance(handle, shop.handle) <= 3) {
    return { kind: "lookalike", platform: platform.name, handle, ours: shop.handle };
  }
  return { kind: "not-us", platform: platform.name, handle };
}
