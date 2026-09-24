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
  print-paper: "#fff"
  print-ink: "#000"
  print-ink-2: "#444"
  print-rule: "#999"
typography:
  mark:
    fontFamily: "Archivo, system-ui, sans-serif"
    fontSize: "0.7rem"
    fontWeight: 600
    lineHeight: 1.35
    letterSpacing: "0.12em"
    fontVariation: "wdth 72"
  aside:
    fontFamily: "Archivo, system-ui, sans-serif"
    fontSize: "0.8rem"
    fontWeight: 400
    lineHeight: 1.4
    letterSpacing: "normal"
    fontVariation: "wdth 100"
  note:
    fontFamily: "Archivo, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "normal"
    fontVariation: "wdth 100"
  body:
    fontFamily: "Archivo, system-ui, sans-serif"
    fontSize: "clamp(0.95rem, 0.9rem + 0.2vw, 1.05rem)"
    fontWeight: 400
    lineHeight: 1.55
    letterSpacing: "normal"
    fontVariation: "wdth 100"
    fontFeature: "tnum"
  action:
    fontFamily: "Archivo, system-ui, sans-serif"
    fontSize: "clamp(1.05rem, 0.95rem + 0.4vw, 1.25rem)"
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: "0.04em"
    fontVariation: "wdth 78"
  field:
    fontFamily: "Archivo, system-ui, sans-serif"
    fontSize: "1.35rem"
    fontWeight: 500
    lineHeight: 1.3
    letterSpacing: "normal"
    fontVariation: "wdth 88"
  title:
    fontFamily: "Archivo, system-ui, sans-serif"
    fontSize: "clamp(1.5rem, 1.1rem + 2vw, 2.25rem)"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "0.02em"
    fontVariation: "wdth 78"
  figure:
    fontFamily: "Archivo, system-ui, sans-serif"
    fontSize: "clamp(2rem, 1.3rem + 2.6vw, 3rem)"
    fontWeight: 700
    lineHeight: 0.92
    letterSpacing: "-0.03em"
    fontVariation: "wdth 100"
    fontFeature: "tnum"
  display:
    fontFamily: "Archivo, system-ui, sans-serif"
    fontSize: "clamp(3rem, 1.5rem + 7vw, 6rem)"
    fontWeight: 700
    lineHeight: 0.92
    letterSpacing: "-0.03em"
    fontVariation: "wdth 112"
    fontFeature: "tnum"
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
  slip: "16rem"
components:
  button-intake:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.stock}"
    typography: "{typography.action}"
    rounded: "{rounded.none}"
    padding: "clamp(1rem, 3vw, 1.4rem) 1.25rem"
    width: "100%"
  button-intake-hover:
    backgroundColor: "{colors.spot}"
    textColor: "{colors.stock}"
  button-cut:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    typography: "{typography.mark}"
    rounded: "{rounded.none}"
    padding: "0.45rem 0.9rem"
  button-cut-hover:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.stock}"
  tab-reading:
    backgroundColor: "transparent"
    textColor: "{colors.ink-2}"
    typography: "{typography.mark}"
    rounded: "{rounded.none}"
    padding: "0.6rem 0.95rem 0.7rem"
  tab-reading-selected:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
  input-field:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    typography: "{typography.field}"
    rounded: "{rounded.none}"
    padding: "0.15rem 0 0.3rem"
    width: "100%"
  input-field-focus:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
  table-plan:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.none}"
    padding: "0.55rem 0.5rem"
  pocket-card:
    backgroundColor: "{colors.spot-quiet}"
    textColor: "{colors.ink}"
    typography: "{typography.note}"
    rounded: "{rounded.none}"
    padding: "1.1rem 1.25rem 1.25rem"
    width: "34rem"
  aid-mark:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.stock}"
    typography: "{typography.mark}"
    rounded: "{rounded.none}"
    padding: "0.05rem 0.25rem"
  aid-slip:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.stock}"
    typography: "{typography.note}"
    rounded: "{rounded.none}"
    padding: "0.5rem 0.7rem 0.6rem"
    width: "{spacing.slip}"
---

# Design System: ravito

## Overview

**Creative North Star: "The Road Book the Organiser Did Not Print"**

