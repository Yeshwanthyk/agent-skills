---
name: fuzz-testing
description: Build and run bounded coverage-guided fuzz targets for parsers, codecs, protocols, and untrusted-input boundaries; minimize and replay failures.
---

# Fuzz testing

Explore one real input boundary with coverage feedback and explicit failure detectors. Reuse an existing target and corpus where suitable. Planning or review requests produce a target design or findings; create and run harnesses when implementation is requested.

## Select the target

Name the entry point, accepted input format, expected rejection behavior, and failures to detect: unexpected exceptions, crashes, sanitizer findings, timeouts, or invariant violations. Use [property-testing](../property-testing/SKILL.md) when structured contract exploration is the main need; fuzz targets may also assert those properties.

Read only the matching reference: [TypeScript](references/typescript.md), [Python](references/python.md), or [Rust](references/rust.md). Check the installed runtime, native toolchain, and actual CLI help. A toolchain failure is not evidence about the product.

## Harness and campaign

Feed generated data into production code. Catch only documented input-rejection errors; unexpected failures must escape. Reset mutable state between cases, control nondeterministic dependencies, and use disposable local resources. Keep live services and credentials out of repeated fuzz execution unless an explicitly scoped integration campaign requires them.

Seed with small useful valid and invalid inputs. For deep structured formats, use a structure-aware generator or mutator so cases reach beyond initial parsing. Inspect coverage feedback or a focused probe to confirm the intended code executes.

Choose explicit time, input-size, memory, and timeout limits supported by the tool. Start with a short smoke run; expand only when the task and findings justify it. Record target, runtime/tool version, corpus, command, budget, and any instrumentation limits.

Reproduce failures outside the search loop, minimize the input with the framework, and preserve the original if minimization cannot reproduce it. Classify harness failures separately from product failures. Save the concrete reproducer and command, then add a regression case to the ordinary suite where practical. Production fixes remain within the requested scope.

## Completion

Return observed failures or a bounded no-failure result with replay evidence and coverage limits. Confirm a claimed fix against the saved input. Use short corpus replay/search in an existing gate; scheduled campaigns and CI changes are separate scope decisions. Passing a campaign does not establish correctness or replace real-system integration checks.
