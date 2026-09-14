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

export function LayerView({ layer, scale }: { layer: Layer; scale: number }) {
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
   Mirrors admin/src/components/CasePreview.tsx — same brand→layout mapping. */

// From the iPhone 17 generation, the Pros and the Air use a full-width camera
// plateau flush with the top of the phone — 'ip17-plateau' (triple lens) and
// 'ip17-air' (single lens). The base 17 kept the 16-style vertical pill, and
// pre-17 iPhones keep the old cluster styles.
export type CamStyle =
  | 'ip17-plateau' | 'ip17-air' | 'ip-square' | 'ip-vert' | 'ip-dual' | 'ip-dual-vert' | 'ip-single'
  | 'samsung' | 'samsung-ultra' | 'zflip'
  | 'pixel' | 'pixel-pro' | 'pixel-island'
  | 'xiaomi' | 'oneplus' | 'oppo' | 'generic';

export function camStyleFor(model: PhoneModel): CamStyle {
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

// On a real printed/molded case, the camera cutout's rim and raised plateau
// are the SAME material as the rest of the case (see reference product
// photos: an orange case has an orange-tinted camera surround, not a
// separate silver/metal module) — only the lens glass itself, flash, and
// sensor dot stay their real (dark/white/dark) colors. `tint` is the case's
// own background color, mixed lighter/darker for the raised-edge shading.
function ringGradient(tint: string) {
  // Machined-edge look: two light/dark sweeps instead of one, so the ring
  // reads as polished metal catching light from above.
  return `linear-gradient(135deg, color-mix(in srgb, ${tint} 72%, white), color-mix(in srgb, ${tint} 48%, black) 42%, color-mix(in srgb, ${tint} 82%, white) 68%, color-mix(in srgb, ${tint} 58%, black))`;
}
function plateGradient(tint: string) {
  // Near-flat: the real plateau is matte with barely-visible shading — a
  // strong light-to-dark sweep reads as a glossy toy dome.
  return `linear-gradient(160deg, color-mix(in srgb, ${tint} 92%, white), color-mix(in srgb, ${tint} 88%, black))`;
}

function Lens({ size, left, top, tint }: { size: number; left: number; top: number; tint: string }) {
  // Layered like a real camera: raised metallic ring → dark bezel → outer
  // glass → inner element with its own reflection, plus a tight specular
  // catch-light and a faint violet lens-coating flare.
  const ringW = Math.max(1, size * 0.08);
  const bezelW = Math.max(0.8, size * 0.07);
  return (
    <div
      style={{
        position: 'absolute',
        left,
        top,
        width: size,
        height: size,
        borderRadius: '50%',
        background: ringGradient(tint),
        boxShadow: `0 ${size * 0.04}px ${size * 0.1}px rgba(12,8,16,0.4), inset 0 ${Math.max(0.5, size * 0.015)}px ${Math.max(0.5, size * 0.02)}px rgba(255,255,255,0.45)`,
      }}
    >
      <div style={{ position: 'absolute', inset: ringW, borderRadius: '50%', background: 'linear-gradient(145deg, #2b2f3a, #0a0c12 70%)' }} />
      <div
        style={{
          position: 'absolute',
          inset: ringW + bezelW,
          borderRadius: '50%',
          background: 'radial-gradient(circle at 33% 30%, #26304a 0%, #121a2e 34%, #05070d 68%, #010102 100%)',
        }}
      />
      {size >= 16 && (
        <div
          style={{
            position: 'absolute',
            inset: size * 0.34,
            borderRadius: '50%',
            background: 'radial-gradient(circle at 36% 32%, #3a4a78 0%, #131b32 55%, #04060c 100%)',
            boxShadow: '0 0 0 0.5px rgba(140,160,220,0.22)',
          }}
        />
      )}
      {size >= 12 && (
        <div
          style={{
            position: 'absolute',
            left: size * 0.24,
            top: size * 0.18,
            width: size * 0.18,
            height: size * 0.1,
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.55)',
            transform: 'rotate(-32deg)',
            filter: 'blur(0.4px)',
          }}
        />
      )}
      {size >= 18 && (
        <div
          style={{
            position: 'absolute',
            right: size * 0.18,
            bottom: size * 0.16,
            width: size * 0.14,
            height: size * 0.14,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(130,110,255,0.32), rgba(130,110,255,0) 70%)',
          }}
        />
      )}
    </div>
  );
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
      {/* warm LED core behind the diffuser */}
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
    // Verified against real 17 Pro/Pro Max product photos: the plateau is
    // FLUSH with the top of the phone and runs edge to edge — the body's own
    // top corners are the plateau's corners, and only its bottom corners
    // curve back into the body. Lenses sit directly on it (no darker
    // sub-plate); flash/LiDAR are small (~6mm), the mic a pinhole.
    const bh = W * 0.54;
    const ld = bh * 0.43, pad = bh * 0.065, clx = W * 0.055;
    return (
      <>
        <Plate l={0} t={0} w={W} h={bh} r={`0 0 ${W * 0.16}px ${W * 0.16}px`} tint={tint} />
        <Lens size={ld} left={clx} top={pad} tint={tint} />
        <Lens size={ld} left={clx} top={bh - ld - pad} tint={tint} />
        <Lens size={ld} left={clx + ld * 0.95} top={(bh - ld) / 2} tint={tint} />
        <Flash size={W * 0.075} left={W * 0.83} top={bh * 0.14} />
        <Dot size={W * 0.075} left={W * 0.76} top={bh * 0.52} />
        <Dot size={W * 0.028} left={W * 0.88} top={bh * 0.4} />
      </>
    );
  }
  if (style === 'ip17-air') {
    // Like the 17 Pro plateau, the Air's bar is flush with the top of the
    // phone and full width — only shorter, with a single lens on the left.
    const ph = W * 0.3, ld = ph * 0.7;
    return (
      <>
        <Plate l={0} t={0} w={W} h={ph} r={`0 0 ${W * 0.14}px ${W * 0.14}px`} tint={tint} />
        <Lens size={ld} left={W * 0.07} top={(ph - ld) / 2} tint={tint} />
        {/* Flash + mic sit right beside the lens on the real Air, not far
            out on the empty right side of the bar. */}
        <Flash size={ph * 0.22} left={W * 0.33} top={ph * 0.3} />
        <Dot size={ph * 0.1} left={W * 0.42} top={ph * 0.48} />
      </>
    );
  }
  if (style === 'ip-vert') {
    // Spec table: ~30x55mm pill on a 71.6mm-wide body -> width 0.42, and the
    // pill is notably elongated (55/30 = 1.83x), not the near-square 1.12x
    // this used before.
    // Real 16/17 pill hugs its two big lenses — they nearly fill the pill's
    // width and sit close together, not small dots in an empty capsule.
    const s = W * 0.42, px = W * 0.05, py = H * 0.045, sh = s * 1.83, ld = s * 0.76;
    const lx = px + (s - ld) / 2, pad = (sh - ld * 2 - s * 0.12) / 2;
    return (
      <>
        <Plate l={px} t={py} w={s} h={sh} r={s * 0.5} tint={tint} />
        <Lens size={ld} left={lx} top={py + pad} tint={tint} />
        <Lens size={ld} left={lx} top={py + sh - ld - pad} tint={tint} />
        {/* Flash sits on the body just beside the pill, hugging it at the
            top lens's level — floating it further away reads as a bug. */}
        <Flash size={s * 0.2} left={px + s * 1.06} top={py + pad + ld * 0.18} />
      </>
    );
  }
  if (style === 'ip-square') {
    // Spec table bump figures for 15 Pro/16 Pro/16 Pro Max average ~0.50 of
    // body width (38-40mm on 70.6-77.6mm bodies) — 0.32 was undersized.
    const s = W * 0.5, px = W * 0.06, py = H * 0.045, ld = s * 0.4;
    return (
      <>
        <Plate l={px} t={py} w={s} h={s} r={s * 0.28} tint={tint} />
        <Lens size={ld} left={px + s * 0.08} top={py + s * 0.08} tint={tint} />
        <Lens size={ld} left={px + s * 0.08} top={py + s * 0.5} tint={tint} />
        <Lens size={ld} left={px + s * 0.44} top={py + s * 0.29} tint={tint} />
        {/* Right column, top to bottom: flash, mic, LiDAR (like the real Pros),
            tucked into the corners so they clear the third lens. */}
        <Flash size={ld * 0.4} left={px + s * 0.76} top={py + s * 0.1} />
        <Dot size={ld * 0.16} left={px + s * 0.88} top={py + s * 0.47} />
        <Dot size={ld * 0.3} left={px + s * 0.76} top={py + s * 0.74} />
      </>
    );
  }
  if (style === 'ip-dual') {
    // Spec table bump figures for 11/12/13/14 average ~0.45 of body width
    // (30-35mm on 71.5-75.7mm bodies) — 0.27 was undersized. Lens size/inset
    // tightened so the two diagonal lenses don't overlap at the bigger size.
    const s = W * 0.45, px = W * 0.05, py = H * 0.04, sh = s * 1.2, ld = s * 0.42;
    return (
      <>
        <Plate l={px} t={py} w={s} h={sh} r={s * 0.32} tint={tint} />
        <Lens size={ld} left={px + s * 0.06} top={py + s * 0.06} tint={tint} />
        <Lens size={ld} left={px + s - ld - s * 0.06} top={py + sh - ld - s * 0.06} tint={tint} />
        <Flash size={s * 0.18} left={px + s * 0.68} top={py + s * 0.12} />
        <Dot size={s * 0.08} left={px + s * 0.2} top={py + sh - s * 0.28} />
      </>
    );
  }
  if (style === 'ip-dual-vert') {
    // 11/12: square module, both lenses stacked vertically on the left,
    // flash top-right, mic bottom-right.
    const s = W * 0.45, px = W * 0.05, py = H * 0.04, sh = s * 1.15, ld = s * 0.42;
    const lx = px + s * 0.09;
    return (
      <>
        <Plate l={px} t={py} w={s} h={sh} r={s * 0.32} tint={tint} />
        <Lens size={ld} left={lx} top={py + sh * 0.08} tint={tint} />
        <Lens size={ld} left={lx} top={py + sh - ld - sh * 0.08} tint={tint} />
        <Flash size={s * 0.18} left={px + s * 0.66} top={py + sh * 0.12} />
        <Dot size={s * 0.1} left={px + s * 0.68} top={py + sh * 0.72} />
      </>
    );
  }
  if (style === 'ip-single') {
    // SE / iPhone 8 body: bare lens top-left with the small flash beside it.
    // Real housing is small (~15mm on a 67mm body), not a Pro-sized lens.
    const ld = W * 0.22;
    return (
      <>
        <Lens size={ld} left={W * 0.06} top={H * 0.045} tint={tint} />
        <Flash size={ld * 0.24} left={W * 0.06 + ld * 1.08} top={H * 0.045 + ld * 0.14} />
      </>
    );
  }
  if (style === 'samsung' || style === 'samsung-ultra') {
    // S/A-series and the Fold's rear: individually mounted vertical lenses
    // on the bare glass, small flash beside the top lens. The Ultra adds the
    // periscope telephoto and laser-AF dot in a right column.
    const ld = W * 0.145, lx = W * 0.07, ty = H * 0.045, gap = ld * 1.24;
    return (
      <>
        <Lens size={ld} left={lx} top={ty} tint={tint} />
        <Lens size={ld} left={lx} top={ty + gap} tint={tint} />
        <Lens size={ld} left={lx} top={ty + gap * 2} tint={tint} />
        {style === 'samsung-ultra' && <Lens size={ld * 0.78} left={lx + ld * 1.5} top={ty + gap * 1.45} tint={tint} />}
        {style === 'samsung-ultra' && <Dot size={ld * 0.22} left={lx + ld * 1.6} top={ty + gap * 0.95} />}
        <Flash size={ld * 0.3} left={lx + ld * 1.5} top={ty + gap * 0.45} />
      </>
    );
  }
  if (style === 'zflip') {
    // Closed Flip: the big cover-screen glass dominates the face, with the
    // dual camera sitting horizontally at the bottom right.
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
        <Lens size={ld} left={W * 0.52} top={cy} tint={tint} />
        <Lens size={ld} left={W * 0.52 + ld * 1.22} top={cy} tint={tint} />
        <Flash size={ld * 0.28} left={W * 0.52 + ld * 2.5} top={cy + ld * 0.36} />
      </>
    );
  }
  if (style === 'pixel' || style === 'pixel-pro') {
    // Pixel 7/8 visor: an edge-to-edge bar with a dark lens window on the
    // left and the flash alone on the right. Pro models carry three lenses.
    const by = H * 0.065, bh = W * 0.17;
    const n = style === 'pixel-pro' ? 3 : 2;
    const wh = bh * 0.72, wy = by + (bh - wh) / 2, wx = W * 0.07;
    const ld = wh * 0.72, step = ld * 1.18, ww = wh * 0.28 + step * (n - 1) + ld + wh * 0.14;
    return (
      <>
        <Plate l={0} t={by} w={W} h={bh} r={0} tint={tint} />
        <div
          style={{
            position: 'absolute', left: wx, top: wy, width: ww, height: wh, borderRadius: wh / 2,
            background: 'linear-gradient(160deg, #1a1c24, #07080c)',
            boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.14)',
          }}
        />
        {Array.from({ length: n }, (_, i) => (
          <Lens key={i} size={ld} left={wx + wh * 0.14 + step * i} top={wy + (wh - ld) / 2} tint={tint} />
        ))}
        <Flash size={bh * 0.22} left={W * 0.88} top={by + bh * 0.39} />
      </>
    );
  }
  if (style === 'pixel-island') {
    // Pixel 9: the visor became a floating pill island with clear margins.
    const iw = W * 0.86, ih = W * 0.22, ix = (W - iw) / 2, iy = H * 0.055;
    const wh = ih * 0.72, wy = iy + (ih - wh) / 2, wx = ix + ih * 0.16;
    const ld = wh * 0.74, step = ld * 1.16, ww = wh * 0.26 + step * 2 + ld;
    return (
      <>
        <Plate l={ix} t={iy} w={iw} h={ih} r={ih / 2} tint={tint} />
        <div
          style={{
            position: 'absolute', left: wx, top: wy, width: ww, height: wh, borderRadius: wh / 2,
            background: 'linear-gradient(160deg, #1a1c24, #07080c)',
            boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.14)',
          }}
        />
        {Array.from({ length: 3 }, (_, i) => (
          <Lens key={i} size={ld} left={wx + wh * 0.13 + step * i} top={wy + (wh - ld) / 2} tint={tint} />
        ))}
        <Flash size={ih * 0.2} left={ix + iw * 0.88} top={iy + ih * 0.4} />
      </>
    );
  }
  if (style === 'xiaomi') {
    // Xiaomi 14 / Redmi Note: rounded-square island, 2x2 grid of three
    // lenses plus the flash in the fourth corner.
    const s = W * 0.44, px = W * 0.06, py = H * 0.045, ld = s * 0.36, o1 = s * 0.1, o2 = s * 0.54;
    return (
      <>
        <Plate l={px} t={py} w={s} h={s} r={s * 0.28} tint={tint} />
        <Lens size={ld} left={px + o1} top={py + o1} tint={tint} />
        <Lens size={ld} left={px + o2} top={py + o1} tint={tint} />
        <Lens size={ld} left={px + o1} top={py + o2} tint={tint} />
        <Flash size={ld * 0.55} left={px + o2 + ld * 0.22} top={py + o2 + ld * 0.22} />
      </>
    );
  }
  if (style === 'oneplus') {
    // OnePlus 12: the signature big circular module joined to the left edge
    // by a short wing, three lenses + laser inside, flash on the body.
    const d = W * 0.46, cx = W * 0.1, cy = H * 0.045, ld = d * 0.32;
    return (
      <>
        <div style={{ position: 'absolute', left: 0, top: cy + d * 0.36, width: cx + d * 0.3, height: d * 0.28, background: plateGradient(tint), boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.08)' }} />
        <div
          style={{
            position: 'absolute', left: cx, top: cy, width: d, height: d, borderRadius: '50%',
            background: `linear-gradient(160deg, #1c1e26, #08090d)`,
            boxShadow: `0 ${d * 0.03}px ${d * 0.09}px rgba(10,8,18,0.35), 0 0 0 ${Math.max(1, d * 0.035)}px ${`color-mix(in srgb, ${tint} 62%, black)`}, inset 0 0 0 1px rgba(255,255,255,0.12)`,
          }}
        />
        <Lens size={ld} left={cx + d * 0.14} top={cy + d * 0.14} tint={tint} />
        <Lens size={ld} left={cx + d * 0.54} top={cy + d * 0.14} tint={tint} />
        <Lens size={ld} left={cx + d * 0.14} top={cy + d * 0.54} tint={tint} />
        <Dot size={ld * 0.4} left={cx + d * 0.6} top={cy + d * 0.58} />
        <Flash size={W * 0.06} left={cx + d + W * 0.06} top={cy + d * 0.16} />
      </>
    );
  }
  if (style === 'oppo') {
    // Reno 11: tall oval island with one big and one medium lens stacked.
    const ow = W * 0.34, oh = ow * 1.72, px = W * 0.06, py = H * 0.04;
    const l1 = ow * 0.74, l2 = ow * 0.56;
    return (
      <>
        <Plate l={px} t={py} w={ow} h={oh} r={ow / 2} tint={tint} />
        <Lens size={l1} left={px + (ow - l1) / 2} top={py + ow * 0.16} tint={tint} />
        <Lens size={l2} left={px + (ow - l2) / 2} top={py + oh - l2 - ow * 0.34} tint={tint} />
        <Dot size={ow * 0.1} left={px + ow * 0.45} top={py + oh - ow * 0.18} />
        <Flash size={ow * 0.16} left={px + ow * 1.18} top={py + ow * 0.18} />
      </>
    );
  }
  const s = W * 0.3, px = W * 0.06, py = H * 0.04, ld = s * 0.4;
  return (
    <>
      <Plate l={px} t={py} w={s} h={s} r={s * 0.3} tint={tint} />
      <Lens size={ld} left={px + s * 0.12} top={py + s * 0.12} tint={tint} />
      <Lens size={ld} left={px + s * 0.5} top={py + s * 0.12} tint={tint} />
      <Lens size={ld} left={px + s * 0.12} top={py + s * 0.5} tint={tint} />
    </>
  );
}
