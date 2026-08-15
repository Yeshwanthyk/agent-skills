---
name: isometric
description: >-
  Turn a software repository into a single self-contained interactive HTML artifact: an isometric, hatched drafting-paper architecture map sized from measured codebase facts, with structure navigation, hover explanations, animated data flows, drill-down views, and request traces. Use when the user asks to "make an isometric codebase map", "make one for my codebase", "turn this repo into a visual diagram", "visual map of the architecture", requests a FleetingBits-style isometric repository view, or wants to update an existing isometric map. Do not use for a single mechanism diagram in prose, Mermaid or flowchart requests, or product UI mockups.
---

# Isometric Codebase Map

Create one polished, self-contained HTML page that maps a repository as an isometric city. Keep every architectural claim traceable to the repository, preserve the bundled rendering engine, verify the important interactive states, and scrub operational details before publishing.

## Non-negotiable output contract

- Produce one `.html` file with no network-loaded scripts, styles, fonts, images, or other dependencies.
- Start from [`references/isometric-template.html`](references/isometric-template.html). Copy it to a scratch or output location, then replace only its marked `DATA` section unless an engine fix is necessary.
- Preserve the hatched drafting-paper chrome: isometric blocks, zone boxes, animated edge dots, left structure rail, right `WHAT IT DOES` / `HOW IT IS BUILT` tabs, pause / trace-one-step / reset controls, pan and zoom, drill-downs, URL-hash debug states, and map favicon.
- Derive every displayed number from a repository scan. Never estimate a count and present it as measured.
- Publish or attach the stable HTML file through the current surface's artifact/file-preview mechanism, and open it in the surface browser when the user asks. When updating a map, modify the existing stable artifact instead of creating a differently named copy.

## Workflow

### 1. Inventory the repository

Spawn thorough repository exploration subagents when the host allows it; otherwise scan directly. Give this exact output contract:

1. Identify 15-35 major subsystems. For each, return:
   - a short name;
   - its directory and key files;
   - one or two plain-English sentences for a non-expert;
   - measured size as files and/or lines of code;
   - directed connections to other subsystems and what flows on each connection.
2. Describe one canonical request from entry point to response, including asynchronous work.
3. Identify databases and other storage roles.
4. Report headline counts that can be measured from source, such as total source LOC, routers/routes, features, test files, and deployed services.
5. Correct any assumed subsystem list against the code. Distinguish deployed **services** from code-level **roles** such as workers, adapters, or libraries.
6. Return the commands, exclusions, and files used to support every count.

Exclude generated code, vendored dependencies, build output, caches, and lockfiles from LOC unless the repository makes one of them architecturally important. Prefer `scc`, `cloc`, or framework-aware discovery; otherwise use reproducible `rg`/`wc` commands and document the exclusions. Inspect manifests, deployment configuration, entry points, route registration, database clients, queue/event producers and consumers, tests, and dependency direction. Do not infer a deployed service merely because a directory is named like one.

Before drawing, reconcile the inventory into 15-35 viewer-level structures. Merge tiny helpers into their owning subsystem and split only genuinely distinct architectural responsibilities. Keep a fact table in working notes so each map label, LOC value, statistic, edge, and trace step has a source.

### 2. Populate the template data

Copy `references/isometric-template.html` without recreating its engine. Read the schema comments in the marked `DATA` section, then replace all sample values and set `SAMPLE_DATA` to `false`.

Populate:

- `TITLE`, `SUBTITLE`, and `STATS` with repository-derived text and counts.
- `GROUPS` with the zones used by the left rail.
- `STRUCTURES` with `id`, two-character `code`, `name`, `group`, measured `loc`, grid position `gx,gy`, footprint `w,d`, visual height `h`, `what`, `how`, and `talks`. Add `children` for meaningful drill-downs and `slab:true` for flat storage blocks. Wrap key nouns in `what`/`how` with `«chevrons»` so the engine can highlight them.
- `EDGES` with `f`, `t`, and `pay`. Use `flow:1` for the canonical/main data path and `dashed:1` for advisory, build, or CI relationships. Add `via:[[gx,gy], ...]` only when the default elbow would cut through an unrelated cluster.
- `EXTERNALS` with an off-map label, the structure it connects to, a map anchor, and a generic description of what crosses the boundary.
- `TRACE` with 10-14 `[structureId, sentence]` steps for one real request from entry to response.
- `OVERVIEW_WHAT` and `OVERVIEW_HOW` with short, non-expert essays grounded in the scan.

Use plain language in `what` and concrete implementation language in `how`. `talks` contains structure IDs, so every value must resolve. Keep code paths in `how` useful but share-safe.

Document the height scale in the DATA comment. Make the largest measured subsystem the tallest block; scale others from that maximum. A typical clamp is `h = clamp(round(2 + 6 * loc / maxLoc), 2, 8)` with storage as `slab:true`.

### 3. Lay out the city

