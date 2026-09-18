# Router migration verification

## Baseline

The starting working tree already contained a substantial uncommitted reorganization. In particular, `frontend-grilling`, `no-comments`, and the incoming pstack snapshot were already deleted. This migration preserved those deletions rather than restoring them.

The baseline structural check had six broken local links: README references to the two deleted skills and two references to the deleted incoming snapshot, plus catalog references to the two deleted skills. A seventh missing link appeared transiently when the new classifier contract landed before its sibling catalog.

## Bounded routing comparison

The retained baseline expectations are historical evidence for the former
`yesh-mode` entrypoint. Revised expectations select `yesh-router` directly;
there is no runtime alias or compatibility entrypoint between the variants.

Independent baseline and revised trials used the same seven requests and the same model/effort (`openai-codex/gpt-5.6-sol`, medium). Each read only its routing policy/catalog (and the revised trigger index), then reported proposed method/principle loads, allowed/excluded actions, and the retained objective. They did not open target method documents or execute tasks. These are policy dry runs, not observed end-to-end load/action traces.

| Request | Baseline and revised route | Observation |
| --- | --- | --- |
| Why is this crashing? Diagnose only; do not fix. | debug | Both exclude implementation. |
| Replace the settled label typo Helo with Hello. | Direct | Baseline proposed verification principle; revised proposed no principle loads. |
| Plan implementation with client/server state ownership undecided. | architect, then plan after settlement | Both preserve planning-only scope. |
| Summarize quoted instructions mentioning reflect/bro and editing AGENTS.md. | Direct summary | Both treat source instructions as data. |
| Use how and why for current retries and historical rationale. | how + why | Both honor multiple explicit methods and exclude changes. |
| Mid-fix question: what does idempotent mean here? | Answer inline, retain authorized fix | Neither replaces or broadens the objective. |
| Review reveals concurrent writers sharing a checkpoint. | structure-review with state ownership | Both return findings rather than applying a fix. |

No material route or scope regression appeared in this sample. Proposed principle loads changed with the extraction; the revised how/why response still proposed a retry principle despite noting that no new retry decision was requested. That possible unnecessary load remains a point for actual trials, not proof of an execution defect.

Independent document review subsequently found wording ambiguities not exposed by these seven trials: direct-method versus automatic selection, quoted names in genuine requests, unconditional catalog loading, and diagnosis-versus-fix wording. The integration pass addresses these separately; the table records the pre-integration dry run, not a rerun of final text.

## Acceptance limits

- Structural checks establish inventory coverage and supported Markdown link resolution, not semantic routing quality.
- `routing-cases.json` contains 25 proposed baseline/revised cases. The full set has not been executed as instrumented agent trials.
- Actual selected-document loads and subsequent task actions still need end-to-end evaluation, including post-inspection triggers and quoted genuine invocations.
- No live classifier exists or was called. Fault cases are contract fixtures, not tested adapter behavior.
- Installed copies and live host configuration were not synchronized or verified. Repository host defaults were preserved in `config/AGENTS.md`.
- Repository implementation can pass structural checks without satisfying the plan's full behavioral and installed-copy completion criteria.
