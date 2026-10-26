# Parallel worktrees

Use this reference when work gives writers their own git worktrees: orchestrate units, swarm arms, parallel hillclimb hypotheses, and the cleanup after any of them. It applies when `cowt` is on `PATH`; `cowt status` in the repo shows whether the repo is set up. Without cowt, use `git worktree add` and the repository's own install conventions.

cowt makes a worktree cheap: `node_modules` and configured files arrive as copy-on-write clones in about a second, sharing disk with the main checkout until a file changes. Commands, config, and install are in [cowt](cowt.md).

## Create

- One worktree per writer. Create it with `cowt create --name <unit>`, which prints only the path; `--carry` brings the coordinator's uncommitted work along. A worktree that another tool made (T3's `workspaceStrategy`, plain `git worktree add`) in a repo set up with `cowt init` is already seeded.
- Give each worker its worktree path in the brief. The worker skips the dependency install unless its branch changes the lockfile.
- A worker that runs a dev server picks a free port with `--port` and stops the server before it reports done.

## Clean up

- The coordinator removes what the task created: `cowt remove` on each worktree, then `cowt gc` to free the disk. `cowt remove` refuses uncommitted changes without `-f` and keeps the branch. `cowt list` shows what exists.
- A worktree that T3 Code created is T3's to remove, so T3's records stay correct.
