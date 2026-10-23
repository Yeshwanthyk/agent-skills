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

| Property shape | Tool | First command | The counterexample | On the statechart |
| --- | --- | --- | --- | --- |
| Bad ordering in a user-facing flow, a race, a retry, recovery | **TLA+ / TLC** ([model-checkers](model-checkers.md)) | `tlc_chart.py run Spec.tla --viz chart.viz` | Shortest trace, one numbered step per action: actor, action, node hop, changed variables | A `!` path along the hops, ending at the `fails:` harm node; the runner writes it |
| The same, in a repo that has Quint, or for model-based tests | **Quint** ([model-checkers](model-checkers.md#quint)) | `quint run m.qnt --invariant inv`, then `quint verify … --backend tlc` | `[State n]` maps from a random trace (`run`), or a TLC trace (`--backend tlc`) | Pipe the TLC trace to `tlc_chart.py log -`; draw the `!` path from its steps |
| A large or integer-heavy state space | **Apalache** | `quint verify m.qnt --invariant inv --max-steps N` | Every behavior up to N steps, symbolically; ITF JSON under `_apalache-out/` | As above, from the trace's states |
| Progress: a request eventually completes, nothing waits forever | **TLC** with fairness (`PROPERTY` in the cfg) | `tlc_chart.py run Spec.tla` | A lasso: steps, then "back to state k" repeating | A `!` path ending at the node the user waits on, narrated as a loop |
| A Rust transition function keeps the invariant for every state and event | **Kani** ([code-verifiers](code-verifiers.md)) | `cargo kani --harness step_keeps_invariant` | `VERIFICATION:- FAILED`, the failed assertion, and with `--concrete-playback=print` the concrete state and event as a unit test | One `!` edge: from the state's node, on the event, to the harm node |
| A pure function or algorithm holds for every input and length, or an executable spec is needed as an oracle | **Lean 4** ([lean](lean.md)) | `lake build` | No trace: a goal that does not close | Nothing to draw; a clean check leaves the stories plain, with no bound |

Two tools have no row. **Bend** ([bend-lang.com](https://bend-lang.com/), 2.0.38, Oct 2026) checks hand-written proofs of `LAWS.bend` against code written in Bend. It has "no tactics or proof search", returns no trace, and its values are affine (no shared state), so it cannot model a race. Use it only when the code under change is Bend. **Kani on concurrent code** compiles threads and async "as if it was sequential code" ([Kani feature support](https://model-checking.github.io/kani/rust-feature-support.html)). Model the interleavings in TLA+, and use Kani on each atomic step.

For a state machine, find counterexamples with a model checker first. A model checker returns a trace; a failed proof returns none. Move to Lean when the model checks clean and a guarantee beyond the bound is worth the proof effort.

## Feed generated tests

A model and its proofs establish facts about the model. Property and fuzz tests establish that the code behaves like the model. Wire each verified property to the invariants Property or Fuzz branch (steps 2-5), or record why none applies:

1. **Invariant as oracle.** Each named invariant becomes the assertion in the step 2 record. A stateful property test checks it against the real entry point after each transition, with the operation alphabet taken from the model's transitions.
2. **Counterexample as regression.** Translate each counterexample trace into concrete operations and replay it on the real code. A replay that fails is the irrefutable proof of the defect and becomes a regression case in the ordinary suite. A trace that does not replay is a modeling gap: fix the model before trusting its other results.
3. **Model as differential oracle.** When the model is executable (a Lean model compiled with `lake build`, or Quint traces exported as ITF), generate inputs or traces, run them through both model and code, and compare results at each step. This is the conformance check, and it catches model drift that proofs cannot.
4. **One harness, several engines.** A code-level verifier harness that takes symbolic input can often also run as a property test and a fuzz target. See [code-verifiers.md](code-verifiers.md).
5. **Disagreement is classified.** When generated tests and the model disagree, decide whether the model, the code, or the harness is wrong before changing any of them.

## Report on the statechart

When step 1 drew a statechart, report the results on that same chart, re-rendered, rather than in a separate list. Each story path ends one of four ways:

- **Works**: it checked clean and stays plain.
- **Bug found**: a counterexample adds its path with a `!` prefix, ending at a `!` node that names what the user wrongly sees. The path gets a `| | narration` tail with the counterexample in one sentence, so replay walks it.
- **Fixed**: a story the fix made reachable takes a `+` on the path and its leaf, naming what the user sees now.
- **Unreached**: a story the model could not reach marks its leaf `?`. That is a modeling gap, or the outcome the bug prevents.

For TLA+, [`tlc_chart.py`](../scripts/tlc_chart.py) writes all four marks from the chart and the spec; [model-checkers](model-checkers.md#statechart-conventions) gives the conventions it reads. [`assets/tla/giftcard`](../assets/tla/giftcard) is a worked example. With another tool, write the marks by hand from its trace. The reader sees which flows work, which broke, and which the fix changed, without reading the spec.

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
