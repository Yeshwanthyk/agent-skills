# Ledger

Use `~/orchestrator.md` unless the user names another ledger. The ledger is owned only by the root orchestrator.

## Template

```md
# Orchestrator Ledger

Updated: YYYY-MM-DD HH:MM TZ

## Authorization
- monitoring:
- delegation:
- implementation:
- public mutation:
- destructive/irreversible:
- notes:

## Active
- id:
  worker:
  desired title:
  assignment:
  state:
  authorization:
  last verified:
  next intervention:

## Blocked
- id:
  worker:
  desired title:
  blocker:
  evidence:
  exact next permission/access/decision:

## Needs Owner
- id:
  worker:
  desired title:
  decision:
  recommendation:
  choices:

## Completed
- id:
  worker:
  desired title:
  result:
  proof:
  follow-up:

## Retired
- worker:
  final title:
  prior assignment:
  closeout:
```

## Rules

- Update the ledger before delegating new work and after meaningful state changes.
- Record owner decisions, worker creation, reassignment, blockers, completed work, and closeouts.
- Do not record secrets, credentials, private tokens, or raw sensitive data.
- Do not log routine polling.
- Keep identifiers stable. Use canonical URLs, file paths, immutable thread IDs, or explicit item names. Treat thread titles as display labels, not sole IDs, when an immutable ID exists.
- If a worker is idle or done, close it out by assigning the next authorized item, preparing an owner decision, or retiring it with a summary.
