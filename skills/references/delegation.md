# Delegation

Use this reference when work is handed to another worker: a dispatched agent, a subprocess, or any harness-managed task. It is portable: it mandates no model, provider, or API. Role defaults such as model and effort choices are host preferences, configured by the host outside this reference.

## Dispatch and communication

- Give each worker a clear task, owned write paths or read-only scope, relevant inputs, and expected result or proof. Use context the harness actually passes to the worker; supply what is missing rather than repeating the whole conversation. Confirm remote access to required state before launching remote work.
- Use the harness's supported parent–child channels for questions, decisions, blockers, steering, and results. Pass completed results directly to dependent workers. Ordinary coordination needs no separate handoff document.

## Ownership and results

- Keep concurrent writers on distinct targets. A review of implementation uses an agent that did not author it. The coordinator owns integration and checks consequential claims against artifacts.
- Account for each launched worker. Settle or cancel an old writer before replacing it. Retain unresolved session IDs and report their state. Permanent deletion of a durable session requires a user request.

## Defaults and limits

- An explicit user override wins. Use the current harness's existing configuration for model and effort defaults; do not invent a new configuration system.
- Use the current harness's native dispatch mechanism. Use an external runtime only when the user requests it; inspect its current interface before dispatch.
- If a requested choice or capability is unavailable, report that limit instead of silently substituting. If the harness offers no suitable worker, do the work directly and say so.

For a restart, replacement, or transfer to a receiver without the working context, use the [handoffs principle](principles/handoffs.md).
