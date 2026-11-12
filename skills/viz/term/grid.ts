// A character grid for viz graph geometry. Pure: no OpenTUI, no DOM.
// Boxes are drawn first, then edge paths (M/L/Q/C) as line characters, then edge labels. Lines never overwrite a
// box or a label; where lines meet, their directions merge into a corner, tee or cross.

export type Box = { id: string; label: string; kind: string; x: number; y: number; w: number; h: number };
export type Edge = { from: string; to: string; label: string; d: string; rev?: boolean; pill?: { x: number; y: number; w: number; h: number } };
export type Decor = { kind: string; x: number; y: number; text?: string; y1?: number; y2?: number };
export type Geometry = { w: number; h: number; boxes: Box[]; edges: Edge[]; decor?: Decor[] };

// What a cell is, so the caller can colour it: box border, label text, kind glyph, edge line, arrowhead, edge label.
export type Tag = "" | "border" | "text" | "glyph" | "edge" | "arrow" | "label" | "head" | "life";
export type Cell = { ch: string; tag: Tag; id?: string; hot?: boolean };
export type Grid = { cols: number; rows: number; cells: Cell[][] };

export type DrawOpts = {
  hot?: Set<number>;                  // indexes of edges to highlight
  hiddenNodes?: Set<string>;
  hiddenEdges?: Set<number>;
  glyph?: (box: Box) => string;       // the mark drawn before a box label
  lifelines?: boolean;                // sequence views: a dotted line under every box
  charW?: number;
  rowH?: number;
};

const N = 1, E = 2, S = 4, W = 8;
// Direction bits -> line character. Corners are rounded, matching the Q corners of the path.
const LINE: Record<number, string> = {
  [N]: "│", [S]: "│", [N | S]: "│", [E]: "─", [W]: "─", [E | W]: "─",
  [N | E]: "╰", [E | S]: "╭", [S | W]: "╮", [N | W]: "╯",
  [N | E | S]: "├", [N | S | W]: "┤", [E | S | W]: "┬", [N | E | W]: "┴", [N | E | S | W]: "┼",
};
const ARROW: Record<number, string> = { [E]: "►", [W]: "◄", [S]: "▼", [N]: "▲" };   // full-size, as Mermaid's text renderer

type Pt = [col: number, row: number];

// Split an SVG path (M L Q C only) into the points a line must pass through. A Q or C control point is a corner.
export function pathPoints(d: string): [number, number][] {
  const pts: [number, number][] = [];
  for (const m of d.matchAll(/([MLQC])([^MLQC]*)/g)) {
    const n = (m[2].match(/-?\d+(?:\.\d+)?/g) ?? []).map(Number);
    const take = m[1] === "Q" ? 4 : m[1] === "C" ? 6 : 2;
    for (let i = 0; i + 1 < n.length && i < take; i += 2) pts.push([n[i], n[i + 1]]);
  }
  return pts;
}

// Snap path points to the cell they fall in (floor, so a path ends in the gap before a box, never on its border).
export function snap(d: string, cw = 7.6, rh = 17, sy: (y: number) => number = (y) => y): Pt[] {
  const snapped: Pt[] = [];
  for (const [x, y] of pathPoints(d)) {
    const p: Pt = [Math.floor(x / cw + 1e-6), Math.floor(sy(y) / rh + 1e-6)];
    const last = snapped[snapped.length - 1];
    if (!last || last[0] !== p[0] || last[1] !== p[1]) snapped.push(p);
  }
  return snapped;
}

// Join snapped points with horizontal and vertical legs only. A diagonal step (px rounding, or the curve of a C path)
// becomes one corner, turning away from the previous leg so wobbles stay straight.
export function orthogonal(snapped: Pt[]): Pt[] {
  const out: Pt[] = snapped.length ? [snapped[0]] : [];
  for (let i = 1; i < snapped.length; i++) {
    const a = out[out.length - 1], b = snapped[i];
    if (a[0] === b[0] && a[1] === b[1]) continue;
    if (a[0] !== b[0] && a[1] !== b[1]) {
      const prev = out[out.length - 2];
      const vertical = prev ? prev[0] === a[0] : Math.abs(b[1] - a[1]) >= Math.abs(b[0] - a[0]);
      out.push(vertical ? [a[0], b[1]] : [b[0], a[1]]);
    }
    out.push(b);
  }
  return out;
}

