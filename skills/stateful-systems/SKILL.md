---
name: stateful-systems
description: Model and build stateful software systems with lifecycle states, transitions, commands, events, projections, read models, idempotent jobs, backfills, freshness contracts, boundary tests, and optional formal verification with Quint or machine specs. Use when designing workflows, approvals, onboarding, access systems, payment/invoice lifecycles, webhook-driven flows, queue processors, orchestration, or any feature with state transitions and derived reads.
---

# Stateful Systems

Design systems where records move through meaningful states and readers depend on consistent derived behavior.

```text
Facts -> Rules -> Intent -> Events -> Projections -> Reads -> Automation -> Rollout -> Tests
```

Start with lifecycle, boundaries, invariants, and transition safety.

## Use / Skip

Use for lifecycle/status transitions; workflows, approvals, onboarding, orchestration; payment, invoice, access, eligibility, or entitlement flows; webhooks; scheduled advancement; projections; backfills; freshness concerns; bugs that could corrupt data, strand users, or violate policy.

Skip, or use only the lightweight checklist, for simple CRUD, one boolean flag, visual UI state, low-risk admin toggles, systems with no meaningful lifecycle, or cases where a transition table plus ordinary tests are enough. Do not force event sourcing, projections, jobs, or formal verification unless risk justifies them.

## References

| Read | Trigger |
|---|---|
| `references/interview.md` | During discovery; ask only safety/design/scope questions. |
| `references/implementation-patterns.md` | Before coding or storage/API design. |
| `references/formal-modeling.md` | Only when the formal lane is selected, or for the deep lane's no-Quint packet. |
| `references/test-matrix.md` | Before implementation or final review; select relevant boundary tests. |
| `references/anti-patterns.md` | During design review; call out lifecycle smells. |

## Workflow

Before implementation, produce a compact design packet. Ask only questions that materially affect design/safety/scope; otherwise assume and state assumptions. During discovery, read `references/interview.md`.

Choose the lightest useful depth:

```text
Lightweight: state table + transitions + invariants + tests.
Standard:    add commands, events/history, projections, jobs/backfills, freshness.
Deep:        add stored-vs-derived, race surface, counterexamples, invariant table, scenario traces; read references/formal-modeling.md for the no-Quint packet only.
Formal:      add Quint or machine-spec modeling for critical/concurrent/high-risk flows; read references/formal-modeling.md and run the Quint gate.
```

The formal-modeling reference is lane-gated: load it only for `deep` or `formal`, never for `lightweight` or ordinary `standard`.

Then:

1. Identify aggregate/source of truth.
2. Separate stored from derived states.
3. Draw the transition graph.
4. Define invariants.
5. Define commands/intents.
6. Decide whether events/history are needed.
7. Decide whether projections/read models are needed.
8. Define freshness/cache/replica semantics.
9. Define scheduled jobs and backfills if time or existing data matters.
10. Read `references/test-matrix.md`; define tests.
11. Read `references/anti-patterns.md`; remove or call out lifecycle smells.
12. Confirm before coding when public API, persistence, money/access, or large scope changes are involved.

Before coding or proposing storage/API shape, read `references/implementation-patterns.md`.

## Design Packet

Produce before code for non-trivial systems:

```text
Name:
Purpose:
Aggregate/source of truth:
Owner/tenant boundary:
Stored states:
Derived states:
Terminal states:
Transition graph:
Commands/intents:
Invariants:
Events/history contract:
Projection/read model contract:
Read/API contract:
Freshness/cache/replica contract:
Scheduled jobs:
Backfill/rollout plan:
Observability fields:
Test matrix:
Formal modeling decision:
```

## Acceptance Gate

Require: one aggregate/source-of-truth; explicit stored/derived states; transition table/validator for non-trivial lifecycles; centralized command seam; invariants enforced at the right boundary; typed history when auditability matters; idempotent projectors/jobs/backfills where derived/time-based; versioned policy for durable money/access behavior; explicit freshness semantics; observability for decisions/skips/retries/state changes; boundary tests; optional Quint/machine model for critical flows with actual command output reported.

## Companion Skills

- Use `interactive-system-explainer` after modeling when the user wants a visual/shareable walkthrough.
- Use UI/interface skills only for presentation; lifecycle modeling remains source of truth.
- Use repo-specific skills/conventions for implementation after this skill defines lifecycle and boundaries.

## Output

Return:

1. Short design packet.
2. Chosen depth: `lightweight`, `standard`, `deep`, or `formal`, with reason.
3. Formal-model decision: `none`, `transition table only`, `deep-states packet (no Quint)`, `Quint`, or `machine-spec`, with reason. If `Quint`, include actual `quint parse/typecheck/run` output. If no-Quint deep analysis, state no machine-checked verification was performed and why.
4. Implementation plan.
5. Test matrix.
6. Risks/rollout notes.

For code work, proceed only after the design is clear enough to preserve invariants and avoid hidden lifecycle writes.
