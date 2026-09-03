# Design red flags

Use these checks when comparing candidate architectures. A red flag calls for revision or rejection.

## Shallow module

A shallow module exposes a large interface while hiding little complexity.

Look for callers that coordinate several methods for one operation, public options that expose internal stages, or an interface that does not save callers from learning the implementation. Prefer a small interface backed by substantial capability.

## Information leakage

Information leakage repeats one internal decision across modules. Storage schemas, transport types, framework objects, and protocol details should stay behind adapters. Parse them into domain types at the boundary.

## Temporal decomposition

Temporal decomposition organizes modules by execution order rather than owned knowledge. Separate load, validate, transform, and save stages often repeat one representation and its invariants. Group code around domain decisions and ownership.

## Pass-through method

A pass-through method forwards the same arguments to another method with the same shape. Remove it unless the boundary adds policy, adaptation, or a distinct abstraction.
