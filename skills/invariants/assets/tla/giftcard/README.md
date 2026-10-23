# Gift card, two tabs

An invented example of the statechart → TLC → marked statechart path. One gift card is redeemed from two browser tabs. The current code reads the card, awaits, then writes, so both tabs can credit it. The fix writes conditionally, re-checking the card in the same step.

```sh
python3 ../../../scripts/tlc_chart.py run GiftCard.tla --viz chart.viz --fix GiftCardFixed.cfg
```

Expected: the current model fails `NoDoubleCredit` in 4 steps, and the fixed model is clean. In `chart.checked.viz`, `redeem` and `reuse` work, `twotabs` is fixed, a `!` path ends at "The card paid out twice", and `dropped` is unreached because the model has no network failure.
