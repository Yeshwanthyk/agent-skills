# Type System Discipline

The type checker is a proof assistant. Use it to eliminate impossible states, mismatched primitives, and unhandled variants at compile time. Prefer defining errors and special cases out of existence over adding handlers.

## Patterns

- Make illegal states unrepresentable. Use discriminated unions or the language's equivalent instead of optional-field bags with contradictory states.
- Build types from valid values. Use a non-empty list for an operation that needs one item. Do not rely on a runtime length check when the type can encode the shape.
- Brand semantic primitives. Do not let identifiers with different meanings share an interchangeable primitive type.
- Parse external data at each boundary. Treat RPC payloads, JSON, IPC, CLI args, config, environment values, database rows, and wire data as untyped until parsed.
- Refuse unsafe casts and coercions. Validate, narrow, or refine the model instead.
- Make matching exhaustive. The compiler must show the next location when a new variant is added.
- Derive types from authoritative schemas instead of hand-written duplicates.
- Strengthen a type where partiality appears. Keep plain types when every operation remains total.

## Tests

Ask whether two fields can express a meaningless combination. If yes, split the variants.

Ask whether two arguments share a primitive but mean different things. If yes, brand them.

Ask where each unsafe cast or null assertion came from. Move the proof to the boundary.

Ask whether a new variant will produce a compiler error at every required match. If not, make the match exhaustive.

Ask whether the type duplicates a schema owned elsewhere. If yes, derive it.

Ask whether added precision prevents a real failure. If not, keep the simpler type.
