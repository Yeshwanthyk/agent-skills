---
name: orchestrate
description: Coordinate multiple agents on large-scope tasks with distinct ownership, appropriate reasoning effort, and user-held approvals.
disable-model-invocation: true
---

# Orchestrate

Remain available to the user while delegating substantive work. Run narrow, read-only scouts in parallel with `reasoning_effort: "low"`. Use `reasoning_effort: "medium"` for routine implementation and `"high"` for difficult work. Give each agent distinct ownership, prevent overlapping assignments, and instruct leaf workers not to delegate. Integrate the results and keep approvals with the user.
