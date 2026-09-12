# Types and boundaries

Use when changing data contracts, parsing external input, or representing domain states.

- Parse untrusted values into domain types at the boundary. Persisted rows and messages crossing process boundaries need validation too.
- Derive types from the authoritative schema when available. Use variants or stronger types when they prevent a real invalid combination or identifier mix-up.
- Keep validation near the boundary that establishes the guarantee. Internal values can rely on that guarantee only while its lifetime and ownership remain valid.
- Prefer narrowing and explicit conversion to assertions that bypass a missing proof. Make handling of domain variants exhaustive where the language supports it.
- Keep transport and storage details behind a domain boundary when that reduces coupling. Do not add an adapter solely to follow a layering rule.

In review, identify the invalid state or input that reaches an operation without the required guarantee.
