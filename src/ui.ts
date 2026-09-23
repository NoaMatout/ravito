/** The only module that touches the document. It calculates nothing.
 *
 *  The page is a road book: ruled, not boxed, and its unit is the leg between
 *  two aid stations. Everything below writes that document. */

import { parse, parseWaypoints, locateOnTrack, GpxError, type Point } from './gpx.js';
import { smooth, relief } from './elevation.js';
import { segment, type Segment } from './segments.js';
import { DEFAULT_TERRAIN, calibrate } from './pace.js';
import { build, durationOf, longestLeg, type Leg } from './plan.js';
import { needs, MISSING } from './nutrition.js';
import { SOURCES } from './sources.js';
import * as profile from './profile.js';
import { bands, type Band, type Reading } from './terrain.js';

type State = {
  points: Point[];
  segments: Segment[];
  name: string;
  stations: { name: string; distanceM: number }[];
  // The readings depend on the course alone, so they are computed once when the
  // file lands rather than on every keystroke in the pace field.
  readings: Record<Reading, Band[]>;
} | null;
let loaded: State = null;

/** Beyond this, the model is extrapolating well past anything it was
 *  checked against, and the page says so instead of answering confidently. */
const VALIDATED_HOURS = 6;

let reading: Reading = 'elevation';

const READINGS: readonly { id: Reading; label: string; note: string }[] = [
  {
    id: 'elevation',
    label: 'Altitude',
    note: 'Marks are the aid stations, numbered as in the plan below.',
  },
  {
    id: 'gradient',
    label: 'Gradient',
    note:
      'Average gradient over 250 m, in five steps rather than in percentages. ' +
      'The hatch leans the way the ground leans and thickens with the slope, so ' +
      'the reading survives a printout, a phone in full sun, and colour blindness.',
  },
  {
    id: 'roughness',
    label: 'Roughness',
    note:
      'Half how much the gradient moves inside 250 m, half how far the line wanders ' +
      'from straight. This is geometry, not technicality: rock, root and mud leave no ' +
      'trace in a list of coordinates, and nothing here can see them.',
  },
];

const LEVELS: Readonly<Record<string, string>> = {
  'steep-up': 'steep climb',
  up: 'climb',
  flat: 'level',
  down: 'descent',
  'steep-down': 'steep descent',
  rough: 'twisting',
  mixed: 'mixed',
  smooth: 'smooth',
};

const $ = (id: string) => document.getElementById(id) as HTMLElement;
const value = (id: string) => (document.getElementById(id) as HTMLInputElement).value.trim();

function paceToSpeed(text: string): number | null {
  const m = /^(\d{1,2})[:.](\d{1,2})$/.exec(text);
  if (!m) return null;
  const seconds = Number(m[1]) * 60 + Number(m[2]);
  if (seconds < 150 || seconds > 900) return null;
  return 1000 / seconds;
}

function hhmm(seconds: number): string {
  const total = Math.round(seconds / 60);
  return `${Math.floor(total / 60)}h${String(total % 60).padStart(2, '0')}`;
}

function km(metres: number): string {
  return `${(metres / 1000).toFixed(1)} km`;
}

function say(message: string) {
  $('message').textContent = message;
}

async function onFile(file: File) {
  try {
    const text = await file.text();
    const points = smooth(parse(text));
    const stations = locateOnTrack(points, parseWaypoints(text));
    loaded = {
      points,
      segments: segment(points),
      name: file.name.replace(/\.gpx$/i, ''),
      stations,
      readings: {
        elevation: [],
        gradient: bands(points, 'gradient'),
        roughness: bands(points, 'roughness'),
      },
    };
    const { ascent, descent } = relief(points);
    $('course').innerHTML =
      `<b>${loaded.name}</b> &middot; ${km(points[points.length - 1].distance)}` +
      ` &middot; D+ ${Math.round(ascent)} m &middot; D&minus; ${Math.round(descent)} m` +
      (stations.length ? ` &middot; <em>${stations.length} aid stations read from the file</em>` : '');
    say('');
    render();
  } catch (e) {
    loaded = null;
    $('course').textContent = '';
    $('plan').innerHTML = '';
    say(e instanceof GpxError ? e.message : 'this file could not be read as GPX');
  }
}

