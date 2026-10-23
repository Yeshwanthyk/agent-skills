---- MODULE GiftCard ----
\* Invented example: one gift card, redeemed from two browser tabs at once.
\* `ui` is the chart variable: each tab's node on chart.viz.
EXTENDS Naturals
CONSTANTS Tabs, Fix
VARIABLES card, credits, seen, ui
vars == <<card, credits, seen, ui>>

Init == /\ card = "unused"
        /\ credits = 0
        /\ seen = [t \in Tabs |-> "none"]
        /\ ui = [t \in Tabs |-> "form"]

\* Press Redeem: the server reads the card. The read and the write are separate
\* actions because the handler awaits between them.
Press(t) == /\ ui[t] = "form"
            /\ seen' = [seen EXCEPT ![t] = card]
            /\ ui' = [ui EXCEPT ![t] = "checking"]
            /\ UNCHANGED <<card, credits>>

\* The write. Buggy: decides on the earlier read. Fix: a conditional write that
\* re-checks the card in the same step (UPDATE ... WHERE state = 'unused').
Answer(t) == /\ ui[t] = "checking"
             /\ LET ok == IF Fix THEN card = "unused" ELSE seen[t] = "unused"
                IN IF ok
                   THEN /\ card' = "used" /\ credits' = credits + 1
                        /\ ui' = [ui EXCEPT ![t] = "credited"]
                   ELSE /\ ui' = [ui EXCEPT ![t] = "rejected"]
                        /\ UNCHANGED <<card, credits>>
             /\ UNCHANGED seen

Next == \E t \in Tabs : Press(t) \/ Answer(t)

\* Harm: the card pays out twice.
NoDoubleCredit == credits <= 1
====
