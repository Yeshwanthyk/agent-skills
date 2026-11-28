# Checkout reference replay

This checks the fixture, not an agent's generated verification skill. From the repo root on Linux, with Chromium, matching chromedriver and Python Selenium installed (Debian: `apt-get install chromium chromium-driver python3-selenium`):

```sh
/usr/bin/python3 eval/fixtures/checkout/replay.py > checkout-evidence.jsonl
```

The driver stages each variant in an empty temporary directory, starts a loopback server on an assigned port, and clicks Submit then Retry in Chromium. Before retrying, it checks the browser saw an empty response on the checkout POST for the displayed order and SQLite already holds that order. After retrying, it counts payments directly in SQLite and separately reads the visible receipt after a browser refresh. Each run owns its database, app process and browser session; the JSON lines remain after teardown.

Exit zero requires the good variant to pass both checks, duplicate to fail only the payment check, and stale to fail only the refreshed receipt check. All three must demonstrate the first response drop. Browser or launch failures are errors, not detected mutants.