This is a two-ink print job that happens to run in a browser. One text ink and
one printer's green sit on stock; a night edition inverts both onto true black
for a start pen before dawn under a headtorch, and a print edition collapses
both to black on white for paper. The use scenes chose the editions: a kitchen
table in the evening, a cold start at 4 a.m., and a strip folded into a vest
pocket. Nothing in the palette is a category habit.

Rules carry every division. There is no card, no box, no panel and no radius
anywhere in the built stylesheet: a heavy rule opens a section, a hairline
separates rows, a 4px double rule closes a table. Numbers live in a table
because a table is what you read at 4 a.m., and every figure that is a
measurement is set in tabular lining figures so columns align down the page.

One typeface does all of it. Archivo variable is self-hosted with both axes
live (weight 100-900, width 62-125), and the width axis does the work a second
family would normally do: condensed for furniture and column heads, semi-narrow
for tabular data, regular for prose, expanded for the single large figure. The
size ramp is nine declared steps and nothing else. The page refuses the fitness
dashboard, the grid of same-size stat cards and the rounded panel.

**Key Characteristics:**
- Two inks on stock, plus an inverted night edition and a black-on-white print edition; a third restricted ramp confined to the profile band.
- Rules, not boxes: three declared rule weights and zero corner radius.
- One variable typeface, worked through its width axis instead of a second family.
- Nine declared type steps, floored at 0.7rem, with no literal size anywhere in the sheet.
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
- **Stock** (`stock`): the page ground, and the reversed-out text colour on every ink-filled plate: the intake button, the aid-station number, the aid slip.
- **Text Ink** (`ink`): body text, headings, the profile curve, the heavy section rules, the table's closing double rule, and the ground of every inverted plate. A near-neutral dark green-black, never a tinted grey.
- **Second Ink** (`ink-2`): notes, column heads, hints, captions, the back matter's definitions, the kilometre rule. Everything that qualifies a number rather than being one.
- **Hairline** (`rule`): the row separator under table rows, pocket-card rows and booklet rows.
- **Mid Rule** (`rule-mid`): the heavier structural hairline: input baselines, placeholders, the dashed cut rule, the ruler's ticks, the scrollbar thumb.

### Tertiary
The measurement ramp, five steps for gradient and three for roughness, warm
for climb and cold for descent: `steep-up`, `up`, `level`, `down`,
`steep-down`; `rough` and `mixed` reuse the two warm values and `smooth` is its
own green. Slices are filled at 82% opacity and the hatch over them at 50%.

### The Print Edition
`@media print` is a third ground, not a fallback. Six tokens are redefined for
paper: the stock becomes true white (`print-paper`), the ink becomes true black
(`print-ink`), the second ink becomes a mid grey (`print-ink-2`), the hairline
lightens (`print-rule`), and both greens collapse, the spot to black and the
quiet green to white, because a home printer has one cartridge worth trusting.
Everything downstream of those six tokens reprints itself, which is why the
pocket card survives paper with no print styling of its own beyond its keyline.

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

**The Three Editions Rule.** Every colour in this system exists three times: on
stock, on true black for the night edition, and on paper for the print edition.
A new token is added to all three blocks, or it is not added. No colour is ever
written as a literal outside those blocks.

## Typography

**Single Family:** Archivo variable, self-hosted (`assets/archivo-var.woff2`),
weight 100-900 and width 62-125, preloaded, `font-display: swap`, with
`system-ui, sans-serif` as the fallback stack.

**Character:** A grotesque with a real width axis, used the way a printer uses a
condensed cut: the same voice, compressed for furniture and opened up for the
one figure that matters. The result reads as a printed form rather than as a web
page.

### The Ramp
Nine steps, declared as custom properties on `:root`, and no `font-size` in the
stylesheet written as a literal. Each step is a voice rather than a size: the
step is chosen by what the text is for, and the width axis then says how it is
set.

