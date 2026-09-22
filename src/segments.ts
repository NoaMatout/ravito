/** Cutting a track into segments with a usable gradient.
 *
 * Below about fifty metres the gradient between two points is mostly noise,
 * even after smoothing. Above a few hundred it averages away the climbs that
 * decide the time.
 */

import type { Point } from './gpx.js';

export const SEGMENT_LENGTH_M = 50;

export type Segment = {
  readonly startM: number;
  readonly endM: number;
  readonly distance: number;
  readonly gradient: number;
  readonly ascent: number;
};

export function segment(points: Point[], length = SEGMENT_LENGTH_M): Segment[] {
  const out: Segment[] = [];
  let base = 0;
  for (let i = 1; i < points.length; i += 1) {
    const distance = points[i].distance - points[base].distance;
    if (distance < length) continue;
    const rise = points[i].elevation - points[base].elevation;
    out.push({
      startM: points[base].distance,
      endM: points[i].distance,
      distance,
      gradient: rise / distance,
      ascent: Math.max(0, rise),
    });
    base = i;
  }
  return out;
}
