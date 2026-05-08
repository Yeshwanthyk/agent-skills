---
name: stateful-systems
description: Model and build stateful software systems with lifecycle states, transitions, commands, events, projections, read models, idempotent jobs, backfills, freshness contracts, boundary tests, and optional formal verification with Quint or machine specs. Use when designing workflows, approvals, onboarding, access systems, payment/invoice lifecycles, webhook-driven flows, queue processors, orchestration, or any feature with state transitions and derived reads.
---

# Stateful Systems

Use this skill to design and implement systems where records move through meaningful states and readers depend on consistent derived behavior.

Core principle:

```text
Facts → Rules → Intent → Events → Projections → Reads → Automation → Rollout → Tests
```

Do not start with tables or code. Start with lifecycle, boundaries, invariants, and transition safety.

## When to use

Use for features involving:

- lifecycle/status transitions
- workflows, approvals, onboarding, orchestration
- payment, invoice, access, eligibility, or entitlement-like flows
- external events/webhooks driving state
- scheduled state advancement
- projected read models or derived rows
- backfills/rollouts of existing state
- read-after-write, cache, replica, or freshness concerns
- bugs that could corrupt data, strand users, or silently violate policy

## When not to use

Do not overengineer. Skip this skill, or use only the lightweight design checklist, for:

- simple CRUD
- one boolean flag
- purely visual UI state
- low-risk admin-only toggles
- systems with no meaningful lifecycle
- cases where a transition table plus ordinary tests are enough

Do not force event sourcing, projections, background jobs, or formal verification unless the complexity/risk justifies them.

## Required workflow

Before implementation, produce a compact design packet. Ask only questions that materially affect design/safety/scope; otherwise assume and state assumptions.

Choose the lightest useful depth:

```text
Lightweight: state table + transitions + invariants + tests.
Standard:    add commands, events/history, projections, jobs/backfills, freshness.
Deep:        full deep-states packet (stored vs derived, race surface, counterexample candidates, hand-written invariant table) — use when Quint is unavailable or declined but the system warrants it.
Formal:      add Quint or machine-spec modeling for critical/concurrent/high-risk flows.
```

If you are about to choose `Formal`, run the **Quint availability gate** below first — confirm Quint is installed, ask the user to install if not, and fall back to the `Deep` lane on decline. Never silently skip from `Formal` to `Standard`.

Then proceed:

1. Identify the aggregate/source of truth.
2. Separate stored states from derived states.
3. Draw the transition graph.
4. Define invariants.
5. Define commands/intents.
6. Decide whether events/history are needed.
7. Decide whether projections/read models are needed.
8. Define freshness/cache/replica semantics.
9. Define scheduled jobs and backfills if time or existing data matters.
10. Define test matrix.
11. Confirm the design before coding when public API, persistence, money/access, or large scope changes are involved.

## Interview questions

Use these to shape the system.

### Aggregate/source of truth

- What is the primary entity whose lifecycle matters?
- Who owns it: user, account, organization, tenant, project, device, etc.?
- Can more than one active/current record exist per owner?
- What existing records must be preserved or migrated?

### States

- What stored states exist?
- Which states are terminal?
- Which states are derived from time, context, policy, or related data?
- Should denied/restricted states be visible with reasons or hidden entirely?

### Transitions

- What transitions are legal?
- What triggers each transition: user, system, webhook, scheduler, ops?
- What actor/permission is required for each transition?
- Are transitions immediate or future-effective?
- Are any transitions reversible?
- Is there a manual override path?

### Invariants

- What must never happen?
- Are there uniqueness or overlap rules?
- Are there cross-row or cross-tenant constraints?
- Are there ordering/stream-version/idempotency requirements?
- Which invariants should be backed by database constraints?

### Contracts

- What external payloads enter the system?
- What command input shape should express intent?
- What event/history payloads are needed?
- What projections/read models are needed?
- What should APIs expose: state, next actions, denial reasons, effective dates, previews?

### Automation and rollout

- What changes because time passed?
- What jobs must run and at what cadence?
- What happens on rerun, overlap, and partial failure?
- Is a dry-run/apply backfill needed?
- Are old records grandfathered under old rules?
- Is versioning needed for policy/mapping behavior?

### Freshness and observability

- Can stale reads cause user-visible or correctness bugs?
- Are caches or replicas involved?
- What must be invalidated after commit?
- What trace/log fields are needed for support/debugging?

## Design packet template

Produce this before code for non-trivial systems:

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

## Implementation patterns

### Aggregate and state