- **Mark** (0.7rem, width 72%, 600-700, 0.04-0.14em, uppercase): all furniture. Section rubrics, column heads, reading tabs, form-field labels, the aid-station numbers on the drawing and inside the slip, the kilometre rule, the cut button, the running head's right mark; the legend is the one that opens to width 78%.
- **Aside** (0.8rem, width 78-100%, 400): text that stands beside something else and is read second. Field hints, the drop hint, the slip's detail lines, the back matter's terms, the pocket note, the colophon.
- **Note** (0.875rem, width 100%, 400; width 88% where the text is data): the reserve that travels with a figure. Notes, the course readout, the error line, the caution, matter definitions; at width 88%, pocket-card rows and the slip's station name.
- **Body** (clamp(0.95rem, 0.9rem + 0.2vw, 1.05rem), width 100%, 400, line-height 1.55): prose capped at 62ch, the estimate's range line, the pocket card's head, and the leg table's cells, which inherit this step at width 88%.
- **Action** (clamp(1.05rem, 0.95rem + 0.4vw, 1.25rem), width 78%, 600, 0.04em, uppercase): the file button, and only the file button. One page, one primary action, one step held for it.
- **Field** (1.35rem, width 88%, 500): the value a runner types onto a ruled baseline, and at width 112%/700 the pocket head's total.
- **Title** (clamp(1.5rem, 1.1rem + 2vw, 2.25rem), width 78%, 700, 0.02em, lowercase): the running head, and nothing else.
- **Figure** (clamp(2rem, 1.3rem + 2.6vw, 3rem), width 100%, 700): the carbohydrate figure, the second-largest number on the page.
- **Display** (clamp(3rem, 1.5rem + 7vw, 6rem), width 112%, 700, line-height 0.92, -0.03em, `tnum`): the finishing-time estimate. One of these per document.

Print is deliberately outside the ramp and keeps its own two values, 10pt for
the body and 5pt for the aid-station numbers on the band, because paper is a
different reading distance from a screen.

### Named Rules
**The Nine Voices Rule.** There are nine type steps and no literal `font-size`
anywhere in the sheet. A new size is not a new number, it is a claim that a
tenth voice exists: make the claim and add the token, or use one of the nine.
The sheet once carried seventeen fixed sizes between 0.62rem and 0.95rem, most a
fifth of a pixel apart, and that is noise with a token name rather than a ramp.

**The 0.7rem Floor Rule.** No functional text is set below 0.7rem. Under about
11px it fails on a phone held at arm's length in a start pen, and that is half
of what this page is for. The floor is not a preference, it is the smaller of
the two use scenes.

**The One Family, Two Axes Rule.** There is no second typeface and no system
font fallback in the design. Reach for the width axis before reaching for a new
family or a new weight: 72% for furniture, 78% for actions and legends, 88% for
data, 100% for prose, 112% for the one big figure.

**The Measurement Sets Tabular Rule.** Any number a runner compares down a
column is set in tabular lining figures. `font-variant-numeric: tabular-nums` is
on the body and the large figures additionally pin `font-feature-settings:
'tnum'`; do not turn it off inside a table.

**The Label Is Not A Kicker Rule.** The mark step is the system's furniture: it
labels a section (as an `h2`), a column, or a form field. It is never a
decorative line of small caps floating above a heading.

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

