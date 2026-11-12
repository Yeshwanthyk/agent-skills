// The one headless Viz for the process: viz.js loaded once with the same stubs as scripts/viz.py CHECK_JS.
// main.ts and any chart that needs layout (sankey) share it, so viz.js never loads twice.
import { resolve } from "node:path";
import type { Doc, VSection } from "./graph";

export type VizApi = { parse(text: string): Doc & { errors: string[] }; layout(section: VSection, opts?: { charW?: number }): any };
let viz: VizApi | undefined;
export function loadViz(): VizApi {
  if (viz) return viz;
  const g = globalThis as any;
  if (g.window?.Viz) return (viz = g.window.Viz);              // a host (or test) that already loaded it
  const win = {} as { Viz: VizApi };
  Object.assign(g, { window: win, document: { readyState: "loading", addEventListener() {} }, matchMedia: () => ({ matches: false }) });
  require(resolve(import.meta.dir, "../assets/viz.js"));
  return (viz = win.Viz);
}
