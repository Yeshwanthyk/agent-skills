# Donor choice and lockfile drift

Each cloned directory comes from the checkout whose lockfile matches the new worktree's, so a branch with different dependencies gets the right `node_modules` or `target/`, and a fresher build in a sibling worktree beats a stale main.

## Behaviors

- DONOR-1: with the same `Cargo.lock`, the checkout with the freshest `target/*/deps` donates.
- DONOR-2: a matching `Cargo.lock` beats a fresher build under a different one.
- DONOR-3: `node_modules` comes from the checkout with the same `pnpm-lock.yaml`.
- DONOR-4: a `target/` main does not have is cloned from the worktree that does.
- DRIFT-1: a lockfile no checkout shares is logged ("Cargo.lock matches no checkout").
- DRIFT-2: `hook.drift` runs in the new worktree with `COWT_DRIFT` listing the drifted paths.
- DRIFT-3: no drift hook when some checkout shares the lockfile.

## Drive

`proof.sh --only DONOR` and `proof.sh --only DRIFT`. Scratch repos `rs` (fake targets, lockfile branch `lock2`), `nd` (pnpm lockfile, branch `b2`), `ro` (main's `target/` removed after the first worktree).

## Proof

Marker file contents in the cloned directory say which checkout donated; `.drift-ran` holds `COWT_DRIFT`; the drift log line is read from `log.txt`.

## Gotchas

- Freshness comes from mtimes. The tests set them with `touch -t`, because cloned files keep their donor's mtimes and would otherwise tie.
- A worktree created before the lockfile branch exists is a donor too. Order the setup so each check has exactly the donors it means to compare.
