# Python

Use Atheris. Instrument target imports with `atheris.instrument_imports()` and functions where needed; follow the installed version's `Setup`/`Fuzz` interface. A target normally receives bytes and may use `FuzzedDataProvider` for structured arguments.

Catch expected decode/validation errors only. Confirm the target receives coverage feedback. Complex formats can benefit from a custom mutator; native extension coverage and sanitizers require a compatible instrumented build. Check platform/Python support before installing or rebuilding dependencies.

Use explicit libFuzzer run limits and an artifact location. Replay a saved artifact through the same target, then minimize and retain it. Preserve a deterministic regression test even when a fuzzing toolchain is unavailable in ordinary CI.

Source: [Atheris documentation](https://github.com/google/atheris).
