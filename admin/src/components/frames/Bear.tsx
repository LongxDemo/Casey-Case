// Mirrors storefront/src/components/frames/Bear.tsx — kept as a second
// hand-copy since admin/ and storefront/ don't share a package. Keep the
// two in sync if the art or hole geometry ever changes.
export function Bear({ style }: { style?: React.CSSProperties }) {
  return (
    <svg viewBox="0 0 200 220" style={style} xmlns="http://www.w3.org/2000/svg">
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

      <ellipse cx={26} cy={158} rx={14} ry={10} fill="#FF8FC4" opacity={0.4} />
      <ellipse cx={174} cy={158} rx={14} ry={10} fill="#FF8FC4" opacity={0.4} />
    </svg>
  );
}
