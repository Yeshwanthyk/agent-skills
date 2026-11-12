// retries: one lane per client on a shared time axis. Each attempt is a glyph at its start (━ spans an attempt that takes
// time): ✓ succeeded, ✕ failed, ! warned, ● untoned. A gray ┊ marks `giveup:`. Under each lane the backoff gaps read
// `+1 +2.2 +4.3`; a gap off the `policy:` window is gold (early) or red (late). j/k pick a client, ← → pick an attempt.
// The HTML also shades the expected window and draws a pile-up strip; here that is text (policy range in the details).
import { bold, fg } from "@opentui/core";
import { label, plain, ref, value, type Chunk, type Palette } from "../style";
import type { Chart, Section } from "./index";
import { DETAIL_ROWS, axis, chartSize, followTop, frameView, legendRow, scale, fmt } from "./frame";

type At = { a: number; b: number; tone: string; label: string; gap?: number; exp?: [number, number]; off?: string };
type Lane = { id: string; label: string; ref: string; note: string; at: At[] };
type RS = { lane: number; att: number[]; top: number };

const MARK: Record<string, string> = { ok: "✓", fail: "✕", warn: "!", unk: "○", "": "●" };
const colour = (p: Palette, tone: string) => (tone === "ok" ? p.good : tone === "fail" ? p.bad : tone === "warn" ? p.cat[4] : tone === "unk" ? p.gray : p.text);
const lanes = (s: Section): Lane[] => (s.lanes as Lane[]).filter((l) => l.at.length);

function domain(s: Section) {
  const all = lanes(s).flatMap((l) => l.at), lo = Math.min(0, ...all.map((x) => x.a));
  const far = Math.max(...all.map((x) => x.b), ...all.flatMap((x) => (x.exp ? [x.exp[1]] : [])), s.giveup ?? -Infinity);
  return { lo, hi: far + (far - lo) * 0.06 || 1 };
}

