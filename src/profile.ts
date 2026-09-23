/** The elevation profile, as inline SVG markup rather than an image.
 *
 * A profile is the one thing about a course that a table cannot say: where the
 * work is. Drawn as an inline path, it stays selectable markup, scales without
 * loss, carries a text alternative, and costs no request and no library.
 */

import type { Point } from './gpx.js';

export const VIEW_WIDTH = 1000;
export const VIEW_HEIGHT = 180;
/** Enough to keep every climb visible, few enough to keep the markup small. */
export const SAMPLES = 480;

export type Marker = { readonly name: string; readonly x: number; readonly y: number };

export type Profile = {
  readonly area: string;
  readonly line: string;
  readonly markers: readonly Marker[];
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
): Profile {
  if (points.length < 2) {
    return { area: '', line: '', markers: [], lowest: 0, highest: 0, distanceM: 0 };
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
    return { name: s.name, x: xOf(nearest.distance), y: yOf(nearest.elevation) };
  });

  return { area, line, markers, lowest, highest, distanceM };
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
