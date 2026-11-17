# Linux: btrfs and XFS

Linux has no one-call directory clone, so cowt reflinks a plain directory with 8 parallel `cp --reflink` workers, and snapshots a btrfs subvolume in one call. `cowt subvol` turns the main checkout's seeded directories into subvolumes.

## Behaviors

- LINUX-1: a plain directory clones with parallel reflinks: every entry, dotfiles (`.bin`, `.package-lock.json`), symlinks, and nested `node_modules`.
- LINUX-2: writes in the clone leave main untouched.
- LINUX-3: `cowt subvol` makes each seeded directory a subvolume (inode 256) with the same contents, and leaves no `.cowt-old`.
- LINUX-4: `cowt subvol` again logs "already a subvolume".
- LINUX-5: a seed from a subvolume is a writable snapshot, isolated from main.
- LINUX-8: a subvolume donor beats a fresher plain copy with the same lockfile.
- LINUX-6: `cowt status` marks `node_modules (subvolume)`.
- LINUX-7: `cowt remove` then `cowt gc` delete a snapshot-seeded worktree without root.

## Drive

On a Linux machine with `btrfs-progs`, with scratch on btrfs (`/tmp` is often tmpfs, which has no reflinks):

```sh
TMPDIR=~/.cache/cowt-bench/tmp sh proof.sh --bin /path/to/cowt --only LINUX
```

Scratch repo `lx`: `mkrepo` plus a `package-lock.json`, `.bin`, and 30 packages. A content signature (`find` listing plus file bytes) is compared before and after each clone. Elsewhere the group prints `SKIP LINUX-*`.
