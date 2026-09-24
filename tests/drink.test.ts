import { test } from 'node:test';
import assert from 'node:assert/strict';
import { bottle, carriable, plan, COMFORTABLE_PERCENT } from '../src/drink.js';
import { SOURCES } from '../src/sources.js';

test('one gram of table sugar is one gram of carbohydrate', () => {
  assert.equal(bottle(45, 500).grams, 45);
});

test('the concentration is grams per hundred millilitres', () => {
  assert.equal(bottle(40, 500).percent, 8);
  assert.equal(bottle(25, 500).percent, 5);
});

test('a bottle at the high target is NOT comfortable, which is the whole point', () => {
  // 90 g/h in a 500 mL bottle is 18 percent: more than twice the range that
  // empties normally. A tool that did not say so would be selling the recipe.
  const hard = bottle(90, 500);
  assert.equal(hard.percent, 18);
  assert.equal(hard.comfortable, false);
});

test('NEGATIVE CONTROL: the comfortable flag can be both true and false', () => {
  assert.equal(bottle(30, 500).comfortable, true);
  assert.equal(bottle(90, 500).comfortable, false);
});

test('a bottle carries eight percent of its volume in carbohydrate', () => {
  assert.equal(carriable(500), 40);
  assert.equal(carriable(250), 20);
  assert.equal(carriable(1000), 80);
});

test('what the bottle cannot carry is named rather than hidden', () => {
  const p = plan({ low: 60, high: 90 }, { low: 1000, high: 1500 }, 500);
  assert.equal(p.carriablePerBottle, 40);
  assert.equal(p.asFood, 50);
});

test('a bottle large enough leaves nothing to carry as food', () => {
  const p = plan({ low: 60, high: 90 }, { low: 1000, high: 1500 }, 1500);
  assert.equal(p.asFood, 0);
});

test('the race total is expressed in sugar, not only in carbohydrate', () => {
  const p = plan({ low: 60, high: 90 }, { low: 1553, high: 2330 }, 500);
  assert.deepEqual(p.sugarForRace, { low: 1553, high: 2330 });
});

test('an empty bottle does not divide by zero', () => {
  assert.equal(bottle(50, 0).percent, 0);
});

test('both claims the drink makes are sourced', () => {
  for (const id of ['sucrose-oxidation', 'drink-concentration']) {
    const found = SOURCES.find((s) => s.id === id);
    assert.ok(found, `no source declared for "${id}"`);
    assert.ok(found.reference.includes('doi:'), `"${id}" cites no DOI`);
  }
  assert.equal(COMFORTABLE_PERCENT.high, 8);
});
