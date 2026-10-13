# Code-quality lens

Apply this lens in addition to the rubric where relevant.

- Look for a structural simplification that removes branches, wrappers, modes, or layers while preserving behavior.
- Treat ad hoc conditionals and special cases in shared flows as design strain. Prefer the canonical owner or a dedicated state model when the evidence supports it.
- Prefer direct, boring code over magic, identity wrappers, pass-through helpers, and generic machinery that hides simple data shapes.
- Push important invariants into explicit types and boundary parsing. Question unnecessary optionality, `unknown`, `any`, and cast-heavy contracts.
- Keep logic in the module that owns the concept. Reuse canonical helpers instead of creating a parallel path.
- Flag non-atomic updates and needless sequential orchestration when a clearer safe structure exists.
- Treat a file crossing a local size limit or a branch gaining spaghetti as a structural signal, not a cosmetic complaint. With no local limit, a change that pushes a file from under 1,000 lines to over 1,000 needs a strong structural reason; otherwise ask whether to decompose first.

Correct behavior is not enough for approval. Treat these as presumptive blockers unless the author justifies them: incidental complexity a simpler structure would delete, a file pushed past 1,000 lines, ad hoc branching that tangles an existing flow, feature checks scattered across shared code, an unnecessary abstraction, wrapper, or cast-heavy contract, and a duplicated helper or logic placed outside its clear canonical home. Name a structural problem as structural rather than softening it into a suggestion.

Be ambitious only when the evidence shows a real consequence. Do not demand abstraction or decomposition for its own sake. Return a few high-confidence findings rather than a long style list.
