/**
 * Pictures of the seven resources on a 32×32 grid, as plain shape data that ResourceIcon draws.
 * Each picture is painted: gradient fills, white highlights and a dark outline, close to the
 * look of the game's resource icons. The colors are part of the artwork, so they are the same
 * in both themes and do not come from the design tokens; only the round frame around them does.
 */
import type { Resource } from '../../core/layouts';

export interface Shape {
  tag: 'path' | 'polygon' | 'polyline' | 'circle' | 'ellipse' | 'rect';
  attrs: Readonly<Record<string, string | number>>;
  /** Fills the shape with this gradient instead of `attrs.fill`. */
  gradient?: GradientName | undefined;
}

/** Top to bottom color stops of each linear gradient. */
export const GRADIENTS = {
  bark: ['#9a6332', '#5a3215'],
  endwood: ['#f2c785', '#c98d45'],
  glass: ['#e8f1f5', '#9fb3bf'],
  liquid: ['#ffffff', '#8d99a3', '#4f5a63'],
  cork: ['#c08850', '#7a4a22'],
  rock1: ['#b9bcbd', '#5d6266'],
  rock2: ['#9ea3a6', '#4a4f53'],
  rock3: ['#d0d2d1', '#777c80'],
  sulfur1: ['#fff59a', '#e0aa12'],
  sulfur2: ['#ffe866', '#c98a0c'],
  redL: ['#ffc4b8', '#f2493b'],
  redR: ['#e8392c', '#860b12'],
  blueL: ['#a9d4ff', '#2e6fd6'],
  blueR: ['#3d7fe0', '#163f8f'],
  greenL: ['#b4f0a0', '#2f9a3a'],
  greenR: ['#3aa846', '#145f20'],
  yellowL: ['#fff3a0', '#e3b018'],
  yellowR: ['#e6b41e', '#9a6a08'],
  purpleL: ['#e2b8ff', '#9a4cd6'],
  purpleR: ['#9a4cd6', '#53207f'],
  coin: ['#fff3a6', '#e8b830', '#a5700f'],
  coinEdge: ['#d9a426', '#8a5a0c'],
  heap: ['#ffe47a', '#c88f14'],
} as const satisfies Record<string, readonly string[]>;

export type GradientName = keyof typeof GRADIENTS;

type Point = readonly [number, number];

const OUTLINE = { stroke: '#2a1608', 'stroke-width': 1, 'stroke-linejoin': 'round' } as const;
/** Coins get a thin line: a full outline on every coin turns the stack into a dark block. */
const THIN_OUTLINE = { ...OUTLINE, 'stroke-width': 0.6 } as const;
/** A white highlight laid over a part. */
const shine = (opacity: number) => ({ fill: '#fff', opacity }) as const;

const round = (value: number): number => Math.round(value * 100) / 100;
const points = (list: readonly Point[]): string =>
  list.map(([x, y]) => `${round(x)},${round(y)}`).join(' ');

/** Turns points around an origin; the angle is in degrees, clockwise on screen. */
function rotate(list: readonly Point[], degrees: number, [ox, oy]: Point): Point[] {
  const angle = (degrees * Math.PI) / 180;
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  return list.map(([x, y]) => [
    ox + (x - ox) * cos - (y - oy) * sin,
    oy + (x - ox) * sin + (y - oy) * cos,
  ]);
}

/** A closed smooth curve through the points, for soft lumps. */
function blob(list: readonly Point[]): string {
  const n = list.length;
  const at = (i: number): Point => list[(i + n) % n] as Point;
  let d = `M${points([at(0)])}`;
  for (let i = 0; i < n; i++) {
    const [p0, p1, p2, p3] = [at(i - 1), at(i), at(i + 1), at(i + 2)];
    const c1: Point = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2: Point = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += ` C${points([c1, c2, p2])}`;
  }
  return `${d}Z`;
}

const shape = (tag: Shape['tag'], attrs: Shape['attrs'], gradient?: GradientName): Shape => ({
  tag,
  attrs,
  gradient,
});

