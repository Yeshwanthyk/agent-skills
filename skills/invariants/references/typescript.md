# TypeScript and Effect

## Property: fast-check

Use fast-check with the project's existing runner. Wrap synchronous properties in `fc.assert(fc.property(...))`; await `fc.assert(fc.asyncProperty(...))` for asynchronous targets. Specify a bounded `numRuns`; retain the reported seed and shrink path when reproducing a failure. Prefer `fc.commands` with model-based execution for operation sequences when an independent state model adds value.

For Effect, inspect the lockfile and the matching `@effect/vitest` API before writing tests. Effect v3 uses `Arbitrary.make(schema)` from `effect`; v4 uses `Schema.toArbitrary(schema)` and `FastCheck` from `effect/testing`. Keep package generations aligned. Generated schema values describe the decoded type; encoded representations and invalid inputs need their own generators. Run Effects through the project's test layer or runtime and control time where the property depends on it.

Sources: [fast-check](https://fast-check.dev/), [configuration](https://fast-check.dev/docs/configuration/), [Effect v3](https://effect.website/docs/v3/schema/arbitrary), [Effect v4](https://effect.website/docs/v4/schema/arbitrary).

## Fuzz: Jazzer.js

Use Jazzer.js for Node.js coverage-guided fuzzing. Follow the installed package's target signature and CLI, or its Jest integration when the project already uses Jest. TypeScript may need compilation or the documented loader; confirm instrumentation reaches the executed JavaScript, including the implementation module.

Use a byte-oriented target or a structured data provider appropriate to the boundary. Supply seed corpus inputs and explicit libFuzzer run limits through the documented CLI. Confirm async completion and error propagation if the target is asynchronous. Effect applications should isolate the boundary with a test layer or runtime. fast-check and Effect schema generators are not coverage-guided; they do not replace a fuzz target.

Source: [Jazzer.js documentation and examples](https://github.com/CodeIntelligenceTesting/jazzer.js).
