---- MODULE Skeleton ----
\* Copy to <Area>.tla, rename the module, and replace each <...>.
\* Cite the file and symbol each variable and action models.
EXTENDS Naturals, FiniteSets
CONSTANTS Actors, Fix              \* Fix = TRUE switches on the candidate fix

VARIABLES store,                   \* authoritative state: <file:symbol>
          local,                   \* what each actor read and still holds
          ui                       \* chart variable: actor -> statechart node id
vars == <<store, local, ui>>

Init == /\ store = "<initial>"
        /\ local = [a \in Actors |-> "none"]
        /\ ui = [a \in Actors |-> "<start node>"]

\* One action per statechart edge. An action is atomic: one lock or one
\* transaction, with no await or I/O inside. When the code awaits between a read
\* and a write, they are two actions.
Read(a) == /\ ui[a] = "<start node>"
           /\ local' = [local EXCEPT ![a] = store]
           /\ ui' = [ui EXCEPT ![a] = "<middle node>"]
           /\ UNCHANGED store

Write(a) == /\ ui[a] = "<middle node>"
            /\ LET ok == IF Fix THEN store = "<initial>" ELSE local[a] = "<initial>"
               IN IF ok THEN /\ store' = "<done>"
                             /\ ui' = [ui EXCEPT ![a] = "<success node>"]
                        ELSE /\ ui' = [ui EXCEPT ![a] = "<refusal node>"]
                             /\ UNCHANGED store
            /\ UNCHANGED local

\* The flow is over for every actor. A state with no step out is a deadlock, which
\* TLC reports: a stuck user is a bug, a finished one is not. List the end nodes.
Done == /\ \A a \in Actors : ui[a] \in {"<success node>", "<refusal node>"}
        /\ UNCHANGED vars

\* A disjunction of named actions, so each trace step names the edge it took.
Next == (\E a \in Actors : Read(a) \/ Write(a)) \/ Done

\* One invariant per harm, named after what must stay true. The chart's harm
\* node carries `fails: <InvariantName>`.
Safe == TRUE
====
