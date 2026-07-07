# Anti-Patterns

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
