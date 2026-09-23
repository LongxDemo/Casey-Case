// Original kawaii-style illustration (hand-drawn, not sourced from any
// reference image). viewBox is 200x220 — must match FRAME_DEFS.bunny's
// width/height in lib/frames.ts. Shares Bear's head/hole shape (circle
// cx=100 cy=140 r=68, bbox 32,72,136,136 -> 16%, 32.73%, 68%, 61.82%). The
// long ears sit above y=78, well clear of the hole's topmost point y≈104.
export function Bunny({ style }: { style?: React.CSSProperties }) {
  return (
    <svg viewBox="0 0 200 220" style={style} xmlns="http://www.w3.org/2000/svg">
      <ellipse cx={58} cy={40} rx={18} ry={38} fill="#FFF6E8" stroke="#E8C9A0" strokeWidth={4} transform="rotate(-12 58 40)" />
      <ellipse cx={58} cy={44} rx={9} ry={26} fill="#FFC9DE" transform="rotate(-12 58 44)" />
      <ellipse cx={142} cy={40} rx={18} ry={38} fill="#FFF6E8" stroke="#E8C9A0" strokeWidth={4} transform="rotate(12 142 40)" />
      <ellipse cx={142} cy={44} rx={9} ry={26} fill="#FFC9DE" transform="rotate(12 142 44)" />

      <path
        d="M100,40 C158,40 188,82 188,140 C188,192 148,218 100,218 C52,218 12,192 12,140 C12,82 42,40 100,40 Z
           M32,140 A68,68 0 1,0 168,140 A68,68 0 1,0 32,140 Z"
        fill="#FFF6E8"
        stroke="#E8C9A0"
        strokeWidth={4}
        fillRule="evenodd"
      />

      <ellipse cx={26} cy={158} rx={14} ry={10} fill="#FF8FC4" opacity={0.4} />
      <ellipse cx={174} cy={158} rx={14} ry={10} fill="#FF8FC4" opacity={0.4} />
    </svg>
  );
}
