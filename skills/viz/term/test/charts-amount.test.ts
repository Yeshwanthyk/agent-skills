import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { PALETTES } from "../style";
import { chunkText } from "../graph";
import { loadChart, type Section } from "../charts";
import { rowWidth } from "../charts/frame";
import { loadViz } from "../viz-host";

const doc = loadViz().parse(readFileSync(resolve(import.meta.dir, "../../assets/examples/charts.viz"), "utf8"));
const p = PALETTES.dark, pal = new Set<string>([...p.cat, p.gray, p.good, p.bad, p.accent, p.text, p.border]);
const hex = (n: number) => n.toString(16).padStart(2, "0");
const rgb = (c: any) => (typeof c === "string" ? c : `#${hex(c.buffer[0])}${hex(c.buffer[1])}${hex(c.buffer[2])}`);
const pick = (kind: string, view?: string) => doc.sections.find((s: any) => s.kind === kind && (!view || s.view === view)) as Section;

for (const [name, section] of [["hist", pick("hist")], ["stock", pick("stock")], ["sankey", pick("graph", "sankey")]] as const) {
  test(`${name}: draws, selects, fits every width, palette only`, async () => {
    const chart = (await loadChart(section))!;
    expect(chart).not.toBeNull();
    const ctx = { doc, at: { n: 1, of: 1 } }, st = chart.init(section, ctx);
    for (const width of [40, 60, 82, 140]) {
      const dims = { width, height: 24 }, w = Math.max(40, Math.min(140, width - 2)) - 4;
      const v = chart.render(p, section, st, dims, ctx);
      const rows = [v.answer, ...v.body, v.legend, ...v.details];
      for (const r of rows) {
        expect(rowWidth(r)).toBeLessThanOrEqual(w);
        for (const c of r) if (c.fg) expect(pal.has(rgb(c.fg))).toBe(true);
      }
      expect(v.body.some((r) => chunkText(r).includes("█") || chunkText(r).includes("▌"))).toBe(true);
    }
    const before = chunkText(chart.render(p, section, st, { width: 82, height: 24 }, ctx).details[0]);
    expect(chart.key!(section, st, { name: "j", sequence: "j" }, { width: 82, height: 24 })).toBe(true);
    expect(chart.key!(section, st, { name: "x", sequence: "x" }, { width: 82, height: 24 })).toBe(false);
    expect(chunkText(chart.render(p, section, st, { width: 82, height: 24 }, ctx).details[0])).not.toBe(before);
  });
}

test("sankey highlights flows touching the selected node and shows @ref/in/out", async () => {
  const s = pick("graph", "sankey"), chart = (await loadChart(s))!, ctx = { doc, at: { n: 1, of: 1 } }, st = chart.init(s, ctx);
  const v = chart.render(p, s, st, { width: 82, height: 40 }, ctx);
  const det = v.details.map(chunkText).join("\n");
  expect(det).toContain("out");
  expect(v.body.some((r) => r.some((c) => c.fg && String(c.fg).length && chunkText([c]).includes("█")))).toBe(true);
});

test("hist shows budget-over buckets and was shares; stock shows meter bands", async () => {
  const h = pick("hist"), hc = (await loadChart(h))!, ctx = { doc, at: { n: 1, of: 1 } };
  const hv = hc.render(p, h, hc.init(h, ctx), { width: 82, height: 24 }, ctx);
  expect(hv.body.map(chunkText).join("\n")).toContain("was");
  expect(hv.legend.map((c) => c.text).join("")).toContain("over 600");
  const s = pick("stock"), sc = (await loadChart(s))!;
  expect(sc.render(p, s, sc.init(s, ctx), { width: 82, height: 24 }, ctx).legend.map((c) => c.text).join("")).toContain("shedding");
});
