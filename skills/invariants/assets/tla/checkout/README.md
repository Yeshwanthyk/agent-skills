# Checkout after a lost response

Run `python3 test_checkout.py` here. The script calls the skill's current `tla_chart.py run`. A missing checker, an unchecked rule, or a different rule failing is a failed test. Scratch copies introduce one defect at a time; the checked-in model has none.

A tab sends an order; the provider commits before its reply can arrive or disappear. Retry submits the same order. Reload forgets the reply and reads the order's durable status. Tabs may share an order or place different ones. The provider makes the check and charge atomic per order; it does not deduplicate globally. `charges` counts effects, not requests.

| Question | How to falsify the claim |
|---|---|
| Can two requests overlap on the same order? | Reach two sent tabs before either commits. |
| Can a committed request lose its reply, retry, lose again and reload? | Reach loading with a positive retry count. |
| Is a genuinely different order allowed to charge? | Reach one charge on each of two distinct orders. |
| At most one charge per order? | Increment on every commit. |
| Does a settled view agree with the provider? | Reverse the reload lookup. |
| Does a started reload eventually finish? | Disable the recovery action. |

Two tabs and one retry per tab expand to three tabs and two retries, with two order identities at both bounds. Safety does not need delivery or scheduler fairness. Progress starts **after** reload: the lookup is available and a continuously enabled recovery eventually runs (weak fairness per tab). No eventual retry, payment, or delivery is assumed. Stuttering is intentional: absence of deadlock is not the progress claim. This invented model excludes provider outages during lookup, stale replicas, refunds, and implementation/browser conformance.
