import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { PALETTES } from "../style";
import { chunkText } from "../graph";
import { hasChart, loadChart, type Section } from "../charts";
import { rowWidth } from "../charts/frame";
import { window as boardWindow } from "../charts/board";

const TERM = resolve(import.meta.dir, ".."), EX = resolve(TERM, "../assets/examples");
const p = PALETTES.dark;

// Evaluate viz.js with its own browser stubs: no require cache, so other test files loading it cannot interfere.
function parse(text: string) {
  const win = {} as { Viz: any };
  new Function("window", "document", "matchMedia", readFileSync(resolve(TERM, "../assets/viz.js"), "utf8"))(win, { readyState: "loading", addEventListener() {} }, () => ({ matches: false }));
  return win.Viz.parse(text);
}
const doc = parse(readFileSync(join(EX, "charts.viz"), "utf8"));
const by = (kind: string) => doc.sections.find((s: Section) => s.kind === kind) as Section;
const [causes, board, retries] = [by("causes"), by("board"), by("retries")];
const ctx = { doc, at: { n: 1, of: 1 } };
const text = (rows: any[][]) => rows.map((r) => chunkText(r));
const key = (c: any, sec: Section, s: any, name: string, dims: any) => c.key!(sec, s, { name, sequence: name }, dims);
const fits = (v: any, w: number) => { for (const r of [...v.body, v.answer, v.legend, ...v.details]) expect(rowWidth(r)).toBeLessThanOrEqual(w); };

test("board, causes and retries are registered", () => {
  for (const s of [board, causes, retries]) expect(hasChart(s)).toBe(true);
});

// ---- board ----------------------------------------------------------------------------------------------------------------
test("board draws columns with WIP counts, cards, progress bars and the blocked note", async () => {
  const c = (await loadChart(board))!, s = c.init(board, ctx), v = c.render(p, board, s, { width: 120, height: 30 }, ctx);
  const rows = text(v.body);
  expect(rows[0]).toMatch(/queued 2.*copying 3\/3.*verifying 1.*done 2/);
  expect(rows.join("\n")).toMatch(/shard 4/);
  expect(rows.join("\n")).toContain("62%");
  expect(rows.join("\n")).toContain("blocked · lock wait");
  expect(chunkText(v.answer)).toContain("1 blocked");
  expect(chunkText(v.answer)).toContain("copying at its WIP limit");
});
test("board: too many columns show the selected one and its neighbours; arrows move, j/k move within", async () => {
  const c = (await loadChart(board))!, s = c.init(board, ctx), dims = { width: 56, height: 30 };
  let v = c.render(p, board, s, dims, ctx);
  expect(text(v.body)[0]).toContain("queued");
  expect(text(v.body)[0]).toContain("›");                                  // more columns to the right
  fits(v, 56 - 4 - 2);
  for (let i = 0; i < 3; i++) expect(key(c, board, s, "right", dims)).toBe(true);
  v = c.render(p, board, s, dims, ctx);
  expect(text(v.body)[0]).toContain("done");
  expect(text(v.body)[0]).not.toContain("queued");
  expect(text(v.body)[0]).toContain("‹");
  expect(chunkText(v.details[0])).toContain("done");
  key(c, board, s, "left", dims); key(c, board, s, "left", dims);          // copying
  key(c, board, s, "j", dims); key(c, board, s, "j", dims); key(c, board, s, "j", dims);   // clamps at the last card
  v = c.render(p, board, s, dims, ctx);
  expect(text(v.details).join("\n")).toContain("shard 6");
  expect(text(v.details).join("\n")).toContain("owner backfill-2");
  expect(key(c, board, s, "x", dims)).toBe(false);
});
test("board window shows as many columns as fit, centred, never past the ends", () => {
  expect(boardWindow(100, 4, 0)).toMatchObject({ first: 0, count: 4 });
  expect(boardWindow(46, 6, 3)).toMatchObject({ first: 2, count: 2 });
  expect(boardWindow(46, 6, 5)).toMatchObject({ first: 4, count: 2 });
  expect(boardWindow(10, 6, 2).count).toBe(1);
});

