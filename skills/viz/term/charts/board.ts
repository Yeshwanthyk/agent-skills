// board: columns of cards. Marker colours the card (✓ done, ✕ blocked, ● in flight, ○ not started); `progress:` draws a bar
// under the card. Too many columns for the width: the selected column and its neighbours show, ← → change column, j/k move
// within it. The details rows carry the card's column, progress, note, extra fields and @ref.
import { bold, fg } from "@opentui/core";
import { label, plain, ref, value, type Chunk, type Palette } from "../style";
import type { Chart, Section } from "./index";
import { DETAIL_ROWS, barRun, chartSize, fitRow, followTop, frameView, legendRow, padRow } from "./frame";

type Col = { label: string; wip: number; cards: Card[] };
type Card = { id: string; st: string; label: string; ref: string; note: string; info: [string, string][]; progress: number | null; col: Col };
type BS = { col: number; row: number[]; top: number };

const MARK: Record<string, string> = { ok: "✓", fail: "✕", warn: "●", unk: "○", "": "·" };
const colour = (p: Palette, st: string) => (st === "ok" ? p.good : st === "fail" ? p.bad : st === "warn" ? p.cat[4] : st === "unk" ? p.gray : p.text);
const MIN_COL = 20, MAX_COL = 34, GAP = " │ ";

const cols = (s: Section): Col[] => s.cols;
// Which columns show: as many as fit, centred on the selected one.
export function window(width: number, n: number, sel: number): { first: number; count: number; colW: number } {
  const count = Math.max(1, Math.min(n, Math.floor((width + GAP.length) / (MIN_COL + GAP.length))));
  const first = Math.max(0, Math.min(n - count, sel - Math.floor(count / 2)));
  const colW = Math.max(8, Math.min(MAX_COL, Math.floor((width - (count - 1) * GAP.length) / count)));
  return { first, count, colW };
}

// One column's lines under its header; `at` is the line where the selected card starts.
function colLines(p: Palette, c: Col, selRow: number, on: boolean, w: number): { lines: Chunk[][]; at: number } {
  const lines: Chunk[][] = []; let at = 0;
  c.cards.forEach((k, i) => {
    const sel = on && i === selRow, col = colour(p, k.st);
    if (sel) at = lines.length;
    lines.push([sel ? fg(p.accent)("› ") : plain(p, "  "), fg(col)(MARK[k.st] ?? "·"), plain(p, " "), sel ? bold(fg(k.st ? col : p.text)(k.label)) : fg(k.st ? col : p.text)(k.label)]);
    if (k.progress != null) {
      const bar = Math.max(4, Math.min(10, w - 12)), n = k.progress * bar;
      lines.push([plain(p, "    "), fg(p.cat[0])(barRun(n)), label(p, "░".repeat(Math.max(0, bar - Math.ceil(n - 0.25)))), label(p, ` ${Math.round(k.progress * 100)}%`)]);
    } else if (k.note || k.st === "fail") lines.push([plain(p, "    "), label(p, (k.st === "fail" ? "blocked" + (k.note ? " · " : "") : "") + k.note)]);
  });
  if (!c.cards.length) lines.push([plain(p, "  "), label(p, "—")]);
  return { lines: lines.map((r) => padRow(r, w, p)), at };
}

