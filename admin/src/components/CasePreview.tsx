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
  const keyLight = 'radial-gradient(120% 90% at 26% 10%, rgba(255,255,255,0.25), rgba(255,255,255,0) 55%)';
  const isGingham = background?.pattern === 'gingham';
  // Woven picnic-check: two crossing sets of translucent stripes multiplied
  // over a cream base — a generic textile pattern, not a copied image.
  const cell = renderWidth * 0.09;
  const backgroundLayers = isGingham
    ? {
        backgroundColor: colors[0],
        backgroundImage: [
          keyLight,
          `repeating-linear-gradient(0deg, ${colors[1]}73 0px, ${colors[1]}73 ${cell}px, transparent ${cell}px, transparent ${cell * 2}px)`,
          `repeating-linear-gradient(90deg, ${colors[1]}73 0px, ${colors[1]}73 ${cell}px, transparent ${cell}px, transparent ${cell * 2}px)`,
        ].join(', '),
        backgroundBlendMode: 'normal, multiply, multiply',
      }
    : { background: `${keyLight}, linear-gradient(155deg, ${colors[0]}, ${colors[colors.length - 1]})` };

  return (
    <div
      style={{
        width: renderWidth,
        height,
        borderRadius: radius,
        position: 'relative',
        overflow: 'hidden',
        ...backgroundLayers,
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
      {/* Real printed cases leave a thin strip of the case's own (black)
          material unprinted around the edge — the print film never reaches
          the true edge. Drawn on TOP of the layers/photo so it still shows
          even on a full edge-to-edge "Fit to Case" photo, matching the
          actual product. */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          borderRadius: radius,
          boxShadow: `inset 0 0 0 ${Math.max(3, renderWidth * 0.032)}px #0c0c0f`,
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
    const w = layer.width * scale, h = layer.height * scale, r = (layer.radius ?? 0) * scale;
    return layer.uri ? (
      <img src={layer.uri} alt="" style={{ ...base, width: w, height: h, borderRadius: r, objectFit: 'cover' }} />
    ) : (
      <div style={{ ...base, width: w, height: h, borderRadius: r, background: '#f0e6ea', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: Math.min(w, h) * 0.16 }}>
        📷
      </div>
    );
  }
  if (layer.kind === 'frame') {
    const def = FRAME_DEFS[layer.frameId];
    if (!def) return null;
    const w = def.width * scale;
    const h = def.height * scale;
    const { hole } = def;
    const FrameSvg = def.Svg;
    const overlayStyle: React.CSSProperties = { position: 'absolute', inset: 0, width: '100%', height: '100%' };
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
        {def.image ? <img src={def.image} alt="" style={overlayStyle} /> : FrameSvg ? <FrameSvg style={overlayStyle} /> : null}
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

// The die-cut hole is an actual opening in the case, not printed/molded
// case material — you see straight through it to the phone's own camera
// glass/housing underneath, so it can never take on the customer's chosen
// case color. Render it as the phone's own dark hardware tone instead.
const EXPOSED_METAL_TINT = '#2c2c31';

function Plate({ l, t, w, h, r, tint, caseTint }: { l: number; t: number; w: number; h: number; r: number | string; tint: string; caseTint: string }) {
  // The ring framing the die-cut hole IS real case material — it must be
  // the customer's actual case color, not a fixed white (checked against a
  // real black case: the ring around the camera is black, not white).
  const ringColor = `color-mix(in srgb, ${caseTint} 88%, white)`;
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
        // edge, plus a case-colored ring so the cutout boundary reads as
        // real material framing it, not a printed sticker outline.
        boxShadow: [
          `0 ${Math.max(1, h * 0.03)}px ${Math.max(2, h * 0.08)}px rgba(10,8,18,0.22)`,
          `inset 0 0 0 ${Math.max(4, h * 0.07)}px ${ringColor}`,
          'inset 0 1px 0.5px rgba(255,255,255,0.25)',
          `inset 0 -${Math.max(1, h * 0.02)}px ${Math.max(1.5, h * 0.04)}px rgba(10,8,18,0.12)`,
        ].join(', '),
      }}
    />
  );
}

// A real camera lens is a mostly BLACK barrel — a bright chrome/silver ring
// is what makes a lens read as a toy/drawing. Concentric dark bands suggest
// the barrel's depth, the glass itself is near-black and glossy, and the
// only real color comes from a small, OFF-CENTER, blue-violet-pink
// coating reflection — never a centered flat white dot.
function Lens({ size, left, top }: { size: number; left: number; top: number }) {
  return (
    <div
      style={{
        position: 'absolute',
        left,
        top,
        width: size,
        height: size,
        borderRadius: '50%',
        background: [
          'radial-gradient(circle at 50% 50%, transparent 74%, rgba(255,255,255,0.05) 77%, transparent 80%)',
          'radial-gradient(circle at 40% 35%, #2a2a30 0%, #141417 40%, #050506 100%)',
        ].join(', '),
        boxShadow: '0 1px 2px rgba(0,0,0,0.55), inset 0 0 0 1px rgba(255,255,255,0.06)',
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: '22%',
          borderRadius: '50%',
          overflow: 'hidden',
          background: 'radial-gradient(circle at 42% 38%, #1b1e24 0%, #0a0b0e 45%, #000 100%)',
          boxShadow: 'inset 0 0 3px rgba(0,0,0,0.95), inset 0 0 0 1px rgba(255,255,255,0.05)',
        }}
      >
        <div
          style={{
            position: 'absolute',
            left: '26%',
            top: '34%',
            width: '34%',
            height: '24%',
            borderRadius: '50%',
            background: 'linear-gradient(120deg, rgba(130,175,255,0.55), rgba(200,120,240,0.4) 55%, rgba(255,150,190,0.25))',
            filter: 'blur(0.4px)',
          }}
        />
        <div style={{ position: 'absolute', left: '31%', top: '38%', width: '10%', height: '7%', borderRadius: '50%', background: 'rgba(255,255,255,0.55)' }} />
      </div>
    </div>
  );
}

// LED flash — warm cream diffuser with a glowing core, not a lens.
function Flash({ size, left, top }: { size: number; left: number; top: number }) {
  return (
    <div
      style={{
        position: 'absolute',
        left,
        top,
        width: size,
        height: size,
        borderRadius: '50%',
        overflow: 'hidden',
        border: `${Math.max(0.6, size * 0.06)}px solid rgba(170,170,190,0.45)`,
        background: 'radial-gradient(circle at 38% 32%, #fffef8 0%, #f3ecdd 45%, #d8d1c2 100%)',
        boxShadow: `inset 0 ${Math.max(0.5, size * 0.04)}px ${Math.max(1, size * 0.08)}px rgba(120,110,90,0.35)`,
      }}
    >
      <div
        style={{
          position: 'absolute',
          left: size * 0.3,
          top: size * 0.3,
          width: size * 0.4,
          height: size * 0.4,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255,214,140,0.55), rgba(255,214,140,0) 75%)',
        }}
      />
      {size >= 12 && (
        <div
          style={{
            position: 'absolute',
            left: size * 0.16,
            top: size * 0.12,
            width: size * 0.32,
            height: size * 0.16,
            borderRadius: size * 0.16,
            background: 'rgba(255,255,255,0.75)',
            transform: 'rotate(-18deg)',
          }}
        />
      )}
    </div>
  );
}

