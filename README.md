# Agent Skills

## Active skills

| Skill | What it does |
| --- | --- |
| [`architect`](./skills/architect) | Chooses a target architecture from live contracts, execution paths, state ownership, and constraints. |
| [`arena`](./skills/arena) | Runs complete competing candidates, cross-judges them, and grafts the best result into one verified artifact. |
| [`automate-me`](./skills/automate-me) | Turns repeated working preferences into a reviewed personal mode skill. |
| [`blast-radius`](./skills/blast-radius) | Finds what a change could break beyond grep and proves the main safety facts. |
| [`breadboarding`](./skills/breadboarding) | Maps operator workflows into UI, code, stores, and explicit control and data wiring. |
| [`bro`](./skills/bro) | Switches the conversation to short, plain, unambiguous English. |
| [`create-verification-skill`](./skills/create-verification-skill) | Creates and proves a project-local Pi skill that drives one real application surface. |
| [`debug`](./skills/debug) | Reproduces failures, finds the first contract divergence, applies the smallest coherent fix, and proves it. |
| [`figure-it-out`](./skills/figure-it-out) | Designs and runs an auditable custom workflow for a large task that has no focused playbook. |
| [`frontend-grilling`](./skills/frontend-grilling) | Resolves frontend design choices through concrete prototypes and focused verdicts. |
| [`how`](./skills/how) | Explains current systems through execution paths, ownership, inventories, contrasts, and optional architecture critique. |
| [`interactive-explainer`](./skills/interactive-explainer) | Builds source-grounded interactive HTML models of behavior, state, sequences, and comparisons. |
| [`interrogate`](./skills/interrogate) | Runs independent adversarial reviews and returns one evidence-checked judgment. |
| [`maintain-verification-skill`](./skills/maintain-verification-skill) | Audits and repairs a project-local verification skill against current source and live behavior. |
| [`no-comments`](./skills/no-comments) | Removes comments that do not record a real constraint, decision, or side effect. |
| [`plan`](./skills/plan) | Turns a settled approach into an implementation-ready packet with chunks, dependencies, risks, and proof. |
| [`poteto-mode`](./skills/poteto-mode) | Activates an explicit sticky router with 23 playbooks and 21 internal principles. |
| [`recall`](./skills/recall) | Reconstructs recent project work from sessions and current repository state. |
| [`reflect`](./skills/reflect) | Extracts reusable lessons from a session and applies only user-approved skill changes. |
| [`shaping`](./skills/shaping) | Negotiates requirements and competing solution shapes until one mechanism fits. |
| [`show-me`](./skills/show-me) | Explains a topic visually with diagrams, code-shape sketches, calldiff views, and focused HTML. |
| [`show-me-your-work`](./skills/show-me-your-work) | Keeps an auditable decision trail for long, unattended, or later-reviewed work. |
| [`stateful-systems`](./skills/stateful-systems) | Models authoritative state, transitions, invariants, concurrency, replay, and recovery. |
| [`swarm`](./skills/swarm) | Runs one bounded parallel coverage pass or solution race and synthesizes its evidence. |
| [`unslop`](./skills/unslop) | Cleans padded or AI-sounding prose without changing its facts or voice. |
| [`why`](./skills/why) | Investigates the evidence behind existing code and shipped technical, product, or operational decisions. |
| [`yesh-structure-review`](./skills/yesh-structure-review) | Audits implementation structure and proposes evidence-backed corrections. |

Poteto Mode is opt-in and sticky. Its orchestration procedure lives only in [`playbooks/orchestrate.md`](./skills/poteto-mode/playbooks/orchestrate.md). All delegation follows the shared [`agent-routing` contract](./skills/poteto-mode/references/agent-routing.md).

## Source snapshot

[`incoming/pstack`](./incoming/pstack) is the pinned, unmodified research snapshot. It is not an active skill directory. Provider-specific or excluded source skills remain there for comparison, including `make-bot-ui`, `setup-pstack`, `tdd`, `teach`, `technical-writing`, and `typescript-best-practices`.

## Acknowledgments

The owned `shaping` and `breadboarding` workflows draw on [Shape Up](https://basecamp.com/shapeup) and concepts explored by [rjs/shaping-skills](https://github.com/rjs/shaping-skills). Their skill text, structure, examples, and completion gates are original to this repository.

The adapted Poteto, playbook, principle, review, and verification workflows preserve useful behavior from the MIT-licensed [Cursor pstack plugin](https://github.com/cursor/plugins/tree/main/pstack). Runtime, provider, and model coupling was removed for Pi and other managed agent runtimes. The pinned source and license are retained under [`incoming/pstack`](./incoming/pstack).
