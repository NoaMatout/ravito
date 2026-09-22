/** What to eat, in ranges, with the source attached.
 *
 * Only carbohydrate ships. Fluid and sodium are deliberately absent: the
 * figures everyone quotes are plausible, and I could not open a source I was
 * willing to cite for them. A plan that invents two of its three numbers is
 * worse than a plan that admits to one.
 *
 * `MISSING` is exported so the interface can say what is missing rather than
 * quietly leaving it out.
 */

import { sourceFor } from './sources.js';

export type Range = { readonly low: number; readonly high: number };

/** Grams of carbohydrate per hour. */
export const CARBOHYDRATE_PER_HOUR: Range = { low: 60, high: 90 };
/** Above this, a trained gut and multiple transportable carbohydrates. */
export const GUT_TRAINING_THRESHOLD = 60;

export const MISSING = [
  {
    what: 'fluid',
    why: 'sweat rate varies about threefold between runners and no formula recovers it from body mass. I could not open a source I was willing to cite for a default range.',
  },
  {
    what: 'sodium',
    why: 'the figures depend on the fluid range, which is not shipped, and on sweat composition, which is not measured here.',
  },
];

export type Needs = {
  readonly hours: number;
  readonly perHour: Range;
  readonly total: Range;
  readonly note: string;
  readonly source: string;
};

export function needs(durationSeconds: number): Needs {
  const hours = durationSeconds / 3600;
  const perHour = CARBOHYDRATE_PER_HOUR;
  return {
    hours,
    perHour,
    total: { low: Math.round(perHour.low * hours), high: Math.round(perHour.high * hours) },
    note: `above ${GUT_TRAINING_THRESHOLD} g/h, multiple transportable carbohydrates and a trained gut`,
    source: sourceFor('carbohydrate-per-hour').reference,
  };
}
