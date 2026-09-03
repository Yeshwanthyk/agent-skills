---
name: show-me-your-work
description: Keep an auditable decision trail for long-running, unattended, multi-phase, or later-reviewed work. Use for explicit decision-log requests and work whose proof must be checked after the run.
---

# Show me your work

Keep one compact decision trail so a reviewer can reconstruct choices, evidence, and results without replaying the session.

## Create the trail

Use one TSV file. Copy `references/decision-log-template.tsv` to `decisions.tsv` in the work directory, or use `.audit/<task-slug>.tsv` when several efforts share a directory. Keep the default trail local and out of git unless the reviewer needs a committed record.

The columns are `ts`, `phase`, `decision`, `why`, `evidence`, and `result`. Cells stay on one line. Evidence is a pointer, not a paragraph. Use `scripts/log.sh` to append rows safely. It stamps UTC time, strips tabs and newlines, and protects spreadsheet cells that begin with `=`, `+`, `-`, or `@`.

Log decisions and checkpoints:

- a fork chosen;
- a unit completed with its proof;
- a pivot or revert and its trigger;
- a blocker or gate fixed;
- one row per loop iteration when a loop matters.

Skip trivial actions. Append a new row when a decision changes. Never rewrite history.

## Audit the trail

At the end of the run, compare every row with the current session and repository:

1. Load the shared [session-records contract](../poteto-mode/references/session-records.md) and locate the active project session.
2. Confirm that every row maps to a real action.
3. Resolve every evidence pointer and check that it proves the row.
4. Add a row for any fork, pivot, or abandoned approach that shaped the result.
5. Remove padding and correct rows that no longer describe the work.

If the session cannot be read, use the fallback and evidence limits in the shared session-records contract.

## Independent review

Before handing back a trail, load the shared [agent-routing contract](../poteto-mode/references/agent-routing.md) and request a read-only reviewer when available. Select a reviewer from a different model family than the worker that produced the trail when the harness exposes model-family choice. Give it the trail, the relevant session, and the scope. Ask it to flag weak evidence, skipped verification, risky choices, and gaps.

If the harness cannot provide an independent reviewer or model-family distinction, report that limitation. Do not describe self-review as independent review. Never let the reviewer modify files or external state.

Every response for a run with a trail ends with an `Attention` section. Put the reviewer's model family on its own line when known, then list each flag. `No flags` is valid. If review was unavailable, say so.

## Completion

The trail is complete when its file exists, every material decision or checkpoint has one truthful row, each evidence pointer resolves or is marked unresolved, the trail was checked against the current session and repository, and independent review ran or its absence is reported. Keep the trail local unless the user authorizes publication or a reviewer needs it committed.

Other skills should link here instead of copying the TSV format or audit rules.
