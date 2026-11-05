---
name: untangle
description: Refactor a codebase or area end to end so what changes together sits together, nothing is tied without reason, and special cases fold into the design.
disable-model-invocation: true
argument-hint: "[optional area or concern to focus on]"
---

# Untangle

Refactor the codebase, or the area the user names, and finish the job. One question drives every step: **should these pieces change together?**

This skill changes code. For findings only, use [structure-review](../structure-review/SKILL.md). If the target shape for a boundary is still open, settle it with [architect](../architect/SKILL.md) before you fix it.

## 1. Ask

Ask with the question tool (`AskUserQuestion` or the host's equivalent) which extras to include. Do only the ones chosen:

- **Comments:** remove comments that only restate the code.
- **Tests:** remove tests that wouldn't catch a real bug, and fix the ones that fail without one.

## 2. List every problem

Change nothing yet. Write each problem with its `file:line` into `untangle-log.md` at the repo root, using the shape in [decision-log.md](references/decision-log.md). The log keeps the work intact through compaction. Each problem is one of three kinds:

- **Hidden links:** pieces that must change together, but the code doesn't show it. Examples: copied logic or values; a module that reads a global or file another module sets; one feature spread across layer folders; a call order callers just have to know.
- **Needless links:** pieces tied together that change for different reasons. Examples: callers that reach into internals; stable code importing more volatile code; a general function with a parameter only one caller understands; a shallow module whose interface moves with its internals.
- **Surplus:** pieces with no reason of their own to change. Examples: pass-through wrappers; extension points or config for things that never vary; dead code.

Also log every **special case**: an `if` for one value, a parameter for one caller, a swallowed exception, a retry or sleep, a disabled test. Each one marks a requirement the design never accounted for.

Git history is evidence. Files that change together in commits (`git log --name-only`) point to hidden links. A script that prints what imports what shows needless links; rerun it as you go. On a large codebase, strip function bodies to a skeleton, or have read-only subagents summarize parts, so the whole thing fits in context.

## 3. Redesign from first principles

Design the fixes as if today's requirements had been known from the start ([redesign-from-first-principles](../yesh-router/references/principles/redesign-from-first-principles.md)). Look for the one fix behind several problems; it often looks nothing like them. Don't patch special cases one by one.

Test every fix, even one that looks cleaner, against three rules: pieces that change together end up together, pieces that don't aren't tied, and everything depends on what changes less. Write each fix above the problems it solves in the log.

If a fix needs more than about three commits, or sets an order between them, write a [plan](../plan/SKILL.md) first.

## 4. Fix everything on the list

Fix one item per commit, and run the checks after each. Remove the special cases the redesign makes unnecessary, and keep the ones the system still needs. Don't go hunting for bugs separately; note any bug a structural fix removes.

If the user chose **Comments**:
- Remove comments that restate the implementation (`// sort first so the binary search works`), even when they're phrased as a why.
- Keep comments about something outside the code (`// the proxy drops websockets, so we poll`).
- Remove workaround comments (`// wait 100ms because the cache isn't ready`) along with the workaround, once the redesign removes the cause.

If the user chose **Tests**, do them last, because tests are the safety net for everything above ([test-behavior](../yesh-router/references/principles/test-behavior.md)):
- Remove tests that repeat the implementation, and tests that can't fail.
- Rewrite tests tied to internals so they check behavior.

## 5. Check, and repeat

Have read-only subagents search fresh for hidden links, needless links, surplus and special cases. Pick their models from [routing.md](../yesh-router/references/routing.md). Four or more children need the user's approval first ([delegation](../yesh-router/references/delegation.md)). Fix what they confirm, then search again. Stop when a pass turns up nothing worth fixing.

You're done when all of these hold:
- As few special cases are left as possible. The count is the best measure of progress; report it before and after.
- A typical change lands in one place.
- No import points to something more volatile than the importer.
- Behavior matches the start, apart from bugs the refactor fixed. Prove it with the tests and one real run at the end ([prove-it-works](../yesh-router/references/principles/prove-it-works.md)).

Report the special-case count before and after, the fixes made, and anything you left for a reason.
