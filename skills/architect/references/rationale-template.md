# Rationale template

Use this structure for the prose that ships beside a larger type sketch. Replace every bracketed prompt with project-specific content.

## Problem

State what the work must do and why the existing system or constraints make the shape non-obvious. Name existing contracts, callers, authorities, and invariants that the design must honor.

## Usage (caller's view)

Write this before the type sketch. Show the consumer-facing quickstart and two or three realistic call sites. Name imports, calls, returned values, and failure handling. The sketch must be derived from this usage.

## Shape

Describe data structures first, then data flow through signatures. State where validation lives, which invariants are encoded in types, which module owns each decision, and what remains exposed. Judge interface depth by the complexity hidden behind the public surface.

## Synthesis decision

Name the candidate that became the base, why it won, what was adapted from other candidates, and what was rejected.

## Tradeoffs accepted

List one tradeoff per bullet. Use the form "We accept X in exchange for Y." Include choices a future reader could mistake for an omission.

## Alternatives considered

Name each distinct shape that lost and why. State what complexity it exposed to callers and what it hid. Include at least one concrete alternative unless the constraints made the chosen shape the only viable answer.

## Open questions and risks

Phrase unresolved decisions as questions. Include risks that could change the target before implementation.

## Next implementation step

State the first file or symbol to build against the sketch.
