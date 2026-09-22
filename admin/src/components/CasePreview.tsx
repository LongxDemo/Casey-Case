import { CANVAS_BASE, MODELS, sizeForModel } from '../lib/types';
import type { CaseBackground, Layer, PhoneModel } from '../lib/types';
import { FRAME_DEFS } from '../lib/frames';

export function CasePreview({
  background,
  layers,
  modelId,
  width,
}: {
  background: CaseBackground | null;
  layers: Layer[];
  modelId: string | null;
  /** Render width for the WIDEST phone in the catalog — other models scale down proportionally (real relative size, not a fixed box). */
  width: number;
}) {
  const model = (modelId && MODELS[modelId]) || MODELS.ip15pm;
  const { width: renderWidth, height } = sizeForModel(model, width);
  const scale = renderWidth / CANVAS_BASE;
  const radius = renderWidth * 0.14;
  const colors = background?.colors?.length ? background.colors : ['#FFF5FA', '#FFE9F4'];
  const ordered = [...(layers || [])].sort((a, b) => a.z - b.z);

  return (
    <div
      style={{
        width: renderWidth,
        height,
        borderRadius: radius,
        position: 'relative',
        overflow: 'hidden',
        // Soft studio key-light from the top left over the case color.
        background: `radial-gradient(120% 90% at 26% 10%, rgba(255,255,255,0.25), rgba(255,255,255,0) 55%), linear-gradient(155deg, ${colors[0]}, ${colors[colors.length - 1]})`,
        // Grounded product-photo shadow + a crisp 1px seam and thin edge
        // catch-light instead of a thick colored outline (reads as a sticker).
        boxShadow: [
          '0 24px 48px -18px rgba(20,10,20,0.45)',
          '0 8px 18px -10px rgba(20,10,20,0.3)',
          'inset 0 0 0 1px rgba(0,0,0,0.1)',
          'inset 0 1px 1px rgba(255,255,255,0.35)',
          'inset 0 -1px 2px rgba(0,0,0,0.18)',
        ].join(', '),
      }}
    >
      {ordered.map((l) => (
        <LayerView key={l.id} layer={l} scale={scale} />
      ))}
      <CameraModule style={camStyleFor(model)} width={renderWidth} height={height} tint={colors[0]} />
      {/* subtle printed-case sheen */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          background: 'linear-gradient(135deg, rgba(255,255,255,0) 38%, rgba(255,255,255,0.1) 50%, rgba(255,255,255,0) 62%)',
        }}
      />
    </div>
  );
}

function LayerView({ layer, scale }: { layer: Layer; scale: number }) {
  const transform = `translate(-50%, -50%) translate(${layer.tx * scale}px, ${layer.ty * scale}px) scale(${layer.scale}) rotate(${layer.rotation}rad)`;
  const base: React.CSSProperties = {
    position: 'absolute',
    left: '50%',
    top: '50%',
    transform,
    transformOrigin: 'center',
  };

  if (layer.kind === 'sticker') {
    const s = layer.size * scale;
    return layer.uri ? (
      <img src={layer.uri} alt="" style={{ ...base, width: s, height: s, objectFit: 'contain' }} />
    ) : (
      <div style={{ ...base, fontSize: s * 0.9, lineHeight: 1 }}>{layer.emoji}</div>
    );
  }
  if (layer.kind === 'image') {
    return (
      <img
        src={layer.uri}
        alt=""
        style={{ ...base, width: layer.width * scale, height: layer.height * scale, borderRadius: (layer.radius ?? 0) * scale, objectFit: 'cover' }}
      />
    );
  }
  if (layer.kind === 'frame') {
    const def = FRAME_DEFS[layer.frameId];
    if (!def) return null;
    const w = def.width * scale;
    const h = def.height * scale;
    const { hole } = def;
    const FrameSvg = def.Svg;
    return (
      <div style={{ ...base, width: w, height: h }}>
        <div
          style={{
            position: 'absolute',
            left: `${hole.xPct}%`,
            top: `${hole.yPct}%`,
            width: `${hole.wPct}%`,
            height: `${hole.hPct}%`,
            borderRadius: '50%',
            overflow: 'hidden',
            background: layer.photoUri ? undefined : '#f0e6ea',
          }}
        >
          {layer.photoUri && (
            <img
              src={layer.photoUri}
              alt=""
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                transform: `translate(${layer.photoTx}px, ${layer.photoTy}px) scale(${layer.photoScale})`,
              }}
            />
          )}
        </div>
        <FrameSvg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} />
      </div>
    );
  }
  return (
    <div
      style={{
        ...base,
        width: 240 * scale,
        color: layer.color,
        fontSize: layer.fontSize * scale,
        fontWeight: layer.fontWeight as any,
        textAlign: layer.align,
        lineHeight: 1.1,
        whiteSpace: 'pre-wrap',
      }}
    >
      {layer.text}
    </div>
  );
}

