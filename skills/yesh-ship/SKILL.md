---
name: yesh-ship
description: Use for /ship, "finish it", implementing already-shaped work, carrying changes through verification, blocker-first review, fixes, and second-pass validation. Does not commit unless the user separately asks for commit flow.
---

# Yesh Ship

Finish shaped work without committing.

## Workflow

1. Confirm the shaped plan from context or `yesh-plan`. If missing, create a tiny local shape first.
2. Convert the plan into a task checklist and execute each decided task/chunk.
3. Implement in logical chunks. Preserve existing patterns and user changes.
4. Identify the right verification surface: unit, integration, harness, e2e, browser/runtime, typecheck.
5. If a harness/e2e exists for the changed behavior, use it. If the change needs one and none exists, add the smallest useful harness/test.
6. Run targeted verification.
7. Review gate: use a review subagent when available, then inspect the diff for blockers.
8. Fix blockers you introduced.
9. Second pass: rerun relevant verification and review prior findings only; avoid reopening unrelated scope.
10. Update operational docs only when they are part of done-ness.
11. Stop before commit unless explicitly asked.

## Output

```md
Changed
- path: change

Plan execution
- done:
- skipped:

Test / harness
- existing:
- added:
- not added:

Verified
- command/check: result

Review gate
- no blockers | blockers fixed | remaining blockers

Notes
- ...
```

## Rules

- Do not commit.
- Do not add unrelated cleanup.
- Treat review findings as work, not commentary; fix in-scope blockers before final.
- Prefer existing test harnesses/e2e over inventing new ones.
- Add new harness coverage only when behavior cannot be verified well by existing tests.
- Do not widen scope while fixing review findings.
- If verification cannot run, say why and give the remaining risk.
