# Multi-phase or multi-PR plan

Use this playbook when work spans phases, dependent changes, or a stack. This playbook writes the plan. It does not implement the work.

1. Skip the plan when one or two files have an obvious approach. Say why and stop.
2. Settle empirical questions with `prototype` before writing the plan. Ask the user only about product or preference decisions that evidence cannot settle.
3. Explore the repository and the relevant canonical skills. Record paths, contracts, conventions, entry points, dependencies, and proof commands. Keep bulk reading out of the main context when delegation earns its cost.
4. Define one unit per phase or PR. Put structural prerequisites before behavior. Give each unit one owner, one write boundary, one dependency list, and one proof boundary.
5. Write the plan as a how-to. For each unit include `Depends on`, `Files`, `Build`, `You see`, `Verify`, `Review gate`, and `Delivery`. Drop empty sections only when the plan format permits it.
6. Make verification real. Name the unit check, live path, side effects, and performance measure when performance matters. Use the repository's UI, CLI, API, or simulator verifier. Tests alone do not prove user-facing behavior.
7. Name the execution playbook. Use `autopilot-full` for independent authorized PRs, `autopilot-stack` for a reviewed linear stack, and `orchestrate` for a continuing program.
8. Apply `writing-for-agents` and `unslop`. Check links, paths, commands, sentence structure, and counts. Use an available structural checker when one exists.
9. Hand back the plan. Execution starts only when the user authorizes it.

## Completion

Every phase has an owner, dependency, files, proof, delivery state, and risk. The plan has resolved links and a passing structural check.

**Reply:** plan path, ordered units, dependencies, review-gated units, prototype evidence, unresolved decisions, and checker output.
