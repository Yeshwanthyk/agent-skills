# Model Checkers

Search every interleaving of a small model for a state that breaks an invariant. A violation comes back as a trace; translate it into code steps per [formal-modeling](formal-modeling.md#feed-generated-tests).

## Which checker

| Situation | Use |
| --- | --- |
| A user-facing flow with a statechart, or a race or retry in one service | **TLA+ with everystate**, through [`tla_chart.py`](../scripts/tla_chart.py) |
| The repo already has `.tla` specs | TLA+, whatever the size |
| Integers, long queues, or a state space too large to enumerate in memory | Shrink the instance: smaller constants, a `CONSTRAINT`, or `SYMMETRY`; say what the bound leaves out |

[everystate](https://github.com/mattzcarey/everystate) is the default: a TLA+ model checker in Rust with TLC's command line, output format and exit codes, and no Java. It searches breadth-first, so the first counterexample is the shortest one; each step names the action that ran, which is the statechart edge; and it can dump the whole state graph to compare with the chart. It also checks a log of the real code against the spec (`conform`), and the script turns the spec into types for that log (`types`). On the invented two-tab gift card example in [`assets/tla/giftcard`](../assets/tla/giftcard), the whole `run --viz --fix` took 0.33 s on one laptop, against 4.4 s with Java TLC 1.7.4, with the same verdicts, trace and checked chart.

TLA+ is the one modeling language here, and everystate the one checker; nothing in these skills needs Java. A repo with models in another language (Quint, Alloy) is out of scope: say so rather than port it silently.

## TLA+ with everystate

Start from [`assets/tla/Skeleton.tla`](../assets/tla/Skeleton.tla) and its `.cfg`. Keep the constants small (2-3 actors, short queues).

```sh
python3 <invariants>/scripts/tla_chart.py run Spec.tla                       # check every rule in Spec.cfg
python3 <invariants>/scripts/tla_chart.py run Spec.tla --viz chart.viz --fix Fixed.cfg   # and compare with the statechart
python3 <invariants>/scripts/tla_chart.py types Spec.tla -o spec.types.ts     # types for the code's trace lines
python3 <invariants>/scripts/tla_chart.py conform run.jsonl Spec.tla          # is this recorded run a behavior of the spec?
python3 <invariants>/scripts/test_tla_chart.py                               # after editing the script
```

The script builds everystate from source at a pinned commit (`ES_COMMIT` in the script; git checks the tree against that hash) once, into `~/.cache/everystate/`, which takes about 30 s and needs `git` and `cargo`. Set `EVERYSTATE` to use another binary. When `git` or `cargo` is missing, or GitHub is unreachable, it exits 3 and prints `SETUP NEEDED` with the fix: tell the user what is missing and ask with your question tool whether to set it up for them, run that command only after a yes, then rerun. A counterexample is the same trace on every run, so it can be saved as a regression. The script reads each result from the exit code: 0 clean, 11 deadlock, 12 invariant, 13 temporal property, 150/151 parse errors.

**Every rule gets a verdict.** The checker stops at the first broken rule, so one bug hides the next. The script checks each INVARIANT, deadlock (unless the cfg says `CHECK_DEADLOCK FALSE`), and each PROPERTY. When one breaks, it prints the shortest counterexample, drops that rule, and reruns. Each rule ends as `holds`, `broken` with its trace, or `not checked` with the reason (a run past `--timeout`, default 300s, or a model error). A counterexample is one line per step: who moved, which action, the statechart hop, and what else changed.

```text
current (GiftCard.cfg): 1 broken · 13 distinct states, depth 5 · everystate c1544c8
  NoDoubleCredit: broken, 4 steps
    1. t1 Press: form -> checking   (seen[t1] = "unused")
    2. t2 Press: form -> checking   (seen[t2] = "unused")
    3. t1 Answer: checking -> credited   (credits = 1; card = "used")
    4. t2 Answer: checking -> credited   (credits = 2)
  deadlock: holds
```

The bare command is `everystate -config Spec.cfg Spec.tla` (`python3 tla_chart.py engine` prints the binary's path), run from the spec's folder, where it finds the spec's modules. Note that `-deadlock` turns deadlock checking *off*. The checker explores every reachable state of the finite instance and keeps them in memory (a few million is the practical limit), so report the constants as the bound. A model with no bound on its states runs until `--timeout`. Keep the constants small or add a `CONSTRAINT`.

Not supported, and not needed by the conventions below: labels and subexpression selectors, Java module overrides, disk-backed state storage, and TLAPS proofs (parsed and skipped).

### Check the code against the model

A pass verifies the model. `conform` checks that the running code behaves like it: log one JSON line per model step where the step takes effect in the code, using the model's action and variable names (`{"action": "Answer", "params": ["t1"], "state": {"credits": 1}}`; the first line is the initial state, variables left out are unconstrained). Exit 0 means the run is a behavior of the spec; 20 means it is not, and the report names the first line the spec cannot match, with the steps it allowed there; 12 means the spec allows the run and the run breaks an invariant, so the model admits the bug. Options after the spec go to `everystate conform` (`-hidden N` for unlogged steps, `-stutter` for sampled logs, `-json`); see `$(tla_chart.py engine) conform -help`. Decide which side is wrong against the code, as with a counterexample, and fix the logging before loosening the check.

`types` writes TypeScript for those log lines from the spec: a `Step` union with one member per action (arity from the spec, parameters typed as the cfg's model values), and a `State` interface whose fields are the literal values each variable takes in the reachable states. Type the code's logging call and its handling of each state against them, with a `never` default in every switch over a state. A renamed action, a value the spec never reaches, or a state the code does not handle then fails the compile. Commit the generated file and regenerate it in the same change as the spec. Value types are only as wide as the cfg's bounds: integers widen to `number`, but a model value or string that only appears at larger constants is missing until the bound grows.

### Statechart conventions

These let the script compare the model with the chart drawn in [invariants](../SKILL.md) step 1.4:

- **Chart variable.** One variable, `ui` by default (`--chart` to rename it), maps each actor to the id of the chart node it is on: `ui = [t \in Tabs |-> "form"]`. A single-actor flow can use a plain string. Every value it takes must be a node id on the chart.
- **Named actions.** Write `Next` as a disjunction of named actions (`\E t \in Tabs : Press(t) \/ Answer(t)`), named after the chart's edges. Otherwise every step is named `Next`.
- **End states.** A state with no step out is a deadlock, which the checker reports. A stuck user is a harm; a finished flow is not. Add `Done`, true only when every actor is on an end node and changing nothing (`Done == \A t \in Tabs : ui[t] \in {"credited", "rejected"} /\ UNCHANGED vars`), and keep deadlock checking on.
- **Outcome nodes.** A chart node that is not an actor's position, such as "two tabs: one credit, one refusal", carries a `state:` detail line with a TLA+ predicate. Every other node is reached when some actor's `ui` equals its id.
- **Harm nodes.** The node for what the user wrongly sees when an invariant breaks carries `fails: <InvariantName>`. A broken rule with no harm node gets one added (`violated_<Rule>`, or "Stuck: no step out" for deadlock).
- **Fix.** A second config with the fix switched on (a `Fix` constant), or `--fix` pointed at a fixed copy's config.
- **Layout.** The chart may use viz's start dot (`[*] -> form`), `tone` categories, and `group` boxes for phases ([grammar](../../viz/references/grammar.md#views)). The script keeps those lines, and checks the start dot against the model's initial states.

With `--viz`, the script asks for the full state graph (`-dump dot,actionlabels`) and for the states where each `state:` predicate holds, then compares the model with the chart. The chart is the intent and the model is the code, so every difference is a finding:

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

An undrawn step means the code can do something the reader never agreed to: draw it, or find why the code allows it. An arrow the model never takes is a story the code cannot produce, or a part of the code the model leaves out. Both go in the hand-off. With `SYMMETRY` or `VIEW`, the checker stores one state for each class, and the graph shows that one. Above `--graph-limit` states (default 20,000), the script checks stories with one witness run each (`~(end predicate)` as an invariant), judges only the shortest witness against the drawn path, and skips the arrow comparison, and it says so. Render the output with [viz](../../viz/SKILL.md). The script exits 0 when every rule of the final model holds, 1 when one breaks, and 2 on an error or a rule not checked.

Source: [everystate](https://github.com/mattzcarey/everystate) (commit c1544c8, Nov 2026: 122/122 tlaplus/Examples models and 384/414 of TLC's test models match TLC, per its CONFORMANCE.md).

## Sizing

Start with the smallest instance that can show each scenario in the packet, confirm the known-bad variant goes red, then grow the bound while the run stays short enough to repeat on every relevant change.
