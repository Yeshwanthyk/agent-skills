---
name: verify-checkout
description: Verify the checkout web UI when a payment commits but confirmation is interrupted, including retry and receipt reload.
---

## Launch
From the checkout repo root run `sh .claude/skills/verify-checkout/run.sh`. On Debian install `chromium chromium-driver python3-selenium` first. The runner launches `app.py` on an OS-assigned loopback port with a new SQLite database, waits for its listening URL, then uses a private headless Chrome profile. No credentials or shared server required.

## Doctor
Before clicking, the runner reads the new server's empty ledger and checks the checkout title, displayed order and $25 total. This establishes readiness, not successful payment.

## Drive
Follow [the interrupted checkout recipe](features/interruption.md). The runner only submits through browser buttons and returns by reloading the receipt URL.

## Evidence
Read stdout or `journey.txt` in the printed evidence directory. Compare browser requests, displayed receipts and the independent ledger before and after each action. Only exit zero indicates success.

## Cleanup
The runner closes WebDriver, terminates its own server and removes its database and profile. Parallel runs use independent state. The printed evidence directory retains the transcript and server log; remove that directory when no longer needed. After any failure rerun from the beginning with fresh state and doctor.

## Features
[Feature index](features/README.md)
