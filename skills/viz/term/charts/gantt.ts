// gantt: one bar per row over a shared time axis. The critical path is filled in the accent colour, slack is a dotted
// ┄ run after the bar, `budget:` is a ┆ line, and a `was` run is a ╌ ghost under the new bar. j/k pick a row.
// The axis is pinned under the rows; the details show start, end, duration, what it waits on, slack, note and @ref.
import { bold, fg } from "@opentui/core";
import { GLYPH, label, plain, ref, value, type Chunk, type Palette } from "../style";
import type { Chart, Section } from "./index";
import { DETAIL_ROWS, axis, chunksOf, fmt, niceHi, paint, tone, type Cell, barRun, chartSize, followTop, frameView, legendRow, scale } from "./frame";

type TS = { sel: number; top: number };


const chart: Chart<TS> = {
  init: () => ({ sel: 0, top: 0 }),

  key(section, s, k) {
    const n = section.rows.length;
    if (k.name === "j" || k.name === "down") s.sel = Math.min(n - 1, s.sel + 1);
    else if (k.name === "k" || k.name === "up") s.sel = Math.max(0, s.sel - 1);
    else return false;
    return true;
  },

  render(p, section, s, dims, { doc, at }) {
    const { width, bodyRows } = chartSize(dims);
    const rows: any[] = section.rows, crit: Set<any> = section.crit, by: Record<string, any> = section.by ?? {};
    const cmp = !!section.cmp, budget: number | null = section.budget, unit: string = section.unit, u = unit ? ` ${unit}` : "";
    const lo = Math.min(0, ...rows.map((r) => r.a)), hi = niceHi(lo, Math.max(section.end, section.oend || 0, budget || 0) * (cmp ? 1.1 : 1.04) || 1);
    s.sel = Math.max(0, Math.min(rows.length - 1, s.sel));
    const LW = Math.min(Math.max(...rows.map((r) => r.label.length), unit?.length ?? 0, 4), Math.max(6, Math.floor(width / 4)));
    const prefix = 2 + LW + 1, cols = Math.max(12, width - prefix), tcols = Math.max(8, cols - 9);   // the last 9 cells hold the duration label
    const col = scale(lo, hi, tcols), span = hi - lo || 1;
    const isCrit = (r: any) => crit.has(r) && (crit.size > 1 || rows.length === 1 || rows.some((x) => x.after.length));

    const lines = rows.map((r, i): Chunk[] => {
      const on = i === s.sel, cells: Cell[] = Array.from({ length: cols }, () => ({ ch: " ", c: "" }));
      const cells_ = (a: number, b: number) => Math.max(1, ((b - a) / span) * (tcols - 1));
      const c0 = col(r.a), len = cells_(r.a, r.b), end = c0 + Math.round(len);
      if (cmp) paint(cells, col(r.oa), "╌".repeat(Math.max(1, Math.round(cells_(r.oa, r.ob)))), p.gray);
      if (r.slack > 0) paint(cells, end, "┄".repeat(Math.max(0, col(r.b + r.slack) - end)), p.gray);
      if (budget != null) { const bc = col(budget); if (cells[bc].ch === " ") cells[bc] = { ch: "┆", c: p.bad }; }
      const c = isCrit(r) ? p.accent : r.st ? tone(p, r.st) : p.cat[0];
      paint(cells, c0, barRun(len) || "▌", c, on);
      const tail = ` ${fmt(r.b - r.a)}${u}`, dd = cmp ? r.b - r.a - (r.ob - r.oa) : 0;
      paint(cells, Math.max(end, cmp ? col(r.ob) + 1 : 0), tail, p.gray);
      if (dd) paint(cells, Math.max(end, cmp ? col(r.ob) + 1 : 0) + tail.length + 1, `${dd > 0 ? "+" : "−"}${fmt(Math.abs(dd))}`, dd > 0 ? p.bad : p.good);
      const name = r.label.length > LW ? r.label.slice(0, LW - 1) + "…" : r.label.padEnd(LW);
      return [on ? fg(p.accent)("› ") : plain(p, "  "), on ? bold(fg(p.text)(name)) : isCrit(r) ? plain(p, name) : label(p, name), plain(p, " "), ...chunksOf(p, cells)];
    });

    const pad = " ".repeat(prefix), axisRows: Chunk[][] = [
      [label(p, pad + "└" + "─".repeat(cols - 1))],
      [label(p, (unit ? unit.padStart(prefix - 1) + " " : pad) + axis(lo, hi, tcols, fmt))],
    ];
    const avail = Math.max(1, bodyRows - axisRows.length);
    s.top = followTop(s.sel, s.top, avail, lines.length);

    const r = rows[s.sel], details: Chunk[][] = [];
    if (r) {
      details.push([fg(p.gray)(GLYPH.select), plain(p, " "), value(p, r.label), ...(r.st ? [fg(tone(p, r.st))(`  ${r.st === "ok" ? "done" : r.st === "fail" ? "fails" : r.st === "warn" ? "at risk" : "unverified"}`)] : []),
        ...(r.ref ? [plain(p, "  "), ref(p, `${(doc as { base?: string }).base ?? ""}${r.ref}`)] : [])]);
      details.push([label(p, "time  "), plain(p, `${fmt(r.a)}..${fmt(r.b)}${u}  (${fmt(r.b - r.a)}${u})`),
        ...(cmp ? [label(p, `   was ${fmt(r.oa)}..${fmt(r.ob)}${u} (${fmt(r.ob - r.oa)}${u})`)] : [])]);
      const facts = [r.after.length ? "after " + r.after.map((d: string) => by[d]?.label ?? d).join(", ") : "", isCrit(r) ? "on the critical path" : r.slack > 0 ? `slack ${fmt(r.slack)}${u}` : ""].filter(Boolean);
      if (facts.length) details.push([label(p, "chain "), plain(p, facts.join(" · "))]);
      if (r.note) details.push([label(p, "note  "), plain(p, r.note)]);
    } else details.push([label(p, "no rows")]);

    const over = budget != null && section.end > budget;
    const answer: Chunk[] = [value(p, `${fmt(section.end)}${u}`),
      ...(cmp ? [label(p, ` · was ${fmt(section.oend)} (${section.end >= section.oend ? "+" : "−"}${fmt(Math.abs(section.end - section.oend))})`)] : []),
      ...(budget != null ? [fg(over ? p.bad : p.good)(`  budget ${fmt(budget)}${u} · ${over ? "over by " + fmt(section.end - budget) : fmt(budget - section.end) + " to spare"}`)]
        : crit.size > 1 ? [label(p, `  critical: ${[...crit].reverse().map((x: any) => x.label).join(" → ")}`)] : [])];
    const legend = legendRow(p, [
      ...(crit.size > 1 ? [["█", p.accent, "critical path"] as [string, string, string]] : []), ["█", p.cat[0], "other"], ["┄", p.gray, "slack"],
      ...(budget != null ? [["┆", p.bad, "budget"] as [string, string, string]] : []), ...(cmp ? [["╌", p.gray, "was"] as [string, string, string]] : []),
    ], width);

    return frameView(p, {
      title: section.name, viewName: "gantt", answer, rows: [...lines.slice(s.top, s.top + avail), ...axisRows], top: 0, legend,
      details: details.slice(0, DETAIL_ROWS), keys: [["j k", "row"]],
      hint: lines.length > avail ? `rows ${s.top + 1}-${Math.min(lines.length, s.top + avail)} of ${lines.length}` : "",
    }, dims, at);
  },
};
export default chart;
