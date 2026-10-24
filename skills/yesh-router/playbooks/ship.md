# Ship

Use to take finished work to where it runs: commit, PR, merge, deploy, install, clean up. Each verb the user says authorizes that step only. "Ship" alone authorizes commit, push, and PR: the reviewable result. Merge and deploy are outward-facing, so ask before each one the user did not name, including one a named step depends on. Pushed is not shipped: work is shipped when the surface the user runs has it.

1. **Scope.** List the stops the request names (commit, PR, merge, pull the latest default branch, each deploy target, cleanup) and put them on the Plan line. Use the repository's documented ship path. When the request names a stop the repository has no path for, say so instead of inventing one.
2. **Gate.** Run the repository's own checks (tests, types, lint) on the exact tree you will commit. A red check stops the ship; fix it under the method that fits, or report it.
3. **Commit.** Stage only the task's changes; leave unrelated edits, plan files, and scratch output out unless the user asked to clean them up. Commit on a branch; commit to the default branch only when the user says so.
4. **PR.** When a PR is in scope, follow the [visual PR workflow](../../show-me/references/visual-pr.md). Reuse the branch's open PR rather than opening a second.
5. **Merge.** Wait for required checks, merge with the repository's method, then update the local default branch so it has the merged commit.
6. **Deploy or install.** Run the documented command once per named target, from the merged commit. Record what each target now runs (version, commit, or lock entry).
7. **Verify.** Read [prove-it-works](../references/principles/prove-it-works.md). On each target's real surface, show it runs the merged commit: a health or version endpoint, the live URL, or the installed lock matching `HEAD`. A green deploy log is not this proof.
8. **Clean up.** Remove the worktrees, branches, sessions, and temporary state this task created ([state-ownership](../references/principles/state-ownership.md)); name each one removed and leave everything else.

Done when every stop in scope is verified on its target. Report one line per stop: what shipped, where, and the evidence; name any stop skipped and why.
