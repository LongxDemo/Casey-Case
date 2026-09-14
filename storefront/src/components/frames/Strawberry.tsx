// Original kawaii-style illustration (hand-drawn, not sourced from any
// reference image). viewBox is 200x220 — must match FRAME_DEFS.strawberry's
// width/height in lib/frames.ts. The face-hole is the ellipse cx=100 cy=125
// rx=65 ry=75, cut via fill-rule="evenodd" — its bounding box (35,50,130,150)
// must match FRAME_DEFS.strawberry.hole (17.5%, 22.73%, 65%, 68.18%) if this
// shape is ever redrawn.
export function Strawberry({ style }: { style?: React.CSSProperties }) {
  return (
    <svg viewBox="0 0 200 220" style={style} xmlns="http://www.w3.org/2000/svg">
      <path
        d="M100,10 C150,10 180,50 185,90 C190,140 160,200 100,215 C40,200 10,140 15,90 C20,50 50,10 100,10 Z
           M35,125 A65,75 0 1,0 165,125 A65,75 0 1,0 35,125 Z"
        fill="#FF6B87"
        stroke="#E8425F"
        strokeWidth={4}
        fillRule="evenodd"
      />
      {/* seeds scattered on the red rim, kept clear of the hole */}
      {[
        [70, 25, -20], [100, 15, 0], [130, 25, 20],
        [45, 55, -30], [155, 55, 30],
        [28, 108, -60], [172, 108, 60],
        [48, 182, -40], [152, 182, 40],
        [78, 206, -10], [122, 206, 10],
      ].map(([cx, cy, rot], i) => (
        <ellipse key={i} cx={cx} cy={cy} rx={4} ry={7} fill="#FFE7A8" transform={`rotate(${rot} ${cx} ${cy})`} />
      ))}
      {/* leafy cap */}
      <g fill="#5FAE62" stroke="#3F8A46" strokeWidth={2}>
        <ellipse cx={100} cy={8} rx={10} ry={16} transform="rotate(0 100 8)" />
        <ellipse cx={78} cy={12} rx={9} ry={15} transform="rotate(-35 78 12)" />
        <ellipse cx={122} cy={12} rx={9} ry={15} transform="rotate(35 122 12)" />
        <ellipse cx={62} cy={22} rx={8} ry={13} transform="rotate(-60 62 22)" />
        <ellipse cx={138} cy={22} rx={8} ry={13} transform="rotate(60 138 22)" />
      </g>
    </svg>
  );
}
