// Phone-model catalog, Layer hierarchy, and other types shared with
// storefront live in _shared-catalog.ts (generated — see shared/catalog.ts).
// Everything below is admin-only: raw DB row shapes for the dashboard's CRUD
// views, which storefront has no equivalent of.
export * from './_shared-catalog';
import type { CaseBackground, Layer } from './_shared-catalog';

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

export type OrderItemRow = {
  id: string;
  model_id: string | null;
  quantity: number;
  price_cents: number;
  preview_url: string | null;
  print_url: string | null;
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
  order_items?: OrderItemRow[];
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
  // Which device the Gallery card/editor preview renders on — cosmetic only,
  // the template itself isn't tied to a device. Null/undefined falls back to
  // CasePreview's own default model.
  preview_model_id?: string | null;
};

export type BackgroundRow = {
  id: string;
  name: string;
  colors: string[];
  pattern: 'gingham' | null;
  active: boolean;
  sort: number;
};

export type AdminRow = {
  user_id: string;
  email: string | null;
  role: 'admin' | 'staff';
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
