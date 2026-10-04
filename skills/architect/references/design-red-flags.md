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


The checks below assume the next contributor is an agent that sees only the files it opened, copies the nearest example, and takes the shortest path that compiles.

## Split ownership

More than one module writes the same state or keeps its own copy of it. An agent editing one writer cannot see the others, so their rules drift apart. Give each piece of state one owner; other modules read it or ask the owner to change it.

## Two ways to do one task

The design supports more than one way to do the same task. An agent copies whichever way it finds first, so every way keeps gaining callers. Keep one way, move callers off the others, and delete them in the same change.

## Importable internals

A caller can import a module's internals. An agent takes the shortest path that compiles, so the internals become part of the interface. Make them unreachable from outside the module so an outside import fails the build.

## Hand-synced list

Two or more places list the same items, and adding an item means editing every list. An agent that sees one list updates only that one. Keep one list and derive the others; when a list cannot be derived, make the build fail when the lists disagree.
