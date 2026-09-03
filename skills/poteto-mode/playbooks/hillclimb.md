# Hillclimb

**You own the metric and the experiment's integrity.** Use this playbook for sustained improvement of one measurable result against a target. A one-off fix uses `bug-fix` or `perf-issue`.

1. Ground the workload with `how`. Select the realistic input dimensions and a case that reproduces the complaint. Define one metric, its direction, a target, and a minimum attempt count.
2. Build and freeze a sensitive measurement harness. Run contrasting workloads. Capture the baseline and a green regression gate before changing code. The harness must emit a repeatable metric with enough samples to clear noise.
3. Open a decision trail with `show-me-your-work`. Log one row per attempt with the hypothesis, change, before value, after value, delta, tests, verdict, and note.
4. Tie each hypothesis to a named mechanism in the current architecture. Do not try an optimization without evidence that its cost exists.
5. Run one hypothesis per iteration.
   - Give a worker an exclusive scope when delegation reduces context load.
   - Measure before and after with the frozen harness.
   - Run the regression gate.
   - Keep only a change that beats noise and keeps the gate green.
   - Revert a change that does not help.
   - Commit each accepted change separately and log the result.
6. Verify before the next iteration. If the metric stalls, reread the source, change hypothesis family, combine only justified near-misses, or try a simpler design.
7. Stop when the predicate is met, or when cheap hypotheses are exhausted and the remaining cost is not justified. Do not relax the predicate.
8. Run `opening-a-pr` with the accepted commits in measurement order.

## Completion

The metric meets its predicate or the run records a real dead end after cheap hypotheses are exhausted.

**Reply:** metric, target, baseline, final value, delta, kept and reverted iterations, decision-trail path, and next idea.
