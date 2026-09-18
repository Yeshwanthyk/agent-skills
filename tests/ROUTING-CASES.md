# Routing cases

`routing-cases.json` is a harness-neutral fixture set for comparing two routing
variants. It is input to a future behavioral evaluator; it is not a semantic
agent trial, a score, or evidence that a classifier works in production.

Each case has one `request` and one `context`. The same case must run against
both `baseline` and `revised`. Before applying that identical case input, the
harness selects the entrypoint declared by `comparison.variant_entrypoints`:
the historical baseline snapshot uses `yesh-mode/SKILL.md`, while the revised
collection uses `yesh-router/SKILL.md`. Entrypoint selection is evaluator setup,
not request rewriting or an alias. The retired baseline path need not exist in
the revised checkout, and revised expectations must not load or name it.

The expected observations for each variant must cover:

- `loaded_files`: files the router actually opened, with `equals`, `contains`,
  and/or `excludes` assertions;
- `actions`: observable actions such as selecting a method, reading a playbook,
  editing, delegating, or transmitting bounded context; and
- `scope`: the active objective, write authority, explicit-only boundary, and
  permission state that the run preserved.

A method label is not enough evidence. The fixture requires the three
observations above for both variants. `compare.same_input` protects the
baseline/revised comparison from changing the task between runs. Classifier
faults are represented as data in the fixture; no credentials, live adapter, or
external transmission is required to consume it.

Paths in `loaded_files` and `variant_entrypoints` are relative to the `skills/`
catalog root. A harness may add its own run metadata, but it should preserve the
case id, selected variant entrypoint, and identical request, and record
incomplete or failed runs rather than treating them as passes.
