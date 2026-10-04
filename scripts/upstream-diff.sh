#!/usr/bin/env bash
# List pstack commits since the last reviewed commit recorded in config/UPSTREAM.md.
# Usage: scripts/upstream-diff.sh [--patch]
set -euo pipefail
root="$(cd "$(dirname "$0")/.." && pwd)"
base="$(grep -o 'Last reviewed: `[0-9a-f]*`' "$root/config/UPSTREAM.md" | grep -o '[0-9a-f]\{7,\}')"
cache="${UPSTREAM_CACHE:-${TMPDIR:-/tmp}/pstack-upstream}"
if [ -d "$cache/.git" ]; then
  git -C "$cache" fetch -q origin main && git -C "$cache" reset -q --hard origin/main
else
  git clone -q --filter=blob:none --sparse https://github.com/cursor/plugins "$cache"
  git -C "$cache" sparse-checkout set pstack
fi
git -C "$cache" cat-file -e "$base^{commit}" 2>/dev/null || { echo "base $base not found upstream" >&2; exit 1; }
echo "pstack commits since $base:"
git -C "$cache" log --oneline "$base..HEAD" -- pstack/skills pstack/agents
if [ "${1:-}" = "--patch" ]; then
  git -C "$cache" diff --stat "$base..HEAD" -- pstack/skills
fi
