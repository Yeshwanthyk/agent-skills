# Architectural critique rubric

Use only the lenses that fit the subsystem. Ground every finding in the implementation and its likely evolution.

## Abstraction fit

- Does each abstraction represent a real concept and earn its indirection?
- Are boundaries where responsibilities change independently?
- Is business logic entangled with framework wiring or accidental implementation details?
- Is the design over-abstracted as well as under-abstracted?

## Data model

- Do types and structures fit the actual access and mutation patterns?
- Are there repeated reshapes or bags of optional fields that signal a boundary mismatch?
- Does the model represent runtime truth honestly?

## Boundary discipline

- Is validation concentrated at entry points?
- Do errors cross layers in a stable shape, with retries and fallbacks owned deliberately?
- Are inputs and outputs typed enough to test the subsystem in isolation?
- Are state and side-effect authorities clear at each boundary?

## Evolution readiness

- How much would the most plausible next requirement change?
- Which assumptions are hard-coded, and which paths are legacy without a live caller?
- Is the feature integrated into existing patterns or bolted on?

## Complexity versus value

- Is complexity spent on real invariants or accidental wiring?
- Are simpler designs available without losing required behavior?
- Are any components vestigial?

## Consistency

- Does the subsystem follow established patterns for similar concerns?
- If it differs, is the reason visible in the code and useful?
- Is unexplained inconsistency creating a maintenance boundary?
