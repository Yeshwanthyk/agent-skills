# Worktree and build cleanup

Use for a request to reclaim space from named worktrees or local build state. An audit-only request produces candidates without deletion.

List exact worktree paths and inspect changes, merge state, active use, and remote or PR dependencies where relevant. Age alone does not establish that a worktree is unused. Preserve dirty, pinned, active, and uncertain candidates.

A cleanup request covers only confirmed disposable targets within its scope. Remove eligible worktrees with the repository's worktree command using inspected paths. Avoid force removal; unexpected changes require a fresh decision.

Inspect caches or simulator data only when included in the request. Separate regenerable files from user data and retained evidence. Prefer recoverable deletion where supported.

Re-list targets and report removed paths, recovery limits, held items, and reclaimed space. Use disk measurements on the relevant volume when claiming space savings.
