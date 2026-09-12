# Structure Review References

Load this file only when a finding needs deeper design context or source attribution. These references are heuristics, not mandatory architecture rules.

## Complexity, modules, and locality

- [John Ousterhout — A Philosophy of Software Design](https://stanford.edu/~ouster/cgi-bin/aposd.php): deep modules, cognitive load, and reducing shallow abstractions.
- [Ousterhout versus Clean Code](https://github.com/johnousterhout/aposd-vs-clean-code): discussion of module depth and design trade-offs.
- [Carson Gross — Locality of Behaviour](https://htmx.org/essays/locality-of-behaviour/): keeping behavior discoverable near the code that uses it.
- [The Grug Brained Developer](https://grugbrain.dev/): pragmatic complexity control and caution against premature factoring.
- [Joel Spolsky — Don't Let Architecture Astronauts Scare You](https://www.joelonsoftware.com/2001/04/21/dont-let-architecture-astronauts-scare-you/): keeping architecture proportional to the real problem.

## Boundaries, types, and invariants

- [Gary Bernhardt — Boundaries](https://www.destroyallsoftware.com/talks/boundaries): separating functional core decisions from imperative shell mechanics.
- [Gary Bernhardt — Functional Core, Imperative Shell](https://www.destroyallsoftware.com/screencasts/catalog/functional-core-imperative-shell): keeping domain transformations independent from side effects where useful.
- [Scott Wlaschin — Making Illegal States Unrepresentable](https://fsharpforfunandprofit.com/posts/designing-with-types-making-illegal-states-unrepresentable/): using types to make valid states explicit.
- [Domain Modeling Made Functional](https://pragprog.com/titles/swdddf/domain-modeling-made-functional/): type-driven domain modeling and explicit boundaries.
- [Alexis King — Parse, Don't Validate](https://lexi-lambda.github.io/blog/2019/11/05/parse-don-t-validate/): parse external data into trusted values at the boundary.
- [Eiffel — Design by Contract and Assertions](https://www.eiffel.org/doc/solutions/Design_by_Contract_and_Assertions): preconditions, postconditions, assertions, and invariants.

## Pragmatic abstraction and evolutionary design

- [Martin Fowler — Replace Nested Conditional with Guard Clauses](https://refactoring.com/catalog/replaceNestedConditionalWithGuardClauses.html): keeping the valid path flat when early exits clarify it.
- [Martin Fowler — YAGNI](https://martinfowler.com/bliki/Yagni.html): avoiding speculative capabilities and abstractions.
- [Martin Fowler — Transaction Script](https://martinfowler.com/eaaCatalog/transactionScript.html): using a direct use-case workflow when it is the simplest honest shape.
- [Martin Fowler — Beck Design Rules](https://martinfowler.com/bliki/BeckDesignRules.html): after correctness, intention, and duplication, prefer fewer concepts and moving parts.
- [Sandi Metz — The Wrong Abstraction](https://sandimetz.com/blog/2016/1/20/the-wrong-abstraction): duplication can be cheaper than the wrong abstraction.
- [Kent C. Dodds — AHA Programming](https://kentcdodds.com/blog/aha-programming): Avoid Hasty Abstractions; wait for real use cases to reveal the common shape.
- [Dan Abramov — Goodbye, Clean Code](https://overreacted.io/goodbye-clean-code/): why removing duplication can make future changes harder.
- [Casey Muratori — Semantic Compression](https://caseymuratori.com/blog_0015): make code usable before making it reusable.

## Use cases and architecture boundaries

- [Jimmy Bogard — Vertical Slice Architecture](https://www.jimmybogard.com/vertical-slice-architecture/): organize around use cases instead of mandatory controller-service-repository chains.
- [Alistair Cockburn — Hexagonal Architecture](https://alistair.cockburn.us/hexagonal-architecture/): ports and adapters as a boundary technique when it provides a real benefit.
- [Robert C. Martin — Screaming Architecture](https://blog.cleancoder.com/uncle-bob/2011/09/30/Screaming-Architecture.html): let the system reveal its domain and use cases rather than its framework.

## Encapsulation and behavior ownership

- [Martin Fowler — Tell, Don't Ask](https://martinfowler.com/bliki/TellDontAsk.html): keep state and behavior with the object or module that owns the invariant.

## Verification

Use these references to support a concrete finding, not to prescribe a testing framework or a universal test-pyramid shape. Prefer tests that exercise stable behavior and observable outcomes over tests coupled to incidental implementation details.
