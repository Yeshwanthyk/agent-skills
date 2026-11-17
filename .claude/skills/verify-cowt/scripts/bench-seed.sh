#!/bin/sh
# Time `cowt seed` on a real repo: median and range over N runs, cowt builds alternated run by run.
# Usage: bench-seed.sh REPO RUNS BIN [BIN...]
# Each run adds a throwaway worktree (trigger skipped), times `cowt seed` with hooks off, checks the
# seed cloned something and exited 0, then deletes the worktree and its branch outside the timed region.
# Prints one row per run and a summary per BIN: median, min, max, errors, and directories cloned.
set -u
[ $# -ge 3 ] || { echo "usage: bench-seed.sh REPO RUNS BIN [BIN...]" >&2; exit 2; }
repo=$1 runs=$2; shift 2
scratch=$(mktemp -d "${TMPDIR:-/tmp}/bench-seed-XXXXXX")
out="$scratch/rows.tsv"; : >"$out"
cleanup() { rm -rf "$scratch"; git -C "$repo" worktree prune; }
trap cleanup EXIT
trap 'exit 130' INT TERM
now() { /usr/bin/python3 -c 'import time;print(time.time())'; }

i=0
while [ "$i" -lt "$runs" ]; do
  for bin; do
    b="bench-seed-$$-$i-$(basename "$bin")"; wt="$scratch/$b"
    COWT_SKIP_HOOK=1 git -c core.fsmonitor=false -C "$repo" worktree add -q -b "$b" "$wt" HEAD 2>/dev/null
    t0=$(now)
    COWT_NO_HOOKS=1 "$bin" seed "$wt" >"$scratch/seed.log" 2>&1; rc=$?
    t1=$(now)
    n=$(sed -n 's/.*seeded .* (\([0-9]*\) cloned).*/\1/p' "$scratch/seed.log")
    printf '%s\t%s\t%s\t%s\n' "$bin" "$(/usr/bin/python3 -c "print(round($t1-$t0,3))")" "$rc" "${n:-0}" | tee -a "$out"
    rm -rf "$wt"; git -C "$repo" worktree prune; git -C "$repo" branch -qD "$b" 2>/dev/null
  done
  i=$((i + 1))
done

/usr/bin/python3 -I - "$out" <<'EOF'
import sys, statistics, collections
rows = collections.defaultdict(list)
for line in open(sys.argv[1]):
    b, s, rc, n = line.rstrip("\n").split("\t")
    rows[b].append((float(s), int(rc), int(n)))
for b, r in rows.items():
    t = [x[0] for x in r]
    errs = sum(1 for x in r if x[1] != 0 or x[2] == 0)
    print(f"SUMMARY\t{b}\tmedian={statistics.median(t):.3f}s\tmin={min(t):.3f}\tmax={max(t):.3f}\truns={len(t)}\terrors={errs}\tcloned={sorted(set(x[2] for x in r))}")
EOF
