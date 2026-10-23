# Model Checkers

Search every interleaving of a small model for a state that breaks an invariant. A violation comes back as a trace; translate it into code steps per [formal-modeling](formal-modeling.md#feed-generated-tests).

## Which checker

| Situation | Use |
| --- | --- |
| A user-facing flow with a statechart, or a race or retry in one service | **TLA+ with TLC**, through [`tlc_chart.py`](../scripts/tlc_chart.py) |
| The repo already has `.qnt` models, or the model feeds model-based tests | **Quint**; add `--backend tlc` for an exhaustive check |
| The repo already has `.tla` specs | TLA+, whatever the size |
| Integers, long queues, or a state space too large for TLC to enumerate | **Apalache** (`quint verify`, or `apalache-mc check`) |

TLC is the default because it searches breadth-first: the first counterexample is the shortest one, and each step names the action that ran, which is the statechart edge. It needs only Java 11+ and one jar. On the invented two-tab gift card example in [`assets/tla/giftcard`](../assets/tla/giftcard), measured on one laptop: TLC found the 4-step double credit in 1.0s, `quint run` in 1.5s, `quint verify --backend tlc` in 5.3s, and `quint verify` (Apalache) in 5.5s with Apalache already downloaded.

One language per repo. `quint compile --target tlaplus` and `quint verify --backend tlc` (Quint 0.33.0) take a Quint model to TLC, so a Quint repo never needs hand-written TLA+. Nothing official goes from TLA+ to Quint, so a TLA+ repo stays TLA+.

## TLA+ with TLC

Start from [`assets/tla/Skeleton.tla`](../assets/tla/Skeleton.tla) and its `.cfg`. Keep the constants small (2-3 actors, short queues).

```sh
python3 <invariants>/scripts/tlc_chart.py run Spec.tla                       # check the invariants in Spec.cfg
python3 <invariants>/scripts/tlc_chart.py run Spec.tla --viz chart.viz --fix Fixed.cfg   # and mark the statechart
```

The script downloads `tla2tools.jar` 1.7.4 once into `~/.cache/tlaplus/` and checks its sha256 (set `TLA2TOOLS` to use another jar). It runs TLC with `-workers auto` and a temporary metadir, and reads the result from TLC's exit code: 0 clean, 11 deadlock, 12 invariant, 13 temporal property, 150/151 parse errors ([`EC.ExitStatus`](https://github.com/tlaplus/tlaplus/blob/v1.7.4/tlatools/org.lamport.tlatools/src/tlc2/output/EC.java)). Then it prints the counterexample, one line per step: who moved, which action, the statechart hop, and what else changed.

```text
current (GiftCard.cfg): invariant violated · 13 distinct states, depth 5 · 1.0s · TLC 1.7.4
counterexample for NoDoubleCredit, 4 steps:
  1. t2 Press: form -> checking   (seen[t2] = "unused")
  2. t1 Press: form -> checking   (seen[t1] = "unused")
  3. t1 Answer: checking -> credited   (credits = 1; card = "used")
  4. t2 Answer: checking -> credited   (credits = 2)
```

The bare command is `java -XX:+UseParallelGC -cp tla2tools.jar tlc2.TLC -config Spec.cfg -workers auto Spec.tla`. Note that `-deadlock` turns deadlock checking *off*. TLC explores every reachable state of the finite instance, so report the constants as the bound.

### Statechart conventions

These let the script map a trace onto the chart drawn in [invariants](../SKILL.md) step 1.4:

- **Chart variable.** One variable, `ui` by default (`--chart` to rename it), maps each actor to the id of the chart node it is on: `ui = [t \in Tabs |-> "form"]`. A single-actor flow can use a plain string. Name the actions after the chart's edges.
- **Outcome nodes.** A chart node that is not an actor's position, such as "two tabs: one credit, one refusal", carries a `state:` detail line with a TLA+ predicate. Every other node is reached when some actor's `ui` equals its id.
- **Harm nodes.** The node for what the user wrongly sees when an invariant breaks carries `fails: <InvariantName>`.
- **Fix.** A second config with the fix switched on (a `Fix` constant), or `--fix` pointed at a fixed copy's config.

With `--viz`, the script finds each named story path in the chart by checking `~(end node predicate)` as an invariant, which makes TLC return a witness trace. Then it writes `chart.checked.viz`:

| Story result | Mark on the chart |
| --- | --- |
| Reached in the current model (and in the fixed one) | plain: works |
| Invariant broken | a `!` path along the last mover's hops, ending at the `fails:` node, with one `!` replay step per trace step |
| Unreached now, reached with the fix | `+` on the story and its leaf: fixed |
| Unreached in the final model | `?` on the leaf: a modeling gap, or the outcome the bug prevents |

It also warns when a story is reached by a different route than the one drawn. Render the output with [viz](../../viz/SKILL.md). The script exits 0 when the final model is clean.

## Quint

Create a `.qnt` module with `init`, `step`, and named invariants, then run:

```sh
quint typecheck model.qnt
quint run model.qnt --invariant inv_safety --max-steps 20                    # random simulation, seconds
quint verify model.qnt --invariant inv_safety --max-steps 10 --backend tlc   # exhaustive, TLC
quint verify model.qnt --invariant inv_safety --max-steps 10                 # bounded symbolic, Apalache
```

`quint run` samples random traces, so its counterexample is not the shortest one. Rerun with the printed `--seed` to reproduce it. `quint verify` downloads Apalache on first use (Apalache 0.62 runs on Java 21 or newer) and writes `_apalache-out/` into the working directory. `quint verify --backend tlc` prints a TLC trace with Quint's mangled names (`main_giftcard_ui`); pipe it to `tlc_chart.py log - --chart ui` for the same step listing. `--out-itf trace.itf.json` writes the trace as ITF JSON, and `quint run --mbt` adds the metadata model-based tests need. Raise `--max-steps` until every scenario fits, and report the bound.

Reach: `run` covers the sampled traces; `verify` covers every trace up to `--max-steps`.

Sources: [Quint CLI](https://quint-lang.org/docs/quint) and [CHANGELOG](https://github.com/informalsystems/quint/blob/main/CHANGELOG.md) (0.33.0, Sep 2026; `--backend tlc` since 0.31.0); [Apalache install](https://apalache-mc.org/docs/apalache/installation/jvm.html) (0.62.4, Oct 2026); [TLA+ tools releases](https://github.com/tlaplus/tlaplus/releases) (1.7.4 stable, Aug 2024; 1.8.0 is a prerelease; 1.7.4 has no `-dumpTrace`, so the script parses the text trace).

## Apalache directly

`apalache-mc check --inv=Inv --length=N Spec.tla` checks every behavior up to `N` steps symbolically. Use it when integers or large sets defeat TLC's enumeration. It needs type annotations on variables and constants, and writes the counterexample as `.tla` and ITF JSON under `_apalache-out/`.

## Sizing

Start with the smallest instance that can show each scenario in the packet, confirm the known-bad variant goes red, then grow the bound while the run stays short enough to repeat on every relevant change.
