import { Strawberry } from '../components/frames/Strawberry';
import { Cherry } from '../components/frames/Cherry';
import { Peach } from '../components/frames/Peach';
import { Watermelon } from '../components/frames/Watermelon';
import { Orange } from '../components/frames/Orange';
import { Donut } from '../components/frames/Donut';
import { Bear } from '../components/frames/Bear';
import { Bunny } from '../components/frames/Bunny';
import { Dog } from '../components/frames/Dog';
import { Cat } from '../components/frames/Cat';

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
  peach: {
    id: 'peach',
    name: 'Peach',
    Svg: Peach,
    width: 200,
    height: 220,
    hole: { xPct: 18.5, yPct: 31.82, wPct: 63, hPct: 57.27 },
  },
  watermelon: {
    id: 'watermelon',
    name: 'Watermelon',
    Svg: Watermelon,
    width: 200,
    height: 220,
    hole: { xPct: 16, yPct: 20.45, wPct: 68, hPct: 61.82 },
  },
  orange: {
    id: 'orange',
    name: 'Orange',
    Svg: Orange,
    width: 200,
    height: 220,
    hole: { xPct: 18, yPct: 30.91, wPct: 64, hPct: 58.18 },
  },
  donut: {
    id: 'donut',
    name: 'Donut',
    Svg: Donut,
    width: 200,
    height: 220,
    hole: { xPct: 27, yPct: 33.64, wPct: 46, hPct: 41.82 },
  },
  bear: {
    id: 'bear',
    name: 'Bear',
    Svg: Bear,
    width: 200,
    height: 220,
    hole: { xPct: 16, yPct: 32.73, wPct: 68, hPct: 61.82 },
  },
  bunny: {
    id: 'bunny',
    name: 'Bunny',
    Svg: Bunny,
    width: 200,
    height: 220,
    hole: { xPct: 16, yPct: 32.73, wPct: 68, hPct: 61.82 },
  },
  dog: {
    id: 'dog',
    name: 'Dog',
    Svg: Dog,
    width: 200,
    height: 220,
    hole: { xPct: 16, yPct: 32.73, wPct: 68, hPct: 61.82 },
  },
  cat: {
    id: 'cat',
    name: 'Cat',
    Svg: Cat,
    width: 200,
    height: 220,
    hole: { xPct: 16, yPct: 32.73, wPct: 68, hPct: 61.82 },
  },
};

export const frameOrder: string[] = ['strawberry', 'cherry', 'peach', 'watermelon', 'orange', 'donut', 'bear', 'bunny', 'dog', 'cat'];
