# Simplicity

**Read when:** adding or reshaping code, choosing an abstraction, or comparing designs.

- Keep the main behavior easy to trace. Remove pass-through layers and duplicated decisions when they add no useful boundary.
- Reuse the owner of a concept. A new abstraction should remove a concrete source of branching, duplication, invalid state, or lifecycle risk.
- Subtract before adding: remove obsolete branches, duplicated decisions, and unnecessary layers in the changed path before building on them.
- Weigh reader load: count the layers between question and answer and the hidden state a reader must hold. Collapse wrappers with one caller; shrink mutable scope (locals before fields, fields before module state).
- Weigh the result for both its user and its next maintainer. Fewer lines alone do not prove a better design.

**Limits:** exploring candidate shapes is [exhaust-the-design-space](exhaust-the-design-space.md); repeated same-assumption failures are [attack-the-premise](attack-the-premise.md).