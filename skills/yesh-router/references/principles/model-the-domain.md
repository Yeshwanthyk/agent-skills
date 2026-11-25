# Model the domain

**Read when:** writing stateful logic, or when code branches a lot or repeats a shape assumption across files.

- Encode the domain in a structure instead of scattering it across conditionals: a state machine instead of scattered booleans, a registry or discriminated union instead of branching spread across files, a module organized around one body of domain knowledge instead of an execution sequence.
- Model valid states and transitions where scattered flags hide lifecycle rules.
- Use one status for mutually exclusive modes and a discriminated union when modes carry different data. Keep independent conditions independent. Name transitions after domain events; let transitions decide what changes and keep I/O at the boundary.
- Give each state its own case. Two states sharing one branch through `isX ? a : b` ternaries hide that they differ; a little duplication across separate cases reads better and changes safely.
- Do not force an abstraction. Prefer boring code when the current shape is clear, local, and unlikely to grow; skip an abstraction that adds indirection without removing branches, duplicated rules, invalid states, or lifecycle risk.
- The tell that you skipped this: a feature grows an existing if/else chain by one more branch, or a second boolean must stay in sync with the first.

**Limits:** which types to use and where to parse are [type-system-discipline](type-system-discipline.md) and [boundary-discipline](boundary-discipline.md); who owns and changes values is [state-ownership](state-ownership.md).