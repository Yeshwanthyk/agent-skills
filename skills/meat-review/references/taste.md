# Taste

What this reviewer cares about beyond correctness. Judge the code on its
merits: following an existing pattern is no defense when the pattern is poor.
Say so ("matches the other handlers, which share the same flaw") and name
the better shape; a codebase does not get better by copying its weakest
parts. Apply every section to the
change and report what you find as `findings` with the section as `area`
(`quality`, `structure`, `tests`); flag only what the change introduces or
makes worse, and point at one real line.

This is the shipped baseline. The reviewer's own rules live in
`~/.config/meat-review/taste.md` and a repository's in `.meat-review/taste.md`;
both are appended after this file and win where they disagree. They grow with
`meat_review.py taste add --section <Section> --text "<rule>"`.

## Quality

- Code that does more than the task: speculative options, flags, layers or
  helpers with one caller. Prefer the smallest shape that solves it.
- The same check or shape assumption repeated across call sites instead of
  one place that owns it; repeated null checks, casts or `any`.
- Domain states as loose strings, booleans or nullable bags where a type or
  enum would make bad states impossible.
- Untrusted input used before it is parsed and validated at the boundary;
  errors swallowed, logged and ignored, or turned into a default silently.
- A fix that treats a symptom (retry, sleep, catch-all) where the cause is
  visible in the diff.
- New code that copies a poor local pattern (god functions, stringly typed
  dispatch, copy-pasted blocks, hidden globals) instead of the better one
  the codebase or language already offers.

## Structure

- Mutable state with no clear owner: two writers, caches without
  invalidation, cleanup that depends on call order.
- Responsibility in the wrong module: business rules in views, serializers
  or tests; I/O inside pure helpers.
- A new abstraction that bends the existing design instead of fitting it;
  a migration that leaves old and new paths both live with no plan.

## Tests

Audit every test case the change adds or changes (see the rubric's `tests`).

- Real: drives the code through its public boundary and asserts a result
  that would fail if the change were reverted or broken.
- Weak: asserts too little to catch a regression (only "no exception",
  only that a mock was called, a snapshot nobody reads, one happy path for
  branching logic).
- Fake: mocks or patches the unit under test, computes the expected value
  with the same code, asserts a tautology, is skipped or xfailed, or never
  reaches the changed path.

## Learned

Rules added from review feedback, newest last.
