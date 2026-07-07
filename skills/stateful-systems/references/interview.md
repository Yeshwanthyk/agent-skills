# Interview Questions

Ask only questions that materially affect design, safety, or scope.

## Aggregate/source of truth

- What is the primary entity whose lifecycle matters?
- Who owns it: user, account, organization, tenant, project, device, etc.?
- Can more than one active/current record exist per owner?
- What existing records must be preserved or migrated?

## States

- What stored states exist?
- Which states are terminal?
- Which states are derived from time, context, policy, or related data?
- Should denied/restricted states be visible with reasons or hidden entirely?

## Transitions

- What transitions are legal?
- What triggers each transition: user, system, webhook, scheduler, ops?
- What actor/permission is required for each transition?
- Are transitions immediate or future-effective?
- Are any transitions reversible?
- Is there a manual override path?

## Invariants

- What must never happen?
- Are there uniqueness or overlap rules?
- Are there cross-row or cross-tenant constraints?
- Are there ordering/stream-version/idempotency requirements?
- Which invariants should be backed by database constraints?

## Contracts

- What external payloads enter the system?
- What command input shape should express intent?
- What event/history payloads are needed?
- What projections/read models are needed?
- What should APIs expose: state, next actions, denial reasons, effective dates, previews?

## Automation and rollout

- What changes because time passed?
- What jobs must run and at what cadence?
- What happens on rerun, overlap, and partial failure?
- Is a dry-run/apply backfill needed?
- Are old records grandfathered under old rules?
- Is versioning needed for policy/mapping behavior?

## Freshness and observability

- Can stale reads cause user-visible or correctness bugs?
- Are caches or replicas involved?
- What must be invalidated after commit?
- What trace/log fields are needed for support/debugging?
