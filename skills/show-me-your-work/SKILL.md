---
name: show-me-your-work
description: Keep an evidence-linked decision trail for work that needs later review.
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

1. Load the shared [session-records contract](../yesh-mode/references/session-records.md) and locate the active project session.
2. Confirm that every row maps to a real action.
3. Resolve every evidence pointer and check that it proves the row.
4. Add a row for any fork, pivot, or abandoned approach that shaped the result.
5. Append corrections for inaccurate rows, preserving the original trail.

If the session cannot be read, use the fallback and evidence limits in the shared session-records contract.

## Independent review

For consequential or later-reviewed work, use the shared [agent-routing contract](../yesh-mode/references/agent-routing.md) to request a read-only reviewer when available. Give it the trail, relevant session, and scope; ask it to flag weak evidence, skipped verification, risky choices, and gaps.

If the harness cannot provide an independent reviewer, report that limitation. Do not describe self-review as independent review. The reviewer remains read-only.

Report any independent review and its flags or unavailability when one was requested.

## Completion

The trail is complete when its file exists, every material decision or checkpoint has one truthful row, each evidence pointer resolves or is marked unresolved, and the trail was checked against the current session and repository. If independent review was requested, record its result or absence. Keep the trail local unless the user authorizes publication or a reviewer needs it committed.

Other skills should link here instead of copying the TSV format or audit rules.
