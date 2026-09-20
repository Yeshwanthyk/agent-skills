# Optional action classifier

A documentation boundary for advisory action classification, including Jev; no live adapter is enabled here. Unlike the router's [method classifier](../yesh-router/classifier-contract.md), this classifies proposed work, not which skill to load. The [forward-implementation-first principle](principles/forward-implementation-first.md) owns category meanings and execution policy.

## Input and result

Send only bounded, explicitly approved evidence: action ID, intended outcome, proposed effect, affected behavior/dependencies, observed evidence, known product or delivery obligations, and whether the work was requested. Represent unknown facts explicitly. The agent investigates these facts; the evaluator cannot inspect code or infer missing proof. Never transmit full repositories, credentials, or unrestricted logs.

A Jev choice question can ask: “Given only these facts, what is this action's primary purpose?” Options are `implementation`, `validation`, `bookkeeping`, and `uncertain`. Split mixed actions or return `uncertain`. Do not combine a method recommendation with this answer or invent a total correctness score.

An adapter must bind each answer to the exact action and evidence revision, enforce a bounded deadline, and validate one exact allowed choice before use. Revised evidence requires a fresh classification; stale labels cannot carry forward.

## Authority and fallback

- Disabled unless explicitly enabled for the request. External transmission requires permission covering the selected evidence; denied permission means no call.
- Begin in shadow mode: record comparisons without changing actions. Enable advisory use only after representative trials show preserved scope and required checks.
- Timeout, unavailable service, cancellation, malformed answer, stale binding, or `uncertain` falls back to local investigation/judgment without blocking unrelated work.
- A valid label remains advisory. The agent establishes correctness, required integrity/concurrency controls, replay scope, and publication authority. A label grants no permission to skip checks, bypass locks, widen scope, or publish.

## Trial cases

Compare baseline and shadow document loads, proposed actions, and transmission behavior—not label agreement alone:

| Evidence | Expected treatment |
| --- | --- |
| Connect a parser to its consumer | Implementation |
| Check imported counts and rejected rows | Validation |
| Refresh a cosmetic completion badge | Bookkeeping; omission depends on requested scope |
| Verify a required input checksum | Validation; preserve integrity check |
| Acquire the lock protecting concurrent publication | Preserve substantive control; never skip based on its name |
| Replay unchanged stages solely for a missing status receipt | Investigate the receipt's obligations; avoid unsupported replay |
| User explicitly requests the dashboard update | Deliver it; bookkeeping is not a scope veto |
| Missing proof of an earlier result | Limit the unsupported claim; investigate relevant evidence |
| Unknown purpose, stale binding, malformed reply, or timeout | Local fallback; no classifier-directed mutation |
| Disabled classification or denied transmission | No external call; baseline actions preserved |

These are review fixtures, not executed classifier tests. Report actual trials and their limits before enabling an adapter.
