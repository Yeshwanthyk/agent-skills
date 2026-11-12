# Viz in the terminal (Rex)

Read this only when you show a visual inside Rex. Everywhere else, use the HTML route in SKILL.md.

`rexer viz /tmp/viz/<name>.viz` opens viz-term (`term/main.ts`, OpenTUI on Bun) in a split to the right of your pane, labelled `viz:<name>`. Running it again refocuses that split, so it never opens a second one. From the worker's side, `rexer viz <task> <name>` opens `/tmp/viz/<task>-<name>.viz` beside that task.

It draws the same `.viz` file with the same parser as the HTML route:
- Every graph view (flow, ranked, states, stack, seq) appears as boxes and lines.
- Sankey appears as flows grouped by source.
- `tree` and `diff` appear as call trees.
- Each chart kind (`timing`, `gantt`, `waits`, `board`, `causes`, `retries`, `hist`, `stock`) appears as rows on a shared axis.

The terminal version is a summary. Hover detail moves to the details rows under the card. A few decorations have no cell form; examples are the policy shading in `retries` and the curved bands in sankey.

Keys the user has:

| key | does |
|---|---|
| `j` `k` | select the next or previous node or row; the details rows follow |
| `←` `→` | graphs: step the replay. Charts: column (board), segment (timing) or attempt (retries) |
| `enter` | graphs: toggle the inspector. tree, diff and causes: fold or unfold |
| `i` | graphs: switch to a real image (kitty graphics) and back. Terminals without kitty graphics stay in cells |
| `a` | type `about <node> @<ref>: ` into your pane, so the user can ask about it |
| `y` | copy the node's `@ref` |
| `[` `]` | previous or next section |
| `q` | quit |

Check it the same way as the HTML: before you report it, run `python3 <viz>/scripts/viz.py check /tmp/viz/<name>.viz` and fix any errors. To see the rows yourself without a terminal, run `bun <viz>/term/main.ts <file> --dump`. Then tell the user the split is open. Report the `.viz` path too, so they can also open it as HTML.
