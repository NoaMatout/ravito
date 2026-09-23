# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Trail runners planning a race, primarily the author and any runner who lands on
the page from a link or a search. Confirmed: the tool must work for a stranger
who has never heard of it, and must also hold up as a piece of work shown to a
recruiter or a peer. The tool comes first; the demonstration of rigour is a
consequence of building it honestly, not a separate goal.

Two moments of use, confirmed:

1. **Building the plan**, at home, on a computer, with the race road-book to
   hand. This is where the file is loaded and the numbers are read in full.
2. **Reading the plan again on a phone**, standing in the start pen. The phone
   consults; it does not enter data.

## Product Purpose

Turn a race GPX and a runner's flat road pace into a per-leg fuelling plan: how
long each leg between aid stations will take, and how much carbohydrate to carry
for it. Success is a runner who knows which leg decides their pack size before
the start, rather than after.

## Positioning

Every number is either measured or sourced, and the tool says which. Where a
figure cannot be established honestly, it ships the absence with the reason
instead of a plausible default: fluid and sodium are deliberately not given.
The estimate carries its own validity domain and says so when a race runs past
it. That is the mechanism a neighbouring calculator could not truthfully copy,
because most of them answer every question.

## Operating Context

- Input is a GPX file, often an organiser export that also carries aid stations
  as waypoints. Files range from an 12 km training loop to a 171 km ultra.
- Aid-station kilometres can be typed when the file does not carry them, and
  typed values win over the file.
- A known finishing time on a race already run calibrates the terrain factor.
- Everything runs in the page. The track never leaves the machine, there is no
  account, no server, no analytics and no network call after load.

## Capabilities and Constraints

- Static site, deployed to GitHub Pages by a workflow that runs the tests first.
  No server, no build step beyond `tsc`, no runtime dependency.
- Plain TypeScript compiled to ES modules; no framework, no CSS library.
- Three readings of the same track: elevation, gradient, and a geometric
  roughness proxy. Roughness is explicitly not technicality, and the interface
  says so wherever it appears.
- Pace model: Minetti et al. 2002 for gradient cost, plus a terrain profile
  measured on one runner and one course. Validated to about six hours; beyond
  that the page warns rather than predicts.
- Fluid and sodium are out of scope by decision, not by omission.

## Brand Commitments

Name: **ravito**, lower case. French trail slang for an aid station, used by
runners of every level; the tool is written in English but keeps the word.

Voice: first person, short sentences, no superlative, no emoji. Reserves are
stated in the same breath as the number they qualify, never in a footnote.

## Evidence on Hand

- `utmb_174km_universal.gpx`, an organiser export with 14 aid stations, kept out
  of git and used for verification.
- The pace model is calibrated on two of the author's own races: a 16.35 km
  mountain race with 1 252 m of ascent in 2h41, and a 11.81 km loop with 194 m.
- `src/sources.ts` holds the citation for every claim the interface makes.
- No user count, no testimonial, no benchmark, no press. None may be invented.

## Product Principles

1. **A number the tool cannot establish is not shipped.** The absence is shown
   with its reason, which is more useful than a default nobody can defend.
2. **The reserve travels with the figure.** A range, a validity domain and a
   sample size are part of the answer, not small print.
3. **Name a measurement for what it measures.** Roughness is line geometry; it
   is never relabelled technicality because the label would sell better.
4. **The runner's road-book beats the file.** Typed aid stations override
   waypoints, because the runner has information the export does not.
5. **Nothing leaves the page.** Privacy here is structural, not a promise.

## Accessibility & Inclusion

The elevation profile carries a text alternative describing distance, altitude
range and aid-station count, because a profile that says nothing to someone who
cannot see it is decoration. The wide plan table scrolls inside its own focusable
region rather than dragging the page sideways.
