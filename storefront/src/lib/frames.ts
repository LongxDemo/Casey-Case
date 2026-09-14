import { Strawberry } from '../components/frames/Strawberry';
import { Cherry } from '../components/frames/Cherry';

export type FrameDef = {
  id: string;
  name: string;
  Svg: React.FC<{ style?: React.CSSProperties }>;
  /** Intrinsic artboard size (matches each SVG's viewBox). */
  width: number;
  height: number;
  /** Face-hole rect as % of width/height — must match the cutout each SVG
   *  actually draws (see the cross-referencing comment in each frame component). */
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

export const frameOrder: string[] = ['strawberry', 'cherry'];
