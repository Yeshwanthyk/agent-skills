# verify-evals features

Baseline: run from the repo root after `scripts/doctor.sh` passes. Runs need no shared state. Concurrent `skilleval run` invocations are safe, since each writes its own `eval/results/<timestamp>-…` directory and temp workspaces, but they share the harness account's rate limit.

Evidence lives in `eval/results/<run>/`, and nothing in cleanup removes it.

| Feature | Behavior |
| --- | --- |
| [select-new](select-new.md) | Pick the cases added or changed since a base ref, and flag coverage gaps against the changed skills |
| [run-new](run-new.md) | Run the selected cases under router and plain activation and read the graded result |

Doctor's `install` line is proven both ways: `ok` against the live lock, and `warn` with `GITGUD_LOCK` pointing at a copy pinned to an older commit.

Not covered: `view` (HTML pages), `compare` across two arbitrary runs, `--harness pi`. Each works through the same CLI, but none has been driven by this skill.
