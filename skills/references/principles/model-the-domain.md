# Model the domain

**Read when:** writing stateful logic, or when code branches a lot or repeats a shape assumption across files.

- Encode the domain in a structure instead of scattering it across conditionals: a state machine instead of scattered booleans, a registry or discriminated union instead of branching spread across files, a module organized around one body of domain knowledge instead of an execution sequence.
- Model valid states and transitions where scattered flags hide lifecycle rules.
- Do not force an abstraction. Prefer boring code when the current shape is clear, local, and unlikely to grow; skip an abstraction that adds indirection without removing branches, duplicated rules, invalid states, or lifecycle risk.
- The tell that you skipped this: a feature grows an existing if/else chain by one more branch, or a second boolean must stay in sync with the first.

**Limits:** which types to use and where to parse are [type-system-discipline](type-system-discipline.md) and [boundary-discipline](boundary-discipline.md); who owns and changes values is [state-ownership](state-ownership.md).