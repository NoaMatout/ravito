/** Capture the page at a true device width, through the DevTools protocol.
 *
 *  Chrome's --window-size will not go below about 500 px, and an iframe sized
 *  to a phone is not composited into a headless capture. Both produce a picture
 *  that looks like a phone and proves nothing, which is worse than no picture:
 *  an early version of this file reported a broken mobile layout that did not
 *  exist. Device metrics over the protocol are the only reading that holds.
 *
 *  Every capture loads the same file by the same path, so that two captures of
 *  one build are comparable. A screenshot taken by a one-off script with a
 *  different filename is a staged capture, not evidence.
 *
 *  Usage, with the site served on :8123 and Chrome started with
 *  --headless=new --remote-debugging-port=9222 :
 *
 *      node tools/shot.mjs <width> <out.png> [options]
 *        --reading=gradient|roughness   select a reading before capturing
 *        --light                        emulate prefers-color-scheme: light
 *        --empty                        capture the blank booklet, no file
 *        --print                        emulate print media and write a PDF
 *        --focus=<n>                    open the nth aid station's slip
 *        --set=<id>:<value>;...         fill input fields before capturing.
 *                                       Pairs split on ';' because a value may
 *                                       itself contain commas.
 *        --url=<href>                   capture a deployed page instead of the
 *                                       local one; implies --empty, since the
 *                                       race file is not published
 *
 *  It prints the viewport width, the document's scroll width, its height, and
 *  any text whose contrast against its painted background falls under WCAG AA.
 *  A scroll width larger than the viewport is a horizontal overflow, which is
 *  the one responsive fault a screenshot never shows you; contrast is the other
 *  one, because a capture you are looking at always seems readable to you.
 */
import { writeFileSync } from 'node:fs';

const args = process.argv.slice(2);
const flag = (name) => args.some((a) => a === `--${name}`);
const opt = (name) => args.find((a) => a.startsWith(`--${name}=`))?.split('=')[1] ?? '';
const [widthArg, out] = args.filter((a) => !a.startsWith('--'));
const width = Number(widthArg);

const target = await (
  await fetch('http://127.0.0.1:9222/json/new?about:blank', { method: 'PUT' })
).json();
const ws = new WebSocket(target.webSocketDebuggerUrl);
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
// A headless document reports no focus, so :focus never matches and anything
// that opens on focus photographs as absent. This is the switch that makes a
// capture of a focused state mean something.
if (opt('focus')) await send('Emulation.setFocusEmulationEnabled', { enabled: true });

const media = [];
if (flag('light')) media.push({ name: 'prefers-color-scheme', value: 'light' });
if (media.length) await send('Emulation.setEmulatedMedia', { features: media });
await send('Page.enable');
const page = opt('url') || 'http://localhost:8123/index.html';
await send('Network.enable');
// Le HTML porte un parametre anti-cache, pas la feuille de style : sans ca,
// une correction CSS se mesure sur l'ancienne version et le defaut survit.
await send('Network.setCacheDisabled', { cacheDisabled: true });
await send('Page.navigate', { url: `${page}${page.includes('?') ? '&' : '?'}t=${Date.now()}` });
await new Promise((r) => setTimeout(r, opt('url') ? 3500 : 1500));

const reading = opt('reading');
const load = flag('empty') || opt('url')
  ? `(async () => {
       await new Promise((r) => setTimeout(r, 400));
       return report();
     })()`
  : `(async () => {
       const res = await fetch('./utmb_174km_universal.gpx');
       const dt = new DataTransfer();
       dt.items.add(new File([await res.blob()], 'utmb_174km_universal.gpx'));
       const i = document.getElementById('file');
       i.files = dt.files;
       i.dispatchEvent(new Event('change'));
       for (let n = 0; n < 100 && !document.querySelector('.plan'); n++)
         await new Promise((r) => setTimeout(r, 50));
       ${
         opt('set')
           ? opt('set')
               .split(';')
               .map((pair) => {
                 const [id, ...rest] = pair.split(':');
                 return `{const e=document.getElementById('${id}');e.value=${JSON.stringify(rest.join(':'))};e.dispatchEvent(new Event('input',{bubbles:true}));}`;
               })
               .join('')
           : ''
       }
       ${reading ? `document.querySelector('[data-reading="${reading}"]').click();` : ''}
       ${opt('focus') ? `document.querySelectorAll('.stop')[${Number(opt('focus')) - 1}].focus();` : ''}
       await new Promise((r) => setTimeout(r, 700));
       return report();
     })()`;

// Contrast is measured on the rendered page rather than read off the
// stylesheet, because opacity, inheritance and a parent's background decide it
// and none of them are visible in the source.
const report = `
  const lum = (c) => { const [r, g, b] = c.match(/[\\d.]+/g).slice(0, 3).map(Number)
    .map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
  const bgOf = (e) => { for (let n = e; n; n = n.parentElement) {
      const b = getComputedStyle(n).backgroundColor;
      if (b && !/rgba\\(0, 0, 0, 0\\)/.test(b)) return b; } return 'rgb(255,255,255)'; };
  const report = () => {
    const d = document.documentElement;
    const bad = [];
    for (const e of document.body.querySelectorAll('*')) {
      if (![...e.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim())) continue;
      const s = getComputedStyle(e);
      if (s.visibility === 'hidden' || s.display === 'none') continue;
      const a = lum(s.color), b = lum(bgOf(e));
      const ratio = ((Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05)) * Number(s.opacity);
      const size = parseFloat(s.fontSize);
      const big = size >= 24 || (size >= 18.66 && Number(s.fontWeight) >= 700);
      if (ratio < (big ? 3 : 4.5))
        bad.push(e.tagName + '.' + (typeof e.className === 'string' ? e.className : '') +
          '=' + ratio.toFixed(2));
    }
    return JSON.stringify({ w: d.clientWidth, scroll: d.scrollWidth, h: d.scrollHeight,
      contrast: [...new Set(bad)] });
  };
`;

const r = await send('Runtime.evaluate', { expression: report + load, awaitPromise: true, returnByValue: true });
const info = JSON.parse(r.result.value);
console.log(
  `${out}: viewport ${info.w}  scrollWidth ${info.scroll}  height ${info.h}` +
    (info.scroll > info.w ? '  << OVERFLOWS' : '') +
    (info.contrast.length ? `  << CONTRAST ${info.contrast.join(' ')}` : '  contrast ok'),
);

if (flag('print')) {
  await send('Emulation.setEmulatedMedia', { media: 'print', features: media });
  await new Promise((r) => setTimeout(r, 300));
  const pdf = await send('Page.printToPDF', {
    printBackground: true,
    paperWidth: 8.27,
    paperHeight: 11.69,
    marginTop: 0.5,
    marginBottom: 0.5,
    marginLeft: 0.5,
    marginRight: 0.5,
  });
  writeFileSync(out, Buffer.from(pdf.data, 'base64'));
} else {
  const shot = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true });
  writeFileSync(out, Buffer.from(shot.data, 'base64'));
}
ws.close();
process.exit(0);
