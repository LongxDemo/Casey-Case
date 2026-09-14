// Original kawaii-style illustration (hand-drawn, not sourced from any
// reference image). viewBox is 200x220 — must match FRAME_DEFS.cherry's
// width/height in lib/frames.ts. The face-hole is the circle cx=100 cy=135
// r=65, cut via fill-rule="evenodd" — its bounding box (35,70,130,130) must
// match FRAME_DEFS.cherry.hole (17.5%, 31.82%, 65%, 59.09%) if this shape is
// ever redrawn.
export function Cherry({ style }: { style?: React.CSSProperties }) {
  return (
    <svg viewBox="0 0 200 220" style={style} xmlns="http://www.w3.org/2000/svg">
      {/* stem, drawn first so the body/bow sit on top of its base */}
      <path d="M112,50 C120,25 132,14 150,8" fill="none" stroke="#6B4A2A" strokeWidth={7} strokeLinecap="round" />
      <ellipse cx={158} cy={6} rx={13} ry={8} fill="#5FAE62" stroke="#3F8A46" strokeWidth={2} transform="rotate(-25 158 6)" />

      <path
        d="M100,50 C150,50 180,90 180,140 C180,185 145,215 100,215 C55,215 20,185 20,140 C20,90 50,50 100,50 Z
           M35,135 A65,65 0 1,0 165,135 A65,65 0 1,0 35,135 Z"
        fill="#D6304A"
        stroke="#A81F35"
        strokeWidth={4}
        fillRule="evenodd"
      />

      {/* small bow accent, matching the reference's decorated cherry */}
      <g>
        <path d="M118,45 L145,30 L140,52 Z" fill="#FFB6D9" stroke="#FF8FC4" strokeWidth={2} />
        <path d="M112,52 L88,38 L96,58 Z" fill="#FFB6D9" stroke="#FF8FC4" strokeWidth={2} />
        <circle cx={113} cy={50} r={6} fill="#FF8FC4" />
      </g>
    </svg>
  );
}
