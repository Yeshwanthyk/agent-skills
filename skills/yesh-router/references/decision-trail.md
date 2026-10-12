# Decision trail

The one decision-log contract. Use when a long-running, unattended, or later-reviewed run needs a compact record a reviewer can follow without replaying the session. Playbooks link here instead of defining their own log format.

## Create

Use one TSV file. Copy [decision-log-template.tsv](decision-trail/decision-log-template.tsv) to `decisions.tsv` in the work directory, or to `.audit/<task-slug>.tsv` when several efforts share a directory. Keep the trail local and out of git unless the reviewer needs a committed record.

The six columns are `ts`, `phase`, `decision`, `why`, `evidence`, `result`. Each cell is one line, and evidence is a pointer (path, command, commit, URL), not a paragraph. Append rows with [log.sh](decision-trail/log.sh):

```
log.sh <logfile> <phase> <decision> <why> <evidence> <result>
```

It creates the header if missing, stamps UTC time, flattens tabs and newlines, and prefixes cells starting with `=`, `+`, `-`, or `@` so spreadsheets read them as text.

## Log

One row per decision or checkpoint:

- a fork chosen;
- a unit completed, with its proof;
- a pivot or revert, with its trigger;
- a blocker or gate fixed;
- one row per iteration when a loop matters: `phase` = iteration id, `why` = hypothesis, `decision` = the change, `evidence` = metric before and after plus the gate result, `result` = kept or reverted.

Trivial actions stay out. The trail is append-only: when a decision changes, add a row.

## Resume from it

When a later run picks up from the trail, read [evidence-lifecycle](principles/evidence-lifecycle.md) and check its last rows against live state before building on them. When the reader is a new agent without the working context, also read [handoffs](principles/handoffs.md).

## Audit

At the end of the run, check every row against the current session and repository:

1. Locate the active project session through the [session-records contract](session-records.md). When the session cannot be read, use that contract's fallback and state the limit.
2. Confirm every row maps to a real action.
3. Resolve every evidence pointer and check that it proves the row; mark unresolved ones.
4. Add a row for any fork, pivot, or abandoned approach that shaped the result.
5. Append corrections for inaccurate rows, preserving the originals.

## Independent review

For consequential or later-reviewed work, request a read-only reviewer through the [delegation contract](delegation.md) when available. Give it the trail, the relevant session, and the scope; ask it to flag weak evidence, skipped verification, risky choices, and gaps. When no independent reviewer is available, report that; self-review is self-review. Report the reviewer's flags or its absence.

The trail is complete when the file exists, every material decision or checkpoint has one truthful row, each evidence pointer resolves or is marked unresolved, and the audit ran against the current session and repository.
