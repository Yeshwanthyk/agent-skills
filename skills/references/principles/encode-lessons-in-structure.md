# Encode lessons in structure

**Read when:** improving a workflow is in scope, a recurring instruction repeats, or a failure pattern needs a durable guardrail.

- Turn a recurring instruction into a focused lint, schema constraint, metadata rule, or executable check where it can enforce the invariant. Demonstrate that it catches the failure.
- Pick the strongest rung the situation allows: an unrepresentable state that cannot compile beats a lint rule, a lint rule beats a canonical helper, a helper beats an instruction.
- Reflection-only work proposes this change; it does not authorize implementation.
- Do not paper over symptoms with an instruction: if the fix is structural, use the structural fix.

**Limits:** a one-off tool for the work in front of you is [build-the-lever](build-the-lever.md).