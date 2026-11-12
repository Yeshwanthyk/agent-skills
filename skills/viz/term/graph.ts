// One viz graph section as a thimble card: pure data (chunks per row), no renderer. main.ts puts it on screen.
import { bold, fg } from "@opentui/core";
import { drawGraph, type Cell, type Geometry, type Grid } from "./grid";
import { GLYPH, accent, keybar, label, legend, mark, pad, plain, ref, rich, value, type Chunk, type Palette } from "./style";

// The parts of the viz model this view reads (see skills/viz/assets/viz.js parse()).
export type VNode = {
  id: string; label: string; kind: string; ref: string; note: string; st: string;
  info: Record<string, string>; refs: [string, string][];
};
export type VEdge = { from: string; to: string; label: string; st: string };
export type VPath = { ids: string[]; edges: VEdge[]; narr: string; payload: string; fail: boolean };
export type VSection = {
  kind: string; view: string; name: string; nodes: VNode[]; edges: VEdge[]; byId: Record<string, VNode>;
  paths: VPath[]; steps: VPath[];
};
export type Doc = { title: string; sub: string; sections: VSection[] };

export type Side = "both" | "before" | "after";
export type State = { sel: string; step: number; side: Side; inspector: boolean; top: number; left: number; hint: string };
export type Dims = { width: number; height: number };   // the pane, in cells

const KIND_MARKS = ["◆", "●", "▲", "■", "◇", "○", "▼"] as const;
export const DETAIL_ROWS = 4, FIXED_ROWS = 13;           // rows the card spends outside the grid (see view())

export type Model = {
  section: VSection; geo: Geometry; grid: Grid; order: string[]; trail: VPath[]; twoSided: boolean;
  marks: Map<string, [glyph: string, cat: number | "gray"]>; index: Map<VEdge, number>;
  box: Map<string, { r0: number; r1: number; c0: number; c1: number }>;
};

export type View = {
  title: Chunk[]; hint: Chunk[]; answer: Chunk[]; body: Chunk[][]; scroll: Chunk[]; legend: Chunk[];
  details: Chunk[][]; footer: Chunk[]; bodyRows: number;
};

export function createModel(section: VSection, geo: Geometry): Model {
  const marks = new Map<string, [string, number | "gray"]>();
  for (const n of section.nodes) if (n.kind && !marks.has(n.kind)) marks.set(n.kind, [KIND_MARKS[marks.size % KIND_MARKS.length], marks.size % 5]);
  const trail = section.steps.length ? section.steps : section.paths;
  const ids = [...new Set(trail.flatMap((p) => p.ids))].filter((id) => section.byId[id]);
  const order = [...ids, ...section.nodes.map((n) => n.id).filter((id) => !ids.includes(id))];
  const all = [...section.nodes, ...section.edges];
  const twoSided = all.some((x) => x.st === "add") && all.some((x) => x.st === "del");
  const model = {
    section, geo, trail, order, twoSided, marks, index: new Map(section.edges.map((e, i) => [e, i])),
    grid: { cols: 0, rows: 0, cells: [] }, box: new Map(),
  } as Model;
  model.grid = drawGraph(geo, drawOpts(model, initialState(model)));
  return model;
}

export const initialState = (m: Model): State =>
  ({ sel: m.order[0] ?? "", step: -1, side: "both", inspector: false, top: 0, left: 0, hint: "" });

const markOf = (m: Model, n: VNode): [string, number | "gray"] => m.marks.get(n.kind) ?? [GLYPH.store, "gray"];
const hidden = (side: Side, st: string) => (side === "before" && st === "add") || (side === "after" && st === "del");
// Edges lit by the replay: every edge of the steps up to and including the current one.
const hotEdges = (m: Model, s: State) =>
  new Set(m.trail.slice(0, s.step + 1).flatMap((p) => p.edges).map((e) => m.index.get(e)).filter((i): i is number => i !== undefined));

function drawOpts(m: Model, s: State) {
  const hiddenNodes = new Set(m.section.nodes.filter((n) => hidden(s.side, n.st)).map((n) => n.id));
  const hiddenEdges = new Set(m.section.edges.flatMap((e, i) => (hidden(s.side, e.st) || hiddenNodes.has(e.from) || hiddenNodes.has(e.to) ? [i] : [])));
  return {
    hot: hotEdges(m, s), hiddenNodes, hiddenEdges, lifelines: m.section.view === "seq",
    glyph: (b: { id: string }) => (b.id === s.sel ? GLYPH.select : markOf(m, m.section.byId[b.id])[0]),
  };
}

// ---- state changes ---------------------------------------------------------------------------------------------
export function move(m: Model, s: State, by: number) {
  const visible = m.order.filter((id) => !hidden(s.side, m.section.byId[id].st));
  if (!visible.length) return;
  const at = visible.indexOf(s.sel);
  s.sel = visible[(at + by + visible.length * 2) % visible.length];
  s.hint = "";
}