export const route = (d: string, cw = 7.6, rh = 17, sy: (y: number) => number = (y) => y): Pt[] => orthogonal(snap(d, cw, rh, sy));

// Drop collinear middle points.
function collinear(points: Pt[]): Pt[] {
  const v = points.filter((p, i) => i === 0 || p[0] !== points[i - 1][0] || p[1] !== points[i - 1][1]);
  return v.filter((p, i) => {
    if (i === 0 || i === v.length - 1) return true;
    const a = v[i - 1], b = v[i + 1];
    return !((a[0] === p[0] && p[0] === b[0]) || (a[1] === p[1] && p[1] === b[1]));
  });
}

// A short sidestep between two legs going the same way (snap rounding: a staircase like ╭──╯) moves to the start of
// the first leg, so the line turns once and then runs straight. `ok` vetoes a move whose new cells hit a box.
export function unjog(vertices: Pt[], ok: (cells: Pt[]) => boolean = () => true, maxJog = 2): Pt[] {
  let v = collinear(vertices);
  for (let changed = true, n = 0; changed && n < 64; n++) {
    changed = false;
    for (let i = 0; i + 3 < v.length; i++) {
      const [a, b, c, d] = [v[i], v[i + 1], v[i + 2], v[i + 3]];
      const d1 = dirBit(a, b), d2 = dirBit(b, c), d3 = dirBit(c, d);
      const jog: Pt = [c[0] - b[0], c[1] - b[1]];
      if (!jog[0] && !jog[1]) continue;
      if (d1 !== d3 || d2 === d1 || d2 === opposite(d1) || Math.abs(jog[0]) + Math.abs(jog[1]) > maxJog) continue;
      const turn: Pt = [a[0] + jog[0], a[1] + jog[1]];
      const next = collinear([...v.slice(0, i + 1), turn, ...v.slice(i + 3)]);
      if (!ok(unroll([a, turn, d]).slice(1, -1))) continue;
      v = next; changed = true; break;
    }
  }
  return v;
}

// Every cell a route covers, in order, one step apart.
function unroll(vertices: Pt[]): Pt[] {
  if (!vertices.length) return [];
  const cells: Pt[] = [vertices[0]];
  for (let i = 1; i < vertices.length; i++) {
    const [c0, r0] = vertices[i - 1], [c1, r1] = vertices[i];
    // a diagonal (never produced by orthogonal, but guard anyway) goes across, then down
    for (let c = c0; c !== c1;) { c += Math.sign(c1 - c0); cells.push([c, r0]); }
    for (let r = r0; r !== r1;) { r += Math.sign(r1 - r0); cells.push([c1, r]); }
  }
  return cells;
}

// Remove out-and-back spikes (a cell revisited two steps later), left when a run is rebuilt over its own approach.
function noBacktrack(path: Pt[]): Pt[] {
  const out: Pt[] = [];
  for (const p of path) {
    const back = out[out.length - 2];
    if (back && back[0] === p[0] && back[1] === p[1]) out.pop();
    else out.push(p);
  }
  return out;
}

const dirBit = (from: Pt, to: Pt) => (to[0] > from[0] ? E : to[0] < from[0] ? W : to[1] > from[1] ? S : N);
const opposite = (bit: number) => (bit === E ? W : bit === W ? E : bit === N ? S : N);

// Wrap a label to `width` cells; the last line ends in … when it is cut at `maxLines`.
export function wrap(text: string, width: number, maxLines: number): string[] {
  const lines: string[] = [];
  let line = "";
  for (const word of text.split(/\s+/).filter(Boolean)) {
    if (line && line.length + 1 + word.length > width) { lines.push(line); line = word; }
    else line = line ? `${line} ${word}` : word;
  }
  if (line) lines.push(line);
  const cut = lines.length > maxLines;
  const kept = lines.slice(0, Math.max(1, maxLines)).map((l) => (l.length > width ? `${l.slice(0, width - 1)}…` : l));
  if (cut) kept[kept.length - 1] = `${kept[kept.length - 1].replace(/…$/, "").slice(0, width - 1)}…`;
  return kept;
}

