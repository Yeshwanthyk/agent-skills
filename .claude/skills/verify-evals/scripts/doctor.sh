#!/usr/bin/env bash
# Read-only preflight for skilleval runs. Usage: doctor.sh [harness]   (claude | pi; default claude)
set -u
harness="${1:-claude}"
repo="$(cd "$(dirname "$0")/../../../.." && pwd)"
fail=0
check() { if eval "$2" >/dev/null 2>&1; then echo "ok   $1"; else echo "FAIL $1"; fail=1; fi; }

check "python3 >= 3.11" "python3 -c 'import sys; sys.exit(sys.version_info < (3, 11))'"
check "$harness CLI on PATH" "command -v $harness"
check "$harness CLI runs" "$harness --version"
check "git repo at $repo" "git -C '$repo' rev-parse --git-dir"
check "fixture setup scripts present" "ls '$repo'/eval/fixtures/*/setup.sh"
(cd "$repo/eval" && python3 -m skilleval lint >/tmp/verify-evals-lint.$$ 2>&1)
if grep -q '^0 errors' /tmp/verify-evals-lint.$$; then echo "ok   skilleval lint: $(tail -1 /tmp/verify-evals-lint.$$)"
else echo "FAIL skilleval lint:"; grep -v '^warn' /tmp/verify-evals-lint.$$; fail=1; fi
rm -f /tmp/verify-evals-lint.$$
# Runs test the working tree, but real sessions load the gitgud install; a fix that never reached the lock never ran.
lock="${GITGUD_LOCK:-$HOME/.gitgud/gitgud.lock.json}"
last="$(git -C "$repo" log -1 --format=%H HEAD -- skills)"
installed="$(python3 -c 'import json,sys; print(next((s["resolvedCommit"] for s in json.load(open(sys.argv[1]))["sources"].values() if s.get("repo","").endswith("/agent-skills")), ""))' "$lock" 2>/dev/null)"
if [ -z "$installed" ]; then echo "warn install: no agent-skills source in $lock"
elif git -C "$repo" merge-base --is-ancestor "$last" "$installed" 2>/dev/null; then echo "ok   install: ${installed:0:7} includes the last skills/ commit ${last:0:7}"
else echo "warn install: ${installed:0:7} predates skills/ commit ${last:0:7}; push, then gitgud update --global && gitgud apply --global from outside the repo"; fi
stale="$(find "${TMPDIR:-/tmp}" -maxdepth 1 -name 'skilleval-*' -mmin +120 2>/dev/null | wc -l | tr -d ' ')"
[ "$stale" -gt 0 ] && echo "warn $stale skilleval workspace(s) older than 2h in ${TMPDIR:-/tmp} (left by killed runs; remove them if no run is live)"
echo "skills dirty: $(git -C "$repo" status --porcelain -- skills | wc -l | tr -d ' ') path(s) (runs test the working tree)"
exit $fail
