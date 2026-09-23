---
name: ravito
description: A race road book, printed in two inks, where rules carry every division and the leg between two aid stations is the unit.
colors:
  stock: "#e9ebe6"
  ink: "#101310"
  ink-2: "#4d564f"
  spot: "#1b5a41"
  spot-quiet: "#cfd8d0"
  rule: "#bfc6bd"
  rule-mid: "#8d968c"
  steep-up: "#a3311d"
  up: "#c2742a"
  level: "#7f877d"
  down: "#3d7aa4"
  steep-down: "#204169"
  smooth: "#5a7d5d"
typography:
  display:
    fontFamily: "Archivo, system-ui, sans-serif"
    fontSize: "clamp(3rem, 1.5rem + 7vw, 6rem)"
    fontWeight: 700
    lineHeight: 0.92
    letterSpacing: "-0.03em"
    fontVariation: "wdth 112"
    fontFeature: "tnum"
  headline:
    fontFamily: "Archivo, system-ui, sans-serif"
    fontSize: "clamp(1.5rem, 1.1rem + 2vw, 2.25rem)"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "0.02em"
    fontVariation: "wdth 78"
  title:
    fontFamily: "Archivo, system-ui, sans-serif"
    fontSize: "1.35rem"
    fontWeight: 500
    lineHeight: 1.3
    letterSpacing: "normal"
    fontVariation: "wdth 88"
  body:
    fontFamily: "Archivo, system-ui, sans-serif"
    fontSize: "clamp(0.95rem, 0.9rem + 0.2vw, 1.05rem)"
    fontWeight: 400
    lineHeight: 1.55
    letterSpacing: "normal"
    fontVariation: "wdth 100"
    fontFeature: "tnum"
  data:
    fontFamily: "Archivo, system-ui, sans-serif"
    fontSize: "0.88rem"
    fontWeight: 400
    lineHeight: 1.55
    letterSpacing: "normal"
    fontVariation: "wdth 88"
    fontFeature: "tnum"
  label:
    fontFamily: "Archivo, system-ui, sans-serif"
    fontSize: "0.7rem"
    fontWeight: 600
    lineHeight: 1.35
    letterSpacing: "0.14em"
    fontVariation: "wdth 72"
  note:
    fontFamily: "Archivo, system-ui, sans-serif"
    fontSize: "0.86rem"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "normal"
    fontVariation: "wdth 100"
rounded:
  none: "0"
spacing:
  hair: "0.35rem"
  row: "0.55rem"
  block: "0.9rem"
  band: "1.25rem"
  form: "1.75rem"
  section: "clamp(2.25rem, 6vw, 3.5rem)"
  cut: "clamp(2.5rem, 7vw, 4rem)"
  gutter: "clamp(1.25rem, 4vw, 3rem)"
  measure: "64rem"
components:
  button-intake:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.stock}"
    typography: "{typography.headline}"
    rounded: "{rounded.none}"
    padding: "clamp(1rem, 3vw, 1.4rem) 1.25rem"
    width: "100%"
  button-intake-hover:
    backgroundColor: "{colors.spot}"
    textColor: "{colors.stock}"
  button-cut:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    typography: "{typography.label}"
    rounded: "{rounded.none}"
    padding: "0.45rem 0.9rem"
  button-cut-hover:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.stock}"
  tab-reading:
    backgroundColor: "transparent"
    textColor: "{colors.ink-2}"
    typography: "{typography.label}"
    rounded: "{rounded.none}"
    padding: "0.6rem 0.95rem 0.7rem"
  tab-reading-selected:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
  input-field:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    typography: "{typography.title}"
    rounded: "{rounded.none}"
    padding: "0.15rem 0 0.3rem"
    width: "100%"
  input-field-focus:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
  table-plan:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    typography: "{typography.data}"
    rounded: "{rounded.none}"
    padding: "0.55rem 0.5rem"
  pocket-card:
    backgroundColor: "{colors.spot-quiet}"
    textColor: "{colors.ink}"
    typography: "{typography.data}"
    rounded: "{rounded.none}"
    padding: "1.1rem 1.25rem 1.25rem"
    width: "34rem"
---

# Design System: ravito

## Overview

**Creative North Star: "The Road Book the Organiser Did Not Print"**