export function replay(m: Model, s: State, by: number) {
  if (!m.trail.length) { s.hint = "no path to replay in this section"; return; }
  s.step = Math.max(-1, Math.min(m.trail.length - 1, s.step + by));
  const ids = s.step >= 0 ? m.trail[s.step].ids : [];
  if (ids.length) s.sel = ids[ids.length - 1];
  s.hint = "";
}

export function toggleSide(m: Model, s: State) {
  if (!m.twoSided) { s.hint = "this section has no before/after to toggle"; return; }
  s.side = s.side === "both" ? "before" : s.side === "before" ? "after" : "both";
  s.hint = "";
}

// ---- drawing -----------------------------------------------------------------------------------------------------
function cellStyle(p: Palette, m: Model, s: State, c: Cell): { color: string; bold: boolean } {
  const n = c.id ? m.section.byId[c.id] : undefined, on = c.id === s.sel;
  switch (c.tag) {
    case "border": {
      const tone = n?.st === "add" ? p.good : n?.st === "del" || n?.st === "fail" ? p.bad : n?.st === "mod" ? p.cat[1] : n?.st === "unk" ? p.gray : p.border;
      return { color: on ? p.text : tone, bold: on };
    }
    case "text": return { color: n?.st === "unk" ? p.gray : p.text, bold: on };
    case "glyph": { const [, cat] = n ? markOf(m, n) : ["", "gray" as const]; return { color: on ? p.text : cat === "gray" ? p.gray : p.cat[cat], bold: on }; }
    case "edge": case "arrow": return c.hot ? { color: p.cat[0], bold: true } : { color: p.border, bold: false };
    case "label": return { color: c.hot ? p.text : p.gray, bold: !!c.hot };
    case "head": return { color: p.gray, bold: true };
    case "life": return { color: p.border, bold: false };
    default: return { color: p.text, bold: false };
  }
}

// One grid row, clipped to [left, left + width): runs of equal style become one chunk; a gray › or ‹ marks cut content.
function rowChunks(p: Palette, m: Model, s: State, row: Cell[], left: number, width: number): Chunk[] {
  const out: Chunk[] = [];
  const visible = row.slice(left, left + width);
  const cutRight = row.slice(left + width).some((c) => c.ch !== " "), cutLeft = row.slice(0, left).some((c) => c.ch !== " ");
  let run = "", style: { color: string; bold: boolean } | null = null;
  const flush = () => { if (run) out.push(style!.bold ? bold(fg(style!.color)(run)) : fg(style!.color)(run)); run = ""; };
  visible.forEach((c, i) => {
    let ch = c.ch, st = cellStyle(p, m, s, c);
    if ((i === 0 && cutLeft) || (i === visible.length - 1 && cutRight)) { ch = i === 0 && cutLeft ? "‹" : "›"; st = { color: p.gray, bold: false }; }
    if (!style || style.color !== st.color || style.bold !== st.bold) { flush(); style = st; }
    run += ch;
  });
  flush();
  return out;
}

const boxExtent = (m: Model, id: string) => {
  const hit = m.box.get(id);
  if (hit) return hit;
  const rows: number[] = [], cols: number[] = [];
  m.grid.cells.forEach((row, r) => row.forEach((c, i) => { if (c.id === id && c.tag === "border") { rows.push(r); cols.push(i); } }));
  const e = { r0: Math.min(...rows), r1: Math.max(...rows), c0: Math.min(...cols), c1: Math.max(...cols) };
  if (rows.length) m.box.set(id, e);
  return e;
};

// Keep the selected box inside the visible window, clamped to the grid. Called after anything that may move it.
export function follow(m: Model, s: State, dims: Dims) {
  const { bodyRows, width } = sizes(dims);
  const maxTop = Math.max(0, m.grid.rows - bodyRows), maxLeft = Math.max(0, m.grid.cols - width);
  const e = boxExtent(m, s.sel);
  if (Number.isFinite(e.r0)) {
    if (e.r0 < s.top || e.r1 >= s.top + bodyRows) s.top = e.r0 - Math.floor((bodyRows - (e.r1 - e.r0 + 1)) / 2);
    if (e.c1 >= s.left + width - 1) s.left = e.c1 - width + 2;   // sideways: scroll only as far as needed
    if (e.c0 < s.left + 1) s.left = Math.max(0, e.c0 - 1);
  }
  s.top = Math.max(0, Math.min(maxTop, s.top));
  s.left = Math.max(0, Math.min(maxLeft, s.left));
}

export function cardWidth(dims: Dims) { return Math.max(40, Math.min(140, dims.width - 2)); }
function sizes(dims: Dims) { return { width: cardWidth(dims) - 4, bodyRows: Math.max(4, dims.height - FIXED_ROWS) }; }

function detailRows(p: Palette, n: VNode, width: number): Chunk[][] {
  const [g, cat] = [GLYPH.select, "gray" as const];
  const fields: [string, string][] = [...Object.entries(n.info), ...(n.note ? [["note", n.note] as [string, string]] : [])];
  const rows: Chunk[][] = [[
    mark(p, g, cat), plain(p, " "), value(p, n.label), n.kind ? label(p, `  ${n.kind}`) : plain(p, ""),
    ...(n.ref ? [plain(p, "  "), ref(p, `@${n.ref}`)] : []),
  ]];
  const room = DETAIL_ROWS - 1;
  fields.slice(0, room).forEach(([k, v], i) => {
    const more = i === room - 1 && fields.length > room ? `  +${fields.length - room} more · enter` : "";
    rows.push([label(p, pad(k, 7)), value(p, pad(v, Math.max(8, width - 8 - more.length)).trimEnd()), label(p, more)]);
  });
  return rows;
}

