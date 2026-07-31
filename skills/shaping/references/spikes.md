# Shaping Spikes

Use a spike when a bounded uncertainty about the existing system or a proposed mechanism blocks a fit decision.

Create each spike as a separate Markdown file. Keep the decision in the shaping document; the spike owns only the evidence needed for that decision.

```markdown
# B3 Spike: History restoration

## Context
Why this uncertainty matters to the shape.

## Goal
The concrete system knowledge the investigation must produce.

## Questions

| ID | Question |
| --- | --- |
| B3-Q1 | Where is query state parsed on initial navigation? |
| B3-Q2 | Which path runs on browser history restoration? |

## Acceptance
Complete when we can trace initial navigation and history restoration from browser event to rendered results.
```

## Question design

Ask for mechanics and evidence:

- where behavior is owned;
- which contracts and state participate;
- what path produces the effect;
- which constraints alter the candidate mechanism; and
- what concrete changes the mechanism would require.

Acceptance names the understanding the spike will produce, not the decision that follows. Investigate the live system before proposing additions; existing behavior may already satisfy the requirement.

## Feeding back

When the spike completes:

1. cite the evidence in its answers;
2. update the affected part and clear or retain its flag;
3. rerun affected fit-check cells;
4. add any newly discovered requirement as a standalone R; and
5. apply the artifact ripple rules.
