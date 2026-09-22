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
running on a gradient, following Minetti et al. (2002), *Energy cost of walking
and running at extreme uphill and downhill slopes*, J Appl Physiol:

```
Cr(i) = 155.4i^5 - 30.4i^4 - 43.3i^3 + 46.3i^2 + 19.5i + 3.6
```

in J/kg/m, valid for gradients between -0.45 and +0.45. Level running costs
3.6. The coefficients above are quoted from the paper, not from memory, and are
cited as such in `sources.ts`.

### Where that model holds, and where it does not

Checked against one real mountain race: 16.35 km, 1252 m of ascent, 2h41,
declared flat pace 5:37 per kilometre. Time per terrain band, real against
predicted:

```
terrain           distance     real    model    error
steep descent      3.69 km   29.3 mn  15.8 mn   +85%
descent            3.30 km   18.7 mn  13.8 mn   +36%
flat               2.30 km   16.5 mn  13.5 mn   +23%
climb              3.31 km   33.8 mn  31.4 mn    +8%
steep climb        3.70 km   62.7 mn  59.9 mn    +5%
```

**Uphill, the metabolic model is accurate to within eight percent. Downhill it
is wrong by a factor approaching two.**

That is not a flaw in the paper, it is a flaw in using it alone. Minetti
measured metabolic cost on a treadmill. Downhill speed on a trail is not
limited by metabolism: it is limited by technique, footing and braking. The
cost curve has its minimum around -20 percent, which correctly says descending
is metabolically cheap, and says nothing about whether anyone can run it.

Even the flat sections ran 23 percent slower than the declared road flat pace,
which is the same phenomenon in smaller form: trail flat is not road flat.

### The model that follows

- **Climbs** use Minetti directly. It is the part that measured well.
- **Flat and descents** are governed by a terrain factor, not by metabolism.
  The default values come from the single measurement above and are declared
  as such in the interface: this is one course and one runner.
- **Duration decay** beyond the third hour remains an assumption, labelled as
  one, not a measurement.

The interface says which parts of the estimate rest on published physiology and
which rest on one calibration. Those are not the same kind of claim.

### Calibrating on a race already run

A runner who supplies a past race with its real time gets their own terrain
factor computed instead of the default. This is the honest answer to a model
that cannot know their technical ability: not to guess it, but to measure it
from something they have already done.

Output is a range, never a single time. The bounds come from varying the
terrain factor across its plausible interval, and the interface states that the
interval is wide because it covers something the tool has not measured about
this runner.

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

The Minetti coefficients are now quoted from the paper and no longer open.

Each nutrition range still needs its source before release, and that is an
explicit task rather than an assumption.

The terrain factor defaults rest on a single race. A second calibration course,
ideally a runnable one rather than a mountain one, would tell whether the factor
is stable per runner or varies with the terrain. Until then the interface says
so.
