# Checkout: grade the verifier, not the demo

Keep this file, the reference browser driver, and mutation sources out of the generation workspace. Use the same prompt for both skill revisions. Run generation against the default (good) app only; no fixture paths, fault names, rubric, previous answers, or reference outputs in the prompt. Staging is context isolation, not a security sandbox: run untrusted generated code in a disposable environment without credentials or access to this repository.

## Blind generation

From `eval/`, pin a pre-change skills revision and use the **same runner, fixture, model and harness** for both trials. `--activation plain` alone is not a baseline: it still installs the current skills.

```sh
base=ca9030c89bdb1e65053fa501f1a8a61510d64497
old=$(mktemp -d)
git -C .. archive "$base" skills | tar -x -C "$old"
python3 -m skilleval run --only checkout-create --skills "$old/skills" --keep-ws --label checkout-base
python3 -m skilleval run --only checkout-create --keep-ws --label checkout-head
```

Use the `workspace` field of each trial's `result.json`. Do not repair its output or let the author see a replay and try again. Missing artifact or entrypoint after completed generation is a verifier failure; missing CLI/browser/auth or a trial that never ran is unavailable, not a score. Record the base and fixture revisions, harness/model, skills hash, run IDs, and any deviations. Repeat independently before drawing conclusions about either skill revision.

## Frozen replay

```sh
python3 fixtures/checkout/replay.py "$workspace" results/checkout-base-replay
# Repeat with the head trial workspace and a new output directory.
```

The evaluator snapshots only the generated skill, records SHA-256 per file, then executes identical bytes from the same relative path on three freshly staged apps. The variant name is passed to fixture setup only. The generated script owns launch, browser, DB, evidence and cleanup; it must not need prior state. Save the logs and manifest before removing the kept trial workspaces. Nonzero from the replay runner means the expected exit pattern was not observed or replay could not complete. Zero is **not** a quality score.

| App | Browser and independent storage observations required | Verdict |
| --- | --- | --- |
| Good | First submit loses its confirmation after commit; retry the same order in the browser; reload retains that order's receipt; one payment for that order | Pass |
| Duplicate | Same recovery and matching receipt after reload, but independently observed extra payment for that order | Product defect: ledger only |
| Stale | One payment, successful retry, but after actual browser reload the receipt no longer matches the submitted order | Product defect: reload only |

Inspect scripts and logs, not just exit codes. Credit only an actual browser submit/retry/reload plus a read of durable storage tied to the observed order. Require the failing observation, expected vs actual, and enough output to distinguish the other passing check. A launch error, generic timeout, source inspection, API-only substitute, comparing fixture identities, or unconditional failure does not detect a product defect. A handwritten reference drive validates the fixture; never substitute its matrix for a missing agent run.
