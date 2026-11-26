# ephyra vs. the invariants Property branch

**Question.** Should `skills/invariants` adopt [ephyra](https://github.com/datadog-labs/ephyra) (Datadog Labs, Rust, `ephyra` 0.0.1, repo HEAD `3983b2e`, 2026-11-12) for property testing, and how does it compare with what the skill prescribes today?

**Answer.** Keep proptest as the default for Rust projects that already use it. Add ephyra to `references/rust.md` as the pick when a Rust target has no runner yet, or when the campaign needs coverage feedback without cargo-fuzz. Also copy four tool-agnostic practices from ephyra's agent playbook into `SKILL.md`, because they help in every language. Don't use it outside Rust: Hypothesis and fast-check already fill that slot.

## What we have today

| Layer | Today (`skills/invariants`) |
| --- | --- |
| Rust property | proptest (`references/rust.md`) |
| Rust fuzz | cargo-fuzz + libFuzzer, nightly |
| Rust one-harness-three-engines | bolero (`references/code-verifiers.md`) |
| Python / TS property | Hypothesis / fast-check |
| Method | steps 2–5: claim + oracle, build, bounded run, shrink/classify/keep |

## What ephyra adds (all *documented only*; not run here)

| Capability | proptest today | ephyra | Source |
| --- | --- | --- | --- |
| Checks the generator itself (output satisfies a predicate, shrink candidates stay valid and get strictly smaller, mutants stay valid) | no | `check_generator` / `check_shrinker` / `check_mutator`, `ephyra check` CLI | crates/ephyra/README.md "The idea"; crates/ephyra-cli/README.md "`ephyra check`" |
| In-process coverage, coverage-guided search, fault localization | no (needs cargo-fuzz) | `coverage` feature on stable with `-C instrument-coverage`; reports which functions were never reached | crates/ephyra/README.md "Features" |
| Several distinct failures from one run | stops at the first | `EPHYRA_FAILURES=n`, failure signatures | API.md "Many failures in one run" |
| Targeted search | no | `target(score)`, `loops::perf_fuzz` | API.md "Properties"; README "Status" |
| Exact replay + remembered regressions | seed file | `EPHYRA_REPLAY=seed:iter`, `.ephyra/regressions/*.jsonl`, flags stale entries | API.md "Running" |
| A playbook written for agents | — | STARTUP.md | STARTUP.md |

**The "inductive" claim.** ephyra's README says it rewrites the generator to reach code that coverage hasn't hit, where coverage-guided fuzzing instead mutates inputs that look promising. In the code, the library supplies the parts: coverage reports, `ephyra check`, and the hand-written `Run` loop. The agent does the rewriting by following STARTUP.md §6. That makes it a workflow, not an engine (*inferred* from the README and STARTUP.md).

**Bug-count claims** (70+ SQLite, 20 PostgreSQL, 25 Lean): the vendor reports these, and they're unverified here.

## Limits (documented)

- Version 0.0.1, first published to crates.io on 2026-10-29, with about 770 downloads (*checked* against the crates.io API on 2026-11-26). The README says "API is not yet frozen".
- Rust only. A system written in another language gets a Rust harness, and the library ships no subprocess driver.
- Per API.md, there's no per-test timeout and no process isolation. It doesn't catch stack overflows, aborts, segfaults, infinite loops or OOM, so any of those needs a child process.
- Built-in size is `log2(i+1)` capped at 13 for the default 10k tests. Inputs stay short unless the test sets `.len(..)` explicitly.
- `.map` drops the shrinker, so a structured value needs `with_shrink` or `derive`.

Overlap with our method: STARTUP.md §2–5 already matches our steps 2–5: oracle taken from the contract, generators valid by construction, sequences of operations for stateful code, replay and then triage into real / test bug / intended / environment, and keeping a regression test. That overlap means adopting ephyra wouldn't conflict with the skill.

## Changes made (this PR)

1. **`references/rust.md`**: add an "ephyra" option under Property. Use the project's existing runner first. Choose ephyra for a new Rust harness where coverage reach matters or where the target needs both Property and Fuzz evidence on stable. Gate on `ephyra check` passing before any run counts, and point agents to STARTUP.md and API.md "Things that do not exist".
2. **`SKILL.md` step 3**: verify the generator, not just reach. Check that generated values satisfy the domain predicate and that shrink candidates stay inside it. The current "Done when reached-target check" doesn't catch a generator that emits invalid values or barely varies.
3. **`SKILL.md` step 4**: when a bounded run is clean, (a) point the generator at uncovered code, one gap at a time, measuring before and after; (b) add a second oracle on the same code; (c) count the inputs each oracle discards or excludes; (d) move to another part of the project after two flat rounds. Today the skill says only to "expand when findings justify".
4. **`SKILL.md` step 5**: for long runs, collect failures by distinct signature. Treat a new oracle that fails on more than about 1% of inputs as suspect before blaming the code.

## Open questions

- I haven't run anything. A smoke probe would be `cargo run -p ephyra --example bst -- --bug` in the clone.
- Does it compose with Kani the way bolero does? Nothing in the docs says it does.
- How stable are replay seeds across 0.0.x releases? The docs warn they depend on the generator.
