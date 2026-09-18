# TypeScript and Effect

Use fast-check with the project's existing runner. Wrap synchronous properties in `fc.assert(fc.property(...))`; await `fc.assert(fc.asyncProperty(...))` for asynchronous targets. Specify a bounded `numRuns`; retain reported seed and shrink path when reproducing a failure. Prefer `fc.commands` with model-based execution for operation sequences when an independent state model adds value.

For Effect, inspect the lockfile and matching `@effect/vitest` API before writing tests. Effect v3 uses `Arbitrary.make(schema)` from `effect`; v4 uses `Schema.toArbitrary(schema)` and `FastCheck` from `effect/testing`. Keep package generations aligned. Generated schema values describe the decoded type; encoded representations and invalid inputs need their own generators. Run Effects through the project's test layer/runtime and control time where the property depends on it.

Sources: [fast-check](https://fast-check.dev/), [configuration](https://fast-check.dev/docs/configuration/), [Effect v3](https://effect.website/docs/v3/schema/arbitrary), [Effect v4](https://effect.website/docs/v4/schema/arbitrary).
