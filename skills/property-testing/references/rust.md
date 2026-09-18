# Rust

Use proptest with the existing Cargo test layout. Define composable Strategies and use `proptest!` or a configured TestRunner. Prefer construction and dependent strategies over rejection filters. Keep case counts explicit for the selected run; report runner limits that prevent meaningful exploration.

For sequences, generate a Vec of domain operations and execute each against both the real implementation and a small independent model. Normal sequential tests do not explore thread schedules. Retain proptest regression persistence files according to project policy and add concrete regression tests for important failures. Persisted seeds may depend on generator/framework versions; record the minimized values as well.

Sources: [proptest guide](https://proptest-rs.github.io/proptest/), [API](https://docs.rs/proptest/latest/proptest/).