This is a two-ink print job that happens to run in a browser. One text ink and
one printer's green sit on stock; a night edition inverts both onto true black
for a start pen before dawn under a headtorch. The two use scenes chose the two
editions: a kitchen table in the evening, and a cold start at 4 a.m. Nothing in
the palette is a category habit.

Rules carry every division. There is no card, no box, no panel and no radius
anywhere in the built stylesheet: a heavy rule opens a section, a hairline
separates rows, a 4px double rule closes a table. Numbers live in a table
because a table is what you read at 4 a.m., and every figure that is a
measurement is set in tabular lining figures so columns align down the page.

One typeface does all of it. Archivo variable is self-hosted with both axes
live (weight 100-900, width 62-125), and the width axis does the work a second
family would normally do: condensed for furniture and column heads, semi-narrow
for tabular data, regular for prose, expanded for the single large figure. The
page refuses the fitness dashboard, the grid of same-size stat cards and the
rounded panel.

**Key Characteristics:**
- Two inks on stock, plus an inverted night edition; a third restricted ramp confined to the profile band.
- Rules, not boxes: three declared rule weights and zero corner radius.
- One variable typeface, worked through its width axis instead of a second family.
- Tabular lining figures wherever a number is a measurement.
- Colour is never the only signal: every measurement band also carries a hatch.
- The browser's own surfaces (selection, caret, scrollbar, focus ring, placeholder) are themed from the palette.
- One artifact serves three media: the pocket card is the phone layout and the print layout.

## Colors

Two inks on stock, and a third restricted system that is allowed inside one
drawing and nowhere else.

### Primary
- **Printer's Green** (`spot`): the second ink. It marks the running head's right side, the R-number anchor on every leg, the intake button's hover state, the pocket card's head rule and its total, the focus ring, the caret, the selection background and the plain area fill under the elevation curve. It never carries body text.
- **Quiet Green** (`spot-quiet`): the only tinted field in the system, and it exists for exactly one element: the pocket card's ground, so the part you take with you reads as a different piece of paper.

### Neutral
- **Stock** (`stock`): the page ground, and the reversed-out text colour on the ink-filled intake button and the aid-station tags.
- **Text Ink** (`ink`): body text, headings, the profile curve, the heavy section rules and the table's closing double rule. A near-neutral dark green-black, never a tinted grey.
- **Second Ink** (`ink-2`): notes, column heads, hints, captions, the back matter's definitions, the kilometre rule. Everything that qualifies a number rather than being one.
- **Hairline** (`rule`): the row separator under table rows, pocket-card rows and booklet rows.
- **Mid Rule** (`rule-mid`): the heavier structural hairline: input baselines, placeholders, the dashed cut rule, the ruler's ticks, the scrollbar thumb.

### Tertiary
The measurement ramp, five steps for gradient and three for roughness, warm
for climb and cold for descent: `steep-up`, `up`, `level`, `down`,
`steep-down`; `rough` and `mixed` reuse the two warm values and `smooth` is its
own green. Slices are filled at 82% opacity and the hatch over them at 50%.

### Named Rules
**The Two Inks Rule.** Outside the profile band and its legend, the page has
exactly two inks and their tints. Any new surface that reaches for a third
colour is reaching for the wrong tool.

**The Ramp Is Bounded Rule.** The measurement ramp exists inside the profile
drawing and the legend directly under it. It never colours text, a rule, a
table cell or a control. The one exception is documented and deliberate:
`steep-up` doubles as the alarm ink on the two warning rules (the error line and
the validity caution), because those rules are also measurements crossing a
threshold.

**The Hue Is Never Alone Rule.** Every band that carries a hue also carries a
hatch whose direction is the slope's direction and whose density is its
steepness (climb leans up, descent leans down, steep at 8px, moderate at 16px,
roughness uses a cross and mixed uses a dot). Level ground and smooth line carry
no hatch, because quiet is the readable absence. Greyscale printing and colour
blindness must not lose a reading.

**The Night Edition Rule.** Dark mode is not an inversion filter, it is a second
printing: the spot brightens to a legible green on true black, the ramp shifts
to lighter, less saturated pigments, and the hairlines re-derive from the new
ground. Add tokens to both blocks or do not add them.