// Small dark sensor dot — mic pinhole, laser AF, or LiDAR emitter.
function Dot({ size, left, top }: { size: number; left: number; top: number }) {
  return (
    <div
      style={{
        position: 'absolute',
        left,
        top,
        width: size,
        height: size,
        borderRadius: '50%',
        background: 'radial-gradient(circle at 35% 30%, #2b2c36 0%, #0b0a10 65%)',
        border: `${Math.max(0.6, size * 0.08)}px solid rgba(255,255,255,0.16)`,
        boxShadow: `inset ${size * 0.08}px ${size * 0.1}px ${size * 0.14}px rgba(255,255,255,0.18)`,
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
    // Real triple-camera cluster sits on the LEFT side of the plateau, not
    // spread edge-to-edge — two lenses stacked, a third tucked to their right.
    const ld = bh * 0.43, pad = bh * 0.065, clx = mx + W * 0.055;
    return (
      <>
        <Plate l={mx} t={my} w={pw} h={bh} r={bh * 0.22} tint={EXPOSED_METAL_TINT} caseTint={tint} />
        <Lens size={ld} left={clx} top={my + pad} />
        <Lens size={ld} left={clx} top={my + bh - ld - pad} />
        <Lens size={ld} left={clx + ld * 0.95} top={my + (bh - ld) / 2} />
        <Flash size={W * 0.075} left={mx + pw * 0.83} top={my + bh * 0.14} />
        <Dot size={W * 0.075} left={mx + pw * 0.76} top={my + bh * 0.52} />
        <Dot size={W * 0.028} left={mx + pw * 0.88} top={my + bh * 0.4} />
      </>
    );
  }
  if (style === 'ip17-air') {
    // Same inset-with-border treatment as the Pro plateau — full width
    // minus a case-material margin, rounded on all four corners.
    const mx = W * 0.045, my = H * 0.045;
    const pw = W - mx * 2, ph = W * 0.27;
    const ld = ph * 0.7;
    return (
      <>
        <Plate l={mx} t={my} w={pw} h={ph} r={ph * 0.32} tint={EXPOSED_METAL_TINT} caseTint={tint} />
        <Lens size={ld} left={mx + pw * 0.07} top={my + (ph - ld) / 2} />
        {/* Flash + mic sit right beside the lens, not far out on the empty side. */}
        <Flash size={ph * 0.22} left={mx + pw * 0.33} top={my + ph * 0.3} />
        <Dot size={ph * 0.1} left={mx + pw * 0.42} top={my + ph * 0.48} />
      </>
    );
  }
  if (style === 'ip-vert') {
    // Spec table: ~30x55mm pill on a 71.6mm-wide body -> width 0.42,
    // elongated 1.83x (55/30).
    const s = W * 0.42, px = W * 0.05, py = H * 0.045, sh = s * 1.83;
    const ld = s * 0.76;
    return (
      <>
        <Plate l={px} t={py} w={s} h={sh} r={s * 0.5} tint={EXPOSED_METAL_TINT} caseTint={tint} />
        <Lens size={ld} left={px + (s - ld) / 2} top={py + sh * 0.08} />
        <Lens size={ld} left={px + (s - ld) / 2} top={py + sh - ld - sh * 0.08} />
        <Flash size={s * 0.2} left={px + s * 1.06} top={py + sh * 0.08 + ld * 0.18} />
      </>
    );
  }
  if (style === 'ip-square') {
    // Spec table bump figures for 15 Pro/16 Pro/16 Pro Max average ~0.50 of
    // body width (38-40mm on 70.6-77.6mm bodies). Flush against the case's
    // own top-left corner, not inset from it.
    const s = W * 0.5, px = 0, py = 0;
    const ld = s * 0.36;
    return (
      <>
        <Plate l={px} t={py} w={s} h={s} r={s * 0.28} tint={EXPOSED_METAL_TINT} caseTint={tint} />
        <Lens size={ld} left={px + s * 0.08} top={py + s * 0.08} />
        <Lens size={ld} left={px + s * 0.08} top={py + s * 0.5} />
        <Lens size={ld} left={px + s * 0.44} top={py + s * 0.29} />
        {/* Flash top-right, LiDAR bottom-right — checked against a real
            photo: there's no third small mic dot between them. */}
        <Flash size={ld * 0.4} left={px + s * 0.72} top={py + s * 0.12} />
        <Dot size={ld * 0.34} left={px + s * 0.72} top={py + s * 0.7} />
      </>
    );
  }
  if (style === 'ip-dual') {
    // Spec table bump figures for 11/12/13/14 average ~0.45 of body width
    // (30-35mm on 71.5-75.7mm bodies). Measured against a real 13/14 case
    // photo: the module is nearly SQUARE (~1.04x taller than wide).
    const s = W * 0.45, px = W * 0.05, py = H * 0.04, sh = s * 1.04;
    const ld = s * 0.42;
    return (
      <>
        <Plate l={px} t={py} w={s} h={sh} r={s * 0.32} tint={EXPOSED_METAL_TINT} caseTint={tint} />
        <Lens size={ld} left={px + s * 0.06} top={py + s * 0.06} />
        <Lens size={ld} left={px + s - ld - s * 0.06} top={py + sh - ld - s * 0.06} />
        <Flash size={s * 0.18} left={px + s * 0.68} top={py + s * 0.12} />
        <Dot size={s * 0.08} left={px + s * 0.2} top={py + sh - s * 0.28} />
      </>
    );
  }
  if (style === 'ip-dual-vert') {
    // 11/12: square-ish module, both lenses stacked vertically on the left.
    const s = W * 0.45, px = W * 0.05, py = H * 0.04, sh = s * 1.15;
    const ld = s * 0.42;
    return (
      <>
        <Plate l={px} t={py} w={s} h={sh} r={s * 0.32} tint={EXPOSED_METAL_TINT} caseTint={tint} />
        <Lens size={ld} left={px + s * 0.09} top={py + sh * 0.08} />
        <Lens size={ld} left={px + s * 0.09} top={py + sh - ld - sh * 0.08} />
        <Flash size={s * 0.18} left={px + s * 0.66} top={py + sh * 0.12} />
        <Dot size={s * 0.1} left={px + s * 0.68} top={py + sh * 0.72} />
      </>
    );
  }
  if (style === 'ip-single') {
    // SE / iPhone 8 body: a small bare-lens housing top-left. Real housing
    // is small (~15mm on a 67mm body), not a Pro-sized lens.
    const ld = W * 0.22;
    const bx = W * 0.06 - ld * 0.15, by = H * 0.045 - ld * 0.15;
    const bw = ld * 1.6, bh = ld * 1.3;
    const lensD = ld * 0.85;
    return (
      <>
        <Plate l={bx} t={by} w={bw} h={bh} r={ld * 0.4} tint={EXPOSED_METAL_TINT} caseTint={tint} />
        <Lens size={lensD} left={bx + (bw - lensD) / 2} top={by + (bh - lensD) / 2} />
        <Flash size={ld * 0.24} left={W * 0.06 + ld * 1.08} top={H * 0.045 + ld * 0.14} />
      </>
    );
  }
  if (style === 'samsung' || style === 'samsung-ultra') {
    // S/A-series and the Fold's rear: a tall blank channel clearing the
    // individually-mounted vertical lenses (plus the Ultra's periscope
    // column on the right).
    const ld = W * 0.145, lx = W * 0.07, ty = H * 0.045, gap = ld * 1.24;
    const w = style === 'samsung-ultra' ? ld * 2.5 : ld * 1.3;
    return (
      <>
        <Plate l={lx - ld * 0.12} t={ty - ld * 0.12} w={w} h={gap * 2 + ld * 1.25} r={ld * 0.35} tint={EXPOSED_METAL_TINT} caseTint={tint} />
        <Lens size={ld} left={lx} top={ty} />
        <Lens size={ld} left={lx} top={ty + gap} />
        <Lens size={ld} left={lx} top={ty + gap * 2} />
        {style === 'samsung-ultra' && <Lens size={ld * 0.78} left={lx + ld * 1.5} top={ty + gap * 1.45} />}
        {style === 'samsung-ultra' && <Dot size={ld * 0.22} left={lx + ld * 1.6} top={ty + gap * 0.95} />}
        <Flash size={ld * 0.3} left={lx + ld * 1.5} top={ty + gap * 0.45} />
      </>
    );
  }
  if (style === 'zflip') {
    // Closed Flip: the big cover-screen glass dominates the face — real
    // hardware, not a print cutout, so it keeps its own dark-glass look —
    // with a small blank channel for the dual camera at bottom right.
    const m = W * 0.045, sh = H * 0.66, ld = W * 0.15;
    const cy = sh + (H * 0.82 - sh - ld) / 2 + H * 0.03;
    const lensD = ld * 0.9;
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
        <Plate l={W * 0.52 - ld * 0.12} t={cy - ld * 0.12} w={ld * 2.9} h={ld * 1.3} r={ld * 0.4} tint={EXPOSED_METAL_TINT} caseTint={tint} />
        <Lens size={lensD} left={W * 0.52 + ld * 0.08} top={cy + (ld * 1.3 - lensD) / 2 - ld * 0.12} />
        <Lens size={lensD} left={W * 0.52 + ld * 1.23} top={cy + (ld * 1.3 - lensD) / 2 - ld * 0.12} />
        <Flash size={ld * 0.28} left={W * 0.52 + ld * 2.5} top={cy + ld * 0.36} />
      </>
    );
  }
  if (style === 'pixel' || style === 'pixel-pro') {
    // Pixel 7/8 visor: an edge-to-edge blank bar.
    const by = H * 0.065, bh = W * 0.17;
    const ld = bh * 0.52;
    return (
      <>
        <Plate l={0} t={by} w={W} h={bh} r={0} tint={EXPOSED_METAL_TINT} caseTint={tint} />
        <Lens size={ld} left={W * 0.15} top={by + (bh - ld) / 2} />
        <Lens size={ld} left={W * 0.15 + ld * 1.3} top={by + (bh - ld) / 2} />
        <Flash size={bh * 0.22} left={W * 0.88} top={by + bh * 0.39} />
      </>
    );
  }
  if (style === 'pixel-island') {
    // Pixel 9: the visor became a floating pill island with clear margins.
    const iw = W * 0.86, ih = W * 0.22, ix = (W - iw) / 2, iy = H * 0.055;
    const ld = ih * 0.53;
    return (
      <>
        <Plate l={ix} t={iy} w={iw} h={ih} r={ih / 2} tint={EXPOSED_METAL_TINT} caseTint={tint} />
        {[0.2, 0.5, 0.8].map((f, i) => (
          <Lens key={i} size={ld} left={ix + iw * f - ld / 2} top={iy + (ih - ld) / 2} />
        ))}
        <Flash size={ih * 0.2} left={ix + iw * 0.88} top={iy + ih * 0.4} />
      </>
    );
  }
  if (style === 'xiaomi') {
    // Xiaomi 14 / Redmi Note: rounded-square island, three lenses plus the
    // flash in the fourth corner of the grid.
    const s = W * 0.44, px = W * 0.06, py = H * 0.045;
    const ld = s * 0.36;
    return (
      <>
        <Plate l={px} t={py} w={s} h={s} r={s * 0.28} tint={EXPOSED_METAL_TINT} caseTint={tint} />
        <Lens size={ld} left={px + s * 0.1} top={py + s * 0.1} />
        <Lens size={ld} left={px + s * 0.54} top={py + s * 0.1} />
        <Lens size={ld} left={px + s * 0.1} top={py + s * 0.54} />
        <Flash size={ld * 0.55} left={px + s * 0.54 + ld * 0.22} top={py + s * 0.54 + ld * 0.22} />
      </>
    );
  }
  if (style === 'oneplus') {
    // OnePlus 12: the signature big circular module joined to the left
    // edge by a short wing, three lenses + laser AF inside, flash on the body.
    const d = W * 0.46, cx = W * 0.1, cy = H * 0.045;
    const ld = d * 0.32;
    return (
      <>
        <div style={{ position: 'absolute', left: 0, top: cy + d * 0.36, width: cx + d * 0.3, height: d * 0.28, background: plateGradient(EXPOSED_METAL_TINT), boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.08)' }} />
        <Plate l={cx} t={cy} w={d} h={d} r="50%" tint={EXPOSED_METAL_TINT} caseTint={tint} />
        <Lens size={ld} left={cx + d * 0.14} top={cy + d * 0.14} />
        <Lens size={ld} left={cx + d * 0.54} top={cy + d * 0.14} />
        <Lens size={ld} left={cx + d * 0.14} top={cy + d * 0.54} />
        <Dot size={ld * 0.4} left={cx + d * 0.6} top={cy + d * 0.58} />
        <Flash size={W * 0.06} left={cx + d + W * 0.06} top={cy + d * 0.16} />
      </>
    );
  }
  if (style === 'oppo') {
    // Reno 11: tall oval island — one big main lens, one medium secondary,
    // asymmetric like the real dual-camera (not two equal circles).
    const ow = W * 0.34, oh = ow * 1.72, px = W * 0.06, py = H * 0.04;
    const l1 = ow * 0.74, l2 = ow * 0.56;
    return (
      <>
        <Plate l={px} t={py} w={ow} h={oh} r={ow / 2} tint={EXPOSED_METAL_TINT} caseTint={tint} />
        <Lens size={l1} left={px + (ow - l1) / 2} top={py + ow * 0.16} />
        <Lens size={l2} left={px + (ow - l2) / 2} top={py + oh - l2 - ow * 0.34} />
        <Dot size={ow * 0.1} left={px + ow * 0.45} top={py + oh - ow * 0.18} />
        <Flash size={ow * 0.16} left={px + ow * 1.18} top={py + ow * 0.18} />
      </>
    );
  }
  const s = W * 0.3, px = W * 0.06, py = H * 0.04;
  const ld = s * 0.4;
  return (
    <>
      <Plate l={px} t={py} w={s} h={s} r={s * 0.3} tint={EXPOSED_METAL_TINT} caseTint={tint} />
      <Lens size={ld} left={px + s * 0.12} top={py + s * 0.12} />
      <Lens size={ld} left={px + s * 0.5} top={py + s * 0.12} />
      <Lens size={ld} left={px + s * 0.12} top={py + s * 0.5} />
    </>
  );
}
