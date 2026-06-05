---
name: yesh-show-work
description: Use for /show-work, "show me your work", realistic implementation reconstruction, session audit, reviewable decision trails, long-running or multi-agent work, and handoff summaries. Reads the session plus current implementation/diff, reports decisions, changes, verification, gaps, and drift from plan, and can maintain an append-only TSV decision log.
---

# Yesh Show Work

Reconstruct what actually happened. This is not another review pass and not a new plan. Read the session and current implementation, then produce a realistic account of the work.

For long-running, risky, multi-agent, or review-after-the-fact work, keep one canonical decision trail: a TSV log with one row per meaningful decision or checkpoint.

## Modes

- **Implementation recap**: default. Summarize actual changes, decisions, verification, and gaps from the session plus current diff/files.
- **Decision trail**: for long-running, multi-agent, risky, or shareable work. Write one row per meaningful decision/checkpoint with `scripts/log.sh`.
- **Handoff audit**: audit an existing decision trail against transcript/current diff and call out what deserves attention.

## Workflow

1. Read the current session context: user requests, pivots, subagent outputs, tool results, aborted turns, and explicit constraints.
2. Inspect the current implementation state: `git status`, relevant diff, changed files, generated artifacts, tests/logs if already run.
3. Compare intended plan vs actual implementation.
4. Report what happened, what changed, what was verified, and what is still uncertain.
5. For long/risky/multi-agent work, create or update a decision log:
   - copy `references/decision-log-template.tsv` to `decisions.tsv` or `.audit/<task-slug>.tsv`
   - append rows with `scripts/log.sh`
6. Audit any decision trail before handoff:
   - every row maps to a real action
   - evidence resolves and proves the row
   - pivots/reverts/blockers that shaped the work are logged
   - padding is removed
7. When a trail was produced and reviewer/subagent tools are available, run an independent trail check focused on weak evidence, skipped verification, risky choices, and gaps.
8. Do not invent rationale. If a decision is only implied by the implementation, label it as inferred.

## Output

```md
What happened
- ...

Current implementation
- path: actual change

Plan vs actual
- matched:
- drifted:

Decisions made
- decision: evidence

Verification
- ran:
- not run:

Evidence
- files:
- commands:
- subagents:

Attention
- reviewed by:
- flags:

Gaps / risks
- ...
```

## TSV Ledger

Use `scripts/log.sh` when a durable ledger is useful:

```bash
scripts/log.sh decisions.tsv <phase> <decision> <why> <evidence> <result>
```

Columns:

```txt
ts phase decision why evidence result
```

Keep rows single-line and evidence pointer-sized: file:line, command, commit, PR, screenshot, log, transcript moment, or artifact path.

Default location:
- `decisions.tsv` in the work dir for one active effort.
- `.audit/<task-slug>.tsv` when several efforts run at once.

The log is local by default. Commit it only when the work is ambitious enough that a reviewer needs the trail to trust the result.

## Composing With Other Skills

- `/how ... show work`: show what was inspected and how the explanation was derived.
- `/debug ... show work`: show sources searched, null results, root cause/rationale, and confidence.
- `/architect ... show work`: show the actual design decisions and where they came from.
- `/ship ... show work`: reconstruct implementation checkpoints, changed files, verification, and remaining gaps.
- `/commit ... show work`: show what was committed, why grouped that way, and verification tied to the commit.

## Rules

- Be descriptive, not performative. The user wants the realistic view of the work.
- Do not re-review the implementation unless the user asks; surface obvious gaps only.
- Prefer actual session/tool/diff evidence over polished narrative.
- Include things that went sideways if they affected the result.
- Log decisions and checkpoints, not every keystroke.
- One TSV row is one decision or checkpoint. If it does not fit on one line, the decision is not crisp yet.
- Keep decision logs append-only. A wrong call gets a new row that supersedes it.
- Evidence is a pointer, not prose: file:line, command, commit, PR, screenshot, log, transcript moment, or artifact path.
- Fix the log, not the story. If the work diverged from a row, the row is wrong.
- When a trail was produced, final output includes `Attention`; `No flags` is valid.
- Keep it concise enough that a teammate will actually read it.
