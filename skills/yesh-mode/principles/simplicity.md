# Simplicity

Use when choosing an abstraction, reshaping code, or comparing designs.

- Keep the main behavior easy to trace. Remove pass-through layers and duplicated decisions when they add no useful boundary.
- Reuse the owner of a concept. A new abstraction should remove a concrete source of branching, duplication, invalid state, or lifecycle risk.
- Design for the requested behavior and known callers. Compare alternatives when an unresolved choice matters; a fixed number of prototypes is not required.
- Preserve deliberate compatibility and unrelated behavior. Remove an old internal API once its callers have migrated and no external contract needs it.
- Weigh the result for both its user and its next maintainer. Fewer lines alone do not prove a better design.

In review, name the indirection, duplicated decision, or maintenance cost that a proposed simplification removes. Leave clear local code alone.