// ---- causes ---------------------------------------------------------------------------------------------------------------
test("causes rank families by ruled-in causes and draw a bar with one cell per cause", async () => {
  const c = (await loadChart(causes))!, s = c.init(causes, ctx), v = c.render(p, causes, s, { width: 100, height: 30 }, ctx), rows = text(v.body);
  expect(rows[0]).toMatch(/^› 1 ▾ queue\s+█▪\s+1 in · 0 open · 1 out/);
  expect(rows[1]).toContain("● hook raised before :240");
  expect(rows.find((r) => r.includes("mail flag off"))).toContain("✕");
  expect(rows.findIndex((r) => r.includes("2 ▾ deploy"))).toBeGreaterThan(0);
  expect(chunkText(v.answer)).toContain("no receipt · 1 in · 3 out · 2 still open");
});
test("causes: enter folds a family, left jumps to the family, details show why and ref", async () => {
  const c = (await loadChart(causes))!, s = c.init(causes, ctx), dims = { width: 100, height: 30 };
  key(c, causes, s, "j", dims);
  let v = c.render(p, causes, s, dims, ctx);
  expect(text(v.details).join("\n")).toContain("ruled in · queue");
  expect(text(v.details).join("\n")).toContain("order_service.py:236");
  expect(text(v.details).join("\n")).toContain("stops the chain");
  key(c, causes, s, "left", dims);
  expect(text(c.render(p, causes, s, dims, ctx).body)[0]).toMatch(/^›/);
  key(c, causes, s, "enter", dims);
  v = c.render(p, causes, s, dims, ctx);
  expect(text(v.body)[0]).toContain("▸ queue");
  expect(text(v.body)[1]).toContain("2 ▾ deploy");
  expect(key(c, causes, s, "z", dims)).toBe(false);
});

// ---- retries --------------------------------------------------------------------------------------------------------------
test("retries draws attempts with outcome glyphs, backoff gaps and the give-up line", async () => {
  const c = (await loadChart(retries))!, s = c.init(retries, ctx), v = c.render(p, retries, s, { width: 100, height: 30 }, ctx), rows = text(v.body);
  expect(rows[0]).toMatch(/^› client A\s+✕━.*✓.*┊/);
  expect(rows[1]).toContain("+1 +2.2 +4.3 +7.5");
  expect(chunkText(v.answer)).toBe("16 attempts · 1/3 succeed · 4 off policy");
});
test("retries: j/k pick a client, arrows pick an attempt, details show timing and policy window", async () => {
  const c = (await loadChart(retries))!, s = c.init(retries, ctx), dims = { width: 100, height: 30 };
  key(c, retries, s, "right", dims); key(c, retries, s, "right", dims);
  let d = text(c.render(p, retries, s, dims, ctx).details).join("\n");
  expect(d).toContain("client A, attempt 3/5");
  expect(d).toContain("after the last");
  expect(d).toContain("policy");
  key(c, retries, s, "j", dims);
  d = text(c.render(p, retries, s, dims, ctx).details).join("\n");
  expect(d).toContain("client B, attempt 1/6");
  for (let i = 0; i < 9; i++) key(c, retries, s, "left", dims);
  expect(text(c.render(p, retries, s, dims, ctx).details)[0]).toContain("attempt 1/6");
});

// ---- every row fits, at any size ------------------------------------------------------------------------------------------
test("every row fits the card at narrow and tall sizes, and body rows stay constant", async () => {
  for (const sec of [board, causes, retries]) {
    const c = (await loadChart(sec))!, s = c.init(sec, ctx);
    for (const dims of [{ width: 44, height: 16 }, { width: 60, height: 20 }, { width: 100, height: 40 }, { width: 200, height: 50 }]) {
      for (let i = 0; i < 6; i++) {
        const v = c.render(p, sec, s, dims, ctx);
        expect(v.body.length).toBe(v.bodyRows);
        fits(v, Math.max(40, Math.min(140, dims.width - 2)) - 4);
        for (const k of ["j", "right", "j", "right"]) key(c, sec, s, k, dims);
      }
    }
  }
});
