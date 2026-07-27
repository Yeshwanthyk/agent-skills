# Agent Skills

| Skill | What it does |
| --- | --- |
| [`interactive-system-explainer`](./skills/interactive-system-explainer) | Builds source-grounded, self-contained HTML explainers for system behavior, state, sequences, and comparisons. |
| [`review-annotate`](./skills/review-annotate) | Opens the previous assistant response or supported local documents/folders in a bundled read-only annotation workspace. Invoke as `/skill:review-annotate last` or `/skill:review-annotate <path>`; a bare `/review-annotate` shim is not included. |
| [`review-diff`](./skills/review-diff) | Opens current worktree changes, a historical revision/range, or a supplied PR/MR in a bundled local diff annotation workspace. |
| [`stateful-systems`](./skills/stateful-systems) | Models authoritative state, lifecycle transitions, invariants, concurrency, freshness, replay, and recovery. |
| [`yesh-architect`](./skills/yesh-architect) | Designs a target architecture from the system’s current contracts, execution paths, state ownership, and constraints. |
| [`yesh-debug`](./skills/yesh-debug) | Reproduces failures, follows the failing path to the first contract divergence, and verifies the smallest coherent fix. |
| [`yesh-how`](./skills/yesh-how) | Maps how a system works through execution paths, state ownership, boundaries, contracts, and source evidence. |
| [`yesh-plan`](./skills/yesh-plan) | Turns a settled approach into an implementation-ready plan with concrete files, symbols, dependencies, risks, and verification. |
| [`yesh-structure-review`](./skills/yesh-structure-review) | Audits an implementation’s structure and proposes evidence-backed corrections. |
