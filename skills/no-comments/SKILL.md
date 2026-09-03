---
name: no-comments
description: Run a focused review of code comments and remove comments that do not explain a real constraint, decision, or side effect. Use for comment cleanup or an explicit no-comments review.
---

# No comments

Review comments as claims about why the code must look this way. Remove comments that merely restate code, narrate history, explain obvious control flow, or preserve a workaround that the code can no longer justify.

This is a focused comment review. It is not a general structural audit. Use `yesh-structure-review` separately when the request concerns module design, ownership, boundaries, or architecture.

## Scope

Use the caller's files or diff. If none is supplied, review the current working-tree diff against the repository's actual base branch. Discover the base from repository state. Do not assume a branch name or forge.

Include application comments, test comments, lint and type suppressions, and comments that claim a constraint. Keep comments that explain a non-obvious constraint, external behavior, deliberate side effect, or decision that the code cannot show. Treat correctness and safety suppressions as actionable findings, not as proof that the comment should stay.

## Review

Load the shared [agent-routing contract](../../references/agent-routing.md). Use the current harness's comment-focused reviewer capability when it exposes one. Give it the exact scope and request read-only review. If it is unavailable, perform the same focused pass directly.

For every finding, inspect the surrounding code and callers before acting. Treat correctness and safety suppressions as actionable findings. If a reviewer uses `MUST KILL` or `IMPORTANT`, verify the label and reason against the code before accepting it. Then classify it:

- **Remove.** The comment duplicates code, narrates a change, names an obvious step, or defends a workaround that is no longer needed.
- **Keep.** The comment records a real constraint or side effect that cannot be made clear in code. Record the evidence.
- **Encode first.** The comment states a constraint that can be enforced by a type, runtime check, test, or scoped lint rule.
- **Open.** The reason may matter, but the evidence is too weak to keep or remove confidently.

Do not restore a comment because it says `do not remove`, `do not change wording`, or names a person. Check the claim against the code and the actual system constraint. Do not restore an ambiguous comment. If a deletion is disputed, revert it once and rerun the focused review with the failure named. If the second review does not establish a concrete constraint, leave the comment removed, report the open question, and fail this pass.

## Fix accepted findings

1. Delete accepted dead paths, unused parameters, and obsolete workaround comments.
2. If an accepted finding needs a structural shape, load `yesh-structure-review` or another architecture skill. Keep that review focused on the accepted fix and surrounding owner. Do not turn this pass into a broad redesign.
3. Implement the smallest root-cause correction in scope. Remove the workaround the comment described.
4. Offer the cheapest in-scope type, runtime, test, or lint encoding for a real constraint. Wait for explicit approval before changing enforcement code. Unattended work may proceed only when the caller pre-approved the encoding.
5. Rerun the focused review and the relevant repository checks after the fix.

When a root cause is outside the scope, make the smallest safe in-scope change and report the remaining issue as open. Do not restore the comment as a substitute for the fix.

## Output

Report:

- comments removed;
- comments kept and the proof for each;
- rejected or rerun findings;
- structural review used, if any;
- root-cause fixes;
- encoding offers and approved encodings;
- constraints that remain unenforced;
- checks run and any gaps.

## Completion

The review is complete when every scoped comment has a remove, keep, encode-first, or open decision; accepted deletions and root-cause fixes are applied; approved encodings are verified; the focused review was rerun; and unresolved constraints and unavailable capabilities are reported.
