// viz-term chart frame: shared helpers for every non-graph chart kind. Only chart modules import this file.
//
// RENDERER CONTRACT (for timing, gantt, waits, board, causes, retries, hist, stock, sankey writers)
// A chart is one file, charts/<kind>.ts, whose default export is a `Chart` (types in ./index.ts):
//   init(section, ctx) -> state           per-open state; selection, scroll offset, folds. Plain data, no DOM.
//   render(p, section, state, dims, ctx)  -> View (graph.ts): title, hint, answer, body rows, scroll row, legend,
//                                            details (DETAIL_ROWS rows), footer, bodyRows. Pure; read only the parsed
//                                            section model (no DOM, no layout). Build it with `frameView` below.
//   key?(section, state, {name, sequence}, dims) -> boolean   j/k/up/down etc.; return true to redraw.
// Register it with ONE lazy line in the LOADERS table in charts/index.ts: `kind: () => import("./kind")` (key
// `kind:view` when a view needs its own renderer). Never import a chart module statically (main.ts included): the
// registry loads it only when a section of that kind is opened or dumped, so graph-only files load no chart code.
// Do not edit main.ts. Rows are Chunk[]; every row must fit the card: use `fitRow` (truncate with …, never wrap),
// `chartSize(dims)` for width and bodyRows, `followTop` + `frameView` to scroll/clip the body, `scale`/`axis` to map
// a value to a column, `barRun` for █▌ bars, `legendRow` for the legend. Colour from the Palette only
// (p.cat[0..4], p.good, p.bad, p.accent, p.gray, p.text); ask for a new colour instead of hard-coding one.
import { bold, fg } from "@opentui/core";
import { DETAIL_ROWS, FIXED_ROWS, cardWidth } from "../graph";
import type { Dims, View } from "../graph";
import { accent, keybar, label, plain, value, type Chunk, type Palette } from "../style";

export { DETAIL_ROWS };

// Cells available inside the card: width after border and padding, body rows after the fixed chrome.
export const chartSize = (dims: Dims) => ({ width: cardWidth(dims) - 4, bodyRows: Math.max(4, dims.height - FIXED_ROWS) });

export const rowWidth = (row: Chunk[]) => row.reduce((n, c) => n + c.text.length, 0);

// Truncate a row to `width` cells, ending in … when something was cut. Styles are kept on the chunks that survive.
export function fitRow(row: Chunk[], width: number): Chunk[] {
  if (width <= 0) return [];
  if (rowWidth(row) <= width) return row;
  const out: Chunk[] = [];
  let left = width - 1;
  for (const c of row) {
    if (left <= 0) break;
    out.push(c.text.length <= left ? c : { ...c, text: c.text.slice(0, left) });
    left -= c.text.length;
  }
  out.push({ ...out[out.length - 1], text: "…" });             // the ellipsis wears the style of what it cut
  return out;
}
export const padRow = (row: Chunk[], width: number, p: Palette): Chunk[] => {
  const fit = fitRow(row, width), n = width - rowWidth(fit);
  return n > 0 ? [...fit, plain(p, " ".repeat(n))] : fit;
};

// value -> column in [0, cols-1]; lo..hi is the domain. A flat domain maps to column 0.
export function scale(lo: number, hi: number, cols: number): (v: number) => number {
  const span = hi - lo;
  return (v) => (span <= 0 || cols <= 1 ? 0 : Math.max(0, Math.min(cols - 1, Math.round(((v - lo) / span) * (cols - 1)))));
}

// A horizontal axis: tick labels at evenly spaced columns over `cols` cells, as one string.
export function axis(lo: number, hi: number, cols: number, fmt: (v: number) => string = (v) => String(+v.toFixed(2)), ticks = 5): string {
  const at = scale(lo, hi, cols), cells = Array<string>(cols).fill(" ");
  let end = -1;
  for (let i = 0; i < ticks; i++) {
    const v = lo + ((hi - lo) * i) / (ticks - 1), t = fmt(v);
    const c = Math.min(at(v), Math.max(0, cols - t.length));
    if (c <= end) continue;                                      // no room: skip this tick, never overlap
    [...t].forEach((ch, j) => (cells[c + j] = ch)); end = c + t.length;
  }
  return cells.join("");
}

// A bar `cells` wide (fractional): whole cells are █, a half or more of the last cell is ▌.
export function barRun(cells: number): string {
  const whole = Math.floor(Math.max(0, cells)), half = cells - whole >= 0.5 ? "▌" : "";
  return "█".repeat(whole) + half;
}

