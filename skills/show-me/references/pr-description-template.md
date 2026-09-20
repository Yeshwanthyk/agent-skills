# PR body template

Replace placeholders and remove guidance before publication. Retain the repository's required structure when it differs. Optional related links belong above the first section; omit that line when none are known.

## Purpose

[One sentence identifying the problem and the outcome enabled by this change.]

## Reviewer notes

- [One to three caveats about rollout, compatibility, migrations, intentional gaps, or non-obvious decisions; otherwise `None.`]

## Implementation map

[Brief explanation beside a structural visual showing what changes. Choose the relevant schema, contract, type, component, responsibility, or execution view.]

```diff
 [essential existing context]
-[previous structure or behavior]
+[replacement structure or behavior]
```

[For predominantly new structures, use a complete language-tagged block or a text tree instead. Add a second view only for distinct information. Omit categories that do not help explain this PR. Prefer these formats over Mermaid; include Mermaid only after verifying its actual GitHub rendering under the visual PR workflow.]

## Checks

- [Executed check and observed result.]
- [Relevant unexecuted check and why, when applicable.]
