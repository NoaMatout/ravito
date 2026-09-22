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
