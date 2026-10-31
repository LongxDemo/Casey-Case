// Phone-model catalog, Layer hierarchy, and other types shared with admin
// live in _shared-catalog.ts (generated — see shared/catalog.ts). Everything
// below is storefront-only: app-level editor shapes built from DB rows via
// hooks, which admin has no equivalent of (it works with raw rows directly).
export * from './_shared-catalog';
import type { CaseBackground, Layer } from './_shared-catalog';

export type DistributiveOmit<T, K extends keyof any> = T extends any ? Omit<T, K> : never;
export type LayerSpec = DistributiveOmit<Layer, 'id'>;

export type Design = {
  id: string;
  modelId: string;
  background: CaseBackground;
  layers: Layer[];
};

export type Template = {
  id: string;
  name: string;
  tag?: string;
  accent: string;
  background: CaseBackground;
  layers: LayerSpec[];
  preview_model_id?: string | null;
};

// Admin-controlled home page content (front_page table, single row id=1).
export type FrontPage = {
  hero_title: string;
  hero_subtitle: string;
  hero_cta: string;
  banner_text: string | null;
  featured_template_ids: string[];
};
