/** Turning a gradient into a speed.
 *
 * Two different things are going on, and mixing them is what makes naive trail
 * predictors wrong.
 *
 * Uphill, speed is limited by metabolism, and Minetti's cost curve predicts it
 * well: measured within five to eight percent on a real mountain race.
 *
 * Downhill and on the flat, speed is not limited by metabolism at all. It is
 * limited by footing, technique and braking. On that same race the model was
 * out by thirty-six percent on moderate descents and eighty-five on steep ones,
 * and even the flat sections ran twenty-three percent slower than the runner's
 * road pace. Trail flat is not road flat.
 *
 * So physiology is used where it measured well, and a terrain profile
 * elsewhere. The terrain numbers come from one runner on one course and are
 * labelled as such everywhere they surface.
 */

import { sourceFor } from './sources.js';

/** Minetti et al. 2002, energy cost of running in J/kg/m. */
export function costOfRunning(gradient: number): number {
  const i = Math.max(-0.45, Math.min(0.45, gradient));
  return 155.4 * i ** 5 - 30.4 * i ** 4 - 43.3 * i ** 3 + 46.3 * i ** 2 + 19.5 * i + 3.6;
}

export const LEVEL_COST = costOfRunning(0); // 3.6 J/kg/m

/** Trail flat speed as a fraction of road flat speed. */
export const TRAIL_FLAT_FACTOR = 0.78;
/** Climbs measured five to eight percent slower than the metabolic model. */
export const CLIMB_PENALTY = 1.06;
/** Below this gradient magnitude the two regimes are blended, to avoid a step
 *  at zero where none exists on the ground. */
export const BLEND_GRADIENT = 0.03;

/** Descent speed as a multiple of trail flat speed, by gradient.
 *  Measured points are marked; the steepest is extrapolated and says so. */
export const DESCENT_SHAPE: readonly (readonly [number, number, string])[] = [
  [0.0, 1.0, 'measured'],
  [-0.1, 1.26, 'measured'],
  [-0.2, 0.9, 'measured'],
  [-0.35, 0.75, 'extrapolated'],
];

export function descentMultiplier(gradient: number): number {
  const g = Math.max(-0.45, Math.min(0, gradient));
  const pts = DESCENT_SHAPE;
  for (let k = 0; k < pts.length - 1; k += 1) {
    const [g1, m1] = pts[k];
    const [g2, m2] = pts[k + 1];
    if (g <= g1 && g >= g2) {
      const t = (g - g1) / (g2 - g1);
      return m1 + t * (m2 - m1);
    }
  }
  return pts[pts.length - 1][1];
}

export type TerrainProfile = {
  readonly trailFlatFactor: number;
  readonly climbPenalty: number;
};

export const DEFAULT_TERRAIN: TerrainProfile = {
  trailFlatFactor: TRAIL_FLAT_FACTOR,
  climbPenalty: CLIMB_PENALTY,
};

/** Speed in m/s on one gradient, from a road flat speed in m/s. */
export function speedAt(
  gradient: number,
  roadFlatSpeed: number,
  terrain: TerrainProfile = DEFAULT_TERRAIN,
): number {
  const climbing = (g: number) =>
    (roadFlatSpeed * LEVEL_COST) / costOfRunning(g) / terrain.climbPenalty;
  const rolling = (g: number) =>
    roadFlatSpeed * terrain.trailFlatFactor * descentMultiplier(g);

  if (gradient > BLEND_GRADIENT) return climbing(gradient);
  if (gradient < -BLEND_GRADIENT) return rolling(gradient);

  // Between the two regimes, blend rather than step.
  const t = (gradient + BLEND_GRADIENT) / (2 * BLEND_GRADIENT);
  return rolling(Math.min(0, gradient)) * (1 - t) + climbing(Math.max(0, gradient)) * t;
}

/** The terrain factor a runner actually has, measured from a race they ran.
 *
 * This is the honest answer to a model that cannot know someone's technical
 * ability: do not guess it, compute it from something they have already done.
 */
export function calibrate(
  segments: readonly { distance: number; gradient: number }[],
  roadFlatSpeed: number,
  actualSeconds: number,
): number {
  const predicted = segments.reduce(
    (total, s) => total + s.distance / Math.max(0.3, speedAt(s.gradient, roadFlatSpeed)),
    0,
  );
  if (predicted <= 0) throw new Error('no usable segment to calibrate against');
  return actualSeconds / predicted;
}

export const PACE_SOURCES = [sourceFor('minetti-running-cost'), sourceFor('terrain-factor')];
