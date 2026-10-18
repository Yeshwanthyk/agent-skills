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
echo "skills dirty: $(git -C "$repo" status --porcelain -- skills | wc -l | tr -d ' ') path(s) (runs test the working tree)"
exit $fail
