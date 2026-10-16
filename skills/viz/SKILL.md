---
name: viz
description: "Render an interactive flow, DAG, ranked trigger map, coverage strip, sequence, state machine, call stack, call tree, or call diff from a few lines of text: inline in T3 Code, or as a temp HTML page elsewhere. Use when asked to viz, visualize, or graph a flow, pipeline, DAG, trigger or event map, coverage, sequence, state machine, call stack, call path, call tree, or calldiff, or when show-me or interactive-explainer hands one off."
---

# Viz

One fixed renderer, [`assets/viz.js`](assets/viz.js), draws every visual. The agent writes only data in the [grammar](references/grammar.md), so a visual costs about as many tokens as the Mermaid or ASCII tree it replaces. In exchange it gets step replay, a node inspector, edge tracing, filtering, and path copy.

## Pick the view

Model the code as nodes, paths and a view in one `== graph` section, not as hand-built HTML. Every shape below comes from the same renderer, with hover tracing, replay and the inspector built in.

- Data moving between components (branches, fallbacks, async hops, failure exits) → `view: flow`, the default. Label each edge with what moves and declare edges in the order they happen; the numbers follow.
- Who acts, what it sends, what filters it, what results → `ranks:` columns. Write one path per trigger, ending `=> result` when it gets through and `=| result` when it is filtered out. Teams or services as bands → add `lane:`.
- Which inputs a check reads and which triggers keep each one fresh → a `== cover` section after the graph. Rows point at path names; gaps fall out of the paths. A writer × field matrix → `columns: <rank>`.
- Requests between services over time → `view: seq`, with `at:` times when the waiting matters.
- The life of one field or job → `view: states`, with one path per story (`!giveup: running > blocked => dead`).
- A call stack at one moment, with the values that went wrong → `view: stack` and `locals:`.
- A change, on one layout → `+` and `-` on nodes and paths; the reader gets a before | both | after toggle.
- When the why of each step matters → give paths a `| payload | narration` tail. Each one becomes a replay step.
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
<!doctype html><script src="https://cdn.jsdelivr.net/gh/Yeshwanthyk/agent-skills@dc75a053f09455964a53772d7a89649163ed872a/skills/viz/assets/viz.min.js"></script>
<script type="text/viz">
…
</script>
```

If the preview console shows the script failed to load, save the data to `/tmp/viz/<name>.viz` and use the output of `viz.py t3 /tmp/viz/<name>.viz --inline`. It works, but it costs about 6k more tokens.

**Anywhere else**: save the data to `/tmp/viz/<name>.viz`, then run `python3 <viz>/scripts/viz.py html /tmp/viz/<name>.viz --open`. It reports parse errors, writes `/tmp/viz/<name>.html` with the renderer inlined, and opens it in the browser. In pi with glimpse installed, open that file there instead ([pi](../yesh-router/references/hosts/pi.md)). Report the path.

**Inside a saved page that must stay self-contained** (an interactive-explainer page): write `text/viz` blocks where the views belong, end the body with `<script data-viz></script>`, and run `viz.py inline page.html`. Rerun it after updating viz.js. Give a story caption, table row or glossary term `data-viz-id="<node id or path name>"` and hovering it lights that part of every graph on the page, with no page script.

## Reply

The visual carries the structure. The reply adds only what it can't show: what you did not verify, and the one thing to look at first.

## Completion

Done when the visual renders without `viz:` errors, every node is grounded or marked `?`, and you have seen it where the reader will look: inline in T3, or a screenshot of the opened page elsewhere. A headless load, a `curl`, or a clean console is not seeing it; when you could not look, say so instead of calling it rendered.
