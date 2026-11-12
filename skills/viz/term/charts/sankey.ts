// graph:sankey: flows grouped by source. Each node is a row (its total), each outflow an indented `→ target ████ n`
// row with a █▌ bar proportional to value. j/k select a node; its in and out flows (wherever they sit) light up in
// the accent colour. No curved bands. Geometry comes from Viz.layout(section): box values and edge values.
import { fg, bold } from "@opentui/core";
import { label, plain, ref, value, type Chunk, type Palette } from "../style";
import type { Chart, Section } from "./index";
import { barRun, chartSize, followTop, frameView, legendRow } from "./frame";

type Box = { id: string; label: string; x: number; y: number; value: number };
type Edge = { from: string; to: string; value: number };
type Row = { node: number; edge?: Edge };
type KS = { sel: number; top: number; boxes?: Box[]; edges?: Edge[]; key?: Section };

import { loadViz } from "../viz-host";
const getViz = () => loadViz() as { layout(s: Section, o?: object): { boxes: Box[]; edges: Edge[] } | null };

const k = (v: number) => (Math.abs(v) >= 1000 ? `${+(v / 1000).toFixed(1)}k` : String(+v.toFixed(v < 10 ? 1 : 0)));

function ensure(section: Section, s: KS) {
  if (s.key === section && s.boxes) return;
  const geo = getViz().layout(section);
  s.key = section; s.boxes = geo?.boxes ?? []; s.edges = geo?.edges ?? [];
  // columns left to right, then top to bottom within a column
  s.boxes.sort((a, b) => a.x - b.x || a.y - b.y);
}

export default {
  init: () => ({ sel: 0, top: 0 }),

  key(section, s, key) {
    ensure(section, s);
    const n = s.boxes!.length;
    if (key.name === "j" || key.name === "down") s.sel = Math.min(n - 1, s.sel + 1);
    else if (key.name === "k" || key.name === "up") s.sel = Math.max(0, s.sel - 1);
    else return false;
    return true;
  },

  render(p: Palette, section: Section, s: KS, dims, { doc, at }) {
    ensure(section, s);
    const { width, bodyRows } = chartSize(dims);
    const boxes = s.boxes!, edges = s.edges!, meta = new Map<string, any>(section.nodes.map((n: any) => [n.id, n]));
    const name = (id: string) => meta.get(id)?.label ?? id;
    if (!boxes.length) return frameView(p, { title: section.name, viewName: "sankey", answer: [label(p, "no flows")], rows: [[label(p, "no flows")]], top: 0, legend: [], details: [], keys: [] }, dims, at);
    s.sel = Math.max(0, Math.min(boxes.length - 1, s.sel));
    const cur = boxes[s.sel];

    const rowsOf: Row[] = [], nodeRow: number[] = [];
    boxes.forEach((b, i) => {
      nodeRow[i] = rowsOf.length; rowsOf.push({ node: i });
      edges.filter((e) => e.from === b.id).sort((a, c) => c.value - a.value).forEach((e) => rowsOf.push({ node: i, edge: e }));
    });
    s.top = followTop(nodeRow[s.sel], s.top, bodyRows, rowsOf.length);

    const nameW = Math.max(...boxes.map((b) => name(b.id).length));
    const valW = Math.max(...boxes.map((b) => k(b.value).length), ...edges.map((e) => k(e.value).length));
    const maxE = Math.max(...edges.map((e) => e.value), 1);
    const barW = Math.max(6, Math.min(30, width - 2 - 4 - nameW - 1 - 1 - valW));
    const touch = (e: Edge) => e.from === cur.id || e.to === cur.id;

    const rows: Chunk[][] = rowsOf.map(({ node, edge }) => {
      if (!edge) {
        const b = boxes[node], on = node === s.sel, nm = name(b.id).padEnd(nameW);
        return [on ? fg(p.accent)("› ") : plain(p, "  "), on ? value(p, nm) : plain(p, nm), plain(p, " "), label(p, k(b.value))];
      }
      const hot = touch(edge), c = hot ? p.accent : p.cat[0], n = name(edge.to);
      const bar = barRun((edge.value / maxE) * barW).padEnd(barW);
      return [
        plain(p, "  "), label(p, "→ "), hot ? bold(plain(p, n.padEnd(nameW))) : plain(p, n.padEnd(nameW)), plain(p, " "),
        fg(c)(bar), plain(p, " "), hot ? bold(fg(p.accent)(k(edge.value).padStart(valW))) : label(p, k(edge.value).padStart(valW)),
      ];
    });

    const ins = edges.filter((e) => e.to === cur.id).sort((a, c) => c.value - a.value), outs = edges.filter((e) => e.from === cur.id).sort((a, c) => c.value - a.value);
    const list = (es: Edge[], side: "from" | "to") => es.map((e) => `${name(e[side])} ${k(e.value)}`).join(", ") || "none";
    const m = meta.get(cur.id);
    const details: Chunk[][] = [
      [fg(p.gray)("▸"), plain(p, " "), value(p, name(cur.id)), label(p, `  ${k(cur.value)}`), ...(m?.ref ? [plain(p, "  "), ref(p, `@${m.ref}`)] : [])],
      [label(p, "in     "), plain(p, list(ins, "from"))],
      [label(p, "out    "), plain(p, list(outs, "to"))],
    ];
    if (m?.note) details.push([label(p, "note   "), plain(p, m.note)]);

    const sources = boxes.filter((b) => !edges.some((e) => e.to === b.id)), sinks = boxes.filter((b) => !edges.some((e) => e.from === b.id));
    const answer: Chunk[] = [value(p, doc.title || section.name), label(p, ` · ${boxes.length} nodes · ${edges.length} flows · ${sources.map((b) => name(b.id)).slice(0, 3).join(", ")} → ${sinks.length} ends`)];
    const legend = legendRow(p, [["█", p.cat[0], "flow"], ["█", p.accent, "touches selected"]], width);
    return frameView(p, { title: section.name, viewName: "sankey", answer, rows, top: s.top, legend, details, keys: [["j k", "node"]] }, dims, at);
  },
} satisfies Chart<KS>;
