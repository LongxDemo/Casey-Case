// Mirrors storefront/src/lib/frames.ts — kept as a second hand-copy since
// admin/ and storefront/ don't share a package. Keep the two in sync.
import { Strawberry } from '../components/frames/Strawberry';
import { Cherry } from '../components/frames/Cherry';

export type FrameDef = {
  id: string;
  name: string;
  Svg: React.FC<{ style?: React.CSSProperties }>;
  width: number;
  height: number;
  hole: { xPct: number; yPct: number; wPct: number; hPct: number };
};

export const FRAME_DEFS: Record<string, FrameDef> = {
  strawberry: {
    id: 'strawberry',
    name: 'Strawberry',
    Svg: Strawberry,
    width: 200,
    height: 220,
    hole: { xPct: 17.5, yPct: 22.73, wPct: 65, hPct: 68.18 },
  },
  cherry: {
    id: 'cherry',
    name: 'Cherry',
    Svg: Cherry,
    width: 200,
    height: 220,
    hole: { xPct: 17.5, yPct: 31.82, wPct: 65, hPct: 59.09 },
  },
};
