// tree (and, via diff.ts, diff): the parsed call tree as rows with ├─ └─ │ branches. j/k select, enter folds,
// right opens, left closes (or jumps to the parent). Markers + - ~ ! colour the rows; `gutter` adds the line numbers.
import { bold, fg } from "@opentui/core";
import { GLYPH, label, plain, ref, value, type Chunk, type Palette } from "../style";
import type { Chart, Section } from "./index";
import { DETAIL_ROWS, chartSize, followTop, frameView, legendRow } from "./frame";

type Nd = { label: string; ref: string; note: string; st: string; depth: number; n: number; kids: Nd[]; parent: Nd; changed: boolean };
type Row = { nd: Nd; guides: string };
type TS = { sel: number; top: number; open: Map<Nd, boolean>; hint: string };

const WORD: Record<string, string> = { add: "added", del: "removed", mod: "changed", fail: "fails", active: "active", unk: "unverified" };
const MARK: Record<string, string> = { add: "+", del: "−", mod: "~", fail: "!", active: "*", unk: "?" };
const colour = (p: Palette, st: string) =>
  st === "add" ? p.good : st === "del" || st === "fail" ? p.bad : st === "mod" ? p.cat[4] : st === "active" ? p.accent : p.gray;

const isOpen = (s: TS, nd: Nd) => s.open.get(nd) ?? (nd.depth < 2 || nd.changed);
function flatten(section: Section, s: TS): Row[] {
  const rows: Row[] = [];
  const walk = (nd: Nd, guides: string, last: boolean) => {
    rows.push({ nd, guides: nd.depth === 0 ? "" : guides + (last ? "└─ " : "├─ ") });
    if (!isOpen(s, nd)) return;
    const next = nd.depth === 0 ? "" : guides + (last ? "   " : "│  ");
    nd.kids.forEach((k, i) => walk(k, next, i === nd.kids.length - 1));
  };
  section.root.kids.forEach((k: Nd) => walk(k, "", false));
  return rows;
}
const all = (section: Section) => { const out: Nd[] = []; const w = (n: Nd) => n.kids.forEach((k) => (out.push(k), w(k))); w(section.root); return out; };

export function createTreeChart(opts: { gutter: boolean }): Chart<TS> {
  return {
    init: () => ({ sel: 0, top: 0, open: new Map(), hint: "" }),

    key(section, s, k) {
      const rows = flatten(section, s), cur = rows[s.sel]?.nd;
      s.hint = "";
      if (k.name === "j" || k.name === "down") s.sel = Math.min(rows.length - 1, s.sel + 1);
      else if (k.name === "k" || k.name === "up") s.sel = Math.max(0, s.sel - 1);
      else if (!cur) return false;
      else if (k.name === "return" || k.name === "enter") { if (cur.kids.length) s.open.set(cur, !isOpen(s, cur)); }
      else if (k.name === "right") { if (cur.kids.length) s.open.set(cur, true); }
      else if (k.name === "left") {
        if (cur.kids.length && isOpen(s, cur)) s.open.set(cur, false);
        else if (cur.parent?.depth >= 0) s.sel = Math.max(0, rows.findIndex((r) => r.nd === cur.parent));
      } else return false;
      s.sel = Math.max(0, Math.min(flatten(section, s).length - 1, s.sel));   // a fold may have removed rows below
      return true;
    },

    render(p, section, s, dims, { doc, at }) {
      const { width, bodyRows } = chartSize(dims);
      const rows = flatten(section, s), nodes = all(section);
      s.sel = Math.max(0, Math.min(rows.length - 1, s.sel));
      s.top = followTop(s.sel, s.top, bodyRows, rows.length);
      const anyChange = nodes.some((n) => n.st), markCol = anyChange || opts.gutter;
      const gutterW = opts.gutter ? String(Math.max(...nodes.map((n) => n.n), 0)).length : 0;

      const body = rows.map(({ nd, guides }, i): Chunk[] => {
        const on = i === s.sel, c = nd.st ? colour(p, nd.st) : anyChange ? p.gray : p.text;
        return [
          on ? fg(p.accent)("› ") : plain(p, "  "),
          ...(opts.gutter ? [label(p, String(nd.n).padStart(gutterW) + " ")] : []),
          ...(markCol ? [nd.st ? fg(c)((MARK[nd.st] ?? " ") + " ") : plain(p, "  ")] : []),
          label(p, guides),
          label(p, nd.kids.length ? (isOpen(s, nd) ? "▾ " : "▸ ") : "  "),
          on ? bold(fg(c)(nd.label)) : fg(c)(nd.label),
          ...(nd.ref ? [plain(p, "  "), ref(p, nd.ref)] : []),
          ...(nd.note ? [label(p, `  # ${nd.note}`)] : []),
        ];
      });

      const cur = rows[s.sel]?.nd;
      const details: Chunk[][] = [];
      if (cur) {
        const trail: string[] = [];
        for (let n = cur; n && n.depth >= 0; n = n.parent) trail.unshift(n.label.replace(/\(.*$/, ""));
        details.push([fg(p.gray)(GLYPH.select), plain(p, " "), value(p, cur.label), cur.st ? label(p, `  ${WORD[cur.st] ?? cur.st}`) : plain(p, ""),
          ...(cur.ref ? [plain(p, "  "), ref(p, `${(doc as { base?: string }).base ?? ""}${cur.ref}`)] : [])]);
        if (cur.note) details.push([label(p, "note  "), plain(p, cur.note)]);
        details.push([label(p, "path  "), plain(p, trail.join(" › "))]);
      } else details.push([label(p, "no rows")]);

      const count = (st: string) => nodes.filter((n) => n.st === st).length;
      const answer: Chunk[] = [value(p, doc.title || section.name), label(p, ` · ${nodes.length} calls`)];
      for (const st of ["add", "del", "mod"]) if (count(st)) answer.push(fg(colour(p, st))(` ${MARK[st]}${count(st)}`));

      const legend = anyChange
        ? legendRow(p, [["+", p.good, "added"], ["−", p.bad, "removed"], ["~", p.cat[4], "changed"], ["▾", p.gray, "open"], ["▸", p.gray, "folded"]], width)
        : legendRow(p, [["▾", p.gray, "open"], ["▸", p.gray, "folded"]], width);

      return frameView(p, {
        title: section.name, viewName: opts.gutter ? "diff" : "tree", answer, rows: body, top: s.top, legend, details: details.slice(0, DETAIL_ROWS),
        keys: [["j k", "row"], ["enter", "fold"], ["← →", "close/open"]], hint: s.hint,
      }, dims, at);
    },
  };
}

export default createTreeChart({ gutter: false });
