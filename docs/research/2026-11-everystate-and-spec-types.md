# everystate in our formal-verification skills, and spec-derived types

Question: can [everystate](https://github.com/mattzcarey/everystate) replace TLA+ in `invariants` and `formal-verification-skill`, and how do we use it to make type checking catch more? Pinned to everystate `c1544c8` (repo HEAD, 2026-11-18) and npm `everystate@0.3.1` (2026-11-17), against our `tlc_chart.py` pinned to TLC 1.7.4, on macOS arm64.

## Status (2026-11-17): adopted

Java TLC is gone from our skills. `skills/invariants/scripts/tla_chart.py` (renamed from `tlc_chart.py`) builds everystate from source at commit `c1544c8` into `~/.cache/everystate/` (git + cargo, about 30 s once; `EVERYSTATE` overrides; exit 3 with SETUP NEEDED when either tool or GitHub is missing) and runs it for every check. It adds `conform` and `types`. `model-checkers.md`, `formal-modeling.md` ("Feed generated tests" items 3 and 4), `invariants/SKILL.md`, `formal-verification-skill` (Run, Linked tests, Update) and the gift-card assets now point at it. `test_tla_chart.py` covers types, conform (20 and 12), and the no-cargo and offline setup paths. The sections below are the research as written before the switch; "Proposed changes" item 1 kept a Java fallback, which we dropped. Quint and Apalache were removed too, so no path in the skills needs Java.

## Answer

1. **everystate replaces TLC (the Java checker), not TLA+ (the language).** Specs, `.cfg` files, and our statechart workflow stay as they are. It is a Rust TLA+ model checker with TLC's CLI, output format and exit codes ([README](https://github.com/mattzcarey/everystate/blob/c1544c8/README.md)). *Checked.*
2. **It drops into `tlc_chart.py` with one line changed.** On the gift-card example, the run through everystate printed the same verdicts, the same 4-step counterexample, the same story marks, and a byte-identical `chart.checked.viz` as Java TLC. Wall clock was 0.07 s against 4.39 s (one run each on a tiny model, so this is JVM start-up). *Checked*, see "Evidence".
3. **Its new capability is `everystate conform`**: it checks a JSON-lines log of the real code against the spec. That closes the gap our skills leave open: today a counterexample is replayed on the code by hand, and the model drifts from the code without anyone noticing. *Checked on HEAD; not in npm 0.3.1.*
4. **The type-checking win:** generate a types file from the spec (action names and arities, variables, the literal values each variable takes in the reachable states), and type the code's `observe()` logging calls and UI switches against it. Then `tsc` fails when code and spec drift: a renamed action, a value the spec never reaches, a state the code doesn't handle. A 70-line prototype caught all three. *Checked*, see "Spec-derived types".

## What everystate is

| Claim | Source | Status |
| --- | --- | --- |
| Reads `.tla` + TLC `.cfg`, TLC-format output, exit codes 0/10/11/12/13/150/151 | [README](https://github.com/mattzcarey/everystate/blob/c1544c8/README.md) | checked (exit 12 on gift card) |
| `everystate java -cp … tlc2.TLC …` (or the binary named `java`) stands in for `java -cp tla2tools.jar`; also `tla2sany.XMLExporter`, `pcal.trans` | `src/cli.rs` `run_java_shim`, `src/main.rs:13` | checked |
| Matches TLC on 122/122 tlaplus/Examples models ≤5 s and 384/414 of TLC's test-model suite. The 30 mismatches are random seeds, Java overrides, labels/subexpression selectors, SANY-only errors, lazy normalization | [CONFORMANCE.md](https://github.com/mattzcarey/everystate/blob/c1544c8/CONFORMANCE.md) | documented only |
| 1.1×–4.6× faster than one-worker TLC on 12 models, ~50× on tiny ones (start-up) | [BENCHMARK.md](https://github.com/mattzcarey/everystate/blob/c1544c8/BENCHMARK.md), 2026-11-14, shared 4-core VM | documented only |
| `-simulate`, `-workers N`, `pcal`, `conform` | README at HEAD; `.changeset/*.md` unreleased | in source only: `everystate -h` on npm 0.3.1 lists none of them |
| No disk-backed states (a few million is the limit), no Java overrides, no labels/subexpression selectors, TLAPS proofs parsed and skipped | README "Not supported" | documented only |
| Ships an agent skill, `skills/formal-verification` | [SKILL.md](https://github.com/mattzcarey/everystate/blob/c1544c8/skills/formal-verification/SKILL.md) | read |

Their skill covers the same ground as our `invariants` → `formal-modeling` → `formal-verification-skill` chain (pick the promise, atomic steps, bound, see it fail, report honestly), but with less. It has no statechart report, no per-rule verdicts, no sync-commit drift audit, and no tool decision table. Ours is the stronger method. What theirs has that ours lacks is `conform` and the `observe()` logging pattern.

## Evidence

Run from a scratch copy of `skills/invariants/assets/tla/giftcard`:

```sh
python3 tlc_chart.py run GiftCard.tla --viz chart.viz --fix GiftCardFixed.cfg     # Java TLC 1.7.4, OpenJDK 17
PATH=<dir with java -> everystate native binary>:$PATH python3 tlc_chart.py run …  # everystate 0.3.1
```

- stdout: identical except the trailing `graph …` line, which is our viz render (the scratch copy couldn't resolve its relative `VIZ_PY` path). Not an engine difference.
- `chart.checked.viz`: identical (`diff` empty).
- Two frictions, both on our side or the wrapper's:
  - `require_java()` parses `java -version` and rejects everystate's `everystate 0.3.1` reply, so the run exits 3 with SETUP NEEDED. The scratch copy bypassed it.
  - The npm launcher enters shim mode only when `argv[1]`'s basename starts with `everystate-java`. A symlink named `java` that points at the npm bin doesn't trigger it; the native binary does (`main.rs:13` accepts `java`). So call `everystate java …` explicitly instead of faking a `java` on PATH.

`conform` on HEAD (built with `cargo build --release`), with a hand-written trace of the buggy two-tab run (`Press t1, Press t2, Answer t1 → credits 1, Answer t2 → credits 2`):

| Trace | Model | Exit | Meaning |
| --- | --- | --- | --- |
| buggy run | fixed cfg | 20 | "line 5 … Answer(t2): credits is 1 in the spec, 2 in the trace": the code broke the model |
| buggy run | current cfg | 12 | the spec allows it and it breaks `NoDoubleCredit`: the model admits the bug |
| fixed run (second answer leaves credits 1) | fixed cfg | 0 | conforms |

## Spec-derived types

The type-system-discipline principle says: derive types from the authoritative schema; make variant handling exhaustive. Once a spec exists, it is that schema for the flow's states and steps. Today nothing ties code identifiers to it.

The prototype, `spec_types.py` (scratch, about 70 lines, reuses `tlc_chart.read_dot`):

1. `everystate java -cp x tla2sany.xml.XMLExporter Spec.tla` gives variables (`kind 3`), constants (`kind 2`), and actions (`level 2`) with arity.
2. `everystate -dump dot,actionlabels` gives every reachable state. Each variable's type is the union of the values it takes: strings and model values become literal unions, functions keyed by model values become `Partial<Record<K, V>>`, and integers widen to `number`.
3. It emits:

```ts
export interface State {
  card: "unused" | "used";
  credits: number;
  seen: Partial<Record<"t1" | "t2", "none" | "unused" | "used">>;
  ui: Partial<Record<"t1" | "t2", "checking" | "credited" | "form" | "rejected">>;
}
export type Step =
  | { action: "Press"; params?: ["t1" | "t2"]; state?: Partial<State> }
  | { action: "Answer"; params?: ["t1" | "t2"]; state?: Partial<State> }
  | { action: "Done"; params?: []; state?: Partial<State> }
```

`Step` is exactly the shape `everystate conform` reads, so one type covers the logging call and the trace file. `tsc --strict` on a sample that types `observe(step: Step)` and a `never`-checked switch over the UI state:

```
error TS2322: Type '"Submit"' is not assignable to type '"Press" | "Answer" | "Done"'.        // action renamed in code
error TS2322: Type '"refunded"' is not assignable to type '"unused" | "used" | undefined'.   // value the spec never reaches
error TS2322: Type '"rejected"' is not assignable to type 'never'.                           // state the code doesn't handle
```

What each layer catches, cheapest first:

| Layer | Catches | When |
| --- | --- | --- |
| `TypeOK` invariant in the spec (already in our rules) | modelling mistakes inside the spec | model check |
| Spec-derived types + `never` switches | code and spec disagree on names, values, or variant coverage | compile, every edit |
| `everystate conform` on a trace from an integration test | the code takes a step the spec forbids | CI |
| Model check (`tlc_chart.py run`) | the design breaks a promise in some interleaving | when spec or covered code changes |

Prototype limits (inferred from the run):

- Params are typed as the union of all model values, because the shallow XML export carries arity but not parameter names or domains.
- `Done` is a stuttering step (`UNCHANGED vars`), so it never appears as an edge, and the generator marks it "never taken".
- Integers widen to `number`. Value types are only as wide as the bounded model, so a constant raised in production (3 tabs) needs the cfg bound to match, or the type should come from a `TypeOK`-style declared set rather than the observed values.

## Proposed changes to our skills

In order; each lands and is proven on the gift-card example before the next:

1. **Engine switch in `tlc_chart.py`.** Prefer `everystate` (pinned version, sha256 of the native binary or npm integrity) when present, and fall back to Java TLC. `run_tlc` builds `[everystate, "java", …same args…]`, and `require_java` only runs on the Java path. Record the engine and version in the summary line it already prints (`TLC 1.7.4, -workers 1`). Keep Java as the reference for the 30 known mismatches and for state spaces too big for memory. Update `test_tlc_chart.py`, the "Run" bullet in `formal-verification-skill`, and the TLA+ row in `formal-modeling.md`.
2. **`conform` as the code-to-model link** (after npm ships it). Add it to formal-modeling's "Feed generated tests" as step 2's mechanical form: a counterexample replay becomes a trace that must exit 20 against the fixed cfg. Add a "Linked tests" entry to generated `verify-formal-*` skills: an integration test writes `observe()` lines, and CI runs `everystate conform`. This also gives the Audit branch a drift signal beyond reading diffs.
3. **`tlc_chart.py types`** (or a sibling script): emit `<area>.types.ts` (later Python `Literal`/`TypedDict`, Rust enums) from the spec. Generated `verify-formal-*` skills regenerate it in their Run script and fail on a diff, so spec and code types move together. The Update section then says: change the spec, regenerate, let the compiler list every call site.
4. **Optional, not evaluated here:** Quint's static type system or Apalache's Snowcat for typing the spec itself, beyond `TypeOK`.

## Open questions

- `conform`, `-simulate`, `-workers`, and `pcal` are unreleased as of npm 0.3.1. Resolved by building the pinned commit with cargo; move the pin when a release ships them.
- The project is days old (first npm release 2026-11-13). Conformance numbers are the author's. I ran one example, not the corpus.
- Liveness: everystate prints TLC 2.19's "Temporal properties were violated." without naming the property. I haven't checked whether `tlc_chart.py`'s per-rule liveness verdicts survive that.
- I did not read the linked X post (it needs JavaScript to render). The prompt it quotes matches the README's opening example.
