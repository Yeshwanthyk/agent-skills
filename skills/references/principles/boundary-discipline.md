# Boundary discipline

**Read when:** changing data contracts, parsing external input, or organizing validation and error handling.

- Parse untrusted values into domain types at the boundary. Persisted rows and messages crossing process boundaries need validation too.
- Keep validation near the boundary that establishes the guarantee. Internal values can rely on that guarantee only while its lifetime and ownership remain valid.
- Keep transport and storage details behind a domain boundary when that reduces coupling. Expose domain concepts, not the boundary's private representation.
- Prefer compact pure business logic behind a thin framework, transport, or storage shell when that makes rules independently testable. Keep logic inline when extraction would only wrap a trivial operation or hide lifecycle and context the framework owns.
- Do not add an adapter solely to follow a layering rule.

**Limits:** the types to choose once at the boundary are [type-system-discipline](type-system-discipline.md); how domain state is owned is [state-ownership](state-ownership.md).