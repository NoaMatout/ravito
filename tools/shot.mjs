/** Screenshot the page at a true device width, through the DevTools protocol.
 *
 *  Chrome's --window-size will not go below about 500 px, and an iframe sized
 *  to a phone is not composited into a headless capture. Both produce a picture
 *  that looks like a phone and proves nothing, which is worse than no picture:
 *  the first version of this file reported a broken mobile layout that did not
 *  exist. Device metrics over the protocol are the only reading that holds.
 *
 *  Usage, with a page served on :8123 and Chrome started with
 *  --headless=new --remote-debugging-port=9222 :
 *
 *      node tools/shot.mjs 390 mobile.png [gradient]
 *
 *  It prints the viewport width, the document's scroll width and its height.
 *  A scroll width larger than the viewport is a horizontal overflow, which is
 *  the one responsive fault a screenshot never shows you.
 */
import { writeFileSync } from 'node:fs';

const [, , widthArg, out, reading = ''] = process.argv;
const width = Number(widthArg);
const port = 9222;

const targets = await (await fetch(`http://127.0.0.1:${port}/json/new?about:blank`, { method: 'PUT' })).json();
const ws = new WebSocket(targets.webSocketDebuggerUrl);
await new Promise((r) => (ws.onopen = r));

let id = 0;
const pending = new Map();
ws.onmessage = (e) => {
  const m = JSON.parse(e.data);
  if (m.id && pending.has(m.id)) pending.get(m.id)(m.result ?? m.error);
};
const send = (method, params = {}) =>
  new Promise((res) => {
    const n = ++id;
    pending.set(n, res);
    ws.send(JSON.stringify({ id: n, method, params }));
  });

await send('Emulation.setDeviceMetricsOverride', {
  width,
  height: 900,
  deviceScaleFactor: 2,
  mobile: width < 600,
});
await send('Page.enable');
await send('Page.navigate', { url: `http://localhost:8123/index.html?t=${Date.now()}` });
await new Promise((r) => setTimeout(r, 1500));

const load = `(async () => {
  const res = await fetch('./utmb_174km_universal.gpx');
  const dt = new DataTransfer();
  dt.items.add(new File([await res.blob()], 'utmb_174km_universal.gpx'));
  const i = document.getElementById('file');
  i.files = dt.files;
  i.dispatchEvent(new Event('change'));
  for (let n = 0; n < 100 && !document.querySelector('.plan'); n++)
    await new Promise((r) => setTimeout(r, 50));
  ${reading ? `document.querySelector('[data-reading="${reading}"]').click();` : ''}
  await new Promise((r) => setTimeout(r, 600));
  const d = document.documentElement;
  return JSON.stringify({ w: d.clientWidth, scroll: d.scrollWidth, h: d.scrollHeight });
})()`;
const r = await send('Runtime.evaluate', { expression: load, awaitPromise: true, returnByValue: true });
const info = JSON.parse(r.result.value);
console.log(`${out}: viewport ${info.w}  scrollWidth ${info.scroll}  height ${info.h}` +
  (info.scroll > info.w ? '  << DEBORDE' : ''));

const shot = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true });
writeFileSync(out, Buffer.from(shot.data, 'base64'));
ws.close();
process.exit(0);
