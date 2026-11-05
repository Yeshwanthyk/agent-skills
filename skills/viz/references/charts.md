# Charts

`timing`, `gantt`, `hist`, `retries`, `causes`, `board`, `stock` and `waits` are their own `==` sections, not graphs; each section below is complete on its own. Header lines (`title`, `base`, `theme`) and the CDN page are as in the [grammar](grammar.md). Each draws one chart that scales to its frame, with a readout top right and a detail line under it. Statuses use the same prefixes everywhere: `+` ok or done, `!` fails or blocked, `*` or `~` in progress or at risk, `?` unknown. `@ref` and `# note` work on every row.

**Timing**: what runs at the same time. Use it for races, lock waits and overlapping retries.

```text
== timing Two workers, one row lock
axis: ms 0..400                              # unit, then an optional range
api: API worker @checkout/api.py:40          # a lane
  0 (idle) | 40 read cart | 70 *charge card | 250 +write paid   # time label; (label) is quiet, drawn as a wire
worker: Retry worker
  0 (idle) | 90 read order | 120 !waits on lock | 280 write
!race: 120..250 worker blocked on the order row   # a window over every lane; the prefix sets its colour (amber by default)
```

A cursor reads out every lane's state at that moment. Hover or drag to move it, or press ▶ to sweep it. It starts in the first failing window.

**Gantt**: where time goes, and which chain bounds it.

```text
== gantt Checkout request
axis: ms
budget: 600                                  # optional dashed limit
auth: Auth check 0..40                       # a..b ...
cart: Load cart 60ms after auth              # ... or a duration after other rows (after a, b waits on both)
!pay: Charge card 520ms after cart @payments/charge.py:31
```

To compare with an older run, end a changed row with `was 140ms` or `was 60..200` (`!pay: Charge card 700ms after cart was 140ms`). The old run is drawn dashed under the new one, recomputed through the same `after` chain, and each changed bar shows its delta.

The critical path (from the row that ends last, back through whichever row it waits on ends latest) is filled. Slack before the next row that waits on a bar is dotted. Hovering a bar fades everything it doesn't wait on.

**Hist**: a latency distribution, to tell a slow tail from everything slowing down.

```text
== hist Checkout latency
unit: ms
50 120 | 100 400 | 200 300 | 400 80 | 800 60 | 1600 40   # bucket upper bound, count; any number of lines
was: 50 300 | 100 450 | 200 150 | 400 30 | 800 6       # optional: last week, drawn dashed
budget: 600
!p99: 1240 # from the trace store                     # optional: a measured percentile
```

p50, p90 and p99 are interpolated from the buckets and marked `≈`; a `pNN:` line replaces one with a measured value.

**Retries**: attempts per client, against the backoff policy.

```text
== retries Charge card
axis: s
policy: 1 x2 cap 16 jitter 25%          # first delay, factor, cap, jitter: shades where each retry should land
giveup: 40                              # optional deadline; max: 5 flags clients over an attempt count
a: client A @payments/retry.py:12
  0..1 !timeout | 2 !503 | 4.2 !503 | 8.5 +ok   # start[..end] label, like timing segments
```

Each retry is checked against the shading that follows the previous attempt; one outside it gets a dashed ring. The strip under the lanes counts attempts over time, so clients retrying in lockstep show up as one tall bar.

**Causes**: a fishbone for an incident.

```text
== causes Why the receipt email went missing
effect: no receipt # 3% of orders
-- queue                                     # a family; families alternate above and below the spine
+drop: hook raised before :240 @orders/order_service.py:236   # + ruled in
-full: queue full                            # - ruled out
?addr: bad email address                     # ? or no prefix: still open
```

**Board**: work items across stages.

```text
== board Backfill, by shard
columns: queued | copying 3 | verifying | done   # a trailing number is the column's WIP limit
-- copying
*s4: shard 4
  progress: 0.62                             # or 62%; draws a bar
!s6: shard 6 # lock wait on orders           # ! is blocked
  owner: backfill-2                          # any other key: value shows on click
```

A column at its limit turns amber, and one over it turns coral. The readout counts the last column and the blocked cards.

**Stock**: one quantity over time against thresholds, drawn as a line and as a tank.

```text
== stock Email queue depth
unit: k
stock: email queue @mail/queue.py:10
meter: depth | 0 ok | 20 slow | 50 shedding | 80     # same as a graph meter: ticks, each naming the band after it
9:00 2 | in 9k/min | out 8k/min              # label value, then flows; flows carry forward until changed
9:20 14 | in 14k/min # campaign starts        # a note marks the point on the chart
```

The first band is fine, the last is the worst, and any between is at risk. The cursor starts at the peak.

**Waits**: a wait-for graph: who holds which lock, and who waits on it.

```text
== waits Order sync deadlock
a: Worker A @sync/worker.py:40                # optional labels; undeclared ids show as themselves
a holds r1
b holds r2
a waits r2 3.1s @sync/worker.py:88             # text after the resource labels the edge
b waits r1
c waits r1
```

It is drawn as a states graph, waiter → resource → holder. Cycles are found for you: each is a deadlock, drawn coral and listed as a story. Anyone whose wait leads into one is marked stuck, and the readout names both.
