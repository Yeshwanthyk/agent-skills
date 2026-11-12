// waits: a wait-for table. One row per `waits` or `holds` line: waiter ─ waits ▸ resource (how long) ─ held by holder.
// A deadlock cycle is red, anyone stuck behind it is gold, and the answer line says which workers deadlock.
// j/k pick a row; the details show who holds what, the wait text, the cycle, the note and @ref.
import { bold, fg } from "@opentui/core";
import { GLYPH, label, plain, ref, value, type Chunk, type Palette } from "../style";
import type { Chart, Section } from "./index";
import { DETAIL_ROWS, chartSize, followTop, frameView, legendRow } from "./frame";

type Rel = { a: string; v: "holds" | "waits"; b: string; text: string; ref: string; note: string };
type TS = { sel: number; top: number };

const clip = (s: string, n: number) => (s.length > n ? s.slice(0, n - 1) + "…" : s.padEnd(n));

function model(section: Section) {
  const rel: Rel[] = section.rel ?? [], byId: Record<string, { label: string }> = section.graph?.byId ?? {};
  const name = (id: string) => (byId[id]?.label ?? id).replace(/\s*\[.*\]$/, "");
  const holder = new Map<string, string>(); for (const x of rel) if (x.v === "holds" && !holder.has(x.b)) holder.set(x.b, x.a);
  const cyc: string[][] = section.cycles ?? [], inCyc = new Set(cyc.flat()), stuck = new Set<string>(section.stuck ?? []);
  const state = (x: Rel) => (inCyc.has(x.a) && inCyc.has(x.b) ? "cycle" : x.v === "waits" && stuck.has(x.a) ? "stuck" : "");
  return { rel, name, holder, cyc, state };
}
const colour = (p: Palette, st: string) => (st === "cycle" ? p.bad : st === "stuck" ? p.cat[4] : p.text);

const chart: Chart<TS> = {
  init: () => ({ sel: 0, top: 0 }),

  key(section, s, k) {
    const n = (section.rel ?? []).length;
    if (k.name === "j" || k.name === "down") s.sel = Math.min(n - 1, s.sel + 1);
    else if (k.name === "k" || k.name === "up") s.sel = Math.max(0, s.sel - 1);
    else return false;
    return true;
  },

  render(p, section, s, dims, { doc, at }) {
    const { width, bodyRows } = chartSize(dims);
    const { rel, name, holder, cyc, state } = model(section);
    s.sel = Math.max(0, Math.min(rel.length - 1, s.sel));
    s.top = followTop(s.sel, s.top, bodyRows, rel.length);
    const AW = Math.min(Math.max(...rel.map((x) => name(x.a).length), 4), Math.max(6, Math.floor(width / 4)));
    const RW = Math.min(Math.max(...rel.map((x) => name(x.b).length), 4), Math.max(6, Math.floor(width / 4)));

    const rows = rel.map((x, i): Chunk[] => {
      const on = i === s.sel, st = state(x), c = colour(p, st), hd = holder.get(x.b);
      const who = clip(name(x.a), AW), res = clip(name(x.b), RW);
      const mid = x.v === "waits" ? " waits ▸ " : " holds ■ ";
      return [
        on ? fg(p.accent)("› ") : plain(p, "  "),
        on ? bold(fg(c)(who)) : fg(c)(who),
        x.v === "waits" ? fg(c)(mid) : label(p, mid),
        plain(p, res),
        ...(x.v === "waits" && x.text ? [label(p, "  "), fg(c)(x.text)] : []),
        ...(x.v === "waits" ? [label(p, hd ? `  held by ${name(hd)}` : "  nobody holds it")] : []),
        ...(x.ref ? [plain(p, "  "), ref(p, x.ref)] : []),
      ];
    });

    const x = rel[s.sel], details: Chunk[][] = [];
    if (x) {
      const hd = holder.get(x.b), st = state(x);
      details.push([fg(p.gray)(GLYPH.select), plain(p, " "), value(p, `${name(x.a)} ${x.v} ${name(x.b)}`),
        ...(st ? [fg(colour(p, st))(st === "cycle" ? "  deadlock" : "  stuck behind a deadlock")] : []),
        ...(x.ref ? [plain(p, "  "), ref(p, `${(doc as { base?: string }).base ?? ""}${x.ref}`)] : [])]);
      details.push([label(p, "wait  "), plain(p, x.v === "waits" ? (x.text || "no duration given") : "holds it until released"),
        ...(x.v === "waits" ? [label(p, hd ? `   held by ${name(hd)}` : "   no holder")] : [])]);
      if (x.note) details.push([label(p, "note  "), plain(p, x.note)]);
      const c = cyc.find((cy) => cy.includes(x.a) && cy.includes(x.b));
      if (c) details.push([label(p, "cycle "), fg(p.bad)([...c, c[0]].map(name).join(" → "))]);
    } else details.push([label(p, "no rows")]);

    const answer: Chunk[] = [fg(cyc.length ? p.bad : p.good)(section.say), ...(section.say2 ? [label(p, ` · ${section.say2}`)] : [])];
    const legend = legendRow(p, [["▸", p.text, "waits"], ["■", p.gray, "holds"], ...(cyc.length ? [["▸", p.bad, "deadlock"] as [string, string, string]] : []),
      ...((section.stuck ?? []).length ? [["▸", p.cat[4], "stuck"] as [string, string, string]] : [])], width);

    return frameView(p, {
      title: section.name, viewName: "waits", answer, rows, top: s.top, legend, details: details.slice(0, DETAIL_ROWS), keys: [["j k", "row"]],
    }, dims, at);
  },
};
export default chart;
