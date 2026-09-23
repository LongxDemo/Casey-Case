// Mirrors storefront/src/components/frames/Bunny.tsx — kept as a second
// hand-copy since admin/ and storefront/ don't share a package. Keep the
// two in sync if the art or hole geometry ever changes.
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