## Typography

**Single Family:** Archivo variable, self-hosted (`assets/archivo-var.woff2`),
weight 100-900 and width 62-125, preloaded, `font-display: swap`, with
`system-ui, sans-serif` as the fallback stack.

**Character:** A grotesque with a real width axis, used the way a printer uses a
condensed cut: the same voice, compressed for furniture and opened up for the
one figure that matters. The result reads as a printed form rather than as a web
page.

### Hierarchy
- **Display** (700, width 112%, `clamp(3rem, 1.5rem + 7vw, 6rem)`, line-height 0.92, -0.03em, `tnum`): the single large figure, the finishing-time estimate. A minor variant at width 100% and `clamp(2rem, 1.3rem + 2.6vw, 3rem)` carries the carbohydrate figure.
- **Headline** (700, width 78%, `clamp(1.5rem, 1.1rem + 2vw, 2.25rem)`, 0.02em, lowercase): the product name in the running head, and at 600 the intake button's uppercase label.
- **Title** (500, width 88%, 1.35rem): the value a runner types into a form field.
- **Body** (400, width 100%, `clamp(0.95rem, 0.9rem + 0.2vw, 1.05rem)`, 1.55, `tabular-nums` on the whole document): the lede and prose, capped at 62ch; notes cap at 70ch.
- **Data** (400, width 88%, 0.86-0.92rem, `tabular-nums`): table cells, pocket-card rows, the course summary line. Proper names inside a data row step back to width 100% so they read as words rather than as measurements.
- **Label** (600, width 72%, 0.62-0.72rem, 0.08-0.14em, uppercase): section rubrics, column heads, reading tabs, form-field labels, the kilometre rule, the legend at width 78%.

### Named Rules
**The One Family, Two Axes Rule.** There is no second typeface and no system
font fallback in the design. Reach for the width axis before reaching for a new
family, a new weight, or a size step: 72% for furniture, 88% for data, 100% for
prose, 112% for the one big figure.

**The Measurement Sets Tabular Rule.** Any number a runner compares down a
column is set in tabular lining figures. `font-variant-numeric: tabular-nums` is
on the body and the large figure additionally pins `font-feature-settings:
'tnum'`; do not turn it off inside a table.

**The Label Is Not A Kicker Rule.** Condensed uppercase at 0.14em is the
system's furniture: it labels a section (as an `h2`), a column, or a form field.
It is never a decorative line of small caps floating above a heading.

## Layout

One sheet, centred, `64rem` measure, with a fluid gutter of
`clamp(1.25rem, 4vw, 3rem)`. There is no grid framework and no column system for
the page as a whole: the sheet is one column, and sections stack on a vertical
rhythm of `clamp(2.25rem, 6vw, 3.5rem)`.

Two local grids exist. The form line is `repeat(auto-fit, minmax(11rem, 1fr))`,
so three ruled fields sit on one line on a computer and stack on a phone without
a breakpoint. The back matter is a `columns: 2 19rem` flow with
`break-inside: avoid`, which is a printed page's answer to short definitions.

**Density steps, declared once and shared.** One set of widths governs the leg
table, the blank booklet, the pocket card and the sentence that describes the
columns, so what the table drops and what the prose says can never disagree:

- **52rem** drops the elapsed clock (a running total, recoverable by addition).
- **40rem** drops the ascent column (context, not an answer).
- **30rem** drops the aid station's kilometre from the table (it survives on the pocket card) and drops the station name from the pocket card row.

Leg, name, time and carbohydrate never leave, because they are the answer to the
question the page exists to ask. The plan table never squeezes: below its
`21rem` minimum it scrolls inside its own focusable region, masked by a
stock-coloured fade and an inset shadow at each edge, so a wide table never
drags the sheet sideways.

**Print** is a different layout, not a stylesheet afterthought: the palette
collapses to black on white, everything but the profile band, the cut rule and
the pocket card is removed, the band shrinks to 120pt and the card acquires a
1.5pt keyline because it is now a physical object to be cut out.

### Named Rules
**The Declared Density Rule.** Columns leave by name at named widths. Nothing
in this system shrinks type, tightens tracking or wraps a cell to survive a
narrower viewport.

## Elevation & Depth

