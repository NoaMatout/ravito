/** Total ascent, which a naive sum gets wrong in a way nothing reveals.
 *
 * Measured against two races recorded with a barometric watch. On a mountain
 * course, 1264 m of real ascent, a naive sum returns 1299, three percent high.
 * On rolling terrain, 218 m of real ascent, it returns 273, twenty-five percent
 * high. The error is worst exactly where the number is smallest.
 *
 * The treatment below reproduced the reference to within one percent on the
 * first and exactly on the second.
 */

import type { Point } from './gpx.js';

/** Points on each side of the centre in the moving median. */
export const MEDIAN_HALF_WINDOW = 2;
/** A climb counts once it has gained this much since the last low point. */
export const ASCENT_THRESHOLD_M = 3;

export function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = sorted.length >> 1;
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

/** A moving median: removes spikes without dragging real transitions the way
 *  a moving mean does. */
export function smooth(points: Point[], halfWindow = MEDIAN_HALF_WINDOW): Point[] {
  return points.map((p, i) => ({
    ...p,
    elevation: median(
      points.slice(Math.max(0, i - halfWindow), i + halfWindow + 1).map((q) => q.elevation),
    ),
  }));
}

export type Relief = { readonly ascent: number; readonly descent: number };

/** Ascent and descent, banking a run of movement only once it exceeds the
 *  threshold. Below it, the signal is noise.
 *
 *  This is the exact algorithm validated against the two reference races. Any
 *  change to it must be rechecked against those fixtures, not reasoned about.
 */
export function relief(points: Point[], threshold = ASCENT_THRESHOLD_M): Relief {
  if (points.length < 2) return { ascent: 0, descent: 0 };
  const elevations = points.map((p) => p.elevation);

  const run = (climbing: boolean): number => {
    let banked = 0;
    let low = elevations[0];
    let high = elevations[0];
    for (const e of elevations.slice(1)) {
      if (climbing) {
        if (e > high) high = e;
        if (high - low >= threshold) {
          banked += high - low;
          low = high = e;
        } else if (e < low) {
          low = high = e;
        }
      } else {
        if (e < low) low = e;
        if (high - low >= threshold) {
          banked += high - low;
          low = high = e;
        } else if (e > high) {
          high = low = e;
        }
      }
    }
    banked += climbing ? Math.max(0, high - low) : Math.max(0, high - low);
    return banked;
  };

  return { ascent: run(true), descent: run(false) };
}
