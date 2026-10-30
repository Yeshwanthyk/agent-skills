# Model Checkers

Search every interleaving of a small model for a state that breaks an invariant. A violation comes back as a trace; translate it into code steps per [formal-modeling](formal-modeling.md#feed-generated-tests).

## Which checker

| Situation | Use |
| --- | --- |
| A user-facing flow with a statechart, or a race or retry in one service | **TLA+ with TLC**, through [`tlc_chart.py`](../scripts/tlc_chart.py) |
| The repo already has `.qnt` models, or the model feeds model-based tests | **Quint**; add `--backend tlc` for an exhaustive check |
| The repo already has `.tla` specs | TLA+, whatever the size |
| Integers, long queues, or a state space too large for TLC to enumerate | **Apalache** (`quint verify`, or `apalache-mc check`) |

TLC is the default because it searches breadth-first: the first counterexample is the shortest one, each step names the action that ran, which is the statechart edge, and it can dump the whole state graph to compare with the chart. It needs only Java 11+ and one jar. On the invented two-tab gift card example in [`assets/tla/giftcard`](../assets/tla/giftcard), measured on one laptop: TLC found the 4-step double credit in 1.0s, `quint run` in 1.5s, `quint verify --backend tlc` in 5.3s, and `quint verify` (Apalache) in 5.5s with Apalache already downloaded.

One language per repo. `quint compile --target tlaplus` and `quint verify --backend tlc` (Quint 0.33.0) take a Quint model to TLC, so a Quint repo never needs hand-written TLA+. Nothing official goes from TLA+ to Quint, so a TLA+ repo stays TLA+.

## TLA+ with TLC

Start from [`assets/tla/Skeleton.tla`](../assets/tla/Skeleton.tla) and its `.cfg`. Keep the constants small (2-3 actors, short queues).

```sh
python3 <invariants>/scripts/tlc_chart.py run Spec.tla                       # check every rule in Spec.cfg
python3 <invariants>/scripts/tlc_chart.py run Spec.tla --viz chart.viz --fix Fixed.cfg   # and compare with the statechart
python3 <invariants>/scripts/test_tlc_chart.py                               # after editing the script
```

The script downloads `tla2tools.jar` 1.7.4 once into `~/.cache/tlaplus/` and checks its sha256 (set `TLA2TOOLS` to use another jar). It runs TLC with one worker and a fixed fingerprint seed (`-workers 1 -fp 0`), so a counterexample is the same trace on every run and can be saved as a regression. It reads each result from TLC's exit code: 0 clean, 11 deadlock, 12 invariant, 13 temporal property, 150/151 parse errors ([`EC.ExitStatus`](https://github.com/tlaplus/tlaplus/blob/v1.7.4/tlatools/org.lamport.tlatools/src/tlc2/output/EC.java)).

**Every rule gets a verdict.** TLC stops at the first broken rule, so one bug hides the next. The script checks each INVARIANT, deadlock (unless the cfg says `CHECK_DEADLOCK FALSE`), and each PROPERTY. When one breaks, it prints the shortest counterexample, drops that rule, and reruns. Each rule ends as `holds`, `broken` with its trace, or `not checked` with the reason (a run past `--timeout`, default 300s, or a model error). A counterexample is one line per step: who moved, which action, the statechart hop, and what else changed.

```text
current (GiftCard.cfg): 1 broken · 13 distinct states, depth 5 · TLC 1.7.4, -workers 1 -fp 0
  NoDoubleCredit: broken, 4 steps
    1. t1 Press: form -> checking   (seen[t1] = "unused")
    2. t2 Press: form -> checking   (seen[t2] = "unused")
    3. t1 Answer: checking -> credited   (credits = 1; card = "used")
    4. t2 Answer: checking -> credited   (credits = 2)
  deadlock: holds
```

The bare command is `java -XX:+UseParallelGC -cp tla2tools.jar tlc2.TLC -config Spec.cfg -workers 1 -fp 0 Spec.tla`, run from the spec's folder: TLC 1.7.4 does not find a config outside the folder of an absolute spec path. Note that `-deadlock` turns deadlock checking *off*. TLC explores every reachable state of the finite instance, so report the constants as the bound. A model with no bound on its states runs until `--timeout`. Keep the constants small or add a `CONSTRAINT`.

### Statechart conventions

These let the script compare the model with the chart drawn in [invariants](../SKILL.md) step 1.4:

- **Chart variable.** One variable, `ui` by default (`--chart` to rename it), maps each actor to the id of the chart node it is on: `ui = [t \in Tabs |-> "form"]`. A single-actor flow can use a plain string. Every value it takes must be a node id on the chart.
- **Named actions.** Write `Next` as a disjunction of named actions (`\E t \in Tabs : Press(t) \/ Answer(t)`), named after the chart's edges. Otherwise every step is named `Next`.
- **End states.** A state with no step out is a deadlock, which TLC reports. A stuck user is a harm; a finished flow is not. Add `Done`, true only when every actor is on an end node and changing nothing (`Done == \A t \in Tabs : ui[t] \in {"credited", "rejected"} /\ UNCHANGED vars`), and keep deadlock checking on.
- **Outcome nodes.** A chart node that is not an actor's position, such as "two tabs: one credit, one refusal", carries a `state:` detail line with a TLA+ predicate. Every other node is reached when some actor's `ui` equals its id.
- **Harm nodes.** The node for what the user wrongly sees when an invariant breaks carries `fails: <InvariantName>`. A broken rule with no harm node gets one added (`violated_<Rule>`, or "Stuck: no step out" for deadlock).
- **Fix.** A second config with the fix switched on (a `Fix` constant), or `--fix` pointed at a fixed copy's config.
- **Layout.** The chart may use viz's start dot (`[*] -> form`), `tone` categories, and `group` boxes for phases ([grammar](../../viz/references/grammar.md#views)). The script keeps those lines, and checks the start dot against the model's initial states.

With `--viz`, the script asks TLC for the full state graph (`-dump dot,actionlabels`) and for the states where each `state:` predicate holds, then compares the model with the chart. The chart is the intent and the model is the code, so every difference is a finding:

| Comparison | Report | Mark in `chart.checked.viz` |
| --- | --- | --- |
| A story's actor walks its drawn nodes in order, consecutively, to its end node, in the current model (and the fixed one) | `works` | plain |
| The same, only in the fixed model | `fixed` | `+` on the story and its leaf |
| The end node is reached, but only by another route | `reached only via a > b > c, not the drawn path` | `?` on the leaf, and the story ends `=|` (stopped before its end) |
| The end node is never reached | `unreached`: a modeling gap, or the outcome the bug prevents | `?` on the leaf, and the story ends `=|` |
| A rule breaks | its counterexample | a `!` path along the last mover's hops to the harm node, one `!` replay step per trace step |
| The model takes a step the chart has no arrow for | `a -> b by Action: no arrow on the chart` | a `!undrawn_a_b` path |
| The chart draws an arrow or a node the model never reaches | `the model never takes this arrow` / `never reaches this node` | the story through it is `?` |
| The model puts `ui` on an id the chart lacks, or starts elsewhere than `[*]` | `not a node on the chart` / `starts on x` | — |

An undrawn step means the code can do something the reader never agreed to: draw it, or find why the code allows it. An arrow the model never takes is a story the code cannot produce, or a part of the code the model leaves out. Both go in the hand-off. With `SYMMETRY` or `VIEW`, TLC stores one state for each class, and the graph shows that one. Above `--graph-limit` states (default 20,000), the script checks stories with one witness run each (`~(end predicate)` as an invariant), judges only the shortest witness against the drawn path, and skips the arrow comparison, and it says so. Render the output with [viz](../../viz/SKILL.md). The script exits 0 when every rule of the final model holds, 1 when one breaks, and 2 on an error or a rule not checked.

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
