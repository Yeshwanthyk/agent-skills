---
name: viz
description: "Render an interactive flow, DAG, trigger map, sequence, state machine, call tree, or call diff from a few lines of text, inline in T3 Code or as an HTML page. Use for viz, visualize, graph, or any diagram."
---

# Viz

One fixed renderer, [`assets/viz.js`](assets/viz.js), draws every visual. The agent writes only data in the [grammar](references/grammar.md), so a visual costs about as many tokens as the ASCII tree it replaces. In exchange it gets step replay, a node inspector, edge tracing, filtering, and path copy.

## Pick the view

Model the code as nodes, paths and a view in one `== graph` section, not as hand-built HTML. Every shape below comes from the same renderer, with hover tracing, replay and the inspector built in.

- Data moving between components (branches, fallbacks, async hops, failure exits) → `view: flow`, the default. Label each edge with what moves and declare edges in the order they happen; the numbers follow.
- Who acts, what it sends, what filters it, what results → `ranks:` columns. Write one path per trigger, ending `=> result` when it gets through and `=| result` when it is filtered out. Teams or services as bands → add `lane:`.
- Which inputs a check reads and which triggers keep each one fresh → a `== cover` section after the graph. Rows point at path names; gaps fall out of the paths. A writer × field matrix → `columns: <rank>`.
- Requests between services over time → `view: seq`, with `at:` times when the waiting matters.
- The life of one field or job → `view: states`, with one path per story (`!giveup: running > blocked => dead`). A user-facing flow adds a start dot (`[*] -> form`), tones for categories, and `group` boxes for phases ([grammar](references/grammar.md#views)).
- A call stack at one moment, with the values that went wrong → `view: stack` and `locals:`.
- A change, on one layout → `+` and `-` on nodes and paths; the reader gets a before | both | after toggle.
- When the why of each step matters → give paths a `| payload | narration` tail. Each one becomes a replay step.
- A design doc that walks a reader through scenarios → add `theme drawing`, `shows: id = text` under steps for what each box finds, and a `meter:` when one number decides the outcome ([grammar](references/grammar.md#drawing-theme-and-story-detail)).
- Which state each service is in after each message → `sets: id=*charging` under a `view: seq` edge, plus `state:` under a node for where it starts. Each lifeline shows a state pill after every message that changes it.
- How much volume takes each way through (traffic split, funnel, where requests are lost) → `view: sankey`, with `weight:` under each path. Band width is volume.
- What runs at the same time, and where two workers overlap or wait on each other → `== timing`, one lane per worker and a `!window` over the race.
- Where a request spends its time, and what bounds it → `== gantt`, using `after` to chain bars. The critical path and slack are computed; `budget:` draws the limit.
- An incident's suspected causes and which are ruled in or out → `== causes` (a fishbone).
- Work items across stages (shards in a backfill, jobs in a pipeline), with WIP limits and what's blocked → `== board`.
- One quantity over time (a queue depth, a lag, a pool in use) against thresholds → `== stock`, with `meter:` bands.
- A page that will be saved, printed or shared → `theme paper` (ink on a grid sheet). Every view supports it. It paints its own sheet, so keep it off inline T3 renders, which sit on the thread background.
- Who calls whom → `== tree`.
- What a change did to a call tree → `== diff`. Run calldiff through the converter rather than hand-writing it:

```bash
python3 <viz>/scripts/viz.py calldiff main HEAD --max-depth 4 <paths>   # prints base + == diff, unchanged subtrees collapsed
python3 <viz>/scripts/viz.py calltree --entry submitForm
```

Ground every node in the code: give each node an `@path:line`, mark anything you have not read with `?`, and put reads, writes, and failure behaviour in detail lines.

## Show it

**T3 Code** (the tool list has `html_render`): write the page straight into `html_preview`, read its console for `viz:` parse errors, then pass the same page to `html_render`. Do not paste viz.js.

```html
<!doctype html><script src="https://cdn.jsdelivr.net/gh/Yeshwanthyk/agent-skills@761677a27ca5d1f3efb1b19fb06278a6b8f7c90b/skills/viz/assets/viz.js"></script>
<script type="text/viz">
…
</script>
```

If the preview console shows the script failed to load, save the data to `/tmp/viz/<name>.viz` and use the output of `viz.py t3 /tmp/viz/<name>.viz --inline`. It works, but it costs about 6k more tokens.

**Anywhere else**: save the data to `/tmp/viz/<name>.viz`, then run `python3 <viz>/scripts/viz.py html /tmp/viz/<name>.viz --open`. It reports parse errors, writes `/tmp/viz/<name>.html` with the renderer inlined, and opens it in the browser. In pi with glimpse installed, open that file there instead ([pi](../yesh-router/references/hosts/pi.md)). Report the path.

**Inside a saved page that must stay self-contained** (a page the user keeps or shares): write `text/viz` blocks where the views belong, end the body with `<script data-viz></script>`, and run `viz.py inline page.html`. Rerun it after updating viz.js. Give a story caption, table row or glossary term `data-viz-id="<node id or path name>"` and hovering it lights that part of every graph on the page, with no page script.

## Reply

The visual carries the structure. The reply adds only what it can't show: what you did not verify, and the one thing to look at first.

## Completion

Done when the visual renders without `viz:` errors, every node is grounded or marked `?`, and you have seen it where the reader will look: inline in T3, or a screenshot of the opened page elsewhere. A headless load, a `curl`, or a clean console is not seeing it; when you could not look, say so instead of calling it rendered.
