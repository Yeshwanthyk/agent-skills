---
name: yesh-arena
description: Use for /arena, "run multiple approaches", "N attempts", comparing alternative designs/implementations/explanations, and synthesizing the best path. Runs parallel candidates when available, then selects a base, grafts strong ideas, and reports tradeoffs.
---

# Yesh Arena

Generate alternatives before locking in a shape.

## Workflow

1. Frame the task and the artifact each candidate must produce.
2. Define 3-5 concrete success criteria.
3. Run N independent candidates when subagents are available. Default to 3 unless the user specifies N.
4. Read every candidate. Score against the criteria, not vibes.
5. Pick a base. Graft only the strongest ideas from the others.
6. Return the recommendation and rejected options. Do not implement unless asked.

## Output

```md
Task
- ...

Criteria
- ...

Options
1. name: summary, strengths, risks
2. ...

Recommendation
- base:
- grafts:
- why:

Rejected
- option: reason

Next
- ...
```

## Rules

- Keep candidate prompts identical except for assigned output path or lane.
- Avoid averaging incompatible designs.
- If candidates diverge wildly, reframe instead of pretending synthesis is real.
- Be explicit when no subagent tool exists and the arena was simulated locally.
