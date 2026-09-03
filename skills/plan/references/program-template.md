# Multi-phase plan template

Use this template for work that spans phases, stacked changes, or multiple owners. Replace every bracketed prompt. Keep one evidence-backed change per phase.

```markdown
# [Program] plan

[Under ten lines. State what changes, who benefits, the rule the program enforces, and the phases in order.]

## How to read this

One box is one unit of work. Check it only when its evidence exists as a file, log, screenshot, test run, replay, or commit. A nested box is a sub-step of its parent.

The plan runs [execution workflow]. [State who owns integration and which phases stop at handoff or merge-ready.]

Tests alone are not sufficient verification. A phase is verified only when every applicable proof lane is checked.

## Program checklist

### Arm the program

- [ ] State the outcome, protocol, proof rule, phase order, and handoff rule.
- [ ] Record the condition that authorizes execution. Do not start implementation from an unapproved plan when the workflow requires an explicit go.
- [ ] Read the execution workflow and every leaf skill it names from the current repository at program start. Re-read them when the workflow requires a tick.
- [ ] Record the audit cadence and the side effects that prove progress.
- [ ] On hold or stand-down, give every active owner a zero-writes order.

### Assign owners

- [ ] Assign one owner per phase when work is independent.
- [ ] Start dependent work only after its handoff exists, or name the stacked branch base.
- [ ] Hold file and service boundaries. List the paths each phase may touch.
- [ ] Keep shared integration points under one owner.
- [ ] Record blocking first steps, independent workstreams, shared mutable state, and the smallest safe decomposition.

### Phase mechanics

- [ ] Name the dependency and the exact handoff artifact for each phase.
- [ ] Run repository lint, type checks, and focused tests before the phase handoff when they apply.
- [ ] Inspect the actual diff and generated artifacts. Do not accept a status summary as proof.
- [ ] Re-run fresh verification after any new head, rebased base, or changed artifact.
- [ ] Record migration, rollback, recovery, and cleanup actions.

## [Task as a verb phrase] ([phase id])

**Depends on.** [Phase id or None.]

**Files.**

- [ ] Edit [path].
- [ ] Create [path].
- [ ] Delete [path].

**Build.**

- [ ] [One change. Name the symbol and the contract it implements.]

**You see.**

- [ ] [Observable result and exact state, log, artifact, or response.]

**Verify, unit or contract.** Tests alone are not sufficient verification.

- [ ] [Test, characterization pin, static check, or equivalence harness.] Run [command]. Pass when [predicate].

**Verify, live.** Tests alone are not sufficient verification when behavior changes on a real surface.

- [ ] [Matching-surface scenario.] Drive it with [control method]. Save [artifact]. Pass when [predicate].
- [ ] If live proof is not applicable, record `n/a` and the reason. If the surface cannot be driven, record the limitation and do not call the result a pass.

**Verify, integration.** Use when multiple boundaries interact.

- [ ] [End-to-end communication or persistence scenario.] Pass when [predicate].

**Verify, perf.** Use when performance-sensitive behavior changes.

- [ ] Metric. [Named measure at the relevant baseline and head.]
- [ ] Probe. [Interleaved command or procedure.]
- [ ] Baseline. Record [baseline] first.
- [ ] Rule. [Numbered budget that fails the phase.]
- [ ] If performance is not applicable, record `n/a` and the reason.

**Handoff.**

- [ ] [Exact files, commit or artifact, checks, and unresolved risk sent to the next owner.]

## Close the program

- [ ] Every box has its evidence.
- [ ] Every phase is integrated or explicitly closed.
- [ ] The real integrated path passes its proof.
- [ ] Migration and rollback state are known.
- [ ] Reply with the workflow's requested report and remaining uncertainty.

## Appendix A. Prototype evidence

[Question, run or branch, commit or artifact, result, and any question that remains unproven.]

## Appendix B. Alternatives rejected

[Each distinct approach and the evidence-based reason it lost.]

## Appendix C. Risks

[Risk, affected phase, signal to watch, and mitigation or rollback.]

## Appendix D. Links and reading list

[Exact files, symbols, commands, and external artifacts that an executor must read.]
```
