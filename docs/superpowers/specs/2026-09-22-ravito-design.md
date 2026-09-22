# ravito, design

Date: 22 September 2026. Status: agreed, not yet implemented.

## What this is

A single-page calculator that turns a race GPX and a runner's profile into a
fuelling plan: how much to carry between each aid station, and what to have
consumed on arrival at each one.

It runs entirely in the browser. The GPX is parsed locally and never leaves the
machine. There is no account, no backend, no database, and nothing is stored on
a server.

## What this is not

- Not medical advice, and the interface says so.
- Not a training platform. No history, no accounts, no saved races.
- Not a precision instrument. Every output is a range, and the interface names
  what it cannot know.
- Not a GPX viewer. There is no map. The elevation profile is drawn only where
  it helps read the plan.

## Why ranges rather than numbers

Sweat rate varies by a factor of three between runners and is not derivable
from height, weight and age. Gut tolerance for carbohydrate is trainable and
individual. A tool that outputs "73 g of carbohydrate per hour" is lying about
its own precision.

Every figure is therefore a published range, each shown with its source, and a
standing section lists the variables the tool does not measure.

## Inputs

| Field | Use | Required |
|---|---|---|
| Body mass (kg) | carbohydrate and fluid scaling | yes |
| Flat reference pace (min/km) | anchor for the grade model | yes |
| Expected temperature (C) | fluid adjustment | yes, default 15 |
| GPX file | distance, elevation, segmentation | yes |
| Aid station distances (km) | plan segmentation and carry | optional, repeatable |

Age, height and sex are collected only if a figure genuinely depends on them.
At the time of writing, none of the retained formulas does: carbohydrate and
fluid recommendations scale with body mass and duration, not with height or
age. They are therefore **not** asked for. If a later formula needs them, they
are added then, with the source that requires them.

This reverses the original idea, which assumed age and height would be inputs.
Asking for data that changes no output is a cost with no return, and it
suggests a precision the tool does not have.

## Architecture

Pure calculation modules, one thin UI module. No framework. TypeScript
compiled by Vite, deployed to GitHub Pages by a workflow.

```
src/
  gpx.ts        parse a GPX file into points; smooth elevation
  grade.ts      split a track into segments; gradient per segment
  pace.ts       grade-adjusted pace from a flat reference pace
  nutrition.ts  hourly rates and totals from mass, duration, temperature
  plan.ts       split by aid station; carry requirements
  sources.ts    the citation for every published figure used
  ui.ts         form, rendering, file handling. Calculates nothing.
```

Each calculation module exports pure functions: data in, data out, no DOM, no
I/O. `ui.ts` is the only module that touches the document.

## Data flow

```
GPX file
  -> gpx.parse        -> Point[]  { lat, lon, elevation, cumulativeDistance }
  -> gpx.smooth       -> Point[]  with denoised elevation
  -> grade.segment    -> Segment[] { startKm, endKm, distance, ascent, descent, gradient }
  -> pace.estimate    -> Segment[] with { duration, durationLow, durationHigh }
  -> nutrition.rates  -> Rates    { carbs, fluid, sodium } each a range per hour
  -> plan.build       -> Leg[]    { from, to, duration, carry, cumulative }
  -> ui.render
```

## Elevation smoothing, measured rather than assumed

Raw track elevation oscillates continuously, from barometric drift or GPS
error, and summing every positive difference overstates total ascent. The size
of that error is **not** a constant, which is the part worth knowing.

Measured on two real races recorded with a barometric watch, against the
figure the watch itself reports:

```
                     distance   real D+   naive sum   after processing
mountain trail        16.3 km     1264 m    1299 m  +3%      1252 m  -1%
rolling trail         12.1 km      218 m     273 m  +25%      218 m   0%
```

On a mountain course, sustained climbs dwarf the noise and a naive sum is only
three percent high. On rolling terrain, where the real gain is small, the same
noise represents a quarter of the total. The error is therefore worst exactly
where the number is smallest, and it is invisible in both cases.

Two-stage treatment, which reproduced the reference figure to within one
percent on the mountain course and exactly on the rolling one:

1. A moving median over a window of 5 points, which removes spikes without
   shifting real transitions the way a mean does.
2. A minimum ascent threshold: a climb counts only once it has gained at least
   3 m since the last recorded low point. Oscillation below that is discarded.

Both constants are declared in one place and documented as tunable. The
threshold is the sensitive one: on the rolling course it accounts for the whole
correction, the median alone recovering only two points of the twenty-five.

