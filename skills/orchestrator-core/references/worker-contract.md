# Worker Contract

Read this before creating, reusing, or materially steering a worker.

## Required Worker Prompt

```md
You are a repository/task worker, not the orchestrator.

Assignment:
- item:
- desired thread title:
- goal:
- scope:
- explicit authorization:
- out of scope:
- inputs/artifacts:
- expected proof:
- report back with:

Rules:
- Do not create subworkers, delegate, rename threads, archive threads, or manage other workers.
- Do not rename yourself. If the title is wrong or stale, report `title mismatch` to the orchestrator.
- Do not edit the central orchestrator ledger.
- Stay in this workstream unless the orchestrator reassigns you.
- Stop at the authorization boundary and report the exact next permission needed.
- If blocked, report the blocker, evidence, attempted fixes, and smallest next action.
- If complete, report result, proof, residual risks, and any follow-up.
```

## Assignment Rules

- Give each worker one coherent workstream.
- Prefer reusing an existing worker for the same workstream.
- Include all current owner constraints that affect the worker.
- Include permission boundaries explicitly. Do not rely on implied permission.
- Include the desired thread title in every initial worker prompt so title intent survives create/fork/tool failure.
- Set the title in the same create/fork call if supported; otherwise call the thread-title tool immediately after creation when available.
- Use platform-neutral Codex/thread management tools exposed in the current session. Use app-specific session APIs only when the owner explicitly asks for that app.
- Include the proof standard for the task: tests, live check, source citation, screenshot, build artifact, review, or other concrete evidence.
- If a worker will touch files, repos, services, accounts, or public artifacts, name the exact allowed boundary.

## Steering Rules

- Before sending any worker message, read its latest state.
- Do not restate the assignment when the worker is active and coherent.
- Send the smallest useful message: unblock, correct risk, assign next item, or ask one clarifying question.
- Do not raise the proof bar mid-flight unless the owner changed the requirement or a real risk emerged.
- When changing assignment, update the ledger, derive a new desired title, and rename the worker when possible. If not possible, record/report `title unchanged: tool unavailable`.