const render: Chart<BS>["render"] = (p, section, s, dims, { doc, at }) => {
  const cs = cols(section), { width, bodyRows } = chartSize(dims);
  s.col = Math.max(0, Math.min(cs.length - 1, s.col));
  cs.forEach((c, i) => (s.row[i] = Math.max(0, Math.min(c.cards.length - 1, s.row[i] ?? 0))));
  const { first, count, colW } = window(width, cs.length, s.col), shown = cs.slice(first, first + count);

  const built = shown.map((c, i) => colLines(p, c, s.row[first + i], first + i === s.col, colW));
  const total = Math.max(...built.map((b) => b.lines.length));
  const room = Math.max(1, bodyRows - 2);
  s.top = followTop(built[s.col - first].at, s.top, room, total);
  const sep = label(p, GAP);
  const cell = (b: Chunk[][] | undefined, r: number): Chunk[] => b?.[r] ?? [plain(p, " ".repeat(colW))];
  const join = (f: (i: number) => Chunk[]): Chunk[] => shown.flatMap((_, i) => (i ? [sep, ...f(i)] : f(i)));

  const header = join((i) => {
    const c = shown[i], n = c.cards.length, cap = c.wip ? `${n}/${c.wip}` : String(n);
    const over = c.wip && n > c.wip, full = c.wip && n === c.wip, on = first + i === s.col;
    const lead = i === 0 && first > 0 ? "‹ " : "", more = i === count - 1 && first + count < cs.length;
    const tag = ` ${cap}`, name = (lead + c.label).slice(0, Math.max(1, colW - tag.length - (more ? 2 : 0)));
    const row: Chunk[] = [on ? bold(fg(p.accent)(name)) : value(p, name), over ? fg(p.bad)(tag) : full ? fg(p.cat[4])(tag) : label(p, tag)];
    if (i === count - 1 && first + count < cs.length) row.push(label(p, " ›"));
    return padRow(row, colW, p);
  });
  const rule = join(() => [label(p, "─".repeat(colW))]);
  const body: Chunk[][] = [header, rule];
  for (let r = s.top; r < Math.min(total, s.top + room); r++) body.push(join((i) => cell(built[i].lines, r)));

  const all = cs.flatMap((c) => c.cards), last = cs[cs.length - 1], blocked = all.filter((k) => k.st === "fail");
  const full = cs.filter((c) => c.wip && c.cards.length >= c.wip);
  const answer: Chunk[] = [value(p, `${last.cards.length} of ${all.length} ${last.label}`)];
  if (blocked.length) answer.push(fg(p.bad)(` · ${blocked.length} blocked`));
  for (const c of full) answer.push(label(p, ` · ${c.label} ${c.cards.length > c.wip ? "over" : "at"} its WIP limit`));

  const cur = cs[s.col].cards[s.row[s.col]], details: Chunk[][] = [];
  if (cur) {
    const base = (doc as { base?: string }).base ?? "";
    details.push([fg(colour(p, cur.st))(MARK[cur.st] ?? "·"), plain(p, " "), value(p, cur.label), label(p, `  ${cur.col.label}${cur.st === "fail" ? ", blocked" : ""}`),
      ...(cur.progress != null ? [label(p, `  ${Math.round(cur.progress * 100)}%`)] : []), ...(cur.ref ? [plain(p, "  "), ref(p, `${base}${cur.ref}`)] : [])]);
    if (cur.note) details.push([label(p, "note  "), plain(p, cur.note)]);
    if (cur.info.length) details.push(cur.info.flatMap(([k, v], i): Chunk[] => [...(i ? [label(p, " · ")] : []), label(p, `${k} `), plain(p, v)]));
    if (cur.st === "fail" && cur.col.wip && cur.col.cards.length >= cur.col.wip) details.push([label(p, `${cur.col.label} is full, so cards waiting before it stay put`)]);
  } else details.push([label(p, `${cs[s.col].label} is empty`)]);

  const clipped = total > room, hidden = cs.length > count;
  const hint = [hidden ? `columns ${first + 1}-${first + count} of ${cs.length}` : "", clipped ? `lines ${s.top + 1}-${Math.min(total, s.top + room)} of ${total}` : ""].filter(Boolean).join(" · ");
  return frameView(p, {
    title: section.name, viewName: "board", answer, rows: body, top: 0, legend: legendRow(p, [["✓", p.good, "done"], ["✕", p.bad, "blocked"], ["●", p.cat[4], "in flight"], ["○", p.gray, "not started"]], width),
    details: details.slice(0, DETAIL_ROWS), keys: [["j k", "card"], ["← →", "column"]], hint,
  }, dims, at);
};

const chart: Chart<BS> = {
  init: () => ({ col: 0, row: [], top: 0 }),
  key(section, s, k) {
    const cs = cols(section);
    const go = (c: number) => { s.col = Math.max(0, Math.min(cs.length - 1, c)); s.top = 0; };
    if (k.name === "left" || k.name === "h") go(s.col - 1);
    else if (k.name === "right" || k.name === "l") go(s.col + 1);
    else if (k.name === "j" || k.name === "down") s.row[s.col] = Math.min(Math.max(0, cs[s.col].cards.length - 1), (s.row[s.col] ?? 0) + 1);
    else if (k.name === "k" || k.name === "up") s.row[s.col] = Math.max(0, (s.row[s.col] ?? 0) - 1);
    else return false;
    return true;
  },
  render,
};
export default chart;
