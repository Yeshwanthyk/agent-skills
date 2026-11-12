import { expect, test } from "bun:test";
import { mkdirSync, mkdtempSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { graphPng, graphSvg } from "../image";
import { loadViz } from "../viz-host";

const BUN = process.execPath, TERM = resolve(import.meta.dir, "..");
const EX = resolve(TERM, "../assets/examples");
const OUT = "/tmp/viz-c6";

const Viz = loadViz();

const MAGIC = [137, 80, 78, 71, 13, 10, 26, 10];
const graphs = readdirSync(EX).filter((f) => f.endsWith(".viz")).flatMap((file) =>
  Viz.parse(readFileSync(join(EX, file), "utf8")).sections
    .map((s: any, i: number) => ({ file, i, s }))
    .filter(({ s }: any) => s.kind === "graph" && s.view !== "sankey"));

test("every example graph section rasterizes to a real PNG, dark and light", () => {
  mkdirSync(OUT, { recursive: true });
  expect(graphs.length).toBeGreaterThan(5);
  for (const { file, i, s } of graphs) {
    const geo = Viz.layout(s);
    for (const theme of ["dark", "light"] as const) {
      const { png, width, height } = graphPng(s, geo, theme, 1200, 700);
      expect([...png.subarray(0, 8)]).toEqual(MAGIC);
      expect(png.length).toBeGreaterThan(2000);
      expect(width).toBeLessThanOrEqual(1200 + 1);
      expect(height).toBeLessThanOrEqual(700 + 1);
      writeFileSync(join(OUT, `${file.replace(/\.viz$/, "")}-${i}-${theme}.png`), png);
    }
  }
});

test("the SVG carries every node label and one path per edge, and escapes text", () => {
  const { s } = graphs.find((g: any) => g.file === "order-flow.viz")!;
  const geo = Viz.layout(s), svg = graphSvg(s, geo, "dark");
  for (const n of s.nodes.filter((n: any) => n.kind !== "start")) expect(svg).toContain(n.label.split(" ")[0].replace(/&/g, "&amp;"));
  expect((svg.match(/<path d="[^"]*" fill="none"/g) ?? []).length).toBe(s.edges.length);
  expect(svg).not.toContain("<script");
  expect(graphSvg(s, geo, "light")).toContain("#ffffff");
});

test("the PNG is sized to fit the box it is given, and is never enlarged past 2x", () => {
  const { s } = graphs[0], geo = Viz.layout(s);
  const small = graphPng(s, geo, "dark", 300, 200), big = graphPng(s, geo, "dark", 99999, 99999);
  expect(small.width).toBeLessThanOrEqual(301); expect(small.height).toBeLessThanOrEqual(201);
  expect(big.width).toBeLessThanOrEqual(Math.ceil((geo.w + 28) * 2) + 1);
});

// ---- lazy loading: --dump never loads image.ts (and so never loads the native addon) -----------------------------------
const dir = mkdtempSync(join(tmpdir(), "viz-term-trace-img-"));
const trace = join(dir, "trace.ts");
writeFileSync(trace, `import { plugin } from "bun";
plugin({ name: "trace", setup(b) { b.onLoad({ filter: /[\\\\/]term[\\\\/]image\\.ts$/ }, (a) => { console.error("LOADED image.ts"); return { contents: require("node:fs").readFileSync(a.path, "utf8"), loader: "ts" }; }); } });
`);
test("--dump loads neither image.ts nor @resvg/resvg-js", async () => {
  for (const f of ["order-flow.viz", "gate-scan.viz"]) {
    const proc = Bun.spawn([BUN, "--preload", trace, "main.ts", join(EX, f), "--dump"], { cwd: TERM, stdout: "pipe", stderr: "pipe" });
    const [out, err] = await Promise.all([new Response(proc.stdout).text(), new Response(proc.stderr).text()]);
    expect(await proc.exited).toBe(0);
    expect(out).toContain("==");
    expect(err).not.toContain("LOADED image.ts");
  }
  // and main.ts has no static import of it
  expect(readFileSync(join(TERM, "main.ts"), "utf8")).not.toMatch(/^import .*["']\.\/image["']/m);
  // sanity: the trace does see image.ts when something imports it
  const probe = Bun.spawn([BUN, "--preload", trace, "-e", `await import(${JSON.stringify(join(TERM, "image.ts"))})`], { cwd: TERM, stderr: "pipe", stdout: "pipe" });
  expect(await new Response(probe.stderr).text()).toContain("LOADED image.ts");
});
