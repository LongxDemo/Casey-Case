// AUTO-GENERATED from /shared/CameraSVG.tsx — do not edit this copy.
// Edit the source file, then run `node shared/sync.mjs` (or just
// `npm install` in admin/ or storefront/, which does it automatically).

import { useId } from 'react';

// All distances in mm, in the phone body's own coordinate space: origin
// (0,0) = top-left corner of the phone, x right, y down. Phone width/height
// come from MODELS (lib/types.ts) — not duplicated here, so they can't drift.
export type IslandShape = 'rounded-rect' | 'rounded-square' | 'pill' | 'compound' | 'irregular' | 'none';

export type CameraSpec = {
  mounting: string;
  island: {
    shape: IslandShape;
    xMm: number; yMm: number; widthMm: number; heightMm: number; cornerRadiusMm: number;
    extra?: { shape: 'circle'; xMm: number; yMm: number; diameterMm: number }[];
    notch?: { xMm: number; yMm: number; widthMm: number; heightMm: number };
  };
  lenses: { label: string; xMm: number; yMm: number; diameterMm: number; ringMm: number }[];
  flash: { xMm: number; yMm: number; diameterMm: number } | null;
  sensors: { type: string; xMm: number; yMm: number; diameterMm: number }[];
  /** A real cropped camera-module photo (transparent background), used
   *  instead of the island/lenses/flash/sensors shapes above when present.
   *  wPx/hPx are the source image's own pixel size; scaleMmPerPx converts
   *  that into the same mm space as everything else here. marginMm controls
   *  how much bigger the die-cut cutout is than the photo itself (defaults
   *  to 1.2mm, same as the vector shapes) — adjustable per model since a
   *  bigger module needs a bigger cutout margin than a small one. */
  image?: { url: string; wPx: number; hPx: number; xMm: number; yMm: number; scaleMmPerPx: number; marginMm?: number } | null;
};

function roundedRectPath(x: number, y: number, w: number, h: number, r: number): string {
  const rr = Math.max(0, Math.min(r, w / 2, h / 2));
  return `M${x + rr},${y} H${x + w - rr} A${rr},${rr} 0 0 1 ${x + w},${y + rr} V${y + h - rr} A${rr},${rr} 0 0 1 ${x + w - rr},${y + h} H${x + rr} A${rr},${rr} 0 0 1 ${x},${y + h - rr} V${y + rr} A${rr},${rr} 0 0 1 ${x + rr},${y} Z`;
}

/** The island's own silhouette as an SVG path — reused for both the plate fill and (expanded) the case die-cut/print-safe outline. */
export function islandSilhouettePath(island: CameraSpec['island'], marginMm = 0): string {
  const x = island.xMm - marginMm, y = island.yMm - marginMm;
  const w = island.widthMm + marginMm * 2, h = island.heightMm + marginMm * 2;
  if (island.shape === 'pill' || island.shape === 'compound') {
    let d = roundedRectPath(x, y, w, h, h / 2);
    if (island.extra) {
      for (const e of island.extra) {
        const r = e.diameterMm / 2 + marginMm;
        d += ` M${e.xMm - r},${e.yMm} A${r},${r} 0 1 0 ${e.xMm + r},${e.yMm} A${r},${r} 0 1 0 ${e.xMm - r},${e.yMm} Z`;
      }
    }
    return d;
  }
  if (island.shape === 'irregular' && island.notch) {
    // Carve the notch out with an even-odd fill — the real module isn't a
    // clean rectangle, one side is shorter than the other.
    const outer = roundedRectPath(x, y, w, h, island.cornerRadiusMm + marginMm);
    const n = island.notch;
    const inner = roundedRectPath(n.xMm - marginMm, n.yMm - marginMm, n.widthMm + marginMm * 2, n.heightMm + marginMm * 2, marginMm);
    return `${outer} ${inner}`;
  }
  return roundedRectPath(x, y, w, h, island.cornerRadiusMm + marginMm * 0.6);
}

/** Case die-cut cutout: hugs the island's own shape with an even margin — no big blocky rectangle. */
export function cameraCutoutPath(island: CameraSpec['island'], marginMm = 1.2): string {
  return islandSilhouettePath(island, marginMm);
}

function Lens({ id, x, y, d, ring }: { id: string; x: number; y: number; d: number; ring: number }) {
  const r = d / 2;
  return (
    <g>
      <circle cx={x} cy={y} r={r} fill={`url(#${id}-ring)`} />
      <circle cx={x} cy={y} r={r - ring} fill={`url(#${id}-glass)`} />
      <circle cx={x} cy={y} r={(r - ring) * 0.78} fill="#000" opacity={0.35} />
      {/* small off-center coating reflection — never a centered flat dot */}
      <ellipse cx={x - (r - ring) * 0.22} cy={y - (r - ring) * 0.3} rx={(r - ring) * 0.32} ry={(r - ring) * 0.2} fill={`url(#${id}-glint)`} opacity={0.8} transform={`rotate(-25 ${x - (r - ring) * 0.22} ${y - (r - ring) * 0.3})`} />
      <circle cx={x - (r - ring) * 0.3} cy={y - (r - ring) * 0.34} r={(r - ring) * 0.08} fill="#fff" opacity={0.65} />
    </g>
  );
}

