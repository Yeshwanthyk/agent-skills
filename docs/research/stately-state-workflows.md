# What to borrow from Stately's state playbooks

Borrow the modeling and review prompts, not the stack. Keep contract-first charts as an independent oracle and the existing verification tools as the source of checker verdicts.

- **Documented:** [Stately README at `b9167d8`](https://github.com/statelyai/skills/blob/b9167d8/skills/stately/README.md) traces stateful diff leads to ordered source paths, models at least two callers where operations can overlap, and separates model verdicts from source findings and application replay. Its fix workflow holds bounds, rules, and payloads constant. **Adopted here:** add these prompts to `blast-radius` and formal modeling without installing Stately.

The upstream workflows were read, not executed. Whether a dedicated scanner or additional checker would surface findings the current tools miss remains open; test that on a real stateful change before adopting either.
