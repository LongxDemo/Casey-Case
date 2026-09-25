import type { DesignRow, FrontPage, OrderRow, TemplateRow } from './lib/types';

export const mockFrontPage: FrontPage = {
  id: 1,
  hero_title: 'Design it. Print it. Love it.',
  hero_subtitle: '100% you, 100% Casey',
  hero_cta: 'Start designing',
  banner_text: 'Free shipping on 2+ cases 🎀',
  featured_template_ids: ['t-stan', 't-love', 't-bunny'],
  updated_at: new Date().toISOString(),
};

export const mockDesigns: DesignRow[] = [
  {
    id: 'd1', user_id: null, model_id: 'ip15pm', preview_url: null, created_at: new Date(Date.now() - 3600e3).toISOString(),
    contact_name: null, contact_email: null, contact_phone: null, note: null, status: null,
    background: { id: 'midnight', name: 'Midnight Stan', colors: ['#2B1B3D', '#141018'] },
    layers: [
      { id: 'a', kind: 'text', text: 'STAN\n4 LIFE', color: '#FF3E9A', fontSize: 46, fontWeight: '900', align: 'center', tx: 0, ty: -40, scale: 1, rotation: 0, z: 2 },
      { id: 'b', kind: 'sticker', emoji: '🖤', size: 60, tx: -70, ty: 90, scale: 1, rotation: -0.2, z: 1 },
    ],
  },
  {
    id: 'd2', user_id: 'u1', model_id: 's24u', preview_url: null, created_at: new Date(Date.now() - 7200e3).toISOString(),
    contact_name: null, contact_email: null, contact_phone: null, note: null, status: null,
    background: { id: 'bubblegum', name: 'Bubblegum', colors: ['#FF7EC0', '#FF3E9A'] },
    layers: [
      { id: 'a', kind: 'text', text: 'love.\nprint.\nstan.', color: '#FFFFFF', fontSize: 40, fontWeight: '800', align: 'left', tx: -30, ty: 0, scale: 1, rotation: 0, z: 2 },
      { id: 'b', kind: 'sticker', emoji: '🐰', size: 64, tx: 70, ty: 150, scale: 1, rotation: 0, z: 1 },
    ],
  },
  {
    id: 'd3', user_id: null, model_id: 'ip14', preview_url: null, created_at: new Date(Date.now() - 10800e3).toISOString(),
    contact_name: null, contact_email: null, contact_phone: null, note: null, status: null,
    background: { id: 'cotton', name: 'Cotton Candy', colors: ['#FFD6EC', '#C8B6FF'] },
    layers: [
      { id: 'a', kind: 'sticker', emoji: '🐰', size: 120, tx: 0, ty: -30, scale: 1, rotation: 0, z: 2 },
      { id: 'b', kind: 'text', text: 'be a cutie', color: '#D6006E', fontSize: 30, fontWeight: '800', align: 'center', tx: 0, ty: 110, scale: 1, rotation: 0, z: 2 },
    ],
  },
  {
    id: 'd4', user_id: null, model_id: 'ip17p', preview_url: null, created_at: new Date(Date.now() - 1800e3).toISOString(),
    contact_name: 'Sokha R.', contact_email: 'sokha@example.com', contact_phone: '012 345 678',
    note: 'Pickup please, need it by Friday if possible!', status: 'new',
    background: { id: 'lilac', name: 'Lilac Dream', colors: ['#E4C1F9', '#B892FF'] },
    layers: [
      { id: 'a', kind: 'text', text: 'casey', color: '#5B3DE0', fontSize: 34, fontWeight: '900', align: 'center', tx: 0, ty: -60, scale: 1, rotation: 0, z: 2 },
      { id: 'b', kind: 'sticker', emoji: '✨', size: 40, tx: -80, ty: -140, scale: 1, rotation: -0.2, z: 1 },
    ],
  },
];

