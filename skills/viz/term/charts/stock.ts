// stock: one level over time, a bar per point (█▌) coloured by the meter band it falls in (ok / at risk / worst),
// with the in/out flows in effect at that point and any note. j/k select a point; details show the band, flows,
// note and the stock's @ref. A cell sparkline of the whole run sits in the answer line.
import { fg, bold } from "@opentui/core";
import { label, plain, ref, value, type Chunk, type Palette } from "../style";
import type { Chart, Section } from "./index";
import { barRun, chartSize, followTop, frameView, legendRow } from "./frame";

type SS = { sel: number; top: number };
type Pt = { x: string; v: number; state: [string, string][]; note: string };
type Band = { a: number; b: number; label: string; tone: "ok" | "warn" | "fail" };

const k = (v: number) => (Math.abs(v) >= 1000 ? `${+(v / 1000).toFixed(1)}k` : String(+v.toFixed(1)));
const SPARK = "▁▂▃▄▅▆▇█";

function bandsOf(section: Section): Band[] {
  const t: { v: number; label: string }[] | undefined = section.meter?.ticks;
  return t ? t.slice(0, -1).map((x, j) => ({ a: x.v, b: t[j + 1].v, label: x.label, tone: j === 0 ? "ok" : j === t.length - 2 ? "fail" : "warn" })) : [];
}

export default {
  init: (section) => ({ sel: Math.max(0, (section.pts as Pt[]).reduce((m, x, i, a) => (x.v > a[m].v ? i : m), 0)), top: 0 }),

  key(section, s, key) {
    const n = (section.pts as Pt[]).length;
    if (key.name === "j" || key.name === "down") s.sel = Math.min(n - 1, s.sel + 1);
    else if (key.name === "k" || key.name === "up") s.sel = Math.max(0, s.sel - 1);
    else return false;
    return true;
  },

  render(p: Palette, section: Section, s: SS, dims, { doc, at }) {
    const { width, bodyRows } = chartSize(dims);
    const pts: Pt[] = section.pts, u: string = section.unit || "", bands = bandsOf(section);
    s.sel = Math.max(0, Math.min(pts.length - 1, s.sel));
    s.top = followTop(s.sel, s.top, bodyRows, pts.length);

    const lo = Math.min(0, ...pts.map((x) => x.v)), hi = Math.max(...pts.map((x) => x.v), bands.length ? bands[bands.length - 1].b : 0) || 1;
    const bandOf = (v: number) => bands.find((bd, j) => v >= bd.a && (v < bd.b || j === bands.length - 1));
    const colour = (v: number) => { const bd = bandOf(v); return !bd || bd.tone === "ok" ? p.cat[0] : bd.tone === "warn" ? p.cat[4] : p.bad; };
    const flow = (x: Pt) => x.state.map(([n, v]) => `${n} ${v}`).join("  ");
    const xW = Math.max(...pts.map((x) => x.x.length)), valW = Math.max(...pts.map((x) => `${k(x.v)}${u}`.length));
    const flowW = Math.max(0, ...pts.map((x) => flow(x).length));
    const barW = Math.max(8, Math.min(40, width - 2 - xW - 1 - 1 - valW - 2 - flowW - 2));

    const rows: Chunk[][] = pts.map((x, i) => {
      const on = i === s.sel, c = colour(x.v), v = `${k(x.v)}${u}`.padStart(valW);
      const prev = i ? pts[i - 1].state : [], changed = new Set(x.state.filter(([n, val]) => prev.find(([m]) => m === n)?.[1] !== val).map(([n]) => n));
      return [
        on ? fg(p.accent)("› ") : plain(p, "  "),
        on ? value(p, x.x.padEnd(xW)) : plain(p, x.x.padEnd(xW)), plain(p, " "),
        on ? bold(fg(c)(barRun(((x.v - lo) / (hi - lo)) * barW).padEnd(barW))) : fg(c)(barRun(((x.v - lo) / (hi - lo)) * barW).padEnd(barW)), plain(p, " "),
        on ? value(p, v) : plain(p, v), plain(p, "  "),
        ...x.state.flatMap(([n, val], j): Chunk[] => [
          ...(j ? [plain(p, "  ")] : []),
          label(p, `${n} `), changed.has(n) ? fg(/^in/i.test(n) ? p.good : /^out/i.test(n) ? p.cat[1] : p.text)(val) : label(p, val),
        ]),
        ...(x.note ? [label(p, `  # ${x.note}`)] : []),
      ];
    });

    const cur = pts[s.sel], bd = bandOf(cur.v);
    const details: Chunk[][] = [
      [fg(p.gray)("▸"), plain(p, " "), value(p, `${cur.x}  ${k(cur.v)}${u}`), ...(section.stock?.label ? [label(p, `  ${section.stock.label}`)] : []), ...(bd ? [fg(colour(cur.v))(`  ${bd.label || "top band"}`)] : [])],
      [label(p, "flow   "), plain(p, flow(cur) || "none")],
    ];
    if (cur.note) details.push([label(p, "note   "), plain(p, cur.note)]);
    const r = section.stock?.ref; if (r) details.push([label(p, "ref    "), ref(p, `@${r}`)]);

    const mx = Math.max(...pts.map((x) => x.v)), peak = pts.find((x) => x.v === mx)!;
    const spark = pts.map((x) => SPARK[Math.max(0, Math.min(7, Math.round(((x.v - lo) / (hi - lo)) * 7)))]).join("");
    const answer: Chunk[] = [value(p, section.stock?.label || doc.title || section.name), label(p, ` · peak ${k(mx)}${u} at ${peak.x} `), fg(p.cat[0])(spark)];

    const legend = bands.length
      ? legendRow(p, bands.map((b) => ["█", b.tone === "ok" ? p.cat[0] : b.tone === "warn" ? p.cat[4] : p.bad, `${b.label || "top"} ≥${k(b.a)}`] as [string, string, string]), width)
      : legendRow(p, [["█", p.cat[0], "level"]], width);
    return frameView(p, { title: section.name, viewName: "stock", answer, rows, top: s.top, legend, details, keys: [["j k", "point"]] }, dims, at);
  },
} satisfies Chart<SS>;
