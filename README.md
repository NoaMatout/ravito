# ravito

[![TypeScript](https://img.shields.io/badge/typescript-5.6-blue.svg)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![No runtime dependencies](https://img.shields.io/badge/runtime%20deps-none-lightgrey.svg)](package.json)

A race GPX and your flat pace in, a per-leg fuelling plan out.

**[Open it](https://noamatout.github.io/ravito/)** — nothing to install.

Everything runs in the page. Your track is parsed locally and never leaves your
machine: no account, no backend, nothing uploaded.

```
distance      16.84 km
D+            1253 m
estimate      2h46, between 2h29 and 3h11

leg      to        time   D+      carbohydrate
aid 1     5.0 km   0h47   407 m   47 to 71 g
aid 2    10.0 km   0h54   428 m   54 to 81 g
finish   16.8 km   1h00   409 m   60 to 90 g
```

## Two things it gets right that most do not

**Total ascent.** Summing every positive elevation difference overstates it,
and the size of the error depends on the terrain, which is the part nobody
mentions. Measured against two races recorded with a barometric watch:

```
                distance   real D+   naive sum   after treatment
mountain trail   16.3 km    1264 m   1299  +3%   1252   -1%
rolling trail    12.1 km     218 m    273 +25%    218    0%
```

The error is worst exactly where the number is smallest, and nothing about the
output looks wrong either way. A moving median plus a three metre threshold
recovers the reference.

**Where physiology stops applying.** Uphill speed is limited by metabolism and
the published cost curve predicts it well. Downhill speed is not limited by
metabolism at all, and using the same curve there is what makes naive trail
predictors optimistic. Measured on one mountain race, per terrain band:

```
terrain           distance     real    model    error
steep descent      3.69 km   29.3 mn  15.8 mn   +85%
descent            3.30 km   18.7 mn  13.8 mn   +36%
flat               2.30 km   16.5 mn  13.5 mn   +23%
climb              3.31 km   33.8 mn  31.4 mn    +8%
steep climb        3.70 km   62.7 mn  59.9 mn    +5%
```

So the model uses the physiology uphill, where it measured within eight
percent, and a terrain profile on the flat and downhill. Even the flat sections
ran 23 percent slower than the same runner's road pace: trail flat is not road
flat.

## Honest about what that means

The terrain profile comes from **one runner on one course**. Running the tool
back on that same course returns the real time to within three percent, which
is a consistency check and **not** an independent validation: the defaults were
derived from it. A second calibration course, ideally a runnable one, is what
would turn this into a claim.

Which is why the tool can measure your factor instead of assuming it. Give it a
race you have already run, with your real time, and it computes your own
terrain factor rather than guessing your technical ability.

## Fluid and sodium are missing on purpose

Only carbohydrate ships, at 60 to 90 g per hour, with its source in the page.

Fluid and sodium are absent because I could not open a source I was willing to
cite for them. Sweat rate varies about threefold between runners and no formula
recovers it from body mass. A plan that invents two of its three numbers is
worse than a plan that admits to one, so the page says what is missing and why
rather than quietly leaving it out.

## What it asks for, and what it does not

Body mass, height and age are **not** asked for. No retained formula uses them:
carbohydrate scales with duration. Asking for data that changes no output
suggests a precision this tool does not have.

It asks for your flat road pace, a GPX, and optionally the aid station
distances from the race road-book, because a GPX does not contain them and they
are what makes a plan a plan. On a trail you can only reload where there is a
stand.

## Run it yourself

The published page is the same build as `main`; the workflow compiles it and
runs the tests before deploying, so a page that fails its own negative controls
never goes online.

```bash
npm install
npm run build
npm run serve      # then open http://localhost:8000
npm test
```

No runtime dependency. TypeScript compiles to ES modules the browser loads
directly; there is no bundler.

## Tests

Two are negative controls. One plants noise on a known staircase profile and
asserts a naive sum is inflated while the treatment recovers the real figure.
The other asserts the legs of a plan sum to the whole: that one caught a real
defect during development, where segments straddling an aid station were
dropped from both sides and 1.7 percent of the time vanished with nothing to
show for it.

Two more run against a real recorded race kept as a fixture, because a
synthetic test proves the algorithm and only a real track proves the constants.

## Limits

- Distance computed from raw track points runs about three percent long,
  because GPS jitter inflates it the same way it inflates elevation. Not yet
  treated.
- The terrain profile is one runner, one course.
- Duration decay over very long efforts is not modelled.
- Tracks recorded by a barometric watch are cleaner than a GPS-only file
  exported by a race organiser. The tool has not been tested against the
  latter.
- Organisers under-announce elevation. Two races checked here were announced at
  1100 and 194 m against 1252 and 218 measured. The tool shows what it
  computes.
- Not medical advice.

## License

MIT.
