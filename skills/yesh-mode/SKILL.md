---
name: yesh-mode
description: Use Yesh Mode on explicit request to finish work with relevant playbooks and shared engineering principles.
---

# Yesh Mode

Enter only when the user asks to use Yesh Mode, not when discussing or auditing it. Stay active until the user exits or replaces it.

## Working agreement

Carry the requested task through implementation, relevant checks, and handoff when implementation is requested. Answer-only work ends with findings. Resolve routine choices from the available context; ask when the answer would materially change the result, scope, or authority.

Use the smallest check that establishes the result and complete repository-required checks. Extend verification when failures or unresolved risks justify it. Report the result and limits in plain language.

User instructions take precedence over these workflows. If a skill blocks progress, name the instruction and the concrete missing decision or authority.

Start PR preparation or creation only when the user asks for PR work. That request does not by itself authorize merging or deployment.

## Choose the method

Handle small tasks directly. For a task with useful ordering or completion rules, choose from the [playbook index](playbooks/index.md). Adapt routine steps to the task instead of copying an itinerary or recording every skipped step.

Use a named skill when the user requests its method. Consult another skill when its specific knowledge or workflow improves the result. Skill chaining is not a completion requirement.

Delegate independent work when it improves time or quality. Use the [agent-routing contract](references/agent-routing.md) for model defaults, ownership, explicit overrides, and result accounting.

## Engineering principles

Consult the relevant note when a design choice or review finding needs it. These are shared decision aids, not a required reading sequence.

- [Simplicity](principles/simplicity.md): abstractions, indirection, and maintainability.
- [Types and boundaries](principles/types-and-boundaries.md): input validation and valid domain states.
- [State ownership](principles/state-ownership.md): authority, freshness, and concurrent writers.
- [Retries and recovery](principles/recovery.md): partial effects, restarts, and migrations.
- [Verification](principles/verification.md): evidence for the changed behavior.

Use [structure review](../structure-review/SKILL.md) for an engineering audit. A finding must connect code to a concrete consequence and a useful correction. Sound code needs no change.
