# Worktree and local build cleanup

Use this playbook to reclaim local disk from unused worktrees, stale simulator data, and build caches. Deletion is irreversible. A direct cleanup request authorizes only the confirmed safe set.

1. Record `df -h /`. List worktrees from `git worktree list`. Build a read-only audit that reports size, age, branch, merge state, uncommitted files, remote state, active PR state, and recent session evidence. Use the smallest rerunnable script that makes the audit reliable.
2. Cross-check every candidate against active sessions and pinned work. Treat an in-use or recently active worktree as held. Do not infer usage from age alone.
3. Show uncommitted tracked work before deletion. Hold every worktree with tracked changes. Name untracked scratch files before removing them.
4. Remove only clean, merged, abandoned, and unused worktrees. Use `git worktree remove` with the exact path returned by `git worktree list`. Run `git worktree prune` after the confirmed set is removed.
5. Inspect local simulator and build-cache usage only when the user included those targets. Delete only unavailable or explicitly disposable state. Keep evidence and user-owned data.
6. Record `df -h /` again. Re-list worktrees. Report what was removed and what remains held.

## Completion

The confirmed unused set is removed, every held item has a reason, and before-and-after disk usage and worktree listings are recorded.

**Reply:** disk usage before and after, reclaimed space, removed paths, held paths with reasons, and remaining cleanup candidates.
