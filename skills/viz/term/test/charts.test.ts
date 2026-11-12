import { expect, test } from "bun:test";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { PALETTES } from "../style";
import { chunkText } from "../graph";
import { hasChart, loadChart, chartKey, type Section } from "../charts";
import { axis, barRun, fitRow, followTop, frameView, rowWidth, scale } from "../charts/frame";
import { loadViz } from "../viz-host";

const BUN = process.execPath, TERM = resolve(import.meta.dir, "..");
const EX = resolve(TERM, "../assets/examples");
const p = PALETTES.dark;

const parse = (file: string) => loadViz().parse(readFileSync(join(EX, file), "utf8"));
const doc = parse("submit-diff.viz");
const [diff, tree] = doc.sections as Section[];
const ctx = { doc, at: { n: 1, of: 1 } };
const text = (rows: any[][]) => rows.map((r) => chunkText(r));

// ---- frame helpers ----------------------------------------------------------------------------------------------------
test("fitRow truncates with an ellipsis and never exceeds the width", () => {
  const row = [{ text: "hello " } as any, { text: "world and more" } as any];
  for (const w of [0, 1, 5, 10, 20, 40]) expect(rowWidth(fitRow(row, w))).toBeLessThanOrEqual(w);
  expect(chunkText(fitRow(row, 8))).toBe("hello w…");
  expect(fitRow(row, 40)).toBe(row);
});
test("scale maps a domain to columns, flat domain to 0", () => {
  const at = scale(0, 10, 11);
  expect([at(0), at(5), at(10), at(-3), at(99)]).toEqual([0, 5, 10, 0, 10]);
  expect(scale(4, 4, 20)(4)).toBe(0);
});
test("axis fits its columns and keeps tick labels apart", () => {
  for (const cols of [10, 30, 70]) expect(axis(0, 100, cols).length).toBe(cols);
  expect(axis(0, 100, 30).trim().startsWith("0")).toBe(true);
});
test("barRun uses full and half blocks", () => {
  expect(barRun(3)).toBe("███");
  expect(barRun(2.6)).toBe("██▌");
  expect(barRun(2.2)).toBe("██");
  expect(barRun(-1)).toBe("");
});
test("followTop keeps the selection in the window and the window in the rows", () => {
  expect(followTop(0, 0, 5, 20)).toBe(0);
  expect(followTop(7, 0, 5, 20)).toBe(3);
  expect(followTop(2, 3, 5, 20)).toBe(2);
  expect(followTop(0, 99, 5, 20)).toBe(0);
  expect(followTop(19, 0, 5, 20)).toBe(15);
});
test("frameView clips, pads to bodyRows, fits widths, and shows the scroll row", () => {
  const rows = Array.from({ length: 30 }, (_, i) => [{ text: `row ${i} ${"x".repeat(200)}` } as any]);
  const dims = { width: 60, height: 20 };
  const v = frameView(p, { title: "t", viewName: "k", answer: [], rows, top: 4, legend: [], details: [], keys: [] }, dims, { n: 1, of: 2 });
  expect(v.body.length).toBe(v.bodyRows);
  expect(chunkText(v.body[0]).startsWith("row 4")).toBe(true);
  expect(chunkText(v.scroll[0] ? v.scroll : [])).toBe(`rows 5-${4 + v.bodyRows} of 30`);
  for (const r of v.body) expect(rowWidth(r)).toBeLessThanOrEqual(60 - 4 - 2);
});

// ---- registry -----------------------------------------------------------------------------------------------------------
test("registry keys: tree sections map by diff flag; graphs and unknown kinds have no chart", () => {
  expect([chartKey(diff), chartKey(tree)]).toEqual(["diff", "tree"]);
  expect(hasChart({ kind: "graph", view: "flow" } as Section)).toBe(false);
  expect(hasChart({ kind: "nosuchkind", view: "" } as Section)).toBe(false);
  for (const kind of ["timing", "gantt", "waits", "board", "causes", "retries", "hist", "stock"]) expect(hasChart({ kind, view: "" } as Section)).toBe(true);
  expect(hasChart({ kind: "graph", view: "sankey" } as Section)).toBe(true);
});