These measurements come from FIT files recorded by a barometric altimeter,
which is a cleaner signal than a GPS-only track exported by a race organiser.
The error on such a file is expected to be larger, not smaller, and the tool
must be tested against one before any claim is made about it.

## Pace model

Anchored on the runner's declared flat pace, scaled by the metabolic cost of
running on a gradient, following Minetti et al. (2002), which gives the energy
cost of running in J/kg/m as a fifth-order polynomial in gradient over the
range -45 to +45 percent.

**The polynomial coefficients must be read from the paper and cited in
`sources.ts` before any implementation.** They are not reproduced here from
memory, and an unverified coefficient is not shipped.

Three corrections on top of the raw cost ratio:

- **Walking cap.** Above roughly 20 percent gradient nearly every runner walks,
  and speed stops depending on running fitness. Above that threshold the model
  switches to a walking speed derived from ascent rate in metres per hour, not
  from the flat pace.
- **Descent limit.** The cost curve has a minimum around -20 percent, implying
  a speed higher than anyone sustains on technical ground. Descent speed is
  capped at a multiple of flat speed, declared as an assumption.
- **Duration decay.** Pace degrades over long efforts. Applied as a percentage
  per hour beyond the third hour, declared in the interface as an assumption
  and not as a measurement.

Output is a central estimate with a low and high bound. The bounds come from
varying the decay and the walking speed across a declared plausible interval,
not from a statistical model the data does not support.

## Nutrition model

Each figure is a range carrying its source in the interface.

- **Carbohydrate**, grams per hour, scaled by duration band. The upper part of
  the range requires multiple transportable carbohydrates and a trained gut,
  and the interface says so next to the number.
- **Fluid**, millilitres per hour, adjusted upward with temperature above a
  declared threshold.
- **Sodium**, milligrams per hour, tied to the fluid range.

Every value and every band boundary lives in `sources.ts` alongside its
citation. **A figure that cannot be traced to a named published source is
removed rather than estimated.** This check happens before the first release,
not after.

A permanent section lists what is not measured: sweat rate, gut tolerance,
altitude, individual medical conditions. The interface states it is not medical
advice.

## Plan and carry

Aid stations are entered as distances in kilometres, read from the race
road-book. A GPX does not contain them.

For each leg between two aid stations the plan gives the estimated duration,
the carbohydrate and fluid to carry, and the cumulative total expected to have
been consumed on arrival. The longest leg by duration is highlighted, because
that is the one that determines flask and pack capacity.

With no aid station entered, the plan falls back to hourly blocks, which is the
same computation over a different segmentation.

## Error handling

Each failure names what is wrong and what to do, never a stack trace.

- File is not valid GPX, or has no track points: refuse, say which.
- Track has no elevation data: compute distance and refuse the plan, because
  duration without gradient would be misleading.
- Aid station distance beyond total course distance: refuse that entry only.
- Flat pace outside a plausible range: warn, do not block.
- Fewer than two track points after parsing: refuse.

## Testing

Pure modules make these cheap, and two are negative controls: they must fail
against a naive implementation, and that is verified once when written.

- **Elevation smoothing, negative control.** A synthetic track with a known
  staircase profile, plus artificial noise calibrated on the rolling-trail
  measurement above. The computed ascent must equal the real ascent within a
  small tolerance. A naive sum fails this test, which is the point.
- **Elevation smoothing against reality.** The two recorded races, as fixtures,
  must come back within two percent of the reference figure. A synthetic test
  proves the algorithm; only a real track proves the constants.
- **Pace model.** A hand-computed reference case: a known distance at a known
  gradient with a known flat pace. Plus a monotonicity property: steeper never
  means faster on climbs.
- **Plan arithmetic, negative control.** The sum of the legs must equal the
  overall total exactly. Off-by-one at a segment boundary is invisible by eye
  and caught here.
- **GPX parsing.** A minimal valid file, a file without elevation, a file
  without track points, a file that is not XML.
- **Sources.** Every numeric constant used by `nutrition.ts` has an entry in
  `sources.ts`. The test fails if one is missing.

## Deployment

GitHub Pages from a workflow on push to `main`. No analytics, no external
fonts, no third-party script. The page works offline once loaded.

## Language

Code, comments, README and interface in English, matching the other public
repositories. A French interface may be added later; nothing in the design
prevents it, and no string is hard-coded outside a single place.

## Open questions, to settle during implementation

None that block a start. Two constants need a source before release: the
Minetti coefficients, and each nutrition range. Both are listed as explicit
tasks rather than assumptions.
