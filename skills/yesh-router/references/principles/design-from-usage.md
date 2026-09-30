# Design from usage

**Read when:** designing an interface, data shape, or workflow that real callers or tasks will drive.

- Start from how the capability is used: dominant calls, inputs, outputs, and failure handling. Design the surface for those uses, not a guessed future.
- Write caller-facing usage before the type or structure sketch. Two or three examples expose different contracts; one suffices for a narrow case.
- Design for observed usage, not speculative edge cases.
- The user is whoever consumes the work: the end user of a UI, the importing colleague of a library, the next maintainer of the code. Judge the design from their seat.

**Limits:** polishing the delivered experience is [experience-first](experience-first.md); sketching and comparing candidate shapes is [exhaust-the-design-space](exhaust-the-design-space.md).