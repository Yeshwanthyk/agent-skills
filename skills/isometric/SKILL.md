---
name: isometric
description: Map a repository as a self-contained isometric city HTML artifact sized from measured source facts.
disable-model-invocation: true
---

# Isometric Codebase Map

Create one self-contained HTML page that maps a repository as an isometric city. Every architectural claim is traceable to the repository. Copy the bundled engine. Verify the interactive states. Scrub operational details before publishing.

## Output

- One `.html` file with no network-loaded scripts, styles, fonts, images, or other dependencies.
- Copy [`references/isometric-template.html`](references/isometric-template.html) and replace only its marked `DATA` section unless an engine fix is necessary.
- Keep the hatched drafting-paper chrome: isometric blocks, zone boxes, animated edge dots, left structure rail, right `WHAT IT DOES` / `HOW IT IS BUILT` tabs, pause / trace-one-step / reset, pan and zoom, drill-downs, URL-hash debug states, and map favicon.
- Every displayed number has a scan command behind it.
- A reference screenshot is visual direction only. Structures, sizes, edges, and traces still come from the scan.
- Publish through the current surface's artifact/file-preview mechanism, and open it in the surface browser when asked. Updates rewrite the existing stable artifact.

## Workflow

### 1. Inventory the repository

Spawn thorough repository exploration subagents when the host allows it; otherwise scan directly. Return:

1. 15-35 major subsystems. For each: a short name; directory and key files; one or two plain-English sentences; measured size as files and/or lines of code; directed connections and what flows on each.
2. One canonical request from entry point to response, including asynchronous work.
3. Databases and other storage roles.
4. Headline counts measured from source: total source LOC, routers/routes, features, test files, and deployed services.
5. Deployed **services** counted only from deployment config, distinct from code-level **roles** such as workers, adapters, or libraries.
6. The commands, exclusions, and files behind every count.

Exclude generated code, vendored dependencies, build output, caches, and lockfiles from LOC unless one of them is architecturally important. Prefer `scc`, `cloc`, or framework-aware discovery; otherwise use reproducible `rg`/`wc` and record the exclusions. Inspect manifests, deployment configuration, entry points, route registration, database clients, queue/event producers and consumers, tests, and dependency direction.

Reconcile into 15-35 viewer-level structures before drawing. Merge tiny helpers into their owning subsystem; split only genuinely distinct architectural responsibilities. Every map label, LOC value, statistic, edge, and trace step names its source file or command.

### 2. Populate the template data

Copy `references/isometric-template.html`. Read the schema comments in the marked `DATA` section. Replace every sample value. Set `SAMPLE_DATA` to `false`.

Populate:

- `TITLE`, `SUBTITLE`, and `STATS` from the scan.
- `GROUPS` for the left-rail zones.
- `STRUCTURES` with `id`, two-character `code`, `name`, `group`, measured `loc`, `gx,gy`, `w,d`, `h`, `what`, `how`, and `talks`. Add `children` for meaningful drill-downs and `slab:true` for storage. Wrap key nouns in `what`/`how` with `«chevrons»`.
- `EDGES` with `f`, `t`, and `pay`. `flow:1` for the canonical path; `dashed:1` for advisory, build, or CI relationships. `via:[[gx,gy], ...]` only when the default elbow would cut through an unrelated cluster.
- `EXTERNALS` with an off-map label, target structure, map anchor, and a generic boundary description.
- `TRACE` with 10-14 `[structureId, sentence]` steps for one real request from entry to response.
- `OVERVIEW_WHAT` and `OVERVIEW_HOW` as short essays grounded in the scan.

Plain language in `what`. Concrete implementation language in `how`. Every `talks` id resolves. Code paths in `how` are useful and share-safe.

Document the height scale in the DATA comment. Tallest block is the largest measured subsystem; others scale from that maximum. Typical clamp: `h = clamp(round(2 + 6 * loc / maxLoc), 2, 8)`, storage `slab:true`.

### 3. Lay out the city

Projection: `x=(gx-gy)*26`, `y=(gx+gy)*14.3 - h*16`.

- Footprints are disjoint. Painter order is `gx+gy`.
- Browser/client surfaces toward the top, APIs below them, agent/AI roles to the right, ingestion to the left, core domain in the center, compute below the core, storage slabs along the bottom, CI/delivery in a corner.
- Ordinary edges use the built-in L elbow. Add the fewest possible waypoints.

After the first render, adjust only layout coordinates, footprints, heights, and edge waypoints.

### 4. Verify all required views

From this skill directory:

```bash
python3 scripts/validate_isometric.py /absolute/path/to/isometric-codebase-map.html
```

Pass `--forbid-prefix PREFIX` once for each known company or cloud resource prefix.

Then Playwright at 1800x1000 for the default view, one structure that has `children`, and trace step 7:

```bash
npx --yes playwright screenshot --viewport-size=1800,1000 "file:///absolute/path/to/isometric-codebase-map.html" /tmp/isometric-default.png
npx --yes playwright screenshot --viewport-size=1800,1000 "file:///absolute/path/to/isometric-codebase-map.html#inside=STRUCTURE_ID" /tmp/isometric-inside.png
npx --yes playwright screenshot --viewport-size=1800,1000 "file:///absolute/path/to/isometric-codebase-map.html#trace=7" /tmp/isometric-trace-7.png
```

If Playwright cannot open `file://`, serve the containing directory on localhost and capture the equivalent hash URLs. Keep the delivered HTML self-contained.

Inspect every screenshot at full size. Fix and reshoot for clipped or overlapping labels, clipped external callouts, isolated blocks, edges crossing unrelated clusters, a broken isometric painter order, an empty right panel, a broken drill-down, an incorrect trace highlight, or missing flow dots.

### 5. Share-safety pass

Assume the user may post the map publicly. Keep code structure, module names, measured LOC, and general stack choices. Remove from the artifact:

- concrete cloud resources, queue/topic names, project/account IDs, regions tied to resource names, and resource shapes;
- public or private endpoint paths;
- credential locations, mount paths, API-key prefixes or formats, and secret names;
- internal email addresses or user handles.

Use generic boundaries such as "managed queue", "object storage", "model provider", or "external SaaS". Scrub only the map output.

The validator treats `@` as a share-safety hit, so keep CSS free of at-rules. Run the validator again, then search the final HTML for company prefixes, the at-sign, credential-related terms, known key prefixes, URLs, endpoint-like paths, and mount roots. Resolve every match or explain why it is harmless. A safety term inside a harmless module name gets a safe display alias; keep the exact path in working notes.

Tell the user: **The artifact stays private until you share it from the page menu.**

## Updating an existing map

Re-scan the changed areas and downstream dependencies. Keep stable structure IDs, coordinates, and the artifact filename where the architecture is unchanged. Refresh every affected count, description, edge, child, trace step, and headline statistic, then rerun verify and share-safety.

## Inventory bounds

- Host has no subagents: scan directly with the same fact standard.
- Fewer than 15 honest structures: represent cohesive modules or roles, and say why.
- More than 35 candidates: group helpers under their owning subsystem; expose important internals as `children`.
- No LOC utility: `rg --files` filters plus `wc -l`, with exclusions recorded.

## Completion

The map is done when `SAMPLE_DATA` is false, the validator passes, the default / inside / trace-7 views are legible without console errors, the safety search is resolved, and the saved path is reported.
