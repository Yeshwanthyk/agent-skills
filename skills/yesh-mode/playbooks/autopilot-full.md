# Autopilot for independent PRs

Use when the user requests a queue of independent PRs through merge. If the request is planning-only, produce the plan.

Use [orchestrate](orchestrate.md) for role defaults, independent ownership, dependency handoffs, and worker accounting. Mark any operator-owned item that must stop at merge-ready.

Each owner implements its scoped item and runs relevant checks. A separate reviewer assesses the integrated result at its current head. Preserve the verdict's head, base, and patch identity. Recheck evidence affected by later changes.

Use [opening a PR](opening-a-pr.md), [babysit](babysit.md), and [shipping](shipping.md) for the requested external stages. Only items with existing merge authority may land. A parallel queue does not relax branch or authorization rules.

Use a durable record for a long queue. On replacement or restart, settle the old writer and reconcile live state before resuming. A user hold stops new mutations and is relayed to every owner.

Finish when the authorized queue is complete or a concrete blocker is reported. Operator-owned items remain ready for review. Account for unfinished workers and pending external actions.
