// timing: one row per lane over a shared time axis. Bars (█) are segments in tone colours, quiet stretches are a ┈ wire,
// `!name: a..b text` windows are ▒ rows under the lanes. j/k pick a row, ← → pick a segment in a lane.
// The axis is pinned under the rows; the details show the picked segment's start, end, duration, note and @ref.
import { bold, fg } from "@opentui/core";
import { GLYPH, label, plain, ref, value, type Chunk, type Palette } from "../style";
import type { Chart, Section } from "./index";
import { DETAIL_ROWS, axis, chunksOf, fmt, niceHi, paint, tone, type Cell, barRun, chartSize, followTop, frameView, legendRow, scale } from "./frame";

type Seg = { t: number; b: number; label: string; tone: string; quiet: boolean };
type Row = { kind: "lane" | "mark"; name: string; ref: string; note: string; segs: Seg[]; tone: string; text: string };
type TS = { sel: number; seg: number; top: number };


function model(section: Section) {
  const lanes: any[] = section.lanes ?? [], marks: any[] = section.marks ?? [];
  const ts = lanes.flatMap((l) => l.segs.map((x: any) => x.t)), ms = marks.flatMap((m) => [m.a, m.b]);
  const lo = section.lo ?? Math.min(...ts, ...ms), far = Math.max(...ts, ...ms);
  const hi = section.hi ?? niceHi(lo, far + (far - lo) * 0.12 || lo + 1);
  const rows: Row[] = [
    ...lanes.map((l): Row => ({
      kind: "lane", name: l.label, ref: l.ref, note: l.note, tone: "", text: "",
      segs: l.segs.map((x: any, j: number): Seg => ({ t: x.t, b: j + 1 < l.segs.length ? l.segs[j + 1].t : hi, label: x.label, tone: x.tone, quiet: x.quiet })),
    })),
    ...marks.map((m): Row => ({ kind: "mark", name: m.name, ref: "", note: "", tone: m.tone, text: m.text, segs: [{ t: m.a, b: m.b, label: m.text || m.name, tone: m.tone, quiet: false }] })),
  ];
  return { rows, lo, hi, unit: section.unit as string };
}


