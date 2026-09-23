/** Two further readings of the same line: gradient, and how twisted it is.
 *
 * Gradient is in the file. Technicality is not, and no amount of arithmetic
 * puts it there: rocks, roots and mud leave no trace in a list of coordinates.
 * What can be measured is the geometry of the line, and a twisting line with a
 * gradient that keeps changing is usually harder ground than a straight one.
 * That is a correlation, so it is named for what it measures.
 */

import { haversine, type Point } from './gpx.js';

export type Reading = 'elevation' | 'gradient' | 'roughness';

export type Band = {
  readonly from: number;
  readonly to: number;
  readonly value: number;
  readonly level: string;
};

/** Gradient bands, in the terms a runner uses rather than in percentages. */
export const GRADIENT_LEVELS: readonly (readonly [number, string])[] = [
  [-1, 'steep-down'],
  [-0.15, 'down'],
  [-0.05, 'flat'],
  [0.05, 'up'],
  [0.15, 'steep-up'],
];

export function gradientLevel(gradient: number): string {
  let level = 'flat';
  for (const [threshold, name] of GRADIENT_LEVELS) {
    if (gradient >= threshold) level = name;
  }
  return level;
}

/** How far the line wanders, compared with going straight.
 *
 * One means a straight line. Above about 1.3 the track is switchbacking, which
 * on a climb means a path rather than a road.
 */
export function sinuosity(points: readonly Point[], from: number, to: number): number {
  const window = points.filter((p) => p.distance >= from && p.distance <= to);
  if (window.length < 2) return 1;
  const along = window[window.length - 1].distance - window[0].distance;
  const direct = haversine(window[0], window[window.length - 1]);
  return direct > 1 ? Math.max(1, along / direct) : 1;
}

export const ROUGHNESS_WINDOW_M = 250;

/** A geometric roughness score, 0 to 100. Not a technicality rating.
 *
 * Half of it is how much the gradient moves inside the window, half is how much
 * the line wanders. Both rise on switchbacking mountain paths and stay low on
 * forest roads, which is the distinction worth showing. What it cannot see is
 * the surface underfoot, and the interface says so.
 */
export function roughness(points: readonly Point[], from: number, to: number): number {
  const window = points.filter((p) => p.distance >= from && p.distance <= to);
  if (window.length < 3) return 0;

  let changes = 0;
  let previous = 0;
  for (let i = 1; i < window.length; i += 1) {
    const run = window[i].distance - window[i - 1].distance;
    if (run < 1) continue;
    const g = (window[i].elevation - window[i - 1].elevation) / run;
    changes += Math.abs(g - previous);
    previous = g;
  }
  const spread = Math.min(1, changes / window.length / 0.12);
  const wander = Math.min(1, (sinuosity(points, from, to) - 1) / 0.6);
  return Math.round(((spread + wander) / 2) * 100);
}

export function roughnessLevel(score: number): string {
  if (score >= 66) return 'rough';
  if (score >= 33) return 'mixed';
  return 'smooth';
}

/** Bands thinner than this share of the course are absorbed by their larger
 *  neighbour. On a 171 km race a 250 m band is two pixels wide, and two pixels
 *  of colour is noise, not information. The reading is still taken every 250 m:
 *  what this drops is the drawing of a band too thin to be read. */
export const MIN_BAND_SHARE = 0.01;

/** Group the readings into bands wide enough to be seen, each labelled by the
 *  level that covers most of it.
 *
 *  The reading is still taken every 250 m. What this does is decide how to draw
 *  it: on a 171 km race a 250 m band is two pixels, and two pixels of colour is
 *  noise. A band closes once it is wide enough and the ground changes, so a long
 *  climb stays one shape and an alternating kilometre is named for its majority.
 */
function simplify(input: readonly Band[], minSpan: number): Band[] {
  const out: Band[] = [];
  let spans = new Map<string, number>();

  const dominant = () => [...spans].sort((a, b) => b[1] - a[1])[0][0];
  const open = (band: Band) => {
    spans = new Map([[band.level, band.to - band.from]]);
    out.push({ ...band });
  };

  for (const band of input) {
    const last = out[out.length - 1];
    if (!last) {
      open(band);
      continue;
    }
    if (last.level !== band.level && last.to - last.from >= minSpan) {
      out[out.length - 1] = { ...last, level: dominant() };
      open(band);
      continue;
    }
    spans.set(band.level, (spans.get(band.level) ?? 0) + (band.to - band.from));
    out[out.length - 1] = { ...last, to: band.to, value: (last.value + band.value) / 2 };
  }

  if (out.length) out[out.length - 1] = { ...out[out.length - 1], level: dominant() };

  // Labelling by majority can leave two neighbours agreeing. They are one band.
  const merged: Band[] = [];
  for (const band of out) {
    const last = merged[merged.length - 1];
    if (last && last.level === band.level) {
      merged[merged.length - 1] = { ...last, to: band.to, value: (last.value + band.value) / 2 };
    } else {
      merged.push(band);
    }
  }
  return merged;
}

/** Cut the course into bands of one reading, merging neighbours that agree so
 *  the drawing stays a few dozen shapes rather than a few thousand. */
export function bands(points: readonly Point[], reading: Reading, step = ROUGHNESS_WINDOW_M): Band[] {
  if (points.length < 2 || reading === 'elevation') return [];
  const total = points[points.length - 1].distance;
  const out: Band[] = [];

  for (let from = 0; from < total; from += step) {
    const to = Math.min(total, from + step);
    let value: number;
    let level: string;
    if (reading === 'gradient') {
      const a = points.find((p) => p.distance >= from) ?? points[0];
      const b = [...points].reverse().find((p) => p.distance <= to) ?? points[points.length - 1];
      const run = b.distance - a.distance;
      value = run > 1 ? (b.elevation - a.elevation) / run : 0;
      level = gradientLevel(value);
    } else {
      value = roughness(points, from, to);
      level = roughnessLevel(value);
    }
    const last = out[out.length - 1];
    if (last && last.level === level) {
      out[out.length - 1] = { ...last, to, value: (last.value + value) / 2 };
    } else {
      out.push({ from, to, value, level });
    }
  }
  return simplify(out, total * MIN_BAND_SHARE);
}
