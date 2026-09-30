#!/usr/bin/env bun
// Builds a module map: scans a TS/JS repository, merges the research file, resolves every
// anchor against live source, attaches git history and branch diffs, and writes one
// self-contained HTML page plus the atlas.json it embeds.
//
//   bun build.ts --config map.config.json [--modules modules.json] [--out dir]
//
// Anchors, not line numbers: the research file names code by a text fragment from its first
// line. The build finds the line, so excerpts and issue snippets always quote current source.

import { Glob } from "bun";
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, posix, resolve } from "node:path";

type Layer = { id: string; label: string; sub?: string; match: string[]; mayImport: string[] };
type Marker = { id: string; label: string; pattern: string };
type Branch = { name: string; ref?: string; worktree?: string; status: string; summary?: string };
type Config = {
  title: string;
  root: string;
  base: string;
  include: string[];
  exclude?: string[];
  aliases?: Record<string, string>;
  layers: Layer[];
  markers?: Marker[];
  branches?: Branch[];
  historyDays?: number;
};
type Severity = "high" | "medium" | "low";
type ResearchModule = {
  purpose?: string;
  notes?: string;
  symbols?: { name: string; kind?: string; anchor: string; summary?: string }[];
  excerpts?: { title: string; anchor: string; lines?: number; why?: string }[];
  issues?: {
    severity: Severity;
    category?: string;
    title: string;
    anchor: string;
    span?: number;
    detail: string;
    suggestion?: string;
  }[];
};
type Research = {
  modules?: Record<string, ResearchModule>;
  outside?: Record<string, { purpose: string; notes?: string }>;
  areas?: { id: string; title: string; summary: string; files: string[] }[];
  flows?: { id: string; title: string; steps: { file: string; symbol?: string; anchor?: string; what: string }[] }[];
};

const MAX_EXCERPT = 40;
const MAX_DIFF_LINES = 400;
const DEFAULT_MARKERS: Marker[] = [
  { id: "try", label: "try blocks", pattern: "\\btry\\s*\\{" },
  { id: "async", label: "async fns", pattern: "\\basync\\s+(function|\\(|[A-Za-z_$][\\w$]*\\s*=>)" },
  { id: "throw", label: "throw new", pattern: "\\bthrow\\s+new\\b" },
  { id: "class", label: "classes", pattern: "^\\s*(export\\s+)?(abstract\\s+)?class\\s" },
];

const args = new Map<string, string>();
for (let i = 2; i < process.argv.length; i += 2) args.set(process.argv[i]!.replace(/^--/, ""), process.argv[i + 1] ?? "");
const configPath = resolve(args.get("config") ?? "map.config.json");
const config: Config = JSON.parse(readFileSync(configPath, "utf8"));
const repo = resolve(dirname(configPath), config.root);
const researchPath = args.get("modules");
const research: Research = researchPath && existsSync(researchPath) ? JSON.parse(readFileSync(researchPath, "utf8")) : {};
const outDir = resolve(args.get("out") ?? join(dirname(configPath), "module-map"));
const warnings: string[] = [];

const git = (cwd: string, ...a: string[]) => {
  try {
    return execFileSync("git", ["-C", cwd, ...a], { maxBuffer: 1 << 28 }).toString();
  } catch {
    return "";
  }
};

// ---------- scan ----------
const excluded = (config.exclude ?? []).map((p) => new Glob(p));
const paths = new Set<string>();
for (const pattern of config.include)
  for (const f of new Glob(pattern).scanSync({ cwd: repo, dot: false }))
    if (!f.includes("node_modules/") && !excluded.some((g) => g.match(f))) paths.add(f.split("\\").join("/"));

const layerOf = (path: string) =>
  config.layers.find((l) => l.match.some((m) => (m.endsWith("/") ? path.startsWith(m) : path === m || path.startsWith(m + "/"))))?.id ??
  "other";

