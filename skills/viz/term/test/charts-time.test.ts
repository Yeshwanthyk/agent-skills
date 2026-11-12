import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { PALETTES } from "../style";
import { chunkText } from "../graph";
import { hasChart, loadChart, type Section } from "../charts";
import { rowWidth } from "../charts/frame";
import { loadViz } from "../viz-host";

const TERM = resolve(import.meta.dir, ".."), EX = resolve(TERM, "../assets/examples");
const p = PALETTES.dark;

const parse = (src: string) => loadViz().parse(src);
const doc = parse(readFileSync(join(EX, "charts.viz"), "utf8"));
const by = (kind: string, n = 0) => (doc.sections as Section[]).filter((s) => s.kind === kind)[n];
const ctx = { doc, at: { n: 1, of: 1 } }, big = { width: 100, height: 40 };
const text = (rows: any[][]) => rows.map((r) => chunkText(r));
const kp = (name: string) => ({ name, sequence: name });

async function open(s: Section) {
  const chart = (await loadChart(s))!, st = chart.init(s, ctx);
  return { chart, st, view: (dims = big) => chart.render(p, s, st, dims, ctx) };
}
const selected = (rows: string[]) => rows.findIndex((r) => r.startsWith("›"));

test("timing, gantt and waits are registered", () => {
  for (const k of ["timing", "gantt", "waits"]) expect(hasChart(by(k))).toBe(true);
});

test("timing draws lanes, windows and a pinned axis with the unit", async () => {
  const s = by("timing"), { view } = await open(s), v = view(), rows = text(v.body);
  expect(rows[0]).toMatch(/^› API worker\s+┈+█/);
  expect(rows[1]).toContain("Retry worker");
  expect(rows[2]).toMatch(/^\s+race/); expect(rows[2]).toContain("▒");
  expect(rows.some((r) => /ms 0\s+100\s+200\s+300\s+400/.test(r))).toBe(true);
  expect(chunkText(v.legend)).toContain("quiet");
});
test("timing j/k pick a row, ← → pick a segment, details show start..end and duration", async () => {
  const s = by("timing"), { chart, st, view } = await open(s);
  const d = () => text(view().details);
  expect(d()[0]).toContain("API worker");
  expect(d()[0]).toContain("checkout/api.py:40");
  expect(d()[1]).toContain("0..40 ms  (40 ms)");
  chart.key!(s, st, kp("right"), big); expect(d()[1]).toContain("40..70 ms  (30 ms)");
  expect(d()[1]).toContain("read cart");
  expect(d()[2]).toContain("holds the order lock");
  for (let i = 0; i < 9; i++) chart.key!(s, st, kp("j"), big);
  expect(selected(text(view().body))).toBe(3);               // clamped on the last row (a window)
  expect(d()[1]).toContain("70..250 ms");
  chart.key!(s, st, kp("k"), big); chart.key!(s, st, kp("k"), big); chart.key!(s, st, kp("k"), big); chart.key!(s, st, kp("k"), big);
  expect(selected(text(view().body))).toBe(0);
  expect(chart.key!(s, st, kp("x"), big)).toBe(false);
});

test("gantt draws a bar per row, the budget line, slack and the pinned axis", async () => {
  const s = by("gantt"), { view } = await open(s), v = view(), rows = text(v.body);
  expect(rows[0]).toMatch(/^› Auth check\s+█+▌? 40 ms/);
  expect(rows[4]).toMatch(/Charge card\s+█{20,}▌? 520 ms/);
  expect(rows.some((r) => r.includes("┆"))).toBe(true);
  expect(rows.some((r) => r.includes("┄"))).toBe(true);
  expect(rows.some((r) => /ms 0\s+200\s+400\s+600/.test(r))).toBe(true);
  expect(chunkText(v.answer)).toContain("budget 600 ms · over by 120");
});
test("gantt details show time, what it waits on, slack and ref; the was run shows in the comparison", async () => {
  const s = by("gantt"), { chart, st, view } = await open(s);
  chart.key!(s, st, kp("j"), big); chart.key!(s, st, kp("j"), big); chart.key!(s, st, kp("j"), big);   // Reserve stock
  const d = text(view().details).join("\n");
  expect(d).toContain("Reserve stock"); expect(d).toContain("after Load cart"); expect(d).toMatch(/slack \d+/); expect(d).toContain("warehouse API");
  const c = by("gantt", 1), o = await open(c), rows = text(o.view().body);
  expect(rows.some((r) => r.includes("╌"))).toBe(true);
  expect(rows[1]).toContain("+10");
  expect(chunkText(o.view().answer)).toContain("was 250 (+570)");
});

test("waits lists holds and waits, marks the deadlock, and details name the cycle", async () => {
  const s = by("waits"), { chart, st, view } = await open(s), v = view(), rows = text(v.body);
  expect(rows[0]).toMatch(/^› Worker A\s+holds ■ orders#42/);
  expect(rows[2]).toMatch(/Worker A\s+waits ▸ stock#7\s+3\.1s\s+held by Worker B\s+sync\/worker\.py:88/);
  expect(chunkText(v.answer)).toContain("deadlock: Worker A ⇄ Worker B");
  expect(chunkText(v.answer)).toContain("also stuck: Nightly cron");
  for (let i = 0; i < 2; i++) chart.key!(s, st, kp("j"), big);
  const d = text(view().details);
  expect(d[0]).toContain("Worker A waits stock#7"); expect(d[0]).toContain("deadlock");
  expect(d[1]).toContain("3.1s"); expect(d.join("\n")).toContain("Worker A → stock#7 → Worker B → orders#42 → Worker A");
  chart.key!(s, st, kp("j"), big); chart.key!(s, st, kp("j"), big);
  expect(text(view().details)[0]).toContain("stuck behind a deadlock");
});

test("every row fits a small card and the keys never throw", async () => {
  for (const s of [by("timing"), by("gantt"), by("gantt", 1), by("waits")]) {
    const { chart, st, view } = await open(s), dims = { width: 44, height: 17 };     // 38 cells inside
    for (let i = 0; i < 10; i++) {
      const v = view(dims);
      expect(v.body.length).toBe(v.bodyRows);
      for (const r of [...v.body, v.answer, v.legend, ...v.details]) expect(rowWidth(r)).toBeLessThanOrEqual(38);
      for (const k of ["j", "right", "down", "left", "x"]) chart.key!(s, st, kp(k), dims);
    }
  }
});
