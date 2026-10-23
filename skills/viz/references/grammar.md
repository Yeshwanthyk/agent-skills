# Viz grammar

Every visual is a `text/viz` block that [`assets/viz.js`](../assets/viz.js) renders. One `== graph` section covers every node-and-edge shape; a `view:` line picks the layout. Examples:

- [`trigger-map.viz`](../assets/examples/trigger-map.viz): ranked columns, paths that get through or are filtered out, and a coverage strip.
- [`shapes.viz`](../assets/examples/shapes.viz): call stack, sequence, state machine, before/after, lanes, and a coverage grid.
- [`order-flow.viz`](../assets/examples/order-flow.viz): a layered flow with numbered edges and replay.
- [`submit-diff.viz`](../assets/examples/submit-diff.viz): a call diff and two trees.

## Core: nodes, edges, paths

```text
title Which edits re-run the archive check   # optional header lines, anywhere outside a tree or cover
sub   example/docs @1a2b3c4
base  src/                                   # prefix for every @ref; shown once, copied with the path

== graph Archive triggers                    # each == section is a tab (== flow is the same thing)
check: Archive check [result] @archive/run.ts:7 # new ArchiveRun
  does: / reads: / writes: / fails: / state: / carries: / note: …   # inspector detail
  ref: archive/queue.ts:30 enqueue
saved: DocSaved [event] @events/doc.ts:12    # [event] [signal] [message] [topic] draw a dashed card
onsave -> check: APPROVED                    # an edge; its label is what moves
hooks ~> mail, log: emit                     # ~> is async (dashed); a, b fans out on either side

approval: approve > approved > onsave => check | APPROVED | Approval is the only save that starts a check.
autosave: draft > saved > onsave =| skip
```

- Node `id: Label [kind] @path:line # note`. The note shows as a line on the card. An id prefix sets its state: `+` added, `-` removed, `~` changed, `!` fails, `*` active, `?` unverified.
- **A path** is `name: a > b > c`, then how it ends: `=> d` gets through, `=| d` is filtered out. A path without an ending is plain. A `!` prefix marks a failing path, `+` or `-` puts it on one side of a before/after. The name is optional; name paths that a cover row, a story or a page element refers to.
- **Edges come from paths.** Each hop of a path becomes an edge, reusing one declared with `->` when it exists, so declare an edge only to label it or give it `@ref` and detail lines. An edge is green when any path through it gets through, dashed when every path is filtered out, coral when its paths fail.
- **A path with a `| payload | narration` tail is also a replay step**, in declaration order. A step-only line can use `->` hops, or name one node (`!chain | | If tasks 1-3 raise, no shipment exists.`). `== steps` still works for a replay kept apart from the graph.
- Hovering a box lights every path through it, end to end; clicking it opens the inspector, which lists those paths and how each ends.
- Keep a label to the symbol plus a few words. Detail lines hold the rest; they only appear in the inspector.

## Views

| `view:` | Use for | Layout and extra syntax |
|---|---|---|
| `flow` (default) | data moving between components | top to bottom, layered; each declared edge gets a numbered pill, so declare edges in execution order |
| `ranked` (default with `ranks:`) | who acts → what it sends → what filters it → result; any map with named columns | `ranks: A \| B \| C`, then a `-- B` line before the nodes of each column; `lane: Team` on a node stacks lanes as bands |
| `seq` | requests between services over time | one lifeline per node in declaration order; edges are messages, in order; `at: 120ms` on an edge spaces it by time |
| `states` | the life of one field or job | layered like flow, pills only on labelled edges, no numbers; `a -> a: heartbeat` is a self-loop |
| `stack` | a call stack at one moment | frames indented in path order; `locals: qty = NaN` lines show on the card |

```text
== graph Checkout
view: seq
api: API [service] @api/checkout.ts:14
pay: Payment provider
api -> pay: charge
  at: 34ms
pay -> api: ok
  at: 720ms
api > pay > api | charge | 686 of the 840 ms are spent waiting on the charge.
```

**Statecharts** (`view: states`; groups also work in `flow`):

```text
== graph What happens to a print job
view: states
tone idle: Idle
tone busy: Printing
[*] -> empty
group up: Printer ready
empty: No job {idle}
printing: Page printing {busy}
printing -> printing: next page
group end
!twice: Page printed twice
  fails: NoDoublePrint
```

- `tone id: Label` declares a colour category for the legend, up to six; `{id}` on a node, before any `[kind]`, applies it.
- `[*] -> id` draws the start dot; `[*] -> id: label` labels its edge.
- `group id: Label` at column 0 opens a box around the nodes that follow, until the next `group` or `group end`. A group must hold a node. Hovering its header lights the paths through it; clicking lists its states and paths.
- A `!` node is drawn red, and the legend adds "breaks a rule" when tones are present.

**Before and after on one layout:** mark nodes and paths `+` and `-` (`-before: api > direct > db => user`, `+hit: api > cache => user`). The graph gets a before | both | after toggle.

## Coverage

A `== cover` section after a graph draws chips (or a grid) that say which paths keep a fact true. Hovering a chip lights its paths.

```text
== cover What the check reads, and what keeps it fresh
title: re-checks on rename <- rename         # name: note <- path names or node ids
owner: changes don't re-check <- owner
?labels: triggers, not read yet               # no refs: not read
```

- A row's status comes from its paths: none filtered out or failing → covered (●), some → partial (◐), all → gap (⚠). `+`, `!` or `?` before the name sets it outright: covered, gap, unread (○).
- `columns: <rank name>` turns the strip into a grid: one column per node in that rank, each cell marks how the row's paths through that node end.

## Linking page elements

Any element on the page with `data-viz-id="<node id or path name>"` lights that node or path in every graph while hovered or focused, and lights up itself (class `vz-linked`) when the reader hovers the matching box. No page script is needed; use it to tie a story caption, table row or glossary term to the graph.

## Trees and diffs

```text
== diff main..HEAD                           # == tree for a plain tree; markers switch on diff colouring
  submitForm @routes/submit.ts:12            # column 0 is the marker: + - ~ ! or a space
~   createSession @sessions/create.ts:8      # returns a handle now
-     persistPrompt
+     queuePrompt
```

Tree depth is 2 spaces per level. Pasted `calldiff` ascii (`├─ │ └─`, `label  path:line`) also parses.

## Versioning

The CDN URL in [`SKILL.md`](../SKILL.md), `scripts/viz.py` and `meat-review/scripts/meat_review.py` pins viz.js to a commit SHA. jsDelivr caches it permanently, and a tag would not do: jsDelivr strips a leading `v` from tag names. To ship a renderer change: commit and push viz.js, then update every pinned URL to that commit's SHA in a second commit. Old pages keep their own pin, so a grammar change only has to keep the examples and the skills that emit blocks working.
