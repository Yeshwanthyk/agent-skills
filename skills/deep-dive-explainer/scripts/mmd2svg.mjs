#!/usr/bin/env node
// Render a Mermaid .mmd file to a standalone SVG with Pele (https://pele.run), no browser needed.
//   node mmd2svg.mjs diagrams/call.mmd diagrams/call.svg
// Pele is fetched once from jsDelivr at a pinned version and cached under ~/.cache/pele.
// Colors match reading.css, since the article shows the SVG as an image that page CSS cannot reach.
import { mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

const VERSION = '1.9.0';
const [input, output] = process.argv.slice(2);
if (!input || !output) {
  console.error('usage: node mmd2svg.mjs <in.mmd> <out.svg>');
  process.exit(2);
}
const dir = join(homedir(), '.cache', 'pele', VERSION);
const lib = join(dir, 'pele.js');
if (!existsSync(lib)) {
  const res = await fetch(`https://cdn.jsdelivr.net/npm/pele@${VERSION}/dist/pele.js`);
  if (!res.ok) throw new Error(`pele download failed: ${res.status}`);
  mkdirSync(dir, { recursive: true });
  writeFileSync(lib, await res.text());
}
const { render } = await import(pathToFileURL(lib).href);
// A <style> inside the SVG still applies in an image context, including the print media query.
const css = '<style>.pele{--pele-bg:transparent;--pele-fg:#e8e8e8;--pele-muted:#b3b3b3;--pele-line:#b3b3b3;' +
  '--pele-surface:#2a2a2a;--pele-surface-alt:#333;--pele-border:#626262}' +
  '@media print{.pele{--pele-fg:#000;--pele-muted:#444;--pele-line:#444;--pele-surface:#f3f3f3;' +
  '--pele-surface-alt:#e6e6e6;--pele-border:#888}}</style>';
let svg;
try {
  ({ svg } = render(readFileSync(input, 'utf8'), { responsive: false }));
} catch (e) {
  console.error(`${input}: ${e.message}`);
  process.exit(1);
}
writeFileSync(output, svg.replace(/(<svg[^>]*>)/, `$1${css}`));
