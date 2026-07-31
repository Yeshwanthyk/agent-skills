# Agent Skills

| Skill | What it does |
| --- | --- |
| [`breadboarding`](./skills/breadboarding) | Maps operator workflows into Places, UI and code affordances, stores, and explicit control/data wiring, then slices complete boards into demonstrable increments. |
| [`codex-orchestrator`](./skills/codex-orchestrator) | Coordinates agents on substantial work with focused delegation, distinct ownership, and user-held approvals. |
| [`interactive-system-explainer`](./skills/interactive-system-explainer) | Builds source-grounded, self-contained HTML explainers for system behavior, state, sequences, and comparisons. |
| [`review-annotate`](./skills/review-annotate) | Opens the previous assistant response or supported local documents/folders in a bundled read-only annotation workspace. Invoke as `/skill:review-annotate last` or `/skill:review-annotate <path>`; a bare `/review-annotate` shim is not included. |
| [`review-diff`](./skills/review-diff) | Opens current worktree changes, a historical revision/range, or a supplied PR/MR in a bundled local diff annotation workspace. |
| [`shaping`](./skills/shaping) | Negotiates requirements and competing solution shapes, checks fit, resolves unknowns, and selects a mechanism concrete enough to breadboard. |
| [`stateful-systems`](./skills/stateful-systems) | Models authoritative state, lifecycle transitions, invariants, concurrency, freshness, replay, and recovery. |
| [`yesh-architect`](./skills/yesh-architect) | Designs a target architecture from the system’s current contracts, execution paths, state ownership, and constraints. |
| [`yesh-debug`](./skills/yesh-debug) | Reproduces failures, follows the failing path to the first contract divergence, and verifies the smallest coherent fix. |
| [`yesh-how`](./skills/yesh-how) | Maps how a system works through execution paths, state ownership, boundaries, contracts, and source evidence. |
| [`yesh-plan`](./skills/yesh-plan) | Turns a settled approach into an implementation-ready plan with concrete files, symbols, dependencies, risks, and verification. |
| [`yesh-structure-review`](./skills/yesh-structure-review) | Audits an implementation’s structure and proposes evidence-backed corrections. |

## Acknowledgments

The owned `shaping` and `breadboarding` workflows draw on [Shape Up](https://basecamp.com/shapeup) and the concepts explored by [rjs/shaping-skills](https://github.com/rjs/shaping-skills). Their skill text, structure, examples, and completion gates are original to this repository.
