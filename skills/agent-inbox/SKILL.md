---
name: agent-inbox
description: Track work projects in an Obsidian vault on request. Capture an item, log a session, catch up on a project, triage the inbox, record a correction, or audit the mistake checks.
disable-model-invocation: true
argument-hint: "capture | log | catch-up | triage | record | audit [project]"
---

# Agent inbox

A chief-of-staff ledger for work projects. Load it when the user names agent-inbox or the vault, or when yesh-router sends a correction to **Record**. Write only for the action asked for; project actions write only about a project.

## Open the vault

Run `scripts/ensure-vault.sh <project-slug>` from this skill's folder (omit the slug for triage). It creates the vault at `$AGENT_INBOX` or `~/agent-inbox`, its folders, `AGENTS.md`, a git repo, and the project's `overview.md`, `decisions.md`, and `sessions/` when missing, and never overwrites a file. It prints the vault path. Then read the vault's `AGENTS.md`: its write rules and note shapes govern every step below.

Resolve the project first. Use the slug the user named, or match the current repo or thread against `projects/`. When neither settles it, ask. An item that belongs to no work project is not filed.

## Actions

Run the one the user asked for.

### Capture

"file this", "add to the inbox for X". Write one new `inbox/YYYY-MM-DD-<slug>.md` per item in the inbox shape. Done when each item exists with `project`, `kind`, and `source` filled.

### Log

"log this session", "write this up for X". Write `projects/<p>/sessions/YYYY-MM-DD-<slug>.md` from this thread: what was done, decided, left open, and next, each line grounded in the thread. Append the daily line to `daily/YYYY-MM-DD.md`, creating the file if needed. A decision made here also goes to `inbox/` as `kind: decision`, so triage can promote it. Done when the session note and the daily line both exist.

### Catch up

"catch me up on X", "where was I on X". Read-only. Read `overview.md`, `decisions.md`, the newest three to five session notes, and inbox items for the project. Reply with where it stands, recent decisions, open items, and the next step, citing each note by path. Done when every claim cites a note, and gaps (no overview yet, no sessions) are named.

### Triage

"triage the inbox", "clean up X". Read `inbox/` and sessions newer than each project's last overview change. Propose moves as a list, one line each: item → target (`overview.md` section, `decisions.md` entry, or delete), with the text to write. Wait for the user's go, per item or all. Apply only approved moves: edit the target, then delete the moved inbox file. Skipped items stay. Done when every approved move is applied and every remaining inbox file was either skipped or left unproposed by name.

### Record

yesh, a reviewer or cubic corrects something the agent did. Runs without being asked.
1. Name it: reuse an existing check name from `mistakes.md`, `repos/<repo>/slop-gate.md` or `candidates.md` when one fits; otherwise coin a short kebab-case name for what to look for.
2. Append a row to `candidates.md`: date, name, repo (or `any`), the short quote, source link.
3. When that name has 4 rows across at least 2 sessions and no entry yet, promote it: one line, `- **name**: <check>`, in `repos/<repo>/slop-gate.md` when it names one repo's code, else under **Replies** or **Code** in `mistakes.md`. A name already in one file never goes in the other.

Done when the row exists, and any promotion is one line in one file.

### Audit

"audit the mistakes", "squash the gate". Read `mistakes.md`, each `repos/*/slop-gate.md`, `candidates.md` and the gate logs; search evidence with `qmd search "<words>" -c agent-inbox` (run `qmd update` first). Propose one line each, then wait for the user's go:
- **merge**: two entries checking the same thing become one name;
- **move**: an entry naming one repo's code goes to that repo's gate;
- **retire**: an entry with no sightings or gate-log rows since the last audit, unless the user keeps it;
- **sharpen**: a check that can't be judged pass or fail gets a concrete test.

Apply approved changes, keeping each check in one place, and leave evidence rows untouched. Done when every proposal is applied or declined by name and the commit message lists each change.

## Finish

Commit in the vault: `git -C <vault> add -A && git -C <vault> commit -m "<action>: <project> <slug>"`. Reply with the paths written, or for catch-up the brief.
