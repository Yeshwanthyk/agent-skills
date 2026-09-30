# Type system discipline

**Read when:** representing domain states, choosing types, or where assertions, casts, or repeated null checks appear.

- Derive types from the authoritative schema when available (protobuf, OpenAPI, migrations, token files). Manual duplication drifts.
- Use variants or stronger types when they prevent a real invalid combination or identifier mix-up; make illegal states unrepresentable.
- Use types as construction APIs, not only restrictions: expose validated constructors or factories that return a domain value or typed error, and keep raw fields private when callers could otherwise bypass the invariant.
- Prefer narrowing and explicit conversion to assertions that bypass a missing proof.
- Make handling of domain variants exhaustive where the language supports it; a new variant should fail loudly at every site that must handle it.
- An assertion, null check, or "this should never happen" throw marks a place where a type is too weak. Push that check up into the type — then stop; extra precision costs reuse and ceremony and buys no safety.
- Brand semantic primitives: identifiers that mean different things must not be interchangeable.

**Limits:** where parsing and validation sit is [boundary-discipline](boundary-discipline.md); the structure that encodes the domain is [model-the-domain](model-the-domain.md).