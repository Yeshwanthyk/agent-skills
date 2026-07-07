# Implementation Patterns

## Aggregate and state

- Store durable facts; compute derived views from facts.
- Keep status enums compact.
- Put legal transitions in an explicit transition table/validator for non-trivial lifecycles.
- Treat unknown states defensively.

```text
Stored state = durable domain fact.
Derived state = computed from durable facts + now/context.
Transition table = source of truth for legal movement.
```

## Commands express intent

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

## Events/history

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

## Projections/read models

Use projectors when consumer state should not be recomputed independently by every reader.

```text
source aggregate + versioned policy -> projector -> read model / derived rows -> read service/API
```

Projectors should:

- load source state with required joins
- determine whether source is projectable
- resolve mapping/policy/version
- compute desired output rows
- prune stale rows
- upsert by stable natural key
- be idempotent and safe to rerun

## Versioned policies

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

## Freshness contract

For local caches:

```text
write/project inside transaction -> transaction.on_commit(invalidate cache)
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

## Scheduled jobs

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

## Backfills

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
