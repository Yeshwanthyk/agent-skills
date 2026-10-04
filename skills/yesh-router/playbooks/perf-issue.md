# Performance issue

Use for a bounded performance complaint. Use [hillclimb](hillclimb.md) for sustained optimization against a target. Tie every change to a measurement; reading source is not measuring.

1. **Baseline.** Capture a baseline on the workload that reproduces the complaint. Name the metric, workload dimensions (data size, history, state, concurrency), and observation method. Vet the baseline, and every later number, with the [benchmark checklist](../../benchmark-checklist/SKILL.md). If measurement is unavailable, report that limit instead of claiming a speedup.
2. **Ground hypotheses.** Use [how](../../how/SKILL.md) to trace the execution path implicated by the measurements, reusing a current source-grounded map when available. Locate the dominant measured cost and its limiter. Do not claim a ceiling without running it. Try the performance mantras in order, cheapest first, and stop when an earlier one meets the target:
   1. Don't do it. Stop work whose result nothing uses rather than cheapening it.
   2. Do it, but don't do it again.
   3. Do it less.
   4. Do it later.
   5. Do it when they're not looking.
   6. Do it concurrently.
   7. Do it cheaper.

   Any cache needs an invalidation rule; any concurrency change needs an ownership rule. When those rules are unsettled, use [stateful-systems](../../stateful-systems/SKILL.md) before implementing.
3. **Fix one attempt at a time.** If the fix crosses a function or module boundary, settle the shape with [architect](../../architect/SKILL.md) first. Verify each attempt before trying the next ([sequence-verifiable-units](../references/principles/sequence-verifiable-units.md)). If delegation helps and is authorized, follow the [delegation contract](../references/delegation.md) and review the actual diff.
4. **Compare.** Measure the changed version with the same workload and conditions, alternating sides. Compare the artifacts directly (parse traces or profiles into tables and diff them) rather than eyeballing. An inconclusive run or a measurement on the wrong surface is not a pass; flag it. Check affected behavior for regressions.
5. **Report.** Lead with the verdict, then baseline, final, delta, run count, range, limiter, and artifact paths. Keep only justified changes. A faster proxy does not prove a faster user path. Cite the measurement in any PR.
