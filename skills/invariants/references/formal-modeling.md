# Formal Modeling

Use this branch when critical or concurrent behavior remains ambiguous after the transition model.

## Model

Capture:

- state variables and ownership
- initial state
- named transitions with guards and effects
- safety invariants
- progress properties where completion or eventual delivery matters
- representative witnesses for success, retry, recovery, and concurrent ordering

Keep the model at the smallest boundary that contains the invariant.

## Choose the tool

| Question | Tool | What a pass means |
| --- | --- | --- |
| Can any interleaving of these transitions break the invariant? Races, retries, recovery, ordering | **Quint** (`quint run`, then `quint verify`) | `run`: no violation in the sampled traces. `verify`: none in any trace up to `--max-steps` |
| Does the invariant hold for every state and every length, beyond any bound? Arithmetic, a pure transition function, a refinement | **Lean 4** | A proof about the model, for all inputs |

Start with Quint for state machines: it searches for a counterexample automatically and returns the trace. Use Lean only after the model checks clean and an unbounded guarantee is worth the proof effort. Lean returns no trace when the claim is false, so find the counterexample in Quint first. When the repo already uses TLA+, Alloy, or another tool, use that tool with the same packet.

Both prove facts about the model, not the code. Tie each invariant back to its enforcement point and a boundary test.

## Quint

Create a `.qnt` module with `init`, `step`, and named invariants, then run:

```sh
quint parse model.qnt
quint typecheck model.qnt
quint run model.qnt --invariant inv_safety --max-steps 20        # random simulation
quint verify model.qnt --invariant inv_safety --max-steps 10     # bounded model check (Apalache)
```

`--invariants a b` checks several invariants together. `quint verify` downloads Apalache on first use and needs a JDK 17 or newer on `PATH`. Raise `--max-steps` until every scenario in the model fits inside the bound, and report the bound with the result. Add temporal properties for progress where the model supports them.

## Lean 4

Write the state as an inductive type or structure, the transition as a total function, and the invariant as a theorem over every reachable sequence:

```lean
def run (s : State) : List Op → State
  | [] => s
  | o :: os => run (step s o) os

theorem inv_preserved (s : State) (os : List Op) (h : Safe s) : Safe (run s os) := by
  induction os generalizing s with
  | nil => simpa [run]
  | cons o os ih => exact ih _ (step_preserves s o h)
```

Prove the one-step lemma (`step_preserves`) first; the sequence theorem follows by induction. Check a single file with `lean Model.lean`. Name the invariant something other than `Inv`, which core Lean already defines. Use `lake new` with Mathlib only when the proof needs its libraries. `sorry` is an open question, not a proof: report each one.

## Structured Machine Spec

When no modeling tool fits, express the same packet as a structured spec:

```text
variables
initial state
transition table: from, trigger, actor, precondition, write, publication, recovery
reachability from the initial state
concurrent transition pairs and ordering behavior
invariants and enforcement locations
counterexample candidates and their prevention mechanism
scenario traces
boundary test matrix
```

## Completion

Complete the formal branch when the model parses and typechecks, and the report states what each result covers: sampled traces (`quint run`), every trace up to a named bound (`quint verify`), or every state (a Lean proof with no `sorry`). Each counterexample is connected to a concrete design correction and a boundary test.
