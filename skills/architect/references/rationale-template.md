# Rationale template

Use this structure for the prose that ships beside a larger type sketch. Replace every bracketed prompt with project-specific content.

## Problem

State what the work must do and why the existing system or constraints make the shape non-obvious. Name existing contracts, callers, authorities, and invariants that the design must honor.

## Usage (caller's view)

Write this before the type sketch. Show consumer-facing usage and the call sites that expose the contract. Name imports, calls, returned values, and failure handling. Derive the sketch from this usage.

## Shape

Describe data structures first, then data flow through signatures. State where validation lives, which invariants are encoded in types, which module owns each decision, and what remains exposed. Judge interface depth by the complexity hidden behind the public surface.

## Synthesis decision

Name the candidate that became the base, why it won, what was adapted from other candidates, and what was rejected.

## Tradeoffs accepted

List one tradeoff per bullet. Use the form "We accept X in exchange for Y." Include choices a future reader could mistake for an omission.

## Alternatives considered

Name material alternatives that lost and why. State what complexity each exposed to callers and what it hid. If no meaningful alternative existed, say why.

## Open questions and risks

Phrase unresolved decisions as questions. Include risks that could change the target before implementation.

## Next implementation step

State the first file or symbol to build against the sketch.
