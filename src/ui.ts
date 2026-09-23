/** The only module that touches the document. It calculates nothing. */

import { parse, parseWaypoints, locateOnTrack, GpxError, type Point } from './gpx.js';
import { smooth, relief } from './elevation.js';
import { segment, type Segment } from './segments.js';
import { DEFAULT_TERRAIN, calibrate } from './pace.js';
import { build, durationOf, longestLeg } from './plan.js';
import { needs, MISSING } from './nutrition.js';
import { SOURCES } from './sources.js';
import * as profile from './profile.js';

type State = {
  points: Point[];
  segments: Segment[];
  name: string;
  stations: { name: string; distanceM: number }[];
} | null;
let loaded: State = null;

/** Beyond this, the model is extrapolating well past anything it was
 *  checked against, and the page says so instead of answering confidently. */
const VALIDATED_HOURS = 6;

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

function say(message: string, kind: 'error' | 'note' = 'error') {
  $('message').textContent = message;
  $('message').className = kind;
}

async function onFile(file: File) {
  try {
    const text = await file.text();
    const points = smooth(parse(text));
    const stations = locateOnTrack(points, parseWaypoints(text));
    loaded = { points, segments: segment(points), name: file.name, stations };
    const { ascent, descent } = relief(points);
    $('course').innerHTML =
      `<strong>${file.name}</strong> · ${km(points[points.length - 1].distance)}` +
      ` · D+ ${Math.round(ascent)} m · D- ${Math.round(descent)} m` +
      (stations.length
        ? ` · <strong>${stations.length} aid stations read from the file</strong>`
        : '');
    say('', 'note');
    render();
  } catch (e) {
    loaded = null;
    $('course').textContent = '';
    say(e instanceof GpxError ? e.message : 'this file could not be read as GPX');
  }
}

function render() {
  if (!loaded) return;
  const speed = paceToSpeed(value('pace'));
  if (speed === null) {
    say('give a flat road pace between 2:30 and 15:00 per kilometre, like 5:40');
    $('plan').innerHTML = '';
    return;
  }

  let factor = 1;
  let calibrationNote = 'terrain factor: default, measured on one runner and one course';
  const known = paceToSpeed(value('pace'));
  const actual = /^(\d{1,2})h(\d{1,2})$/.exec(value('known'));
  if (actual && known) {
    const seconds = Number(actual[1]) * 3600 + Number(actual[2]) * 60;
    factor = calibrate(loaded.segments, known, seconds);
    calibrationNote = `terrain factor: ${factor.toFixed(2)}, measured from the time you gave`;
  }

  // Typed kilometres win over the file: the runner has the road-book, and a
  // file's waypoints sometimes describe something other than a stand.
  const typed = value('aid')
    .split(/[,;\s]+/)
    .filter(Boolean)
    .map((s) => ({ distanceM: Number(s.replace(',', '.')) * 1000 }))
    .filter((a) => Number.isFinite(a.distanceM));
  const stations = typed.length ? typed : loaded.stations;

  const legs = build(loaded.segments, stations, speed, DEFAULT_TERRAIN, factor);
  const total = durationOf(loaded.segments, speed, DEFAULT_TERRAIN, factor);
  const low = total * 0.9;
  const high = total * 1.15;
  const food = needs(total);
  const worst = longestLeg(legs);

  const shape = profile.build(loaded.points, stations.every((s) => 'name' in s)
    ? (stations as { name: string; distanceM: number }[])
    : []);
  const svg = `
    <svg class="profile" viewBox="0 0 ${profile.VIEW_WIDTH} ${profile.VIEW_HEIGHT}"
         preserveAspectRatio="none" role="img"
         aria-label="${profile.describe(shape)}">
      <path class="profile-area" d="${shape.area}"/>
      <path class="profile-line" d="${shape.line}"/>
      ${shape.markers
        .map(
          (m) => `<line class="profile-mark" x1="${m.x.toFixed(1)}" y1="0"
                        x2="${m.x.toFixed(1)}" y2="${profile.VIEW_HEIGHT}"/>
                  <circle class="profile-dot" cx="${m.x.toFixed(1)}" cy="${m.y.toFixed(1)}" r="5"/>`,
        )
        .join('')}
    </svg>
    <p class="note">${Math.round(shape.lowest)} m at the lowest point,
       ${Math.round(shape.highest)} m at the highest.
       ${shape.markers.length ? 'Marks are the aid stations.' : ''}</p>`;

  const rows = legs
    .map(
      (l) => `<tr>
        <td>${l.label}</td>
        <td class="n">${km(l.toM)}</td>
        <td class="n">${hhmm(l.seconds)}</td>
        <td class="n">${Math.round(l.ascent)} m</td>
        <td class="n">${l.carbsLow} to ${l.carbsHigh} g</td>
        <td class="n">${hhmm(l.cumulativeSeconds)}</td>
      </tr>`,
    )
    .join('');

  $('plan').innerHTML = `
    <h2>Estimate</h2>
    <p class="big">${hhmm(total)}<span class="range">, between ${hhmm(low)} and ${hhmm(high)}</span></p>
    <p class="note">${calibrationNote}. The range is wide because it covers something
      this tool has not measured about you.</p>
    ${total > VALIDATED_HOURS * 3600 ? `<p class="warn"><strong>Beyond this tool's
      validated range.</strong> The terrain profile was measured on a race of under
      three hours, and there is no fatigue term in the model. Over
      ${Math.round(total / 3600)} hours, fatigue is what decides the finish time, so
      read this as a floor rather than as a prediction.</p>` : ''}

    <h2>Profile</h2>
    ${svg}

    <h2>Carry, leg by leg</h2>
    <div class="scroll" tabindex="0" role="region" aria-label="Carry, leg by leg">
      <table>
        <thead><tr><th>leg</th><th>to</th><th>time</th><th>D+</th>
          <th>carbohydrate</th><th>elapsed</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
    ${worst ? `<p class="note">Longest leg: ${worst.label}, ${hhmm(worst.seconds)}.
      That is the one that decides your pack and flask capacity.</p>` : ''}

    <h2>Carbohydrate</h2>
    <p>${food.perHour.low} to ${food.perHour.high} g per hour,
       ${food.total.low} to ${food.total.high} g over the race.</p>
    <p class="note">${food.note}.<br>${food.source}</p>

    <h2>What this plan does not include</h2>
    <ul class="note">
      ${MISSING.map((m) => `<li><strong>${m.what}</strong>: ${m.why}</li>`).join('')}
    </ul>

    <h2>Sources</h2>
    <ul class="note">${SOURCES.map((s) => `<li>${s.claim}<br><em>${s.reference}</em></li>`).join('')}</ul>
    <p class="note">This is not medical advice.</p>`;
}

export function start() {
  const drop = $('drop');
  const input = document.getElementById('file') as HTMLInputElement;
  drop.addEventListener('click', () => input.click());
  input.addEventListener('change', () => {
    if (input.files?.[0]) void onFile(input.files[0]);
  });
  for (const event of ['dragover', 'dragenter']) {
    drop.addEventListener(event, (e) => {
      e.preventDefault();
      drop.classList.add('over');
    });
  }
  for (const event of ['dragleave', 'drop']) {
    drop.addEventListener(event, () => drop.classList.remove('over'));
  }
  drop.addEventListener('drop', (e) => {
    e.preventDefault();
    const file = (e as DragEvent).dataTransfer?.files?.[0];
    if (file) void onFile(file);
  });
  for (const id of ['pace', 'aid', 'known']) {
    $(id).addEventListener('input', render);
  }
}

start();
