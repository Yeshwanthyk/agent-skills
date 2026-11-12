import { expect, test } from "bun:test";
import { readdirSync } from "node:fs";
import { resolve } from "node:path";
import { drawGraph, gridText, route, type Edge, type Geometry } from "../grid";

// Path helper: px for a cell (col, row) on the 7.6 x 17 grid.
const px = (c: number, r: number) => `${(c * 7.6).toFixed(1)},${r * 17}`;
const edge = (d: string, extra: Partial<Edge> = {}): Edge => ({ from: "a", to: "b", label: "", d, ...extra });
const draw = (edges: Edge[], boxes: Geometry["boxes"] = []) =>
  gridText(drawGraph({ w: 120, h: 120, boxes, edges })).map((l) => l.padEnd(12));
const at = (rows: string[], c: number, r: number) => rows[r][c];

test("a straight L run draws │ and an arrowhead", () => {
  const rows = draw([edge(`M${px(2, 1)} L${px(2, 4)}`)]);
  expect([1, 2, 3].map((r) => at(rows, 2, r)).join("")).toBe("│││");
  expect(at(rows, 2, 4)).toBe("▼");
});

test("a horizontal run draws ─ and points the way it travels", () => {
  expect(draw([edge(`M${px(1, 2)} L${px(5, 2)}`)])[2].trim()).toBe("────►");
  expect(draw([edge(`M${px(5, 2)} L${px(1, 2)}`)])[2].trim()).toBe("◄────");
});

// L, then a Q whose control point is the corner, then L: one test per turn.
const turn = (a: [number, number], corner: [number, number], b: [number, number]) =>
  draw([edge(`M${px(...a)} L${px(...a)} Q${px(...corner)} ${px(...corner)} L${px(...b)}`)]);

test("corner: right then down is ╮", () => {
  // right then down: the corner joins west and south
  const rows = turn([1, 1], [5, 1], [5, 4]);
  expect(at(rows, 5, 1)).toBe("╮");
  expect(at(rows, 5, 3)).toBe("│");
  expect(at(rows, 5, 4)).toBe("▼");
});
test("corner: left then down is ╭", () => {
  const rows = turn([5, 1], [1, 1], [1, 4]);
  expect(at(rows, 1, 1)).toBe("╭");
  expect(at(rows, 3, 1)).toBe("─");
});
test("corner: down then right is ╰", () => {
  const rows = turn([1, 1], [1, 4], [5, 4]);
  expect(at(rows, 1, 4)).toBe("╰");
  expect(at(rows, 5, 4)).toBe("►");
});
test("corner: down then left is ╯", () => {
  const rows = turn([5, 1], [5, 4], [1, 4]);
  expect(at(rows, 5, 4)).toBe("╯");
  expect(at(rows, 1, 4)).toBe("◄");
});

test("a diagonal step becomes one orthogonal corner", () => {
  expect(route(`M${px(1, 1)} L${px(3, 3)}`)).toEqual([[1, 1], [1, 3], [3, 3]]);
});

test("crossing lines become ┼; a line joining another becomes a tee", () => {
  const rows = draw([edge(`M${px(1, 3)} L${px(9, 3)}`), edge(`M${px(5, 1)} L${px(5, 6)}`)]);
  expect(at(rows, 5, 3)).toBe("┼");
  const tee = draw([edge(`M${px(1, 3)} L${px(9, 3)}`), edge(`M${px(5, 3)} L${px(5, 6)}`)]);
  expect(at(tee, 5, 3)).toBe("┬");
});

test("an arrowhead stops at a box instead of entering it", () => {
  const box = { id: "b", label: "B", kind: "", x: 5 * 7.6 + 19, y: 4 * 17, w: 76, h: 51 };   // cols 3..12, rows 4..6
  const rows = draw([edge(`M${px(5, 0)} L${px(5, 5)}`)], [box]);
  expect(at(rows, 5, 3)).toBe("▼");
  expect(at(rows, 5, 4)).toBe("─");                       // the box top border is untouched
});

test("a box keeps its label; lines passing the same cells do not overwrite it", () => {
  const box = { id: "b", label: "hello", kind: "", x: 60, y: 34, w: 76, h: 51 };
  const rows = draw([edge(`M${px(1, 3)} L${px(11, 3)}`)], [box]);
  expect(rows.join("\n")).toContain("hello");
});

test("an edge label sits on its own line near the pill, and a crossing line stays whole", () => {
  const e = edge(`M${px(5, 1)} L${px(5, 6)}`, { label: "paid", pill: { x: 5 * 7.6, y: 3 * 17, w: 60, h: 20 } });
  const cross = edge(`M${px(1, 3)} L${px(9, 3)}`);
  const rows = draw([e, cross]);
  const row = rows.findIndex((r) => r.includes(" paid "));
  expect(Math.abs(row - 3)).toBeLessThanOrEqual(2);
  expect(rows[3].trim()).toBe("────┼───►");
});

test("a hot edge marks its cells hot", () => {
  const grid = drawGraph({ w: 120, h: 120, boxes: [], edges: [edge(`M${px(2, 1)} L${px(2, 4)}`)] }, { hot: new Set([0]) });
  expect(grid.cells[2][2].hot).toBe(true);
  expect(grid.cells[4][2].tag).toBe("arrow");
});

