---
name: orchestrator-core
description: Central orchestration for multi-worker or multi-thread work. Use when the user asks Codex to orchestrate, coordinate, monitor, manage workers, manage threads, keep worker thread titles accurate, keep a central ledger, run several workstreams, avoid duplicate/conflicting work, prepare owner decisions, or maintain progress across active tasks.
---

# Orchestrator Core

Own the control plane, not the implementation. Keep central truth current, delegate only with explicit authorization, monitor workers, and ask the owner only for prepared decisions.

## Core Model

Work item states:

```text
proposed -> assigned -> active -> blocked -> decision-ready -> completed -> archived
```

Worker states:

```text
idle -> assigned -> active -> blocked -> done -> retired
```

Orchestrator loop:

```text
intake -> ledger -> delegate -> monitor -> intervene/ask -> closeout -> report
```

## Start

1. Identify current role: root orchestrator or assigned worker. If this thread is a worker, do the assigned work only; do not create, steer, rename, archive, or ledger other workers.
2. Identify the current authorization: monitoring, delegation, implementation, public mutation, merge/close, release, or other irreversible action.
3. If delegation is not explicitly authorized, stop before creating workers and ask for that permission.
4. Create or read the persistent ledger. Default to `~/orchestrator.md` unless the user names another file.
5. Inventory current tasks, workers, threads, artifacts, and explicit owner decisions from the conversation and available tools.
6. Classify every item as `autonomous`, `needs owner`, `blocked`, `active`, `done`, or `out of scope`.
7. Delegate substantial investigation or implementation to workers only after the ledger has the item, scope, authorization, desired title, and expected proof.

## Root Ownership

- Only the root orchestrator creates, reuses, forks, assigns, renames, retires, or steers workers.
- Workers perform only their assigned work. They must not create subworkers, manage other threads, or edit the central ledger.
- Put the no-subdelegation rule and granted permissions in every worker prompt.
- Before creating or materially steering a worker, derive the item id, desired thread title, assignment, authorization boundary, and expected proof.
- Set or update the worker title with the current platform's thread-title tool when available. Prefer Codex/thread tools exposed in the session; use app-specific session APIs only when the owner explicitly names that app.
- Title format: `<Area>: <short current task>`. Area is repo, domain, or subsystem; task is 2-5 words. Avoid generic titles, stale source-thread titles, and tool/vendor names.
- If no title tool is available, include `desired thread title:` in the worker prompt and record/report `title unchanged: tool unavailable`.
- Keep one worker per coherent workstream. Reuse the existing worker for the same workstream when possible.
- Keep the coordinator lightweight. Do not do extended implementation in the root thread unless the user explicitly wants a single-thread execution.

## Monitoring

Before reading or steering workers, read [intervention-rules.md](references/intervention-rules.md).

Core rule: do not interrupt an active worker that has a coherent plan and is making progress.

Monitor on the cadence the user requested. If no cadence is specified, monitor only when reporting status, assigning new work, or resolving a blocker.

## Decisions

Do not ask the owner to decide from a vague status, raw artifact, or unprepared worker result. First prepare the item to the last authorized boundary.

Every owner decision brief must include:

- item identifier, worker, and current state;
- plain-language explanation of what changes and who benefits;
- why the decision is needed now;
- completed proof and missing proof;
- tradeoffs, residual risks, and scope concerns;
- orchestrator recommendation with rationale;
- exact choices and what each choice does.

## Permissions

- Monitoring does not authorize delegation.
- Delegation does not authorize implementation or mutations.
- Implementation authorizes local work and verification only unless the user also grants push, publish, merge, close, send, delete, release, or other public/destructive action.
- Public mutation permission does not imply follow-up repair permission.
- Release, publish, delete, archive, and other irreversible actions need current explicit authorization.
- When permission is missing, stop at the last authorized boundary and ask for the exact next permission.

## Persistent Ledger

Before creating or updating the ledger, read [ledger.md](references/ledger.md).

Append meaningful state changes, owner decisions, worker assignments, blockers, completions, and closeouts. Do not log routine polling. Never record secrets.

## Worker Contract

Before creating or materially steering a worker, read [worker-contract.md](references/worker-contract.md).

The root prompt must include the work item, scope, authorization, boundaries, expected proof, report format, and no-subdelegation rule.

## Reporting

Keep reports compact and stateful:

```md
Active
- area/item: worker, state, current phase, next intervention condition

Blocked
- area/item: exact blocker, last attempted proof, needed permission/access/decision

Needs owner
- item: prepared decision brief

Completed
- item: result, proof, follow-up

Ready next
- idle area: recommended next assignment or reason no work remains
```

Report meaningful changes, not routine polling. Use full canonical URLs or file paths when they exist; otherwise use stable worker/item names.