/* ───────────────────────── Realistic camera module (CSS) ─────────────────────────
   Mirrors storefront/src/components/CasePreview.tsx — same brand→layout mapping. */

// From the iPhone 17 generation, the Pros and the Air use a full-width camera
// plateau flush with the top of the phone — 'ip17-plateau' (triple lens) and
// 'ip17-air' (single lens). The base 17 kept the 16-style vertical pill, and
// pre-17 iPhones keep the old cluster styles.
type CamStyle =
  | 'ip17-plateau' | 'ip17-air' | 'ip-square' | 'ip-vert' | 'ip-dual' | 'ip-dual-vert' | 'ip-single'
  | 'samsung' | 'samsung-ultra' | 'zflip'
  | 'pixel' | 'pixel-pro' | 'pixel-island'
  | 'xiaomi' | 'oneplus' | 'oppo' | 'generic';

function camStyleFor(model: PhoneModel): CamStyle {
  if (model.brand === 'Google') {
    // Pixel 9 moved from the edge-to-edge visor to a floating pill island.
    if (model.id === 'pixel9p') return 'pixel-island';
    if (model.id === 'pixel8pro') return 'pixel-pro';
    return 'pixel';
  }
  if (model.brand === 'Samsung') {
    if (model.id === 'zflip5') return 'zflip';
    if (model.id === 's24u' || model.id === 's23u') return 'samsung-ultra';
    return 'samsung'; // slabs + the Fold's rear cover: bare vertical lenses
  }
  if (model.brand === 'Xiaomi') return 'xiaomi'; // Xiaomi 14 + Redmi Note: square 2x2 island
  if (model.brand === 'OnePlus') return 'oneplus';
  if (model.brand === 'OPPO') return 'oppo';
  if (model.brand === 'iPhone') {
    const n = model.name;
    if (n.startsWith('17 Pro')) return 'ip17-plateau';
    if (n === 'Air') return 'ip17-air';
    // Base 17 kept the 16-style vertical dual pill — only Air and the Pros
    // moved to the full-width plateau.
    if (n === '17') return 'ip-vert';
    if (n.includes('Pro')) return 'ip-square';
    if (n.startsWith('16')) return 'ip-vert';
    if (n.startsWith('SE')) return 'ip-single';
    // 13/14/15 use the diagonal pair; 11/12 stack both lenses vertically
    // on the module's left (per Apple's dual-camera timeline).
    if (n.startsWith('12') || n.startsWith('11')) return 'ip-dual-vert';
    return 'ip-dual';
  }
  return 'generic';
}

// On a real printed/molded case, the camera cutout is a blank die-cut
// hole — the print film can't reach the raised camera bump/plateau, so
// that whole area is left as bare case material (the case's own molded
// color) with no lens/flash graphics on it. `tint` is the case's own
// background color, mixed lighter/darker for the raised-edge shading.
function plateGradient(tint: string) {
  // Near-flat: the real plateau is matte with barely-visible shading — a
  // strong light-to-dark sweep reads as a glossy toy dome.
  return `linear-gradient(160deg, color-mix(in srgb, ${tint} 92%, white), color-mix(in srgb, ${tint} 88%, black))`;
}

