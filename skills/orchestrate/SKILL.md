---
name: orchestrate
description: Coordinate model-routed agents on substantial work.
disable-model-invocation: true
---

# Orchestrate

Remain user-facing. The primary agent owns slicing, integration, commits, and approvals.

| Lane | Exact model | Effort | Ownership |
| --- | --- | --- | --- |
| Scout | `openai-codex/gpt-5.6-luna` | `high` | read-only question |
| Thin implementation slice | `openai-codex/gpt-5.6-luna` | `max` | one bounded outcome |
| Thick vertical slice | `openai-codex/gpt-5.6-sol` | `medium` | end-to-end outcome |
| Verification | `openai-codex/gpt-5.6-sol` | `medium` | fresh read-only proof, or focused integration repair |

Use `subagent_spawn` with `harness: "pi"`, the exact model id above, and the exact `reasoning_effort`. A thin slice has one owner, a narrow file/contract surface, and focused proof. A thick slice crosses contracts, runtime boundaries, shared files, or integration gates. When classification is uncertain, route it as thick.

Model routing is fail-closed. If the exact provider/model/effort is unavailable, stop before spawning and tell the user what is unavailable. Never substitute another provider, model, or effort.

Give each agent a self-contained prompt and distinct ownership. Leaf agents do not delegate.

For each vertical slice:

1. Scout independent questions in parallel. Complete when paths, invariants, risks, and proof are known.
2. Classify each implementation assignment as thin or thick before spawning, then use its exact route. Complete when behavior and focused tests pass.
3. Send the integrated diff and exact required gates to a fresh verification agent. Require findings and proof; allow only focused integration repairs.
4. Repeat verification until no blocking findings or failed required gates remain.
5. The primary agent stages and commits only the verified slice within the user's approval.

Keep push, tag, deploy, and destructive actions with the user.
