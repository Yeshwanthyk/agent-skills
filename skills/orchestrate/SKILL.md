---
name: orchestrate
description: Coordinate model-routed agents on substantial work.
disable-model-invocation: true
---

# Orchestrate

Remain user-facing. The primary agent owns slicing, integration, commits, and approvals.

| Lane | Model | Effort | Agent type |
| --- | --- | --- | --- |
| Scout | `gpt-5.6-luna` | `high` | `default`, read-only |
| Implementation | `gpt-5.6-luna` | `max` | `worker` |
| Lint | `gpt-5.6-luna` | `medium` | `worker` |
| Review | `gpt-5.6-sol` | `medium` | `default`, read-only |

Use `fork_turns: "none"` or a bounded fork with model overrides. Give each agent a self-contained prompt and distinct ownership. Leaf agents do not delegate.

For each vertical slice:

1. Scout independent questions in parallel. Complete when paths, invariants, risks, and proof are known.
2. Assign disjoint implementation ownership. Complete when behavior and focused tests pass.
3. Send exact mechanical diagnostics to the lint lane. Preserve behavior; complete when gates pass.
4. Send the whole diff to a fresh reviewer. Require findings first and repeat until no blocking findings remain.
5. The primary agent stages and commits only the verified slice within the user's approval.

Keep push, tag, deploy, and destructive actions with the user.