const chart: Chart<TS> = {
  init: () => ({ sel: 0, seg: 0, top: 0 }),

  key(section, s, k) {
    const { rows } = model(section);
    const nseg = rows[s.sel]?.segs.length ?? 1;
    if (k.name === "j" || k.name === "down") { s.sel = Math.min(rows.length - 1, s.sel + 1); s.seg = 0; }
    else if (k.name === "k" || k.name === "up") { s.sel = Math.max(0, s.sel - 1); s.seg = 0; }
    else if (k.name === "right" || k.name === "l") s.seg = Math.min(nseg - 1, s.seg + 1);
    else if (k.name === "left" || k.name === "h") s.seg = Math.max(0, s.seg - 1);
    else return false;
    return true;
  },

  render(p, section, s, dims, { doc, at }) {
    const { width, bodyRows } = chartSize(dims);
    const { rows, lo, hi, unit } = model(section);
    s.sel = Math.max(0, Math.min(rows.length - 1, s.sel));
    s.seg = Math.max(0, Math.min((rows[s.sel]?.segs.length ?? 1) - 1, s.seg));
    const LW = Math.min(Math.max(...rows.map((r) => r.name.length), unit?.length ?? 0, 4), Math.max(6, Math.floor(width / 4)));
    const prefix = 2 + LW + 1, cols = Math.max(10, width - prefix);
    const col = scale(lo, hi, cols), span = hi - lo || 1;

    const lines = rows.map((r, i): Chunk[] => {
      const on = i === s.sel, cells: Cell[] = Array.from({ length: cols }, () => ({ ch: " ", c: "" }));
      r.segs.forEach((x, j) => {
        const c = tone(p, x.tone || r.tone), c0 = col(x.t), len = Math.max(1, ((x.b - x.t) / span) * (cols - 1)), hot = on && j === s.seg;
        if (r.kind === "mark") paint(cells, c0, "▒".repeat(Math.max(1, col(x.b) - c0 + 1)), c);
        else if (x.quiet) paint(cells, c0, "┈".repeat(Math.max(1, Math.round(len))), hot ? p.text : p.gray, hot);
        else paint(cells, c0, barRun(len > 2 ? len - 1 : len) || "▌", c, hot);
        if (r.kind === "mark" && r.text) {
          const right = col(x.b) + 2, left = c0 - r.text.length - 2;                  // beside the window, or dropped (the details have it)
          if (right + r.text.length <= cols) paint(cells, right, r.text, c); else if (left >= 0) paint(cells, left, r.text, c);
        }
      });
      const name = r.name.length > LW ? r.name.slice(0, LW - 1) + "…" : r.name.padEnd(LW);
      const c = r.kind === "mark" ? tone(p, r.tone) : p.text;
      return [on ? fg(p.accent)("› ") : plain(p, "  "), on ? bold(fg(c)(name)) : r.kind === "mark" ? fg(c)(name) : plain(p, name), plain(p, " "), ...chunksOf(p, cells)];
    });

    const pad = " ".repeat(prefix), axisRows: Chunk[][] = [
      [label(p, pad + "└" + "─".repeat(cols - 1))],
      [label(p, (unit ? unit.padStart(prefix - 1) + " " : pad) + axis(lo, hi, cols, fmt))],
    ];
    const avail = Math.max(1, bodyRows - axisRows.length);
    s.top = followTop(s.sel, s.top, avail, lines.length);
    const clipped = lines.length > avail;

    const r = rows[s.sel], x = r?.segs[s.seg], u = unit ? ` ${unit}` : "";
    const details: Chunk[][] = [];
    if (r && x) {
      details.push([fg(p.gray)(GLYPH.select), plain(p, " "), value(p, r.name), ...(r.ref ? [plain(p, "  "), ref(p, `${(doc as { base?: string }).base ?? ""}${r.ref}`)] : [])]);
      details.push([label(p, r.kind === "lane" ? "segment " : "window  "), plain(p, `${fmt(x.t)}..${fmt(x.b)}${u}  (${fmt(x.b - x.t)}${u})`),
        ...(x.label ? [label(p, "  "), fg(tone(p, x.tone))(x.label)] : [])]);
      if (r.note) details.push([label(p, "note    "), plain(p, r.note)]);
      if (r.kind === "lane") details.push([label(p, "lane    "), label(p, r.segs.map((y) => `${fmt(y.t)} ${y.label || "·"}`).join(" → "))]);
    } else details.push([label(p, "no rows")]);

    const fails = rows.filter((y) => y.kind === "mark" && y.tone === "fail");
    const answer: Chunk[] = [value(p, doc.title || section.name), label(p, ` · ${section.lanes.length} lanes`),
      ...(section.marks?.length ? [label(p, ` · ${section.marks.length} windows`)] : []),
      ...(fails.length ? [fg(p.bad)(`  ${fails.map((y) => y.text || y.name).join(" · ")}`)] : [])];
    const used = new Set(rows.flatMap((y) => y.segs.map((z) => z.tone || y.tone)));
    const legend = legendRow(p, [
      ["█", p.cat[0], "running"],
      ...(["ok", "fail", "warn", "unk"] as const).filter((t) => used.has(t)).map((t): [string, string, string] => ["█", tone(p, t), t === "ok" ? "ok" : t === "fail" ? "fails" : t === "warn" ? "at risk" : "unknown"]),
      ["┈", p.gray, "quiet"], ...(section.marks?.length ? [["▒", p.bad, "window"] as [string, string, string]] : []),
    ], width);

    return frameView(p, {
      title: section.name, viewName: "timing", answer, rows: [...lines.slice(s.top, s.top + avail), ...axisRows], top: 0, legend,
      details: details.slice(0, DETAIL_ROWS), keys: [["j k", "row"], ["← →", "segment"]],
      hint: clipped ? `rows ${s.top + 1}-${Math.min(lines.length, s.top + avail)} of ${lines.length}` : "",
    }, dims, at);
  },
};
export default chart;
