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

/** An aid station, from the file's waypoints or typed by the runner.
 *
 *  `water` marks a stand that carries water and nothing else. It changes
 *  nothing about what the runner eats and everything about what the runner
 *  carries: the food for the leg after it has to leave the previous full
 *  stand. A file's waypoints never say which is which, so they default to
 *  full and the interface says so. */
export type AidStation = {
  readonly distanceM: number;
  readonly name?: string;
  readonly water?: boolean;
};

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
  /** True when the stand closing this leg carries water only. */
  readonly water: boolean;
  /** Carbohydrate to leave the previous full stand with: this leg plus every
   *  following leg that ends at water only. Equal to carbsHigh when the next
   *  stand is a full one. */
  readonly carryHigh: number;
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
  aidStations: readonly (AidStation | number)[],
  roadFlatSpeed: number,
  terrain: TerrainProfile = DEFAULT_TERRAIN,
  terrainFactor = 1,
): Leg[] {
  const finish = segments.length ? segments[segments.length - 1].endM : 0;
  const declared = aidStations
    .map((a) => (typeof a === 'number' ? { distanceM: a } : a))
    .filter((a) => a.distanceM > 0 && a.distanceM < finish)
    .sort((a, b) => a.distanceM - b.distanceM);
  const cuts = declared.map((a) => a.distanceM);
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
      label:
        i + 1 === bounds.length - 1
          ? 'finish'
          : declared[i]?.name || `aid ${i + 1}`,
      seconds,
      ascent: inLeg.reduce((a, s) => a + s.ascent, 0),
      carbsLow: Math.round(CARBOHYDRATE_PER_HOUR.low * hours),
      carbsHigh: Math.round(CARBOHYDRATE_PER_HOUR.high * hours),
      cumulativeSeconds: cumulative,
      water: Boolean(declared[i]?.water),
      carryHigh: 0,
    });
  }

  // What to carry accumulates backwards: a leg that ends at water only cannot
  // be reloaded, so its food has to be on the runner already.
  let running = 0;
  for (let i = legs.length - 1; i >= 0; i -= 1) {
    running = legs[i].water ? running + legs[i].carbsHigh : legs[i].carbsHigh;
    legs[i] = { ...legs[i], carryHigh: running };
  }
  return legs;
}

/** The leg that decides pack and flask capacity. */
export function longestLeg(legs: readonly Leg[]): Leg | null {
  return legs.reduce<Leg | null>((worst, l) => (!worst || l.seconds > worst.seconds ? l : worst), null);
}