Use the template projection exactly: `x=(gx-gy)*26`, `y=(gx+gy)*14.3 - h*16`.

- Keep footprints disjoint. Painter order is `gx+gy`; do not add z-index hacks.
- Place browser/client surfaces toward the top, APIs below them, agent/AI roles to the right, ingestion to the left, core domain in the center, compute below the core, storage slabs along the bottom, and CI/delivery in a corner.
- Render storage as flat slabs.
- Make the core domain visually discoverable in the center.
- Let ordinary edges use the built-in L elbow. Add the fewest possible waypoints.

After the first render, adjust only layout coordinates, footprints, heights, and edge waypoints to improve legibility. Do not change facts to make the drawing prettier.

### 4. Verify all required views

Run the bundled validator first:

```bash
python3 path/to/isometric/scripts/validate_isometric.py /absolute/path/to/isometric-codebase-map.html
```

Pass `--forbid-prefix PREFIX` once for each known company or cloud resource prefix that must not appear.

Then use Playwright against the local file at a 1800x1000 viewport. Capture at least the default view, one structure that has `children`, and trace step 7:

```bash
npx --yes playwright screenshot --viewport-size=1800,1000 "file:///absolute/path/to/isometric-codebase-map.html" /tmp/isometric-default.png
npx --yes playwright screenshot --viewport-size=1800,1000 "file:///absolute/path/to/isometric-codebase-map.html#inside=STRUCTURE_ID" /tmp/isometric-inside.png
npx --yes playwright screenshot --viewport-size=1800,1000 "file:///absolute/path/to/isometric-codebase-map.html#trace=7" /tmp/isometric-trace-7.png
```

Inspect every screenshot at full size. Fix and reshoot if any of these appear:

- clipped or overlapping labels;
- clipped external callouts;
- isolated or unexplained blocks;
- edges crossing unrelated clusters when a waypoint would fix them;
- a block order that breaks the isometric illusion;
- an empty right panel, broken drill-down, incorrect trace highlight, or missing animated flow dots.

Do not publish until all three views are legible and the browser console is free of errors.

### 5. Perform the share-safety pass

Assume the user may post the map publicly. Preserve code structure, module names, measured LOC, and general stack choices, but remove operationally sensitive detail from the artifact:

- concrete cloud resources, queue/topic names, project/account IDs, regions tied to resource names, and resource shapes;
- public or private endpoint paths;
- credential locations, mount paths, API-key prefixes or formats, and secret names;
- internal email addresses or user handles.

Use generic boundaries such as "managed queue", "object storage", "model provider", or "external SaaS" when specificity would expose live infrastructure. Scrub only the map output; never rewrite repository source during this pass.

Run the validator again, then manually search the final HTML for the company's naming prefixes, the at-sign, credential-related terms, known key prefixes, URLs, endpoint-like paths, and mount roots. Resolve every match or explain why it is harmless before publishing.

Tell the user: **The artifact stays private until you share it from the page menu.**

## Updating an existing map

Re-scan the changed areas and any downstream dependencies. Preserve stable structure IDs, coordinates, and the artifact filename where the architecture has not changed. Refresh every affected count, description, edge, child, trace step, and headline statistic; then rerun the complete validation, screenshot, and safety workflow.

## Examples

### New map

User: "Make an isometric codebase map for this repo."

Result: inventory the repository, populate a copied template, verify default/drill-down/trace states, scrub operational details, and publish one stable HTML artifact.

### Screenshot-inspired request

User: "Make this repository look like that isometric FleetingBits architecture map."

Result: use the screenshot only as visual direction; derive all structures, sizes, connections, and counts from the repository. Keep the bundled engine.

### Existing artifact update

User: "Update our isometric map for the new ingestion pipeline."

Result: retain unaffected IDs and layout, rescan ingestion and its dependencies, update facts and flows, and republish the same artifact after full verification.

## Common issues

- **No subagent support:** perform the inventory directly and keep the same structured fact table and evidence standard.
- **Fewer than 15 meaningful subsystems:** represent cohesive modules or architectural roles, but do not invent deployed services. If the repository truly cannot support 15 honest structures, use fewer and state why.
- **More than 35 candidates:** group helpers, adapters, and leaf packages under their owning subsystem; expose important internals as `children` instead.
- **No LOC utility installed:** use reproducible `rg --files` filters plus `wc -l`, and record exclusions.
- **Playwright cannot open `file://`:** serve the containing directory on localhost and capture the equivalent hash URLs. Keep the delivered HTML self-contained.
- **The validator reports sample data:** replace every sample statistic, description, structure, edge, external, and trace step; then set `SAMPLE_DATA` to `false`.
- **A safety term is part of a harmless module name:** prefer a safe display alias and retain the exact module path only in private working notes.
- **CSS at-rules:** the share-safety validator rejects `@`. Do not add `@media`, `@import`, or `@keyframes`.
