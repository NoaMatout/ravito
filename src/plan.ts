/** The plan: what to carry between aid stations, and what to have eaten on
 *  arrival at each one.
 *
 * A GPX does not contain aid stations. They are entered as distances read off
 * the race road-book, and they are what makes a plan a plan: on a trail you
 * can only reload where there is a stand.
 */

import type { Segment } from './segments.js';
import { speedAt, type TerrainProfile, DEFAULT_TERRAIN } from './pace.js';
import { CARBOHYDRATE_PER_HOUR } from './nutrition.js';

export type Leg = {
  readonly index: number;
  readonly fromM: number;
  readonly toM: number;
  readonly label: string;
  readonly seconds: number;
  readonly ascent: number;
  readonly carbsLow: number;
  readonly carbsHigh: number;
  readonly cumulativeSeconds: number;
};

export function durationOf(
  segments: readonly Segment[],
  roadFlatSpeed: number,
  terrain: TerrainProfile = DEFAULT_TERRAIN,
  terrainFactor = 1,
): number {
  return (
    segments.reduce(
      (total, s) => total + s.distance / Math.max(0.3, speedAt(s.gradient, roadFlatSpeed, terrain)),
      0,
    ) * terrainFactor
  );
}

/** Split the course at the declared aid stations, in metres from the start. */
export function build(
  segments: readonly Segment[],
  aidStationsM: readonly number[],
  roadFlatSpeed: number,
  terrain: TerrainProfile = DEFAULT_TERRAIN,
  terrainFactor = 1,
): Leg[] {
  const finish = segments.length ? segments[segments.length - 1].endM : 0;
  const cuts = [...new Set(aidStationsM.filter((m) => m > 0 && m < finish))].sort((a, b) => a - b);
  const bounds = [0, ...cuts, finish];

  const legs: Leg[] = [];
  let cumulative = 0;
  for (let i = 0; i < bounds.length - 1; i += 1) {
    const fromM = bounds[i];
    const toM = bounds[i + 1];
    // Assign by midpoint. Filtering on both ends drops every segment that
    // straddles an aid station, and the loss is invisible: the plan simply
    // adds up to slightly less than the whole. The test pins this down.
    const inLeg = segments.filter((s) => {
      const middle = (s.startM + s.endM) / 2;
      return middle >= fromM && (middle < toM || toM >= finish);
    });
    const seconds = durationOf(inLeg, roadFlatSpeed, terrain, terrainFactor);
    cumulative += seconds;
    const hours = seconds / 3600;
    legs.push({
      index: i + 1,
      fromM,
      toM,
      label: i + 1 === bounds.length - 1 ? 'finish' : `aid ${i + 1}`,
      seconds,
      ascent: inLeg.reduce((a, s) => a + s.ascent, 0),
      carbsLow: Math.round(CARBOHYDRATE_PER_HOUR.low * hours),
      carbsHigh: Math.round(CARBOHYDRATE_PER_HOUR.high * hours),
      cumulativeSeconds: cumulative,
    });
  }
  return legs;
}

/** The leg that decides pack and flask capacity. */
export function longestLeg(legs: readonly Leg[]): Leg | null {
  return legs.reduce<Leg | null>((worst, l) => (!worst || l.seconds > worst.seconds ? l : worst), null);
}
