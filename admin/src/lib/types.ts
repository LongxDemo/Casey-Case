// Mirrors storefront's lib/types.ts — 'gingham' renders a checkered
// picnic-cloth pattern from `colors` instead of a plain gradient.
export type CaseBackground = { id: string; name: string; colors: string[]; pattern?: 'gingham' };

export type Layer =
  // uri is nullable — mirrors storefront's ImageLayer, for empty "tap to
  // add your photo" full-case-wrap placeholders.
  | { id: string; kind: 'image'; uri: string | null; width: number; height: number; radius?: number; tx: number; ty: number; scale: number; rotation: number; z: number }
  | { id: string; kind: 'sticker'; emoji?: string; uri?: string; size: number; tx: number; ty: number; scale: number; rotation: number; z: number }
  | { id: string; kind: 'text'; text: string; color: string; fontSize: number; fontWeight: string; align: 'left' | 'center' | 'right'; tx: number; ty: number; scale: number; rotation: number; z: number }
  // Fruit/character frame with a face-hole; geometry looked up by frameId
  // from FRAME_DEFS at render time (mirrors storefront's lib/frames.ts).
  | { id: string; kind: 'frame'; frameId: string; photoUri: string | null; photoTx: number; photoTy: number; photoScale: number; tx: number; ty: number; scale: number; rotation: number; z: number };

export type DesignRow = {
  id: string;
  user_id: string | null;
  model_id: string | null;
  background: CaseBackground | null;
  layers: Layer[];
  preview_url: string | null;
  // Set when submitted via the storefront's "send to Casey" flow (no checkout).
  contact_name: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  contact_address: string | null;
  contact_lat: number | null;
  contact_lng: number | null;
  note: string | null;
  status: 'new' | 'contacted' | 'done' | null;
  created_at: string;
};

export type OrderRow = {
  id: string;
  order_no: string;
  email: string | null;
  full_name: string | null;
  fulfillment: string;
  status: string;
  subtotal_cents: number;
  shipping_cents: number;
  total_cents: number;
  created_at: string;
};

export type TemplateRow = {
  id: string;
  name: string;
  tag: string | null;
  accent: string | null;
  background: CaseBackground;
  layers: Layer[];
  active: boolean;
  featured: boolean;
  sort: number;
  uses_count: number;
  created_at: string;
};

export type BackgroundRow = {
  id: string;
  name: string;
  colors: string[];
  pattern: 'gingham' | null;
  active: boolean;
  sort: number;
};

export type FrontPage = {
  id: number;
  hero_title: string;
  hero_subtitle: string;
  hero_cta: string;
  banner_text: string | null;
  featured_template_ids: string[];
  updated_at: string;
};

// Real body dimensions in mm (not just aspect ratio) so case previews can be
// sized relative to each other like real phones — a Pro Max renders bigger
// than an SE, not just a different shape. See sizeForModel() below.
export type PhoneModel = { id: string; brand: string; name: string; heightMm: number; widthMm: number; camera?: { x: number; y: number; w: number; h: number } };

export const aspectOf = (m: PhoneModel) => m.widthMm / m.heightMm;