function wood(): Shape[] {
  const r = 5.4;
  const logs: Point[] = [
    [14.5, 11.5],
    [8.5, 21.5],
    [19.5, 21.5],
  ];
  const bodies = logs.map(([cx, cy]) =>
    shape(
      'path',
      {
        d: `M${cx},${cy - r} L${cx + 6.5},${cy - r - 2.5} A${round(r * 0.55)} ${r} 0 0 1 ${cx + 6.5},${round(cy + r - 2.5)} L${cx},${cy + r}Z`,
        ...OUTLINE,
      },
      'bark',
    ),
  );
  const bark = logs.map(([cx, cy]) =>
    shape('path', {
      d: `M${cx + 2},${round(cy - r + 0.4)} L${cx + 7},${round(cy - r - 2)}`,
      fill: 'none',
      stroke: '#c08a52',
      'stroke-width': 0.9,
      'stroke-linecap': 'round',
    }),
  );
  const ends = logs.flatMap(([cx, cy]) => [
    shape('circle', { cx, cy, r, ...OUTLINE }, 'endwood'),
    shape('circle', {
      cx,
      cy,
      r: r - 2,
      fill: 'none',
      stroke: '#8a5a2b',
      'stroke-width': 0.8,
      opacity: 0.8,
    }),
    shape('circle', { cx, cy, r: 1.1, fill: '#8a5a2b', opacity: 0.7 }),
  ]);
  return [...bodies, ...bark, ...ends];
}

function mercury(): Shape[] {
  return [
    shape('circle', { cx: 16, cy: 20, r: 9, ...OUTLINE }, 'glass'),
    shape('rect', { x: 13, y: 6, width: 6, height: 7, ...OUTLINE }, 'glass'),
    // The liquid fills the bulb below y = 18.
    shape('path', { d: 'M7.23,18 A9 9 0 1 0 24.77,18 Z' }, 'liquid'),
    shape('circle', { cx: 16, cy: 20, r: 9, fill: 'none', ...OUTLINE }),
    shape('rect', { x: 12, y: 3, width: 8, height: 4.5, rx: 1.2, ...OUTLINE }, 'cork'),
    shape('path', {
      d: 'M10.5,16.5 C11.5,13.8 13.5,12.6 15,12.4 C13.4,13.8 12.2,15.4 11.8,17.4 Z',
      ...shine(0.55),
    }),
    shape('ellipse', { cx: 20, cy: 23, rx: 2.2, ry: 1.2, ...shine(0.5) }),
  ];
}

function ore(): Shape[] {
  const rocks: [GradientName, Point[]][] = [
    [
      'rock2',
      [
        [8, 15],
        [13, 8],
        [21, 8.5],
        [26, 14],
        [21, 18],
        [12, 18],
      ],
    ],
    [
      'rock1',
      [
        [3, 25],
        [4.5, 18],
        [11, 14.5],
        [16.5, 19],
        [15.5, 26.5],
        [8, 28.5],
      ],
    ],
    [
      'rock2',
      [
        [15, 22],
        [18, 14.5],
        [25, 13.5],
        [29.5, 20],
        [28.5, 26.5],
        [20, 28.5],
      ],
    ],
    [
      'rock3',
      [
        [10, 29.5],
        [12, 23],
        [18.5, 22],
        [21.5, 27],
        [17, 30],
      ],
    ],
  ];
  const facets = [
    'M13,8 L21,8.5 L18,12 L12.5,11Z',
    'M4.5,18 L11,14.5 L10,19 L5,21Z',
    'M18,14.5 L25,13.5 L23,18 L18.5,18Z',
    'M12,23 L18.5,22 L16.5,25 L12.5,25.5Z',
  ];
  return [
    ...rocks.map(([gradient, list]) =>
      shape('polygon', { points: points(list), ...OUTLINE }, gradient),
    ),
    ...facets.map((d) => shape('path', { d, ...shine(0.32) })),
  ];
}

