# Atlas schema

The two inputs to `scripts/build.ts`. The build derives everything else (lines, imports, importers, crossings, markers, history, diffs) from the repository.

## Config (`map.config.json`)

```json
{
  "title": "Ziggy Module Map",
  "root": "/path/to/ziggy",
  "base": "main",
  "include": ["src/**/*.ts"],
  "exclude": ["src/generated/**", "**/*.d.ts", "**/*.test.ts"],
  "aliases": { "ziggy/": "src/" },
  "layers": [
    { "id": "main", "label": "Entrypoint", "sub": "the only place Effects run", "match": ["src/main.ts"], "mayImport": ["*"] },
    { "id": "faces", "label": "Faces", "sub": "CLI and UI input", "match": ["src/faces/"], "mayImport": ["*"] },
    { "id": "application", "label": "Application", "match": ["src/application/"], "mayImport": ["application", "domain"] },
    { "id": "domain", "label": "Domain", "match": ["src/domain/"], "mayImport": ["domain"] },
    { "id": "adapters", "label": "Adapters", "match": ["src/adapters/"], "mayImport": ["adapters", "domain"] }
  ],
  "markers": [
    { "id": "try", "label": "try blocks", "pattern": "\\btry\\s*\\{" },
    { "id": "run", "label": "Effect.run", "pattern": "Effect\\.run(Promise|Sync|Fork)?\\b" }
  ],
  "branches": [
    { "name": "feat/cache", "ref": "feat/cache", "status": "open", "summary": "Caches provider lists per profile." },
    { "name": "wip-agent", "worktree": "../ziggy-wip", "status": "in progress" }
  ],
  "historyDays": 90
}
```

- `root`: the repository, absolute or relative to the config file.
- `base`: the branch that diffs and merge-bases compare against.
- `include`, `exclude`: globs relative to `root`. `node_modules` is always skipped.
- `aliases`: import prefixes that map to repository paths (tsconfig `paths`, package self-imports).
- `layers`: in the order the page draws them, outermost first. A `match` entry ending in `/` is a directory prefix; otherwise it is an exact file or directory. The first matching layer wins; unmatched files land in a generated "Other" layer. `mayImport` lists the layer ids this layer may depend on (its own id included), or `"*"`. Every other internal import is a **crossing**.
- `markers`: regexes (multiline, counted per file) for the style you are moving toward or away from. Defaults: try blocks, async functions, `throw new`, classes.
- `branches`: `ref` diffs `base...ref`; `worktree` diffs the working tree at that path (committed and uncommitted) against its merge-base with `base`. `status` `merged` hides the branch from the map dots.
- `historyDays`: the window for churn and recent commits. Default 90.

## Research file (`modules.json`)

```json
{
  "modules": {
    "src/main.ts": {
      "purpose": "Parses argv, builds the layer graph and runs the chosen command through BunRuntime.",
      "notes": "Also owns the fallback help text, which belongs with the CLI face.",
      "symbols": [
        { "name": "main", "kind": "const", "anchor": "const main =", "summary": "The program: parse, provide layers, run." }
      ],
      "excerpts": [
        { "title": "The execution edge", "anchor": "BunRuntime.runMain(", "why": "The one place an Effect runs; everything else composes." }
      ],
      "issues": [
        {
          "severity": "medium",
          "category": "error-handling",
          "title": "Unknown commands exit 0",
          "anchor": "default: return Effect.void",
          "detail": "`ziggy frobnicate` prints nothing and exits 0, so scripts treat typos as success.",
          "suggestion": "Fail with a `UnknownCommand` error and let the CLI face print usage and exit 2."
        }
      ]
    }
  },
  "outside": {
    "extensions/": { "purpose": "Repository-owned Pi packages, loaded per Profile.", "notes": "Not scanned file by file." }
  },
  "areas": [
    { "id": "chat", "title": "Chat gateways", "summary": "Slack and Discord in, turns out. Each gateway owns its transport and shares the turn runner.", "files": ["src/faces/slack/app.ts"] }
  ],
  "flows": [
    {
      "id": "run",
      "title": "`ziggy run \"<prompt>\"`",
      "steps": [{ "file": "src/main.ts", "symbol": "main", "anchor": "const main =", "what": "Parses argv and selects the run command." }]
    }
  ]
}
```

- Keys under `modules` and paths in `areas` and `flows` are repository-relative and must be scanned files. `outside` is free-form: directories or files the scan skips.
- `anchor`: an exact substring of the first line the item refers to, unique in the file. The build resolves it to a line number on every build.
- `symbols[].kind`: `function`, `const`, `class`, `type`, `interface`, `service`, `layer`, or whatever the language calls it.
- `excerpts[].lines`: fixed length. Without it the excerpt runs to the end of the anchor's brace block. Either way it stops at 40 lines.
- `issues[].severity`: `high`, `medium` or `low` ([definitions](research-brief.md)). `span`: how many lines from the anchor to highlight (1–12, default 1). The page shows two lines before and three after.
- Every string may use backticks for inline code.
