# Method catalog

Choose by the requested outcome, following the selection rules in the router policy. These sections are actual navigation groups, not execution stages. Read only the selected target; do not load every entry. A supporting method inherits the task's scope.

This catalog is authoritative for router method IDs and eligibility. Entry IDs are the method names exactly as written in the Method column; entries marked **explicit request** need the user to ask for that activity and are excluded otherwise. Classifier inputs are a projection of these entries, not a separate authority. Catalog version: v2 — increment it when method IDs, eligibility, or classifier-facing descriptions change.

## Understand and diagnose

| Use when | Method |
| --- | --- |
| Explain current code, execution paths, or registered surfaces | [how](../how/SKILL.md) |
| Explain the historical or operational reason a design or decision exists — not a failure to reproduce | [why](../why/SKILL.md) |
| Reproduce a failing or crashing behavior, diagnose its cause, and fix it when requested | [debug](../debug/SKILL.md) |
| Reconstruct prior work or resume from session evidence | [recall](../recall/SKILL.md) |
| Measure and correct a one-off performance problem | [perf-issue](playbooks/perf-issue.md) |
| Sustain measured improvement of one metric toward a target | [hillclimb](playbooks/hillclimb.md) |
| Diagnose a live runtime symptom without implementing a fix | [runtime-forensics](playbooks/runtime-forensics.md) |
| Diagnose an already captured profile or trace | [trace-forensics](playbooks/trace-forensics.md) |

## Shape and plan

| Use when | Method |
| --- | --- |
| Negotiate an unsettled problem and competing solution shapes | [shaping](../shaping/SKILL.md) |
| Settle a consequential architectural boundary from live contracts | [architect](../architect/SKILL.md) |
| Map UI/code actions, stores, and their wiring | [breadboarding](../breadboarding/SKILL.md) |
| Model authoritative state, transitions, concurrency, or recovery | [stateful-systems](../stateful-systems/SKILL.md) |
| Turn a settled approach into an execution plan | [plan](../plan/SKILL.md) |
| Resolve an empirical design question with a throwaway sketch | [prototype](playbooks/prototype.md) |

For an ordinary feature or refactoring with a settled shape, implement directly. Consult the [change-shape reference](../plan/references/change-shape.md) when behavior versus equivalence affects the work; this does not require a separate planning phase. A speculative plan is not a plan yet: settle the approach with shaping or architect first, then use plan.

## Review and verify

| Use when | Method |
| --- | --- |
| Review ownership, contracts, and maintainability | [structure-review](../structure-review/SKILL.md) |
| Investigate downstream consequences beyond the diff | [blast-radius](../blast-radius/SKILL.md) |
| Challenge a consequential design or change with independent reviewers | [interrogate](../interrogate/SKILL.md) |
| Check invariants across generated values or operation sequences | [property-testing](../property-testing/SKILL.md) |
| Explore parser or untrusted-input boundaries with coverage feedback | [fuzz-testing](../fuzz-testing/SKILL.md) |
| Create a reusable verifier for a real application surface | [create-verification-skill](../create-verification-skill/SKILL.md) |
| Audit or repair an existing application verification skill | [maintain-verification-skill](../maintain-verification-skill/SKILL.md) |
| Prove visual equivalence against a reference implementation | [visual-parity](playbooks/visual-parity.md) |
| Evaluate whether a skill or prompt change improves agent behavior | [eval](playbooks/eval.md) |

## Coordinate and continue

| Use when | Method |
| --- | --- |
| Substantial bespoke work needs a task-specific procedure | [figure-it-out](../figure-it-out/SKILL.md) |
| One bounded investigation benefits from parallel coverage or a solution race | [swarm](../swarm/SKILL.md) |
| Compare complete candidates and synthesize their best parts | [arena](../arena/SKILL.md) |
| Work needs an evidence-linked decision trail for later review | [show-me-your-work](../show-me-your-work/SKILL.md) |
| Drive one task until a stated result or limit | [autonomous-run](playbooks/autonomous-run.md) |
| Coordinate a continuing program, dependent units, or integration across owners | [orchestrate](playbooks/orchestrate.md) |
| User asks to stop and preserve a safe resume point — **explicit request** | [pause-safely](playbooks/pause-safely.md) |

## Explain and edit

| Use when | Method |
| --- | --- |
| A concise diagram or code sketch explains the current topic | [show-me](../show-me/SKILL.md) |
| Turn a document or discussion into an interactive browser slide deck | [interactive-slides](../interactive-slides/SKILL.md) |
| Build an interactive HTML model of behavior or state | [interactive-explainer](../interactive-explainer/SKILL.md) |
| Research and write a connected long-form HTML article | [deep-dive-explainer](../deep-dive-explainer/SKILL.md) |
| Clean padded prose while preserving facts and voice | [unslop](../unslop/SKILL.md) |
| Switch the conversation to Bro's plain-English style — **explicit request** | [bro](../bro/SKILL.md) |

## Improve the working method

| Use when | Method |
| --- | --- |
| Extract lessons from a session — **explicit request**, including a workflow that explicitly requests reflection | [reflect](../reflect/SKILL.md) |
| Create or update a personal mode from working preferences — **explicit request** | [automate-me](../automate-me/SKILL.md) |

For creating or editing skills, read the installed `writing-for-agents` skill and the current host's authoring skill. Resolve both through the runtime's skill catalog and read their actual entrypoints. These are external dependencies, not bundled methods; if unavailable, report the missing guidance and use the host's documented skill format. A request to edit a skill authorizes that edit, not installation or unrelated configuration changes.

Reflection and review produce findings unless edits are requested. Selecting a method does not install it, create a new skill, or authorize unrelated changes.