const EXTENSIONS = ["", ".ts", ".tsx", ".mts", ".js", ".jsx", ".mjs", "/index.ts", "/index.tsx", "/index.js"];
function resolveImport(from: string, spec: string): string | undefined {
  let base: string | undefined;
  if (spec.startsWith(".")) base = posix.normalize(posix.join(posix.dirname(from), spec));
  else
    for (const [alias, target] of Object.entries(config.aliases ?? {}))
      if (spec === alias.replace(/\/$/, "") || spec.startsWith(alias)) base = posix.normalize(target + spec.slice(alias.length));
  if (!base) return undefined;
  const stripped = base.replace(/\.(js|jsx|mjs)$/, "");
  for (const candidate of [base, stripped])
    for (const ext of EXTENSIONS) if (paths.has(candidate + ext)) return candidate + ext;
  return undefined;
}

const markers = config.markers ?? DEFAULT_MARKERS;
const IMPORT_RE = /(?:import|export)\s[^"'`;]*?from\s*["']([^"']+)["']|import\s*\(\s*["']([^"']+)["']\s*\)|import\s+["']([^"']+)["']|require\(\s*["']([^"']+)["']\s*\)/g;
const sources = new Map<string, string[]>();
type Scanned = { layer: string; lines: number; imports: string[]; external: string[]; markers: Record<string, number> };
const scanned = new Map<string, Scanned>();
for (const path of [...paths].sort()) {
  const text = readFileSync(join(repo, path), "utf8");
  const lines = text.split("\n");
  sources.set(path, lines);
  const internal = new Set<string>();
  const external = new Set<string>();
  for (const m of text.matchAll(IMPORT_RE)) {
    const spec = m[1] ?? m[2] ?? m[3] ?? m[4]!;
    const target = resolveImport(path, spec);
    if (target) internal.add(target);
    else if (!spec.startsWith(".")) external.add(spec.startsWith("@") ? spec.split("/").slice(0, 2).join("/") : spec.split("/")[0]!);
  }
  scanned.set(path, {
    layer: layerOf(path),
    lines: lines.length,
    imports: [...internal].sort(),
    external: [...external].sort(),
    markers: Object.fromEntries(markers.map((k) => [k.id, (text.match(new RegExp(k.pattern, "gm")) ?? []).length])),
  });
}

const importedBy = new Map<string, string[]>();
for (const [path, s] of scanned) for (const i of s.imports) importedBy.set(i, [...(importedBy.get(i) ?? []), path]);
const layerIndex = new Map(config.layers.map((l, i) => [l.id, l]));
const crosses = (from: string, to: string) => {
  if (from === to) return false;
  const rule = layerIndex.get(from)?.mayImport;
  return rule !== undefined && !rule.includes("*") && !rule.includes(to);
};

// ---------- anchors ----------
function findAnchor(path: string, anchor: string, what: string): number | undefined {
  const lines = sources.get(path);
  if (!lines) {
    warnings.push(`${what}: ${path} is not a scanned file`);
    return undefined;
  }
  const hits = lines.flatMap((l, i) => (l.includes(anchor) ? [i] : []));
  if (hits.length === 0) {
    warnings.push(`${what}: anchor not found in ${path}: ${JSON.stringify(anchor)}`);
    return undefined;
  }
  if (hits.length > 1) warnings.push(`${what}: anchor matches ${hits.length} lines in ${path}, using the first: ${JSON.stringify(anchor)}`);
  return hits[0]!;
}

// Extends from the anchor line to the end of its brace block, capped.
function blockEnd(lines: string[], start: number, cap: number): number {
  let depth = 0;
  let opened = false;
  for (let i = start; i < Math.min(lines.length, start + cap); i++) {
    const code = lines[i]!.replace(/(["'`])(?:\\.|(?!\1).)*\1/g, "").replace(/\/\/.*$/, "");
    for (const ch of code) {
      if (ch === "{" || ch === "(" || ch === "[") (depth++, (opened = true));
      else if (ch === "}" || ch === ")" || ch === "]") depth--;
    }
    if (opened && depth <= 0) return i;
    if (!opened && i > start && /;\s*$/.test(code)) return i;
  }
  return Math.min(lines.length, start + cap) - 1;
}

const slice = (path: string, from: number, to: number) => sources.get(path)!.slice(from, to + 1).join("\n");

// ---------- git ----------
const historyDays = config.historyDays ?? 90;
const history = new Map<string, { hash: string; date: string; subject: string }[]>();
{
  const log = git(repo, "log", `--since=${historyDays}.days`, "--name-only", "--format=@@%h%x09%as%x09%s");
  let current: { hash: string; date: string; subject: string } | undefined;
  for (const line of log.split("\n")) {
    if (line.startsWith("@@")) {
      const [hash, date, ...subject] = line.slice(2).split("\t");
      current = { hash: hash!, date: date!, subject: subject.join("\t") };
    } else if (line && current && scanned.has(line)) history.set(line, [...(history.get(line) ?? []), current]);
  }
}

type Hunk = { header: string; lines: string[] };
const branchDiffs = new Map<string, { branch: string; hunks: Hunk[]; added: number; removed: number; truncated: boolean }[]>();
const branches = (config.branches ?? []).map((b) => {
  const cwd = b.worktree ? resolve(repo, b.worktree) : repo;
  let diff = "";
  let head = "";
  if (b.worktree) {
    const mergeBase = git(cwd, "merge-base", config.base, "HEAD").trim();
    diff = mergeBase ? git(cwd, "diff", "--unified=3", mergeBase) : "";
    head = git(cwd, "log", "--oneline", "-1").trim();
  } else if (b.ref) {
    diff = git(repo, "diff", "--unified=3", `${config.base}...${b.ref}`);
    head = git(repo, "log", "--oneline", "-1", b.ref).trim();
  }
  if (!diff && b.status !== "merged") warnings.push(`branch ${b.name}: no diff against ${config.base} (missing ref or worktree?)`);
  const files: string[] = [];
  for (const chunk of diff.split(/^diff --git /m).slice(1)) {
    const path = chunk.match(/^\+\+\+ b\/(.+)$/m)?.[1] ?? chunk.match(/^--- a\/(.+)$/m)?.[1];
    if (!path) continue;
    files.push(path);
    const hunks: Hunk[] = [];
    let added = 0;
    let removed = 0;
    let count = 0;
    let truncated = false;
    for (const line of chunk.split("\n")) {
      if (line.startsWith("@@")) hunks.push({ header: line, lines: [] });
      else if (hunks.length && /^[ +-]/.test(line) && !line.startsWith("+++") && !line.startsWith("---")) {
        if (line[0] === "+") added++;
        if (line[0] === "-") removed++;
        if (++count > MAX_DIFF_LINES) truncated = true;
        else hunks.at(-1)!.lines.push(line);
      }
    }
    if (scanned.has(path)) branchDiffs.set(path, [...(branchDiffs.get(path) ?? []), { branch: b.name, hunks, added, removed, truncated }]);
  }
  return { ...b, head, files: files.filter((f) => scanned.has(f)) };
});

// ---------- assemble ----------
const modules = research.modules ?? {};
for (const key of Object.keys(modules)) if (!scanned.has(key)) warnings.push(`research names ${key}, which the scan did not find`);

const files = [...scanned].map(([path, s]) => {
  const r = modules[path] ?? {};
  const lines = sources.get(path)!;
  const symbols = (r.symbols ?? []).flatMap((sym) => {
    const at = findAnchor(path, sym.anchor, `symbol ${sym.name}`);
    return at === undefined ? [] : [{ name: sym.name, kind: sym.kind ?? "", summary: sym.summary ?? "", line: at + 1 }];
  });
  const excerpts = (r.excerpts ?? []).flatMap((ex) => {
    const at = findAnchor(path, ex.anchor, `excerpt "${ex.title}"`);
    if (at === undefined) return [];
    const end = ex.lines ? Math.min(lines.length - 1, at + Math.min(ex.lines, MAX_EXCERPT) - 1) : blockEnd(lines, at, MAX_EXCERPT);
    return [{ title: ex.title, why: ex.why ?? "", start: at + 1, code: slice(path, at, end), clipped: !ex.lines && end - at + 1 >= MAX_EXCERPT }];
  });
  const issues = (r.issues ?? []).flatMap((issue) => {
    const at = findAnchor(path, issue.anchor, `issue "${issue.title}"`);
    if (at === undefined) return [];
    const span = Math.max(1, Math.min(issue.span ?? 1, 12));
    const from = Math.max(0, at - 2);
    const to = Math.min(lines.length - 1, at + span - 1 + 3);
    return [{ ...issue, category: issue.category ?? "", suggestion: issue.suggestion ?? "", line: at + 1, span, snippetStart: from + 1, snippet: slice(path, from, to) }];
  });
  const imports = s.imports;
  return {
    path,
    layer: s.layer,
    lines: s.lines,
    purpose: r.purpose ?? "",
    notes: r.notes ?? "",
    imports,
    importedBy: (importedBy.get(path) ?? []).sort(),
    external: s.external,
    violations: imports.filter((i) => crosses(s.layer, scanned.get(i)!.layer)),
    markers: s.markers,
    symbols,
    excerpts,
    issues,
    history: (history.get(path) ?? []).slice(0, 8),
    churn: history.get(path)?.length ?? 0,
    diffs: branchDiffs.get(path) ?? [],
  };
});

const flows = (research.flows ?? []).map((flow) => ({
  ...flow,
  steps: flow.steps.map((step) => {
    const at = step.anchor ? findAnchor(step.file, step.anchor, `flow ${flow.id}`) : undefined;
    return { ...step, line: at === undefined ? undefined : at + 1 };
  }),
}));
for (const area of research.areas ?? [])
  for (const f of area.files) if (!scanned.has(f)) warnings.push(`area ${area.id} names ${f}, which the scan did not find`);

const layers = [...config.layers, ...(files.some((f) => f.layer === "other") ? [{ id: "other", label: "Other", sub: "matched no layer", match: [], mayImport: ["*"] }] : [])];
const atlas = {
  title: config.title,
  generatedAt: new Date().toISOString(),
  commit: git(repo, "log", "--oneline", "-1").trim(),
  base: config.base,
  historyDays,
  layers: layers.map(({ id, label, sub, mayImport }) => ({ id, label, sub: sub ?? "", mayImport })),
  markers: markers.map(({ id, label }) => ({ id, label })),
  files,
  outside: Object.entries(research.outside ?? {}).map(([path, v]) => ({ path, purpose: v.purpose, notes: v.notes ?? "" })),
  areas: research.areas ?? [],
  flows,
  branches,
};

mkdirSync(outDir, { recursive: true });
const json = JSON.stringify(atlas);
writeFileSync(join(outDir, "atlas.json"), json);
const template = readFileSync(join(import.meta.dir, "..", "assets", "map.html"), "utf8");
const page = template
  .replace("<title>Module Map</title>", `<title>${config.title.replace(/[<&]/g, "")}</title>`)
  .replace('<script type="application/json" id="atlas-data"></script>', () => `<script type="application/json" id="atlas-data">${json.replace(/</g, "\\u003c")}</script>`);
writeFileSync(join(outDir, "index.html"), page);

const count = (k: "symbols" | "excerpts" | "issues") => files.reduce((n, f) => n + f[k].length, 0);
const described = files.filter((f) => f.purpose).length;
console.log(
  [
    `wrote ${join(outDir, "index.html")} (${(page.length / 1024).toFixed(0)} KiB)`,
    `files=${files.length} described=${described} symbols=${count("symbols")} excerpts=${count("excerpts")} issues=${count("issues")}`,
    `crossings=${files.reduce((n, f) => n + f.violations.length, 0)} areas=${atlas.areas.length} flows=${flows.length} branches=${branches.length}`,
  ].join("\n"),
);
if (described < files.length) console.log(`undescribed: ${files.length - described} files`);
if (warnings.length) console.log(`\n${warnings.length} warning(s):\n` + warnings.map((w) => `  - ${w}`).join("\n"));
