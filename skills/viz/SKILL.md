---
name: viz
description: "Render an interactive flow or DAG, call tree, or call diff from a few lines of text: inline in T3 Code, or as a temp HTML page elsewhere. Use when asked to viz, visualize, or graph a flow, pipeline, DAG, call path, call tree, or calldiff, or when show-me or interactive-explainer hands one off."
---

# Viz

One fixed renderer, [`assets/viz.js`](assets/viz.js), draws every visual. The agent writes only data in the [grammar](references/grammar.md), so a visual costs about as many tokens as the Mermaid or ASCII tree it replaces. In exchange it gets step replay, a node inspector, edge tracing, filtering, and path copy.

## Pick the section

- A path with branches, fallbacks, async hops, or failure exits → `== flow`, plus `== steps` when order or a story matters.
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
<!doctype html><script src="https://cdn.jsdelivr.net/gh/Yeshwanthyk/agent-skills@5f5aab9027ca65fb15877ce297c893a9e059cf17/skills/viz/assets/viz.min.js"></script>
<script type="text/viz">
…
</script>
```

If the preview console shows the script failed to load, save the data to `/tmp/viz/<name>.viz` and use the output of `viz.py t3 /tmp/viz/<name>.viz --inline`. It works, but it costs about 6k more tokens.

**Anywhere else**: save the data to `/tmp/viz/<name>.viz`, then run `python3 <viz>/scripts/viz.py html /tmp/viz/<name>.viz --open`. It reports parse errors, writes `/tmp/viz/<name>.html` with the renderer inlined, and opens it in the browser. In pi with glimpse installed, open that file there instead ([pi](../yesh-router/references/hosts/pi.md)). Report the path.

**Inside a saved page that must stay self-contained** (an interactive-explainer page): write `text/viz` blocks where the views belong, end the body with `<script data-viz></script>`, and run `viz.py inline page.html`. Rerun it after updating viz.js.

## Reply

The visual carries the structure. The reply adds only what it can't show: what you did not verify, and the one thing to look at first.

## Completion

Done when the visual renders without `viz:` errors, every node is grounded or marked `?`, and the reader can see it: inline in T3, or at a reported path elsewhere.