test("a label on the arrowhead row moves onto the line above, keeping the arrow", () => {
  const e = edge(`M${px(5, 1)} L${px(5, 4)}`, { label: "go", pill: { x: 5 * 7.6, y: 4 * 17 - 6, w: 40, h: 20 } });
  const rows = draw([e]);
  expect(at(rows, 5, 4)).toBe("▼");
  expect(rows.slice(1, 4).join("\n")).toContain(" go ");
});

// Every example opens: main.ts --dump lays out, draws and walks every key on each graph section.
const examples = resolve(import.meta.dir, "../../assets/examples");
for (const file of readdirSync(examples).filter((f) => f.endsWith(".viz"))) {
  test(`main.ts --dump ${file}`, () => {
    const run = Bun.spawnSync([process.execPath, resolve(import.meta.dir, "../main.ts"), resolve(examples, file), "--dump"]);
    expect(run.stderr.toString()).toBe("");
    expect(run.exitCode).toBe(0);
    expect(run.stdout.toString().length).toBeGreaterThan(0);
  });
}

// A box from cell (c0, r0) to (c1, r1), in layout px (x = centre, y = top).
const boxCells = (id: string, c0: number, r0: number, c1: number, r1: number, label = "Label") =>
  ({ id, label, kind: "", x: ((c0 + c1) / 2) * 7.6, y: r0 * 17, w: (c1 - c0) * 7.6, h: (r1 - r0) * 17 });

test("a line crossing a box never overwrites its border or text", () => {
  const box = boxCells("x", 3, 1, 11, 4, "Keep");
  const clean = draw([], [box]);
  const crossed = draw([edge(`M${px(0, 2)} L${px(14, 2)}`, { from: "p", to: "q" })], [box]);
  for (let r = 1; r < 4; r++) expect(crossed[r].slice(3, 11)).toBe(clean[r].slice(3, 11));
});

test("an edge label never overwrites a box", () => {
  const box = boxCells("x", 3, 1, 11, 4, "Keep");
  const clean = draw([], [box]);
  const labelled = draw([edge(`M${px(0, 2)} L${px(1, 2)}`, { label: "overwrite", pill: { x: 7 * 7.6, y: 2 * 17 - 8, w: 60, h: 16 } } as Partial<Edge>)], [box]);
  for (let r = 1; r < 4; r++) expect(labelled[r].slice(3, 11)).toBe(clean[r].slice(3, 11));
});

test("an arrowhead next to its target box points into it, even when the last leg snapped flat", () => {
  // the path ends sideways one row above the box; the box sits directly below the end cell
  const rows = draw([edge(`M${px(1, 1)} L${px(6, 1)}`, { to: "b" })], [boxCells("b", 4, 2, 10, 5, "B")]);
  expect(at(rows, 6, 1)).toBe("▼");
});

// ---- Mermaid-style routing rules ----------------------------------------------------------------------------------

test("a line leaving a box border turns the border cell into a tee", () => {
  const rows = draw([edge(`M${px(6, 3)} L${px(6, 8)}`, { from: "a", to: "z" })], [boxCells("a", 3, 1, 10, 4, "A")]);
  expect(at(rows, 6, 3)).toBe("┬");
  expect(at(rows, 6, 8)).toBe("▼");
});

test("an arrowhead never sits on a corner: a last leg that turns at the box moves back a row", () => {
  // down col 2, then right along row 4, ending beside... a box directly below row 4 at cols 5..10
  const rows = draw([edge(`M${px(2, 0)} L${px(2, 4)} L${px(7, 4)}`, { from: "p", to: "b" })], [boxCells("b", 5, 5, 11, 8, "B")]);
  expect(at(rows, 7, 4)).toBe("▼");
  expect(at(rows, 6, 4)).not.toBe("─");                  // the line came down into the arrow, not sideways
});

test("a one-cell staircase jog collapses into one turn", () => {
  const rows = draw([edge(`M${px(10, 1)} L${px(10, 2)} L${px(6, 2)} L${px(6, 3)} L${px(1, 3)}`, { from: "p", to: "q" })]);
  expect(rows.join("\n")).not.toMatch(/╭─*╯|╰─*╮/);
});

test("an edge label sits on its own vertical line, not over another edge's line", () => {
  const e = edge(`M${px(6, 0)} L${px(6, 7)}`, { label: "go", pill: { x: 6 * 7.6, y: 3 * 17, w: 40, h: 16 } });
  const across = edge(`M${px(0, 3)} L${px(12, 3)}`, { from: "x", to: "y" });
  const rows = draw([across, e]);
  expect(rows[3]).toMatch(/^─+┼─+►$/);                 // the crossing line stays whole
  expect(rows.join("\n")).toContain(" go ");
});

test("a reversed (cycle-breaking) edge points at its `to` box", () => {
  // path runs from b (top) down to a (bottom), but the edge is a -> b
  const boxes = [boxCells("b", 2, 0, 10, 3, "B"), boxCells("a", 2, 7, 10, 10, "A")];
  const rows = draw([edge(`M${px(5, 3)} L${px(5, 7)}`, { from: "a", to: "b", rev: true })], boxes);
  expect(at(rows, 5, 3)).toBe("▲");
});

test("a self-loop leaves the right wall and comes back through the border", () => {
  const rows = draw([edge(`M${px(10, 3)} C${px(12, 3)} ${px(12, 4)} ${px(10, 4)}`, { from: "s", to: "s" })], [boxCells("s", 2, 2, 10, 5, "S")]);
  const text = rows.join("\n");
  expect(at(rows, 9, 3)).toBe("├");
  expect(text).toMatch(/[▼▲]/);
});
