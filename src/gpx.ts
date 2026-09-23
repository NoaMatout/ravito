/** Reading a GPX track.
 *
 * Deliberately parsed by pattern rather than by a DOM, so the same code runs
 * in a browser and in a test without a dependency. A GPX track point is a
 * simple, stable shape; anything more exotic is not a track.
 */

export type Point = {
  readonly lat: number;
  readonly lon: number;
  readonly elevation: number;
  /** Metres from the start, along the track. */
  readonly distance: number;
};

const TRKPT = /<trkpt[^>]*\blat="([-\d.]+)"[^>]*\blon="([-\d.]+)"[^>]*>([\s\S]*?)<\/trkpt>|<trkpt[^>]*\blon="([-\d.]+)"[^>]*\blat="([-\d.]+)"[^>]*\/>/g;
const ELE = /<ele>\s*([-\d.]+)\s*<\/ele>/;

const EARTH_RADIUS_M = 6371008.8;

/** Great-circle distance. Flat-earth approximations drift on long courses. */
export function haversine(a: Point | Omit<Point, 'distance'>, b: Point | Omit<Point, 'distance'>): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.lon - a.lon);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.min(1, Math.sqrt(h)));
}

/** A named point declared in the file, not part of the track itself. */
export type Waypoint = {
  readonly name: string;
  readonly lat: number;
  readonly lon: number;
};

const WPT = /<wpt[^>]*\blat="([-\d.]+)"[^>]*\blon="([-\d.]+)"[^>]*>([\s\S]*?)<\/wpt>/g;
const NAME = /<name>([\s\S]*?)<\/name>/;

/** Waypoints declared in the file.
 *
 * An official race GPX usually carries its aid stations here. Making the
 * runner retype kilometres the file already contains was a design mistake:
 * the first real race file tested made that obvious.
 */
export function parseWaypoints(xml: string): Waypoint[] {
  const found: Waypoint[] = [];
  WPT.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = WPT.exec(xml)) !== null) {
    const name = NAME.exec(m[3] ?? '');
    if (!name) continue;
    const lat = Number(m[1]);
    const lon = Number(m[2]);
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) continue;
    found.push({ name: name[1].trim().replace(/<[^>]*>/g, ''), lat, lon });
  }
  return found;
}

/** Where each waypoint falls along the track, in metres from the start.
 *
 * A waypoint sits near the track, not on one of its points, so it is matched
 * to the nearest recorded point. One further than 500 m from the track is
 * dropped: it describes something else, not a point of passage.
 */
export function locateOnTrack(
  points: readonly Point[],
  waypoints: readonly Waypoint[],
  toleranceM = 500,
): { name: string; distanceM: number }[] {
  const located = waypoints.flatMap((w) => {
    let best = Infinity;
    let at = 0;
    for (const p of points) {
      const d = haversine(p, { lat: w.lat, lon: w.lon, elevation: 0 });
      if (d < best) {
        best = d;
        at = p.distance;
      }
    }
    return best <= toleranceM ? [{ name: w.name, distanceM: at }] : [];
  });
  return located.sort((a, b) => a.distanceM - b.distanceM);
}

export class GpxError extends Error {}

export function parse(xml: string): Point[] {
  const raw: Omit<Point, 'distance'>[] = [];
  let m: RegExpExecArray | null;
  TRKPT.lastIndex = 0;
  while ((m = TRKPT.exec(xml)) !== null) {
    const lat = Number(m[1] ?? m[5]);
    const lon = Number(m[2] ?? m[4]);
    const inner = m[3] ?? '';
    const ele = ELE.exec(inner);
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) continue;
    raw.push({ lat, lon, elevation: ele ? Number(ele[1]) : NaN });
  }

  if (raw.length < 2) {
    throw new GpxError('this file contains fewer than two track points');
  }
  if (raw.some((p) => !Number.isFinite(p.elevation))) {
    throw new GpxError(
      'this track has no elevation data. Distance alone cannot give a duration, and a plan without one would mislead.',
    );
  }

  let travelled = 0;
  return raw.map((p, i) => {
    if (i > 0) travelled += haversine(raw[i - 1], p);
    return { ...p, distance: travelled };
  });
}