function inspectorRows(p: Palette, m: Model, n: VNode, height: number): Chunk[][] {
  const rows: Chunk[][] = [[mark(p, GLYPH.select, "gray"), plain(p, " "), value(p, n.label), n.kind ? label(p, `  ${n.kind}`) : plain(p, "")]];
  if (n.ref) rows.push([label(p, pad("ref", 8)), ref(p, `@${n.ref}`)]);
  for (const [k, v] of Object.entries(n.info)) rows.push([label(p, pad(k, 8)), value(p, v)]);
  if (n.note) rows.push([label(p, pad("note", 8)), value(p, n.note)]);
  for (const [r, why] of n.refs) rows.push([label(p, pad("ref", 8)), ref(p, `@${r}`), label(p, why ? `  ${why}` : "")]);
  for (const e of m.section.edges) {
    if (e.to === n.id) rows.push([label(p, pad("in", 8)), plain(p, `${m.section.byId[e.from]?.label ?? e.from}`), label(p, e.label ? `  ${e.label}` : "")]);
    if (e.from === n.id) rows.push([label(p, pad("out", 8)), plain(p, `${m.section.byId[e.to]?.label ?? e.to}`), label(p, e.label ? `  ${e.label}` : "")]);
  }
  const steps = m.trail.flatMap((t, i) => (t.ids.includes(n.id) ? [i + 1] : []));
  if (steps.length) rows.push([label(p, pad("steps", 8)), plain(p, steps.join(", "))]);
  if (rows.length > height) { const cut = rows.length - (height - 1); rows.length = height - 1; rows.push([label(p, `+${cut} more`)]); }
  return rows;
}

// The whole card as chunks. Row count is fixed: FIXED_ROWS outside the grid area, `bodyRows` inside it.
export function view(p: Palette, m: Model, s: State, dims: Dims, doc: { title: string }, at: { n: number; of: number }): View {
  const { width, bodyRows } = sizes(dims);
  m.grid = drawGraph(m.geo, drawOpts(m, s));
  follow(m, s, dims);
  const sec = m.section, node = sec.byId[s.sel];
  const step = s.step >= 0 ? m.trail[s.step] : undefined;
  const counts = `${sec.nodes.length} nodes · ${sec.edges.length} edges`;

  const answer: Chunk[] = step
    ? [label(p, `step ${s.step + 1}/${m.trail.length}  `), step.fail ? fg(p.bad)(pad(step.narr, width - 12)) : plain(p, pad(step.narr, width - 12))]
    : [...rich(p, doc.title ? `**${doc.title}**` : `**${counts}**`), ...(doc.title ? [label(p, ` · ${counts}`)] : [])];
  if (!step && s.side !== "both") answer.push(label(p, ` · showing ${s.side}`));

  const body = s.inspector && node
    ? inspectorRows(p, m, node, bodyRows)
    : m.grid.cells.slice(s.top, s.top + bodyRows).map((row) => rowChunks(p, m, s, row, s.left, width));
  while (body.length < bodyRows) body.push([plain(p, "")]);

  const clipped = m.grid.rows > bodyRows || m.grid.cols > width;
  const where = `rows ${s.top + 1}-${Math.min(m.grid.rows, s.top + bodyRows)} of ${m.grid.rows}` +
    (m.grid.cols > width ? ` · cols ${s.left + 1}-${Math.min(m.grid.cols, s.left + width)} of ${m.grid.cols}` : "");
  const scroll = [label(p, s.hint || (s.inspector ? "enter back to the graph" : clipped ? where : ""))];

  const items: [string, number | "gray", string][] = [...m.marks].map(([kind, [g, c]]) => [g, c, kind]);
  const shown: typeof items = [];
  let used = 0;
  for (const it of items) { used += it[2].length + 4; if (used > width - 12 && shown.length < items.length) break; shown.push(it); }
  const leg = legend(p, shown);
  if (shown.length < items.length) leg.push(label(p, `  +${items.length - shown.length} more`));

  const keys: [string, string][] = [["j k", "node"]];
  if (m.trail.length) keys.push(["← →", "replay"]);
  keys.push(["enter", "inspect"]);
  if (m.twoSided) keys.push(["b", "side"]);
  keys.push(["y", "ref"], ["[ ]", "section"], ["q", "quit"]);

  return {
    title: [value(p, sec.name)], hint: [accent(p, `${sec.view} · ${at.n}/${at.of}`)], answer, body, scroll, legend: leg,
    details: node ? detailRows(p, node, width) : [[label(p, "no nodes")]], footer: keybar(p, "viz", keys), bodyRows,
  };
}

export const chunkText = (chunks: Chunk[]) => chunks.map((c) => c.text).join("");