function sulfur(): Shape[] {
  const lumps: [GradientName, Point[]][] = [
    [
      'sulfur2',
      [
        [9, 16],
        [12, 9.5],
        [18, 8],
        [23, 11],
        [23, 17],
        [15, 19],
      ],
    ],
    [
      'sulfur1',
      [
        [3.5, 25.5],
        [5, 19.5],
        [10.5, 16],
        [15.5, 19.5],
        [15, 26],
        [9, 28.5],
      ],
    ],
    [
      'sulfur2',
      [
        [16, 24],
        [17.5, 17],
        [23.5, 15],
        [28.5, 19.5],
        [28, 25.5],
        [22, 28.5],
      ],
    ],
    [
      'sulfur1',
      [
        [10.5, 29],
        [12.5, 24],
        [17.5, 22.8],
        [21, 26.5],
        [16.5, 30],
      ],
    ],
  ];
  const glints = [
    'M13,11 C15,9.5 17,9.4 18.5,10 C16.5,11 14.8,12 13.6,13Z',
    'M6.5,20 C8,18 9.6,17.4 11,17.5 C9.6,18.6 8.4,19.6 7.3,21.4Z',
    'M19,18.2 C20.6,16.5 22.5,16.2 24,16.6 C22.3,17.5 21,18.4 19.8,19.8Z',
    'M13.4,24.7 C14.8,23.8 16.2,23.7 17.4,24 C16,24.6 15,25.3 14.2,26Z',
  ];
  return [
    ...lumps.map(([gradient, list]) => shape('path', { d: blob(list), ...OUTLINE }, gradient)),
    ...glints.map((d) => shape('path', { d, ...shine(0.6) })),
  ];
}

/** A clump of thick red shards fanning out from one spot, back ones first. */
function crystal(): Shape[] {
  const shard = (bx: number, by: number, angle: number, length: number, width: number): Shape[] => {
    const h = width / 2;
    const shoulder = by - length * 0.72;
    const tip = by - length;
    const turn = (list: Point[]): string => points(rotate(list, angle, [bx, by]));
    const outline: Point[] = [
      [bx - h, by],
      [bx - h, shoulder],
      [bx, tip],
      [bx + h, shoulder],
      [bx + h, by],
    ];
    return [
      shape(
        'polygon',
        {
          points: turn([
            [bx - h, by],
            [bx - h, shoulder],
            [bx, tip],
            [bx, by],
          ]),
        },
        'redL',
      ),
      shape(
        'polygon',
        {
          points: turn([
            [bx, by],
            [bx, tip],
            [bx + h, shoulder],
            [bx + h, by],
          ]),
        },
        'redR',
      ),
      shape('polygon', { points: turn(outline), fill: 'none', ...OUTLINE }),
      shape('polygon', {
        points: turn([
          [bx - h + 0.7, by - 1],
          [bx - h + 0.7, shoulder + 0.3],
          [bx - 0.6, tip + 2.2],
          [bx - 1.6, shoulder + 1.5],
        ]),
        ...shine(0.55),
      }),
    ];
  };
  return [
    ...shard(13, 26, -52, 12, 6),
    ...shard(19, 26, 50, 12, 6),
    ...shard(14, 26, -22, 17, 6.5),
    ...shard(18, 26, 24, 15, 6.5),
    ...shard(16, 27, 0, 23, 7.5),
    ...shard(11.5, 27.5, -74, 10, 5.5),
    ...shard(20.5, 27.5, 76, 10, 5.5),
    ...shard(12, 29, -36, 10, 5),
    ...shard(20, 29, 38, 9, 5),
    ...shard(14.5, 30, -8, 7, 5),
    ...shard(18, 30.2, 14, 6, 4.5),
  ];
}

type GemColor = 'blue' | 'green' | 'yellow' | 'purple' | 'red';

