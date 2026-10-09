# Multi-page knowledge base

Use this when the explainer is a site that grows over research waves: several topic pages, a shared issue list, and a "where we are" page. The single-file starter stays the visual reference; the site splits it into a shared renderer and data-only pages.

## Layout

```
kb/
  index.html          where we are + whole-system map + page directory + changelog
  assets/kb.css       every theme; colours only as CSS variables
  assets/kb.js        the one renderer: nav, theme, maps, stories, side panel, tooltips, tables, lint
  data/progress.js    pages (live | coming), waves, counts, changelog
  data/issues.js      every issue
  data/glossary.js    every term, one plain line
  pages/<topic>.html  one KB.page({...}) call with data only
  AGENTS.md           the builder contract: how to add a page, box, wire, story, issue, term
  tools/check.mjs     the headless check
```

Load data as plain `<script>` tags, not `fetch`, so pages open from disk and over http, and an inlining script can produce self-contained copies. Validate each page with `validate_explainer.py --allow-local-assets`.

## Pages declare data

A page is a list of typed sections: `map`, `states`, `pipeline`, `primer`, `table`, `prose`, `issues`. Boxes and wires have ids unique across the page. A box's side panel is its code-level contract: summary, methods in call order with `file:line`, reads, writes, emits, queue, retry, failure, and a verification status.

## Registries

- **Issues**: id `I-NNN` in a per-topic range; status `V` (read in code), `S` (unchecked secondary source), `X` (proven wrong) or `open`; severity; sources; home page; the design-doc section it feeds (`tdd_section`); `at: ['page#box']` anchors that draw a numbered dot on that box or wire.
- **Glossary**: one line per term, with an optional `see` path.
- **Progress**: page status, waves and their items, fact counts, and a dated changelog entry for every change.

In any string, `[[term]]` renders a glossary tooltip and `{{I-031}}` an issue chip. `#at-<id>` and `#issue-I-031` deep-link to a box or issue.

## `?lint`

Any page opened with `?lint` lists unknown terms, unknown issue ids, anchors that name no box or wire, unknown panel keys, and duplicate ids. "Clean" is part of done.

## Themes

Write every colour as a variable in both theme blocks. Default to `prefers-color-scheme`, keep the reader's toggle in `localStorage`, and accept `?theme=light|dark` for checks. Set the theme in an inline `<head>` script so the page never flashes the wrong one. The canvas re-reads its colours from the variables when the theme changes.

## The check script

One command renders every page in every theme at the reader's width plus a narrow and a wide one. It collects console errors and `?lint` output, steps every story, opens boxes, wires and issue markers through real input events, and saves screenshots. Headless screenshots stall animation, so force reduced motion for the shots and full motion for the interaction pass. Give it `--page`, `--port` and `--cdp-port` flags so parallel builders do not collide.

## Parallel builders

- Each builder writes only its own `pages/*.html` and one `_incoming/<task>.json`. It stages new issues as `N-<task>-NN` and new terms with a `KB.stage({...})` call, so its page renders before the merge.
- One integrator owns `data/*`, `assets/*`, `index.html` and `AGENTS.md`. It gives staged issues real ids, folds duplicates into one issue (union of sources and anchors, strongest status V > S > open), rewrites the staged ids on the pages, deletes the `KB.stage` calls, and records old → new ids in `_incoming/MERGED.md`.
- Builders put framework gaps under `framework_requests`. The integrator fixes them in the shared renderer or records why it skipped them.
