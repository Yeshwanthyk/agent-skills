# Shaping Decision Model

Use this reference whenever requirements, shapes, parts, alternatives, or fit checks are created or changed.

## Requirements (R)

Requirements describe outcomes, constraints, and decision criteria without naming a particular solution.

| Form | Meaning |
| --- | --- |
| `R0`, `R1`, `R2` | Top-level requirements |
| `R3.1`, `R3.2` | Requirements grouped beneath `R3` |

Use statuses that expose the current decision: `Core goal`, `Undecided`, `Leaning yes`, `Leaning no`, `Must-have`, `Nice-to-have`, or `Out`.

Keep at most nine top-level requirements. Beyond that, introduce meaningful parent requirements and move related detail beneath them. Each requirement must make sense without referring to a shape or fit-check cell.

```markdown
## Requirements

| ID | Requirement | Status |
| --- | --- | --- |
| R0 | Operators can find a record from the index | Core goal |
| R1 | A refresh preserves the active query | Must-have |
```

## Shapes (S)

A shape is a mutually exclusive solution approach. Its parts combine to implement that approach.

| Form | Meaning |
| --- | --- |
| `A`, `B`, `C` | Competing shapes; select one |
| `B1`, `B2` | Parts that combine within shape B |
| `B2-A`, `B2-B` | Competing mechanisms for part B2 |
| `CURRENT` | Reserved baseline for the live system |
| `Detail B` | A deeper view of B, not another option |

Give each shape a short mechanism-oriented title. Retain identifiers as options evolve; compose a later option by citing the earlier parts it keeps.

### Parts

A part says what will be built or changed and how it works. It carries data and behavior together rather than separating work into horizontal layers.

```markdown
## B: Query state in the URL

| Part | Mechanism | Flag |
| --- | --- | :---: |
| B1 | Index loader parses `?q=` and seeds the query store | |
| B2 | Search changes replace `?q=` before fetching results | |
| B3 | History restoration replays the loader path | ⚠️ |
```

Use `⚠️` when the desired effect is named but the mechanism is not yet supported by evidence. An unflagged part is a claim that the team knows how to implement it. Extract shared behavior into one part and have other parts reference it.

## Fit checks

The standard fit check is binary. A pass claims that a concrete, unflagged mechanism satisfies the requirement. A failure means the shape misses it or the mechanism remains unknown.

```markdown
## Fit Check

| Req | Requirement | Status | A | B |
| --- | --- | --- | :---: | :---: |
| R0 | Operators can find a record from the index | Core goal | ✅ | ✅ |
| R1 | A refresh preserves the active query | Must-have | ❌ | ✅ |

**Failures**
- A × R1: query state exists only in memory.
```

Rules:

- Include the complete requirement text and current status.
- Put only `✅` or `❌` in shape columns.
- Explain failures below the table; passing cells need no commentary.
- A flagged mechanism yields `❌` until evidence removes the flag.
- If every cell passes but the option still feels wrong, name the missing decision criterion as a new requirement and rerun the table.

For alternatives within one part, use the same table with columns such as `B2-A` and `B2-B`.

## Macro fit check

Use this only when the user explicitly asks for an early, high-level check of a large shape. Compare top-level requirements against one shape using:

- **Addressed:** `✅`, `⚠️`, or `❌` — whether the shape points toward the requirement.
- **Answered:** `✅` or `❌` — whether a concrete mechanism can be traced.

Keep gaps in a separate table tied to the relevant sub-requirements. A macro check supports exploration; it cannot justify selection.

## Selection gate

A shape is selectable when all must-haves pass, critical parts are unflagged, failures are accepted as `Out` or explicitly deferred, and the mechanism is concrete enough to breadboard. Selection records a decision; it does not erase rejected shapes or their identifiers.