function Plate({ l, t, w, h, r, tint }: { l: number; t: number; w: number; h: number; r: number | string; tint: string }) {
  return (
    <div
      style={{
        position: 'absolute',
        left: l,
        top: t,
        width: w,
        height: h,
        borderRadius: r,
        // Soft top light over near-flat matte metal.
        background: `linear-gradient(180deg, rgba(255,255,255,0.16), rgba(255,255,255,0) 34%), ${plateGradient(tint)}`,
        // Crisp thin seam + soft contact shadow reads as a precise molded
        // edge instead of a raised sticker with fat highlight strokes.
        boxShadow: [
          `0 ${Math.max(1, h * 0.03)}px ${Math.max(2, h * 0.08)}px rgba(10,8,18,0.22)`,
          'inset 0 0 0 1px rgba(0,0,0,0.1)',
          'inset 0 1px 0.5px rgba(255,255,255,0.25)',
          `inset 0 -${Math.max(1, h * 0.02)}px ${Math.max(1.5, h * 0.04)}px rgba(10,8,18,0.12)`,
        ].join(', '),
      }}
    />
  );
}

export function CameraModule({ style, width: W, height: H, tint }: { style: CamStyle; width: number; height: number; tint: string }) {
  if (style === 'ip17-plateau') {
    // Inset from the phone's edges with a case-material border on all
    // four sides, all four corners rounded — verified against a real
    // printed 17 Pro case.
    const mx = W * 0.045, my = H * 0.045;
    const pw = W - mx * 2, bh = W * 0.5;
    return <Plate l={mx} t={my} w={pw} h={bh} r={bh * 0.22} tint={tint} />;
  }
  if (style === 'ip17-air') {
    // Same inset-with-border treatment as the Pro plateau — full width
    // minus a case-material margin, rounded on all four corners.
    const mx = W * 0.045, my = H * 0.045;
    const pw = W - mx * 2, ph = W * 0.27;
    return <Plate l={mx} t={my} w={pw} h={ph} r={ph * 0.32} tint={tint} />;
  }
  if (style === 'ip-vert') {
    // Spec table: ~30x55mm pill on a 71.6mm-wide body -> width 0.42,
    // elongated 1.83x (55/30).
    const s = W * 0.42, px = W * 0.05, py = H * 0.045, sh = s * 1.83;
    return <Plate l={px} t={py} w={s} h={sh} r={s * 0.5} tint={tint} />;
  }
  if (style === 'ip-square') {
    // Spec table bump figures for 15 Pro/16 Pro/16 Pro Max average ~0.50 of
    // body width (38-40mm on 70.6-77.6mm bodies).
    const s = W * 0.5, px = W * 0.06, py = H * 0.045;
    return <Plate l={px} t={py} w={s} h={s} r={s * 0.28} tint={tint} />;
  }
  if (style === 'ip-dual') {
    // Spec table bump figures for 11/12/13/14 average ~0.45 of body width
    // (30-35mm on 71.5-75.7mm bodies). Measured against a real 13/14 case
    // photo: the module is nearly SQUARE (~1.04x taller than wide).
    const s = W * 0.45, px = W * 0.05, py = H * 0.04, sh = s * 1.04;
    return <Plate l={px} t={py} w={s} h={sh} r={s * 0.32} tint={tint} />;
  }
  if (style === 'ip-dual-vert') {
    // 11/12: square-ish module, both lenses stacked vertically on the left.
    const s = W * 0.45, px = W * 0.05, py = H * 0.04, sh = s * 1.15;
    return <Plate l={px} t={py} w={s} h={sh} r={s * 0.32} tint={tint} />;
  }
  if (style === 'ip-single') {
    // SE / iPhone 8 body: a small bare-lens housing top-left. Real housing
    // is small (~15mm on a 67mm body), not a Pro-sized lens.
    const ld = W * 0.22;
    return <Plate l={W * 0.06 - ld * 0.15} t={H * 0.045 - ld * 0.15} w={ld * 1.6} h={ld * 1.3} r={ld * 0.4} tint={tint} />;
  }
  if (style === 'samsung' || style === 'samsung-ultra') {
    // S/A-series and the Fold's rear: a tall blank channel clearing the
    // individually-mounted vertical lenses (plus the Ultra's periscope
    // column on the right).
    const ld = W * 0.145, lx = W * 0.07, ty = H * 0.045, gap = ld * 1.24;
    const w = style === 'samsung-ultra' ? ld * 2.5 : ld * 1.3;
    return <Plate l={lx - ld * 0.12} t={ty - ld * 0.12} w={w} h={gap * 2 + ld * 1.25} r={ld * 0.35} tint={tint} />;
  }
  if (style === 'zflip') {
    // Closed Flip: the big cover-screen glass dominates the face — real
    // hardware, not a print cutout, so it keeps its own dark-glass look —
    // with a small blank channel for the dual camera at bottom right.
    const m = W * 0.045, sh = H * 0.66, ld = W * 0.15;
    const cy = sh + (H * 0.82 - sh - ld) / 2 + H * 0.03;
    return (
      <>
        <div
          style={{
            position: 'absolute', left: m, top: m, width: W - m * 2, height: sh, borderRadius: W * 0.1,
            background: 'linear-gradient(145deg, #23242c 0%, #0b0c11 55%, #14151c 100%)',
            boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.12), 0 2px 6px rgba(10,8,18,0.3)',
          }}
        />
        <div
          style={{
            position: 'absolute', left: m, top: m, width: W - m * 2, height: sh, borderRadius: W * 0.1,
            background: 'linear-gradient(115deg, rgba(255,255,255,0) 42%, rgba(255,255,255,0.09) 50%, rgba(255,255,255,0) 58%)',
          }}
        />
        <Plate l={W * 0.52 - ld * 0.12} t={cy - ld * 0.12} w={ld * 2.9} h={ld * 1.3} r={ld * 0.4} tint={tint} />
      </>
    );
  }
  if (style === 'pixel' || style === 'pixel-pro') {
    // Pixel 7/8 visor: an edge-to-edge blank bar.
    const by = H * 0.065, bh = W * 0.17;
    return <Plate l={0} t={by} w={W} h={bh} r={0} tint={tint} />;
  }
  if (style === 'pixel-island') {
    // Pixel 9: the visor became a floating pill island with clear margins.
    const iw = W * 0.86, ih = W * 0.22, ix = (W - iw) / 2, iy = H * 0.055;
    return <Plate l={ix} t={iy} w={iw} h={ih} r={ih / 2} tint={tint} />;
  }
  if (style === 'xiaomi') {
    // Xiaomi 14 / Redmi Note: rounded-square island.
    const s = W * 0.44, px = W * 0.06, py = H * 0.045;
    return <Plate l={px} t={py} w={s} h={s} r={s * 0.28} tint={tint} />;
  }
  if (style === 'oneplus') {
    // OnePlus 12: the signature big circular module joined to the left
    // edge by a short wing, both blank.
    const d = W * 0.46, cx = W * 0.1, cy = H * 0.045;
    return (
      <>
        <div style={{ position: 'absolute', left: 0, top: cy + d * 0.36, width: cx + d * 0.3, height: d * 0.28, background: plateGradient(tint), boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.08)' }} />
        <Plate l={cx} t={cy} w={d} h={d} r="50%" tint={tint} />
      </>
    );
  }
  if (style === 'oppo') {
    // Reno 11: tall oval island.
    const ow = W * 0.34, oh = ow * 1.72, px = W * 0.06, py = H * 0.04;
    return <Plate l={px} t={py} w={ow} h={oh} r={ow / 2} tint={tint} />;
  }
  const s = W * 0.3, px = W * 0.06, py = H * 0.04;
  return <Plate l={px} t={py} w={s} h={s} r={s * 0.3} tint={tint} />;
}
