// Original kawaii-style illustration (hand-drawn, not sourced from any
// reference image). viewBox is 200x220 — must match FRAME_DEFS.peach's
// width/height in lib/frames.ts. The face-hole is the circle cx=100 cy=133
// r=63, cut via fill-rule="evenodd" — its bounding box (37,70,126,126) must
// match FRAME_DEFS.peach.hole (18.5%, 31.82%, 63%, 57.27%) if this shape is
// ever redrawn.
export function Peach({ style }: { style?: React.CSSProperties }) {
  return (
    <svg viewBox="0 0 200 220" style={style} xmlns="http://www.w3.org/2000/svg">
      <path
        d="M100,48 C152,48 180,88 180,138 C180,186 144,216 100,216 C56,216 20,186 20,138 C20,88 48,48 100,48 Z
           M37,133 A63,63 0 1,0 163,133 A63,63 0 1,0 37,133 Z"
        fill="#FFB199"
        stroke="#F0805E"
        strokeWidth={4}
        fillRule="evenodd"
      />
      {/* classic peach top-cleft: two lobes meeting in a shallow V */}
      <path d="M100,50 C94,34 84,24 72,20 C86,14 106,15 118,22 C108,26 100,36 100,50 Z" fill="#FF9E86" stroke="#F0805E" strokeWidth={3} />
      {/* small stem + leaf */}
      <path d="M100,22 C100,12 104,6 112,3" fill="none" stroke="#6B4A2A" strokeWidth={5} strokeLinecap="round" />
      <ellipse cx={122} cy={4} rx={12} ry={7} fill="#5FAE62" stroke="#3F8A46" strokeWidth={2} transform="rotate(-20 122 4)" />
      {/* soft blush, kept clear of the hole */}
      <ellipse cx={40} cy={95} rx={14} ry={20} fill="#FF7D63" opacity={0.35} transform="rotate(-20 40 95)" />
      <ellipse cx={162} cy={175} rx={12} ry={18} fill="#FF7D63" opacity={0.3} transform="rotate(15 162 175)" />
    </svg>
  );
}
