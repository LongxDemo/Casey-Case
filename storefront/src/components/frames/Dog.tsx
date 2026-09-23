// Original kawaii-style illustration (hand-drawn, not sourced from any
// reference image). viewBox is 200x220 — must match FRAME_DEFS.dog's
// width/height in lib/frames.ts. Shares Bear's head/hole shape (circle
// cx=100 cy=140 r=68, bbox 32,72,136,136 -> 16%, 32.73%, 68%, 61.82%). The
// hole is nearly as wide as the head at mid-height, so ears can't hang off
// the sides at hole-height like a real floppy-eared dog would — instead
// they're rounded tabs lower on the sides (y 145-215), where the hole has
// already curved away enough to leave a real margin (checked: at the
// tightest point, y=145, the hole's edge is at x≈33 and the ear's inner
// edge is at x≈23 — a 10px gap).
export function Dog({ style }: { style?: React.CSSProperties }) {
  return (
    <svg viewBox="0 0 200 220" style={style} xmlns="http://www.w3.org/2000/svg">
      <path
        d="M100,40 C158,40 188,82 188,140 C188,192 148,218 100,218 C52,218 12,192 12,140 C12,82 42,40 100,40 Z
           M32,140 A68,68 0 1,0 168,140 A68,68 0 1,0 32,140 Z"
        fill="#EFCB9A"
        stroke="#B37D3E"
        strokeWidth={4}
        fillRule="evenodd"
      />

      {/* droopy ears as rounded tabs low on the sides, on top of the head */}
      <rect x={-6} y={145} width={29} height={72} rx={14} fill="#D9A468" stroke="#B37D3E" strokeWidth={4} />
      <rect x={177} y={145} width={29} height={72} rx={14} fill="#D9A468" stroke="#B37D3E" strokeWidth={4} />

      {/* patch spots, kept clear of the hole */}
      <circle cx={26} cy={100} r={13} fill="#D9A468" />
      <circle cx={174} cy={100} r={13} fill="#D9A468" />
    </svg>
  );
}