/** Cut stones in a tight pile: crown on top, pointed pavilion below. */
function gems(): Shape[] {
  const gem = (cx: number, cy: number, w: number, color: GemColor): Shape[] => {
    const h = w * 0.8;
    const tl: Point = [cx - w * 0.26, cy - h * 0.45];
    const tr: Point = [cx + w * 0.26, cy - h * 0.45];
    const gr: Point = [cx + w / 2, cy - h * 0.12];
    const gl: Point = [cx - w / 2, cy - h * 0.12];
    const bottom: Point = [cx, cy + h * 0.55];
    const light: GradientName = `${color}L`;
    const dark: GradientName = `${color}R`;
    return [
      shape('polygon', { points: points([gl, tl, tr, gr]) }, light),
      shape('polygon', { points: points([gl, [cx, gl[1]], bottom]) }, dark),
      shape('polygon', { points: points([[cx, gl[1]], gr, bottom]), opacity: 0.85 }, light),
      shape('polygon', { points: points([gl, tl, tr, gr, bottom]), fill: 'none', ...OUTLINE }),
      shape('polyline', {
        points: points([gl, gr]),
        fill: 'none',
        stroke: '#000',
        'stroke-opacity': 0.35,
        'stroke-width': 0.6,
      }),
      shape('polygon', {
        points: points([tl, [cx, tl[1]], [cx - w * 0.12, gl[1]]]),
        ...shine(0.6),
      }),
    ];
  };
  return [
    ...gem(9.5, 11.5, 16, 'blue'),
    ...gem(22.5, 11.5, 15, 'green'),
    ...gem(6.5, 23.5, 12, 'yellow'),
    ...gem(25, 23.5, 11.5, 'purple'),
    ...gem(16, 21, 16, 'red'),
  ];
}

/** A heap of gold with loose coins and a stack beside it. */
function gold(): Shape[] {
  const coin = (cx: number, cy: number, rx: number, ry: number): Shape[] => [
    shape('ellipse', { cx, cy: round(cy + 0.9), rx, ry, ...THIN_OUTLINE }, 'coinEdge'),
    shape('ellipse', { cx, cy, rx, ry, ...THIN_OUTLINE }, 'coin'),
    shape('ellipse', {
      cx: round(cx - rx * 0.25),
      cy: round(cy - ry * 0.25),
      rx: round(rx * 0.45),
      ry: round(ry * 0.35),
      ...shine(0.45),
    }),
  ];
  const heap: Point[] = [
    [2.5, 28.5],
    [5, 21.5],
    [10.5, 18],
    [16, 20],
    [19.5, 26],
    [18, 29.5],
    [10, 30.3],
  ];
  const stack: Shape[] = [];
  for (let i = 0; i < 6; i++) {
    stack.push(...coin(22.5, round(27 - i * 2.4), 6, 2.2));
  }
  return [
    shape('path', { d: blob(heap), ...THIN_OUTLINE }, 'heap'),
    ...coin(8, 22, 3.6, 1.5),
    ...coin(13.5, 24.5, 3.4, 1.4),
    ...coin(6.5, 27, 3.2, 1.3),
    ...stack,
    shape('circle', { cx: 20, cy: 14.2, r: 0.9, fill: '#fff' }),
    shape('path', { d: 'M20,12.6 V15.8 M18.4,14.2 H21.6', stroke: '#fff', 'stroke-width': 0.5 }),
  ];
}

export const RESOURCE_ART: Readonly<Record<Resource, readonly Shape[]>> = {
  wood: wood(),
  mercury: mercury(),
  ore: ore(),
  sulfur: sulfur(),
  crystal: crystal(),
  gems: gems(),
  gold: gold(),
};

/**
 * How far each picture moves down (or up, when negative) so that its middle lands on the
 * middle of the frame: the pictures are drawn sitting on the bottom of the grid.
 */
export const RESOURCE_SHIFT: Readonly<Record<Resource, number>> = {
  wood: 0.75,
  mercury: 0,
  ore: -3,
  sulfur: -3,
  crystal: -1.35,
  gems: -1.25,
  gold: -5.5,
};

/** The gradients each picture uses, so an icon defines only those. */
export const RESOURCE_GRADIENTS: Readonly<Record<Resource, readonly GradientName[]>> =
  Object.fromEntries(
    Object.entries(RESOURCE_ART).map(([resource, art]) => [
      resource,
      [...new Set(art.flatMap(({ gradient }) => (gradient ? [gradient] : [])))],
    ]),
  ) as Record<Resource, GradientName[]>;
