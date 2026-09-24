import test from 'node:test';
import assert from 'node:assert/strict';
import { build } from '../src/plan.js';
import type { Segment } from '../src/segments.js';

/** A flat course cut into 50 m segments, like segment() produces. */
function flat(totalM: number): Segment[] {
  const out: Segment[] = [];
  for (let d = 0; d < totalM; d += 50) {
    out.push({ startM: d, endM: d + 50, distance: 50, gradient: 0, ascent: 0 });
  }
  return out;
}

test('a water-only stand does not change what is eaten, only what is carried', () => {
  const segments = flat(40_000);
  const legs = build(
    segments,
    [{ distanceM: 10_000 }, { distanceM: 20_000, water: true }, { distanceM: 30_000 }],
    1000 / 300,
  );
  assert.equal(legs.length, 4);
  // the food eaten on each leg is untouched
  assert.equal(legs[1].carbsHigh > 0, true);
  // leaving stand 1, the runner carries leg 2 and leg 3, because stand 2 is water
  assert.equal(legs[1].carryHigh, legs[1].carbsHigh + legs[2].carbsHigh);
  // leaving stand 2 is impossible, but leg 3 ends at a full stand
  assert.equal(legs[2].carryHigh, legs[2].carbsHigh);
  assert.equal(legs[3].carryHigh, legs[3].carbsHigh);
});

test('two water stands in a row accumulate', () => {
  const legs = build(
    flat(40_000),
    [{ distanceM: 10_000 }, { distanceM: 20_000, water: true }, { distanceM: 30_000, water: true }],
    1000 / 300,
  );
  assert.equal(legs[1].carryHigh, legs[1].carbsHigh + legs[2].carbsHigh + legs[3].carbsHigh);
});

test('NEGATIVE CONTROL: with no water stand, carry equals what is eaten', () => {
  const legs = build(flat(40_000), [{ distanceM: 10_000 }, { distanceM: 20_000 }], 1000 / 300);
  for (const l of legs) assert.equal(l.carryHigh, l.carbsHigh);
});