The aid slip is the one overlay in the system, and it is measured rather than
floated: a fixed `16rem` width, anchored above its mark and clamped to the
drawing's own edges with `clamp(0px, calc(var(--at) - var(--slip) / 2),
calc(100% - var(--slip)))`, so a station at kilometre zero or at the finish
opens a slip flush with the band rather than off the sheet.

**Print** is a different layout, not a stylesheet afterthought: the palette
collapses to the print edition, everything but the profile band, the cut rule
and the pocket card is removed, the slips go with it, the band shrinks to 120pt
and the card acquires a 1.5pt keyline because it is now a physical object to be
cut out.

### Named Rules
**The Declared Density Rule.** Columns leave by name at named widths. Nothing
in this system shrinks type, tightens tracking or wraps a cell to survive a
narrower viewport.

**The Overlay Clamps To Its Drawing Rule.** Anything that opens over the profile
is positioned against the band, not against the 18px mark that triggered it. It
is a sibling of its mark, never a child.

## Elevation & Depth

Flat by construction. This is a print job: there is no ambient shadow, no
layered surface, no backdrop blur and no scrim anywhere in the built stylesheet.
Depth is carried by rule weight, by ink density, and in one case by inversion:
the aid slip and the file button are the same device, a plate of solid ink with
the stock reversed out of it, which reads as sitting above the page without a
shadow under it.

### Shadow Vocabulary
- **Card lift** (`box-shadow: 0 14px 28px -14px rgba(0, 0, 0, 0.45)`, with `transform: rotate(-0.35deg) translateY(4px)`, 420ms `cubic-bezier(0.16, 1, 0.3, 1)`): the system's only shadow, and only on the pocket card's hover (including when the print button is hovered). It says the strip is a loose piece of paper about to be taken away. It does not exist at rest and it is removed in print.

### Named Rules
**The Paper Has No Shadow Rule.** A surface at rest never has a shadow. The one
shadow in the system is a response to a pointer on the one element meant to
detach. An overlay earns its separation by inverting, not by casting.

**The Motion Is One Moment Rule.** Motion is: the sheet settling in (a 520ms
staggered `unfold`, 60ms per child, six children), the profile line drawing
itself once in 900ms, 140ms colour transitions on controls, 160ms on the aid
slip, and the card lift. All of it collapses to 1ms under
`prefers-reduced-motion: reduce`, and the profile line is drawn complete rather
than animated.

## Shapes

**Zero radius, everywhere.** Every control that a browser would round by default
is explicitly reset to `border-radius: 0`: the intake button, the cut button,
the reading tabs, the text inputs and the aid marks. There is no rounded token
in this system and adding one would break the world.

The form language is the horizontal rule at three declared weights:

- **Heavy rule** (`--rule-w: 3px`, ink): opens the document under the running head and closes it above the colophon. Also the reading tab's selected underline and the input's focused baseline.
- **Structural rule** (2px): the table head, the input baseline at rest (`rule-mid`), the profile band's baseline, the pocket card's head rule (spot), the two warning rules (`steep-up`).
- **Hairline** (1px, `rule`): row separators in the table, the pocket card and the blank booklet; the rubric's underline. The aid mark's drop line is the same hairline in ink at 30% opacity, going to 85% when the mark is hovered or focused.
- **Closing rule** (`4px double`, ink): the last row of a table. A table ends; it does not just stop.
- **Cut rule** (`2px dashed`, `rule-mid`): the one dashed line in the system. It is structural, and it means "the document ends here and the part you carry begins".

Beside the rule there is one plate: a rectangle of solid ink with the stock
reversed out of it, square-cornered and tightly padded. It is the file button,
the aid-station number on the drawing, and the aid slip; inside the slip the
number wears the same plate inverted again, stock ground with ink text.

Drawn marks are inline SVG authored for this page: the ghost profile of the
empty state, the elevation curve at 1.5 non-scaling stroke, the hatch patterns,
the aid-station triangle (a 4px/7px CSS border triangle dropping onto the
kilometre rule), and the scissors on the cut button. There is no icon font, no
icon library and no emoji.

## Components

### Intake Button (the one primary action)
- **Character:** the largest element on an empty page, ruled across the sheet like a form's instruction band.
- **Shape:** full-bleed within the measure, square corners, no border.
- **Default:** ink ground, stock text, the action step at width 78%/600, left-aligned, `clamp(1rem, 3vw, 1.4rem) 1.25rem` padding.
- **Hover and drag-over:** ground swaps to the spot green over 140ms. The whole sheet is the drop target; `.over` on the button is how the page acknowledges a drag.
- There is no secondary button of this kind. One page, one primary action.

### Form Fields
- **Character:** a paper form asking a question: the value first, the label beneath it.
- **Style:** transparent ground, no border except a 2px `rule-mid` baseline, square corners. The input is `order: -1` above its label, so the written value sits on the rule and the mark-step label reads underneath, with an aside-step hint beneath that.
- **Hover:** baseline darkens to the second ink. **Focus:** baseline thickens to 3px spot green and the padding compensates so the value does not shift.
- **Placeholder:** `rule-mid` at weight 400, so an example never reads as an entered value.

### Reading Tabs
- **Character:** the tab strip of a printed index, not a segmented control.
- **Style:** text-only, mark step, seated on a hairline with a 3px transparent underline reserved at rest, `margin-bottom: -1px` so the selected underline overprints the strip's rule.
- **Selected:** text goes to full ink, underline goes to ink, and an em dash in spot green is printed before the label. State is carried by rule weight and a mark, never by a colour swap alone.

### Leg Table (the plan)
- **Character:** the document's spine. One row per leg between two aid stations.
- **Style:** collapsed borders, no zebra, no cell background. Right-aligned numerics; leg and name columns left-aligned; first and last cells flush to the measure.
- **Head:** mark step in the second ink over a 2px ink rule. **Rows:** the body step at width 88% with tabular figures over hairlines. **Close:** 4px double ink rule.
- **R-number:** condensed 700 in spot green, a durable per-leg anchor reused verbatim in prose, in the pocket card, on the profile band and inside the aid slip.
- **Longest leg:** the whole row goes to weight 700. The leg that decides the pack is found by scanning, not by a badge.

### Profile Band
- **Character:** a drawing that is labelled in place, at constant scale, rather than deferred to a key.
- **Style:** full-measure inline SVG at `clamp(150px, 24vw, 230px)`, `preserveAspectRatio: none`, seated on a 2px ink rule. The curve is a 1.5 non-scaling stroke in ink; the ground beneath it is filled, either as one quiet spot-green area (elevation) or as coloured and hatched slices (gradient, roughness).
- **Kilometre rule:** absolute ticks at a step chosen from total distance (30/20/10/5/2 km), with the finish owning the right end and round kilometres stepping aside from it after 87%.
- **Legend:** only for the coloured readings, and only for the levels actually present in this course. Each entry is a 22x12 swatch carrying both the fill and the hatch.

### Aid Mark and Aid Slip
- **Character:** every aid station on the drawing is a control, not an annotation. The mark is where a leg ends; the slip is what that leg costs.
- **Mark:** an 18px-wide button over the band carrying a 1px ink drop line at 30% opacity, a 4px/7px triangle on the baseline, and the station's number as a small ink plate with the stock reversed out. Numbers are suppressed where two marks fall within 3.2% of each other, and the last one shifts left to stay inside the measure. Hover or focus takes the drop line to 85%, so the mark answers before the slip arrives.
- **Slip:** not a card, because this world has none. It is the same inverted ink plate the file button uses: ink ground, stock text, square corners, no border, no shadow, `0.5rem 0.7rem 0.6rem` padding on a two-column grid. It carries the R-number on its own reversed plate, the station name at the note step (width 88%), and two aside lines: the kilometre with the elapsed time reached, then the leg into it as duration, ascent and carbohydrate.
- **Position:** rendered as a sibling of its mark rather than a child, `16rem` wide, anchored `0.55rem` above the band and clamped to the drawing's edges, so a slip never leaves the sheet.
- **State:** opens on `:hover` and on `:focus`, deliberately not `:focus-visible`, so a tap on a phone opens it. It transitions opacity and a 4px rise over 160ms with `visibility` delayed on the way out, and it is `pointer-events: none`, so it can never eat the pointer that opened it. The mark's own focus ring is the system's spot-green ring at zero offset. The whole slip is removed in print.
- **Spoken form:** the mark's `aria-label` carries the same facts as a sentence, so the slip is a visual convenience rather than the only route to the information.

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
- **Do** set every size from one of the nine type steps, and reach for Archivo's width axis (72 / 78 / 88 / 100 / 112) before reaching for a new weight or a new step.
- **Do** keep functional text at 0.7rem or above.
- **Do** give every band of the measurement ramp a hatch as well as a hue, and keep the ramp inside the profile band and its legend.
- **Do** keep every comparable number in tabular lining figures.
- **Do** drop named columns at the declared widths (52rem, 40rem, 30rem) and let a table that still does not fit scroll inside its own focusable region.
- **Do** theme the browser's own surfaces from the palette: selection, caret, focus ring, scrollbar, placeholder.
- **Do** add every new colour token to all three editions: stock, night and print.
- **Do** open a hover affordance on `:focus` as well, so a tap works, and give the same facts to a screen reader in words.
- **Do** author drawn marks as inline SVG sized in the flow.

### Don't:
- **Don't** introduce a card, a panel, a box or a border radius. This world is ruled, not boxed; an overlay separates itself by inverting to an ink plate.
- **Don't** add a shadow to a resting surface; the one shadow is a hover response on the pocket card.
- **Don't** write a literal `font-size` or a literal colour in the stylesheet; both have tokens, and print keeps its own two sizes on purpose.
- **Don't** add a second typeface, or let a control fall back to the system font.
- **Don't** let hue be the only carrier of a reading, and don't spend a ramp colour on text, a rule or a control outside the band.
- **Don't** shrink type, tighten tracking or wrap a cell to survive a narrow viewport.
- **Don't** use an icon font, an icon library, an emoji or a glyph as an icon.
- **Don't** set a decorative line of spaced small caps above a heading; the mark step is a label for a section, a column or a field, and it is marked up as one.
- **Don't** put a measurement in prose without the R-number or the unit it belongs to.
