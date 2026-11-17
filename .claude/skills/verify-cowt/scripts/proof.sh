#!/bin/sh
# Drive cowt end to end in scratch repos and print one PASS/FAIL line per behavior ID.
# Usage: proof.sh [--bin PATH] [--only PREFIX] [--keep] [--real REPO]
#   --bin    cowt to test (default: this repo's skills/yesh-router/bin/cowt)
#   --only   run behavior IDs starting with PREFIX (e.g. SEED, CREATE)
#   --keep   keep scratch repos (the evidence dir is always kept)
#   --real   also seed one worktree of REPO with the cowt under test and report seconds and disk MB;
#            for a Rust repo, also time the first cargo build there and count Fresh/compiled units
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

# --- Cargo target directories ---------------------------------------------------
ago() { date -v-"$1"H +%Y%m%d%H%M 2>/dev/null || date -d "-$1 hour" +%Y%m%d%H%M; } # BSD or GNU date
mkcargo() { # mkcargo <dir>: root and nested workspaces, each with a built-looking target/ (stamped an hour ago)
  mkdir -p "$1" && cd "$1" || exit 1
  git init -q
  printf 'target\n' >.gitignore
  mkdir -p rust; echo v1 >Cargo.lock; echo v1 >rust/Cargo.lock
  git add -A; git commit -qm init
  mkdir -p target/debug/deps target/debug/.fingerprint rust/target/debug/deps
  echo root >target/debug/deps/lib.rlib; echo nested >rust/target/debug/deps/lib.rlib
  touch -t "$(ago 1)" target/debug/deps target/debug/.fingerprint
}
hold_lock() { # hold_lock <file> <seconds>: flock the file like cargo does; returns once held
  : >"$1"; rm -f "$1.held"
  /usr/bin/python3 -I -c 'import fcntl,sys,time
f=open(sys.argv[1]); fcntl.flock(f, fcntl.LOCK_EX); open(sys.argv[1]+".held","w").close(); time.sleep(float(sys.argv[2]))' "$1" "$2" &
  while [ ! -e "$1.held" ]; do sleep 0.1; done
}
if group CARGO DONOR DRIFT; then
  mkcargo "$S/rs"
  run "$C" init
  run git worktree add -q -b c1 "$S/rs1" HEAD
  check CARGO-1 "a Cargo workspace's target/ is cloned by default" "[ \"\$(cat $S/rs1/target/debug/deps/lib.rlib)\" = root ]"
  check CARGO-2 "a nested Cargo workspace's target/ is cloned" "[ \"\$(cat $S/rs1/rust/target/debug/deps/lib.rlib)\" = nested ]"
  printf '[copy]\n\tcargo = false\n' >"$S/rs/.git/cowt"
  run git worktree add -q -b c2 "$S/rs2" HEAD
  check CARGO-3 "copy.cargo = false skips target/" "[ ! -e $S/rs2/target ]"
  rm -f "$S/rs/.git/cowt"

  # donor choice: a sibling worktree with a newer build and the same Cargo.lock wins over main
  echo sibling >"$S/rs1/target/debug/deps/lib.rlib"; touch "$S/rs1/target/debug/deps"
  run git worktree add -q -b c3 "$S/rs3" HEAD
  check DONOR-1 "the freshest checkout with the same Cargo.lock donates target/" "[ \"\$(cat $S/rs3/target/debug/deps/lib.rlib)\" = sibling ]"
  # a matching Cargo.lock beats a newer build with a different one
  git -C "$S/rs" checkout -q -b lock2 && echo v2 >"$S/rs/Cargo.lock" && git -C "$S/rs" commit -qam v2 && git -C "$S/rs" checkout -q main
  run git -C "$S/rs" worktree add -q "$S/rsL" lock2
  echo lock2 >"$S/rsL/target/debug/deps/lib.rlib"; touch -t "$(ago 2)" "$S/rsL/target/debug/deps"
  run git -C "$S/rs" worktree add -q -b c4 "$S/rs4" lock2
  check DONOR-2 "a matching Cargo.lock beats a newer build with another lockfile" "[ \"\$(cat $S/rs4/target/debug/deps/lib.rlib)\" = lock2 ]"
  check DRIFT-1 "a lockfile no checkout shares is logged as drift" "grep -q 'Cargo.lock matches no checkout' $LOG"

  # busy targets
  mkcargo "$S/rb"; run "$C" init
  run git worktree add -q -b b1 "$S/rb1" HEAD
  echo idle >"$S/rb1/target/debug/deps/lib.rlib"
  hold_lock "$S/rb/target/debug/.cargo-build-lock" 30; lockpid=$!
  printf '[copy]\n\tcargowait = 1\n' >"$S/rb/.git/cowt"
  run git worktree add -q -b b2 "$S/rb2" HEAD
  check CARGO-7 "a busy main yields to an idle sibling with the same lockfile" "[ \"\$(cat $S/rb2/target/debug/deps/lib.rlib)\" = idle ]"
  kill $lockpid 2>/dev/null; wait $lockpid 2>/dev/null

  mkcargo "$S/rc"; run "$C" init
  printf '[copy]\n\tcargowait = 1\n' >"$S/rc/.git/cowt"
  hold_lock "$S/rc/target/debug/.cargo-build-lock" 30; lockpid=$!
  t0=$(date +%s); run git worktree add -q -b k1 "$S/rc1" HEAD; t1=$(date +%s)
  kill $lockpid 2>/dev/null; wait $lockpid 2>/dev/null
  check CARGO-4 "with every donor busy past copy.cargowait, target/ is skipped; others still cloned" \
    "[ ! -e $S/rc1/target ] && [ -f $S/rc1/rust/target/debug/deps/lib.rlib ] && [ $((t1 - t0)) -ge 1 ]"
  printf '[copy]\n\tcargowait = 10\n' >"$S/rc/.git/cowt"
  hold_lock "$S/rc/target/debug/.cargo-build-lock" 2; lockpid=$!
  run git worktree add -q -b k2 "$S/rc2" HEAD
  wait $lockpid 2>/dev/null
  check CARGO-8 "a build that finishes within copy.cargowait is waited for, then cloned" "[ \"\$(cat $S/rc2/target/debug/deps/lib.rlib)\" = root ]"

  # node_modules: donor by lockfile, drift hook
  mkdir -p "$S/nd" && cd "$S/nd" && git init -q
  printf 'node_modules\n.drift-ran\n' >.gitignore; echo a >pnpm-lock.yaml; git add -A; git commit -qm init
  mkdir -p node_modules; echo main >node_modules/x
  git checkout -q -b b2 && echo b >pnpm-lock.yaml && git commit -qam b && git checkout -q main
  printf '[hook]\n\tdrift = echo "$COWT_DRIFT" > .drift-ran\n' >.git/cowt
  run "$C" init
  run git worktree add -q "$S/nd1" b2
  check DRIFT-2 "hook.drift runs with COWT_DRIFT when no checkout shares the lockfile" "[ \"\$(cat $S/nd1/.drift-ran)\" = node_modules ]"
  echo b2install >"$S/nd1/node_modules/x"
  run git -C "$S/nd" worktree add -q -b b3 "$S/nd2" b2
  check DONOR-3 "node_modules comes from the checkout with the same lockfile" "[ \"\$(cat $S/nd2/node_modules/x)\" = b2install ]"
  check DRIFT-3 "no drift hook when a checkout shares the lockfile" "[ ! -e $S/nd2/.drift-ran ]"
  mkcargo "$S/ro"; run "$C" init
  run git worktree add -q -b o1 "$S/ro1" HEAD
  rm -rf "$S/ro/target"
  run git worktree add -q -b o2 "$S/ro2" HEAD
  check DONOR-4 "a target/ main never built is cloned from the worktree that has it" "[ \"\$(cat $S/ro2/target/debug/deps/lib.rlib)\" = root ]"

  if command -v cargo >/dev/null 2>&1; then
    export CARGO_HOME="$REAL_HOME/.cargo" RUSTUP_HOME="${RUSTUP_HOME:-$REAL_HOME/.rustup}"
    mkdir -p "$S/cr" && cd "$S/cr" && git init -q && printf 'target\n' >.gitignore
    printf '[package]\nname = "demo"\nversion = "0.1.0"\nedition = "2021"\n' >Cargo.toml
    mkdir src shared; echo MAIN >shared/x.txt
    cat >build.rs <<'EOF'
