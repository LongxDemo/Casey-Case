// Drag/resize handle for the camera-module editor's island/lens/flash/sensor
// shapes — same pointer-capture + screen-delta-divided-by-scale idiom as
// EditableLayer.tsx's body drag, but simpler: camera shapes never rotate
// relative to the phone body, so resize is two independent linear deltas
// (or one for a circle's diameter), no atan2/halfDiag needed.
import { useRef } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';

const MIN_MM = 1;

export type ShapeGeom =
  | { kind: 'rect'; xMm: number; yMm: number; widthMm: number; heightMm: number; cornerRadiusMm?: number }
  | { kind: 'circle'; xMm: number; yMm: number; diameterMm: number };

export type ShapePatch = Partial<{ xMm: number; yMm: number; widthMm: number; heightMm: number; diameterMm: number }>;

export function CameraShapeHandle({
  geom,
  pxPerMm,
  color,
  label,
  selected,
  onSelect,
  onChange,
}: {
  geom: ShapeGeom;
  pxPerMm: number;
  color: string;
  label?: string;
  selected: boolean;
  onSelect: () => void;
  onChange: (patch: ShapePatch) => void;
}) {
  const dragState = useRef<{ startXmm: number; startYmm: number; startClientX: number; startClientY: number } | null>(null);
  const resizeState = useRef<{ startWidthMm: number; startHeightMm: number; startDiameterMm: number; startClientX: number; startClientY: number } | null>(null);

  const onBodyPointerDown = (e: ReactPointerEvent) => {
    e.stopPropagation();
    onSelect();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    dragState.current = { startXmm: geom.xMm, startYmm: geom.yMm, startClientX: e.clientX, startClientY: e.clientY };
  };
  const onBodyPointerMove = (e: ReactPointerEvent) => {
    if (!dragState.current) return;
    const { startXmm, startYmm, startClientX, startClientY } = dragState.current;
    onChange({
      xMm: startXmm + (e.clientX - startClientX) / pxPerMm,
      yMm: startYmm + (e.clientY - startClientY) / pxPerMm,
    });
  };
  const onBodyPointerUp = (e: ReactPointerEvent) => {
    dragState.current = null;
    (e.target as HTMLElement).releasePointerCapture(e.pointerId);
  };

  const onResizePointerDown = (e: ReactPointerEvent) => {
    e.stopPropagation();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    resizeState.current = {
      startWidthMm: geom.kind === 'rect' ? geom.widthMm : 0,
      startHeightMm: geom.kind === 'rect' ? geom.heightMm : 0,
      startDiameterMm: geom.kind === 'circle' ? geom.diameterMm : 0,
      startClientX: e.clientX,
      startClientY: e.clientY,
    };
  };
  const onResizePointerMove = (e: ReactPointerEvent) => {
    if (!resizeState.current) return;
    const { startWidthMm, startHeightMm, startDiameterMm, startClientX, startClientY } = resizeState.current;
    const dx = (e.clientX - startClientX) / pxPerMm;
    const dy = (e.clientY - startClientY) / pxPerMm;
    if (geom.kind === 'rect') {
      onChange({ widthMm: Math.max(MIN_MM, startWidthMm + dx), heightMm: Math.max(MIN_MM, startHeightMm + dy) });
    } else {
      onChange({ diameterMm: Math.max(MIN_MM, startDiameterMm + dx) });
    }
  };
  const onResizePointerUp = (e: ReactPointerEvent) => {
    resizeState.current = null;
    (e.target as HTMLElement).releasePointerCapture(e.pointerId);
  };

  const left = geom.xMm * pxPerMm;
  const top = geom.yMm * pxPerMm;
  const w = (geom.kind === 'rect' ? geom.widthMm : geom.diameterMm) * pxPerMm;
  const h = (geom.kind === 'rect' ? geom.heightMm : geom.diameterMm) * pxPerMm;
  const radius = geom.kind === 'circle'
    ? '50%'
    : `${Math.min(geom.cornerRadiusMm ?? 0, geom.widthMm / 2, geom.heightMm / 2) * pxPerMm}px`;

  return (
    <div
      onPointerDown={onBodyPointerDown}
      onPointerMove={onBodyPointerMove}
      onPointerUp={onBodyPointerUp}
      style={{
        position: 'absolute',
        left, top, width: w, height: h,
        borderRadius: radius,
        background: selected ? `${color}66` : `${color}33`,
        border: `2px solid ${selected ? color : `${color}99`}`,
        cursor: 'move',
        touchAction: 'none',
        boxSizing: 'border-box',
      }}
    >
      {label && (
        <span style={{ position: 'absolute', top: -18, left: 0, fontSize: 10, color, fontWeight: 700, whiteSpace: 'nowrap', textShadow: '0 1px 2px rgba(0,0,0,0.6)' }}>
          {label}
        </span>
      )}
      <div
        onPointerDown={onResizePointerDown}
        onPointerMove={onResizePointerMove}
        onPointerUp={onResizePointerUp}
        title="Drag to resize"
        style={{
          position: 'absolute',
          right: -7, bottom: -7,
          width: 14, height: 14,
          borderRadius: '50%',
          background: color,
          border: '2px solid #fff',
          cursor: 'nwse-resize',
          touchAction: 'none',
        }}
      />
    </div>
  );
}
