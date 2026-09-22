import test from 'node:test';
import assert from 'node:assert/strict';

import { parse, GpxError, haversine } from '../src/gpx.js';
import { smooth, relief } from '../src/elevation.js';
import { segment } from '../src/segments.js';
import { costOfRunning, speedAt, descentMultiplier, calibrate, LEVEL_COST } from '../src/pace.js';
import { build, durationOf } from '../src/plan.js';
import { needs } from '../src/nutrition.js';
import { SOURCES, sourceFor } from '../src/sources.js';

/** A GPX built from a known profile, so the expected answer is known. */
function gpxFrom(elevations: number[], stepM = 25): string {
  const perDegree = 111_320;
  const points = elevations
    .map((e, i) => {
      const lat = 45 + (i * stepM) / perDegree;
      return `<trkpt lat="${lat.toFixed(8)}" lon="6.0"><ele>${e}</ele></trkpt>`;
    })
    .join('');
  return `<?xml version="1.0"?><gpx><trk><trkseg>${points}</trkseg></trk></gpx>`;
}

test('a track is read with cumulative distance', () => {
  const points = parse(gpxFrom([100, 110, 120]));
  assert.equal(points.length, 3);
  assert.equal(points[0].distance, 0);
  assert.ok(points[2].distance > 45 && points[2].distance < 55, `got ${points[2].distance}`);
});

test('a file without elevation is refused, not guessed', () => {
  const xml = '<gpx><trk><trkseg><trkpt lat="45" lon="6"/><trkpt lat="45.001" lon="6"/></trkseg></trk></gpx>';
  assert.throws(() => parse(xml), GpxError);
});

test('a file with one point is refused', () => {
  assert.throws(() => parse(gpxFrom([100])), GpxError);
});

test('NEGATIVE CONTROL: noise inflates a naive ascent sum, the treatment removes it', () => {
  // Ten steps of 20 m: 180 m of real ascent, plus alternating noise.
  const clean: number[] = [];
  for (let step = 0; step < 10; step += 1) for (let k = 0; k < 6; k += 1) clean.push(step * 20);
  const noisy = clean.map((e, i) => e + (i % 2 ? 0.9 : -0.9));

  const points = parse(gpxFrom(noisy));
  const naive = points
    .slice(1)
    .reduce((sum, p, i) => sum + Math.max(0, p.elevation - points[i].elevation), 0);
  const treated = relief(smooth(points)).ascent;

  assert.ok(naive > 180 * 1.12, `a naive sum should be inflated, got ${naive.toFixed(0)}`);
  assert.ok(
    Math.abs(treated - 180) < 180 * 0.1,
    `the treatment should recover 180 m, got ${treated.toFixed(0)}`,
  );
});

test('the published level cost is 3.6 J/kg/m', () => {
  assert.ok(Math.abs(LEVEL_COST - 3.6) < 1e-9);
  assert.ok(costOfRunning(0.2) > costOfRunning(0), 'climbing must cost more than level');
});

test('steeper never means faster uphill', () => {
  const road = 3.0;
  let previous = Infinity;
  for (const g of [0.05, 0.1, 0.15, 0.2, 0.3, 0.4]) {
    const v = speedAt(g, road);
    assert.ok(v < previous, `speed should fall as gradient rises, ${g}`);
    previous = v;
  }
});

test('descent speed peaks on moderate slopes and collapses on steep ones', () => {
  assert.ok(descentMultiplier(-0.1) > descentMultiplier(0), 'moderate descent is faster than flat');
  assert.ok(descentMultiplier(-0.25) < descentMultiplier(-0.1), 'steep descent is slower again');
});

test('trail flat is slower than road flat', () => {
  assert.ok(speedAt(0, 3.0) < 3.0);
});

test('a terrain factor is recovered from a race already run', () => {
  const points = parse(gpxFrom(Array.from({ length: 200 }, (_, i) => 100 + i * 2)));
  const segments = segment(points);
  const road = 3.0;
  const predicted = durationOf(segments, road);
  const factor = calibrate(segments, road, predicted * 1.2);
  assert.ok(Math.abs(factor - 1.2) < 0.01, `expected 1.2, got ${factor}`);
});

test('NEGATIVE CONTROL: the legs of a plan sum to the whole', () => {
  const points = parse(gpxFrom(Array.from({ length: 400 }, (_, i) => 100 + Math.sin(i / 20) * 60)));
  const segments = segment(points);
  const road = 3.0;
  const whole = durationOf(segments, road);
  const legs = build(segments, [2000, 5000, 7500], road);
  const summed = legs.reduce((t, l) => t + l.seconds, 0);
  assert.ok(Math.abs(summed - whole) < whole * 0.01, `legs ${summed} vs whole ${whole}`);
  assert.equal(legs[legs.length - 1].label, 'finish');
});

test('an aid station beyond the finish is ignored rather than breaking the plan', () => {
  const points = parse(gpxFrom(Array.from({ length: 100 }, () => 100)));
  const legs = build(segment(points), [999_999], 3.0);
  assert.equal(legs.length, 1);
});

test('carbohydrate totals follow the duration', () => {
  const two = needs(7200);
  assert.equal(two.total.low, 120);
  assert.equal(two.total.high, 180);
  assert.ok(two.source.includes('Sports Nutrition'));
});

test('every declared source is retrievable and none is empty', () => {
  assert.ok(SOURCES.length >= 3);
  for (const s of SOURCES) {
    assert.equal(sourceFor(s.id).id, s.id);
    assert.ok(s.reference.length > 30, `source ${s.id} has no real reference`);
  }
  assert.throws(() => sourceFor('does-not-exist'));
});

test('the real race fixture: ascent lands within two percent of the reference', async () => {
  const { readFileSync, existsSync } = await import('node:fs');
  const path = new URL('../../tests/fixtures/corbier.gpx', import.meta.url).pathname;
  if (!existsSync(path)) {
    console.log('  SKIP: fixture missing');
    return;
  }
  const points = smooth(parse(readFileSync(path, 'utf8')));
  const { ascent } = relief(points);
  // 1264 m is what the recording watch reported for this race.
  assert.ok(
    Math.abs(ascent - 1264) < 1264 * 0.02,
    `expected about 1264 m of ascent, got ${ascent.toFixed(0)}`,
  );
});

test('the real race fixture: the plan adds up on a real track', async () => {
  const { readFileSync, existsSync } = await import('node:fs');
  const path = new URL('../../tests/fixtures/corbier.gpx', import.meta.url).pathname;
  if (!existsSync(path)) return;
  const segs = segment(smooth(parse(readFileSync(path, 'utf8'))));
  const road = 1000 / 337;
  const whole = durationOf(segs, road);
  const summed = build(segs, [5000, 10000], road).reduce((t, l) => t + l.seconds, 0);
  assert.ok(Math.abs(summed - whole) < 1, `legs ${summed} vs whole ${whole}`);
});
