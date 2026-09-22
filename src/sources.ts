/** Every published figure used by the calculator, with where it comes from.
 *
 * A number that cannot be traced to a named source does not ship. The tests
 * assert that each constant used elsewhere has an entry here.
 */

export type Source = {
  readonly id: string;
  readonly claim: string;
  readonly reference: string;
};

export const SOURCES: readonly Source[] = [
  {
    id: 'minetti-running-cost',
    claim: 'Energy cost of running as a fifth-order polynomial in gradient, J/kg/m, valid from -0.45 to +0.45. Level running costs 3.6.',
    reference:
      'Minetti AE, Moia C, Roi GS, Susta D, Ferretti G. Energy cost of walking and running at extreme uphill and downhill slopes. J Appl Physiol, 2002.',
  },
  {
    id: 'terrain-factor',
    claim:
      'Flat trail runs about 22 percent slower than the same runner on road, descents peak around -10 percent gradient and collapse below -15 percent.',
    reference:
      'Measured on one mountain race: 16.35 km, 1252 m of ascent, 2h41, declared road flat pace 5:37/km. One runner, one course.',
  },
  {
    id: 'carbohydrate-per-hour',
    claim:
      '60 to 90 g of exogenous carbohydrate per hour during ultra-endurance effort. Above 60 g/h requires multiple transportable carbohydrates and a trained gut. Evidence above 90 g/h is limited, and observed intakes in the field are often lower, in the range 23 to 71 g/h.',
    reference:
      'Tiller NB et al. International Society of Sports Nutrition Position Stand: nutritional considerations for single-stage ultra-marathon training and racing. J Int Soc Sports Nutr, 2019. doi:10.1186/s12970-019-0312-9',
  },
];

export function sourceFor(id: string): Source {
  const found = SOURCES.find((s) => s.id === id);
  if (!found) throw new Error(`no source declared for "${id}"`);
  return found;
}