fn main() {
    let p = std::path::Path::new(&std::env::var("CARGO_MANIFEST_DIR").unwrap()).join("shared/x.txt");
    println!("cargo:rerun-if-changed={}", p.display());
    println!("cargo:rustc-env=SH={}", std::fs::read_to_string(&p).unwrap().trim());
}
EOF
    echo 'fn main() { println!("{} {}", env!("SH"), include_str!("../shared/x.txt").trim()); }' >src/main.rs
    run cargo build --offline
    git add -A; git commit -qm init; run "$C" init
    sleep 1
    run git worktree add -q -b c5 "$S/cr1" HEAD
    echo WORKTREE >"$S/cr1/shared/x.txt"
    (cd "$S/cr1" && run cargo build --offline)
    check CARGO-5 "a cloned target/ rebuilds the worktree's own sources" "[ -d $S/cr1/target/debug ] && [ \"\$($S/cr1/target/debug/demo)\" = 'WORKTREE WORKTREE' ]"
    echo AGAIN >"$S/cr1/shared/x.txt"
    (cd "$S/cr1" && run cargo build --offline)
    check CARGO-6 "a build script's absolute CARGO_MANIFEST_DIR path tracks the worktree, not main" "[ \"\$($S/cr1/target/debug/demo)\" = 'AGAIN AGAIN' ] && [ \"\$($S/cr/target/debug/demo)\" = 'MAIN MAIN' ]"
  fi
