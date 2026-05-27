---
name: mission
description: Keep long-running coding tasks aligned with the original mission while handling side quests. Use when a discussion includes detours, multiple fixes, reviews, or emerging issues and the assistant must preserve progress, constraints, and decisions without losing the primary objective of the mission.
---

# Mission

Use this skill to keep execution anchored to the original user goal while parallel issues appear. 
You can run this skill at all times for any coding session.

## Core Behavior

- Capture a one-sentence mission statement at the start.
- Define completion criteria from the user request.
- Reconnect work back to the mission after each side quest.
- End with a mission check and a concise summary.
- Keep track of mission and changes to said mission in a MISSION.md file.
- If the mission seems large enough to warrant a separate plan document / checklist use NEXT.md or create .md file and reference it
- If user starts a mission that is different from the last mission, confirm and then clear the MISSION.md file

## Mission Baseline

At the beginning of work, record:

- Mission: one sentence describing the primary objective.
- Done criteria: concrete acceptance checks.
- Guardrails: constraints that must not be violated.

## Work Cycle

1. Pick one checklist item.
2. Code the smallest coherent chunk.
3. Run a subagent review for that chunk.
4. Fix confirmed findings.
5. Run / add / update focused tests/checks for the chunk.
6. Fix failures.
7. Mark the checklist item done.

## Critical Learnings Log

Track only material items that change execution.

- Decision: chosen approach and why.
- Constraint: technical or process rule that limits options.
- Blocker: issue that prevents forward progress.
- Validation: confirmed behavior from tests or runtime output.

Avoid logging minor observations or repetitive status details.

## Side Quest Triage

When a new request appears during execution:

- Classify as `blocking` if it must be resolved to complete the mission.
- Classify as `non-blocking` if it can be parked.
- If blocking: resolve it, then explicitly restate how work returns to mission.
- If non-blocking: use $park to capture it in `NEXT.md`, then continue mission path.

## Mission Checks

Run a mission check at major transitions and before final response:

- What done criteria are complete.
- What remains to satisfy the mission.
- What side quests remain open.
- Which critical learnings changed execution.

## Final Response Pattern

Structure final output in this order:

1. Mission completion status.
2. Completed work mapped to done criteria.
3. Critical learnings summary.
4. Open side quests or residual risks.
