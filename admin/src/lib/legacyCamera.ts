import type { PhoneModel } from './types';

// Every style here pre-dates the admin Cameras page (CameraDesigner) and is
// still what the live storefront renders for any model with no camera_specs
// row — see storefront/src/components/CasePreview.tsx's camStyleFor/
// CameraModule. Lets "Import existing design" below pull that same real
// photo + position into an editable camera_specs row instead of leaving it
// stuck in code, without requiring the admin to re-crop/re-position by eye.
export type LegacyCamStyle =
  | 'ip17-plateau' | 'ip17-air' | 'ip-vert' | 'ip15-square' | 'ip11pro-square' | 'ip12pro-square'
  | 'ip13pro-square' | 'ip14pro-square' | 'ip13-diag' | 'ip15-diag' | 'ip-dual-vert';

// Mirrors storefront's camStyleFor exactly (brand/name -> style), but only
// for styles that render a REAL PHOTO there — returns null for anything
// still CSS-drawn (Samsung slabs, Xiaomi, OPPO, and the 'ip-square'/'ip-dual'
// catch-alls, which no current catalog model actually reaches) since there's
// no existing real-photo design to import for those.
export function legacyCamStyle(model: PhoneModel): LegacyCamStyle | null {
  if (model.brand !== 'iPhone') return null;
  const n = model.name;
  if (n.startsWith('17 Pro')) return 'ip17-plateau';
  if (n === 'Air') return 'ip17-air';
  if (n === '17') return 'ip-vert';
  if (n === '15 Pro Max' || n === '15 Pro' || n === '16 Pro Max' || n === '16 Pro') return 'ip15-square';
  if (n === '11 Pro Max' || n === '11 Pro') return 'ip11pro-square';
  if (n === '12 Pro Max' || n === '12 Pro') return 'ip12pro-square';
  if (n === '13 Pro Max' || n === '13 Pro') return 'ip13pro-square';
  if (n === '14 Pro Max' || n === '14 Pro') return 'ip14pro-square';
  if (n.includes('Pro')) return null;
  if (n.startsWith('16')) return 'ip-vert';
  if (n.startsWith('12') || n.startsWith('11')) return 'ip-dual-vert';
  if (n === '14 / 13') return 'ip13-diag';
  if (n === '15') return 'ip15-diag';
  return null;
}

// Pixel rect (relative to a W x H render box, same convention the Cameras
// stage already uses) of the legacy real photo — formulas copied verbatim
// from CameraModule's real-photo cases so an import can't drift a single
// pixel from what customers already see live. Returns just the filename
// (under public/camera/ in both apps) rather than a full URL — the admin
// needs it loaded under its own /admin/ base to measure pixel size, while
// the saved camera_specs row needs it root-relative for the storefront to
// resolve — one filename, two different prefixes applied by the caller.
export function legacyRealPhotoRect(
  style: LegacyCamStyle,
  W: number,
  H: number,
): { file: string; left: number; top: number; width: number; height: number } {
  switch (style) {
    case 'ip17-plateau': {
      const mx = W * 0.06, my = W * 0.03;
      const pw = W - mx * 2, bh = pw * (141 / 222);
      return { file: 'i17pro-silver.png', left: mx, top: my, width: pw, height: bh };
    }
    case 'ip17-air': {
      const mx = W * 0.05, my = H * 0.035;
      const pw = W - mx * 2, bh = pw * (215 / 584);
      return { file: 'i17air-skyblue.png', left: mx, top: my, width: pw, height: bh };
    }
    case 'ip-vert': {
      const pillInsetX = W * 0.05, pillInsetY = H * 0.02;
      const pw = W * 0.5, bh = pw * (1234 / 1055);
      const mx = pillInsetX - (215 / 1055) * pw, my = pillInsetY - (113 / 1234) * bh;
      return { file: 'ip17-blue.png', left: mx, top: my, width: pw, height: bh };
    }
    case 'ip15-square': {
      const s = W * 0.5, inset = W * 0.04;
      return { file: 'ip15pro-square.png', left: inset, top: inset, width: s, height: s * (335 / 321) };
    }
    case 'ip11pro-square': {
      const s = W * 0.5, px = W * 0.05, py = H * 0.04;
      return { file: 'ip11pro-square.png', left: px, top: py, width: s, height: s * (233 / 215) };
    }
    case 'ip12pro-square': {
      const s = W * 0.5, px = W * 0.05, py = H * 0.04;
      return { file: 'ip12pro-square.png', left: px, top: py, width: s, height: s * (255 / 238) };
    }
    case 'ip13pro-square': {
      const s = W * 0.5, px = W * 0.05, py = H * 0.04;
      return { file: 'ip13pro-square.png', left: px, top: py, width: s, height: s * (316 / 306) };
    }
    case 'ip14pro-square': {
      const s = W * 0.5, px = W * 0.05, py = H * 0.04;
      return { file: 'ip14pro-square.png', left: px, top: py, width: s, height: s * (338 / 326) };
    }
    case 'ip13-diag': {
      const s = W * 0.45, px = W * 0.05, py = H * 0.04;
      return { file: 'ip13-diag.png', left: px, top: py, width: s, height: s * (244 / 243) };
    }
    case 'ip15-diag': {
      const s = W * 0.45, px = W * 0.05, py = H * 0.04;
      return { file: 'ip15-diag.png', left: px, top: py, width: s, height: s * (265 / 264) };
    }
    case 'ip-dual-vert': {
      const s = W * 0.45, px = W * 0.05, py = H * 0.04;
      return { file: 'ip11-dualvert.png', left: px, top: py, width: s, height: s * (226 / 200) };
    }
  }
}

// Native pixel size of an already-public image — needed because CameraSpec's
// `image.wPx/hPx` must be the photo's OWN pixel dimensions (scaleMmPerPx
// converts those to mm), not the render-box size above.
export function loadImageSize(url: string): Promise<{ w: number; h: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve({ w: img.naturalWidth, h: img.naturalHeight });
    img.onerror = reject;
    img.src = url;
  });
}
