---
name: correct
description: On request, find mistakes agents keep repeating in a repo and make each one impossible through architecture, types, checks, or tests before docs.
---

# Correct

The user keeps correcting agents in this repo for the same mistakes. Change the repo so the next agent cannot make them.

Assume every contributor is an agent that sees only the files it opened, copies the nearest example, and takes the shortest path that compiles. A change that looks right from one file should be right for the whole repo.

## Find the mistake classes

Read recent commits, reverts, fix-ups, review comments, the repo's agent instruction files (`AGENTS.md`, `CLAUDE.md`, or equivalent), and comments that explain workarounds. Use [`recall`](../recall/SKILL.md) when past sessions hold corrections that never reached git. Group the mistakes into classes. A class counts once it has happened twice; cite each occurrence.

## Fix each class at the highest level that works

1. **Architecture.** Give each piece of state one owner and each task one supported way. Hide internals so the wrong import fails. Replace hand-synced lists with one source of truth. Delete old ways and dead code an agent would copy. Use [`architect`](../architect/SKILL.md) when the target shape is unsettled.
2. **Types.** Make the bad state unrepresentable. If bad code still compiles, add a lint or CI check whose error names the file, type, or function to use instead. If the pattern is already common, fail only when a change adds more.
3. **Tests.** Test the behavior. Fix or delete any test that would still pass if every function it calls returned nothing.
4. **Docs or agent rules last**, only for judgment calls. Nothing fails when an agent skips them.

The [encode-lessons-in-structure principle](../yesh-router/references/principles/encode-lessons-in-structure.md) explains the ordering.

## Fix and prove

Unless the user asked for findings only, fix the most frequent classes now, one commit each. Prove each new check fails on a real past mistake: reapply the old code or a minimal copy of it and show the red output. Run the same command locally and in CI. Exceptions go on the offending line with a reason, an expiry date, and a human's approval.

## Keep the rule table

Keep a table in the repo's agent instruction file that pairs each rule with what enforces it. When the user corrects you, fix the mistake and add the rule. If the rule was already there and nothing enforces it, that is a repeat: fix it at the highest level in the same change. Drop a rule once its mistake cannot happen.

## Completion

Done when each class has its evidence, the level chosen and why a higher level did not work, a check proven red on a past mistake (or a stated reason it stays a judgment rule), and an updated rule table. Report those per class, plus the classes found but not fixed.
