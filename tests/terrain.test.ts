import { test } from 'node:test';
import assert from 'node:assert/strict';
import { bands, gradientLevel, roughness, roughnessLevel, sinuosity } from '../src/terrain.js';
import type { Point } from '../src/gpx.js';

/** A straight eastward track, one point every `step` metres, at a fixed gradient. */
function straight(count: number, step: number, gradient: number): Point[] {
  const out: Point[] = [];
  for (let i = 0; i < count; i += 1) {
    out.push({
      lat: 45,
      // 1 degree of longitude at 45 degrees north is about 78 847 m.
      lon: (i * step) / 78847,
      elevation: i * step * gradient,
      distance: i * step,
    });
  }
  return out;
}

test('gradient levels name the ground the way a runner does', () => {
  assert.equal(gradientLevel(0.25), 'steep-up');
  assert.equal(gradientLevel(0.08), 'up');
  assert.equal(gradientLevel(0), 'flat');
  assert.equal(gradientLevel(-0.08), 'down');
  assert.equal(gradientLevel(-0.25), 'steep-down');
});

test('a straight line has a sinuosity of one', () => {
  const p = straight(40, 25, 0);
  assert.ok(Math.abs(sinuosity(p, 0, 500) - 1) < 0.02);
});

test('switchbacks raise sinuosity well above one', () => {
  // Ten metres east, ten metres back, repeatedly: distance accumulates, the
  // straight-line displacement does not.
  const out: Point[] = [];
  for (let i = 0; i < 40; i += 1) {
    out.push({ lat: 45, lon: (i % 2 === 0 ? 0 : 10) / 78847, elevation: 0, distance: i * 10 });
  }
  assert.ok(sinuosity(out, 0, 390) > 1.3);
});

test('a smooth forest road scores low and a jagged path scores high', () => {
  const road = straight(30, 10, 0.04);
  assert.ok(roughness(road, 0, 250) < 20, 'a constant gradient is not rough');

  const jagged = straight(30, 10, 0).map((p, i) => ({ ...p, elevation: i % 2 === 0 ? 0 : 4 }));
  assert.ok(roughness(jagged, 0, 250) > 40, 'a gradient that flips every step is rough');
});

test('roughness stays inside its own scale', () => {
  const jagged = straight(60, 5, 0).map((p, i) => ({ ...p, elevation: i % 2 === 0 ? 0 : 30 }));
  const score = roughness(jagged, 0, 250);
  assert.ok(score >= 0 && score <= 100, `score out of range: ${score}`);
  assert.equal(roughnessLevel(80), 'rough');
  assert.equal(roughnessLevel(50), 'mixed');
  assert.equal(roughnessLevel(10), 'smooth');
});

test('elevation asks for no bands, because the line already is the reading', () => {
  assert.deepEqual(bands(straight(50, 10, 0.05), 'elevation'), []);
});

test('bands cover the whole course without a gap or an overlap', () => {
  const p = straight(200, 10, 0.05);
  const b = bands(p, 'gradient');
  assert.ok(b.length > 0);
  assert.equal(b[0].from, 0);
  assert.equal(b[b.length - 1].to, p[p.length - 1].distance);
  for (let i = 1; i < b.length; i += 1) assert.equal(b[i].from, b[i - 1].to);
});

test('neighbours that agree are merged, so a uniform climb is one band', () => {
  assert.equal(bands(straight(300, 10, 0.2), 'gradient').length, 1);
});

test('a climb followed by a descent is read as two bands', () => {
  const up = straight(100, 10, 0.2);
  const down = up.map((p, i) => ({
    ...p,
    elevation: up[up.length - 1].elevation - i * 10 * 0.2,
    distance: up[up.length - 1].distance + i * 10,
  }));
  const b = bands([...up, ...down.slice(1)], 'gradient');
  assert.deepEqual(b.map((x) => x.level), ['steep-up', 'steep-down']);
});

test('a track too short to read gives nothing rather than a guess', () => {
  assert.deepEqual(bands([], 'gradient'), []);
  assert.equal(roughness(straight(2, 10, 0), 0, 250), 0);
});
