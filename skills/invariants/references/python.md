# Python

## Property: Hypothesis

Use Hypothesis with the project's runner. Compose strategies under `@given`; set an appropriate `max_examples` through project profiles or `@settings`. Keep fixture state isolated per generated example: a test-runner fixture does not reset between Hypothesis calls.

Use `RuleBasedStateMachine` for generated action sequences and invariants. Build constraints into strategies where practical; investigate excessive filtering or deadline failures before disabling health checks. Preserve the example database according to project conventions and promote important failures to explicit `@example` cases or ordinary regression tests. Record the reproduction blob and version when available; concrete regression inputs survive framework upgrades more reliably.

Sources: [Hypothesis](https://hypothesis.readthedocs.io/en/latest/), [stateful testing](https://hypothesis.readthedocs.io/en/latest/stateful.html).

## Fuzz: Atheris

Use Atheris. Instrument target imports with `atheris.instrument_imports()` and functions where needed; follow the installed version's `Setup`/`Fuzz` interface. A target normally receives bytes and may use `FuzzedDataProvider` for structured arguments.

Catch expected decode and validation errors only. Confirm the target receives coverage feedback. Complex formats can benefit from a custom mutator; native extension coverage and sanitizers require a compatible instrumented build. Check platform and Python support before installing or rebuilding dependencies.

Use explicit libFuzzer run limits and an artifact location. Replay a saved artifact through the same target, then minimize and retain it. Keep a deterministic regression test even when the fuzzing toolchain is unavailable in ordinary CI.

Source: [Atheris documentation](https://github.com/google/atheris).
