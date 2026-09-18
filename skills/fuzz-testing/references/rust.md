# Rust

Use cargo-fuzz and libFuzzer. Inspect `cargo fuzz --help` and the selected subcommand before choosing flags. Confirm nightly/toolchain and platform support. Add a target to the existing fuzz crate; initialize one only when the project lacks it.

Use `libfuzzer_sys::fuzz_target!` with bytes, or an `arbitrary::Arbitrary` input for structured exploration. Assert semantic invariants where a panic-free parser could still return wrong results. Keep production code instrumented and document sanitizer/build configuration.

Use bounded `cargo fuzz run` campaigns, `tmin` for failing-input minimization, and `cmin` for corpus reduction according to the installed CLI. Replay the failure artifact and retain it alongside the target or as a normal Cargo regression test. Coverage reports are meaningful only for the instrumented build exercised.

Sources: [Rust Fuzz Book](https://rust-fuzz.github.io/book/), [cargo-fuzz](https://github.com/rust-fuzz/cargo-fuzz).
