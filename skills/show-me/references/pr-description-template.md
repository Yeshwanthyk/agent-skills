# PR body template

Replace placeholders and remove guidance before publication. Retain the repository's required structure when it differs. Optional related links belong above the first section; omit that line when none are known.

## Purpose

[One sentence identifying the problem and the outcome enabled by this change.]

## Reviewer notes

- [One to three caveats about rollout, compatibility, migrations, intentional gaps, or non-obvious decisions; otherwise `None.`]

**Door:** [One-way or two-way: whether a revert fully undoes the merge. Name what makes it one-way, such as a migration, deleted data, a published contract, or an external side effect.]
**Blast radius:** [Who or what breaks if this is wrong: consumers, jobs, data, layout, platforms. Name the boundary, not a severity adjective.]

## Implementation map

[Brief explanation beside a structural visual showing what changes. Choose the relevant schema, contract, type, component, responsibility, or execution view.]

```diff
 [essential existing context]
-[previous structure or behavior]
+[replacement structure or behavior]
```

[For predominantly new structures, use a complete language-tagged block or a text tree instead. Add a second view only for distinct information. Omit categories that do not help explain this PR. Never use Mermaid or another diagram language; GitHub shows text views only.]

## Checks

- **Before:** [Observed behavior on the base: a failing test, error output, or a screenshot for a visual change.]
  **After:** [The same observation on this branch.]
- [Other executed checks and observed results.]
- [Relevant unexecuted check and why, when applicable.]
