export type CaseBackground = { id: string; name: string; colors: string[] };

export type Layer =
  | { id: string; kind: 'image'; uri: string; width: number; height: number; radius?: number; tx: number; ty: number; scale: number; rotation: number; z: number }
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
  ip15: { id: 'ip15', brand: 'iPhone', name: '15 / 15 Pro', heightMm: 147.1, widthMm: 71.1 }, // avg 147.6x71.6, 146.6x70.6
  ip14: { id: 'ip14', brand: 'iPhone', name: '14 / 13', heightMm: 146.7, widthMm: 71.5 },
  ip12: { id: 'ip12', brand: 'iPhone', name: '12 / 11', heightMm: 148.8, widthMm: 73.6 }, // avg 146.7x71.5, 150.9x75.7
  ipse: { id: 'ipse', brand: 'iPhone', name: 'SE (2022)', heightMm: 138.4, widthMm: 67.3 }, // iPhone 8 body

  // Android: approximate published specs (less rigorously sourced than the
  // Apple table above — good enough for relative sizing, not manufacturing).
  s24u: { id: 's24u', brand: 'Samsung', name: 'S24 Ultra', heightMm: 162.3, widthMm: 79.0 },
  s24p: { id: 's24p', brand: 'Samsung', name: 'S24+', heightMm: 158.5, widthMm: 75.9 },
  s24: { id: 's24', brand: 'Samsung', name: 'Galaxy S24', heightMm: 147.0, widthMm: 70.6 },
  s23u: { id: 's23u', brand: 'Samsung', name: 'S23 Ultra', heightMm: 163.4, widthMm: 78.1 },
  s23: { id: 's23', brand: 'Samsung', name: 'Galaxy S23', heightMm: 146.3, widthMm: 70.9 },
  a55: { id: 'a55', brand: 'Samsung', name: 'A55 / A54', heightMm: 161.1, widthMm: 77.4 },
  zflip5: { id: 'zflip5', brand: 'Samsung', name: 'Z Flip 5', heightMm: 84.9, widthMm: 71.9 }, // folded/closed
  zfold5: { id: 'zfold5', brand: 'Samsung', name: 'Z Fold 5', heightMm: 154.9, widthMm: 67.1 }, // folded/closed
  pixel9p: { id: 'pixel9p', brand: 'Google', name: 'Pixel 9 Pro', heightMm: 152.8, widthMm: 72.0 },
  pixel8pro: { id: 'pixel8pro', brand: 'Google', name: 'Pixel 8 Pro', heightMm: 162.6, widthMm: 76.5 },
  pixel8: { id: 'pixel8', brand: 'Google', name: 'Pixel 8 / 8a', heightMm: 150.5, widthMm: 70.8 },
  pixel7: { id: 'pixel7', brand: 'Google', name: 'Pixel 7', heightMm: 155.6, widthMm: 73.2 },
  xiaomi14: { id: 'xiaomi14', brand: 'Xiaomi', name: 'Xiaomi 14', heightMm: 152.8, widthMm: 71.5 },
  redmi13: { id: 'redmi13', brand: 'Xiaomi', name: 'Redmi Note 13', heightMm: 161.1, widthMm: 74.3 },
  oneplus12: { id: 'oneplus12', brand: 'OnePlus', name: 'OnePlus 12', heightMm: 164.3, widthMm: 75.8 },
  oppo: { id: 'oppo', brand: 'OPPO', name: 'Reno 11', heightMm: 161.6, widthMm: 74.2 },
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