fi

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

# --- Linux btrfs: parallel reflink, cowt subvol, snapshot seeding -----------------------
if group LINUX; then
  if [ "$(uname)" = Linux ] && [ "$(stat -f -c %T "$S")" = btrfs ] && command -v btrfs >/dev/null 2>&1; then
    mkrepo "$S/lx"
    mkdir -p node_modules/.bin; echo bin >node_modules/.bin/x; echo '{}' >node_modules/.package-lock.json
    echo '{"lockfileVersion":3}' >package-lock.json; git add package-lock.json; git commit -qm lock
    i=0; while [ $i -lt 30 ]; do mkdir -p "node_modules/p$i/lib"; echo "$i" >"node_modules/p$i/lib/i.js"; i=$((i + 1)); done
    sig() { (cd "$1" && find . | LC_ALL=C sort && find . -type f | LC_ALL=C sort | xargs cat) | md5sum | cut -d' ' -f1; }
    before=$(sig "$S/lx/node_modules")
    COWT_SKIP_HOOK=1 run git -C "$S/lx" worktree add -q -b l1 "$S/lx1" HEAD
    run "$C" seed "$S/lx1"
    after=$(sig "$S/lx1/node_modules")
    check LINUX-1 "a plain directory clones with parallel reflinks: every entry, dotfiles and symlinks kept" \
      "[ $after = $before ] && [ -L $S/lx1/node_modules/link.js ] && [ -f $S/lx1/pkg/a/node_modules/x/i.js ]"
    echo changed >"$S/lx1/node_modules/p1/lib/i.js"
    check LINUX-2 "writes in the clone leave the main checkout untouched" "[ \"\$(cat $S/lx/node_modules/p1/lib/i.js)\" = 1 ]"
    run "$C" subvol "$S/lx"
    after=$(sig "$S/lx/node_modules")
    check LINUX-3 "cowt subvol makes each seeded directory a subvolume with the same contents" \
      "[ \$(stat -c %i $S/lx/node_modules) = 256 ] && [ \$(stat -c %i $S/lx/pkg/a/node_modules) = 256 ] && [ $after = $before ] && [ ! -e $S/lx/node_modules.cowt-old ]"
    check LINUX-4 "cowt subvol again is a no-op" "\"$C\" subvol $S/lx 2>&1 | grep -q 'already a subvolume'"
    COWT_SKIP_HOOK=1 run git -C "$S/lx" worktree add -q -b l2 "$S/lx2" HEAD
    run "$C" seed "$S/lx2"
    echo changed >"$S/lx2/node_modules/p2/lib/i.js"
    check LINUX-5 "a seed from a subvolume is a writable snapshot, isolated from main" \
      "[ \$(stat -c %i $S/lx2/node_modules) = 256 ] && [ -L $S/lx2/node_modules/link.js ] && [ \"\$(cat $S/lx/node_modules/p2/lib/i.js)\" = 2 ]"
    sleep 1; touch "$S/lx1/node_modules/.package-lock.json" # the plain copy is now the freshest install
    COWT_SKIP_HOOK=1 run git -C "$S/lx" worktree add -q -b l3 "$S/lx3" HEAD
    run "$C" seed "$S/lx3"
    check LINUX-8 "a subvolume donor beats a fresher plain copy with the same lockfile" "[ \$(stat -c %i $S/lx3/node_modules) = 256 ]"
    check LINUX-6 "status marks subvolume directories" "cd $S/lx && \"$C\" status | grep -qx '  node_modules (subvolume)'"
    (cd "$S/lx" && "$C" remove -f "$S/lx2" >>"$LOG" 2>&1 && "$C" gc >>"$LOG" 2>&1)
    check LINUX-7 "remove and gc delete a snapshot-seeded worktree without root" "[ ! -e $S/lx2 ] && ! ls -d $S/.cowt-trash/lx2-* 2>/dev/null | grep -q ."
  else
    echo "SKIP LINUX-* (needs Linux, btrfs-progs, and a btrfs TMPDIR)"
  fi