Flat by construction. This is a print job: there is no ambient shadow, no
layered surface, no backdrop blur and no scrim anywhere in the built stylesheet.
Depth is carried entirely by rule weight and by ink density, the way it is on
paper.

### Shadow Vocabulary
- **Card lift** (`box-shadow: 0 14px 28px -14px rgba(0, 0, 0, 0.45)`, with `transform: rotate(-0.35deg) translateY(4px)`, 420ms `cubic-bezier(0.16, 1, 0.3, 1)`): the system's only shadow, and only on the pocket card's hover (including when the print button is hovered). It says the strip is a loose piece of paper about to be taken away. It does not exist at rest and it is removed in print.

### Named Rules
**The Paper Has No Shadow Rule.** A surface at rest never has a shadow. The one
shadow in the system is a response to a pointer on the one element that is meant
to detach.

**The Motion Is One Moment Rule.** Motion is: the sheet settling in (a 520ms
staggered `unfold`, 60ms per child, six children), the profile line drawing
itself once in 900ms, 140ms colour transitions on controls, and the card lift.
All of it collapses to 1ms under `prefers-reduced-motion: reduce`, and the
profile line is drawn complete rather than animated.

## Shapes

**Zero radius, everywhere.** Every control that a browser would round by default
is explicitly reset to `border-radius: 0`: the intake button, the cut button,
the reading tabs and the text inputs. There is no rounded token in this system
and adding one would break the world.

The form language is the horizontal rule at three declared weights:

- **Heavy rule** (`--rule-w: 3px`, ink): opens the document under the running head and closes it above the colophon. Also the reading tab's selected underline and the input's focused baseline.
- **Structural rule** (2px): the table head, the input baseline at rest (`rule-mid`), the profile band's baseline, the pocket card's head rule (spot), the two warning rules (`steep-up`).
- **Hairline** (1px, `rule`): row separators in the table, the pocket card and the blank booklet; the rubric's underline.
- **Closing rule** (`4px double`, ink): the last row of a table. A table ends; it does not just stop.
- **Cut rule** (`2px dashed`, `rule-mid`): the one dashed line in the system. It is structural, and it means "the document ends here and the part you carry begins".

Drawn marks are inline SVG authored for this page: the ghost profile of the
empty state, the elevation curve at 1.5 non-scaling stroke, the hatch patterns,
the aid-station triangle (a 4px/7px CSS border triangle dropping onto the
kilometre rule), and the scissors on the cut button. There is no icon font, no
icon library and no emoji.

## Components

### Intake Button (the one primary action)
- **Character:** the largest element on an empty page, ruled across the sheet like a form's instruction band.
- **Shape:** full-bleed within the measure, square corners, no border.
- **Default:** ink ground, stock text, condensed uppercase at width 78%/600, left-aligned, `clamp(1rem, 3vw, 1.4rem) 1.25rem` padding.
- **Hover and drag-over:** ground swaps to the spot green over 140ms. The whole sheet is the drop target; `.over` on the button is how the page acknowledges a drag.
- There is no secondary button of this kind. One page, one primary action.

### Form Fields
- **Character:** a paper form asking a question: the value first, the label beneath it.
- **Style:** transparent ground, no border except a 2px `rule-mid` baseline, square corners. The input is `order: -1` above its label, so the written value sits on the rule and the condensed uppercase label reads underneath at 0.72rem/0.1em, with a sentence-case hint beneath that.
- **Hover:** baseline darkens to the second ink. **Focus:** baseline thickens to 3px spot green and the padding compensates so the value does not shift.
- **Placeholder:** `rule-mid` at weight 400, so an example never reads as an entered value.

### Reading Tabs
- **Character:** the tab strip of a printed index, not a segmented control.
- **Style:** text-only, condensed uppercase, seated on a hairline with a 3px transparent underline reserved at rest, `margin-bottom: -1px` so the selected underline overprints the strip's rule.
- **Selected:** text goes to full ink, underline goes to ink, and an em dash in spot green is printed before the label. State is carried by rule weight and a mark, never by a colour swap alone.

