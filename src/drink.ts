/** Making the drink yourself, and the constraint nobody mentions.
 *
 * A sports drink is sugar, water, and a little salt. Table sugar is sucrose,
 * which hydrolyses to one part glucose and one part fructose, so it feeds both
 * transport pathways on its own: measured oxidation matches a glucose and
 * fructose mixture. That part of the internet advice is sound.
 *
 * What the advice leaves out is concentration. Carbohydrate above about eight
 * percent slows gastric emptying and raises the risk of gut trouble, and at a
 * high carbohydrate target the drink alone crosses that line long before it
 * covers the target. This module computes the line rather than the recipe, so
 * the runner sees what the bottle cannot carry.
 *
 * No sodium figure ships here, for the same reason it ships nowhere else in
 * this tool: it depends on sweat losses that are not measured.
 */

import { sourceFor } from './sources.js';

/** Table sugar is sucrose and sucrose is carbohydrate: one gram is one gram. */
export const SUCROSE_CARBOHYDRATE = 1;

/** Grams of carbohydrate per 100 mL beyond which gastric emptying slows. */
export const COMFORTABLE_PERCENT = { low: 5, high: 8 } as const;

export type Bottle = {
  /** Millilitres the runner carries. */
  readonly millilitres: number;
  /** Grams of sugar to reach the target, and what that concentration becomes. */
  readonly grams: number;
  readonly percent: number;
  /** True while the drink stays inside the range that empties normally. */
  readonly comfortable: boolean;
};

/** What a given bottle looks like once the target is dissolved into it. */
export function bottle(carbGrams: number, millilitres: number): Bottle {
  const grams = carbGrams / SUCROSE_CARBOHYDRATE;
  const percent = millilitres > 0 ? (grams / millilitres) * 100 : 0;
  return {
    millilitres,
    grams: Math.round(grams),
    percent: Math.round(percent * 10) / 10,
    comfortable: percent <= COMFORTABLE_PERCENT.high,
  };
}

/** The most carbohydrate a bottle can carry without leaving that range. */
export function carriable(millilitres: number): number {
  return Math.round((millilitres * COMFORTABLE_PERCENT.high) / 100);
}

export type Plan = {
  readonly perHour: Bottle;
  readonly carriablePerBottle: number;
  /** Carbohydrate per hour the bottle cannot carry: it travels as food. */
  readonly asFood: number;
  readonly sugarForRace: { readonly low: number; readonly high: number };
  readonly source: string;
  readonly concentrationSource: string;
};

/** The whole picture for one bottle size and one carbohydrate target. */
export function plan(
  perHour: { low: number; high: number },
  total: { low: number; high: number },
  millilitres: number,
): Plan {
  const carry = carriable(millilitres);
  return {
    perHour: bottle(perHour.high, millilitres),
    carriablePerBottle: carry,
    asFood: Math.max(0, perHour.high - carry),
    sugarForRace: {
      low: Math.round(total.low / SUCROSE_CARBOHYDRATE),
      high: Math.round(total.high / SUCROSE_CARBOHYDRATE),
    },
    source: sourceFor('sucrose-oxidation').reference,
    concentrationSource: sourceFor('drink-concentration').reference,
  };
}
