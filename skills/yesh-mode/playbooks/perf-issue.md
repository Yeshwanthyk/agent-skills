# Performance issue

Use for a bounded performance complaint. Use [hillclimb](hillclimb.md) for sustained optimization against a target.

Capture a baseline on the relevant workload before changing code. Name the metric, workload dimensions, and observation method. If measurement is unavailable, report that limit instead of claiming a speedup.

Locate the dominant measured cost and choose a change that addresses its mechanism. Consider eliminating unnecessary work before moving or caching it. Any cache needs an invalidation rule; any concurrency change needs an ownership rule.

Measure the changed version with the same workload and comparable conditions. Use repeat or interleaved measurements when noise could explain the difference. Check affected behavior for regressions.

Report baseline, final result, uncertainty, and artifact locations. Keep only justified changes. A faster proxy does not prove a faster user path.