/** The profile band, plus the aid stations named where they fall and a rule in
 *  kilometres underneath. The labels sit in HTML rather than in the SVG because
 *  the drawing is stretched to the measure and stretched text is unreadable. */
function drawBand(shape: profile.Profile, course: string): string {
  const pct = (x: number) => ((x / profile.VIEW_WIDTH) * 100).toFixed(3);
  const slices = shape.slices.length
    ? shape.slices
        .map(
          (s) =>
            `<path class="slice slice-${s.level}" d="${s.d}"/>` +
            (profile.hasHatch(s.level)
              ? `<path class="hatch" d="${s.d}" fill="url(#hatch-${s.level})"/>`
              : ''),
        )
        .join('')
    : `<path class="band-plain" d="${shape.area}"/>`;

  let lastLabel = -100;
  const stops = shape.markers
    .map((m, i) => {
      const at = Number(pct(m.x));
      const room = at - lastLabel > 3.2;
      if (room) lastLabel = at;
      const end = at > 96 ? ' end' : '';
      return (
        `<span class="stop${end}" style="left:${at}%" title="${m.name}">` +
        `<i></i><u></u>${room ? `<b>${i + 1}</b>` : ''}</span>`
      );
    })
    .join('');

  const total = shape.distanceM / 1000;
  const step = total > 120 ? 30 : total > 60 ? 20 : total > 25 ? 10 : total > 12 ? 5 : 2;
  const ticks: string[] = [];
  // The finish label owns the right end of the rule, so the last round
  // kilometre steps aside rather than printing on top of it.
  for (let d = 0; d < total * 0.87; d += step) {
    ticks.push(`<span style="left:${((d / total) * 100).toFixed(3)}%">${d}</span>`);
  }
  ticks.push(`<span style="left:100%">${total.toFixed(1)} km</span>`);

  const named = reading === 'elevation' ? [] : [...new Set(shape.slices.map((s) => s.level))];
  const legend = named.length
    ? `<ul class="legend">${named
        .map(
          (level) =>
            `<li><svg viewBox="0 0 22 12" aria-hidden="true" focusable="false">
               <rect class="slice slice-${level}" width="22" height="12"/>
               ${profile.hasHatch(level) ? `<rect class="hatch" width="22" height="12" fill="url(#hatch-${level})"/>` : ''}
             </svg>${LEVELS[level] ?? level}</li>`,
        )
        .join('')}</ul>`
    : '';

  return `
    <div class="band">
      <svg viewBox="0 0 ${profile.VIEW_WIDTH} ${profile.VIEW_HEIGHT}"
           preserveAspectRatio="none" role="img"
           aria-label="${course}. ${profile.describe(shape)}">
        <defs>${profile.hatchDefs()}</defs>
        ${slices}
        <path class="band-line" d="${shape.line}"/>
      </svg>
      <div class="stops" aria-hidden="true">${stops}</div>
    </div>
    <div class="ruler" aria-hidden="true">${ticks.join('')}</div>
    ${legend}`;
}

