# Formal Modeling

Use this branch when critical or concurrent behavior remains ambiguous after the transition model, or when a property must hold for every case in a stated scope rather than the cases someone wrote.

## Model

Capture:

- state variables and ownership
- initial state
- named transitions with guards and effects
- safety invariants
- progress properties where completion or eventual delivery matters
- representative witnesses for success, retry, recovery, and concurrent ordering

Keep the model at the smallest boundary that contains the invariant.

## Rules

- **True to the code.** Each variable and transition cites the file and symbol it models, and uses this repo's names. A step the model treats as atomic is atomic in the code: one lock, one transaction, no `await` or I/O inside it.
- **Able to fail.** Show each property going red on a broken variant of what it guards (a removed guard, a reordered write, a dropped retry check), then restore. A check never seen red proves nothing.
- **Findings stay findings.** When the current design or code breaks the property, report the counterexample. Keep the property and the model as stated; fix product code only when asked.
- **Scoped.** Every result names its reach: sampled traces, every trace up to a bound, every input up to a bound, or every input. List the assumptions (bounds, fairness, axioms, trusted code) it rests on.
- **Plain.** State the property and the harm in one sentence each. Tell a counterexample as a numbered sequence of steps in the user's nouns when the flow has a statechart ("you walk away, then open it on your phone"), each step citing the code symbol it runs; otherwise in the code's nouns.

## Choose the tool

Pick the cheapest tool that answers the question. When the repo already uses one, use it. Read only the matching reference.

| Question | Tool | Reference |
| --- | --- | --- |
| Can events happen in a bad order? Races, retries, recovery, distributed protocols | Model checker: **Quint** or **TLA+** | [model-checkers.md](model-checkers.md) |
| Does a pure function, transition, or algorithm hold for every input and every length? Or is an executable spec needed as a test oracle? | Proof assistant: **Lean 4** | [lean.md](lean.md) |
| Does the code itself avoid undefined behavior, overflow, or a broken data-structure invariant for every input up to a bound? | Verifier on the code: **Kani**, **Verus**, **CBMC**, **Dafny** | [code-verifiers.md](code-verifiers.md) |

For a state machine, find counterexamples with a model checker first. A model checker returns a trace, and a failed proof returns none. Move to Lean when the model checks clean and a guarantee beyond the bound is worth the proof effort.

## Feed generated tests

A model and its proofs establish facts about the model. Property and fuzz tests establish that the code behaves like the model. Wire each verified property to the invariants Property or Fuzz branch (steps 2-5), or record why none applies:

1. **Invariant as oracle.** Each named invariant becomes the assertion in the step 2 record. A stateful property test checks it against the real entry point after each transition, with the operation alphabet taken from the model's transitions.
2. **Counterexample as regression.** Translate each counterexample trace into concrete operations and replay it on the real code. A replay that fails is the irrefutable proof of the defect and becomes a regression case in the ordinary suite. A trace that does not replay is a modeling gap: fix the model before trusting its other results.
3. **Model as differential oracle.** When the model is executable (a Lean model compiled with `lake build`, or Quint traces exported as ITF), generate inputs or traces, run them through both model and code, and compare results at each step. This is the conformance check, and it catches model drift that proofs cannot.
4. **One harness, several engines.** A code-level verifier harness that takes symbolic input can often also run as a property test and a fuzz target. See [code-verifiers.md](code-verifiers.md).
5. **Disagreement is classified.** When generated tests and the model disagree, decide whether the model, the code, or the harness is wrong before changing any of them.

## Report on the statechart

When step 1 drew a statechart, report the results on that same chart, re-rendered, rather than in a separate list. A path that checked clean stays plain. A counterexample adds its path with a `!` prefix ending at a `!` node naming what the user wrongly sees. After a fix, add a `+` path ending at a `+` node naming what they see now. Give each `!` path a `| | narration` tail with the counterexample in one sentence, so replay walks it. A story the model could not reach is a modeling gap: mark its leaf `?`. The reader sees which flows work, which broke, and which the fix changed, without reading the spec.

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

The model parses and typechecks, each property has been seen red on a broken variant, and the report states each result's reach and assumptions. Each counterexample has replayed on the code or is named as a modeling gap, and connects to a design correction and a regression case. Each verified property names its linked property or fuzz test, or says why none applies. When a statechart exists, it is re-rendered with every story marked as clean, failing, fixed, or unreached.
