# Interrupted checkout
A customer can recover confirmation without paying twice.

## Behaviors and user entry points
- C1: Open checkout at `/` and submit the displayed order.
- C2: Retry from the connection-lost message.
- C3: Return by loading the resulting `/#receipt` URL again.

## Drive
With doctor green, click **Submit order**. Expect a connection-lost message and one $25 payment already committed. Click **Retry**: expect confirmation and a receipt matching that payment ID, order and amount. Reload the receipt page: the same receipt should return without another submission.

## Proof
`journey.txt` records controls, actual browser traffic, receipt text and ledger snapshots. There must be exactly one matching payment throughout recovery.

## Gotchas
Use a new database: a previously paid order skips the interruption. A receipt visible before reload does not prove the return path. A healthy server alone does not prove any checkout behavior.
