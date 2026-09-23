// Original kawaii-style illustration (hand-drawn, not sourced from any
// reference image). viewBox is 200x220 — must match FRAME_DEFS.donut's
// width/height in lib/frames.ts. The face-hole is the donut's own center
// hole: circle cx=100 cy=120 r=46, cut via fill-rule="evenodd" — its
// bounding box (54,74,92,92) must match FRAME_DEFS.donut.hole (27%,
// 33.64%, 46%, 41.82%) if this shape is ever redrawn.
export function Donut({ style }: { style?: React.CSSProperties }) {
  return (
    <svg viewBox="0 0 200 220" style={style} xmlns="http://www.w3.org/2000/svg">
      {/* dough base ring */}
      <path
        d="M100,25 C154,25 195,68 195,120 C195,175 154,215 100,215 C46,215 5,175 5,120 C5,68 46,25 100,25 Z
           M54,120 A46,46 0 1,0 146,120 A46,46 0 1,0 54,120 Z"
        fill="#F2C09A"
        stroke="#D89A67"
        strokeWidth={4}
        fillRule="evenodd"
      />
      {/* pink icing, drizzled over the top ~55% of the ring, same evenodd hole */}
      <path
        d="M100,25 C154,25 195,68 195,120 C195,132 193,143 190,153
           C178,148 168,158 156,153 C144,148 134,158 122,153 C110,148 100,158 88,153
           C76,148 66,158 54,153 C42,148 32,158 20,153 C13,140 5,128 5,120 C5,68 46,25 100,25 Z
           M54,120 A46,46 0 1,0 146,120 A46,46 0 1,0 54,120 Z"
        fill="#FF8FC4"
        stroke="#FF6FB0"
        strokeWidth={3}
        fillRule="evenodd"
      />
      {/* sprinkles on the icing, kept clear of the hole (r=46 about cx100 cy120) */}
      {[
        [35, 60, 30, '#7B61FF'], [60, 45, -20, '#3EC8A0'], [90, 40, 10, '#FFD400'],
        [120, 42, -15, '#7B61FF'], [150, 55, 25, '#FF5470'], [170, 75, -10, '#3EC8A0'],
        [45, 85, 15, '#FFD400'], [160, 100, -25, '#FF5470'],
      ].map(([cx, cy, rot, color], i) => (
        <rect key={i} x={(cx as number) - 5} y={(cy as number) - 2} width={10} height={4} rx={2} fill={color as string} transform={`rotate(${rot} ${cx} ${cy})`} />
      ))}
    </svg>
  );
}
