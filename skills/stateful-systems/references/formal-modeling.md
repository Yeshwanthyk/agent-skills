# Formal Modeling Lane

Use this only when the `formal` lane is selected, or when the `deep` lane needs the no-Quint packet. It is optional for simple systems, but strongly recommended when lifecycle bugs could corrupt data, money, access, orchestration, or user progress.

## When to model formally

Use Quint or a machine spec when:

- transition sequences are non-trivial
- multiple actors or jobs can race
- ordering/concurrency matters
- derived state can drift from source state
- invariants span multiple rows/entities
- there are terminal/stuck states
- failures need traceable counterexamples
- the team wants confidence beyond example-based tests

## Quint availability gate

Before writing any `.qnt` model, confirm Quint is installed and the user wants to use it. Do not silently skip formal verification, and do not assume the user will install on demand; ask.

```bash
command -v quint >/dev/null 2>&1 && quint --version || echo "NOT INSTALLED"
```

Branches:

1. **Installed and the system meets the modeling bar**: proceed with the Quint packet. Run `parse`, `typecheck`, and at least one `run`, then report actual output.
2. **Not installed**: ask once:

   > Quint is not installed. This system meets the bar for formal modeling (...one-line reason...). Install it and verify?
   > `npm install -g @informalsystems/quint` (or `brew install quint`)
   >
   > Reply **install** to proceed with formal verification, or **skip** to do deep states understanding without it.

   On **install**, install, confirm `quint --version`, then proceed. On **skip**, no reply, or anything else, fall through to the deep-states lane and do not ask again in the same task.
3. **Installed but below the modeling bar**: do not propose Quint; transition table and tests are sufficient.

## Deep states understanding (no-Quint lane)

When formal verification is skipped by user choice or because the system does not warrant it, still go beyond a one-line transition table. Produce:

- **Stored vs derived states** enumerated separately, each with the rule that produces it.
- **Transition table** with `from -> to; trigger; actor; guard; invariants checked; events emitted`.
- **Reachability sketch** from `init`: reachable states, dead ends, absorbing states.
- **Race surface**: every pair of transitions that can interleave, and what locking/idempotency protects them.
- **Invariant table**: each invariant tagged with enforcement location: DB constraint, command guard, projector, test only.
- **Counterexample candidates**: bad sequences; for each, name the mechanism that prevents it. Anything without a mechanism is a real risk.
- **Scenario walk-throughs**: happy path plus at least one race, one retry, one terminal/stuck case, as state-by-state traces.
- **Test matrix** covering transitions, races, idempotency, and rollout.

This lane does **not** claim formal correctness. State: "No machine-checked verification; this analysis is structured but example-based."

If a visual artifact is also requested, hand off to `interactive-system-explainer` with the deep-states packet as source-of-truth input. Its state-machine, history, and scenario tabs render this analysis.

## Minimal Quint model packet

Include:

```text
state variables
init action
named transition actions
step action combining named actions
safety invariants
temporal properties if progress/liveness matters
witnesses or tests for important scenarios if useful
```

Default commands:

```bash
quint parse model.qnt
quint typecheck model.qnt
quint run model.qnt --init init --step step --max-steps 20 --max-samples 2000 --invariants inv_safety
```

Escalate when needed:

```bash
quint test model.qnt
quint verify model.qnt --init init --step step --invariants inv_safety --max-steps 20 --out-itf traces/cex.itf.json
quint run model.qnt --out-itf traces/run_{seq}.itf.json --n-traces 3
quint docs model.qnt
```

Use ITF traces for visual explainers and debugging. Capture at least one happy-path trace and, when available, one counterexample/failure trace.

Do not claim formal correctness unless parse/typecheck/run or verify outputs were actually executed and reported.

## Precheck-style machine-source principle

For critical state machines, prefer one authoritative machine definition over duplicated spec and implementation.

The ideal critical-flow design lets one machine definition drive or validate:

- transition guards
- runtime command/adapter behavior
- database constraints
- tests/traces
- docs/diagrams

Guardrails inspired by machine-spec tooling:

- no raw writes to machine-owned state
- all transitions go through the command/machine adapter
- generated artifacts are not hand-edited
- database constraints back critical invariants when possible
- proof/check failures mean fix the model, not patch around it
- keep machines small: one risky workflow per machine
- use tiny proof domains first; scale proof tiers only when needed
