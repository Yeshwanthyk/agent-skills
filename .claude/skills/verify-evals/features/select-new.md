# select-new

Pick only the newest eval cases and show whether they test the skills that changed.

## Behaviors

- **S1** Cases absent at the base are listed as `new`; cases whose fields differ are `changed`.
- **S2** Each changed skill or playbook is `ok` or `GAP` against the selected cases. A `yesh-router` change counts as covered by any router-activation run.
- **S3** Each changed reference file shows whether a selected case's `reads` checks it.
- **S4** A case expecting a user-invoked skill without router activation gets a WARN.

## User entry points

- `select_new.py` with the default base `HEAD` (uncommitted work).
- `select_new.py --base <ref>` (a committed range).
- `select_new.py --ids` (ids only, for scripting).

## Drive

```sh
python3 .claude/skills/verify-evals/scripts/select_new.py
python3 .claude/skills/verify-evals/scripts/select_new.py --base HEAD~1
python3 .claude/skills/verify-evals/scripts/select_new.py --ids
```

## Proof

The SELECTED ids match `git diff <base> -- eval/cases` plus untracked case files, and COVERAGE lists every skill directory in `git diff --name-only <base> -- skills` plus untracked files.

## Gotchas

- With no uncommitted work, the default base selects nothing. Pass the commit before the change.
- An edited prompt or expectation counts as `changed`, so a reworded old case is selected too.
- zsh does not word-split `$(...)` output, so `--only $ids` passes one id containing spaces and `run` selects nothing. Paste the printed RUN line, or in zsh use `--only ${=ids}`.