const chart: Chart<RS> = {
  init: () => ({ lane: 0, att: [], top: 0 }),
  key(section, s, k) {
    const ls = lanes(section);
    if (k.name === "j" || k.name === "down") s.lane = Math.min(ls.length - 1, s.lane + 1);
    else if (k.name === "k" || k.name === "up") s.lane = Math.max(0, s.lane - 1);
    else if (k.name === "right" || k.name === "l") s.att[s.lane] = Math.min(ls[s.lane].at.length - 1, (s.att[s.lane] ?? 0) + 1);
    else if (k.name === "left" || k.name === "h") s.att[s.lane] = Math.max(0, (s.att[s.lane] ?? 0) - 1);
    else return false;
    return true;
  },

  render(p, section, s, dims, { doc, at }) {
    const { width, bodyRows } = chartSize(dims), ls = lanes(section), all = ls.flatMap((l) => l.at), u = section.unit ? ` ${section.unit}` : "";
    s.lane = Math.max(0, Math.min(ls.length - 1, s.lane));
    ls.forEach((l, i) => (s.att[i] = Math.max(0, Math.min(l.at.length - 1, s.att[i] ?? 0))));
    const { lo, hi } = domain(section), nameW = Math.min(18, Math.max(...ls.map((l) => l.label.length), 6)), lead = 2 + nameW + 1;
    const cols = Math.max(12, width - lead - 1), X = scale(lo, hi, cols), gap = section.giveup != null ? X(section.giveup) : -1;

    const rows: Chunk[][] = [];
    ls.forEach((l, i) => {
      const on = i === s.lane, cells: Chunk[] = Array(cols).fill(null), put = (c: number, ch: Chunk) => { cells[c] = ch; };
      const c0 = X(l.at[0].a), c1 = X(l.at[l.at.length - 1].b);
      for (let c = c0; c <= c1; c++) put(c, fg(p.gray)("─"));
      l.at.forEach((x, k) => {
        const col = colour(p, x.tone), sel = on && k === s.att[i];
        for (let c = X(x.a) + 1; c <= X(x.b); c++) put(c, fg(col)("━"));
        put(X(x.a), sel ? bold(fg(p.accent)(MARK[x.tone] ?? "●")) : fg(col)(MARK[x.tone] ?? "●"));
      });
      const line: Chunk[] = cells.map((c, j) => c ?? (j === gap ? fg(p.bad)("┊") : plain(p, " ")));
      rows.push([on ? fg(p.accent)("› ") : plain(p, "  "), on ? bold(fg(p.text)(l.label.slice(0, nameW).padEnd(nameW))) : value(p, l.label.slice(0, nameW).padEnd(nameW)), plain(p, " "), ...line]);
      const gaps: Chunk[] = [plain(p, " ".repeat(lead))];
      l.at.forEach((x, k) => {
        if (!k || x.gap == null) return;
        gaps.push(x.off === "early" ? fg(p.cat[4])(`+${fmt(+x.gap.toFixed(2))}`) : x.off === "late" ? fg(p.bad)(`+${fmt(+x.gap.toFixed(2))}`) : label(p, `+${fmt(+x.gap.toFixed(2))}`), plain(p, " "));
      });
      rows.push(gaps.length > 1 ? gaps : [label(p, " ".repeat(lead) + "single attempt")]);
    });
    rows.push([label(p, " ".repeat(lead - 1) + axis(lo, hi, cols + 1 - u.length, fmt, Math.max(2, Math.floor(cols / 10)))), label(p, u)]);

    const selRow = s.lane * 2;
    s.top = followTop(selRow, s.top, bodyRows, rows.length);

    const L = ls[s.lane], x = L.at[s.att[s.lane]], base = (doc as { base?: string }).base ?? "", details: Chunk[][] = [];
    details.push([fg(colour(p, x.tone))(MARK[x.tone] ?? "●"), plain(p, " "), value(p, `${L.label}, attempt ${s.att[s.lane] + 1}/${L.at.length}`), ...(x.label ? [label(p, `  ${x.label}`)] : []), ...(L.ref ? [plain(p, "  "), ref(p, `${base}${L.ref}`)] : [])]);
    details.push([label(p, "at    "), plain(p, `${fmt(x.a)}${u}${x.b > x.a ? ` for ${fmt(+(x.b - x.a).toFixed(2))}${u}` : ""}`), ...(x.gap != null ? [label(p, `  · ${fmt(+x.gap.toFixed(2))}${u} after the last`)] : [])]);
    if (x.exp) details.push([label(p, "policy "), plain(p, `${+x.exp[0].toFixed(1)}..${+x.exp[1].toFixed(1)}${u}`), ...(x.off ? [fg(x.off === "early" ? p.cat[4] : p.bad)(`  ${x.off}`)] : [label(p, "  on policy")])]);
    if (L.note) details.push([label(p, "note  "), plain(p, L.note)]);

    const okN = ls.filter((l) => l.at[l.at.length - 1].tone === "ok").length, offN = all.filter((a) => a.off).length;
    const max = section.max as number | null, tooMany = max != null ? ls.filter((l) => l.at.length > max).length : 0;
    const late = section.giveup != null ? all.filter((a) => a.a > section.giveup).length : 0;
    const answer: Chunk[] = [value(p, `${all.length} attempts · ${okN}/${ls.length} succeed`)];
    const extra = [offN ? `${offN} off policy` : "", tooMany ? `${tooMany} past max ${max}` : "", late ? `${late} after give-up` : ""].filter(Boolean).join(" · ");
    if (extra) answer.push(label(p, ` · ${extra}`));

    return frameView(p, {
      title: section.name, viewName: "retries", answer, rows, top: s.top,
      legend: legendRow(p, [["✓", p.good, "ok"], ["✕", p.bad, "failed"], ["┊", p.bad, "give up"], ["+n", p.gray, "gap"]], width),
      details: details.slice(0, DETAIL_ROWS), keys: [["j k", "client"], ["← →", "attempt"]],
    }, dims, at);
  },
};
export default chart;
