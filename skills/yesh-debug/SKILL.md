---
name: yesh-debug
description: Use for /debug, understanding or debugging what is happening, "why did this happen", screenshots, logs, stack traces, failing tests, "not working", runtime symptoms, regressions, root cause, design rationale, and historical behavior. Gathers evidence, separates facts from inference, names the causal chain or rationale, affected files/state, minimal fix path, and verification target.
---

# Yesh Debug

Understand or debug what is happening from evidence, then offer or perform the minimal fix path when appropriate.

## Workflow

1. Choose the investigation mode from the ask: symptom/bug, regression, rationale/history, runtime/live state, or failing test.
2. Anchor the question exactly: screenshot text, log line, stack frame, failing command, browser state, runtime state, target files/symbols, commit/PR/ticket hints.
3. Gather relevant evidence across code, tests, git history, docs/ADRs/specs, issues, chat, logs/metrics/traces, error tracking, or analytics. Treat null results as evidence.
4. Reproduce first when possible, or trace the closest evidence-backed path from trigger to observed behavior.
5. Identify the boundary where expected and actual behavior diverge, or where the historical/design rationale is recorded.
6. Separate direct evidence from inference.
7. Ask "why" until the fix belongs at the cause, not the crash site.
8. Check for the pattern, not just the instance: sibling call sites, repeated invariants, and similar state paths.
9. Name the smallest causal chain or rationale and the affected files/state.
10. If the user asked for a fix, patch the minimal surface and verify. If the fix is plan-sized, hand off to `yesh-plan` or `yesh-ship`.

## Root-cause discipline

- Reproduce first when possible. If reproduction is impossible, explain the closest traceable evidence and verification gap.
- Ask "why" until the fix belongs at the cause, not the crash site.
- Resist guard-only fixes, nil checks, retries, and fallbacks that only silence the symptom.
- Check for the pattern, not just the instance; grep for sibling call sites and repeated invariants.
- When stuck, instrument or inspect real state. Do not guess.
- For restart bugs, suspect state before code: config, caches, lock files, serialized state, persisted sessions.
- If clearing state restores behavior, prefer state validation, migration, or reconciliation over telling the user to clear it manually.

## Output

```md
Question / symptom
- ...

Mode
- symptom | regression | rationale | runtime | failing test

Evidence
- direct:
- searched but not found:

Current behavior
- ...

Root cause / rationale
- ...

Causal chain
1. ...

Affected files / state
- path: symbol/state

Pattern check
- sibling instances:
- repeated invariant:

State check
- persistent state inspected:
- restart/cache/config risk:

Fix path
- minimal:
- defer to ship:

Verification
- command/check:
- result:

Confidence / gaps
- ...
```

## Rules

- Do not start with broad refactors.
- Use screenshots as evidence, but verify with code/runtime when possible.
- If live state matters, compose with `yesh-status`.
- Prefer citations, file paths, commit hashes, PRs, log lines, screenshots, and tool output.
- If the record is thin, say so plainly.
- Distinguish direct evidence from inference when intent is unclear.
- For bugs, focus on the smallest causal chain that explains the symptom.
- Do not paper over crashes with guard-only fixes unless the guard belongs at the boundary and preserves the invariant.
- For rationale/history, do not turn code mechanics into intent without supporting evidence.
