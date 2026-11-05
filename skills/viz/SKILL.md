---
name: viz
description: "Render an interactive diagram or chart from a few lines of text, inline in T3 Code or as an HTML page: flow, DAG, sequence, state machine, call tree or call diff; timing of a race, gantt of where latency goes, sankey of a traffic split, fishbone of incident causes, kanban of work items, stock-and-flow of a queue over time. Use for viz, visualize, graph, chart, or any diagram."
---

# Viz

One fixed renderer, [`assets/viz.js`](assets/viz.js), draws every visual. The agent writes only data in the [grammar](references/grammar.md), so a visual costs about as many tokens as the ASCII tree it replaces. In exchange it gets step replay, a node inspector, edge tracing, filtering, and path copy.

## Pick the view

Write data, not HTML: a `== graph` section (nodes, paths and a `view:`) or one of the chart sections, `== timing`, `gantt`, `causes`, `board` and `stock` ([charts](references/grammar.md#charts-timing-gantt-causes-board-stock)). Pick by the question the reader is asking.

**How does it flow?**
- Data moving between components (branches, fallbacks, async hops, failure exits) → `view: flow`, the default. "Walk me through" adds a narration tail (below). Label each edge with what moves and declare edges in the order they happen; the numbers follow.
- Who acts, what it sends, what filters it, what results → `ranks:` columns, one path per trigger, ending `=> result` when it gets through and `=| result` when it is filtered out. Teams or services as bands → add `lane:`.
- Requests between services over time → `view: seq`, with `at:` times when the waiting matters. Pick seq over flow when the order of calls and the waits between them are the point, and flow when the branches are. Which state each service is in after each message → `sets: id=*charging` under an edge and `state:` under a node.
- The life of one field or job → `view: states`, one path per story (`!giveup: running > blocked => dead`). A user-facing flow adds a start dot (`[*] -> form`), tones and `group` boxes ([views](references/grammar.md#views)).
- Who calls whom → `== tree`. A call stack at one moment, with the values that went wrong → `view: stack` and `locals:`.

**When, and for how long?**
- What runs at the same time: a race, a lock wait, overlapping retries → `== timing`, one lane per worker and a `!window` over the overlap.
- Where a request's latency goes and which chain bounds it (critical path, slack) → `== gantt`, chaining bars with `after`; `budget:` draws the limit. For a regression, draw the slow case and set `budget:` to the old number.

**How much?**
- How volume splits: a traffic split, a funnel, where requests drop off → `view: sankey`, with `weight:` under each path and `=| left` ending traffic that drops off. Use sankey over `ranks:` when the volume matters.
- One quantity over time against thresholds (queue depth, lag, pool in use), as stock-and-flow → `== stock`, with `meter:` bands. For a pattern that repeats, plot one typical window and say which.

**Why did it break, and where is it stuck?**
- An incident's suspected causes, ruled in or out → `== causes`, a fishbone.
- Work items across stages (shards in a backfill, jobs in a pipeline), with WIP limits and what is blocked → `== board`, a kanban.
- Which inputs a check reads and which triggers keep each fresh → `== cover` after the graph; a writer × field matrix → `columns: <rank>`.

**What changed?**
- A change on one layout → `+` and `-` on nodes and paths; the reader gets a before | both | after toggle.
- What a change did to a call tree → `== diff`, from the converter rather than by hand. `<viz>` is this skill's directory; the first two arguments are the base and head refs (a PR's base branch, then `HEAD`); `<paths>` limits the scan:

```bash
python3 <viz>/scripts/viz.py calldiff main HEAD --max-depth 4 <paths>   # prints base + == diff, unchanged subtrees collapsed
python3 <viz>/scripts/viz.py calltree --entry submitForm
```

Add to any view as needed:
- The why of each step → a `| payload | narration` tail on paths; each becomes a replay step.
- A design doc that walks scenarios → `theme drawing`, `shows: id = text` under steps, and a `meter:` when one number decides the outcome ([drawing](references/grammar.md#drawing-theme-and-story-detail)).
- A page that will be saved, printed or shared → `theme paper`. It paints its own sheet, so inline T3 renders keep the default theme.

Ground everything in evidence. Each node gets an `@path:line` and detail lines for reads, writes and failure behaviour. Each number (a duration, a weight, a level) comes from a trace, log, query or the code. Mark anything you have not read or measured with `?`: a `?` prefix on a node, path, bar or segment, and a `# estimate` note on a stock point.

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

Done when the visual renders without `viz:` errors, every node and number is grounded or marked `?`, and you have seen it where the reader will look: inline in T3, or a screenshot of the opened page elsewhere. A headless load, a `curl`, or a clean console is not seeing it; when you could not look, say so instead of calling it rendered.
