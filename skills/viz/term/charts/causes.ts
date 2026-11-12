// causes: a ranked list of cause families. Families with the most ruled-in causes come first; each family row carries a bar
// with one cell per cause (red = ruled in, gold = open, gray = ruled out). enter folds a family, j/k select. The grammar has
// no numeric weights, so the bar shows how the family's causes stand rather than how much each counts.
import { bold, fg } from "@opentui/core";
import { label, plain, ref, value, type Chunk, type Palette } from "../style";
import type { Chart, Section } from "./index";
import { DETAIL_ROWS, chartSize, followTop, frameView, legendRow } from "./frame";

type Cause = { id: string; st: "in" | "out" | "open"; label: string; ref: string; note: string; fam: Fam };
type Fam = { label: string; causes: Cause[] };
type Row = { fam: Fam; cause?: Cause; rank: number };
type CS = { sel: number; top: number; fold: Set<Fam> };

const GLYPH = { in: "●", out: "✕", open: "○" }, WORD = { in: "ruled in", out: "ruled out", open: "open" };
const colour = (p: Palette, st: Cause["st"]) => (st === "in" ? p.bad : st === "open" ? p.cat[4] : p.gray);
const count = (f: Fam, st: Cause["st"]) => f.causes.filter((c) => c.st === st).length;

// Ranked: most ruled in, then most still open; ties keep the order the file gave.
export function ranked(section: Section): Fam[] {
  return (section.fams as Fam[]).map((f, i) => ({ f, i })).sort((a, b) => count(b.f, "in") - count(a.f, "in") || count(b.f, "open") - count(a.f, "open") || a.i - b.i).map((x) => x.f);
}
function flatten(section: Section, s: CS): Row[] {
  const rows: Row[] = [];
  ranked(section).forEach((fam, i) => {
    rows.push({ fam, rank: i + 1 });
    if (!s.fold.has(fam)) fam.causes.forEach((cause) => rows.push({ fam, cause, rank: i + 1 }));
  });
  return rows;
}

const chart: Chart<CS> = {
  init: () => ({ sel: 0, top: 0, fold: new Set() }),

  key(section, s, k) {
    const rows = flatten(section, s), cur = rows[s.sel];
    if (k.name === "j" || k.name === "down") s.sel = Math.min(rows.length - 1, s.sel + 1);
    else if (k.name === "k" || k.name === "up") s.sel = Math.max(0, s.sel - 1);
    else if (!cur) return false;
    else if (k.name === "return" || k.name === "enter") {
      if (s.fold.has(cur.fam)) s.fold.delete(cur.fam);
      else { s.fold.add(cur.fam); s.sel = flatten(section, s).findIndex((r) => r.fam === cur.fam && !r.cause); }   // stay on the folded family
    }
    else if (k.name === "right") s.fold.delete(cur.fam);
    else if (k.name === "left") {
      if (cur.cause) s.sel = rows.findIndex((r) => r.fam === cur.fam && !r.cause);
      else { s.fold.add(cur.fam); s.sel = flatten(section, s).findIndex((r) => r.fam === cur.fam && !r.cause); }
    } else return false;
    s.sel = Math.max(0, Math.min(flatten(section, s).length - 1, s.sel));
    return true;
  },

  render(p, section, s, dims, { doc, at }) {
    const { width, bodyRows } = chartSize(dims);
    const rows = flatten(section, s), fams = ranked(section), all = fams.flatMap((f) => f.causes);
    s.sel = Math.max(0, Math.min(rows.length - 1, s.sel));
    s.top = followTop(s.sel, s.top, bodyRows, rows.length);
    const eff = (section.effect as { label: string; note: string } | null) ?? { label: section.name, note: "" };
    const nameW = Math.max(...fams.map((f) => f.label.length), 6), barW = Math.max(...fams.map((f) => f.causes.length), 1);

    const body = rows.map(({ fam, cause, rank }, i): Chunk[] => {
      const on = i === s.sel, pre = on ? fg(p.accent)("› ") : plain(p, "  ");
      if (!cause) {
        const bar: Chunk[] = fam.causes.map((c) => fg(colour(p, c.st))(c.st === "out" ? "▪" : "█"));
        return [pre, label(p, `${rank} `), label(p, s.fold.has(fam) ? "▸ " : "▾ "), on ? bold(fg(p.text)(fam.label.padEnd(nameW))) : value(p, fam.label.padEnd(nameW)),
          plain(p, "  "), ...bar, label(p, " ".repeat(barW - fam.causes.length)), label(p, `  ${count(fam, "in")} in · ${count(fam, "open")} open · ${count(fam, "out")} out`)];
      }
      const c = colour(p, cause.st), text = cause.st === "out" ? fg(p.gray)(cause.label) : on ? bold(fg(p.text)(cause.label)) : plain(p, cause.label);
      return [pre, label(p, "    "), label(p, "└ "), fg(c)(GLYPH[cause.st]), plain(p, " "), text,
        ...(cause.ref ? [plain(p, "  "), ref(p, cause.ref)] : []), ...(cause.note ? [label(p, `  # ${cause.note}`)] : [])];
    });

    const cur = rows[s.sel], details: Chunk[][] = [];
    if (cur?.cause) {
      const c = cur.cause, base = (doc as { base?: string }).base ?? "";
      details.push([fg(colour(p, c.st))(GLYPH[c.st]), plain(p, " "), value(p, c.label), label(p, `  ${WORD[c.st]} · ${c.fam.label}`), ...(c.ref ? [plain(p, "  "), ref(p, `${base}${c.ref}`)] : [])]);
      if (c.note) details.push([label(p, "why   "), plain(p, c.note)]);
    } else if (cur) {
      const f = cur.fam;
      details.push([fg(p.gray)("▸"), plain(p, " "), value(p, f.label), label(p, `  family · ${f.causes.length} cause${f.causes.length === 1 ? "" : "s"}`)]);
      details.push([label(p, "state "), plain(p, `${count(f, "in")} ruled in, ${count(f, "open")} open, ${count(f, "out")} ruled out`)]);
    } else details.push([label(p, "no causes")]);

    const n = (st: Cause["st"]) => all.filter((c) => c.st === st).length;
    const answer: Chunk[] = [value(p, eff.label), label(p, ` · ${n("in")} in · ${n("out")} out · ${n("open")} still open`), ...(eff.note ? [label(p, `  # ${eff.note}`)] : [])];
    return frameView(p, {
      title: section.name, viewName: "causes", answer, rows: body, top: s.top,
      legend: legendRow(p, [["●", p.bad, "ruled in"], ["○", p.cat[4], "open"], ["✕", p.gray, "ruled out"], ["▾", p.gray, "open fold"]], width),
      details: details.slice(0, DETAIL_ROWS), keys: [["j k", "row"], ["enter", "fold"], ["← →", "close/open"]],
    }, dims, at);
  },
};
export default chart;
