# Model Checkers

Search every interleaving of a small model for a state that breaks an invariant. A violation comes back as a trace; translate it into code steps per [formal-modeling](formal-modeling.md#feed-generated-tests).

## Quint

Create a `.qnt` module with `init`, `step`, and named invariants, then run:

```sh
quint parse model.qnt
quint typecheck model.qnt
quint run model.qnt --invariant inv_safety --max-steps 20        # random simulation
quint verify model.qnt --invariant inv_safety --max-steps 10     # bounded model check (Apalache)
```

`--invariants a b` checks several invariants together. `quint verify` downloads Apalache on first use and needs a JDK 17 or newer on `PATH`. Raise `--max-steps` until every scenario in the model fits inside the bound, and report the bound with the result. Add temporal properties for progress where the model supports them. To feed model-based tests, export traces in ITF JSON; check `quint run --help` for the trace output flags in the installed version.

Reach: `run` covers the sampled traces; `verify` covers every trace up to `--max-steps`.

## TLA+

Prefer TLA+ when the repo already has specs, or for a distributed protocol where TLC's exhaustive state search and fairness handling matter. Write `Spec.tla` with `Init`, `Next`, and named invariants, plus `Spec.cfg` listing `INIT`, `NEXT`, `INVARIANT`, and constants sized small (2-3 processes, short queues):

```sh
java -XX:+UseParallelGC -cp tla2tools.jar tlc2.TLC -config Spec.cfg -workers auto Spec.tla
```

TLC explores every reachable state of the finite instance; report the constants as the bound. Use Apalache (`apalache-mc check --inv=Inv --length=N Spec.tla`) when the state space is too large to enumerate. Pin the `tla2tools.jar` version in the generated skill.

## Sizing

Start with the smallest instance that can show each scenario in the packet, confirm the known-bad variant goes red, then grow the bound while the run stays short enough to repeat on every relevant change.