### Leg Table (the plan)
- **Character:** the document's spine. One row per leg between two aid stations.
- **Style:** collapsed borders, no zebra, no cell background. Right-aligned numerics; leg and name columns left-aligned; first and last cells flush to the measure.
- **Head:** condensed uppercase second ink over a 2px ink rule. **Rows:** width-88% tabular figures over hairlines. **Close:** 4px double ink rule.
- **R-number:** condensed 700 in spot green, a durable per-leg anchor reused verbatim in prose, in the pocket card and on the profile band.
- **Longest leg:** the whole row goes to weight 700. The leg that decides the pack is found by scanning, not by a badge.

### Profile Band
- **Character:** a drawing that is labelled in place, at constant scale, rather than deferred to a key.
- **Style:** full-measure inline SVG at `clamp(150px, 24vw, 230px)`, `preserveAspectRatio: none`, seated on a 2px ink rule. The curve is a 1.5 non-scaling stroke in ink; the ground beneath it is filled, either as one quiet spot-green area (elevation) or as coloured and hatched slices (gradient, roughness).
- **Aid stations:** an HTML overlay, not SVG text, because the drawing is stretched and stretched type is unreadable. Each stop is a 30%-opacity ink hairline with a triangle at the baseline and a reversed-out number tag; labels are suppressed when two stops fall within 3.2% of each other, and the final stop shifts left so it stays inside the measure.
- **Kilometre rule:** absolute ticks at a step chosen from total distance (30/20/10/5/2 km), with the finish owning the right end and round kilometres stepping aside from it after 87%.
- **Legend:** only for the coloured readings, and only for the levels actually present in this course. Each entry is a 22x12 swatch carrying both the fill and the hatch.

### Pocket Card (signature)
- **Character:** the thing you leave with. A narrow strip on quiet green under a dashed cut rule, carrying only R-number, kilometre, time and grams.
- **Style:** `34rem` max width, square corners, no rule at its edges except the spot-green 2px head rule under the race name and total; rows are a five-column grid separated by hairlines, with the last row's hairline removed.
- **State:** at rest it is flat and square to the page. Hovering it, or hovering the print button that precedes it, lifts it with the single card-lift shadow and a 0.35 degree rotation.
- **One artifact, three media:** at 30rem the station name drops and the card becomes the phone layout; in `@media print` the rest of the document is removed and the card, with a 1.5pt keyline and the band above it, is the printed page.

### Empty State (the blank booklet)
- **Character:** a drawn invitation, not a dashed placeholder box.
- **Style:** the whole document printed as a ghost at 40% opacity: an authored profile path filled at 10% with a dashed 1.5 stroke, its kilometre rule, and four ruled table rows with real column heads that honour the same density steps. It is `aria-hidden`, because it is a drawing of a plan, not a plan.

## Do's and Don'ts

### Do:
- **Do** carry every division with a rule at one of the four declared weights: 3px heavy, 2px structural, 1px hairline, 4px double to close.
- **Do** reach for Archivo's width axis (72 / 88 / 100 / 112) before reaching for a new weight, size or family.
- **Do** give every band of the measurement ramp a hatch as well as a hue, and keep the ramp inside the profile band and its legend.
- **Do** keep every comparable number in tabular lining figures.
- **Do** drop named columns at the declared widths (52rem, 40rem, 30rem) and let a table that still does not fit scroll inside its own focusable region.
- **Do** theme the browser's own surfaces from the palette: selection, caret, focus ring, scrollbar, placeholder.
- **Do** add every new colour token to both the light and the night block.
- **Do** author drawn marks as inline SVG sized in the flow.

### Don't:
- **Don't** introduce a card, a panel, a box or a border radius. This world is ruled, not boxed.
- **Don't** add a shadow to a resting surface; the one shadow is a hover response on the pocket card.
- **Don't** add a second typeface, or let a control fall back to the system font.
- **Don't** let hue be the only carrier of a reading, and don't spend a ramp colour on text, a rule or a control outside the band.
- **Don't** shrink type, tighten tracking or wrap a cell to survive a narrow viewport.
- **Don't** use an icon font, an icon library, an emoji or a glyph as an icon.
- **Don't** set a decorative line of spaced small caps above a heading; condensed uppercase is a label for a section, a column or a field, and it is marked up as one.
- **Don't** put a measurement in prose without the R-number or the unit it belongs to.
