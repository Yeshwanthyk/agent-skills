# Lean 4

A Lean proof covers every input with no bound, and Lean's small kernel checks it. The cost is proof effort and the gap between the Lean model and the code. Spend the effort on a property where a bound is not enough, and close the gap with differential tests.

## Pick the mode

| Mode | When | Code link |
| --- | --- | --- |
| **Model proof** | A transition function, algorithm, or state machine whose invariant must hold at every length | Cite each definition's source symbol; replay counterexamples on the code |
| **Executable spec** (verification-guided development, as AWS Cedar does) | The production code is too large or too effectful to prove, but its core semantics fit a pure model | The Lean model is the oracle in a differential property test against the production code |
| **Translated code** | Safe Rust that must itself be proved, via [Aeneas](https://github.com/AeneasVerif/aeneas) | The proof covers the translated functions; the translation toolchain is trusted |

Prefer the executable spec when unsure. It pays off before any proof exists, because the differential test finds bugs on its own.

## Setup

Install through [elan](https://github.com/leanprover/elan), which reads the project's `lean-toolchain` file, so the generated skill pins the version there. Create a project with `lake new <name>`, or with the Mathlib template (see `lake new --help`) only when the proof needs Mathlib. Check with `lake build`. Lean also ships [Plausible](https://github.com/leanprover-community/plausible) property testing, which comes with Mathlib or can be required on its own.

## Steps

1. **Model.** Write the state as a `structure` or `inductive` and the transition as a total function, `def step : State → Op → State`, plus `def run (s : State) : List Op → State` that folds it. Name the invariant something other than `Inv`, which core Lean already defines.
2. **Run it.** `#eval` the model on the packet's scenarios, including at least one known-bad case, and check the outputs against the contract.
3. **Refute before proving.** Run the theorem statement through Plausible (`#eval Plausible.Testable.check <| ∀ ...`, or the `plausible` tactic inside the proof). A failed proof gives no counterexample; Plausible does, cheaply. Derive `Arbitrary` for the model's types.
4. **Prove one step, then the sequence.** Prove `step_preserves : Safe s → Safe (step s o)` first; the sequence theorem follows by induction:

   ```lean
   theorem safe_run (s : State) (os : List Op) (h : Safe s) : Safe (run s os) := by
     induction os generalizing s with
     | nil => simpa [run]
     | cons o os ih => exact ih _ (step_preserves s o h)
   ```

   Reach for `simp`, `omega` (linear arithmetic), `decide` (finite, decidable claims), `grind` (case splits plus congruence, in recent toolchains), and `cases`/`induction`. Use `exact?` and `apply?` to search for library lemmas.
5. **Show it can fail.** Break `step` (drop a guard) and confirm `lake build` goes red on the theorem, then restore.
6. **Wire the oracle.** For the executable-spec mode, expose the model through a small Lean executable (`lean_exe` in the lakefile) that reads operations and prints results, and drive it alongside the production code from the Property branch's generator.

## Trust checklist

Report each item with the result:

- **No holes.** Zero `sorry`, and no `axiom` declared in the project. Each `sorry` is an open question, not a proof.
- **Standard axioms only.** `#print axioms safe_run` lists only `propext`, `Classical.choice`, and `Quot.sound`. `native_decide` adds trust in the compiler (`Lean.ofReduceBool`); report it, or replace it with `decide`.
- **Statement not vacuous.** Prove the hypotheses are satisfiable with an `example` that builds a witness, so `Safe s → …` is not true by an impossible premise.
- **Statement matches the claim.** Read the theorem back as the one-sentence property. Weakening the statement until it proves is a finding, not a fix.
- **Model matches the code.** The definitions cite source symbols, and counterexamples or differential tests have run against the real code.
