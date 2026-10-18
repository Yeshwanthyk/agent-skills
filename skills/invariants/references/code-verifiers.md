# Verifiers on the Code

These run on the production code itself, so no separate model can drift. They check memory safety, panics, overflow, and asserted invariants for every input up to a bound, or for every input when the code carries specifications. Check the installed CLI before using version-specific flags.

| Language | Tool | Shape | Reach |
| --- | --- | --- | --- |
| Rust | [Kani](https://model-checking.github.io/kani/) | `#[kani::proof]` harness, `kani::any()` inputs, `kani::assume` preconditions, `assert!` properties; `cargo kani --harness <name>` | Every input; loops up to `#[kani::unwind(N)]` |
| Rust | [Verus](https://github.com/verus-lang/verus) | `requires`/`ensures`/invariants on functions inside `verus!` | Every input, once proofs go through |
| C/C++ | [CBMC](https://www.cprover.org/cbmc/) | Harness with nondeterministic inputs; `cbmc harness.c --bounds-check --pointer-check --unwind N` | Every input up to the unwind bound |
| Any | [Dafny](https://dafny.org/) | Verified implementation compiled to the target language; `dafny verify` | Every input; the compiler is trusted |

## One harness, several engines

In Rust, [bolero](https://github.com/camshaft/bolero) runs one harness as a property test under `cargo test`, as a coverage-guided fuzz target under `cargo bolero test`, and as a Kani proof. Write the harness once against the real entry point, then report each engine's reach separately: sampled, coverage-guided, and every input up to the bound. Check bolero's docs for the current Kani wiring.

Elsewhere, keep the harness body a plain function from input to assertions, so the language's property and fuzz runners from the [invariants](../SKILL.md) step 3 references can call it too.

## Bounds

An unwind or input-size bound limits the claim. Raise it until the run covers the sizes the code meets in practice, or until the run stops being repeatable on every change, and report the final bound. Treat an unwinding-assertion failure as an incomplete run, not a pass.
