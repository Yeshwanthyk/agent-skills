# Cargo target seeding

A new worktree of a Rust repo starts with the main checkout's compiled dependencies, so its first `cargo build` compiles only the worktree's own crates.

## Behaviors

- CARGO-1: `target/` beside a root `Cargo.lock` is cloned with no config.
- CARGO-2: `target/` beside a nested `Cargo.lock` (depth up to 4) is cloned.
- CARGO-3: `copy.cargo = false` skips it.
- CARGO-4: when every donor's `target/` stays locked (`.cargo-build-lock`, `.cargo-artifact-lock`, `.cargo-lock`) past `copy.cargowait`, it is skipped after the wait; other targets are still cloned.
- CARGO-5 (needs `cargo`): after editing a file the build reads, `cargo build --offline` in the worktree produces the worktree's output, not main's.
- CARGO-6 (needs `cargo`): a build script with an absolute `rerun-if-changed=$CARGO_MANIFEST_DIR/...` tracks the worktree's file on later edits, and main's binary is untouched.
- CARGO-7: a busy main yields to an idle sibling with the same lockfile, without waiting it out.
- CARGO-8: a build that finishes within `copy.cargowait` is waited for, then cloned.
- REAL-3 (`--real` on a Rust repo): the first `cargo build` in the seeded worktree compiles no more units than there are workspace members. Metrics: `real_cargo_build_seconds`, `real_cargo_fresh`, `real_cargo_compiled`, `real_cargo_members`.

## Drive

`proof.sh --only CARGO`. CARGO-1..4, 7, 8 use a fake `target/` and need no Rust toolchain. CARGO-5..6 build a dependency-free crate with a build script, using the real `CARGO_HOME`, offline. `proof.sh --only REAL --real <rust repo>` for REAL-3; build main first with plain `cargo build`.

## Proof

File contents read from the new worktree, absence of `target/` for CARGO-3/4, and the built binary's stdout for CARGO-5.

## Gotchas

- REAL-3 fails if main's `target/` was built with other flags or features (for example `cargo build --workspace`): dependencies then get new unit hashes and compile again. That is a property of Cargo, not a cowt bug; rebuild main with plain `cargo build` before measuring.
- CARGO-4/7/8 hold the lock from a background python `flock`, the same lock kind cargo takes. Cargo 1.98 holds `.cargo-build-lock` and `.cargo-artifact-lock` during a build, not `.cargo-lock`.
- CARGO-5 sleeps 1s between the main build and the checkout so source mtimes are strictly newer than the fingerprints. Real use has far more than 1s between them.
