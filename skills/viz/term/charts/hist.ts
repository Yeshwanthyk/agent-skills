// hist: a latency distribution as horizontal bars (█▌), one row per bucket, with a % axis underneath. Bars past
// `budget:` are red; `was:` buckets show as a ┆ marker and "was N%". j/k select a bucket; details give its range,
// count, share and the share at or under it. Percentiles (p50/p90/p99, ≈ when interpolated) sit in the answer line.
import { fg, bold } from "@opentui/core";
import { label, plain, value, type Chunk, type Palette } from "../style";
import type { Chart, Section } from "./index";
import { axis, barRun, chartSize, followTop, frameView, legendRow } from "./frame";

type HS = { sel: number; top: number };
type Bucket = { le: number; c: number };

const k = (v: number) => (Math.abs(v) >= 1000 ? `${+(v / 1000).toFixed(1)}k` : String(+v.toFixed(v < 10 ? 1 : 0)));
const pct = (f: number) => `${+(f * 100).toFixed(1)}%`;

export default {
  init: () => ({ sel: 0, top: 0 }),

  key(section, s, key) {
    const n = (section.b as Bucket[]).length;
    if (key.name === "j" || key.name === "down") s.sel = Math.min(n - 1, s.sel + 1);
    else if (key.name === "k" || key.name === "up") s.sel = Math.max(0, s.sel - 1);
    else return false;
    return true;
  },

  render(p: Palette, section: Section, s: HS, dims, { doc, at }) {
    const { width, bodyRows } = chartSize(dims);
    const b: Bucket[] = section.b, was: Bucket[] | null = section.was, total: number = section.total || 1;
    const u: string = section.unit || "", budget: number | null = section.budget;
    s.sel = Math.max(0, Math.min(b.length - 1, s.sel));
    s.top = followTop(s.sel, s.top, bodyRows - 1, b.length);

    const share = b.map((x) => x.c / total);
    const wTot = was ? was.reduce((a, x) => a + x.c, 0) || 1 : 1;
    const wShare = new Map<number, number>((was ?? []).map((x) => [x.le, x.c / wTot]));
    const lo = (i: number) => (i ? b[i - 1].le : 0);
    const names = b.map((x, i) => `${k(lo(i))}–${k(x.le)}`), nameW = Math.max(...names.map((n) => n.length));
    const valW = 6 + (was ? 12 : 0);
    const barW = Math.max(6, width - 2 - nameW - 1 - 1 - valW);
    const top = Math.max(...share, ...wShare.values()) * 1.05 || 1;
    const at_ = (f: number) => Math.max(0, Math.min(barW - 1, Math.round((f / top) * barW)));

    const rows: Chunk[][] = b.map((x, i) => {
      const on = i === s.sel, over = budget != null && lo(i) >= budget, c = over ? p.bad : p.cat[0];
      const bar = barRun((share[i] / top) * barW).padEnd(barW, " ").split("");
      const w = wShare.get(x.le);
      const tail: Chunk[] = [];
      if (w != null) { const col = at_(w); if (bar[col] === " ") bar[col] = "┆"; tail.push(label(p, ` was ${pct(w)}`)); }
      const solid = bar.join("").replace(/[┆ ]+$/, ""), rest = bar.join("").slice(solid.length);
      return [
        on ? fg(p.accent)("› ") : plain(p, "  "),
        on ? value(p, names[i].padEnd(nameW)) : plain(p, names[i].padEnd(nameW)), plain(p, " "),
        on ? bold(fg(c)(solid)) : fg(c)(solid), label(p, rest), plain(p, " "),
        on ? value(p, pct(share[i]).padStart(6)) : plain(p, pct(share[i]).padStart(6)), ...tail,
      ];
    });
    rows.push([plain(p, " ".repeat(2 + nameW + 1)), label(p, axis(0, top * 100, barW, (v) => `${+v.toFixed(v < 10 ? 1 : 0)}%`))]);

    const x = b[s.sel], cum = b.slice(0, s.sel + 1).reduce((a, y) => a + y.c, 0);
    const details: Chunk[][] = [
      [fg(p.gray)("▸"), plain(p, " "), value(p, `${names[s.sel]}${u}`), label(p, `  ${k(x.c)} samples · ${pct(share[s.sel])}`)],
      [label(p, "cumul  "), plain(p, `${pct(cum / total)} at or under ${k(x.le)}${u}`)],
    ];
    const w = wShare.get(x.le);
    if (w != null) details.push([label(p, "was    "), plain(p, `${pct(w)} (${w > share[s.sel] ? "fewer" : "more"} now)`)]);
    if (budget != null) details.push([label(p, "budget "), fg(lo(s.sel) >= budget ? p.bad : p.gray)(`${budget}${u}${lo(s.sel) >= budget ? " · bucket is over" : ""}`)]);

    const answer: Chunk[] = [value(p, doc.title || section.name), label(p, ` · ${k(total)} samples${u ? ` · ${u}` : ""}`)];
    for (const q of section.ps as { q: number; v: number; tone: string; measured: boolean }[])
      answer.push(fg(q.tone === "fail" ? p.bad : p.gray)(` p${q.q} ${q.measured ? "" : "≈"}${k(q.v)}${u}`));

    const legend = legendRow(p, [["█", p.cat[0], "samples"], ...(budget != null ? [["█", p.bad, `over ${budget}${u}`] as [string, string, string]] : []), ...(was ? [["┆", p.gray, "was"] as [string, string, string]] : [])], width);
    return frameView(p, { title: section.name, viewName: "hist", answer, rows, top: s.top, legend, details, keys: [["j k", "bucket"]] }, dims, at);
  },
} satisfies Chart<HS>;
