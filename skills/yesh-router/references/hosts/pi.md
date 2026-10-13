# Pi

Pi is the host when the tool list includes `subagent_spawn` (the pi-subagents package) or `ask_user`.

## Dispatch

`subagent_spawn` runs a child with the model the host's routing file names; `wait: true` returns its result in the same call, otherwise collect it with `subagent_wait`. `subagent_inspect` reads a child's state without consuming its result, and `subagent_cancel` settles one before replacement.

## Show

When the glimpse skill is installed, open an HTML page in its native window. Otherwise save the file and report the path.

## Ask

Blocking choices go through `ask_user`.
