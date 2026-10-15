# Delegation

Use this reference when work is handed to another worker: a dispatched agent, a subprocess, or any harness-managed task. It is portable: it mandates no model, provider, or API. Role defaults such as model and effort choices live in the [routing table](routing.md), outside this reference.

## Dispatch and communication

- Give each worker a clear task, owned write paths or read-only scope, relevant inputs, and expected result or proof. Use context the harness actually passes to the worker; supply what is missing rather than repeating the whole conversation. Confirm remote access to required state before launching remote work.
- The chat that activated the router runs it: it owns the method, the todo list, and every spawn. A worker runs the step it was assigned and returns; it does not select methods, activate the router, or spawn its own workers unless the assignment says so.
- When a worker follows a selected method, carry it into the assignment: name the method, the worker's step, its completion criteria, and the absolute path of every skill or reference file it needs to read. Most skills here are hidden from the model, so a worker reaches them only through a path it can open; a relative link like `../how/SKILL.md` resolves against nothing in its context. Pass applicable decisions and constraints from the parent; a worker may have no inherited skill context. The worker reads that guidance before acting and applies it within its assigned scope. Direct tasks can remain direct.
- Use the harness's supported parent–child channels for questions, decisions, blockers, steering, and results. Pass completed results directly to dependent workers. Ordinary coordination needs no separate handoff document.

## Ownership and results

- Run formatting and lint autofix as the tool's own command (`ruff format`, `ruff check --fix`, `eslint --fix`), never as a model rewrite. A worker fixes the errors that remain; it never adds an ignore or disable comment.
- Before integrating a delegated edit, run [`scripts/gate-delegated-diff.sh`](../scripts/gate-delegated-diff.sh) `<base> <owned paths>` in its repository. It rejects added suppressions and files changed outside the owned paths. On rejection, send the worker the gate output or revert; do not accept a summary that says the gate passed.
- Keep concurrent writers on distinct targets. A review of implementation uses an agent that did not author it. The coordinator owns integration and checks consequential claims against artifacts.
- Reconcile the result against the assignment's completion criteria, including any proof required by its method. Carry incomplete steps back into the active workflow rather than treating a worker's summary as completion of the whole task.
- Account for each launched worker. Settle or cancel an old writer before replacing it. Retain unresolved session IDs and report their state. Permanent deletion of a durable session requires a user request.

## Defaults and limits

- An explicit user override wins. Take model and effort defaults from the [routing table](routing.md); do not invent a new configuration system.
- Use the current harness's native dispatch mechanism. Use an external runtime only when the user requests it; inspect its current interface before dispatch.
- If a requested choice or capability is unavailable, report that limit instead of silently substituting. If the harness offers no suitable worker, do the work directly and say so.

When the host is [T3 Code](hosts/t3.md) or [Pi](hosts/pi.md), read its note for how dispatch, waiting, and display map onto its tools.

For a restart, replacement, or transfer to a receiver without the working context, use the [handoffs principle](principles/handoffs.md).