export const mockTemplates: TemplateRow[] = [
  {
    id: 't-stan', name: 'Stan 4 Life', tag: 'Trending', accent: '#FF3E9A', active: true, featured: true, sort: 0, uses_count: 842,
    created_at: new Date(Date.now() - 30 * 86400e3).toISOString(),
    background: { id: 'midnight', name: 'Midnight Stan', colors: ['#2B1B3D', '#141018'] },
    layers: [
      { id: 'a', kind: 'text', text: 'STAN\n4 LIFE', color: '#FF3E9A', fontSize: 46, fontWeight: '900', align: 'center', tx: 0, ty: -40, scale: 1, rotation: 0, z: 2 },
      { id: 'b', kind: 'sticker', emoji: '🖤', size: 60, tx: -70, ty: 90, scale: 1, rotation: -0.2, z: 1 },
    ],
  },
  {
    id: 't-love', name: 'Love Print Stan', tag: 'Casey pick', accent: '#FF7EC0', active: true, featured: true, sort: 1, uses_count: 611,
    created_at: new Date(Date.now() - 26 * 86400e3).toISOString(),
    background: { id: 'bubblegum', name: 'Bubblegum', colors: ['#FF7EC0', '#FF3E9A'] },
    layers: [
      { id: 'a', kind: 'text', text: 'love.\nprint.\nstan.', color: '#FFFFFF', fontSize: 40, fontWeight: '800', align: 'left', tx: -30, ty: 0, scale: 1, rotation: 0, z: 2 },
      { id: 'b', kind: 'sticker', emoji: '🐰', size: 64, tx: 70, ty: 150, scale: 1, rotation: 0, z: 1 },
    ],
  },
  {
    id: 't-bunny', name: 'Bunny Blush', tag: 'New', accent: '#C8B6FF', active: true, featured: false, sort: 2, uses_count: 203,
    created_at: new Date(Date.now() - 6 * 86400e3).toISOString(),
    background: { id: 'cotton', name: 'Cotton Candy', colors: ['#FFD6EC', '#C8B6FF'] },
    layers: [
      { id: 'a', kind: 'sticker', emoji: '🐰', size: 120, tx: 0, ty: -30, scale: 1, rotation: 0, z: 2 },
      { id: 'b', kind: 'text', text: 'be a cutie', color: '#D6006E', fontSize: 30, fontWeight: '800', align: 'center', tx: 0, ty: 110, scale: 1, rotation: 0, z: 2 },
    ],
  },
  {
    id: 't-idol', name: 'Idol Frame', tag: 'Photo', accent: '#FF5470', active: true, featured: true, sort: 3, uses_count: 97,
    created_at: new Date(Date.now() - 2 * 86400e3).toISOString(),
    background: { id: 'sunset', name: 'K-Sunset', colors: ['#FFC3A0', '#FF5470'] },
    layers: [
      { id: 'a', kind: 'text', text: '♡ my bias ♡', color: '#FFFFFF', fontSize: 26, fontWeight: '800', align: 'center', tx: 0, ty: 150, scale: 1, rotation: 0, z: 3 },
      { id: 'b', kind: 'sticker', emoji: '📸', size: 50, tx: 80, ty: -150, scale: 1, rotation: 0, z: 2 },
    ],
  },
  {
    id: 't-berry-duo', name: 'Berry Duo', tag: 'Photo', accent: '#E4574A', active: true, featured: false, sort: 4, uses_count: 0,
    created_at: new Date().toISOString(),
    background: { id: 'gingham-berry', name: 'Gingham Picnic', colors: ['#FCE9C6', '#E4574A'], pattern: 'gingham' },
    layers: [
      { id: 'a', kind: 'frame', frameId: 'strawberry', photoUri: null, photoTx: 0, photoTy: 0, photoScale: 1, tx: -72, ty: -35, scale: 0.62, rotation: -0.06, z: 2 },
      { id: 'b', kind: 'frame', frameId: 'cherry', photoUri: null, photoTx: 0, photoTy: 0, photoScale: 1, tx: 72, ty: -35, scale: 0.62, rotation: 0.06, z: 2 },
      { id: 'c', kind: 'text', text: 'besties', color: '#B23A2E', fontSize: 30, fontWeight: '800', align: 'center', tx: 0, ty: 155, scale: 1, rotation: 0, z: 3 },
      { id: 'd', kind: 'sticker', emoji: '✨', size: 34, tx: -118, ty: -155, scale: 1, rotation: -0.2, z: 1 },
      { id: 'e', kind: 'sticker', emoji: '✨', size: 34, tx: 118, ty: -155, scale: 1, rotation: 0.2, z: 1 },
    ],
  },
];

export const mockOrders: OrderRow[] = [
  { id: 'o1', order_no: 'CK-284910', email: 'mina@kpop.com', full_name: 'Mina L.', fulfillment: 'ship', status: 'paid', subtotal_cents: 3980, shipping_cents: 499, total_cents: 4479, created_at: new Date(Date.now() - 3600e3).toISOString() },
  { id: 'o2', order_no: 'CK-284911', email: 'jae@stan.com', full_name: 'Jae P.', fulfillment: 'pickup', status: 'printing', subtotal_cents: 1990, shipping_cents: 0, total_cents: 1990, created_at: new Date(Date.now() - 9000e3).toISOString() },
  { id: 'o3', order_no: 'CK-284912', email: 'soo@fan.com', full_name: 'Soo K.', fulfillment: 'ship', status: 'shipped', subtotal_cents: 5970, shipping_cents: 499, total_cents: 6469, created_at: new Date(Date.now() - 90000e3).toISOString() },
];
