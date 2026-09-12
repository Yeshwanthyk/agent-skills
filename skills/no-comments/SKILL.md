---
name: no-comments
description: Review or remove code comments that add no useful constraint, decision, or explanation.
---

# Comment review

Use the requested files or diff. A review-only request returns findings; a cleanup request authorizes comment edits.

Read a comment with the code it explains. Keep non-obvious constraints, external behavior, deliberate tradeoffs, and side effects. Preserve license notices, required attribution, and tool directives unless their removal is specifically justified.

Remove comments that merely restate code or narrate obsolete change history. Correct stale claims when the intended constraint is clear. Leave an ambiguous, potentially important constraint in place and explain the uncertainty.

A suppression or workaround may expose a code defect, but comment cleanup alone does not authorize removing enforcement or redesigning the implementation. Report the issue, or correct it when implementation is also in scope.

Use the [agent-routing contract](../yesh-mode/references/agent-routing.md) if independent review is useful. A reviewer label is not evidence; verify consequential deletions against the code.

Check syntax or tool behavior when the edit could affect it. Report meaningful removals, retained constraints, and unresolved questions without listing every unchanged comment.
