import type { CaseBackground, StickerPack, Template } from './lib/types';

export const BASE_PRICE_CENTS = 1990;

export const backgrounds: CaseBackground[] = [
  { id: 'bubblegum', name: 'Bubblegum', colors: ['#FF7EC0', '#FF3E9A'] },
  { id: 'cotton', name: 'Cotton Candy', colors: ['#FFD6EC', '#C8B6FF'] },
  { id: 'sunset', name: 'K-Sunset', colors: ['#FFC3A0', '#FF5470'] },
  { id: 'midnight', name: 'Midnight Stan', colors: ['#2B1B3D', '#141018'] },
  { id: 'mint', name: 'Fresh Mint', colors: ['#B8F2E6', '#8ED1C6'] },
  { id: 'cream', name: 'Cream', colors: ['#FFF5FA', '#FFE9F4'] },
  { id: 'lilac', name: 'Lilac Dream', colors: ['#E4C1F9', '#B892FF'] },
  { id: 'solidpink', name: 'Hot Pink', colors: ['#FF3E9A', '#FF3E9A'] },
  { id: 'gingham-berry', name: 'Gingham Picnic', colors: ['#FCE9C6', '#E4574A'], pattern: 'gingham' },
  { id: 'peachy', name: 'Peachy Keen', colors: ['#FFE3C6', '#FFB37B'] },
  { id: 'melon', name: 'Melon Splash', colors: ['#C8F5D6', '#5FC98A'] },
  { id: 'citrus', name: 'Sunny Citrus', colors: ['#FFDDB0', '#FF9A3D'] },
  { id: 'donutcream', name: 'Donut Cream', colors: ['#FFE9F4', '#FFC2E0'] },
  { id: 'bearmint', name: 'Bear Mint', colors: ['#B8F2E6', '#6FC9B8'] },
  { id: 'bunnypink', name: 'Bunny Pink', colors: ['#FFE3F0', '#FFB8DA'] },
  { id: 'puppytan', name: 'Puppy Tan', colors: ['#FFECD2', '#FFD199'] },
  { id: 'kittylilac', name: 'Kitty Lilac', colors: ['#EDE1FB', '#C9A6F5'] },
];

export const stickerPacks: StickerPack[] = [
  { id: 'hearts', name: 'Love', cover: '💗', stickers: [
    { id: 'h1', emoji: '💗' }, { id: 'h2', emoji: '💖' }, { id: 'h3', emoji: '❤️' },
    { id: 'h4', emoji: '🖤' }, { id: 'h5', emoji: '💕' }, { id: 'h6', emoji: '💝' },
    { id: 'h7', emoji: '😍' }, { id: 'h8', emoji: '🥰' }, { id: 'h9', emoji: '😘' },
  ] },
  { id: 'kpop', name: 'K-Pop', cover: '🎤', stickers: [
    { id: 'k1', emoji: '🎤' }, { id: 'k2', emoji: '🎧' }, { id: 'k3', emoji: '🎶' },
    { id: 'k4', emoji: '💿' }, { id: 'k5', emoji: '⭐' }, { id: 'k6', emoji: '🌟' },
    { id: 'k7', emoji: '👑' }, { id: 'k8', emoji: '💫' }, { id: 'k9', emoji: '🔥' },
  ] },
  { id: 'cute', name: 'Cutie', cover: '🐰', stickers: [
    { id: 'c1', emoji: '🐰' }, { id: 'c2', emoji: '🎀' }, { id: 'c3', emoji: '🌸' },
    { id: 'c4', emoji: '🍓' }, { id: 'c5', emoji: '🧸' }, { id: 'c6', emoji: '🍰' },
    { id: 'c7', emoji: '🦋' }, { id: 'c8', emoji: '🌈' }, { id: 'c9', emoji: '☁️' },
  ] },
  { id: 'sparkle', name: 'Sparkle', cover: '✨', stickers: [
    { id: 's1', emoji: '✨' }, { id: 's2', emoji: '💎' }, { id: 's3', emoji: '🌟' },
    { id: 's4', emoji: '⚡' }, { id: 's5', emoji: '🪩' }, { id: 's6', emoji: '💐' },
    { id: 's7', emoji: '🌷' }, { id: 's8', emoji: '🍭' }, { id: 's9', emoji: '🫧' },
  ] },
];

