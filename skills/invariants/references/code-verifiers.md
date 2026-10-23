# Verifiers on the Code

These run on the production code itself, so no separate model can drift. They check memory safety, panics, overflow, and asserted invariants for every input up to a bound, or for every input when the code carries specifications. Check the installed CLI before using version-specific flags.

| Language | Tool | Shape | Reach |
| --- | --- | --- | --- |
| Rust | [Kani](https://model-checking.github.io/kani/) | `#[kani::proof]` harness, `kani::any()` inputs, `kani::assume` preconditions, `assert!` properties; `cargo kani --harness <name>` | Every input; loops up to `#[kani::unwind(N)]`; sequential code only |
| Rust | [Verus](https://github.com/verus-lang/verus) | `requires`/`ensures`/invariants on functions inside `verus!` | Every input, once proofs go through |
| C/C++ | [CBMC](https://www.cprover.org/cbmc/) | Harness with nondeterministic inputs; `cbmc harness.c --bounds-check --pointer-check --unwind N` | Every input up to the unwind bound |
| Any | [Dafny](https://dafny.org/) | Verified implementation compiled to the target language; `dafny verify` | Every input; the compiler is trusted |

## Kani

Install with `cargo install --locked kani-verifier && cargo kani setup` (0.68.0, Sep 2026; Linux x86_64 and macOS, including Apple Silicon). Kani checks panics, overflow, and undefined behavior with no annotations, plus every `assert!` in the harness.

- **Where it fits next to a model checker.** TLA+ checks the design's interleavings; Kani checks that the code's own transition function keeps the invariant. For a state machine in Rust, write a harness over `let s: State = kani::any(); let e: Event = kani::any(); kani::assume(invariant(&s));`, call `step(s, e)`, and assert the invariant on the result. That covers every state and event, so a pass makes the invariant inductive for that function.
- **Concurrency is out of scope.** Kani compiles threads and async "as if it was sequential code" and does not check data races ([feature support](https://model-checking.github.io/kani/rust-feature-support.html)). Its paper lists "sequential execution (no threads or async)" among the assumptions of every result ([Delmas et al., *Kani: A Model Checker for Rust*, arXiv 2607.01504, Jul 2026](https://arxiv.org/abs/2607.01504)).
- **Reading a failure.** The run ends `VERIFICATION:- FAILED` and lists each failed check with its location. `cargo kani -Z concrete-playback --concrete-playback=print` prints the failing inputs as a unit test; replay it with `cargo test`, then keep it as the regression case.
- **Contracts for unbounded claims.** `#[kani::requires]` / `#[kani::ensures]` with `#[kani::proof_for_contract(f)]` (`-Z function-contracts`) and loop contracts (`-Z loop-contracts`) lift a result past the unwind bound. In the paper an AI coding assistant drafted the contracts, and "the specifications do not need to be trusted: Kani verifies every contract against the implementation"; three wrong contracts failed and were fixed in the same session. Guard against vacuity: an `assume` that is always false proves anything, so show each harness red on a broken variant.

## One harness, several engines

In Rust, [bolero](https://github.com/camshaft/bolero) runs one harness as a property test under `cargo test`, as a coverage-guided fuzz target under `cargo bolero test`, and as a Kani proof. Write the harness once against the real entry point, then report each engine's reach separately: sampled, coverage-guided, and every input up to the bound. Check bolero's docs for the current Kani wiring.

Elsewhere, keep the harness body a plain function from input to assertions, so the language's property and fuzz runners from the [invariants](../SKILL.md) step 3 references can call it too.

## Bounds

An unwind or input-size bound limits the claim. Raise it until the run covers the sizes the code meets in practice, or until the run stops being repeatable on every change, and report the final bound. Treat an unwinding-assertion failure as an incomplete run, not a pass.