- Store durable facts; compute derived views from facts.
- Keep status enums compact.
- Put legal transitions in an explicit transition table/validator for non-trivial lifecycles.
- Treat unknown states defensively.

```text
Stored state = durable domain fact.
Derived state = computed from durable facts + now/context.
Transition table = source of truth for legal movement.
```

### Commands express intent

Commands should sound like user/system intent:

```text
activate
pause
resume
cancel
approve
reject
expire
retry
grant_override
```

Avoid generic mutation commands like:

```text
update_status
save_model
set_flag
```

A command should:

- validate actor/tenant ownership
- validate transition
- validate invariants
- lock required rows or aggregate owner
- mutate source-of-truth state
- append event/history if needed
- call projectors/syncs explicitly
- invalidate caches or emit freshness signals at commit boundary
- return a domain result, not incidental storage details

### Events/history

Events record facts, not requests.

Command:

```text
CancelThing
```

Event:

```text
ThingCancelled
```

Use typed append-only history when auditability, replay, debugging, external integrations, or support visibility matter.

Event envelope shape:

```text
aggregate_id
stream_version
schema_version
event_type
occurred_at
effective_at
source
actor_id
idempotency_key
from_state
to_state
payload
```

### Projections/read models

Use projectors when consumer state should not be recomputed independently by every reader.

```text
source aggregate + versioned policy → projector → read model / derived rows → read service/API
```

Projectors should:

- load source state with required joins
- determine whether source is projectable
- resolve mapping/policy/version
- compute desired output rows
- prune stale rows
- upsert by stable natural key
- be idempotent and safe to rerun

### Versioned policies

Version any rule/mapping where changes affect old behavior:

- pricing
- access/eligibility
- workflow templates
- external payload interpretation
- policy restrictions
- generated obligations

Rule:

```text
If changing a rule would surprise existing users or alter money/access, pin a version on the aggregate.
```

### Freshness contract

For local caches:

```text
write/project inside transaction → transaction.on_commit(invalidate cache)
```

For distributed read-after-write:

```text
write emits consistency token
client sends token on later reads
server routes to fresh-enough source
server signals when consistency is satisfied
client clears token debt
```

State the chosen freshness behavior explicitly.

### Scheduled jobs

Scheduled jobs must be safe to rerun, safe to overlap, and safe to partially fail.

Preferred shape:

```text
ids = snapshot candidate ids
for each id:
  transaction
  lock row if needed
  re-check qualification
  skip if already handled
  run domain command
  defer external side effects until commit
  isolate row errors
return structured summary
```

### Backfills

Backfills should normally replay production intent through domain commands.

Checklist:

- dry-run by default
- explicit apply flag
- targeted filters
- deterministic ordering
- prerequisite validation
- skip existing valid state
- structured summary output
- tests for dry-run, apply, targeted run, invalid args, existing-state skip

## Formal modeling lane

Use this lane for critical or complex state systems. Formal modeling is optional for simple systems, but strongly recommended when lifecycle bugs could corrupt data, money, access, orchestration, or user progress.

### When to model formally

Use Quint or a machine spec when:

- transition sequences are non-trivial
- multiple actors or jobs can race
- ordering/concurrency matters
- derived state can drift from source state
- invariants span multiple rows/entities
- there are terminal/stuck states
- failures need traceable counterexamples
- the team wants confidence beyond example-based tests

### Quint availability gate

Before writing any `.qnt` model, confirm Quint is installed and the user wants to use it. Do not silently skip formal verification, and do not assume the user will install on demand — ask.

```bash
command -v quint >/dev/null 2>&1 && quint --version || echo "NOT INSTALLED"
```

Three branches:

1. **Installed and the system meets the "when to model formally" bar** → proceed with the Quint packet below. Run `parse`, `typecheck`, and at least one `run` invocation, and report actual output.

2. **Not installed** → ask the user, exactly once:

   > Quint is not installed. This system meets the bar for formal modeling (…one-line reason…). Install it and verify? 
   >  `npm install -g @informalsystems/quint`  (or `brew install quint`)
   >
   > Reply **install** to proceed with formal verification, or **skip** to do deep states understanding without it.

   - On **install** → install, confirm `quint --version` succeeds, then proceed with the Quint packet.
   - On **skip**, no reply, or any other answer → fall through to the deep-states-understanding lane below. Do not reraise the question later in the same task.

3. **Installed but the system does not meet the bar** (simple CRUD, single-flag toggle, etc.) → do not propose Quint. The transition table and tests are sufficient.

### Deep states understanding (no-Quint lane)

When formal verification is skipped — by user choice or because the system does not warrant it — still go beyond a one-line transition table. Produce a written deep-states packet:

- **Stored vs derived states** enumerated separately, each with the rule that produces it.
- **Transition table** with `from → to · trigger · actor · guard · invariants checked · events emitted`.
- **Reachability sketch** — from `init`, which states are reachable in N hops? Which are dead ends, which are absorbing?
- **Race surface** — every pair of transitions that can interleave, and what locking/idempotency protects them.
- **Invariant table** — each invariant tagged with where it is enforced (DB constraint, command guard, projector, test only).
- **Counterexample candidates** — hypothetical bad sequences (`A then B then C produces inconsistent X`); for each, name the mechanism that prevents it. Anything without a named mechanism is a real risk — surface it explicitly.
- **Scenario walk-throughs** — happy path plus at least one race, one retry, one terminal/stuck case, written as state-by-state traces.
- **Test matrix** — the same matrix you'd derive from a Quint model, just hand-written. Cover transitions, races, idempotency, and rollout.

This lane does **not** claim formal correctness. State the limitation explicitly in the packet: "No machine-checked verification — this analysis is structured but example-based."

If the visual artefact is also requested, hand off to `interactive-system-explainer` with the deep-states packet as the source-of-truth input. The state-machine, history, and scenario tabs of the explainer become the rendered form of this analysis.

### Minimal Quint model packet

A useful `.qnt` model should include:

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

### Precheck-style machine-source principle

For critical state machines, prefer one authoritative machine definition over duplicated spec + implementation.

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

## Test matrix

For non-trivial systems, tests should cover every boundary.

```text
State/transition:
- allowed transitions
- invalid transitions
- terminal states
- derived states

Command:
- happy path
- invariant violation
- actor/tenant violation
- duplicate/idempotent intent

Event/history:
- typed parse/dump
- missing required fields
- stream/version ordering
- idempotency key
- source/actor requirements

Projection/read model:
- source state -> output rows
- stale row pruning
- non-projectable source state
- versioned behavior
- rerun idempotency

Freshness:
- cache invalidation after commit
- read-after-write behavior
- stale read fallback if applicable

Task/job:
- no-op
- qualifies
- no longer qualifies after lock
- already-handled skip
- rerun
- concurrent run if relevant
- per-row failure isolation

Backfill:
- dry-run no persistence
- apply persists through domain command
- targeted run
- existing-state skip
- invalid args/config

API/UI:
- exposes intentional domain contract
- denial/hidden states behave intentionally
- next actions/effective dates/previews are correct
```

## Acceptance criteria

A good implementation/design has:

- one clear aggregate/source-of-truth
- explicit stored and derived states
- transition table/validator for non-trivial lifecycle
- centralized command seam for lifecycle writes
- invariants enforced at the right boundary
- typed event/history when auditability matters
- idempotent projector when read models are derived
- versioned policy/mapping when old behavior must survive
- explicit freshness/cache/replica semantics
- idempotent scheduled jobs when time/external events advance state
- dry-run backfills for existing data changes
- observability for decisions, skips, retries, and state changes
- tests across boundaries
- optional Quint/machine model for critical flows, with commands/results reported

## Anti-patterns

Avoid:

- scattered `if status == ...` checks across services
- generic `update_status` APIs for meaningful lifecycle changes
- state changes in model hooks that hide cross-model side effects
- readers independently reconstructing complex domain rules
- unversioned mappings for money/access/policy behavior
- background jobs that assume exactly-once execution
- backfills that raw-write around production invariants
- API surfaces that expose incidental DB shape instead of domain intent
- formal specs that are never run
- claims that tests/verification passed without actual command output
- one giant machine modeling the whole product

## Companion skills

- Use `interactive-system-explainer` after modeling when the user wants a visual/shareable walkthrough.
- Use UI/interface skills only for presenting the system; do not let visual design substitute for lifecycle modeling.
- Use repository-specific skills/conventions for implementation details after this skill defines the lifecycle and boundaries.

## Output format

When using this skill, produce:

1. Short design packet.
2. Chosen depth: `lightweight`, `standard`, or `formal`, with reason.
3. Formal-model decision: `none`, `transition table only`, `deep-states packet (no Quint)`, `Quint`, or `machine-spec`, with reason. If `Quint`, include actual `quint parse/typecheck/run` output. If `deep-states packet (no Quint)`, state explicitly that no machine-checked verification was performed and why (declined / not installed / out of scope).
4. Implementation plan.
5. Test matrix.
6. Risks/rollout notes.

For code work, only proceed after the design is clear enough to preserve invariants and avoid hidden lifecycle writes.