fi

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
  check REAL-1 "real repo worktree is seeded with node_modules or a Cargo target/" "[ -d $rw/node_modules ] || [ -d $rw/target ]"
  if [ -f "$rw/Cargo.lock" ] && [ -d "$rw/target" ] && command -v cargo >/dev/null 2>&1; then
    # first build after seeding: dependencies should be Fresh, only workspace members compile
    t0=$(/usr/bin/python3 -c 'import time;print(time.time())')
    (cd "$rw" && cargo build -v --offline >"$EVID/real-cargo.txt" 2>&1)
    t1=$(/usr/bin/python3 -c 'import time;print(time.time())')
    fresh=$(grep -c '^ *Fresh ' "$EVID/real-cargo.txt"); compiled=$(grep -c '^ *Compiling ' "$EVID/real-cargo.txt")
    members=$(cd "$rw" && cargo metadata --offline --no-deps --format-version 1 2>/dev/null |
      /usr/bin/python3 -c 'import json,sys;print(len(json.load(sys.stdin)["packages"]))')
    printf 'METRIC\treal_cargo_build_seconds\t%s\nMETRIC\treal_cargo_fresh\t%s\nMETRIC\treal_cargo_compiled\t%s\nMETRIC\treal_cargo_members\t%s\n' \
      "$(/usr/bin/python3 -c "print(round($t1-$t0,2))")" "$fresh" "$compiled" "$members" | tee -a "$RES"
    check REAL-3 "first cargo build in the seeded worktree compiles only workspace members" "[ $fresh -gt 0 ] && [ $compiled -le ${members:-0} ]"
  fi
  "$C" remove -f "$rw" >>"$LOG" 2>&1; git -C "$REAL" branch -qD "$rb" >>"$LOG" 2>&1
  (cd "$REAL" && "$C" gc >>"$LOG" 2>&1)
  check REAL-2 "real repo cleanup leaves no worktree or branch" \
    "! git -C '$REAL' worktree list | grep -q '$rb' && ! git -C '$REAL' show-ref --quiet refs/heads/$rb"
fi

echo "evidence: $EVID (log.txt, results.tsv)"
echo "score $pass/$total"
[ "$pass" = "$total" ] && [ "$total" -gt 0 ]
