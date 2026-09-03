# Feature

**You own the design, review, and proof.** Use this playbook for new or changed behavior.

1. Run `how` over the affected subsystem. Record entry points, ownership, contracts, state changes, and proof seams.
2. Use `architect` for target-shape exploration before code crosses a function boundary. Skip only when the change is mechanical or the existing shape is already explicit. Record the skip reason.
3. Write the throughput checkpoint as four todo items before fan-out.
   - Blocking first steps. Run gates before parallel work.
   - Independent workstreams. Parallelize disjoint files, services, or layers. Serialize shared writes.
   - Shared mutable state. Split the write target unless one shared writer is a real invariant.
   - Smallest safe decomposition. Use one owner when a coupled change needs one coherent diff.
4. Name the data shape before writing logic. Choose a state machine, typed model, registry, reducer, or plain local structure with `model-the-domain`.
5. Delegate code-writing through the current managed runtime when it reduces error or context load. Give the worker exclusive paths, the chosen data shape, acceptance criteria, and proof. Review the diff yourself. Use `arena` when several complete shapes are genuinely viable.
6. Verify the changed behavior on the matching real surface. Exercise the initiating action, resulting state, and material side effect. Run focused tests, type checks, and lint.
7. Move through small ordered units. Verify and commit each unit before starting the next. Use `interrogate` before shipping when the design remains contested.
8. Run `opening-a-pr` after verification. Publication still follows the authorization boundary.

## Completion

The changed behavior passes its owning boundary proof, the chosen shape is documented, and the ordered commits are ready.

**Reply:** what changed, the data shape, the chosen design and reason, verification, open decisions, and authorization gates.