// Legend: [glyph, colour, word]; colours are palette values. Items that do not fit become "+N more".
export function legendRow(p: Palette, items: [glyph: string, color: string, word: string][], width: number): Chunk[] {
  const out: Chunk[] = [];
  let used = 0, shown = 0;
  for (const [g, c, w] of items) {
    const n = (shown ? 2 : 0) + g.length + 1 + w.length;
    if (used + n > width - 10 && shown < items.length) break;
    if (shown) out.push(plain(p, "  "));
    out.push(fg(c)(g), label(p, ` ${w}`)); used += n; shown++;
  }
  if (shown < items.length) out.push(label(p, `  +${items.length - shown} more`));
  return out;
}

// Keep row `sel` inside the window [top, top + bodyRows); returns the new top.
export function followTop(sel: number, top: number, bodyRows: number, total: number): number {
  if (sel < top) top = sel;
  else if (sel >= top + bodyRows) top = sel - bodyRows + 1;
  return Math.max(0, Math.min(Math.max(0, total - bodyRows), top));
}

// The View every chart returns: clip body rows to the window, fit each to the width, pad to bodyRows, and add the
// scroll row ("rows a-b of N", gray, same as graph view; a hint replaces it when set).
export type Frame = {
  title: string; answer: Chunk[]; rows: Chunk[][]; top: number; legend: Chunk[]; details: Chunk[][];
  keys: [string, string][]; hint?: string; viewName: string;
};
export function frameView(p: Palette, f: Frame, dims: Dims, at: { n: number; of: number }): View {
  const { width, bodyRows } = chartSize(dims);
  const body = f.rows.slice(f.top, f.top + bodyRows).map((r) => fitRow(r, width));
  while (body.length < bodyRows) body.push([plain(p, "")]);
  const clipped = f.rows.length > bodyRows;
  const where = `rows ${f.top + 1}-${Math.min(f.rows.length, f.top + bodyRows)} of ${f.rows.length}`;
  const details = f.details.slice(0, DETAIL_ROWS).map((r) => fitRow(r, width));
  while (details.length < DETAIL_ROWS) details.push([]);
  return {
    // the title gives way to the hint on a narrow card, keeping a space between them
    title: fitRow([value(p, f.title)], Math.max(1, width - `${f.viewName} · ${at.n}/${at.of}`.length - 1)), hint: [accent(p, `${f.viewName} · ${at.n}/${at.of}`)],
    answer: fitRow(f.answer, width), body, scroll: [label(p, f.hint || (clipped ? where : ""))],
    legend: fitRow(f.legend, width), details, footer: keybar(p, "viz", [...f.keys, ["[ ]", "section"], ["q", "quit"]]), bodyRows,
  };
}

// ---- per-cell painting and time-axis helpers shared by timing, gantt and retries ----------------------------------
export type Cell = { ch: string; c: string; b?: boolean };
export const fmt = (v: number) => (Number.isInteger(v) ? String(v) : String(+v.toFixed(Math.abs(v) >= 10 ? 0 : 2)));
// Round the domain end up so `ticks` evenly spaced axis labels land on round numbers.
export const niceHi = (lo: number, hi: number, ticks = 5) => {
  const raw = (hi - lo) / (ticks - 1), pow = 10 ** Math.floor(Math.log10(raw || 1)), f = raw / pow;
  const step = (f <= 1 ? 1 : f <= 2 ? 2 : f <= 2.5 ? 2.5 : f <= 5 ? 5 : 10) * pow;
  return lo + step * (ticks - 1);
};
export const tone = (p: Palette, t: string) => (t === "ok" ? p.good : t === "fail" ? p.bad : t === "warn" ? p.cat[4] : t === "unk" ? p.gray : p.cat[0]);
export const paint = (cells: Cell[], col: number, s: string, c: string, b?: boolean) =>
  [...s].forEach((ch, i) => { if (col + i >= 0 && col + i < cells.length) cells[col + i] = { ch, c, b }; });
export function chunksOf(p: Palette, cells: Cell[]): Chunk[] {
  const out: Chunk[] = [];
  for (let i = 0; i < cells.length;) {
    let j = i; while (j < cells.length && cells[j].c === cells[i].c && !!cells[j].b === !!cells[i].b) j++;
    const text = cells.slice(i, j).map((x) => x.ch).join(""), c = cells[i].c;
    out.push(!c ? plain(p, text) : cells[i].b ? bold(fg(c)(text)) : fg(c)(text)); i = j;
  }
  return out;
}