function drawPlan(legs: readonly Leg[], worst: Leg | null): string {
  const rows = legs
    .map(
      (l, i) => `<tr${l === worst ? ' class="longest"' : ''}>
        <td class="leg">R${i + 1}</td>
        <td class="name">${l.label}</td>
        <td class="drop-1">${km(l.toM)}</td>
        <td>${hhmm(l.seconds)}</td>
        <td class="drop-2">${Math.round(l.ascent)} m</td>
        <td>${l.carbsLow}&ndash;${l.carbsHigh} g</td>
        <td class="drop-3">${hhmm(l.cumulativeSeconds)}</td>
      </tr>`,
    )
    .join('');

  const longest = worst ? `R${legs.indexOf(worst) + 1}` : '';
  return `<p class="note">One row per leg between two aid stations.
  <span class="drop-1">From the start: <b>at km</b><span class="drop-3">,
    <b>elapsed</b></span>.</span>
  For the leg alone: <b>time</b><span class="drop-2">, <b>D+</b></span>,
  <b>carbs</b>.${
    longest
      ? ` <b class="leg">${longest}</b> is the longest, and it is the leg that
          decides your pack and flask capacity.`
      : ''
  }</p>
  <div class="scroll" tabindex="0" role="region" aria-label="Carry, leg by leg">
    <table class="plan">
      <thead><tr>
        <th>leg</th><th>to</th><th class="drop-1">at km</th><th>time</th>
        <th class="drop-2">D+</th><th>carbs</th><th class="drop-3">elapsed</th>
      </tr></thead>
      <tbody>${rows}</tbody>
    </table>
  </div>`;
}

function drawPocket(
  legs: readonly Leg[],
  name: string,
  total: number,
  beyond: boolean,
): string {
  return `
    <div class="cut">
      <button id="card" type="button">
        <svg viewBox="0 0 16 16" aria-hidden="true" focusable="false" fill="none"
             stroke="currentColor" stroke-width="1.4" stroke-linecap="round">
          <circle cx="3.2" cy="12.4" r="2"/><circle cx="12.8" cy="12.4" r="2"/>
          <path d="M4.6 11 13 2M11.4 11 3 2"/>
        </svg>
        Print the pocket card
      </button>
    </div>
    <section class="pocket" aria-label="Pocket card">
      <h3>${name}<span>${hhmm(total)}</span></h3>
      <p class="pocket-note">Between ${hhmm(total * 0.9)} and ${hhmm(total * 1.15)}.${
        beyond
          ? ' Outside this tool&rsquo;s validated range: no fatigue term, so read the time as a floor.'
          : ''
      }</p>
      <ol>${legs
        .map(
          (l, i) => `<li><b>R${i + 1}</b><span class="name">${l.label}</span>
            <u>${km(l.toM)}</u><u>${hhmm(l.seconds)}</u>
            <i>${l.carbsLow}&ndash;${l.carbsHigh} g</i></li>`,
        )
        .join('')}</ol>
    </section>`;
}

