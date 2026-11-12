import { expect, test } from "bun:test";
import { readdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { loadViz } from "../viz-host";

type Node = { id: string; label: string; kind: string };
type Edge = { from: string; to: string; label: string; d?: string; pill?: unknown };
type Section = { kind: string; view: string; name: string; nodes: (Node & { rank: number })[]; edges: Edge[] };
type Geometry = {
  w: number; h: number; decor: unknown[];
  boxes: (Node & { x: number; y: number; w: number; h: number; value: number })[];
  edges: (Edge & { d: string; value: number })[];
};
type VizApi = {
  parse(text: string): { errors: string[]; sections: Section[] };
  layout(section: Section, opts?: { charW?: number }): Geometry | null;
};

const assets = resolve(import.meta.dir, "../../assets");
const Viz = loadViz() as unknown as VizApi;
const supported = new Set(["flow", "ranked", "stack", "seq", "states"]);
const examples = readdirSync(resolve(assets, "examples")).filter((f) => f.endsWith(".viz")).sort();
const sections = examples.flatMap((file) => {
  const doc = Viz.parse(readFileSync(resolve(assets, "examples", file), "utf8"));
  if (doc.errors.length) throw new Error(`${file}: ${doc.errors.join("\n")}`);
  return doc.sections.map((section) => ({ file, section }));
});

for (const { file, section } of sections) {
  if (section.kind !== "graph" || section.view === "sankey") continue;
  test(`${file}: ${section.name} (${section.view})`, () => {
    const result = Viz.layout(section)!;
    expect(result).not.toBeNull();
    expect(Number.isFinite(result.w)).toBe(true);
    expect(Number.isFinite(result.h)).toBe(true);
    expect(Array.isArray(result.decor)).toBe(true);
    expect(result.boxes).toHaveLength(section.nodes.length);
    // Plain data: serializable, so a subprocess or cache can consume it.
    expect(() => JSON.stringify(result)).not.toThrow();
    result.boxes.forEach((box, i) => {
      expect([box.id, box.label, box.kind]).toEqual([
        section.nodes[i].id, section.nodes[i].label, section.nodes[i].kind,
      ]);
      for (const value of [box.x, box.y, box.w, box.h]) expect(Number.isFinite(value)).toBe(true);
    });
    expect(result.edges).toHaveLength(section.edges.length);
    result.edges.forEach((edge, i) => {
      const pill = section.edges[i].pill;
      expect([edge.from, edge.to, edge.label, edge.d, edge.pill]).toEqual([
        section.edges[i].from, section.edges[i].to, section.edges[i].label,
        section.edges[i].d, pill && { x: pill.x, y: pill.y, w: pill.w, h: pill.h },
      ]);
      // Existing self-loops and ranked back edges are cubic; all other edges stay M/L/Q.
      const from = section.nodes.find((nd) => nd.id === edge.from)!;
      const to = section.nodes.find((nd) => nd.id === edge.to)!;
      const fromBox = result.boxes.find((box) => box.id === edge.from)!;
      const toBox = result.boxes.find((box) => box.id === edge.to)!;
      const back = section.view === "ranked" && (to.rank < from.rank || (to.rank === from.rank && toBox.y <= fromBox.y));
      const cubic = edge.from === edge.to || back;
      expect(edge.d).toMatch(cubic ? /^M[-\d.,\sMLQC]+$/ : /^M[-\d.,\sMLQ]+$/);
    });
  });
}

test("examples cover all five supported graph views", () => {
  expect(examples.length).toBeGreaterThan(0);
  expect(new Set(sections.filter(({ section: s }) => s.kind === "graph" && s.view !== "sankey")
    .map(({ section: s }) => s.view))).toEqual(supported);
});

test("an empty graph has a finite, non-negative size", () => {
  for (const view of ["flow", "states", "ranked", "stack", "seq"]) {
    const s = Viz.parse(`== graph E\nview: ${view}\n`).sections[0];
    const r = Viz.layout(s);
    expect(Number.isFinite(r.w) && r.w >= 0 && Number.isFinite(r.h) && r.h >= 0).toBe(true);
  }
});

test("sankey sections lay out as plain data", () => {
  const sankeys = sections.filter(({ section: s }) => s.kind === "graph" && s.view === "sankey");
  expect(sankeys.length).toBeGreaterThan(0);
  for (const { section } of sankeys) {
    const r = Viz.layout(section)!;
    expect(r).not.toBeNull();
    expect(JSON.parse(JSON.stringify(r))).toEqual(r);
    expect(r.decor).toEqual([]);
    expect(r.boxes.length).toBeGreaterThan(0);
    expect(r.edges.length).toBeGreaterThan(0);
    for (const v of [r.w, r.h]) expect(Number.isFinite(v) && v >= 0).toBe(true);
    const ids = new Set(r.boxes.map((b) => b.id));
    for (const b of r.boxes) {
      expect(b.kind).toBe("sankey");
      for (const v of [b.x, b.y, b.w, b.h, b.value]) expect(Number.isFinite(v)).toBe(true);
      expect(b.value).toBeGreaterThan(0);
    }
    for (const e of r.edges) {
      expect(ids.has(e.from) && ids.has(e.to)).toBe(true);
      expect(Number.isFinite(e.value) && e.value > 0).toBe(true);
      expect(e.d).toMatch(/^M[-\d.,\sCLZ]+$/);
      // x is the bar centre: a forward band leaves at the source bar's right edge (centre + w/2).
      const from = r.boxes.find((b) => b.id === e.from)!, to = r.boxes.find((b) => b.id === e.to)!;
      if (to.x > from.x) expect(Number(e.d.match(/^M\s*(-?[\d.]+)/)![1])).toBeCloseTo(from.x + from.w / 2, 5);
    }
  }
});

test("sankey drops zero-flow nodes and sizes an empty sankey finitely", () => {
  const zero = Viz.parse("== graph Z\nview: sankey\na: A\nb: B\nc: C\np: a > b\n  weight: 5\n").sections[0];
  const r = Viz.layout(zero)!;
  expect(r.boxes.map((b) => b.id)).toEqual(["a", "b"]);
  const empty = Viz.layout(Viz.parse("== graph E\nview: sankey\na: A\n").sections[0])!;
  expect(empty.boxes).toEqual([]);
  for (const v of [empty.w, empty.h]) expect(Number.isFinite(v) && v >= 0).toBe(true);
});

test("non-graph sections have no layout", () => {
  const skipped = sections.filter(({ section: s }) => s.kind !== "graph");
  expect(skipped.length).toBeGreaterThan(0);
  for (const { section } of skipped) expect(Viz.layout(section)).toBeNull();
});

test("headless charW is per-call and defaults to 7.6", () => {
  const fresh = () => Viz.parse("== graph Width\na: abcdefghij\n").sections[0];
  const width = (charW?: number) => Viz.layout(fresh(), { charW })!.boxes[0].w;
  // Ten characters plus the existing 20px horizontal padding/border.
  expect(width()).toBe(96);
  expect(width(10)).toBe(120);
  expect(width(20)).toBe(220);
  expect(width()).toBe(96);
  const document = globalThis.document;
  try {
    Reflect.deleteProperty(globalThis, "document");
    expect(width(10)).toBe(120);
    expect(width()).toBe(96);
  } finally {
    Object.assign(globalThis, { document });
  }
});
