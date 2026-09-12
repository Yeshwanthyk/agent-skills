# Multi-phase plan template

Use this template only when work genuinely spans phases, stacked changes, or multiple owners. Replace bracketed prompts and remove sections that do not apply.

```markdown
# [Program] plan

[What changes, who benefits, the key invariant or outcome, and the phase order.]

## Scope and operating rule

- Outcome: [checkable predicate]
- Included: [paths, services, or units]
- Excluded: [explicit boundaries]
- Integration owner: [person or role]
- Handoff rule: [artifact or state that unblocks the next phase]

## Phase: [verb phrase]

**Depends on:** [phase or none]
**Owner and files:** [owner, paths, symbols]
**Change:** [behavior, state transition, or contract]
**Risk:** [concrete failure mode]
**Evidence:** [test, command, replay, artifact, or live scenario and pass predicate]
**Handoff:** [what the next owner receives]

## Whole-result check

[Relevant integrated path, migration/recovery check, and pass predicate. Record an explicit limit when a surface is unavailable.]

## Open decisions and risks

[Decision, owner, and blocking phase. Risk, signal, and mitigation or rollback.]
```

Keep shared mutable state under one owner. Delegate independent phases only when useful, and give each worker a disjoint write boundary. Inspect actual artifacts and diffs at handoff. Tests, live checks, performance probes, and recovery checks are conditional on the changed behavior; do not require every lane by template.
