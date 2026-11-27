# Model Checkers

Search every interleaving of a small model for a state that breaks an invariant. A violation comes back as a trace; translate it into code steps per [formal-modeling](formal-modeling.md#feed-generated-tests).

## TLA+ with EveryState

Use TLA+ for the model and [EveryState](https://github.com/mattzcarey/everystate) to explore its reachable states. It reads TLC-format configs and traces without Java. If the project uses a different modeling language, report the mismatch before porting it.

Start from [`assets/tla/Skeleton.tla`](../assets/tla/Skeleton.tla) and its `.cfg`. Keep the constants small (2-3 actors, short queues).

```sh
python3 <invariants>/scripts/tla_chart.py run Spec.tla --require-rule Safe                       # check every rule in Spec.cfg
python3 <invariants>/scripts/tla_chart.py run Spec.tla --require-rule Safe --viz chart.viz --fix Fixed.cfg   # and compare with the statechart
python3 <invariants>/scripts/tla_chart.py types Spec.tla -o spec.types.ts     # types for the code's trace lines
python3 <invariants>/scripts/tla_chart.py conform run.jsonl Spec.tla          # is this recorded run a behavior of the spec?
python3 <invariants>/scripts/test_tla_chart.py                               # after editing the script
```

The runner builds the pinned release once with `git` and `cargo`, then caches it. For a prebuilt binary, set `EVERYSTATE` to an executable reporting the same release. On exit 3 (`SETUP NEEDED`), show the suggested fix and ask before installing anything.

**Coverage.** Pass `--require-rule NAME` for each independently inventoried invariant or progress property. Both configs need named rules. A fix must retain all baseline rules, including deadlock checking if enabled. The runner removes each violated safety rule and reruns, then checks each progress property separately. Report `holds`, `broken` with a trace, or `not checked` with the reason for every rule.

```text
current (GiftCard.cfg): 1 broken · 13 distinct states, depth 5 · everystate 0.4.1 (28fd7c5)
  NoDoubleCredit: broken, 4 steps
    1. t1 Press: form -> checking   (seen[t1] = "unused")
    2. t2 Press: form -> checking   (seen[t2] = "unused")
    3. t1 Answer: checking -> credited   (credits = 1; card = "used")
    4. t2 Answer: checking -> credited   (credits = 2)
  deadlock: holds
```

Report constants and constraints as bounds: EveryState keeps the reachable states in memory. If exploration times out, report the affected rules as unchecked; reducing the instance changes the claim.

Not supported, and not needed by the conventions below: labels and subexpression selectors, Java module overrides, disk-backed state storage, and TLAPS proofs (parsed and skipped).

### Check the code against the model

A pass verifies the model. `conform` checks that the running code behaves like it: log one JSON line per model step where the step takes effect in the code, using the model's action and variable names (`{"action": "Answer", "params": ["t1"], "state": {"credits": 1}}`; the first line is the initial state, variables left out are unconstrained). Exit 0 means the run is a behavior of the spec; 20 means it is not, and the report names the first line the spec cannot match, with the steps it allowed there; 12 means the spec allows the run and the run breaks an invariant, so the model admits the bug. Options after the spec go to `everystate conform` (`-hidden N` for unlogged steps, `-stutter` for sampled logs, `-json`); see `$(tla_chart.py engine) conform -help`. Decide which side is wrong against the code, as with a counterexample, and fix the logging before loosening the check.

`types` writes TypeScript for those log lines from the spec: a `Step` union with one member per action (arity from the spec, parameters typed as the cfg's model values), and a `State` interface whose fields are the literal values each variable takes in the reachable states. Type the code's logging call and its handling of each state against them, with a `never` default in every switch over a state. A renamed action, a value the spec never reaches, or a state the code does not handle then fails the compile. Commit the generated file and regenerate it in the same change as the spec. Value types are only as wide as the cfg's bounds: integers widen to `number`, but a model value or string that only appears at larger constants is missing until the bound grows. If production accepts values beyond that instance, derive the production type from its declared domain instead of treating the observed values as exhaustive.

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

Source: [EveryState v0.4.1](https://github.com/mattzcarey/everystate/tree/v0.4.1).

## Sizing

Start with the smallest instance that can show each scenario in the packet, confirm the known-bad variant goes red, then grow the bound while the run stays short enough to repeat on every relevant change.
