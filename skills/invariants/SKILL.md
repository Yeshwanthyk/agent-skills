---
name: invariants
description: "Model state and break invariants: authority, transitions, concurrency, recovery, with TLA+ or Quint model checking, Lean proofs, or Kani-style verifiers on the code; property-test contracts over generated values or operation sequences; fuzz a parser or untrusted-input boundary."
---

# Invariants

Name what must stay true, then model it or try to break it at the real boundary.

**Scope.** "Model X" ends with the model. A design or review request ends with a test design or findings. Write and run tests or harnesses only when asked to implement them, and fix production code only within the requested scope. Reuse the project's runner, generators, fuzz targets, and corpus before adding a framework. Scheduled campaigns and CI changes are separate scope.

## Branches

Pick the branch the request names. The branches are alternatives, not a pipeline: a pure-function property test needs no model, a model needs no tests, and a fuzz target may assert properties.

| Request names | Branch | Deliverable |
| --- | --- | --- |
| A design, lifecycle, cache, race, retry, or recovery question; "model X" | **Model** (step 1) | Authoritative state, transition table, invariants with enforcement points, scenarios, proof strategy |
| A contract that must hold over many values or any sequence of operations | **Property** (steps 2-5) | Generated tests against the real entry point, with shrinking and replayable counterexamples |
| A parser, codec, protocol, file format, or other untrusted-input boundary | **Fuzz** (steps 2-5) | A bounded coverage-guided target, corpus, and minimized reproducers |

A Model claim that needs generated evidence continues to step 2 for that claim.

## Steps

### 1. Model

1. Find the source of truth and its owner. When the design adds a cache, a second writer, or cleanup, read [state-ownership](../yesh-router/references/principles/state-ownership.md).
2. Classify stored, derived, cached, projected, and displayed state. Only authoritative state decides; the rest must say how it follows.
3. Map each meaningful transition: trigger, actor, precondition, write, publication, replay, and recovery. When transitions retry, restart, or cause external effects, read [recovery-and-idempotency](../yesh-router/references/principles/recovery-and-idempotency.md). When modeling stage cursors or metadata-driven replay, read [forward-implementation-first](../yesh-router/references/principles/forward-implementation-first.md) to tell administrative records from authoritative controls.
4. When users see the flow, draw it as a statechart in their words before modeling: each box is what they see, each edge what they do or what happens to them, each leaf an outcome they would notice. Draw it from the contract and product intent, not from the code, so it stays an independent oracle. Render it with the [viz](../viz/SKILL.md) `view: states`, one named path per story, and save it as `chart.viz`; the formal check marks that same file. Every story becomes a scenario in step 6, and a path the code takes that the chart lacks is a finding.
5. Define invariants and place each enforcement point at the boundary that owns it. When the model names the states and transitions code will represent, read [model-the-domain](../yesh-router/references/principles/model-the-domain.md); when it changes representations or constructors, also read [type-system-discipline](../yesh-router/references/principles/type-system-discipline.md).
6. Trace concurrent transitions, retries, ordering, freshness, and lifecycle restoration through representative scenarios.
7. Shape commands around intent and reads around explicit freshness semantics.
8. When a concurrent or critical transition stays ambiguous after the table, or a property must hold for every case in scope, take the **Formal** sub-branch and read [references/formal-modeling.md](references/formal-modeling.md). Its decision table picks the tool by property shape (TLA+ with TLC for orderings in a charted flow, Quint where the repo has it, Kani on a Rust transition function, Lean for unbounded proofs) and wires each result into steps 2-5. For a charted flow, [`scripts/tlc_chart.py`](scripts/tlc_chart.py) checks the spec and returns the chart with each story marked works, bug found, fixed, or unreached. To keep the check rerunnable on every change, generate a verify skill through the Formal branch of [verification-skill](../verification-skill/SKILL.md).
9. Give each transition, invariant, race, replay, and recovery path in scope a proof strategy: a boundary test, generated exploration (step 2), or a named open question. When choosing, read [prove-it-works](../yesh-router/references/principles/prove-it-works.md).