export const templates: Template[] = [
  {
    id: 't-stan', name: 'Stan 4 Life', tag: 'Trending', accent: '#FF3E9A',
    background: backgrounds[3],
    layers: [
      { kind: 'text', text: 'STAN\n4 LIFE', color: '#FF3E9A', fontSize: 46, fontWeight: '900', align: 'center', tx: 0, ty: -40, scale: 1, rotation: 0, z: 2 },
      { kind: 'sticker', emoji: '🖤', size: 60, tx: -70, ty: 90, scale: 1, rotation: -0.2, z: 1 },
      { kind: 'sticker', emoji: '⭐', size: 44, tx: 80, ty: -140, scale: 1, rotation: 0.3, z: 1 },
    ],
  },
  {
    id: 't-love', name: 'Love Print Stan', tag: 'Casey pick', accent: '#FF7EC0',
    background: backgrounds[0],
    layers: [
      { kind: 'text', text: 'love.\nprint.\nstan.', color: '#FFFFFF', fontSize: 40, fontWeight: '800', align: 'left', tx: -30, ty: 0, scale: 1, rotation: 0, z: 2 },
      { kind: 'sticker', emoji: '💗', size: 52, tx: 80, ty: -150, scale: 1, rotation: 0.1, z: 1 },
      { kind: 'sticker', emoji: '🐰', size: 64, tx: 70, ty: 150, scale: 1, rotation: 0, z: 1 },
    ],
  },
  {
    id: 't-bunny', name: 'Bunny Blush', tag: 'New', accent: '#C8B6FF',
    background: backgrounds[1],
    layers: [
      { kind: 'sticker', emoji: '🐰', size: 120, tx: 0, ty: -30, scale: 1, rotation: 0, z: 2 },
      { kind: 'text', text: 'be a cutie', color: '#D6006E', fontSize: 30, fontWeight: '800', align: 'center', tx: 0, ty: 110, scale: 1, rotation: 0, z: 2 },
      { kind: 'sticker', emoji: '🎀', size: 40, tx: -80, ty: -150, scale: 1, rotation: -0.3, z: 1 },
    ],
  },
  {
    id: 't-idol', name: 'Idol Frame', tag: 'Photo', accent: '#FF5470',
    background: backgrounds[2],
    layers: [
      { kind: 'text', text: '♡ my bias ♡', color: '#FFFFFF', fontSize: 26, fontWeight: '800', align: 'center', tx: 0, ty: 150, scale: 1, rotation: 0, z: 3 },
      { kind: 'sticker', emoji: '📸', size: 50, tx: 80, ty: -150, scale: 1, rotation: 0, z: 2 },
    ],
  },
  {
    id: 't-berry-duo', name: 'Berry Duo', tag: 'Photo', accent: '#E4574A',
    background: backgrounds[8],
    layers: [
      { kind: 'frame', frameId: 'strawberry', photoUri: null, photoTx: 0, photoTy: 0, photoScale: 1, tx: -72, ty: -35, scale: 0.62, rotation: -0.06, z: 2 },
      { kind: 'frame', frameId: 'cherry', photoUri: null, photoTx: 0, photoTy: 0, photoScale: 1, tx: 72, ty: -35, scale: 0.62, rotation: 0.06, z: 2 },
      { kind: 'text', text: 'besties', color: '#B23A2E', fontSize: 30, fontWeight: '800', align: 'center', tx: 0, ty: 155, scale: 1, rotation: 0, z: 3 },
      { kind: 'sticker', emoji: '✨', size: 34, tx: -118, ty: -155, scale: 1, rotation: -0.2, z: 1 },
      { kind: 'sticker', emoji: '✨', size: 34, tx: 118, ty: -155, scale: 1, rotation: 0.2, z: 1 },
    ],
  },
  // One standalone gallery template per new face-frame shape (2026-09-25) —
  // each just a single centered frame + two corner accents so the customer's
  // photo is the whole point, name/tag/background themed to match the shape.
  {
    id: 't-peach', name: 'Peachy Keen', tag: 'Frame', accent: '#E8720C',
    background: backgrounds[9],
    layers: [
      { kind: 'frame', frameId: 'peach', photoUri: null, photoTx: 0, photoTy: 0, photoScale: 1, tx: 0, ty: -8, scale: 1.05, rotation: 0, z: 2 },
      { kind: 'sticker', emoji: '✨', size: 36, tx: -100, ty: -150, scale: 1, rotation: -0.2, z: 1 },
      { kind: 'sticker', emoji: '🎀', size: 40, tx: 96, ty: 150, scale: 1, rotation: 0.2, z: 1 },
    ],
  },
  {
    id: 't-watermelon', name: 'Melon Splash', tag: 'Frame', accent: '#2E9E5B',
    background: backgrounds[10],
    layers: [
      { kind: 'frame', frameId: 'watermelon', photoUri: null, photoTx: 0, photoTy: 0, photoScale: 1, tx: 0, ty: -8, scale: 1.05, rotation: 0, z: 2 },
      { kind: 'sticker', emoji: '✨', size: 36, tx: -100, ty: -150, scale: 1, rotation: -0.2, z: 1 },
      { kind: 'sticker', emoji: '🎀', size: 40, tx: 96, ty: 150, scale: 1, rotation: 0.2, z: 1 },
    ],
  },
  {
    id: 't-orange', name: 'Sunny Citrus', tag: 'Frame', accent: '#E8720C',
    background: backgrounds[11],
    layers: [
      { kind: 'frame', frameId: 'orange', photoUri: null, photoTx: 0, photoTy: 0, photoScale: 1, tx: 0, ty: -8, scale: 1.05, rotation: 0, z: 2 },
      { kind: 'sticker', emoji: '✨', size: 36, tx: -100, ty: -150, scale: 1, rotation: -0.2, z: 1 },
      { kind: 'sticker', emoji: '🎀', size: 40, tx: 96, ty: 150, scale: 1, rotation: 0.2, z: 1 },
    ],
  },
  {
    id: 't-donut', name: 'Donut Vibes', tag: 'Frame', accent: '#E85AA0',
    background: backgrounds[12],
    layers: [
      { kind: 'frame', frameId: 'donut', photoUri: null, photoTx: 0, photoTy: 0, photoScale: 1, tx: 0, ty: -8, scale: 1.05, rotation: 0, z: 2 },
      { kind: 'sticker', emoji: '✨', size: 36, tx: -100, ty: -150, scale: 1, rotation: -0.2, z: 1 },
      { kind: 'sticker', emoji: '🎀', size: 40, tx: 96, ty: 150, scale: 1, rotation: 0.2, z: 1 },
    ],
  },
  {
    id: 't-bear', name: 'Bear Hug', tag: 'Frame', accent: '#3D9C89',
    background: backgrounds[13],
    layers: [
      { kind: 'frame', frameId: 'bear', photoUri: null, photoTx: 0, photoTy: 0, photoScale: 1, tx: 0, ty: -8, scale: 1.05, rotation: 0, z: 2 },
      { kind: 'sticker', emoji: '⭐', size: 36, tx: -100, ty: -150, scale: 1, rotation: -0.2, z: 1 },
      { kind: 'sticker', emoji: '🎀', size: 40, tx: 96, ty: 150, scale: 1, rotation: 0.2, z: 1 },
    ],
  },
  {
    id: 't-bunny', name: 'Bunny Love', tag: 'Frame', accent: '#FF6FAE',
    background: backgrounds[14],
    layers: [
      { kind: 'frame', frameId: 'bunny', photoUri: null, photoTx: 0, photoTy: 0, photoScale: 1, tx: 0, ty: -8, scale: 1.05, rotation: 0, z: 2 },
      { kind: 'sticker', emoji: '✨', size: 36, tx: -100, ty: -150, scale: 1, rotation: -0.2, z: 1 },
      { kind: 'sticker', emoji: '🎀', size: 40, tx: 96, ty: 150, scale: 1, rotation: 0.2, z: 1 },
    ],
  },
  {
    id: 't-dog', name: 'Puppy Love', tag: 'Frame', accent: '#E8A23D',
    background: backgrounds[15],
    layers: [
      { kind: 'frame', frameId: 'dog', photoUri: null, photoTx: 0, photoTy: 0, photoScale: 1, tx: 0, ty: -8, scale: 1.05, rotation: 0, z: 2 },
      { kind: 'sticker', emoji: '✨', size: 36, tx: -100, ty: -150, scale: 1, rotation: -0.2, z: 1 },
      { kind: 'sticker', emoji: '🐾', size: 34, tx: 96, ty: 150, scale: 1, rotation: 0.2, z: 1 },
    ],
  },
  {
    id: 't-cat', name: 'Kitty Cutie', tag: 'Frame', accent: '#8B4FD1',
    background: backgrounds[16],
    layers: [
      { kind: 'frame', frameId: 'cat', photoUri: null, photoTx: 0, photoTy: 0, photoScale: 1, tx: 0, ty: -8, scale: 1.05, rotation: 0, z: 2 },
      { kind: 'sticker', emoji: '✨', size: 36, tx: -100, ty: -150, scale: 1, rotation: -0.2, z: 1 },
      { kind: 'sticker', emoji: '🎀', size: 40, tx: 96, ty: 150, scale: 1, rotation: 0.2, z: 1 },
    ],
  },
  // Real photographic frame (cut from an actual strawberry-hood product
  // photo, transparent PNG) — not the flat SVG cartoon look above.
  {
    id: 't-strawberry-real', name: 'Strawberry (Real)', tag: 'Real Photo', accent: '#B23A2E',
    background: backgrounds[8],
    layers: [
      { kind: 'frame', frameId: 'strawberry-photo', photoUri: null, photoTx: 0, photoTy: 0, photoScale: 1, tx: 0, ty: -6, scale: 1.05, rotation: 0, z: 2 },
      { kind: 'sticker', emoji: '🎀', size: 38, tx: -100, ty: -150, scale: 1, rotation: -0.2, z: 1 },
      { kind: 'sticker', emoji: '🎀', size: 38, tx: 100, ty: 150, scale: 1, rotation: 0.2, z: 1 },
    ],
  },
  // Full-case photo wrap — the customer's own photo covers the whole case
  // edge to edge, matching a real printed unit fresh off the machine
  // (empty "tap to add your photo" placeholder, sized to the reference
  // phone's case; re-tap "Fit to Case" after switching models).
  {
    id: 't-full-photo', name: 'Your Photo, Full Case', tag: 'Real Print', accent: '#2c2c31',
    background: backgrounds[5],
    layers: [
      { kind: 'image', uri: null, width: 320, height: 667, radius: 0, tx: 0, ty: 0, scale: 1, rotation: 0, z: 1 },
    ],
  },
];
