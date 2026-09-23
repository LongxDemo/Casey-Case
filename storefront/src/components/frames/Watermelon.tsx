// Original kawaii-style illustration (hand-drawn, not sourced from any
// reference image). viewBox is 200x220 — must match FRAME_DEFS.watermelon's
// width/height in lib/frames.ts. The face-hole is the circle cx=100 cy=113
// r=68, cut via fill-rule="evenodd" — its bounding box (32,45,136,136) must
// match FRAME_DEFS.watermelon.hole (16%, 20.45%, 68%, 61.82%) if this shape
// is ever redrawn. Rind stripes are short arcs confined to the top/bottom
// poles (well outside the r=68 hole) — full-height stripes would cross
// straight through the photo since the hole nearly spans the body's width.
export function Watermelon({ style }: { style?: React.CSSProperties }) {
  return (
    <svg viewBox="0 0 200 220" style={style} xmlns="http://www.w3.org/2000/svg">
      <path
        d="M100,20 C152,20 185,58 185,113 C185,173 148,210 100,210 C52,210 15,173 15,113 C15,58 48,20 100,20 Z
           M32,113 A68,68 0 1,0 168,113 A68,68 0 1,0 32,113 Z"
        fill="#3FA34D"
        stroke="#2C7A38"
        strokeWidth={4}
        fillRule="evenodd"
      />
      {/* rind stripes as short pole-caps only — the hole spans nearly the
          full body width at mid-height, so stripes can't run edge-to-edge. */}
      <g fill="none" stroke="#256B30" strokeWidth={8} strokeLinecap="round">
        <path d="M55,45 C62,36 72,28 82,23" />
        <path d="M145,45 C138,36 128,28 118,23" />
        <path d="M45,188 C52,197 62,205 72,209" />
        <path d="M155,188 C148,197 138,205 128,209" />
      </g>
      {/* small leaf at the top */}
      <ellipse cx={96} cy={12} rx={13} ry={8} fill="#5FAE62" stroke="#3F8A46" strokeWidth={2} transform="rotate(-15 96 12)" />
    </svg>
  );
}
