// Original kawaii-style illustration (hand-drawn, not sourced from any
// reference image). viewBox is 200x220 — must match FRAME_DEFS.cat's
// width/height in lib/frames.ts. Shares Bear's head/hole shape (circle
// cx=100 cy=140 r=68, bbox 32,72,136,136 -> 16%, 32.73%, 68%, 61.82%).
// Pointed ears sit above y=58 and whiskers are kept short (x 2-28 / 172-
// 198), both well clear of the hole's boundary at those heights.
export function Cat({ style }: { style?: React.CSSProperties }) {
  return (
    <svg viewBox="0 0 200 220" style={style} xmlns="http://www.w3.org/2000/svg">
      <path d="M28,55 L52,2 L78,58 Z" fill="#C9CDD6" stroke="#9AA0AC" strokeWidth={4} strokeLinejoin="round" />
      <path d="M38,50 L52,20 L66,50 Z" fill="#FFC9DE" />
      <path d="M122,58 L148,2 L172,55 Z" fill="#C9CDD6" stroke="#9AA0AC" strokeWidth={4} strokeLinejoin="round" />
      <path d="M134,50 L148,20 L162,50 Z" fill="#FFC9DE" />

      <path
        d="M100,40 C158,40 188,82 188,140 C188,192 148,218 100,218 C52,218 12,192 12,140 C12,82 42,40 100,40 Z
           M32,140 A68,68 0 1,0 168,140 A68,68 0 1,0 32,140 Z"
        fill="#C9CDD6"
        stroke="#9AA0AC"
        strokeWidth={4}
        fillRule="evenodd"
      />

      {/* whiskers, kept short so they stay clear of the hole */}
      <g stroke="#9AA0AC" strokeWidth={2.5} strokeLinecap="round">
        <path d="M2,146 L28,144" />
        <path d="M2,156 L28,156" />
        <path d="M2,166 L28,168" />
        <path d="M198,146 L172,144" />
        <path d="M198,156 L172,156" />
        <path d="M198,166 L172,168" />
      </g>
    </svg>
  );
}
