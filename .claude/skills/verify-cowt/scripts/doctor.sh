#!/bin/sh
# Read-only preflight for cowt verification. Usage: doctor.sh [--bin PATH]
set -u
here=$(cd "$(dirname "$0")" && pwd)
repo=$(cd "$here/../../../.." && pwd)
bin="$repo/skills/yesh-router/bin/cowt"
[ "${1:-}" = --bin ] && bin=$2
fail=0
check() { if sh -c "$2" >/dev/null 2>&1; then echo "ok   $1"; else echo "FAIL $1"; fail=1; fi; }
warn() { if sh -c "$2" >/dev/null 2>&1; then echo "ok   $1"; else echo "warn $1"; fi; }

check "cowt under test: $bin" "[ -x '$bin' ]"
check "cowt parses (sh -n)" "sh -n '$bin'"
warn "shellcheck clean (errors and warnings)" "! command -v shellcheck || shellcheck -s sh -S warning '$bin'"
check "git >= 2.31 (rev-parse --path-format)" "git rev-parse --path-format=absolute --git-dir >/dev/null 2>&1 || git -C '$repo' rev-parse --path-format=absolute --git-dir"
check "volume is APFS (clonefile)" "[ \"\$(uname)\" != Darwin ] || diskutil info / | grep -q 'Personality: *APFS'"
check "/usr/bin/python3 can call clonefile" "[ \"\$(uname)\" != Darwin ] || /usr/bin/python3 -I -c 'import ctypes; ctypes.CDLL(\"libc.dylib\").clonefile'"
inst=$(readlink "$HOME/.local/bin/cowt" 2>/dev/null || true)
# Live repos should run the gitgud-installed copy, never a working checkout that is mid-edit.
if [ ! -e "$HOME/.local/bin/cowt" ]; then echo "warn installed: ~/.local/bin/cowt missing; real repos' triggers will not fire"
elif [ -z "$inst" ]; then echo "warn installed: ~/.local/bin/cowt is a plain copy; link it to the gitgud install so updates reach it"
else case $inst in */.gitgud/skills/yesh-router/bin/cowt) echo "ok   installed: ~/.local/bin/cowt -> the gitgud install" ;;
  *) echo "warn installed: ~/.local/bin/cowt -> $inst, not the gitgud install; real-repo triggers run that copy" ;; esac; fi
free=$(df -k "${TMPDIR:-/tmp}" | awk 'NR==2{print int($4/1048576)}')
if [ "$free" -ge 5 ]; then echo "ok   free disk: ${free} GB"; else echo "FAIL free disk: ${free} GB (< 5 GB)"; fail=1; fi
stale=$(find "${TMPDIR:-/tmp}" -maxdepth 1 -name 'verify-cowt-*' -mmin +120 2>/dev/null | wc -l | tr -d ' ')
[ "$stale" -gt 0 ] && echo "warn $stale verify-cowt scratch dir(s) older than 2h in ${TMPDIR:-/tmp}"
exit $fail
