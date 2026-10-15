#!/usr/bin/env bash
# Gate a delegated edit before accepting it.
#
# Usage: gate-delegated-diff.sh <base-ref> <owned-path>...
#
# Compares the working tree (committed, staged, unstaged, and untracked files)
# with <base-ref> and fails when the delegated change:
#   1. adds a lint or type-check suppression instead of a fix, or
#   2. touches a file outside the owned paths (prefix match: a directory
#      or a file).
#
# Run it in the worker's repository after the worker finishes and before
# integrating its change. Exit 0 = accept, 1 = reject, 2 = usage error.
set -euo pipefail

if [ "$#" -lt 2 ]; then
  echo "usage: $0 <base-ref> <owned-path>..." >&2
  exit 2
fi
base=$1; shift
git rev-parse --verify --quiet "$base^{commit}" >/dev/null || { echo "unknown base ref: $base" >&2; exit 2; }

suppression='(#[[:space:]]*noqa|type:[[:space:]]*ignore|pyright:[[:space:]]*ignore|mypy:[[:space:]]*ignore|pylint:[[:space:]]*disable|@ts-ignore|@ts-expect-error|@ts-nocheck|eslint-disable|biome-ignore|nolint|#\[allow\()'

changed=$( { git diff --name-only "$base"; git ls-files --others --exclude-standard; } | sort -u)
status=0

# 1. Added suppressions, in tracked changes and in new untracked files.
added=$(git diff -U0 "$base" | grep -E '^\+' | grep -vE '^\+\+\+ ' | grep -E "$suppression" || true)
while IFS= read -r f; do
  [ -n "$f" ] && [ -f "$f" ] || continue
  if ! git cat-file -e "$base:$f" 2>/dev/null && git ls-files --others --exclude-standard -- "$f" | grep -q .; then
    hit=$(grep -nE "$suppression" "$f" || true)
    [ -n "$hit" ] && added+=$'\n'"$f: $hit"
  fi
done <<< "$changed"
if [ -n "${added//[$'\n ']/}" ]; then
  echo "REJECT: added suppression; fix the error instead:" >&2
  printf '%s\n' "$added" | sed '/^$/d; s/^/  /' >&2
  status=1
fi

# 2. Files outside the owned paths.
outside=""
while IFS= read -r f; do
  [ -n "$f" ] || continue
  ok=0
  for p in "$@"; do
    p=${p%/}
    if [ "$f" = "$p" ] || [ "${f#"$p"/}" != "$f" ]; then ok=1; break; fi
  done
  [ "$ok" = 1 ] || outside+="  $f"$'\n'
done <<< "$changed"
if [ -n "$outside" ]; then
  echo "REJECT: changed outside owned paths ($*):" >&2
  printf '%s' "$outside" >&2
  status=1
fi

[ "$status" = 0 ] && echo "OK: no added suppressions; all changes inside owned paths."
exit "$status"
