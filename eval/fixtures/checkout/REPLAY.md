# Checkout reference replay

This checks the fixture, not an agent's generated verification skill. From the repo root on Linux, with Chromium, matching chromedriver and Python Selenium installed (Debian: `apt-get install chromium chromium-driver python3-selenium`):

```sh
/usr/bin/python3 eval/fixtures/checkout/reference.py > checkout-evidence.jsonl
```

The driver stages each variant in an empty temporary directory, starts a loopback server on an assigned port, and clicks Submit then Retry in Chromium. Before retrying, it checks the browser saw an empty response on the checkout POST for the displayed order and SQLite already holds that order. After retrying, it counts payments directly in SQLite and separately reads the visible receipt after a browser refresh. Each run owns its database, app process and browser session; the JSON lines remain after teardown.

After refresh the driver waits for `data-reconciled` on the **new document**: the receipt request succeeded, its JSON was read, and the UI callback finished. Only then does it inspect the status and receipt. The spinner mutant skips the final render, not the lookup or checkpoint. A missing checkpoint is a failed drive, not proof of a stuck view.

Exit zero requires four distinct signatures: good passes, duplicate adds one payment but renders the correct receipt, stale shows `previous-order`, and spinner still shows `Loading receipt…` with no receipt after reconciliation. All four must demonstrate the first response drop. Browser or launch failures are errors, not detected mutants.
