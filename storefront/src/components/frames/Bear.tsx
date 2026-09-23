// Original kawaii-style illustration (hand-drawn, not sourced from any
// reference image). viewBox is 200x220 — must match FRAME_DEFS.bear's
// width/height in lib/frames.ts. The face-hole is the circle cx=100 cy=140
// r=68, cut via fill-rule="evenodd" — its bounding box (32,72,136,136) must
// match FRAME_DEFS.bear.hole (16%, 32.73%, 68%, 61.82%) if this shape is
// ever redrawn. Ears sit well above the hole (bottom edge y=68 vs. the
// hole's topmost point y≈104 at that x) so they never overlap the photo.
export function Bear({ style }: { style?: React.CSSProperties }) {
  return (
    <svg viewBox="0 0 200 220" style={style} xmlns="http://www.w3.org/2000/svg">
      {/* ears, drawn first so the head sits on top of their base */}
      <circle cx={42} cy={38} r={30} fill="#8B5A2B" stroke="#6B4423" strokeWidth={4} />
      <circle cx={42} cy={40} r={15} fill="#D9A468" />
      <circle cx={158} cy={38} r={30} fill="#8B5A2B" stroke="#6B4423" strokeWidth={4} />
      <circle cx={158} cy={40} r={15} fill="#D9A468" />

      <path
        d="M100,40 C158,40 188,82 188,140 C188,192 148,218 100,218 C52,218 12,192 12,140 C12,82 42,40 100,40 Z
           M32,140 A68,68 0 1,0 168,140 A68,68 0 1,0 32,140 Z"
        fill="#C48A54"
        stroke="#8B5A2B"
        strokeWidth={4}
        fillRule="evenodd"
      />

      {/* blush, kept clear of the hole */}
      <ellipse cx={26} cy={158} rx={14} ry={10} fill="#FF8FC4" opacity={0.4} />
      <ellipse cx={174} cy={158} rx={14} ry={10} fill="#FF8FC4" opacity={0.4} />
    </svg>
  );
}
