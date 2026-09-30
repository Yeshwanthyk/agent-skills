#!/bin/sh
# Builds the orders fixture as a git repo with meaningful history in $1.
# History matters: `why` cases need commit evidence, `recall`/`blast-radius` need diffs.
set -eu
dest=$1
mkdir -p "$dest/orders" "$dest/tests"
cd "$dest"
git init -q
git config user.name "Fixture"
git config user.email "fixture@example.test"
commit() { git add -A; GIT_AUTHOR_DATE="$1" GIT_COMMITTER_DATE="$1" git commit -qm "$2"; }

cat > README.md <<'MD'
# orders

Tiny order service: pricing, payment retries, order state, and carrier webhooks.
Run tests with `python3 -m unittest`. Run the pricing benchmark with `python3 bench.py`.
MD
cat > orders/__init__.py <<'PY'
PY
cat > orders/pricing.py <<'PY'
def order_total(lines, discounts):
    """Sum line totals, applying the best matching discount per SKU."""
    total = 0
    for line in lines:
        best = 0
        for d in discounts:
            if d["sku"] == line["sku"]:
                best = max(best, d["pct"])
        total += line["qty"] * line["unit_cents"] * (100 - best) // 100
    return total
PY
cat > bench.py <<'PY'
import time
from orders.pricing import order_total

lines = [{"sku": f"s{i}", "qty": 2, "unit_cents": 500} for i in range(3000)]
discounts = [{"sku": f"s{i}", "pct": i % 30} for i in range(3000)]
start = time.perf_counter()
order_total(lines, discounts)
print(f"order_total: {(time.perf_counter() - start) * 1000:.1f} ms")
PY
mkdir -p profiles
cat > profiles/bench.prof.txt <<'PROF'
Captured with: python3 -m cProfile -s cumulative bench.py  (3000 lines, 3000 discounts)
order_total: 171.4 ms
         9006012 function calls in 1.912 seconds

   Ordered by: cumulative time

   ncalls  tottime  percall  cumtime  percall filename:lineno(function)
        1    0.000    0.000    1.912    1.912 bench.py:1(<module>)
        1    1.214    1.214    1.903    1.903 pricing.py:1(order_total)
  9000000    0.689    0.000    0.689    0.000 {built-in method builtins.max}
     3000    0.000    0.000    0.000    0.000 {method 'append' of 'list' objects}
PROF
commit "2026-05-02T10:00:00" "Add pricing with per-SKU discounts"

cat > orders/retry.py <<'PY'
import time

MAX_ATTEMPTS = 5
BACKOFF_SECONDS = 2.0


def charge_with_retry(charge, amount_cents, sleep=time.sleep):
    for attempt in range(1, MAX_ATTEMPTS + 1):
        try:
            return charge(amount_cents)
        except TimeoutError:
            if attempt == MAX_ATTEMPTS:
                raise
            sleep(BACKOFF_SECONDS * attempt)
PY
commit "2026-05-20T09:00:00" "Retry payment charges on timeout"

sed -i.bak 's/MAX_ATTEMPTS = 5/MAX_ATTEMPTS = 3/' orders/retry.py && rm orders/retry.py.bak
cat > docs.md <<'MD'
# Incident INC-212 (2026-06-03)

The payment provider suspended our API key after 4 rapid failed charge attempts
for the same card within 10 seconds. Their fraud rules treat >=4 attempts in 10s
as card testing. Retries are capped at 3 with linear backoff so a single order
can never trip the rule. Do not raise MAX_ATTEMPTS without provider sign-off.
MD
commit "2026-06-04T15:30:00" "Cap charge retries at 3 after INC-212 key suspension (see docs.md)"

cat > orders/state.py <<'PY'
TRANSITIONS = {
    "pending": {"paid", "cancelled"},
    "paid": {"shipped", "refunded", "pending"},
    "shipped": {"delivered"},
    "delivered": set(),
    "cancelled": set(),
    "refunded": set(),
}


def advance(order, new_status):
    if new_status not in TRANSITIONS[order["status"]]:
        raise ValueError(f"illegal transition {order['status']} -> {new_status}")
    order["status"] = new_status
    return order
PY
commit "2026-06-20T11:00:00" "Add order state machine"

cat > orders/webhooks.py <<'PY'
from orders.state import advance

DELIVERIES = []


def handle_carrier_event(order, event):
    """Carrier posts delivery events; they retry on any non-2xx and on timeouts."""
    if event["type"] == "delivered":
        DELIVERIES.append({"order_id": order["id"], "event_id": event["id"]})
        if order["status"] == "shipped":
            advance(order, "delivered")
    return 200
PY
cat > tests/__init__.py <<'PY'
PY
cat > tests/test_webhooks.py <<'PY'
import unittest

from orders import webhooks


class CarrierWebhookTest(unittest.TestCase):
    def setUp(self):
        webhooks.DELIVERIES.clear()

    def test_redelivered_event_records_one_delivery(self):
        order = {"id": "o1", "status": "shipped"}
        event = {"id": "evt_1", "type": "delivered"}
        webhooks.handle_carrier_event(order, event)
        webhooks.handle_carrier_event(order, event)  # carrier retry
        self.assertEqual(len(webhooks.DELIVERIES), 1)
PY
commit "2026-07-08T14:00:00" "Record carrier delivery webhooks"
