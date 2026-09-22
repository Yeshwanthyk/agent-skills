# Delegation

Use this reference when work is handed to another worker: a dispatched agent, a subprocess, or any harness-managed task. It is portable: it mandates no model, provider, or API. Role defaults such as model and effort choices are host preferences, configured by the host outside this reference.

## Dispatch and communication

- Give each worker a clear task, owned write paths or read-only scope, relevant inputs, and expected result or proof. Use context the harness actually passes to the worker; supply what is missing rather than repeating the whole conversation. Confirm remote access to required state before launching remote work.
- When a worker follows a selected method, carry it into the assignment: name the method, the worker's step, its completion criteria, and the skill or reference paths it needs to read. Pass applicable decisions and constraints from the parent; a worker may have no inherited skill context. The worker reads that guidance before acting and applies it within its assigned scope. Include router activation only when it is already active and the worker needs to select further methods; a focused worker needs its method, not the entire catalog. Direct tasks can remain direct.
- Use the harness's supported parent–child channels for questions, decisions, blockers, steering, and results. Pass completed results directly to dependent workers. Ordinary coordination needs no separate handoff document.

## Ownership and results

- Keep concurrent writers on distinct targets. A review of implementation uses an agent that did not author it. The coordinator owns integration and checks consequential claims against artifacts.
- Reconcile the result against the assignment's completion criteria, including any proof required by its method. Carry incomplete steps back into the active workflow rather than treating a worker's summary as completion of the whole task.
- Account for each launched worker. Settle or cancel an old writer before replacing it. Retain unresolved session IDs and report their state. Permanent deletion of a durable session requires a user request.

## Defaults and limits

- An explicit user override wins. Use the current harness's existing configuration for model and effort defaults; do not invent a new configuration system.
- Use the current harness's native dispatch mechanism. Use an external runtime only when the user requests it; inspect its current interface before dispatch.
- If a requested choice or capability is unavailable, report that limit instead of silently substituting. If the harness offers no suitable worker, do the work directly and say so.

For a restart, replacement, or transfer to a receiver without the working context, use the [handoffs principle](principles/handoffs.md).
