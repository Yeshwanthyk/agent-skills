# Classifier contract

This is a portable boundary for an optional, advisory classifier. It defines no live adapter. A future Jev adapter may implement this boundary, but Jev is not part of the contract.

## Request

The caller supplies one bounded request:

- `approved_request_context`: the bounded request content and metadata approved for classification.
- `active_objective`: the objective currently being routed.
- `eligible_methods`: unique `{method_id, short_description}` entries from the current catalog projection.
- `catalog_version`: the exact version derived from the sibling [`methods.md`](methods.md). The catalog remains the single source of truth; this contract maintains no copy.
- `deadline`: a hard, bounded decision deadline.

The eligible projection excludes explicit-only methods unless the request explicitly asks for them. Descriptions help classify; they do not create methods or permissions. No request content may be transmitted outside its approved boundary without explicit permission.

## Result

Return exactly one complete envelope, with no unknown fields. `result` has one of these exact shapes:

```text
{
  "catalog_version": "<echoed input version>",
  "result": { "kind": "suggested", "method_id": "<eligible id>" }
}
{
  "catalog_version": "<echoed input version>",
  "result": { "kind": "direct" }
}
{
  "catalog_version": "<echoed input version>",
  "result": { "kind": "abstain" }
}
{
  "catalog_version": "<echoed input version>",
  "result": { "kind": "unavailable" }
}
```

`result` is exactly one of:

- `suggested(method_id)`: an advisory recommendation for an exact eligible method ID.
- `direct`: no method recommendation is needed; use ordinary agent routing.
- `abstain`: classification ran but has no safe recommendation; use ordinary agent routing.
- `unavailable`: classification was disabled, could not complete, or produced no valid result; use ordinary agent routing.

A suggestion never overrides scope, permissions, safety checks, or the receiving agent. The agent may reject it and continue with normal routing.

## Precedence and fallback

1. **Disabled by default.** Unless explicitly enabled for the request, skip classification and use ordinary routing. Do not transmit request content merely to discover that it is disabled.
2. **Explicit method selection bypasses classification.** Validate and honor an explicit eligible method through the normal method path; an unknown or ineligible explicit selection is handled as unavailable, never reinterpreted as a classifier suggestion.
3. **Filter scope before classification.** Do not suggest an unrequested explicit-only activity.
4. Invoke only with the bounded inputs and stop at the deadline. Timeout, cancellation, unavailable execution, external-transmission denial, or any other failure falls back immediately to ordinary agent routing.
5. Validate before using a result:
   - required input fields are present and bounded;
   - eligible IDs are non-empty and unique;
   - the returned `catalog_version` exactly equals the input version;
   - the envelope and result match the schema and are complete; and
   - a `suggested` ID is an exact member of the current eligible set.

Unknown or stale IDs, a stale catalog version, malformed or incomplete output, and any validation failure produce `unavailable` and the normal routing path. Never invent, normalize, or silently refresh an ID or catalog.

## Shadow evaluation

Run the classifier in shadow mode against the same fixtures as ordinary routing. Shadow output must not change the live route or perform side effects. Local fixtures perform no external request-content transmission. A real external shadow may transmit request content only when explicit permission covers that evaluation; otherwise it is unavailable and transmits nothing. Evaluate behavior, not label agreement alone:

- **Document loads:** For each fixture, record baseline and revised document-load traces: which skills, principles, and references were loaded, under what condition, and in what order. Compare the traces and resulting route; do not reduce this check to classifier labels.
- **Actions:** Trace the actions actually performed for ordinary objectives, explicit method bypass, ambiguous objectives, agent rejection, and permitted versus denied external transmission; compare the resulting route and action set with the baseline.
- **Scope:** in- and out-of-scope objectives, narrow and broad objectives, requested and unrequested explicit-only activities, and permission boundaries.
- **Faults:** unknown ID, stale catalog version, malformed or incomplete result, timeout, `abstain`, `unavailable`, and disabled mode.
- **Performance (secondary):** empty, typical, and peak eligible-list sizes; short and maximum-bounded contexts; expected request rates; decision latency and deadline adherence.

A passing report shows that invalid or stale suggestions are never accepted, every fault reaches bounded normal routing, explicit bypass and scope rules hold, and disabled mode has parity with the baseline in route, side effects, and request-content transmission. Record the comparison and load/deadline measurements before enabling the classifier.
