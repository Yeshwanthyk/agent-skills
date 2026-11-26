# Rust

## Property: proptest

Use proptest with the existing Cargo test layout. Define composable Strategies and use `proptest!` or a configured TestRunner. Prefer construction and dependent strategies over rejection filters. Keep case counts explicit for the selected run; report runner limits that prevent meaningful exploration.

For sequences, generate a Vec of domain operations and execute each against both the real implementation and a small independent model. Normal sequential tests do not explore thread schedules. Retain proptest regression persistence files according to project policy and add concrete regression tests for important failures. Persisted seeds may depend on generator and framework versions; record the minimized values as well.

Sources: [proptest guide](https://proptest-rs.github.io/proptest/), [API](https://docs.rs/proptest/latest/proptest/).

## Property: ephyra

Choose [ephyra](https://github.com/datadog-labs/ephyra) for a new Rust harness when no runner exists yet and the campaign needs coverage reach on stable without cargo-fuzz, or several distinct failures from one long run. It is pre-1.0 with an unfrozen API: pin the exact version and check the installed docs before using an API.

Mark each generator and its domain predicate with `#[ephyra::generator]`, attach shrinkers (`with_shrink`, `derive(Arbitrary)`), and count a run only after `ephyra check` passes; that is the step 3 generator check. Set `.len(..)` explicitly, since the default size stays small. Use the `coverage` feature with `EPHYRA_COVERAGE_FILTER=<crate under test>` to find unreached code, `EPHYRA_FAILURES=n` with `ephyra::signature(..)` for multi-failure runs, and keep the printed `EPHYRA_REPLAY` line plus the shrunk value as the regression. It has no per-test timeout or process isolation: run code that can hang, abort, or overflow the stack in a child process.

Sources: [README](https://github.com/datadog-labs/ephyra), [STARTUP.md](https://github.com/datadog-labs/ephyra/blob/main/STARTUP.md), [API.md](https://github.com/datadog-labs/ephyra/blob/main/API.md) (including "Things that do not exist").

## Fuzz: cargo-fuzz

Use cargo-fuzz and libFuzzer. Inspect `cargo fuzz --help` and the selected subcommand before choosing flags. Confirm nightly toolchain and platform support. Add a target to the existing fuzz crate; initialize one only when the project lacks it.

Use `libfuzzer_sys::fuzz_target!` with bytes, or an `arbitrary::Arbitrary` input for structured exploration. Assert semantic invariants where a panic-free parser could still return wrong results. Keep production code instrumented and document the sanitizer and build configuration.

Use bounded `cargo fuzz run` campaigns, `tmin` for failing-input minimization, and `cmin` for corpus reduction according to the installed CLI. Replay the failure artifact and retain it alongside the target or as a normal Cargo regression test. Coverage reports are meaningful only for the instrumented build exercised.

Sources: [Rust Fuzz Book](https://rust-fuzz.github.io/book/), [cargo-fuzz](https://github.com/rust-fuzz/cargo-fuzz).
