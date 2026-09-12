---
name: show-me
description: Explain the current topic with a focused diagram, code sketch, or visual artifact.
---

# Show me

Explain the current topic visually. Skip the preamble. Pick the smallest view that makes the key point clear.

## Choose the form

- Use pseudocode for logic or an algorithm.
- Use a call tree for runtime control flow.
- Use a component tree for UI structure and state ownership.
- Use a file tree for responsibility or a broad refactor.
- Use Mermaid for multi-component interaction or data flow.
- Use a diff when the surrounding shape exists and the point is what changes.
- Use a whole code block when omitted context would hide ownership or order, or the user needs a copyable target.
- Use `calldiff` for a changed call tree or stack.
- Use focused HTML for a visual comparison or concept too dense for Mermaid.

Load [`references/visual-forms.md`](references/visual-forms.md) for text and diagram patterns. Load [`references/calldiff.md`](references/calldiff.md) for call-tree commands. Load [`references/html.md`](references/html.md) only for the HTML branch.

## Present

Place each visual beside the short text it supports. Keep only the calls, files, props, states, and boundaries needed for the current question. Use several forms only when each adds distinct information.

## Completion

The explanation is complete when the selected visual answers the named question, every shown path or relationship is grounded in available evidence, the artifact or command output is accessible to the user, and any unverified or unavailable part is stated.
