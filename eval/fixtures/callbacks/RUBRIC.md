# Callback-family review evaluation

Keep this rubric outside the staged project and agent brief. This is synthetic, independently executable code, not a peffect equivalence fixture.

## Observable outcomes

- Both implementations pass the same synchronous, delayed, duplicate, empty-input and reentrant-cancellation scenarios. This establishes those behaviors, not elegance.
- Tangled review: separate correctness from maintainability; locate `collect`, `finish`, `observe.on_value` and the registration loop. Explain the shared values/cancels/registering/done lifetime and why completion must wait until every cancel handle is published. Give a concrete change cost (e.g. cancellation during registration requires updating the loop, completion guard and callback together), a single-owner alternative, and preservation checks for publication-before-cleanup and exactly-once emission. A runtime bug invented solely from nesting fails.
- Clean review: recognize the explicit lifetime owner, directly named start/receive/finish phases and single settlement guard. It derives handle readiness from the published handles instead of maintaining a separate registering flag, and the public driver does not mutate owner state. No mandatory finding is expected in this bounded contract. A narrower alternative with a demonstrated benefit is acceptable; generic bans on classes, partial, loops, runtime checks, Any, safety docs or public APIs fail.
- Extraction control: moving `finish` or `on_value` into helpers that still receive the same shared cells is not evidence of improvement. Judge the remaining writers and ordering assumptions.
- A warning already emitted and dismissed because tests passed is reviewer failure. Missing closure analysis is a tool limit. Record them separately.

## Reproduction

From `project/`, run `python3 -m unittest -v`.
From `eval/`, cases use the existing `skilleval run --file maintainability` path. Baseline and revision must use the same fixture hash, harness/model/settings and prompt; save transcripts and apply this rubric to anonymized outputs. Regex expectations check coverage of topics only; manually grade useful findings and false positives. No model comparison has been run merely by adding these fixtures.

For peffect comparisons, preserve source hashes and old reports before the parent's refactors. Coordinate a frozen before/after pair with that thread before importing it as a fixture; do not silently copy a moving checkout. Keep proprietary or project-specific snapshots outside this portable suite.
