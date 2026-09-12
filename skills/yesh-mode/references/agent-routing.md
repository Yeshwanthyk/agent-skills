# Agent routing

Use this contract for delegated work across the collection.

## Role defaults

| Work | Model | Reasoning |
| --- | --- | --- |
| Scout paths, contracts, and open questions | openai-codex/gpt-5.6-luna | max |
| Implement | openai-codex/gpt-6-astra | medium |
| Review implementation or other completed work | openai-codex/gpt-6-astra | medium |
| High-level audit of architecture or cross-cutting risk | openai-codex/gpt-6-astra | high |

An explicit user override wins. Use the current harness's supported model and reasoning fields. If it uses a different identifier format, resolve these same models through its documented mapping. If the requested choice is unavailable, report that limit instead of silently substituting a model.

Use the current managed runtime. Use an external runtime only when the user requests it; inspect its current interface before dispatch.

## Ownership and results

Give each worker a standalone brief with the outcome, input artifacts, owned write paths or read-only scope, and relevant proof. Include completed dependency results in a handoff. Confirm remote access to required state before launching remote work.

Keep concurrent writers on distinct targets. A review of implementation uses an agent that did not author it. The coordinator owns integration and checks consequential claims against artifacts.

Account for each launched worker. Settle or cancel an old writer before replacing it. Retain unresolved session IDs and report their state. Permanent deletion of a durable session requires a user request.
