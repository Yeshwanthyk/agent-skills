---
name: automate-me
description: Create or update a personal mode from explicit preferences and repeated working conventions.
---

# Automate me

Turn the user's working preferences into a small mode skill. Use an existing matching mode when possible.

Identify the target and the requested action. An investigation request ends with a proposal. When the user asks to create or update the mode, do that work using the stated preferences and ask only about material conflicts or unknown choices.

Use the current conversation first. Read bounded project history through the [session-records contract](../references/session-records.md) when past behavior is needed. An explicit preference can stand on its own; an inferred general rule needs stronger evidence than one unusual event. Use [reflect](../reflect/SKILL.md) only when extracting lessons is part of the request and its method helps.

Keep rules that change future decisions. Remove generic advice, duplicate instructions, cached environment facts, and speculation about the user's style. Preserve task and authorization boundaries. Prefer a link to a useful workflow over copying it.

Use current skill-authoring guidance. Preserve an existing invocation policy. For a new mode, make its activation condition explicit and follow the current harness's supported metadata.

Validate the finished instructions and links. Show the target, meaningful changes, and any unresolved inference. Existing authorization to update a mode does not need a second approval gate.
