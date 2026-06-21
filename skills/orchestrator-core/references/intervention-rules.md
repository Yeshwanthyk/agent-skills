# Intervention Rules

Read this before polling or messaging workers.

## Before Any Worker Message

1. Read the worker's latest current state, newest local instructions, and active turn.
2. Classify the worker as `active`, `blocked`, `done`, `idle`, or `at risk`.
3. Compare the worker's actions with the owner authorization and ledger.
4. Send nothing when an active worker has a coherent plan and is making progress.

## Intervene Only When

- the worker asks for coordination or reports a blocker;
- the worker is done or idle and needs closeout or reassignment;
- repeated failures show no progress and a concrete correction is available;
- the worker is on the wrong item, wrong scope, or wrong boundary;
- the worker is about to perform unauthorized, destructive, public, or irreversible action;
- there is a security, privacy, data-loss, or credential-handling risk;
- the implementation has grossly diverged from the accepted task, not merely chosen a different reasonable design;
- two workers appear duplicated or conflicting, after reading both current states.

## Do Not Intervene For

- ordinary difficulty;
- a different reasonable design choice;
- stale assumptions that the worker is already correcting;
- a desire to restate the prompt;
- routine polling with no meaningful state change.

## Duplicate Workers

Before changing anything, read both workers.

- If neither has unique progress, pick one, retire the other, and log the closeout.
- If either has unique progress, leave both intact and ask the owner or merge context manually in the root thread.
- Never archive, replace, or rename a suspected duplicate without reading its latest state.

## Closeout

When a worker completes:

1. Verify the reported proof at the level authorized by the user.
2. Update the ledger.
3. Assign the next authorized item, prepare a decision brief, or retire the worker.
4. Report only meaningful changes to the owner.
