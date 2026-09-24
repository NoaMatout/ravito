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
import * as drink from './drink.js';
import * as carte from './map.js';
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

/** Minutes past midnight, or null when the field is empty or malformed. */
function startMinutes(text: string): number | null {
  const m = /^(\d{1,2})[:h.]?(\d{2})$/.exec(text);
  if (!m) return null;
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (h > 23 || min > 59) return null;
  return h * 60 + min;
}

/** A clock time, with the day marked when the race runs past midnight. A
 *  26 hour race finishes on a different day, and a plan that hides that is
 *  worse than one that never gave a clock at all. */
function clock(startMin: number, elapsedSeconds: number): string {
  const total = startMin + elapsedSeconds / 60;
  const day = Math.floor(total / 1440);
  const hh = Math.floor((total % 1440) / 60);
  const mm = Math.round(total % 60);
  const label = `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
  return day > 0 ? `${label}<sup>+${day}</sup>` : label;
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
function drawBand(
  shape: profile.Profile,
  course: string,
  legs: readonly Leg[],
  rules: readonly { value: number; top: number }[],
): string {
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

      // Matched by position: an organiser's waypoint and the leg it closes do
      // not always carry the same spelling.
      const leg = legs.reduce((best, l) =>
        Math.abs(l.toM - m.distanceM) < Math.abs(best.toM - m.distanceM) ? l : best,
      );
      const n = legs.indexOf(leg) + 1;
      const spoken =
        `R${n}, ${m.name}, at ${km(m.distanceM)}, reached in ${hhmm(leg.cumulativeSeconds)}. ` +
        `The leg into it takes ${hhmm(leg.seconds)}, climbs ${Math.round(leg.ascent)} metres, ` +
        `and asks for ${leg.carbsLow} to ${leg.carbsHigh} grams of carbohydrate.`;

      // The slip is a sibling of the mark, not a child, so its edges are
      // clamped against the drawing rather than against an 18 px button: a
      // mark near either end would otherwise push the slip off the sheet.
      return `<button class="stop${at > 96 ? ' end' : ''}" type="button"
                style="left:${at}%" aria-label="${spoken}">
        <i aria-hidden="true"></i><u aria-hidden="true"></u>${room ? `<b aria-hidden="true">${n}</b>` : ''}
      </button><span class="card" aria-hidden="true" style="--at:${at}%">
        <b>R${n}</b><span class="who">${m.name}</span>
        <span class="where">${km(m.distanceM)} &middot; reached ${hhmm(leg.cumulativeSeconds)}</span>
        <span class="what">Leg ${hhmm(leg.seconds)} &middot; D+ ${Math.round(leg.ascent)} m
          &middot; ${leg.carbsLow}&ndash;${leg.carbsHigh} g</span>
      </span>`;
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

  const levels = rules
    .map(
      (l) =>
        `<span class="level" style="top:${l.top.toFixed(2)}%"><b>${Math.round(l.value)}</b></span>`,
    )
    .join('');

  return `
    <div class="band">
      <svg viewBox="0 0 ${profile.VIEW_WIDTH} ${profile.VIEW_HEIGHT}"
           preserveAspectRatio="none" role="img"
           aria-label="${course}. ${profile.describe(shape)}">
        <defs>${profile.hatchDefs()}</defs>
        ${slices}
        <path class="band-line" d="${shape.line}"/>
      </svg>
      <div class="levels" aria-hidden="true">${levels}</div>
      <div class="stops">${stops}</div>
    </div>
    <div class="ruler" aria-hidden="true">${ticks.join('')}</div>
    ${legend}`;
}

function drawPlan(legs: readonly Leg[], worst: Leg | null, startMin: number | null): string {
  const anyWater = legs.some((l) => l.water);
  const rows = legs
    .map(
      (l, i) => `<tr${l === worst ? ' class="longest"' : ''}>
        <td class="leg">R${i + 1}</td>
        <td class="name">${l.label}</td>
        <td class="drop-1">${km(l.toM)}</td>
        <td>${hhmm(l.seconds)}</td>
        <td class="drop-2">${Math.round(l.ascent)} m</td>
        <td${l.water ? ' class="water"' : ''}>${l.carbsLow}&ndash;${l.carbsHigh} g${
          l.water ? ' <abbr title="water only, no reload">w</abbr>' : ''
        }</td>
        ${anyWater ? `<td class="carry">${l.carryHigh} g</td>` : ''}
        <td class="drop-3">${
          startMin === null ? hhmm(l.cumulativeSeconds) : clock(startMin, l.cumulativeSeconds)
        }</td>
      </tr>`,
    )
    .join('');

  const longest = worst ? `R${legs.indexOf(worst) + 1}` : '';
  return `<p class="note">One row per leg between two aid stations.
  <span class="drop-1">From the start: <b>at km</b><span class="drop-3">,
    <b>${startMin === null ? 'elapsed' : 'arrive'}</b></span>.</span>
  For the leg alone: <b>time</b><span class="drop-2">, <b>D+</b></span>,
  <b>carbs</b>.${
    anyWater
      ? ` <b>Carry</b> is what to leave the previous full stand with: a stand
          marked <b>w</b> has water only, so the food for the leg after it
          travels on you.`
      : ''
  }${
    longest
      ? ` <b class="leg">${longest}</b> is the longest, and it is the leg that
          decides your pack and flask capacity.`
      : ''
  }</p>
  <div class="scroll" tabindex="0" role="region" aria-label="Carry, leg by leg">
    <table class="plan">
      <thead><tr>
        <th>leg</th><th>to</th><th class="drop-1">at km</th><th>time</th>
        <th class="drop-2">D+</th><th>carbs</th>
        ${anyWater ? '<th>carry</th>' : ''}
        <th class="drop-3">${startMin === null ? 'elapsed' : 'arrive'}</th>
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
  startMin: number | null,
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
      <h3>${name}<span>${
        startMin === null ? hhmm(total) : `${clock(startMin, 0)} &rarr; ${clock(startMin, total)}`
      }</span></h3>
      <p class="pocket-note">Between ${hhmm(total * 0.9)} and ${hhmm(total * 1.15)}.${
        beyond
          ? ' Outside this tool&rsquo;s validated range: no fatigue term, so read the time as a floor.'
          : ''
      }</p>
      <ol>${legs
        .map(
          (l, i) => `<li><b>R${i + 1}</b><span class="name">${l.label}</span>
            <u>${km(l.toM)}</u><u>${
              startMin === null ? hhmm(l.seconds) : clock(startMin, l.cumulativeSeconds)
            }</u><i>${l.carbsLow}&ndash;${l.carbsHigh} g</i></li>`,
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
    .map((s) => {
      // A kilometre followed by w is a stand that carries water and nothing
      // else. Compact enough to type, and it survives a copy and paste.
      const water = /w$/i.test(s);
      const km = Number(s.replace(/w$/i, '').replace(',', '.'));
      return { distanceM: km * 1000, water };
    })
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
  const startMin = startMinutes(value('start'));
  const flask = Math.min(3000, Math.max(100, Number(value('flask')) || 500));
  const rules = profile.levels(shape.lowest, shape.highest);
  const rulingM = rules.length > 1 ? Math.round(rules[1].value - rules[0].value) : 0;

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
      ${drawBand(shape, loaded.name, legs, rules)}
      <p class="note">${Math.round(shape.lowest)} m at the lowest point,
        ${Math.round(shape.highest)} m at the highest${
          rulingM ? `, ruled every ${rulingM} m` : ''
        }. ${current.note}</p>
    </section>

    <section class="section section--plan">
      <h2 class="rubric">Carry, leg by leg</h2>
      ${drawPlan(legs, worst, startMin)}
    </section>

    <section class="section section--carbs">
      <h2 class="rubric">Carbohydrate</h2>
      <p class="estimate estimate--minor">
        <b>${food.perHour.low}&ndash;${food.perHour.high}</b>
        <span>grams per hour, <i>${food.total.low}&ndash;${food.total.high} g</i> over the race</span>
      </p>
      <p class="note">${food.note}.<br><cite>${food.source}</cite></p>
    </section>

    ${drawPocket(legs, loaded.name, total, total > VALIDATED_HOURS * 3600, startMin)}

    <section class="section section--map" id="map-section" hidden>
      <h2 class="rubric">Where it runs</h2>
      <label class="choice"><input type="checkbox" id="map-on">
        <span>Show the course on a map</span></label>
      <p class="note" id="map-note"></p>
      <div id="map" class="map" aria-label="The course on a map"></div>
    </section>

    <section class="section section--drink">
      <h2 class="rubric">Mixing it yourself</h2>
      ${(() => {
        const d = drink.plan(food.perHour, food.total, flask);
        return `
        <p class="note">Table sugar is sucrose, which splits into equal parts glucose and
          fructose, so it feeds both transport pathways on its own. Measured oxidation does
          not differ from a glucose and fructose mixture.<br><cite>${d.source}</cite></p>
        <div class="scroll" tabindex="0" role="region" aria-label="Mixing it yourself">
        <table class="plan">
          <thead><tr><th>per hour</th><th>sugar</th><th>in ${flask} mL</th><th>verdict</th></tr></thead>
          <tbody>
            <tr><td class="leg">${food.perHour.low} g</td>
              <td>${drink.bottle(food.perHour.low, flask).grams} g</td>
              <td>${drink.bottle(food.perHour.low, flask).percent} %</td>
              <td>${drink.bottle(food.perHour.low, flask).comfortable ? 'empties normally' : 'above 8 %'}</td></tr>
            <tr><td class="leg">${food.perHour.high} g</td>
              <td>${d.perHour.grams} g</td>
              <td>${d.perHour.percent} %</td>
              <td>${d.perHour.comfortable ? 'empties normally' : 'above 8 %'}</td></tr>
          </tbody>
        </table></div>
        <p class="note">A ${flask} mL bottle carries <b>${d.carriablePerBottle} g</b> of
          carbohydrate before the drink passes 8 percent. Beyond that, gastric emptying slows
          and gut trouble becomes more likely, so ${
            d.asFood > 0
              ? `the remaining <b>${d.asFood} g per hour</b> travels as food, or the bottle is refilled more often`
              : 'the whole target fits in the bottle'
          }.<br><cite>${d.concentrationSource}</cite></p>
        <p class="note">Over this race, the carbohydrate target is
          <b>${(d.sugarForRace.low / 1000).toFixed(1)} to ${(d.sugarForRace.high / 1000).toFixed(1)} kg</b>
          of sugar. The recipe carries <b>no sodium figure</b>, for the reason given below:
          a commercial drink contains some, this one leaves that decision to you.</p>
        <p class="note">This is not medical advice, and a high carbohydrate intake is
          tolerated after gut training, not on the first attempt.</p>`;
      })()}
    </section>

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

  // The map section is revealed by script and never by the stylesheet: without
  // JavaScript the box would be a control that does nothing. The map itself is
  // wired once per render, but it is only built when the box is ticked, so no
  // request leaves the page until the runner asks for one.
  const section = document.getElementById('map-section');
  const box = document.getElementById('map-on') as HTMLInputElement | null;
  const target = document.getElementById('map');
  if (section && box && target) {
    section.hidden = false;
    (document.getElementById('map-note') as HTMLElement).textContent = carte.DISCLOSURE;
    try {
      box.checked = localStorage.getItem('ravito.map') === 'yes';
    } catch {
      // Private browsing and blocked site data both throw. The map stays off,
      // which is the safe default anyway.
    }
    const paint = () => {
      if (!loaded) return;
      const ink = getComputedStyle(document.body).getPropertyValue('--spot').trim() || '#1b5a41';
      if (box.checked) void carte.show(target, loaded.points, ink);
      else carte.hide(target);
      try {
        localStorage.setItem('ravito.map', box.checked ? 'yes' : 'no');
      } catch {
        // The preference is a convenience, not state the plan depends on.
      }
    };
    box.addEventListener('change', paint);
    paint();
  }
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

  for (const id of ['pace', 'aid', 'known', 'start', 'flask']) {
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
    if (target.closest('#card')) {
      window.print();
      return;
    }

    // Clicking the drawing adds a stand where the pointer is. The typed field
    // stays the single source of truth, so the addition is visible, editable
    // and reversible with the keyboard alone.
    const svg = target.closest<SVGSVGElement>('.band svg');
    if (!svg || target.closest('.stop') || !loaded) return;
    const box = svg.getBoundingClientRect();
    const share = ((e as MouseEvent).clientX - box.left) / box.width;
    if (share <= 0 || share >= 1) return;
    const atKm = (share * loaded.points[loaded.points.length - 1].distance) / 1000;

    const field = document.getElementById('aid') as HTMLInputElement;
    // Seeding matters: the first click would otherwise replace the stands the
    // file carries, because a typed list wins over the file.
    const seed =
      field.value.trim() === '' && loaded.stations.length
        ? loaded.stations.map((s) => (s.distanceM / 1000).toFixed(1)).join(', ')
        : field.value.trim();
    const parts = seed ? seed.split(/[,;\s]+/).filter(Boolean) : [];
    parts.push(atKm.toFixed(1));
    parts.sort((a, b) => parseFloat(a) - parseFloat(b));
    field.value = parts.join(', ');
    render();
  });
}

start();