// A box needs whole rows (at least 3: border, text, border), so a 46px box is a little taller in cells than in px.
// Stretch the y axis around each band of boxes by that difference, and boxes, edges and labels all stay in step:
// an edge that ends at a box top still ends one row above it. Boxes side by side share one band (the largest stretch).
export function stretcher(boxes: Box[], rh: number): (y: number) => number {
  const bands: { top: number; bottom: number; extra: number }[] = [];
  for (const b of [...boxes].sort((a, c) => a.y - c.y)) {
    const extra = Math.max(3, Math.round(b.h / rh)) * rh - b.h, band = bands[bands.length - 1];
    if (band && b.y < band.bottom - 0.5) { band.bottom = Math.max(band.bottom, b.y + b.h); band.extra = Math.max(band.extra, extra); }
    else bands.push({ top: b.y, bottom: b.y + b.h, extra });
  }
  return (y) => bands.reduce((sum, b) => sum + b.extra * Math.max(0, Math.min(1, (y - b.top) / (b.bottom - b.top))), y);
}

export function drawGraph(g: Geometry, opts: DrawOpts = {}): Grid {
  const cw = opts.charW ?? 7.6, rh = opts.rowH ?? 17;
  const sy = stretcher(g.boxes, rh);
  const cols = Math.ceil(g.w / cw) + 1, rows = Math.ceil(sy(g.h) / rh) + 1;
  const cells: Cell[][] = Array.from({ length: rows }, () => Array.from({ length: cols }, () => ({ ch: " ", tag: "" as Tag })));
  const at = (c: number, r: number): Cell | undefined => cells[r]?.[c];
  const extents: { id: string; c0: number; c1: number; r0: number; r1: number }[] = [];
  const boxAt = new Set<number>();                       // r * 1e5 + c of every box cell
  const key = (c: number, r: number) => r * 1e5 + c;
  const put = (c: number, r: number, cell: Cell) => { const t = at(c, r); if (t) Object.assign(t, cell); };

  // ---- boxes --------------------------------------------------------------------------------------------------
  for (const b of g.boxes) {
    if (opts.hiddenNodes?.has(b.id)) continue;
    const c0 = Math.round((b.x - b.w / 2) / cw), r0 = Math.round(sy(b.y) / rh);
    const c1 = Math.max(c0 + 5, Math.round((b.x + b.w / 2) / cw)), r1 = Math.max(r0 + 3, Math.round(sy(b.y + b.h) / rh));
    extents.push({ id: b.id, c0, c1, r0, r1 });
    for (let r = r0; r < r1; r++) for (let c = c0; c < c1; c++) {
      const edgeRow = r === r0 || r === r1 - 1, edgeCol = c === c0 || c === c1 - 1;
      const ch = edgeRow ? (edgeCol ? (r === r0 ? (c === c0 ? "╭" : "╮") : c === c0 ? "╰" : "╯") : "─") : edgeCol ? "│" : " ";
      put(c, r, { ch, tag: edgeRow || edgeCol ? "border" : "text", id: b.id });
      boxAt.add(key(c, r));
    }
    const glyph = opts.glyph?.(b) ?? "";
    const inner = c1 - c0 - 4, textRows = r1 - r0 - 2;
    const lines = wrap(b.label, Math.max(1, inner - (glyph ? 2 : 0)), textRows);
    const top = r0 + 1 + Math.floor((textRows - lines.length) / 2);
    const widest = Math.max(...lines.map((l) => l.length)) + (glyph ? 2 : 0);
    const left = c0 + 2 + Math.max(0, Math.floor((inner - widest) / 2));
    lines.forEach((line, i) => {
      if (glyph && i === 0) put(left, top, { ch: glyph, tag: "glyph", id: b.id });
      [...line].forEach((ch, j) => put(left + (glyph ? 2 : 0) + j, top + i, { ch, tag: "text", id: b.id }));
    });
  }

  if (opts.lifelines) {
    for (const b of g.boxes) {
      if (opts.hiddenNodes?.has(b.id)) continue;
      const c = Math.round(b.x / cw);
      for (let r = Math.round(sy(b.y + b.h) / rh); r < rows - 1; r++) if (at(c, r)?.tag === "") put(c, r, { ch: "┆", tag: "life", id: b.id });
    }
  }

  // A neighbour of p that is a border cell of box `id`, as [cell, direction from p].
  const touching = (p: Pt, id: string): [Pt, number] | undefined => ([[E, 1, 0], [W, -1, 0], [S, 0, 1], [N, 0, -1]] as const)
    .map(([bit, dc, dr]): [Pt, number] => [[p[0] + dc, p[1] + dr], bit])
    .find(([n]) => at(n[0], n[1])?.id === id && boxAt.has(key(n[0], n[1])));
  const free = (p: Pt) => { const t = at(p[0], p[1]); return !!t && !boxAt.has(key(p[0], p[1])) && t.tag !== "label"; };
  // An arrowhead sits on a straight run, never on a corner (Mermaid's rule). When the last leg turns right at the
  // target, move that leg one cell back from the box so the line turns first and the arrow enters straight.
  const straightIn = (path: Pt[], to: string): Pt[] => {
    const end = path[path.length - 1], hit = touching(end, to);
    if (!hit || path.length < 2) return path;
    const into = hit[1], back: Pt = into === S ? [0, -1] : into === N ? [0, 1] : into === E ? [-1, 0] : [1, 0];
    const prev = path[path.length - 2];
    if (dirBit(prev, end) === into) return path;           // already straight
    let k = path.length - 1;                                // start of the final leg (perpendicular to `into`)
    while (k > 0 && dirBit(path[k - 1], path[k]) === dirBit(prev, end)) k--;
    const before = path[k - 1];
    if (!before || before[0] !== path[k][0] + back[0] || before[1] !== path[k][1] + back[1]) return path;
    const leg = path.slice(k).map(([c, r]): Pt => [c + back[0], r + back[1]]);
    if (!leg.every(free)) return path;
    return [...path.slice(0, k), ...leg.slice(1), end];   // leg[0] is `before`, already in the path
  };
  // A self-loop: out of the right wall on the middle row, round, and back in through the top (or bottom) border.
  const selfLoop = (x: (typeof extents)[number]): Pt[] => {
    const mid = x.r0 + Math.floor((x.r1 - x.r0) / 2), out = x.c1 + 2, back = x.c1 - 3;
    const open = ([c, r]: Pt) => at(c, r)?.tag === "" && !bits.has(key(c, r));
    const blankRun = (v: Pt[]) => unroll(v).slice(1).every(open);
    for (const row of [x.r0 - 1, x.r1]) {
      const v: Pt[] = [[x.c1 - 1, mid], [out, mid], [out, row], [back, row], [back, row === x.r1 ? row - 1 : row + 1]];
      // the arrowhead needs clear cells either side, so it does not read as part of another edge's head
      if (blankRun(v.slice(0, 4)) && open([back - 1, row])) {
        const near = [[back - 1, row], [back - 2, row]].some(([c, r]) => at(c, r)?.tag === "arrow");
        if (!near) return v;
      }
    }
    return [[x.c1 - 1, mid], [out, mid], [out, x.r0 - 1], [x.c1 - 2, x.r0 - 1], [x.c1 - 2, x.r0]];   // crowded: top anyway
  };
  // Box cells a run of vertices crosses that belong to neither end of the edge.
  const hits = (v: Pt[], from: string, to: string) => unroll(v).filter(([c, r]) => {
    const t = at(c, r);
    return !!t && boxAt.has(key(c, r)) && t.id !== from && t.id !== to;
  }).length;
  // Snapping can put a leg that passes a box in px on the box's border row in cells. Move such a leg 1-2 cells
  // off the box (its neighbours stretch to follow), keeping the end cells on their own boxes.
  const avoid = (v: Pt[], from: string, to: string): Pt[] => {
    v = collinear(v);
    for (let i = 0; i + 1 < v.length; i++) {
      if (!hits([v[i], v[i + 1]], from, to)) continue;
      const flat = v[i][1] === v[i + 1][1], axis = flat ? 1 : 0;
      for (const d of [-1, 1, -2, 2]) {
        const w = v.map((p, j): Pt => (j === i || j === i + 1 ? (axis ? [p[0], p[1] + d] : [p[0] + d, p[1]]) : p));
        if (hits(w, from, to) < hits(v, from, to)) { v = w; break; }
      }
    }
    return collinear(v);
  };
  // A jog right at the wall (├──────╮ then ╰►) moves to the middle of the run, so both legs are long.
  const centreJog = (path: Pt[]): Pt[] => {
    const v = collinear(path);
    if (v.length < 4) return path;
    const [a, b, c, d] = v.slice(-4);
    const flat = a[1] === b[1] && c[1] === d[1] && b[0] === c[0];
    if (!flat || dirBit(a, b) !== dirBit(c, d) || Math.abs(d[0] - c[0]) > 1 || Math.abs(b[0] - a[0]) < 4) return path;
    const x = Math.round((a[0] + d[0]) / 2);
    const next = unroll([...v.slice(0, -4), a, [x, a[1]], [x, d[1]], d]);
    return next.some((p) => boxAt.has(key(p[0], p[1]))) ? path : next;
  };
  // A line that enters a box sideways meets the wall on the box's middle row. Curved (C) ranked edges can snap so
  // the last horizontal run lands on the corner row or the row outside it; rebuild that run on the middle row.
  const sideAttach = (path: Pt[], id: string): Pt[] => {
    const x = extents.find((b) => b.id === id), end = path[path.length - 1];
    if (!x || path.length < 3) return path;
    const beside = end[0] === x.c0 - 1 || end[0] === x.c1;
    const overCorner = (end[0] === x.c0 || end[0] === x.c1 - 1) && (end[1] === x.r0 - 1 || end[1] === x.r1);
    if (!beside && !overCorner) return path;
    if (end[1] < x.r0 - 1 || end[1] > x.r1 || (beside && end[1] > x.r0 && end[1] < x.r1 - 1)) return path;
    const mid = x.r0 + Math.floor((x.r1 - x.r0) / 2), wall = end[0] <= x.c0 ? x.c0 - 1 : x.c1;
    let j = path.length - 1;                              // skip a short drop down the column of the end cell
    while (j > 0 && path[j - 1][0] === end[0]) j--;
    if (j === 0 || path.length - 1 - j > 2) return path;
    let k = j - 1;                                        // then the horizontal run before it
    while (k > 0 && path[k - 1][1] === path[j - 1][1]) k--;
    const at0 = Math.floor((k + j - 1) / 2), q = path[at0];   // the jog goes in the middle of that run
    if (q[0] === wall) return path;
    const tail = unroll([q, [q[0], mid], [wall, mid]]);
    if (tail.slice(1).some((p) => boxAt.has(key(p[0], p[1])) || !at(p[0], p[1]))) return path;
    return noBacktrack([...path.slice(0, at0), ...tail]);
  };
  const reattach = (path: Pt[], from: string, to: string) => sideAttach(sideAttach(path, to).reverse(), from).reverse();
  // The line leaves its source through the border, as a tee (┬ ┴ ├ ┤), so it visibly attaches.
  const teeOut = (start: Pt, from: string) => {
    const hit = touching(start, from);
    if (!hit) return;
    const [[c, r], bit] = hit, t = at(c, r)!;
    const tee: Record<string, Record<number, string>> = { "─": { [S]: "┴", [N]: "┬" }, "│": { [E]: "┤", [W]: "├" } };
    const ch = tee[t.ch]?.[bit];
    if (ch) t.ch = ch;
  };

  // ---- edges --------------------------------------------------------------------------------------------------
  const bits = new Map<number, number>(), hotAt = new Set<number>(), own = new Map<number, Set<number>>();
  // Self-loops go last, so they can see every other line and pick a clear side.
  const order = g.edges.map((_, i) => i).sort((a, b) => +(g.edges[a].from === g.edges[a].to) - +(g.edges[b].from === g.edges[b].to));
  order.forEach((index) => {
    const e = g.edges[index];
    if (opts.hiddenEdges?.has(index)) return;
    const self = e.from === e.to ? extents.find((x) => x.id === e.from) : undefined;
    const vertices = self ? selfLoop(self) : snap(e.d, cw, rh, sy);
    if (e.rev) vertices.reverse();                       // a cycle-breaking edge is laid out to -> from (HTML: marker-start)
    // A line that leaves or enters a box sideways attaches on the box's middle row, whatever the rounding said.
    for (const [end, next] of [[0, 1], [vertices.length - 1, vertices.length - 2]]) {
      const v = vertices[end], w = vertices[next];
      if (!v || !w || v[1] !== w[1]) continue;
      const near = extents.filter((x) => (v[0] === x.c0 - 1 || v[0] === x.c0 || v[0] === x.c1 - 1 || v[0] === x.c1) && v[1] >= x.r0 - 1 && v[1] <= x.r1);
      const mid = (x: (typeof extents)[number]) => x.r0 + Math.floor((x.r1 - x.r0) / 2);
      near.sort((a, b) => Math.abs(mid(a) - v[1]) - Math.abs(mid(b) - v[1]));
      if (!near[0]) continue;
      const was = v[1];
      v[1] = mid(near[0]);
      if (next !== 0 && next !== vertices.length - 1 && w[1] === was) w[1] = v[1];   // keep the leg straight; a 2-point line jogs instead
    }
    const clear = (cells: Pt[]) => cells.every((p) => !boxAt.has(key(p[0], p[1])));
    let path = unroll(unjog(avoid(orthogonal(vertices), e.from, e.to), clear));
    const hidden = (p: Pt) => boxAt.has(key(p[0], p[1]));
    while (path.length && hidden(path[0])) path = path.slice(1);
    while (path.length && hidden(path[path.length - 1])) path = path.slice(0, -1);
    if (!path.length) return;
    path = straightIn(reattach(path, e.from, e.to), e.to);
    path = centreJog(centreJog(path).reverse()).reverse();
    const hot = !!opts.hot?.has(index);
    own.set(index, new Set(path.map((p) => key(p[0], p[1]))));
    path.forEach((p, i) => {
      const k = key(p[0], p[1]);
      let b = bits.get(k) ?? 0;
      if (i > 0) b |= dirBit(p, path[i - 1]);
      if (i < path.length - 1) b |= dirBit(p, path[i + 1]);
      if (i === 0) { const src = touching(p, e.from); if (src) b |= src[1]; }
      if (path.length === 1 && !b) b |= S;
      bits.set(k, b);
      if (hot) hotAt.add(k);
    });
    // The arrowhead takes the last cell, pointing the way the line was travelling.
    // When the end touches the target box, point into it: a final leg shorter than a row snaps flat and would
    // otherwise point sideways.
    const end = path[path.length - 1], prev = path[path.length - 2] ?? end;
    const into = ([[1, 0], [-1, 0], [0, 1], [0, -1]] as const).map(([dc, dr]): Pt => [end[0] + dc, end[1] + dr])
      .find((n) => at(n[0], n[1])?.id === e.to && boxAt.has(key(n[0], n[1])));
    const bit = into ? dirBit(end, into) : end === prev ? S : dirBit(prev, end);
    put(end[0], end[1], { ch: ARROW[bit], tag: "arrow", hot });
    teeOut(path[0], e.from);
    bits.set(key(end[0], end[1]), -1);                   // -1: an arrowhead, not to be merged into a junction
  });
  for (const [k, b] of bits) {
    const r = Math.floor(k / 1e5), c = k - r * 1e5, t = at(c, r);
    if (b > 0 && t && t.tag !== "arrow" && !boxAt.has(k)) Object.assign(t, { ch: LINE[b] ?? "┼", tag: "edge" as Tag, hot: hotAt.has(k) });
    else if (t && b < 0 && hotAt.has(k)) t.hot = true;
  }

  // ---- edge labels --------------------------------------------------------------------------------------------
  // Mermaid's rule: a label sits on its own edge's vertical run, centred on the line (the line passes under it),
  // or just right of it. It never covers a box, another label, an arrowhead, or another edge's line. Rows are
  // tried nearest the pill first; when nothing fits, the label goes on the pill row over blank cells only.
  const blank = (c: number, r: number) => { const t = at(c, r); return !!t && t.tag === "" ; };
  g.edges.forEach((e, index) => {
    if (!e.label || !e.pill || opts.hiddenEdges?.has(index)) return;
    const text = ` ${e.label} `, mine = own.get(index) ?? new Set<number>();
    const hot = !!opts.hot?.has(index);
    const fits = (start: number, row: number) => [...text].every((_, i) => {
      const c = start + i, t = at(c, row);
      if (!t || boxAt.has(key(c, row))) return false;
      if (t.tag === "") return true;
      // its own vertical line may pass under it, but not the cell next to a box: the tee must visibly connect
      const nearBox = [[0, 1], [0, -1]].some(([dc, dr]) => boxAt.has(key(c + dc, row + dr)));
      return t.tag === "edge" && mine.has(key(c, row)) && t.ch === "│" && !nearBox;
    });
    const pillRow = Math.floor(sy(e.pill.y + e.pill.h / 2) / rh), pillCol = Math.round(e.pill.x / cw);
    const cellsOf = [...mine].map((k) => [k - Math.floor(k / 1e5) * 1e5, Math.floor(k / 1e5)] as Pt);
    const tries: [number, number, number][] = [];       // [cost, start, row]
    const half = Math.floor(text.length / 2);
    for (const [c, r] of cellsOf) {
      const d = Math.abs(r - pillRow) * 4 + Math.abs(c - pillCol);
      if (at(c, r)?.ch === "│") tries.push([d, c - half, r], [d + 2, c + 1, r], [d + 3, c - text.length, r]);
      else if (at(c, r)?.ch === "─") tries.push([d + 6, c - half, r - 1], [d + 6, c - half, r + 1]);   // beside a horizontal run
    }
    tries.sort((a, b) => a[0] - b[0]);
    const pick = tries.find(([, start, row]) => fits(start, row));
    let start: number, row: number;
    if (pick) [, start, row] = pick;
    else {
      row = pillRow; start = pillCol - Math.floor(text.length / 2);
      if ([...text].some((_, i) => at(start + i, row)?.tag === "arrow")) start = pillCol + 1;
    }
    [...text].forEach((ch, i) => {
      const t = at(start + i, row);
      if (!t || boxAt.has(key(start + i, row)) || t.tag === "label" || t.tag === "arrow") return;
      if (!pick && t.tag !== "" ) return;                 // fallback: blank cells only, lines stay whole
      Object.assign(t, { ch, tag: "label" as Tag, hot });
    });
  });
  // ---- decor: ranked column heads (left aligned) and sequence state pills (centred) -----------------------------
  for (const d of g.decor ?? []) {
    if (!d.text || (d.kind !== "head" && d.kind !== "spill")) continue;
    const text = d.kind === "spill" ? ` ${d.text} ` : d.text;
    const start = Math.round(d.x / cw) - (d.kind === "spill" ? Math.floor(text.length / 2) : 0);
    const row = Math.floor(sy(d.y + (d.kind === "spill" ? 10 : 0)) / rh);
    [...text].forEach((ch, i) => {
      const t = at(start + i, row);
      if (t && !boxAt.has(key(start + i, row)) && t.tag !== "label") Object.assign(t, { ch, tag: d.kind === "head" ? "head" : "label" });
    });
  }
  return { cols, rows, cells };
}

// Plain text of a grid, trailing spaces trimmed. For tests and the headless dump.
export const gridText = (grid: Grid): string[] => grid.cells.map((row) => row.map((c) => c.ch).join("").trimEnd());
