# Pi

Pi is the host when the tool list includes `subagent_spawn` (the pi-subagents package) or `ask_user`.

## Dispatch

`subagent_spawn` runs a child with the model the [routing table](../routing.md) names; `wait: true` returns its result in the same call, otherwise collect it with `subagent_wait`. `subagent_inspect` reads a child's state without consuming its result, and `subagent_cancel` settles one before replacement.

## Show

When the glimpse skill is installed, open an HTML page in its native window. Otherwise save the file and report the path.

The TUI shows text only. Draw a flow, sequence, or state machine with [viz](../../../viz/SKILL.md): `viz.py html FILE.viz` builds an interactive page; open it in glimpse when installed, or add `--open` for the browser. In the reply itself use a text tree, a numbered sequence, or a diff, about 80 columns wide. Never Mermaid or box-and-arrow art.

## Ask

Blocking choices go through `ask_user`.
