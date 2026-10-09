// Ported from storefront/src/components/EditableLayer.tsx for the admin
// Template Editor, which (unlike the initial port) now needs full parity:
// admin can bake a real photo into a frame/image layer, so this needs the
// same photo-hole adjust-mode (drag/zoom the photo inside its hole,
// independent of the layer's own position) as the customer editor.
import React from 'react';
import type { Layer } from '../lib/types';
import { FRAME_DEFS } from '../lib/frames';
import type { FrameDef } from '../lib/frames';

// Which hole (if any) a local point (in % of the frame's own box) falls
// inside — used only to disambiguate hole1 vs hole2 on a two-hole frame;
// single-hole frames keep their old "any tap on the frame" behavior.
function holeAt(def: FrameDef, xPct: number, yPct: number): 1 | 2 | null {
  const inside = (h: { xPct: number; yPct: number; wPct: number; hPct: number }) =>
    xPct >= h.xPct && xPct <= h.xPct + h.wPct && yPct >= h.yPct && yPct <= h.yPct + h.hPct;
  if (def.hole2 && inside(def.hole2)) return 2;
  if (inside(def.hole)) return 1;
  return null;
}

export function layerBaseSize(l: Layer): { w: number; h: number } {
  if (l.kind === 'sticker') return { w: l.size, h: l.size };
  if (l.kind === 'image') return { w: l.width, h: l.height };
  if (l.kind === 'frame') {
    const def = FRAME_DEFS[l.frameId];
    return def ? { w: def.width, h: def.height } : { w: 200, h: 220 };
  }
  return { w: 220, h: l.fontSize * 1.4 };
}

// A tap (pointerdown+up with barely any movement) on an empty frame's hole
// requests a photo upload; a real drag still just moves the whole layer.
const TAP_THRESHOLD_PX = 6;

