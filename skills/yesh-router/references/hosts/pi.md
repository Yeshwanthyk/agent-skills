# Pi

Pi is the host when the tool list includes `subagent_spawn` (the pi-subagents package) or `ask_user`.

## Dispatch

`subagent_spawn` runs a child with the model the host's routing file names; `wait: true` returns its result in the same call, otherwise collect it with `subagent_wait`. `subagent_inspect` reads a child's state without consuming its result, and `subagent_cancel` settles one before replacement.

## Show

When the glimpse skill is installed, open an HTML page in its native window. Otherwise save the file and report the path.

The TUI draws Mermaid as terminal art with `grok-mermaid`. A diagram wider than the terminal falls back to raw source with no warning, so fit it to about 80 columns:
- Supported types are `flowchart`/`graph`, `sequenceDiagram`, `stateDiagram`, `classDiagram`, and `erDiagram`. `pie` is not.
- Prefer `TD` over `LR`, keep at most three boxes side by side, and keep labels to a few words.
- Keep hyphens out of edge labels; `no re-check` renders as a stray box.
- When a diagram cannot fit, use a text tree or ASCII instead.

## Ask

Blocking choices go through `ask_user`.
