# cowt features

Baseline: every recipe runs inside `scripts/proof.sh`, with scratch HOME and git config (see SKILL.md Launch). Run `scripts/doctor.sh` first. A recipe is driven with `proof.sh --only <PREFIX>`. Evidence goes to `${TMPDIR}verify-cowt-*/` and survives cleanup.

| Feature | IDs | Covers | Status |
| --- | --- | --- | --- |
| [Seed on any worktree add](seed.md) | SEED-1..8, REAL-1..2 | `git worktree add` from any tool clones node_modules and configured paths, then runs postcreate | built |
| [Create](create.md) | CREATE-1..5 | `cowt create` with `--name`, `--branch`, `--carry`; precreate gate | built |
| [List and status](list-status.md) | LIST-1, STATUS-1 | `cowt list`, `cowt status` | built |
| [Remove and gc](remove-gc.md) | REMOVE-1..3, GC-1 | `cowt remove` safety, trash, prune; `cowt gc` | built |
| [Init and uninit](init.md) | INIT-1..6 | trigger placement for default hooks, existing hooks and husky/vite-hooks; exact undo | built |

Not covered: `cowt shell-init` (it changes the interactive shell's cwd, which needs a PTY; parsing was checked by hand in zsh and bash), the Linux reflink path, and a worktree made by a live T3 Code thread (SEED-1 runs T3's exact git command instead).
