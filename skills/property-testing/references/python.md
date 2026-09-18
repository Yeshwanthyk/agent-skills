# Python

Use Hypothesis with the project's runner. Compose strategies under `@given`; set an appropriate `max_examples` through project profiles or `@settings`. Keep fixture state isolated per generated example, rather than assuming a test-runner fixture resets between Hypothesis calls.

Use `RuleBasedStateMachine` for generated action sequences and invariants. Build constraints into strategies where practical; investigate excessive filtering or deadline failures before disabling health checks. Preserve the example database according to project conventions and promote important failures to explicit `@example` cases or ordinary regression tests. Record the reproduction blob/version when available; concrete regression inputs survive framework upgrades more reliably.

Sources: [Hypothesis](https://hypothesis.readthedocs.io/en/latest/), [stateful testing](https://hypothesis.readthedocs.io/en/latest/stateful.html).
