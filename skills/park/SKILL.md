---
name: park
description: Capture deferred ideas, side quests, and future implementation notes in NEXT.md so they can be resumed later without reconstructing context. Use when the user says to park something, defer it, come back later, write it down for later, or update NEXT.md, and when pairing with mission to turn a non-blocking branch into an actionable future-work note.
---

# Park

Use this skill to turn deferred work into a resumable note. Pair it with `mission` when current execution must stay focused on the active objective.

## Core Behavior

- Verify the item is truly non-blocking before parking it.
- Capture only the context that will change future execution.
- Prefer updating an existing `NEXT.md` entry over creating duplicates.
- Restate the active mission or current task after parking the idea.

## File Choice

- Use the repo-root `NEXT.md` when it already exists.
- Create `NEXT.md` at the active worktree root when it does not exist.
- Preserve the existing heading style and note structure instead of rewriting the file.

## Parking Checklist

Before writing, extract:

- Title: short label for the parked item.
- Goal: what the future change should achieve.
- Why parked now: why it should not be done in the current pass.
- Current context: the facts, failures, or decisions that motivated parking it.
- Scope boundary: what belongs in the future slice and what does not.
- Preconditions: dependencies, approvals, rollout gates, or missing information.
- Starting points: likely files, commands, symbols, docs, dashboards, or logs to inspect first.
- Validation: what must be proven before the parked work is considered done.
- Risks or unknowns: what could still go wrong or what remains unclear.

Avoid dumping transcript history. Preserve only the context a later agent would otherwise have to rediscover.

## NEXT.md Note Shape

Prefer this order when adding or updating a note:

```md
## Short Title

Goal:
- ...

Why parked now:
- ...

Current context:
- ...

Scope boundary:
- in: ...
- out: ...

Preconditions:
- ...

Starting points:
- file: `path/to/file`
- command: `...`

Implementation sketch:
1. ...
2. ...

Validation:
- ...

Risks / unknowns:
- ...
```

Keep the note compact. Omit headings that are truly empty, but do not omit context that affects correctness, sequencing, or restart cost.

## Updating Existing Notes

- Merge with the existing note when the parked item matches current future work.
- Replace stale facts instead of appending contradictory history.
- Preserve user-authored wording when it still expresses the right intent.

## Mission Pairing

- Let `mission` decide whether the new branch is blocking or non-blocking.
- If the branch is non-blocking, write or update the `NEXT.md` entry, then explicitly return to the active mission.
- If the parked item becomes the new mission later, lift the relevant note back into active planning and mark the `NEXT.md` entry as moved or done.

## Final Response Pattern

Structure the response in this order:

1. State that the idea was parked.
2. Point to `NEXT.md`.
3. Summarize the resume context that was captured.
4. State what active work resumes now.
