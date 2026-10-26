#!/bin/sh
# Drive cowt end to end in scratch repos and print one PASS/FAIL line per behavior ID.
# Usage: proof.sh [--bin PATH] [--only PREFIX] [--keep] [--real REPO]
#   --bin    cowt to test (default: this repo's skills/yesh-router/bin/cowt)
#   --only   run behavior IDs starting with PREFIX (e.g. SEED, CREATE)
#   --keep   keep scratch repos (the evidence dir is always kept)
#   --real   also seed one worktree of REPO with the cowt under test and report seconds and disk MB
# Exit 0 only when every selected check passes. The last line is "score <pass>/<total>".
set -u
here=$(cd "$(dirname "$0")" && pwd)
repo_root=$(cd "$here/../../../.." && pwd)
BIN="$repo_root/skills/yesh-router/bin/cowt" ONLY='' KEEP=0 REAL=''
while [ $# -gt 0 ]; do
  case $1 in
    --bin) BIN=$2; shift ;;
    --only) ONLY=$2; shift ;;
    --keep) KEEP=1 ;;
    --real) REAL=$2; shift ;;
    *) echo "unknown option $1" >&2; exit 2 ;;
  esac
  shift
done
case $BIN in /*) ;; *) BIN="$(pwd)/$BIN" ;; esac

EVID=$(cd "$(mktemp -d "${TMPDIR:-/tmp}/verify-cowt-XXXXXX")" && pwd -P)
S="$EVID/scratch"
mkdir -p "$S/home"
LOG="$EVID/log.txt" RES="$EVID/results.tsv"
: >"$LOG"; : >"$RES"

# Teardown runs on every exit, including a failed or interrupted run.
teardown() {
  cd /
  [ "$KEEP" = 1 ] || rm -rf "$S"
}
trap teardown EXIT
trap 'exit 130' INT TERM

# Isolation: scratch HOME and git config, so the hook block calls the cowt under test
# (no ~/.local/bin/cowt there) and no global fsmonitor or hooksPath leaks in.
REAL_HOME=$HOME
export HOME="$S/home" GIT_CONFIG_GLOBAL="$S/home/.gitconfig" GIT_CONFIG_NOSYSTEM=1 SHELL=/bin/sh
git config --global user.name verify; git config --global user.email verify@example.invalid
git config --global init.defaultBranch main; git config --global core.fsmonitor false

pass=0 total=0
want() { case $1 in "$ONLY"*) return 0 ;; esac; return 1; }
group() { # group <prefix>...: true when --only selects any check under these prefixes
  for g in "$@"; do case $g in "$ONLY"*) return 0 ;; esac; case $ONLY in "$g"*) return 0 ;; esac; done; return 1
}
check() { # check <ID> <description> <shell condition>
  want "$1" || return 0
  total=$((total + 1))
  if sh -c "$3" >>"$LOG" 2>&1; then
    pass=$((pass + 1)); printf 'PASS %s %s\n' "$1" "$2"; printf 'PASS\t%s\t%s\n' "$1" "$2" >>"$RES"
  else
    printf 'FAIL %s %s\n' "$1" "$2"; printf 'FAIL\t%s\t%s\n' "$1" "$2" >>"$RES"
  fi
}
run() { echo "\$ $*" >>"$LOG"; "$@" >>"$LOG" 2>&1; }

mkrepo() { # mkrepo <dir>: repo with nested node_modules, a symlink, and an ignored .env
  mkdir -p "$1" && cd "$1" || exit 1
  git init -q
  printf 'node_modules\n.env\n.cowt-ran\n' >.gitignore
  mkdir -p pkg/a; echo '{}' >pkg/a/package.json; echo '{"scripts":{}}' >package.json
  git add -A; git commit -qm init
  mkdir -p node_modules/lp pkg/a/node_modules/x
  echo 1 >node_modules/lp/i.js; echo 2 >pkg/a/node_modules/x/i.js
  ln -s ../lp/i.js node_modules/link.js
  echo SECRET=1 >.env
}
C=$BIN; export C S

# --- seeding through any tool's git worktree add -----------------------------
mkrepo "$S/app"
printf '[copy]\n\tname = node_modules\n\tpath = .env\n[hook]\n\tpostcreate = echo "post $COWT_NAME $COWT_BRANCH $COWT_SOURCE" > .cowt-ran\n' >.cowt
git add .cowt; git commit -qm cfg
run "$C" init
run git -c checkout.workers=4 worktree add -b t3 "$S/wt1" HEAD
check SEED-1 "T3-style git worktree add clones root and nested node_modules" \
  "[ \"\$(cat $S/wt1/node_modules/lp/i.js)\$(cat $S/wt1/pkg/a/node_modules/x/i.js)\" = 12 ]"
check SEED-2 "symlinks inside node_modules stay symlinks" "[ -L $S/wt1/node_modules/link.js ]"
check SEED-3 "copy.path entries (.env) are cloned" "[ -f $S/wt1/.env ]"
check SEED-4 "postcreate runs in the worktree with COWT_* set" "[ \"\$(cat $S/wt1/.cowt-ran)\" = 'post wt1 t3 $S/app' ]"
check SEED-5 "seeding twice is a no-op" "\"$C\" seed $S/wt1 2>&1 | grep -q 'already seeded'"
check SEED-6 "seeded worktree has a clean git status" "[ -z \"\$(git -C $S/wt1 status --porcelain)\" ]"
printf '[hook]\n\tpostcreate = exit 3\n' >"$S/app/.git/cowt"
git -C "$S/app" worktree add -q -b failing "$S/wt2" HEAD >>"$LOG" 2>&1; rc=$?
check SEED-7 "failing postcreate never fails git worktree add" "[ $rc = 0 ] && [ -f $S/wt2/node_modules/lp/i.js ]"
rm -f "$S/app/.git/cowt"
run git -C "$S/app" worktree add --no-checkout -b nockout "$S/wt3" HEAD
check SEED-8 "cowt seed fills a worktree made without checkout" \
  "git -C $S/wt3 checkout -q nockout -- . 2>/dev/null; COWT_NO_HOOKS=1 \"$C\" seed $S/wt3 && [ -f $S/wt3/node_modules/lp/i.js ]"

# --- create -------------------------------------------------------------------
cd "$S/app" || exit 1
echo change >>pkg/a/package.json; git add pkg/a/package.json; echo untracked >note.txt; echo unstaged >>package.json
out=$("$C" create --name feat --carry 2>>"$LOG")
check CREATE-1 "create prints only the new path on stdout" "[ '$out' = '$S/.worktrees/app/feat' ]"
check CREATE-2 "--carry brings staged, unstaged, and untracked changes" \
  "grep -q change $S/.worktrees/app/feat/pkg/a/package.json && grep -q unstaged $S/.worktrees/app/feat/package.json && [ -f $S/.worktrees/app/feat/note.txt ] && git -C $S/.worktrees/app/feat diff --cached --name-only | grep -q pkg/a/package.json"
check CREATE-3 "created worktree is seeded" "[ -f $S/.worktrees/app/feat/node_modules/lp/i.js ]"
git checkout -q -- . ; git reset -q; rm -f note.txt
git branch -q existing
out2=$("$C" create --branch existing 2>>"$LOG")
check CREATE-4 "--branch checks out an existing branch" "[ \"\$(git -C '$out2' branch --show-current)\" = existing ]"
printf '[hook]\n\tprecreate = exit 4\n' >"$S/app/.git/cowt"
"$C" create --name blocked >>"$LOG" 2>&1; rc=$?
check CREATE-5 "failing precreate creates nothing" "[ $rc != 0 ] && [ ! -e $S/.worktrees/app/blocked ] && ! git -C $S/app show-ref --quiet refs/heads/blocked"
rm -f "$S/app/.git/cowt"

# --- list and status ------------------------------------------------------------
check LIST-1 "list shows each worktree, marked when seeded" "\"$C\" list | grep -q '$S/wt1	t3 seeded'"
check STATUS-1 "status names the trigger file and the clones" \
  "\"$C\" status | grep -q 'trigger:  $S/app/.git/hooks/post-checkout' && \"$C\" status | grep -q 'pkg/a/node_modules'"

# --- remove and gc --------------------------------------------------------------
feat="$S/.worktrees/app/feat"
echo dirty >"$feat/dirty.txt"
"$C" remove "$feat" >>"$LOG" 2>&1; rc=$?
check REMOVE-1 "remove refuses uncommitted changes without -f" "[ $rc != 0 ] && [ -d $feat ]"
r=$("$C" remove -f "$feat" 2>>"$LOG")
check REMOVE-2 "remove -f trashes, prunes, keeps the branch, prints the main checkout" \
  "[ ! -e $feat ] && [ '$r' = '$S/app' ] && ! git -C $S/app worktree list | grep -q '/feat ' && git -C $S/app show-ref --quiet refs/heads/feat"
run git -C "$S/app" worktree lock "$S/wt2"
"$C" remove -f "$S/wt2" >>"$LOG" 2>&1; rc=$?
check REMOVE-3 "remove refuses a locked worktree" "[ $rc != 0 ] && [ -d $S/wt2 ]"
run git -C "$S/app" worktree unlock "$S/wt2"
run "$C" gc
check GC-1 "gc deletes trashed worktrees" "[ -z \"\$(ls -A $S/.worktrees/app/.cowt-trash 2>/dev/null)\" ]"

# --- init and uninit --------------------------------------------------------------
check INIT-1 "re-init keeps exactly one block" "\"$C\" init $S/app && [ \"\$(grep -c '>>> cowt' $S/app/.git/hooks/post-checkout)\" = 1 ]"
mkrepo "$S/ex"; git commit -q --allow-empty -m e
printf '#!/bin/sh\necho ORIG >> "%s/orig.log"\nexec true\n' "$S" >.git/hooks/post-checkout; chmod +x .git/hooks/post-checkout
cp .git/hooks/post-checkout "$S/orig-hook"
run "$C" init
run git worktree add -b a "$S/exa" HEAD
check INIT-2 "an existing hook ending in exec still runs, and seeding runs too" "grep -q ORIG $S/orig.log && [ -f $S/exa/node_modules/lp/i.js ]"
run "$C" uninit
check INIT-3 "uninit restores an existing hook byte for byte" "cmp -s $S/ex/.git/hooks/post-checkout $S/orig-hook"
mkrepo "$S/hu"
mkdir -p .husky/_
printf '#!/bin/sh\nn=$(basename "$0")\ns=$(dirname "$(dirname "$0")")/$n\n[ ! -f "$s" ] && exit 0\nsh -e "$s" "$@"\n' >.husky/_/h
printf '#!/bin/sh\n. "$(dirname "$0")/h"\n' >.husky/_/post-checkout; chmod +x .husky/_/*; echo '*' >.husky/_/.gitignore
git config core.hooksPath .husky/_
run "$C" init
check INIT-4 "husky/vite-hooks repo: trigger beside the _ runner, git status stays clean" \
  "[ -f $S/hu/.husky/post-checkout ] && [ -z \"\$(git -C $S/hu status --porcelain)\" ]"
run git worktree add -b a "$S/hua" HEAD
check INIT-5 "husky repo seeds new worktrees" "[ -f $S/hua/node_modules/lp/i.js ]"
run "$C" uninit "$S/app"
run git -C "$S/app" worktree add -b after "$S/wt4" HEAD
check INIT-6 "after uninit, new worktrees are not seeded" "[ ! -e $S/wt4/node_modules ] && [ ! -e $S/app/.git/hooks/post-checkout ]"

# --- optional: one real repo ----------------------------------------------------------
if [ -n "$REAL" ] && group REAL; then
  export HOME=$REAL_HOME; unset GIT_CONFIG_GLOBAL GIT_CONFIG_NOSYSTEM
  rb="verify-cowt-$$"; rw="$S/real-$rb"
  free() { df -k "$REAL" | awk 'NR==2{print $4}'; }
  a=$(free)
  COWT_SKIP_HOOK=1 git -c core.fsmonitor=false -C "$REAL" worktree add -q -b "$rb" "$rw" HEAD >>"$LOG" 2>&1
  t0=$(/usr/bin/python3 -c 'import time;print(time.time())')
  COWT_NO_HOOKS=1 "$C" seed "$rw" >>"$LOG" 2>&1
  t1=$(/usr/bin/python3 -c 'import time;print(time.time())')
  b=$(free)
  secs=$(/usr/bin/python3 -c "print(round($t1-$t0,2))"); mb=$(( (a - b) / 1024 ))
  printf 'METRIC\treal_seed_seconds\t%s\nMETRIC\treal_disk_mb\t%s\n' "$secs" "$mb" | tee -a "$RES"
  check REAL-1 "real repo worktree is seeded with node_modules" "[ -d $rw/node_modules ]"
  "$C" remove -f "$rw" >>"$LOG" 2>&1; git -C "$REAL" branch -qD "$rb" >>"$LOG" 2>&1
  (cd "$REAL" && "$C" gc >>"$LOG" 2>&1)
  check REAL-2 "real repo cleanup leaves no worktree or branch" \
    "! git -C '$REAL' worktree list | grep -q '$rb' && ! git -C '$REAL' show-ref --quiet refs/heads/$rb"
fi

echo "evidence: $EVID (log.txt, results.tsv)"
echo "score $pass/$total"
[ "$pass" = "$total" ] && [ "$total" -gt 0 ]