// ---- diff and tree ------------------------------------------------------------------------------------------------------
test("diff rows show the gutter, markers and box branches", async () => {
  const chart = (await loadChart(diff))!, s = chart.init(diff, ctx);
  const v = chart.render(p, diff, s, { width: 100, height: 40 }, ctx);
  const rows = text(v.body);
  expect(rows[2]).toContain("~");
  expect(rows[2]).toMatch(/^\s*›?\s*7 ~ ├─ ▾ createSession/);
  expect(rows[3]).toMatch(/8 − │  ├─\s+persistPrompt/);
  expect(rows[5]).toMatch(/10 \+ │  │  └─\s+outbox\.put/);
  expect(chunkText(v.answer)).toContain("+2 −1 ~1");
  expect(chunkText(v.legend)).toContain("added");
});
test("tree rows have branches and no gutter or marker column", async () => {
  const chart = (await loadChart(tree))!, s = chart.init(tree, ctx);
  const rows = text(chart.render(p, tree, s, { width: 100, height: 40 }, ctx).body);
  expect(rows[1]).toMatch(/^  ├─ {3}validatePrompt/);
  expect(rows[3]).toMatch(/^  │  ├─/);
  expect(rows[4]).toMatch(/^  │  └─/);
  expect(rows[5]).toMatch(/^  └─/);
});
test("j/k move the selection within bounds; enter folds and unfolds; left jumps to the parent", async () => {
  const chart = (await loadChart(tree))!, s = chart.init(tree, ctx);
  const key = (name: string) => chart.key!(tree, s, { name, sequence: name }, { width: 100, height: 40 });
  const dims = { width: 100, height: 40 };
  const sel = () => text(chart.render(p, tree, s, dims, ctx).body).findIndex((r) => r.startsWith("›"));
  expect(sel()).toBe(0);
  key("k"); expect(sel()).toBe(0);
  key("j"); key("down"); expect(sel()).toBe(2);
  key("enter");                                              // fold createSession
  let rows = text(chart.render(p, tree, s, dims, ctx).body).filter(Boolean);
  expect(rows.length).toBe(4); expect(rows[2]).toContain("▸ createSession");
  key("enter"); rows = text(chart.render(p, tree, s, dims, ctx).body).filter(Boolean);
  expect(rows.length).toBe(6);
  key("j"); key("left"); expect(sel()).toBe(2);              // child -> parent
  expect(key("x")).toBe(false);
  for (let i = 0; i < 20; i++) key("j"); expect(sel()).toBe(5);
});
test("a short card scrolls and every row fits the width", async () => {
  const chart = (await loadChart(diff))!, s = chart.init(diff, ctx);
  const dims = { width: 44, height: 16 };                     // card 42 wide, 38 cells inside; bodyRows 4
  for (let i = 0; i < 8; i++) {
    const v = chart.render(p, diff, s, dims, ctx);
    expect(v.body.length).toBe(v.bodyRows);
    for (const r of [...v.body, v.answer, v.legend, ...v.details]) expect(rowWidth(r)).toBeLessThanOrEqual(38);
    chart.key!(diff, s, { name: "j", sequence: "j" }, dims);
  }
  expect(chunkText(chart.render(p, diff, s, dims, ctx).scroll)).toMatch(/^rows \d+-\d+ of 8$/);
});

// ---- lazy loading: graph-only files load no chart code ----------------------------------------------------------------
// A preload plugin reports every charts/*.ts module the run loads.
const dir = mkdtempSync(join(tmpdir(), "viz-term-trace-"));
const trace = join(dir, "trace.ts");
writeFileSync(trace, `import { plugin } from "bun";
plugin({ name: "trace", setup(b) { b.onLoad({ filter: /[\\\\/]term[\\\\/]charts[\\\\/][^\\\\/]+\\.ts$/ }, (a) => { console.error("LOADED " + a.path.split("/").pop()); return { contents: require("node:fs").readFileSync(a.path, "utf8"), loader: "ts" }; }); } });
`);
async function loadedCharts(example: string, extra: string[] = []) {
  const proc = Bun.spawn([BUN, "--preload", trace, "main.ts", join(EX, example), "--dump", ...extra], { cwd: TERM, stdout: "pipe", stderr: "pipe" });
  const [out, err] = await Promise.all([new Response(proc.stdout).text(), new Response(proc.stderr).text()]);
  expect(await proc.exited).toBe(0);
  return { out, mods: [...err.matchAll(/LOADED (\S+)/g)].map((m) => m[1]).sort() };
}
test("--dump of a graph-only file loads no chart module (not even index registry loaders)", async () => {
  for (const f of ["gate-scan.viz", "order-flow.viz"]) {
    const { out, mods } = await loadedCharts(f);
    expect(out).toContain("==");
    expect(mods.filter((m) => m !== "index.ts")).toEqual([]);
  }
});
test("--dump of a diff/tree file loads the diff, tree and frame modules, and prints every section", async () => {
  const { out, mods } = await loadedCharts("submit-diff.viz");
  expect(mods).toEqual(expect.arrayContaining(["diff.ts", "frame.ts", "tree.ts"]));
  expect(out.match(/^== /gm)?.length).toBe(3);
  expect(out).toContain("├─");
});
test("index.ts and main.ts import no chart module statically; only chart modules import frame.ts", () => {
  const src = (f: string) => readFileSync(join(TERM, f), "utf8");
  expect(src("charts/index.ts")).not.toMatch(/^import(?! type)[^\n]*from "\.\//m);
  expect(src("main.ts")).not.toMatch(/from "\.\/charts\/(?!index)/);
  expect(src("main.ts")).not.toMatch(/frame/);
  expect(src("main.ts")).not.toMatch(/^import[^\n]*from "\.\/charts\/(diff|tree|frame)"/m);
});
