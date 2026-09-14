// Mirrors storefront/src/components/frames/Strawberry.tsx — kept as a
// second hand-copy since admin/ and storefront/ don't share a package (same
// pattern as this app's other duplicated types/components). Keep the two in
// sync if the art or hole geometry ever changes.
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
      {[
        [70, 25, -20], [100, 15, 0], [130, 25, 20],
        [45, 55, -30], [155, 55, 30],
        [28, 108, -60], [172, 108, 60],
        [48, 182, -40], [152, 182, 40],
        [78, 206, -10], [122, 206, 10],
      ].map(([cx, cy, rot], i) => (
        <ellipse key={i} cx={cx} cy={cy} rx={4} ry={7} fill="#FFE7A8" transform={`rotate(${rot} ${cx} ${cy})`} />
      ))}
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
