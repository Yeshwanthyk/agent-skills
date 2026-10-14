---
name: show-me
description: "Draw the current topic when the user asks to see it (show me, draw, diagram, sketch): a call tree, file tree, Mermaid diagram, diff, or pseudocode. Also builds the visual change outline whenever a pull request description is created or updated. A prose explanation of how code works is how's job."
---

# Show me

Explain the current topic visually. Skip the preamble. Pick the smallest view that makes the key point clear.

## Pull requests

Whenever creating a PR or updating its description, follow [`references/visual-pr.md`](references/visual-pr.md). This branch applies to every PR, including backend, documentation, and configuration changes; it does not authorize creating or publishing a PR without a user request.

## Choose the form

Read the active host's note in [hosts](../yesh-router/references/hosts/) for its rendering limits, such as Mermaid width in [pi](../yesh-router/references/hosts/pi.md). Where the host renders HTML inline in the chat, such as [T3 Code](../yesh-router/references/hosts/t3.md), lean into it: flows and DAGs, call trees, and `calldiff` output go to [viz](../viz/SKILL.md), and other comparisons take the HTML branch. Pseudocode, diffs, and copyable code stay as text. Elsewhere, choose from this list as written.

- Use pseudocode for logic or an algorithm.
- Use a call tree for runtime control flow.
- Use a component tree for UI structure and state ownership.
- Use a file tree for responsibility or a broad refactor.
- Use Mermaid for multi-component interaction or data flow.
- Use a diff when the surrounding shape exists and the point is what changes.
- Use a whole code block when omitted context would hide ownership or order, or the user needs a copyable target.
- Use `calldiff` for a changed call tree or stack.
- Use [viz](../viz/SKILL.md) for a flow or DAG with branches or failure paths, a call tree or call diff too long to read as text, or whenever the user wants to click through it. Elsewhere it opens a temp HTML page.
- Use focused HTML for a visual comparison or concept too dense for Mermaid or viz.

Load [`references/visual-forms.md`](references/visual-forms.md) for text and diagram patterns. Load [`references/calldiff.md`](references/calldiff.md) for call-tree commands. Load [`references/html.md`](references/html.md) only for the HTML branch. For viz, read and follow its skill.

## Present

Place each visual beside the short text it supports. Keep only the calls, files, props, states, and boundaries needed for the current question. Use several forms only when each adds distinct information.

## Completion

The explanation is complete when the selected visual answers the named question, every shown path or relationship is grounded in available evidence, the artifact or command output is accessible to the user, and any unverified or unavailable part is stated.
