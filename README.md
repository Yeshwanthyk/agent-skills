# Agent Skills

Use [`yesh-router`](./skills/yesh-router/SKILL.md) when you want one entry point to select methods and apply engineering principles. Every skill also works directly. The [method catalog](./skills/yesh-router/methods.md) covers the complete collection; its groups are navigation, not mandatory stages. `yesh-router` is the sole router activation name.

Delegation follows the portable [delegation contract](skills/references/delegation.md). Model and reasoning defaults are host preferences, kept in the host configuration template ([`config/AGENTS.md`](./config/AGENTS.md)) rather than the portable docs.

## Active skills

| Skill | What it does |
| --- | --- |
| [`architect`](./skills/architect) | Chooses a target architecture from live contracts, execution paths, state ownership, and constraints. |
| [`arena`](./skills/arena) | Runs complete competing candidates, cross-judges them, and grafts the best result into one verified artifact. |
| [`automate-me`](./skills/automate-me) | Turns repeated working preferences into a reviewed personal mode skill. |
| [`blast-radius`](./skills/blast-radius) | Finds what a change could break beyond grep and proves the main safety facts. |
| [`breadboarding`](./skills/breadboarding) | Maps operator workflows into UI, code, stores, and explicit control and data wiring. |
| [`bro`](./skills/bro) | Switches the conversation to short, plain, unambiguous English. |
| [`create-verification-skill`](./skills/create-verification-skill) | Creates and proves a project-local skill that drives one real application surface. |
| [`deep-dive-explainer`](./skills/deep-dive-explainer) | Researches mechanisms, evidence, alternatives, and limits, then renders a connected long-form article with a reusable offline layout. |
| [`debug`](./skills/debug) | Reproduces failures, finds the first contract divergence, and applies and proves the smallest coherent fix when requested. |
| [`figure-it-out`](./skills/figure-it-out) | Designs and runs an auditable custom workflow for a large task that has no focused playbook. |
| [`how`](./skills/how) | Explains current systems through execution paths, ownership, inventories, contrasts, and optional architecture critique. |
| [`interactive-slides`](./skills/interactive-slides) | Builds clean interactive HTML slide decks from documents and discussions, with a saved reference and stable controls. |
| [`interactive-explainer`](./skills/interactive-explainer) | Builds source-grounded interactive HTML models of behavior, state, sequences, and comparisons. |
| [`interrogate`](./skills/interrogate) | Runs independent adversarial reviews and returns one evidence-checked judgment. |
| [`maintain-verification-skill`](./skills/maintain-verification-skill) | Audits and repairs a project-local verification skill against current source and live behavior. |
| [`property-testing`](./skills/property-testing) | Generates contract tests, shrinks failures, and preserves replayable regressions. |
| [`fuzz-testing`](./skills/fuzz-testing) | Builds bounded coverage-guided fuzz targets and minimizes failures. |
| [`plan`](./skills/plan) | Turns a settled approach into an implementation-ready packet with chunks, dependencies, risks, and proof. |
| [`recall`](./skills/recall) | Reconstructs recent project work from sessions and current repository state. |
| [`reflect`](./skills/reflect) | Extracts reusable lessons from a session and applies only user-approved skill changes. |
| [`shaping`](./skills/shaping) | Negotiates requirements and competing solution shapes until one mechanism fits. |
| [`show-me`](./skills/show-me) | Explains a topic visually with diagrams, code-shape sketches, calldiff views, and focused HTML. |
| [`show-me-your-work`](./skills/show-me-your-work) | Keeps an auditable decision trail for long, unattended, or later-reviewed work. |
| [`stateful-systems`](./skills/stateful-systems) | Models authoritative state, transitions, invariants, concurrency, replay, and recovery. |
| [`swarm`](./skills/swarm) | Runs one bounded parallel coverage pass or solution race and synthesizes its evidence. |
| [`unslop`](./skills/unslop) | Cleans padded or AI-sounding prose without changing its facts or voice. |
| [`why`](./skills/why) | Investigates the evidence behind existing code and shipped technical, product, or operational decisions. |
| [`structure-review`](./skills/structure-review) | Audits implementation structure and proposes evidence-backed corrections. |
| [`yesh-router`](./skills/yesh-router) | Routes tasks across the collection and applies relevant engineering principles on explicit activation. |

Routing is opt-in and sticky. The router's [method catalog](./skills/yesh-router/methods.md) selects skills and playbooks; [orchestration](./skills/yesh-router/playbooks/orchestrate.md) owns dependent work and integration through the host harness’s subagent tools. PR work starts only on request. An optional [classifier contract](./skills/yesh-router/classifier-contract.md) may advise method selection; it is advisory and disabled by default.

Shared references live in [`skills/references/`](./skills/references): [engineering principles](./skills/references/principles), [delegation](./skills/references/delegation.md), and [session records](./skills/references/session-records.md). The router's [principle triggers](./skills/yesh-router/principle-triggers.md) map decisions to principle notes. Method-specific references, such as [review comment triage](./skills/interrogate/references/bugbot-triage.md), stay with their owning skill. Keep the shared reference folder alongside installed skills so relative references resolve; reading a reference does not activate the router.

## Using the collection

After installing the reviewed collection, name a skill directly or ask for the router with the outcome:

- `Use yesh-router to diagnose duplicate deliveries. Do not edit yet.`
- `Use yesh-router to implement this settled change and verify it.`
- `Use property-testing to check the retry invariants.`
- `Exit yesh-router.`

For each new task, the router first keeps a small settled task direct; otherwise it reads the method catalog, selects the matching target, and reads applicable principle notes through the trigger map. A mid-task question preserves the active objective unless the user replaces it. Ordinary methods may be selected from the requested outcome. Bro, reflection, mode authoring, and pausing require the corresponding explicit request. `Use skill "how"` requests `how`; a mere mention or a quoted source instruction does not.

Playbooks are linked Markdown instructions, not executable hooks. The retired `yesh-mode` name and path are unsupported; activate `yesh-router` explicitly. A repository edit alone does not update a separately installed copy. Validate the installed names, entrypoint contents, and linked references after synchronizing through the chosen skill manager. Keep installation verification separate from document validation and routing trials.

Run `python3 scripts/check-skill-routing.py` to check local links, catalog coverage of every skill and playbook, and the principle trigger map. This checks routing structure; representative agent trials are still needed to assess selection behavior.

## Acknowledgments

The owned `shaping` and `breadboarding` workflows draw on [Shape Up](https://basecamp.com/shapeup) and concepts explored by [rjs/shaping-skills](https://github.com/rjs/shaping-skills). Their skill text, structure, examples, and completion gates are original to this repository.

The router and the adapted playbook, principle, review, and verification workflows draw on the MIT-licensed [Cursor pstack plugin](https://github.com/cursor/plugins/tree/main/pstack). The portable instructions are harness-neutral; model preferences live in the host configuration. The upstream source and license remain at that repository.

The [forward implementation first principle](skills/references/principles/forward-implementation-first.md) draws on concepts from [Vuk97/forward-implementation-first](https://github.com/Vuk97/forward-implementation-first). The local policy preserves required integrity, concurrency, review, and authorization controls. Its optional [action-classifier contract](skills/references/action-classifier-contract.md) is separate from method routing and enables no live adapter.
