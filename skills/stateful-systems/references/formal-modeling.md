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

## Quint

When Quint is available, create a `.qnt` model and run:

```sh
quint parse model.qnt
quint typecheck model.qnt
quint run model.qnt --init init --step step --max-steps 20 --max-samples 2000 --invariants inv_safety
```

Increase steps and samples when the state space or concurrency surface warrants deeper exploration. Add temporal checks for progress properties supported by the model.

## Structured Machine Spec

When the environment uses another modeling tool, express the same packet in that tool. A structured machine spec should include:

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

Complete the formal branch when the model parses and typechecks, representative exploration runs, invariants hold across the explored state space, and any counterexample is connected to a concrete design correction and boundary test.
