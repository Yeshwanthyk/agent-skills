# Gift card, two tabs

An invented example of the statechart → TLC → marked statechart path. One gift card is redeemed from two browser tabs. The current code reads the card, awaits, then writes, so both tabs can credit it. The fix writes conditionally, re-checking the card in the same step.

```sh
python3 ../../../scripts/tlc_chart.py run GiftCard.tla --viz chart.viz --fix GiftCardFixed.cfg
```

Expected: the current model breaks `NoDoubleCredit` in 4 steps (t1 Press, t2 Press, t1 Answer, t2 Answer, the same on every run), deadlock holds because `Done` lets finished tabs stand still, and the fixed model is clean. In `chart.checked.viz`, `redeem` and `reuse` work, `twotabs` is fixed, a `!` path ends at "The card paid out twice", and `dropped` is unreached. The script also reports `checking -> offline` as an arrow the model never takes: the model has no network failure, which is a gap to close or to state in the hand-off.