**Done** when every in-scope transition has an owner and a proof strategy or open question, every invariant has an enforcement point, concurrency, freshness, replay, and recovery each have a scenario, and a user-facing flow has its statechart.

### 2. Claim and oracle

For each claim that gets generated evidence, record in the existing plan or test description:

- **Invariant**: the one statement that must hold.
- **Entry point**: the real implementation boundary, not a copy or a mock of it.
- **Domain**: the generated values, operations, or input format, including invalid inputs where rejection is part of the contract.
- **Oracle**: the expected result, taken from the contract or an independent model. When a formal model exists, take the invariants and the operation alphabet from it. Derive it without the implementation's logic. A round-trip alone can share a bug in both directions; add an independent expectation where that risk matters.
- **Controls**: clock, scheduler, external services, failure injection.
- **Detectors** (Fuzz): crashes, unexpected exceptions, sanitizer findings, timeouts, invariant violations.

Generated sequential operations establish sequence behavior only. A race claim needs controlled interleavings or other concurrency evidence.

**Done** when a wrong result can be told apart from a wrong generator, harness, or assumption. A test-design request ends here.

### 3. Build

Read only the matching language reference: [Python](references/python.md), [Rust](references/rust.md), or [TypeScript and Effect](references/typescript.md). Check the installed versions, toolchain, and CLI help before using version-specific APIs. A toolchain failure is evidence about the environment, not the product. When choosing what to assert, read [test-behavior](../yesh-router/references/principles/test-behavior.md). When the contract covers parsing or rejecting input, read [boundary-discipline](../yesh-router/references/principles/boundary-discipline.md).

**Property:**

- Generate boundary values, valid combinations, and explicit invalid cases where rejection is the contract.
- Build constraints into constructive generators rather than broad filters. Check that meaningful cases reach the target instead of being skipped or rejected by setup.
- For stateful contracts, generate operations against the real system and check invariants after meaningful transitions. Reset state for each example.

**Fuzz:**

- Feed generated data into production code. Catch only documented rejection errors; let every unexpected failure escape.
- Reset mutable state between cases, control nondeterministic dependencies, and use disposable local resources. Keep live services and credentials out unless a scoped integration campaign requires them.
- Seed with small valid and invalid inputs. For deep structured formats, use a structure-aware generator or mutator so cases get past the first parse.
- Confirm through coverage feedback or a focused probe that instrumentation reaches the intended production code.

**Done** when a reached-target check or coverage shows the harness exercises the claimed boundary.

### 4. Run bounded

Set an explicit budget: example count for Property; time, input-size, memory, and timeout limits for Fuzz. Start with the smallest relevant command or a short smoke run, and expand only when the task and findings justify it. For a new harness, show it catches a known regression or a temporary defect in an isolated copy when practical; otherwise report its sensitivity as unverified. Record target, command, tool version, corpus, budget, and instrumentation limits.

### 5. Shrink, classify, keep

Reproduce each failure outside the search loop and minimize it with the framework; keep the original if the minimized input no longer reproduces. Classify the cause as contract, generator, harness, or implementation. Keep the concrete minimized values or operations as a regression case in the ordinary suite. Save the seed or path and tool version too, but seeds depend on framework versions. When fixing, preserve the intended assertion and input domain, and confirm the fix against the saved input.

## Completion

- **Model only:** step 1 is done, and the reply gives the authoritative state, transition table, invariant set, boundary contracts, scenarios, and proof strategy. Add implementation and rollout shape only when implementation is requested.
- **Test design only:** each selected claim has its step 2 record, a named runner and generator approach, and a stated budget, with no claim of execution.
- **Executed exploration:** report the property or target, the boundary and the evidence it was reached, command, tool version, budget, outcome, replay artifact, and remaining limits. Each failure has a minimized regression case or a named reproduction gap. Tell successful exploration apart from exhausted filtering, flaky setup, or a missing runtime. A bounded pass is behavior observed within the budget, not proof, and does not replace real-system integration checks.
