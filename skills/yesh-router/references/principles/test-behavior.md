# Test behavior

**Read when:** choosing what a test or check should assert.

- Test behavior through the real public boundary with an independently specified expected result or invariant.
- Assertions must fail when the relevant behavior is broken or missing. Computing the expectation with the same implementation does not establish correctness.
- A passing test that never exercises the claimed path proves nothing about it.

**Limits:** whether the evidence already suffices is [evidence-discipline](evidence-discipline.md); how much testing a claim deserves follows its risk, not a template.