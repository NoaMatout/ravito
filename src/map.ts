/** The map, loaded only if the runner asks for it.
 *
 * Everything else in this tool runs without a single request after the page
 * loads, and the page says so. A map cannot keep that promise: tiles come from
 * a server, and the tiles a browser asks for describe the area they cover. The
 * GPX file never leaves the machine, but the whereabouts of the course can be
 * inferred from the requests. That is a property of the protocol, not of the
 * provider's policy, so the interface states it rather than pointing at a
 * privacy page.
 *
 * Nothing here is fetched, parsed or executed while the box is unchecked: the
 * library is imported on demand, inside `show`.
 */

import type { Point } from './gpx.js';

const LIBRARY = 'https://cdn.jsdelivr.net/npm/maplibre-gl@5/+esm';
const STYLESHEET = 'https://cdn.jsdelivr.net/npm/maplibre-gl@5/dist/maplibre-gl.css';
const STYLE = 'https://tiles.openfreemap.org/styles/positron';

/** Enough shape to read, few enough to send. */
const DRAWN_POINTS = 1500;

export const DISCLOSURE =
  'Showing the map requests map tiles from OpenFreeMap and the maplibre-gl ' +
  'library, about 800 kB, from a CDN. Your file is still not uploaded, but the ' +
  'tiles a browser asks for describe the area they cover, so the whereabouts of ' +
  'the course can be inferred from those requests. Nothing is fetched while this ' +
  'box is unchecked.';

function thin(points: readonly Point[]): [number, number][] {
  const step = Math.max(1, Math.ceil(points.length / DRAWN_POINTS));
  const out: [number, number][] = [];
  for (let i = 0; i < points.length; i += step) out.push([points[i].lon, points[i].lat]);
  const last = points[points.length - 1];
  out.push([last.lon, last.lat]);
  return out;
}

function bounds(line: readonly [number, number][]): [[number, number], [number, number]] {
  let west = line[0][0];
  let east = line[0][0];
  let south = line[0][1];
  let north = line[0][1];
  for (const [lon, lat] of line) {
    west = Math.min(west, lon);
    east = Math.max(east, lon);
    south = Math.min(south, lat);
    north = Math.max(north, lat);
  }
  return [
    [west, south],
    [east, north],
  ];
}

let instance: { remove(): void } | null = null;

/** Tear the map down and stop every request it was making. */
export function hide(container: HTMLElement): void {
  instance?.remove();
  instance = null;
  container.innerHTML = '';
  container.classList.remove('map--on');
}

export async function show(
  container: HTMLElement,
  points: readonly Point[],
  colour: string,
): Promise<void> {
  hide(container);
  if (points.length < 2) return;

  // La hauteur est posee AVANT la construction : maplibre mesure son
  // conteneur une fois, et une carte construite sur zero pixel ne se
  // redimensionne jamais d'elle-meme. Une regle conditionnee au contenu
  // arrivait apres, donc trop tard.
  container.classList.add('map--on');

  if (!document.querySelector(`link[href="${STYLESHEET}"]`)) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = STYLESHEET;
    document.head.append(link);
  }

  // Le paquet publie sur ce CDN n'expose qu'un export par defaut : lire
  // `Map` sur l'espace de noms donne undefined, sans erreur, et la carte ne
  // se dessine simplement jamais.
  const loadedModule: Record<string, unknown> = await import(/* @vite-ignore */ LIBRARY);
  const maplibre = (loadedModule.default ?? loadedModule) as {
    Map: new (options: Record<string, unknown>) => any;
  };
  const line = thin(points);
  const map = new maplibre.Map({
    container,
    style: STYLE,
    bounds: bounds(line),
    fitBoundsOptions: { padding: 36 },
    attributionControl: { compact: false },
  });
  instance = map;

  map.on('load', () => {
    map.addSource('track', {
      type: 'geojson',
      data: { type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: line } },
    });
    map.addLayer({
      id: 'track-halo',
      type: 'line',
      source: 'track',
      paint: { 'line-color': '#ffffff', 'line-width': 6, 'line-opacity': 0.8 },
      layout: { 'line-join': 'round', 'line-cap': 'round' },
    });
    map.addLayer({
      id: 'track',
      type: 'line',
      source: 'track',
      paint: { 'line-color': colour, 'line-width': 2.5 },
      layout: { 'line-join': 'round', 'line-cap': 'round' },
    });
  });
}
