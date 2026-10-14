# Viz grammar

Every visual is a `text/viz` block that [`assets/viz.js`](../assets/viz.js) renders. Examples: [`order-flow.viz`](../assets/examples/order-flow.viz) (flow with replay) and [`submit-diff.viz`](../assets/examples/submit-diff.viz) (diff and two tree inputs).

## Grammar

```text
title When a payment settles an order    # optional header lines; usable anywhere outside a tree
sub   example/order-flow @1a2b3c4
base  app/                               # prefix for every @ref; shown once, copied with the path

== flow Settle path                      # each == section is a tab
settle: _settle [db txn] @orders/order_service.py:210
  does: marks the order paid inside the webhook's transaction
  reads: / writes: / fails: / state: / note: …
  ref: orders/order_service.py:226 _copy_totals
!chain: tasks 1-3 [job chain] @…:12    # a trailing " # " starts a note
settle -> hooks: COMMIT                  # edge with label
hooks ~> event, receipt: emit            # ~> is async (dashed); a, b fan-out works on either side
check -> legacy: LIVE fallback           # an edge to an earlier row draws as a back edge

== steps                                 # replay for the flow above (or: == steps <flow name>)
settle -> hooks | COMMIT | Commit is the moment the order counts as paid.
!chain | | If any of tasks 1-3 raises, no shipment exists.   # one node, ! = failing step

== diff main..HEAD                       # == tree for a plain tree; markers switch on diff colouring
  submitForm @routes/submit.ts:12        # column 0 is the marker: + - ~ ! or a space
~   createSession @sessions/create.ts:8 # returns a handle now
-     persistPrompt
+     queuePrompt
```

- Node `id: Label [kind] @path:line # note`. A prefix on the id sets its state: `+` added, `-` removed, `~` changed, `!` fails, `*` active, `?` unverified. Edges take `+` and `-` too, for a before/after flow.
- Declare flow nodes in execution order. Rows keep that order; adjacent edges run down the spine, longer ones take side lanes, and the first labelled edge into a row prints before its label.
- Tree depth is 2 spaces per level. Pasted `calldiff` ascii (`├─ │ └─`, `label  path:line`) also parses.
- Keep labels to the symbol plus a few words. Detail lines hold the rest, because they only appear in the inspector.

## Versioning

The CDN URL in [`SKILL.md`](../SKILL.md) and `scripts/viz.py` pins viz.js to a commit SHA. jsDelivr caches it permanently, and a tag would not do: jsDelivr strips a leading `v` from tag names. To ship a renderer change: commit and push viz.js, then update both URLs to that commit's SHA in a second commit. A grammar change must keep old `text/viz` blocks rendering, or the old pages need updating to match.