function Flash({ id, x, y, d }: { id: string; x: number; y: number; d: number }) {
  const r = d / 2;
  return (
    <g>
      <circle cx={x} cy={y} r={r} fill={`url(#${id}-flashring)`} stroke="rgba(170,170,190,0.4)" strokeWidth={Math.max(0.05, d * 0.05)} />
      <circle cx={x - r * 0.15} cy={y - r * 0.2} r={r * 0.4} fill={`url(#${id}-flashglow)`} />
    </g>
  );
}

function SensorDot({ id, x, y, d }: { id: string; x: number; y: number; d: number }) {
  const r = d / 2;
  return <circle cx={x} cy={y} r={r} fill={`url(#${id}-dot)`} stroke="rgba(255,255,255,0.15)" strokeWidth={Math.max(0.03, d * 0.06)} />;
}

/**
 * Renders a realistic-but-simple camera module from a mm-space spec, in the
 * SAME coordinate space as the phone body (0,0 = phone's top-left corner).
 * Meant to be dropped inside an <svg viewBox="0 0 {widthMm} {heightMm}">
 * that also draws the rest of the case, so every number here is a literal mm
 * position/size — no separate px scale math needed.
 */
export function CameraSVG({ spec, tint = '#3a3c42' }: { spec: CameraSpec; tint?: string }) {
  const uid = useId().replace(/[:]/g, '');
  const id = `cam-${uid}`;
  const island = spec.island;
  const hasPlate = island.shape !== 'none';

  return (
    <g>
      <defs>
        <linearGradient id={`${id}-plate`} x1="0" y1="0" x2="0.4" y2="1">
          <stop offset="0%" stopColor={tint} stopOpacity={1} />
          <stop offset="100%" stopColor="#000" stopOpacity={0.22} />
        </linearGradient>
        <linearGradient id={`${id}-sheen`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="30%" stopColor="#fff" stopOpacity={0} />
          <stop offset="48%" stopColor="#fff" stopOpacity={0.14} />
          <stop offset="62%" stopColor="#fff" stopOpacity={0} />
        </linearGradient>
        <radialGradient id={`${id}-ring`} cx="42%" cy="35%" r="65%">
          <stop offset="0%" stopColor="#3a3a40" />
          <stop offset="60%" stopColor="#1c1c20" />
          <stop offset="100%" stopColor="#070708" />
        </radialGradient>
        <radialGradient id={`${id}-glass`} cx="42%" cy="35%" r="65%">
          <stop offset="0%" stopColor="#15161a" />
          <stop offset="55%" stopColor="#060608" />
          <stop offset="100%" stopColor="#000" />
        </radialGradient>
        <linearGradient id={`${id}-glint`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#8fb6ff" />
          <stop offset="55%" stopColor="#c878f0" stopOpacity={0.85} />
          <stop offset="100%" stopColor="#ff96be" stopOpacity={0.5} />
        </linearGradient>
        <radialGradient id={`${id}-flashring`} cx="38%" cy="32%" r="70%">
          <stop offset="0%" stopColor="#fffef8" />
          <stop offset="55%" stopColor="#f3ecdd" />
          <stop offset="100%" stopColor="#d8d1c2" />
        </radialGradient>
        <radialGradient id={`${id}-flashglow`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#ffd68c" stopOpacity={0.6} />
          <stop offset="100%" stopColor="#ffd68c" stopOpacity={0} />
        </radialGradient>
        <radialGradient id={`${id}-dot`} cx="35%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#2b2c36" />
          <stop offset="100%" stopColor="#0b0a10" />
        </radialGradient>
      </defs>

      {hasPlate && (
        <>
          <path d={islandSilhouettePath(island)} fill={`url(#${id}-plate)`} />
          <path d={islandSilhouettePath(island)} fill="none" stroke="rgba(0,0,0,0.35)" strokeWidth={0.3} />
          <path d={islandSilhouettePath(island)} fill={`url(#${id}-sheen)`} />
        </>
      )}

      {spec.lenses.map((l, i) => (
        <Lens key={i} id={`${id}-l${i}`} x={l.xMm} y={l.yMm} d={l.diameterMm} ring={l.ringMm} />
      ))}
      {spec.flash && <Flash id={id} x={spec.flash.xMm} y={spec.flash.yMm} d={spec.flash.diameterMm} />}
      {spec.sensors.map((s, i) => (
        <SensorDot key={i} id={id} x={s.xMm} y={s.yMm} d={s.diameterMm} />
      ))}
    </g>
  );
}
