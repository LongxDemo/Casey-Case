// Mirrors storefront/src/components/frames/Orange.tsx — kept as a second
// hand-copy since admin/ and storefront/ don't share a package. Keep the
// two in sync if the art or hole geometry ever changes.
export function Orange({ style }: { style?: React.CSSProperties }) {
  return (
    <svg viewBox="0 0 200 220" style={style} xmlns="http://www.w3.org/2000/svg">
      <path
        d="M100,45 C152,45 180,85 180,135 C180,183 145,215 100,215 C55,215 20,183 20,135 C20,85 48,45 100,45 Z
           M36,132 A64,64 0 1,0 164,132 A64,64 0 1,0 36,132 Z"
        fill="#FFA23E"
        stroke="#E8791A"
        strokeWidth={4}
        fillRule="evenodd"
      />
      <path d="M100,47 C100,34 102,26 108,20" fill="none" stroke="#6B4A2A" strokeWidth={5} strokeLinecap="round" />
      <ellipse cx={118} cy={16} rx={14} ry={9} fill="#5FAE62" stroke="#3F8A46" strokeWidth={2} transform="rotate(-15 118 16)" />
      {[
        [30, 60], [170, 60], [26, 135], [174, 135], [45, 195], [155, 195], [100, 205],
      ].map(([cx, cy], i) => (
        <circle key={i} cx={cx} cy={cy} r={3.2} fill="#E8791A" opacity={0.55} />
      ))}
    </svg>
  );
}