export function EditableLayer({
  layer,
  selected,
  scale,
  canvasRef,
  onSelect,
  onChange,
  adjustHole = null,
  onRequestPhoto,
}: {
  layer: Layer;
  selected: boolean;
  scale: number;
  canvasRef: React.RefObject<HTMLDivElement | null>;
  onSelect: (id: string) => void;
  onChange: (id: string, patch: Partial<Layer>) => void;
  /** Which hole (1 or 2) is being repositioned/zoomed on this frame layer, or null if none. */
  adjustHole?: 1 | 2 | null;
  onRequestPhoto?: (id: string, hole: 1 | 2) => void;
}) {
  const base = layerBaseSize(layer);
  const dw = base.w * scale;
  const dh = base.h * scale;
  const halfDiag = Math.sqrt((dw / 2) ** 2 + (dh / 2) ** 2);
  const cornerAngle = Math.atan2(dh, dw);

  const dragState = React.useRef<{ startTx: number; startTy: number; startX: number; startY: number; moved: boolean } | null>(null);
  const handleState = React.useRef<{ startScale: number; startRotation: number } | null>(null);

  const onBodyPointerDown = (e: React.PointerEvent) => {
    e.stopPropagation();
    onSelect(layer.id);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    const useAdjust = adjustHole && layer.kind === 'frame';
    const startTx = useAdjust ? (adjustHole === 2 ? (layer.photo2Tx ?? 0) : layer.photoTx) : layer.tx;
    const startTy = useAdjust ? (adjustHole === 2 ? (layer.photo2Ty ?? 0) : layer.photoTy) : layer.ty;
    dragState.current = { startTx, startTy, startX: e.clientX, startY: e.clientY, moved: false };
  };
  const onBodyPointerMove = (e: React.PointerEvent) => {
    if (!dragState.current) return;
    const { startTx, startTy, startX, startY } = dragState.current;
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;
    if (Math.abs(dx) > TAP_THRESHOLD_PX || Math.abs(dy) > TAP_THRESHOLD_PX) dragState.current.moved = true;
    if (adjustHole && layer.kind === 'frame') {
      // photoTx/Ty live inside a box that's already scaled by both the
      // canvas scale and this layer's own scale, so undo both to keep the
      // drag tracking the pointer 1:1.
      const divisor = scale * layer.scale;
      if (adjustHole === 2) onChange(layer.id, { photo2Tx: startTx + dx / divisor, photo2Ty: startTy + dy / divisor });
      else onChange(layer.id, { photoTx: startTx + dx / divisor, photoTy: startTy + dy / divisor });
    } else {
      onChange(layer.id, { tx: startTx + dx / scale, ty: startTy + dy / scale });
    }
  };
  const onBodyPointerUp = (e: React.PointerEvent) => {
    const wasTap = dragState.current && !dragState.current.moved;
    dragState.current = null;
    (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    if (wasTap && layer.kind === 'frame' && !adjustHole) {
      const def = FRAME_DEFS[layer.frameId];
      if (def?.hole2) {
        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
        const xPct = ((e.clientX - rect.left) / rect.width) * 100;
        const yPct = ((e.clientY - rect.top) / rect.height) * 100;
        const tappedHole = holeAt(def, xPct, yPct);
        if (tappedHole === 2 && !layer.photo2Uri) onRequestPhoto?.(layer.id, 2);
        else if (tappedHole === 1 && !layer.photoUri) onRequestPhoto?.(layer.id, 1);
      } else if (!layer.photoUri) {
        onRequestPhoto?.(layer.id, 1);
      }
    }
    if (wasTap && layer.kind === 'image' && !layer.uri) onRequestPhoto?.(layer.id, 1);
  };

  const onHandlePointerDown = (e: React.PointerEvent) => {
    e.stopPropagation();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    handleState.current = { startScale: layer.scale, startRotation: layer.rotation };
  };
  const onHandlePointerMove = (e: React.PointerEvent) => {
    if (!handleState.current || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const cx = rect.left + rect.width / 2 + layer.tx * scale;
    const cy = rect.top + rect.height / 2 + layer.ty * scale;
    const dx = e.clientX - cx;
    const dy = e.clientY - cy;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const newScale = Math.max(0.3, Math.min(6, dist / halfDiag));
    const newRotation = Math.atan2(dy, dx) - cornerAngle;
    onChange(layer.id, { scale: newScale, rotation: newRotation });
  };
  const onHandlePointerUp = (e: React.PointerEvent) => {
    handleState.current = null;
    (e.target as HTMLElement).releasePointerCapture(e.pointerId);
  };

  // See storefront's EditableLayer for why both translate(-50%,-50%) AND
  // the tx/ty translate are needed (double-centering bug writeup there).
  const transform = `translate(-50%, -50%) translate(${layer.tx * scale}px, ${layer.ty * scale}px) scale(${layer.scale}) rotate(${layer.rotation}rad)`;

  return (
    <div
      onPointerDown={onBodyPointerDown}
      onPointerMove={onBodyPointerMove}
      onPointerUp={onBodyPointerUp}
      style={{
        position: 'absolute',
        left: '50%',
        top: '50%',
        width: dw,
        height: dh,
        transform,
        transformOrigin: 'center',
        cursor: 'grab',
        touchAction: 'none',
        userSelect: 'none',
        outline: selected ? '1.5px dashed #FF3E9A' : 'none',
        outlineOffset: 3,
        borderRadius: 6,
      }}
    >
      <div style={{ width: '100%', height: '100%', pointerEvents: 'none', position: 'relative' }}>
        {layer.kind === 'sticker' &&
          (layer.uri ? (
            <img src={layer.uri} alt="" style={{ width: dw, height: dh, objectFit: 'contain' }} />
          ) : (
            <div style={{ fontSize: dw * 0.9, lineHeight: 1, textAlign: 'center' }}>{layer.emoji}</div>
          ))}
        {layer.kind === 'image' && (
          layer.uri ? (
            <img src={layer.uri} alt="" style={{ width: dw, height: dh, borderRadius: (layer.radius ?? 0) * scale, objectFit: 'cover' }} />
          ) : (
            <div style={{ width: dw, height: dh, borderRadius: (layer.radius ?? 0) * scale, background: '#f0e6ea', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: dw * 0.14 }}>
              📷
            </div>
          )
        )}
        {layer.kind === 'frame' && (() => {
          const def = FRAME_DEFS[layer.frameId];
          if (!def) return null;
          const { hole } = def;
          const FrameSvg = def.Svg;
          const overlayStyle: React.CSSProperties = { position: 'absolute', inset: 0, width: '100%', height: '100%' };
          return (
            <>
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
                {layer.photoUri ? (
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
                ) : (
                  <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: dw * 0.14 }}>
                    📷
                  </div>
                )}
              </div>
              {def.hole2 && (
                <div
                  style={{
                    position: 'absolute',
                    left: `${def.hole2.xPct}%`,
                    top: `${def.hole2.yPct}%`,
                    width: `${def.hole2.wPct}%`,
                    height: `${def.hole2.hPct}%`,
                    borderRadius: '50%',
                    overflow: 'hidden',
                    background: layer.photo2Uri ? undefined : '#f0e6ea',
                  }}
                >
                  {layer.photo2Uri ? (
                    <img
                      src={layer.photo2Uri}
                      alt=""
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        transform: `translate(${layer.photo2Tx ?? 0}px, ${layer.photo2Ty ?? 0}px) scale(${layer.photo2Scale ?? 1})`,
                      }}
                    />
                  ) : (
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: dw * 0.14 }}>
                      📷
                    </div>
                  )}
                </div>
              )}
              {def.image ? <img src={def.image} alt="" style={overlayStyle} /> : FrameSvg ? <FrameSvg style={overlayStyle} /> : null}
            </>
          );
        })()}
        {layer.kind === 'text' && (
          <div
            style={{
              width: dw,
              fontSize: layer.fontSize * scale,
              fontWeight: layer.fontWeight as any,
              color: layer.color,
              textAlign: layer.align,
              lineHeight: 1.1,
              whiteSpace: 'pre-wrap',
            }}
          >
            {layer.text}
          </div>
        )}
      </div>

      {selected && !adjustHole && (
        <div
          onPointerDown={onHandlePointerDown}
          onPointerMove={onHandlePointerMove}
          onPointerUp={onHandlePointerUp}
          style={{
            position: 'absolute',
            right: -13,
            bottom: -13,
            width: 26,
            height: 26,
            borderRadius: 13,
            background: '#FF3E9A',
            border: '2px solid #fff',
            boxShadow: '0 2px 8px rgba(0,0,0,0.25)',
            cursor: 'nwse-resize',
            touchAction: 'none',
            transform: `scale(${1 / layer.scale})`,
          }}
        />
      )}
    </div>
  );
}
