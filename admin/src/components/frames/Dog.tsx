// Mirrors storefront/src/components/frames/Dog.tsx — kept as a second
// hand-copy since admin/ and storefront/ don't share a package. Keep the
// two in sync if the art or hole geometry ever changes.
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

      <rect x={-6} y={145} width={29} height={72} rx={14} fill="#D9A468" stroke="#B37D3E" strokeWidth={4} />
      <rect x={177} y={145} width={29} height={72} rx={14} fill="#D9A468" stroke="#B37D3E" strokeWidth={4} />

      <circle cx={26} cy={100} r={13} fill="#D9A468" />
      <circle cx={174} cy={100} r={13} fill="#D9A468" />
    </svg>
  );
}
