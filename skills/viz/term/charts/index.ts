// Chart registry: section kind (and view) -> a LAZY loader for the module that draws it.
// Nothing here imports a chart module statically: main.ts awaits `loadChart(section)` only when a section of that
// kind is opened (or dumped), so a file with only graph sections never loads chart code, or frame.ts.
// Adding a kind = one new file charts/<kind>.ts (default-exporting a Chart) + ONE line in LOADERS below. See frame.ts.
import type { Doc, Dims, VSection, View } from "../graph";
import type { Palette } from "../style";

// Chart sections carry extra parsed fields (root, lines, …) beyond the graph-shaped VSection.
export type Section = VSection & { diff?: boolean; [field: string]: any };
export type Keypress = { name: string; sequence: string };
export type Ctx = { doc: Doc; at: { n: number; of: number } };
export type Chart<S = any> = {
  init(section: Section, ctx: Ctx): S;                                          // fresh per-open state (selection, scroll, folds)
  render(p: Palette, section: Section, state: S, dims: Dims, ctx: Ctx): View;   // pure: model + state -> rows
  key?(section: Section, state: S, k: Keypress, dims: Dims): boolean;           // true = handled, redraw
};
export type Loader = () => Promise<{ default: Chart }>;

// Keys are `kind:view` (tried first) or `kind`. A tree section with `diff` set is keyed `diff`.
const LOADERS: Record<string, Loader> = {
  hist: () => import("./hist"),
  stock: () => import("./stock"),
  "graph:sankey": () => import("./sankey"),
  timing: () => import("./timing"),
  gantt: () => import("./gantt"),
  waits: () => import("./waits"),
  retries: () => import("./retries"),
  causes: () => import("./causes"),
  board: () => import("./board"),
  diff: () => import("./diff"),
  tree: () => import("./tree"),
};

export function chartKey(s: Section): string | null {
  const keys = s.kind === "tree" ? [s.diff ? "diff" : "tree"] : [`${s.kind}:${s.view}`, s.kind];
  return keys.find((k) => k in LOADERS) ?? null;
}
export const hasChart = (s: Section) => chartKey(s) !== null;

const loaded = new Map<string, Promise<Chart>>();
export async function loadChart(s: Section): Promise<Chart | null> {
  const key = chartKey(s);
  if (!key) return null;
  // a failed import is not cached: the next open of that kind tries again
  if (!loaded.has(key)) loaded.set(key, LOADERS[key]().then((m) => m.default, (e) => { loaded.delete(key); throw e; }));
  return loaded.get(key)!;
}
