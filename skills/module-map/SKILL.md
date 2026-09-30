---
name: module-map
description: Build an interactive module map of a TypeScript/JavaScript codebase for architecture review. Use to map a repo's modules, layers, or dependencies, or review its structure file by file.
---

# Module Map

Build a **module map**: one self-contained page where every file of a repository is a tile, laid out by layer and sized by length, and picking a tile opens a **file review**. The review reads like a pull request of the file as it stands: what it does, its issues against the live code, the code worth reading, what open branches change, where it sits in the dependency graph, and a place for the owner's call.

Two sources feed it. The **scan** is mechanical and the build redoes it every time: files, lines, layers, imports, crossings, style markers, git churn and branch diffs. The **research** is judgment written by agents who read every file: purposes, symbols, excerpts, issues, feature areas and control flows. Research points at code by **anchor** (a text fragment of the line), so the page always quotes current source and a stale anchor fails the build loudly.

## Process

1. **Configure.** Read the repository's `AGENTS.md`/`CLAUDE.md`, tsconfig paths and directory layout, and write `map.config.json` ([schema and example](references/atlas-schema.md#config-mapconfigjson)) in the scratchpad. Layers carry the repository's own dependency rule as `mayImport`; markers count the idioms its conventions push toward or away from; branches list open work worth reviewing. Done when every layer rule traces to a written convention or the owner's word.
2. **Scan.** `bun scripts/build.ts --config map.config.json`. Done when every source file you expect appears in `files=`, nothing unexpected lands in "Other", and the crossings count matches what a spot-check of two flagged imports confirms.
3. **Research.** Dispatch read-only subagents with [`references/research-brief.md`](references/research-brief.md), one per layer or roughly 40 files, each writing its own JSON; give one agent the areas and flows. Merge the parts into `modules.json`. Done when every scanned file has a purpose.
4. **Build.** `bun scripts/build.ts --config map.config.json --modules modules.json`. Fix each warning at its source (a missing or ambiguous anchor, a path the scan lacks) and rebuild. Done when the build prints `described` equal to `files` and zero warnings.
5. **Check.** Open `module-map/index.html` in a browser. Open the file with the most issues and confirm each issue's highlighted line is the code its detail describes; do the same for one excerpt and one flow step. Click a dependency node, filter the map, switch every tab. Done when every issue you checked lands on its line and every tab renders.
6. **Deliver.** Publish `module-map/index.html` as an Artifact with `capabilities: {db: {}}` so the owner's marks persist and you can read them back; otherwise hand over the local file, where marks stay in the browser and copy out as JSON. Report the counts and the three most severe issues.
7. **Act on marks.** When the owner returns, read the `marks` collection (document id is the path with `/` replaced by `~`; fields `path`, `verdict`, `note`). Verdicts are `keep`, `move`, `split`, `rewrite`, `question`. Turn them into a plan grouped by verdict, and rebuild the map after the changes land.

## Supporting Files

- [`scripts/build.ts`](scripts/build.ts): scan, merge, resolve anchors, attach git data, write `atlas.json` and the inlined `index.html`. Runs with Bun, no dependencies.
- [`assets/map.html`](assets/map.html): the page. The build inlines the atlas into it; edit it to change the review panel or the tabs.
- [`references/atlas-schema.md`](references/atlas-schema.md): the config and research-file shapes.
- [`references/research-brief.md`](references/research-brief.md): the research agent prompt, with the anchor rules and issue severities.

## Completion

The map is complete when the build is clean (every file described, zero warnings), every checked issue lands on the line it describes, the page works on every tab, and the owner has the link or path with the counts and top issues.