export const MODELS: Record<string, PhoneModel> = {
  // iPhone: exact body Height x Width (mm) from Apple's published specs.
  // Grouped catalog entries (e.g. "16 / 16 Plus") use the average of the two.
  ip17pm: { id: 'ip17pm', brand: 'iPhone', name: '17 Pro Max', heightMm: 163.4, widthMm: 78.0 },
  ip17p: { id: 'ip17p', brand: 'iPhone', name: '17 Pro', heightMm: 150.0, widthMm: 71.9 },
  ip17air: { id: 'ip17air', brand: 'iPhone', name: 'Air', heightMm: 156.2, widthMm: 74.7 },
  ip17: { id: 'ip17', brand: 'iPhone', name: '17', heightMm: 149.6, widthMm: 71.5 },
  ip16pm: { id: 'ip16pm', brand: 'iPhone', name: '16 Pro Max', heightMm: 163.0, widthMm: 77.6 },
  ip16p: { id: 'ip16p', brand: 'iPhone', name: '16 Pro', heightMm: 149.6, widthMm: 71.5 },
  ip16: { id: 'ip16', brand: 'iPhone', name: '16 / 16 Plus', heightMm: 154.25, widthMm: 74.7 }, // avg 147.6x71.6, 160.9x77.8
  ip15pm: { id: 'ip15pm', brand: 'iPhone', name: '15 Pro Max', heightMm: 159.9, widthMm: 76.7 },
  // 15 and 15 Pro used to be one averaged-size catalog entry, but they have
  // different real cameras (15: diagonal dual lens; 15 Pro: square triple
  // lens) — camStyleFor() picks the style off the name, so a combined
  // "15 / 15 Pro" name always matched the "Pro" square-module style even
  // when the customer picked the base 15. Kept as two entries like the Pro
  // Max above, not grouped like 16/16 Plus (which really do share a camera).
  ip15p: { id: 'ip15p', brand: 'iPhone', name: '15 Pro', heightMm: 146.6, widthMm: 70.6 },
  ip15: { id: 'ip15', brand: 'iPhone', name: '15', heightMm: 147.6, widthMm: 71.6 },
  // 13 Pro/Pro Max and 14 Pro/Pro Max were missing entirely — only the base
  // non-Pro "14 / 13" entry below existed. Same reasoning as 15/15 Pro and
  // 12 Pro/11 Pro above: the Pro models have a real triple-lens square
  // camera, not the base model's diagonal dual lens, so they need their own
  // catalog entries (camStyleFor() routes any iPhone name containing "Pro"
  // without a dedicated real-photo match to the generic 'ip-square' style).
  // Dimensions from Apple's published specs.
  ip14pm: { id: 'ip14pm', brand: 'iPhone', name: '14 Pro Max', heightMm: 160.7, widthMm: 77.6 },
  ip14p: { id: 'ip14p', brand: 'iPhone', name: '14 Pro', heightMm: 147.5, widthMm: 71.5 },
  ip13pm: { id: 'ip13pm', brand: 'iPhone', name: '13 Pro Max', heightMm: 160.8, widthMm: 78.1 },
  ip13p: { id: 'ip13p', brand: 'iPhone', name: '13 Pro', heightMm: 146.7, widthMm: 71.5 },
  ip14: { id: 'ip14', brand: 'iPhone', name: '14 / 13', heightMm: 146.7, widthMm: 71.5 },
  // 12 Pro/12 Pro Max and 11 Pro/11 Pro Max were missing entirely — only the
  // base non-Pro "12 / 11" entry below existed. Same reasoning as the 15/15
  // Pro split above: the Pro models have a real triple-lens square camera,
  // not the base model's dual lens, so they need their own catalog entries
  // (and camStyleFor() below routes them to the square triple-lens style).
  // Dimensions from Apple's published specs.
  ip12pm: { id: 'ip12pm', brand: 'iPhone', name: '12 Pro Max', heightMm: 160.8, widthMm: 78.1 },
  ip12p: { id: 'ip12p', brand: 'iPhone', name: '12 Pro', heightMm: 146.7, widthMm: 71.5 },
  ip11pm: { id: 'ip11pm', brand: 'iPhone', name: '11 Pro Max', heightMm: 158.0, widthMm: 77.8 },
  ip11p: { id: 'ip11p', brand: 'iPhone', name: '11 Pro', heightMm: 144.0, widthMm: 71.4 },
  ip12: { id: 'ip12', brand: 'iPhone', name: '12 / 11', heightMm: 148.8, widthMm: 73.6 }, // avg 146.7x71.5, 150.9x75.7

  // Android: approximate published specs (less rigorously sourced than the
  // Apple table above — good enough for relative sizing, not manufacturing).
  // S26 Ultra's real published spec isn't available yet — height derived
  // from measuring the user's own print-template reference photo's body
  // silhouette (665x1370px, h/w=2.06) against a 79.0mm width assumption
  // (unchanged from recent Ultra generations), landing at 162.7mm — near-
  // identical to S24 Ultra's confirmed 162.3mm, which corroborates the
  // measurement rather than being an independent source.
  // Samsung/Xiaomi/OPPO lineup synced 2026-10-01 against the actual vending-
  // machine partner's supported model list (autovendpro, device 668 / shop
  // 332) — kept S26 Ultra even though it's not on that list yet (its own
  // camera module was already built and fixed this session), dropped Z Flip
  // 5 / Z Fold 5 (not offered by this vendor), and dropped Google Pixel /
  // OnePlus entirely — this vendor doesn't support either brand at all.
  s26u: { id: 's26u', brand: 'Samsung', name: 'S26 Ultra', heightMm: 162.7, widthMm: 79.0 },
  s25p: { id: 's25p', brand: 'Samsung', name: 'S25+', heightMm: 158.4, widthMm: 75.8 },
  s25: { id: 's25', brand: 'Samsung', name: 'Galaxy S25', heightMm: 146.9, widthMm: 70.5 },
  s24u: { id: 's24u', brand: 'Samsung', name: 'S24 Ultra', heightMm: 162.3, widthMm: 79.0 },
  s24fe: { id: 's24fe', brand: 'Samsung', name: 'S24 Fe', heightMm: 161.3, widthMm: 76.6 },
  s24p: { id: 's24p', brand: 'Samsung', name: 'S24+', heightMm: 158.5, widthMm: 75.9 },
  s24: { id: 's24', brand: 'Samsung', name: 'Galaxy S24', heightMm: 147.0, widthMm: 70.6 },
  s23u: { id: 's23u', brand: 'Samsung', name: 'S23 Ultra', heightMm: 163.4, widthMm: 78.1 },
  s23fe: { id: 's23fe', brand: 'Samsung', name: 'S23 Fe', heightMm: 158.0, widthMm: 76.5 },
  s23: { id: 's23', brand: 'Samsung', name: 'Galaxy S23', heightMm: 146.3, widthMm: 70.9 },
  a55: { id: 'a55', brand: 'Samsung', name: 'A55 / A54', heightMm: 161.1, widthMm: 77.4 },
  a36: { id: 'a36', brand: 'Samsung', name: 'A36', heightMm: 161.7, widthMm: 77.8 },
  a16: { id: 'a16', brand: 'Samsung', name: 'A16', heightMm: 164.0, widthMm: 77.4 },
  xiaomi15p: { id: 'xiaomi15p', brand: 'Xiaomi', name: 'Xiaomi 15 Pro', heightMm: 161.3, widthMm: 75.3 },
  xiaomi15u: { id: 'xiaomi15u', brand: 'Xiaomi', name: 'Xiaomi 15 Ultra', heightMm: 161.3, widthMm: 75.3 },
  redmiNote14: { id: 'redmiNote14', brand: 'Xiaomi', name: 'Redmi Note 14 5G', heightMm: 161.4, widthMm: 74.8 },
  xiaomi14c: { id: 'xiaomi14c', brand: 'Xiaomi', name: 'Xiaomi 14C', heightMm: 169.5, widthMm: 76.7 },
  redmiNote13pp: { id: 'redmiNote13pp', brand: 'Xiaomi', name: 'Redmi Note 13 Pro+ 5G', heightMm: 161.1, widthMm: 74.2 },
  redmi13c: { id: 'redmi13c', brand: 'Xiaomi', name: 'Redmi 13C 5G', heightMm: 168.4, widthMm: 76.3 },
  redmi13: { id: 'redmi13', brand: 'Xiaomi', name: 'Redmi Note 13 5G', heightMm: 161.1, widthMm: 74.3 },
  redmiNote12p: { id: 'redmiNote12p', brand: 'Xiaomi', name: 'Redmi Note 12 Pro 5G', heightMm: 162.9, widthMm: 76.0 },
  oppoFindX9: { id: 'oppoFindX9', brand: 'OPPO', name: 'Find X9', heightMm: 161.6, widthMm: 74.2 },
  oppoFindX8Pro: { id: 'oppoFindX8Pro', brand: 'OPPO', name: 'Find X8 Pro', heightMm: 163.3, widthMm: 76.3 },
  oppoFindX8Ultra: { id: 'oppoFindX8Ultra', brand: 'OPPO', name: 'Find X8 Ultra', heightMm: 163.6, widthMm: 76.8 },
  oppoFindX8: { id: 'oppoFindX8', brand: 'OPPO', name: 'Find X8', heightMm: 155.0, widthMm: 72.7 },
  oppoFindX5: { id: 'oppoFindX5', brand: 'OPPO', name: 'Find X5', heightMm: 160.3, widthMm: 72.6 },
  oppoReno8: { id: 'oppoReno8', brand: 'OPPO', name: 'Reno 8', heightMm: 160.0, widthMm: 74.2 },
  oppoA98: { id: 'oppoA98', brand: 'OPPO', name: 'A98', heightMm: 164.0, widthMm: 74.8 },
  oppoA74: { id: 'oppoA74', brand: 'OPPO', name: 'A74', heightMm: 165.3, widthMm: 75.1 },
};

// Widest real device in the catalog — the anchor other models scale against.
export const REFERENCE_WIDTH_MM = Math.max(...Object.values(MODELS).map((m) => m.widthMm));

/** Render size for a model so relative real-world scale is preserved: pass the
 *  pixel width the WIDEST phone in the catalog should render at, and every
 *  other model comes back proportionally smaller/larger. */
export function sizeForModel(model: PhoneModel, refWidthPx: number) {
  const pxPerMm = refWidthPx / REFERENCE_WIDTH_MM;
  return { width: model.widthMm * pxPerMm, height: model.heightMm * pxPerMm };
}

export const CANVAS_BASE = 320;
