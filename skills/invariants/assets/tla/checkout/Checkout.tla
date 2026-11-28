---- MODULE Checkout ----
EXTENDS Naturals
CONSTANTS Tabs, Orders, MaxRetries
VARIABLES order, ui, charges, retries
vars == <<order, ui, charges, retries>>
Init == /\ order \in [Tabs -> Orders]
        /\ ui = [t \in Tabs |-> "ready"]
        /\ retries = [t \in Tabs |-> 0]
        /\ charges = [o \in Orders |-> 0]
Send(t) == /\ ui[t] = "ready"
           /\ ui' = [ui EXCEPT ![t] = "sent"]
           /\ UNCHANGED <<order, charges, retries>>
Commit(t) == /\ ui[t] = "sent"
             /\ charges' = [charges EXCEPT ![order[t]] = 1]
             /\ ui' = [ui EXCEPT ![t] = "reply"]
             /\ UNCHANGED <<order, retries>>
Answer(t) == /\ ui[t] = "reply"
             /\ ui' = [ui EXCEPT ![t] = "paid"]
             /\ UNCHANGED <<order, charges, retries>>
Lose(t) == /\ ui[t] = "reply"
           /\ ui' = [ui EXCEPT ![t] = "unknown"]
           /\ UNCHANGED <<order, charges, retries>>
Retry(t) == /\ ui[t] = "unknown" /\ retries[t] < MaxRetries
            /\ retries' = [retries EXCEPT ![t] = @ + 1]
            /\ ui' = [ui EXCEPT ![t] = "sent"]
            /\ UNCHANGED <<order, charges>>
Reload(t) == /\ ui[t] = "unknown"
             /\ ui' = [ui EXCEPT ![t] = "loading"]
             /\ UNCHANGED <<order, charges, retries>>
Recover(t) == /\ ui[t] = "loading"
              /\ ui' = [ui EXCEPT ![t] = IF charges[order[t]] > 0 THEN "paid" ELSE "unpaid"]
              /\ UNCHANGED <<order, charges, retries>>
Next == (\E t \in Tabs : Send(t) \/ Commit(t) \/ Answer(t) \/ Lose(t) \/ Retry(t) \/ Reload(t) \/ Recover(t)) \/ UNCHANGED vars
Spec == Init /\ [][Next]_vars /\ (\A t \in Tabs : WF_vars(Recover(t)))
OneCharge == \A o \in Orders : charges[o] <= 1
TruthfulView == \A t \in Tabs : /\ (ui[t] = "paid" => charges[order[t]] > 0)
                                /\ (ui[t] = "unpaid" => charges[order[t]] = 0)
ReloadCompletes == \A t \in Tabs : (ui[t] = "loading") ~> (ui[t] \in {"paid", "unpaid"})
NoOverlap == ~(\E t,u \in Tabs : t # u /\ order[t] = order[u] /\ ui[t] = "sent" /\ ui[u] = "sent")
NoLostRetryReload == ~(\E t \in Tabs : retries[t] = MaxRetries /\ ui[t] = "loading")
NoSecondOrder == ~(\E a,b \in Orders : a # b /\ charges[a] = 1 /\ charges[b] = 1)
====