function render() {
  if (!loaded) return;
  const speed = paceToSpeed(value('pace'));
  if (speed === null) {
    say('give a flat road pace between 2:30 and 15:00 per kilometre, like 5:40');
    $('plan').innerHTML = '';
    return;
  }
  say('');

  let factor = 1;
  let calibrationNote =
    'Terrain factor: the default, measured on one runner and one course.';
  const actual = /^(\d{1,2})h(\d{1,2})$/.exec(value('known'));
  if (actual) {
    const seconds = Number(actual[1]) * 3600 + Number(actual[2]) * 60;
    factor = calibrate(loaded.segments, speed, seconds);
    calibrationNote = `Terrain factor: ${factor.toFixed(2)}, measured from the time you gave.`;
  }

  // Typed kilometres win over the file: the runner has the road book, and a
  // file's waypoints sometimes describe something other than a stand.
  const typed = value('aid')
    .split(/[,;\s]+/)
    .filter(Boolean)
    .map((s) => ({ distanceM: Number(s.replace(',', '.')) * 1000 }))
    .filter((a) => Number.isFinite(a.distanceM));
  const stations = typed.length ? typed : loaded.stations;

  const legs = build(loaded.segments, stations, speed, DEFAULT_TERRAIN, factor);
  const total = durationOf(loaded.segments, speed, DEFAULT_TERRAIN, factor);
  const food = needs(total);
  const worst = longestLeg(legs);

  const named = stations.every((s) => 'name' in s)
    ? (stations as { name: string; distanceM: number }[])
    : [];
  const shape = profile.build(loaded.points, named, loaded.readings[reading]);
  const current = READINGS.find((r) => r.id === reading) ?? READINGS[0];

  $('plan').innerHTML = `<div class="settle">
    <section class="section">
      <h2 class="rubric">Estimate</h2>
      <p class="estimate">
        <b>${hhmm(total)}</b>
        <span>between <i>${hhmm(total * 0.9)}</i> and <i>${hhmm(total * 1.15)}</i></span>
      </p>
      <p class="note">${calibrationNote} The range is wide because it covers
        something this tool has not measured about you.</p>
      ${
        total > VALIDATED_HOURS * 3600
          ? `<p class="caution"><b>Outside the validated range.</b> The terrain
             profile was measured on a race of under three hours and the model
             carries no fatigue term. Over ${Math.round(total / 3600)} hours,
             fatigue is what decides the finish, so read this as a floor rather
             than as a prediction.</p>`
          : ''
      }
    </section>

    <section class="section section--band">
      <h2 class="rubric">Profile</h2>
      <div class="readings" role="tablist" aria-label="Reading">
        ${READINGS.map(
          (r) => `<button type="button" role="tab" data-reading="${r.id}"
                    aria-selected="${r.id === reading}">${r.label}</button>`,
        ).join('')}
      </div>
      ${drawBand(shape, loaded.name)}
      <p class="note">${Math.round(shape.lowest)} m at the lowest point,
        ${Math.round(shape.highest)} m at the highest. ${current.note}</p>
    </section>

    <section class="section section--plan">
      <h2 class="rubric">Carry, leg by leg</h2>
      ${drawPlan(legs, worst)}
    </section>

    <section class="section section--carbs">
      <h2 class="rubric">Carbohydrate</h2>
      <p class="estimate estimate--minor">
        <b>${food.perHour.low}&ndash;${food.perHour.high}</b>
        <span>grams per hour, <i>${food.total.low}&ndash;${food.total.high} g</i> over the race</span>
      </p>
      <p class="note">${food.note}.<br><cite>${food.source}</cite></p>
    </section>

    ${drawPocket(legs, loaded.name, total, total > VALIDATED_HOURS * 3600)}

    <section class="section">
      <h2 class="rubric">What this plan does not include</h2>
      <div class="matter">
        ${MISSING.map((m) => `<dl><dt>${m.what}</dt><dd>${m.why}</dd></dl>`).join('')}
      </div>
    </section>

    <section class="section">
      <h2 class="rubric">Sources</h2>
      <div class="matter">
        ${SOURCES.map((s) => `<dl><dd>${s.claim}<cite>${s.reference}</cite></dd></dl>`).join('')}
      </div>
      <p class="note">This is not medical advice.</p>
    </section>
  </div>`;

  // The line draws itself once, and only the browser knows how long it is.
  const line = $('plan').querySelector<SVGPathElement>('.band-line');
  if (line) line.style.setProperty('--len', String(Math.ceil(line.getTotalLength())));
}

export function start() {
  const input = document.getElementById('file') as HTMLInputElement;
  $('drop').addEventListener('click', () => input.click());
  input.addEventListener('change', () => {
    if (input.files?.[0]) void onFile(input.files[0]);
  });

  // The whole sheet takes a file, because a drop target the size of a button is
  // a target you miss.
  for (const event of ['dragover', 'dragenter']) {
    document.addEventListener(event, (e) => {
      e.preventDefault();
      $('drop').classList.add('over');
    });
  }
  for (const event of ['dragleave', 'dragend']) {
    document.addEventListener(event, () => $('drop').classList.remove('over'));
  }
  document.addEventListener('drop', (e) => {
    e.preventDefault();
    $('drop').classList.remove('over');
    const file = (e as DragEvent).dataTransfer?.files?.[0];
    if (file) void onFile(file);
  });

  for (const id of ['pace', 'aid', 'known']) {
    $(id).addEventListener('input', render);
  }

  // The document is rebuilt on every render, so its listeners live on the parent.
  $('plan').addEventListener('click', (e) => {
    const target = e.target as HTMLElement;
    const chosen = target.closest<HTMLElement>('[data-reading]');
    if (chosen) {
      reading = chosen.dataset.reading as Reading;
      render();
      return;
    }
    if (target.closest('#card')) window.print();
  });
}

start();
