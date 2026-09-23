/** The elevation profile, as inline SVG markup rather than an image.
 *
 * A profile is the one thing about a course that a table cannot say: where the
 * work is. Drawn as an inline path, it stays selectable markup, scales without
 * loss, carries a text alternative, and costs no request and no library.
 */

import type { Point } from './gpx.js';
import type { Band } from './terrain.js';

export const VIEW_WIDTH = 1000;
export const VIEW_HEIGHT = 180;
/** Enough to keep every climb visible, few enough to keep the markup small. */
export const SAMPLES = 480;

export type Marker = {
  readonly name: string;
  readonly distanceM: number;
  readonly x: number;
  readonly y: number;
};

/** One band of a reading, as a filled slice of the area under the curve.
 *  Colouring the ground the runner covers reads better than colouring the sky
 *  above it: the drawing stays one shape instead of becoming a barcode. */
export type Slice = { readonly d: string; readonly level: string };

export type Profile = {
  readonly area: string;
  readonly line: string;
  readonly markers: readonly Marker[];
  readonly slices: readonly Slice[];
  readonly lowest: number;
  readonly highest: number;
  readonly distanceM: number;
};

function sample(points: readonly Point[], count: number): Point[] {
  if (points.length <= count) return [...points];
  const total = points[points.length - 1].distance;
  const out: Point[] = [];
  let cursor = 0;
  for (let i = 0; i < count; i += 1) {
    const target = (total * i) / (count - 1);
    while (cursor < points.length - 1 && points[cursor].distance < target) cursor += 1;
    out.push(points[cursor]);
  }
  return out;
}

export function build(
  points: readonly Point[],
  stations: readonly { name: string; distanceM: number }[] = [],
  reading: readonly Band[] = [],
): Profile {
  if (points.length < 2) {
    return { area: '', line: '', markers: [], slices: [], lowest: 0, highest: 0, distanceM: 0 };
  }
  const distanceM = points[points.length - 1].distance || 1;
  const elevations = points.map((p) => p.elevation);
  const lowest = Math.min(...elevations);
  const highest = Math.max(...elevations);
  // A dead flat track would divide by zero. It is rare and it is not a reason
  // to render nothing, so the span floors at one metre.
  const span = Math.max(1, highest - lowest);

  const xOf = (d: number) => (d / distanceM) * VIEW_WIDTH;
  const yOf = (e: number) => VIEW_HEIGHT - ((e - lowest) / span) * VIEW_HEIGHT;

  const drawn = sample(points, SAMPLES);
  const line = drawn
    .map((p, i) => `${i === 0 ? 'M' : 'L'}${xOf(p.distance).toFixed(1)} ${yOf(p.elevation).toFixed(1)}`)
    .join(' ');
  const area = `${line} L${VIEW_WIDTH} ${VIEW_HEIGHT} L0 ${VIEW_HEIGHT} Z`;

  const markers = stations.map((s) => {
    let nearest = points[0];
    for (const p of points) {
      if (Math.abs(p.distance - s.distanceM) < Math.abs(nearest.distance - s.distanceM)) nearest = p;
    }
    return {
      name: s.name,
      distanceM: nearest.distance,
      x: xOf(nearest.distance),
      y: yOf(nearest.elevation),
    };
  });

  // Elevation read off the drawn samples, so a slice's edge sits exactly on
  // the line rather than a little above or below it.
  const elevationAt = (d: number): number => {
    if (d <= drawn[0].distance) return drawn[0].elevation;
    const last = drawn[drawn.length - 1];
    if (d >= last.distance) return last.elevation;
    let i = 1;
    while (i < drawn.length - 1 && drawn[i].distance < d) i += 1;
    const a = drawn[i - 1];
    const b = drawn[i];
    const t = (d - a.distance) / (b.distance - a.distance || 1);
    return a.elevation + (b.elevation - a.elevation) * t;
  };

  const point = (d: number, e: number) => `${xOf(d).toFixed(1)} ${yOf(e).toFixed(1)}`;

  const slices = reading.map((b) => {
    const inside = drawn.filter((p) => p.distance > b.from && p.distance < b.to);
    const along = [
      point(b.from, elevationAt(b.from)),
      ...inside.map((p) => point(p.distance, p.elevation)),
      point(b.to, elevationAt(b.to)),
    ];
    const d =
      `M${along[0]} ` +
      along.slice(1).map((c) => `L${c}`).join(' ') +
      ` L${xOf(b.to).toFixed(1)} ${VIEW_HEIGHT} L${xOf(b.from).toFixed(1)} ${VIEW_HEIGHT} Z`;
    return { d, level: b.level };
  });

  return { area, line, markers, slices, lowest, highest, distanceM };
}

/** The hatch that doubles every band, so no reading depends on hue.
 *
 *  The hatch is not decoration and it is not redundant: its direction is the
 *  direction of the slope and its density is the steepness, which means the
 *  drawing survives greyscale printing, colour blindness and a phone screen in
 *  full sun. Roughness uses texture rather than slope, because it has no
 *  direction to show.
 */
const HATCHES: readonly (readonly [string, string])[] = [
  ['steep-up', '<path d="M0 8 L8 0" stroke="currentColor" stroke-width="1.6"/>'],
  ['up', '<path d="M0 16 L16 0" stroke="currentColor" stroke-width="1.4"/>'],
  ['down', '<path d="M0 0 L16 16" stroke="currentColor" stroke-width="1.4"/>'],
  ['steep-down', '<path d="M0 0 L8 8" stroke="currentColor" stroke-width="1.6"/>'],
  ['rough', '<path d="M0 8 L8 0 M0 0 L8 8" stroke="currentColor" stroke-width="1.2"/>'],
  ['mixed', '<circle cx="4" cy="4" r="1.3" fill="currentColor"/>'],
];

/** Levels with no hatch are the quiet ones: flat ground and smooth line. */
export function hatchDefs(): string {
  return HATCHES.map(([level, mark]) => {
    const size = level === 'up' || level === 'down' ? 16 : 8;
    return (
      `<pattern id="hatch-${level}" width="${size}" height="${size}" ` +
      `patternUnits="userSpaceOnUse">${mark}</pattern>`
    );
  }).join('');
}

export function hasHatch(level: string): boolean {
  return HATCHES.some(([name]) => name === level);
}

/** What a screen reader is told. A profile that says nothing to someone who
 *  cannot see it is decoration, and this one carries real information. */
export function describe(profile: Profile): string {
  const km = (profile.distanceM / 1000).toFixed(1);
  return (
    `Elevation profile over ${km} km, from ${Math.round(profile.lowest)} ` +
    `to ${Math.round(profile.highest)} metres` +
    (profile.markers.length ? `, with ${profile.markers.length} aid stations marked.` : '.')
  );
}
