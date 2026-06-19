---
name: yesh-ship
description: Use for /ship, "finish it", implementing already-shaped work, carrying changes through scoped edits, real-seam verification, blocker-first review, fixes, and second-pass validation. Preserves dirty work and does not stage or commit unless the user separately asks for commit flow.
---

# Yesh Ship

Finish shaped work without staging or committing.

## Workflow

1. Confirm the shaped plan from context or `yesh-plan`: files/symbols, boundaries, out-of-scope items, verification, and known risks. If contracts/state/API shape is missing, return to `yesh-plan` or `yesh-architect`; create a tiny local shape only for trivial patches.
2. Lock scope before edits: read `AGENTS.md`, current status/diff, target files, and relevant tests. Classify work as `preexisting`, `planned`, `agent-created`, or `out-of-scope`.
3. Inspect repo idioms before adding patterns: failures, boundary parsing, dependency seams, adapters/services, tests, observability, dependency catalogs, and actual SDK/API source.
4. Convert the plan into a task checklist and execute each decided task/chunk.
5. Implement in logical chunks. Preserve existing patterns and user changes.
6. Identify the right verification surface: unit, integration, harness, e2e, browser/runtime, typecheck, lint, build.
7. For app behavior, prefer an existing app-level AI/browser/e2e harness when it can exercise the same surface a human can: launch/open, authenticate with safe test state, click/type/navigate, inspect visible results, and change relevant user-tweakable settings/options.
8. If a harness/e2e exists for the changed behavior, use it. If the change needs one and none exists, add the smallest useful harness/test.
9. Run targeted verification.
10. Adversarial review gate: spawn read-only review subagents when available. Give them the plan, relevant prior diffs/context, current diff, verification output, and scope boundaries; ask for blockers, regressions, invariant breaks, missing tests, and scope drift.
11. Synthesize reviewer findings with your own diff review. Classify findings as `fixed`, `dismissed-with-reason`, `out-of-scope`, or `remaining-blocker`.
12. Fix in-scope blockers you introduced.
13. Second pass: rerun affected verification and re-review prior findings plus the diff touched since first review; avoid reopening architecture unless a correctness blocker invalidates the plan.
14. Update operational docs only when they are part of done-ness.
15. Stop before staging or commit unless explicitly asked.

## Correctness Gate

- Preserve local language/framework idioms and dependency systems.
- Keep expected failures explicit in the repo's normal style.
- Parse at boundaries and carry domain values internally.
- Do not bypass invariants with casts, unwraps, panics, blanket exceptions, dynamic escape hatches, or broad null checks unless justified at the boundary.
- Avoid shallow wrappers, dependency bags, and re-export-only files unless already established.
- If touching persistence, caches, streaming, workers, queues, retries, external calls, or shared mutable state, check idempotency, race windows, cancellation/timeouts, backpressure, stale reads, and source-of-truth drift.
- Verify through public interfaces and real seams. Avoid module mocks/spies unless the repo already relies on them.

## Output

```md
Changed
- path: change

Scope lock
- preexisting:
- planned:
- agent-created:
- out-of-scope:

Plan execution
- done:
- skipped:
- changed from plan:

Test / harness
- existing:
- added:
- not added:

Verified
- command/check: result

Review gate
- reviewers:
- fixed:
- dismissed with reason:
- out-of-scope:
- remaining blockers:

Notes
- ...
```

## Rules

- Do not commit.
- Do not stage unless explicitly asked. Never use broad `git add .` as part of ship.
- Do not add unrelated cleanup.
- Do not rewrite, format, clean, or normalize unknown dirty files.
- Do not invent architecture mid-ship. Hand missing public API, persistence/schema, adapter/service, error, or state contracts back to `yesh-plan` or `yesh-architect`.
- Treat review findings as work, not commentary; fix in-scope blockers before final.
- Prefer adversarial read-only reviewers over rubber-stamp review. If subagents are unavailable, perform the same blocker-first pass locally and say so.
- Reviewer prompts must include the plan, relevant previous diffs/context, current diff, verification output, and explicit out-of-scope boundaries.
- Triage vague/question-shaped review feedback before editing.
- Prefer existing test harnesses/e2e over inventing new ones.
- App-level harnesses should have human-parity access for the relevant flow: visible UI, input events, navigation, test accounts/data, logs/diagnostics, and user-configurable settings/options.
- Add new harness coverage only when behavior cannot be verified well by existing tests.
- Do not widen scope while fixing review findings.
- If verification cannot run, say why and give the remaining risk.
- Run `git diff --check` when a git worktree is available.
