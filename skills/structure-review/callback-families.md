# Review callback families together

A family is the enclosing operation plus its callbacks and helpers that coordinate one lifetime. Include extracted helpers when they still share that state; changing a function boundary does not remove coordination.

1. **Map ownership.** Locate each captured mutable binding and reachable container/attribute. Name initialization, every writer, readers, and cleanup. Distinguish rebinding from in-place mutation and aliases. Include state passed into an extracted helper.
2. **Trace phases.** Follow registration, running, settlement, cancellation and draining as applicable. At every callback invocation, check whether it can run synchronously, reenter a writer, or observe partially published state. State any unknown callback contract explicitly.
3. **Price a change.** Pick a plausible change, such as adding a completion path or altering cancellation order. Name the functions and ordering facts a maintainer must update together. Use source locations and a concrete trace, rather than calling nesting “ugly.”
4. **Compare a whole alternative.** Sketch the smallest genuinely different shape: reduce shared mutable scope, combine a decision at its owner, or give one lifetime an explicit owner. Compare the state, writers, phases, ordering assumptions and navigation required. Moving bodies into helpers or a class without removing coordination is not evidence of improvement. Retain the current shape when the alternative adds more machinery than it removes.
5. **Report separately.** A correctness claim needs a failing behavior or a labeled risk. A maintenance finding needs the family locations, coordination cost, simpler alternative and preservation checks. It can be actionable without a demonstrated runtime defect. Preserve useful contracts, public APIs, boundary validation and safety/provenance explanations.

Static metrics are leads. Attribute existing warnings accurately; distinguish a detector's missing capability from a reviewer declining evidence it already produced. Never equate low scores, fewer lines, fewer `isinstance` calls, fewer loops or fewer `Any` annotations with a better design. Judge each against its contract.
