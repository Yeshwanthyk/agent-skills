# Simplicity

**Read when:** adding or reshaping code, choosing an abstraction, or comparing designs.

- Keep the main behavior easy to trace. Remove pass-through layers and duplicated decisions when they add no useful boundary.
- Do what the codebase already does. Before a new helper, file, factory, or pattern, find the nearest peer (a sibling file, an existing factory or helper, a recent merged PR in the area) and follow or reuse it. When the repo has no shared way, say so rather than inventing one.
- Build only what the ask needs: each new file, table, field, and public name maps to a line in the request. A smaller change that meets the ask beats a general one.
- Reuse the owner of a concept. A new abstraction should remove a concrete source of branching, duplication, invalid state, or lifecycle risk.
- Subtract before adding: remove obsolete branches, duplicated decisions, and unnecessary layers in the changed path before building on them.
- Weigh reader load: count the layers between question and answer and the hidden state a reader must hold. Collapse wrappers with one caller; shrink mutable scope (locals before fields, fields before module state).
- Weigh the result for both its user and its next maintainer. Fewer lines alone do not prove a better design.

**Limits:** exploring candidate shapes is [exhaust-the-design-space](exhaust-the-design-space.md); repeated same-assumption failures are [fix-root-causes](fix-root-causes.md).