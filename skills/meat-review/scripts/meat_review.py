#!/usr/bin/env python3
"""meat-review: an abridged, annotated reading of a code change, drawn from git.

The agent picks line ranges, folds and findings (references/rubric.md); this
script numbers the diff for it, checks its answer against git, and draws the
kept code from the real files, so shown code is never model output.

  meat_review.py triage  [SCOPE]                           small digest (files, sizes, touched functions, seams) for the tier call
  meat_review.py prompt  [SCOPE] [--budget KB] [-o FILE]   rubric + numbered diff for the reader
  meat_review.py check   READING.json [SCOPE]              validate against the change (exit 1 on errors)
  meat_review.py render  READING.json [SCOPE] --md [--only ID] [--max-code N] [--max-calls N]
  meat_review.py render  READING.json [SCOPE] --html [-o FILE] [--open]
  meat_review.py render  READING.json [SCOPE] --t3 [-o FILE] [--max-code N]   compact page for T3's html_render
  meat_review.py publish READING.json [SCOPE] --kvim [--author NAME]
  meat_review.py pin     COMMIT                            maintainers: point --t3 pages at page.js as of a pushed commit
  meat_review.py taste show                                merged taste: shipped, yours, this repo's
  meat_review.py taste add --section S --text RULE [--repo]   append a rule (to yours, or the repo's)

SCOPE: --ref REF and --file PATH. No --ref reviews HEAD -> working tree,
untracked files included. REF is SHA^! (one commit), A...B (branch against
merge base), A..B, or a single ref (that ref -> working tree).
"""
import argparse
import difflib
import hashlib
import html
import json
import os
import re
import shutil
import subprocess
import sys
import urllib.request
import webbrowser

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.normpath(os.path.join(HERE, ".."))
RUBRIC = os.path.join(ROOT, "references", "rubric.md")
TASTE = os.path.join(ROOT, "references", "taste.md")
USER_TASTE = os.path.expanduser(os.environ.get("MEAT_REVIEW_TASTE", "~/.config/meat-review/taste.md"))
REPO_TASTE = ".meat-review/taste.md"
AREAS = ("bug", "quality", "structure", "tests")
VERDICTS = ("real", "weak", "fake")
VIZ_PY = os.path.join(HERE, "..", "..", "viz", "scripts", "viz.py")
VIZ_CDN = "https://cdn.jsdelivr.net/gh/Yeshwanthyk/agent-skills@ae0dcfc76376bca3cd7370863f142818e928b9df/skills/viz/assets/viz.js"
EMPTY_TREE = "4b825dc642cb6eb9a060e54bf8d69288fbee4904"
KINDS = ("core", "supporting", "tests", "config", "docs", "mechanical", "generated")
SEVERITIES = ("risk", "question", "note")
TIERS = ("S", "M", "L")
FILE_VERDICTS = ("look", "skim", "skip")
MAX_TITLE_WORDS = 4
MAX_FILE_BYTES = 1024 * 1024


# --- git -------------------------------------------------------------------

def git(*args, check=True, binary=False):
    res = subprocess.run(["git", "--literal-pathspecs", *args], capture_output=True)
    if check and res.returncode != 0:
        sys.exit(f"git {' '.join(args)}: {res.stderr.decode(errors='replace').strip()}")
    return res.stdout if binary else res.stdout.decode("utf-8", errors="replace")


def rev(ref):
    return git("rev-parse", "--verify", "--end-of-options", ref + "^{commit}").strip()


class Change:
    """One comparison: base -> target (None = working tree), its files and contents."""

    def __init__(self, ref=None, file=None):
        os.chdir(git("rev-parse", "--show-toplevel").strip())
        self.ref, self.only = ref, file
        if not ref:
            self.base, self.target = rev("HEAD") if git("rev-parse", "--verify", "HEAD", check=False) else EMPTY_TREE, None
        elif ref.endswith("^!"):
            self.target = rev(ref[:-2])
            parent = git("rev-parse", "--verify", self.target + "^", check=False).strip()
            self.base = parent or EMPTY_TREE
        elif "..." in ref:
            a, b = ref.split("...", 1)
            self.target = rev(b or "HEAD")
            self.base = git("merge-base", rev(a or "HEAD"), self.target).strip()
        elif ".." in ref:
            a, b = ref.split("..", 1)
            self.base, self.target = rev(a or "HEAD"), rev(b or "HEAD")
        else:
            self.base, self.target = rev(ref), None
        self.label = f"{self.base[:8]} -> {self.target[:8] if self.target else 'working tree'}"
        self.files = self._files()

    def _range(self):
        return [self.base] + ([self.target] if self.target else [])

    def _files(self):
        raw = git("diff", "--no-ext-diff", "--name-status", "-z", "-M", *self._range(), "--", *([self.only] if self.only else [])).split("\0")
        files, i = [], 0
        while i < len(raw) and raw[i]:
            status = raw[i]
            if status[0] in "RC":
                files.append({"status": status[0], "old": raw[i + 1], "path": raw[i + 2]})
                i += 3
            else:
                files.append({"status": status[0], "old": raw[i + 1], "path": raw[i + 1]})
                i += 2
        if not self.target:
            extra = git("ls-files", "--others", "--exclude-standard", "-z", "--", *([self.only] if self.only else [])).split("\0")
            files += [{"status": "?", "old": p, "path": p} for p in extra if p]
        for f in files:
            f["old_text"] = "" if f["status"] in "A?" else self._blob(self.base, f["old"])
            f["new_text"] = "" if f["status"] == "D" else (self._blob(self.target, f["path"]) if self.target else self._worktree(f["path"]))
            f["binary"] = f["old_text"] is None or f["new_text"] is None
            f["old_lines"] = (f["old_text"] or "").splitlines()
            f["new_lines"] = (f["new_text"] or "").splitlines()
            f["patch"] = "" if f["binary"] else self._patch(f)
            f["added"] = sum(1 for l in f["patch"].splitlines() if l.startswith("+") and not l.startswith("+++"))
            f["removed"] = sum(1 for l in f["patch"].splitlines() if l.startswith("-") and not l.startswith("---"))
        return files

    @staticmethod
    def _decode(data):
        if data is None or len(data) > MAX_FILE_BYTES or b"\0" in data[:8192]:
            return None
        return data.decode("utf-8", errors="replace")

    def _blob(self, ref, path):
        res = subprocess.run(["git", "show", f"{ref}:{path}"], capture_output=True)
        return self._decode(res.stdout) if res.returncode == 0 else ""

    def _worktree(self, path):
        try:
            with open(path, "rb") as fh:
                return self._decode(fh.read())
        except (FileNotFoundError, IsADirectoryError):
            return ""

    def _patch(self, f):
        if f["status"] == "?":
            return "".join(difflib.unified_diff([], [l + "\n" for l in f["new_lines"]], "/dev/null", "b/" + f["path"]))
        paths = sorted({f["old"], f["path"]})
        return git("diff", "--no-ext-diff", "--no-color", "-M", "-U3", *self._range(), "--", *paths)

    def by_path(self):
        return {f["path"]: f for f in self.files}


# --- prompt ----------------------------------------------------------------

def number_patch(patch):
    """Prefix patch lines with old and new file line: '   12    14 | +code'.
    Must match numberPatch in kvim's review/src/reading.ts."""
    out, old, new, in_hunk = [], 0, 0, False
    pad = lambda n: ("" if n is None else str(n)).rjust(5)
    for line in patch.split("\n"):
        m = re.match(r"^@@ -(\d+)(?:,\d+)? \+(\d+)(?:,\d+)? @@", line)
        if m:
            old, new, in_hunk = int(m[1]), int(m[2]), True
            out.append(line)
        elif not in_hunk or line.startswith("\\"):
            out.append(line)
        elif line.startswith(("diff ", "--- ", "+++ ")):
            in_hunk = False
            out.append(line)
        elif line.startswith("+"):
            out.append(f"{pad(None)} {pad(new)} | {line}")
            new += 1
        elif line.startswith("-"):
            out.append(f"{pad(old)} {pad(None)} | {line}")
            old += 1
        elif line == "":
            out.append(line)
        else:
            out.append(f"{pad(old)} {pad(new)} | {line}")
            old, new = old + 1, new + 1
    return "\n".join(out)


def taste_files():
    return [(label, path) for label, path in (("shipped", TASTE), ("yours", USER_TASTE), ("this repository", REPO_TASTE)) if os.path.exists(path)]


def taste_text():
    parts = []
    for label, path in taste_files():
        with open(path) as fh:
            body = fh.read().strip()
        # Each file's own top heading becomes a labelled subsection.
        body = re.sub(r"^# .*\n?", "", body, count=1).strip()
        parts.append(f"## Taste ({label}: {path})\n\n" + re.sub(r"^## ", "### ", body, flags=re.M))
    return "\n\n".join(parts)


def cmd_taste(args):
    action = args.reading or "show"
    if action == "show":
        print(taste_text())
        return
    if action != "add" or not args.section or not args.text:
        sys.exit("usage: taste add --section NAME --text RULE [--repo]")
    path = REPO_TASTE if args.repo else USER_TASTE
    os.makedirs(os.path.dirname(os.path.abspath(path)), exist_ok=True)
    text = open(path).read() if os.path.exists(path) else "# Taste\n\nMy review rules; meat-review appends them to its shipped taste.\n"
    rule = f"- {args.text.strip()}"
    heading = f"## {args.section.strip()}"
    lines = text.rstrip("\n").split("\n")
    if heading in lines:
        i = lines.index(heading) + 1
        while i < len(lines) and not lines[i].startswith("## "):
            i += 1
        while i > 0 and lines[i - 1] == "":
            i -= 1
        lines.insert(i, rule)
    else:
        lines += ["", heading, "", rule]
    with open(path, "w") as fh:
        fh.write("\n".join(lines) + "\n")
    print(f"added to {path} under {heading}: {rule}")


GENERATED_PATH = re.compile(r"(^|/)(generated|__generated__|gen)/|_pb2(_grpc)?\.pyi?$|\.pb\.go$|\.min\.(js|css)$|\.map$|(^|/)(package-lock\.json|yarn\.lock|pnpm-lock\.yaml|uv\.lock|poetry\.lock|Cargo\.lock|go\.sum)$|\.snap$")
GENERATED_HEAD = re.compile(r"code generated .* do not edit|@generated|auto-?generated|this file (is|was) (automatically )?generated", re.I)


def looks_generated(f):
    """Deterministic clue for the reader, as meat gives: path conventions or a header."""
    if GENERATED_PATH.search(f["path"]):
        return True
    return any(GENERATED_HEAD.search(l) for l in f["new_lines"][:10])


def changed_runs(f):
    """Runs of removed (old side) and added (new side) lines: (side, start, end, normalized lines)."""
    runs = []
    for a_start, a_count, b_start, b_count in f.setdefault("_hunks", hunks(f)):
        if a_count:
            runs.append(("old", a_start, a_start + a_count - 1, [l.strip() for l in f["old_lines"][a_start - 1:a_start + a_count - 1]]))
        if b_count:
            runs.append(("new", b_start, b_start + b_count - 1, [l.strip() for l in f["new_lines"][b_start - 1:b_start + b_count - 1]]))
    return runs


def detect_moves(change, limit=12, min_lines=4):
    """Exact moves: an indentation-normalized block of at least three non-blank
    lines removed in one place and added in another (meat's move hints, simplified)."""
    removed, added = [], []
    for f in change.files:
        if f["binary"]:
            continue
        for side, start, end, text in changed_runs(f):
            (removed if side == "old" else added).append((f["path"], start, text))
    cands = []
    for rp, rs, rtext in removed:
        for ap, as_, atext in added:
            sm = difflib.SequenceMatcher(None, rtext, atext, autojunk=False)
            m = sm.find_longest_match(0, len(rtext), 0, len(atext))
            block = tuple(rtext[m.a:m.a + m.size])
            if sum(1 for l in block if l) >= min_lines and not (rp == ap and abs(rs + m.a - (as_ + m.b)) < 2):
                cands.append((block, (rp, rs + m.a, rs + m.a + m.size - 1), (ap, as_ + m.b, as_ + m.b + m.size - 1)))
    # Like meat, pair only unambiguous blocks: each side matches exactly one partner.
    from collections import Counter
    old_n, new_n = Counter(c[1] for c in cands), Counter(c[2] for c in cands)
    by_text = Counter(c[0] for c in cands)
    moves, used = [], []
    overlaps = lambda r, u: r[0] == u[0] and r[1] <= u[2] and u[1] <= r[2]
    for block, old, new in sorted(cands, key=lambda c: -len(c[0])):
        if old_n[old] > 1 or new_n[new] > 1 or by_text[block] > 1 or any(overlaps(old, u) or overlaps(new, u) for u in used):
            continue
        used += [old, new]
        moves.append((*old, *new))
    return moves[:limit]


def format_move(m):
    rp, rs, re_, ap, as_, ae = m
    return f"{rp}:-{rs}..{re_} ↔ {ap}:+{as_}..{ae}"


def cmd_prompt(change, args):
    with open(RUBRIC) as fh:
        parts = [fh.read().strip(), "", taste_text(), "", f"## Review: {change.label} ({len(change.files)} files)", ""]
    moves = detect_moves(change)
    if moves:
        parts += ["Detected exact moves (treat both sides alike; see principle 7):", *[f"- {format_move(m)}" for m in moves], ""]
    budget = args.budget * 1024
    for f in change.files:
        head = f"### {f['path']} ({f['status']}, +{f['added']} -{f['removed']}{', looks generated' if not f['binary'] and looks_generated(f) else ''})"
        if f["binary"]:
            parts.append(f"{head}\n(binary or too large; classify by path)")
            continue
        if len(f["patch"]) > budget:
            parts.append(f"{head}\n(patch omitted for size: read it with `git diff {' '.join(change._range())} -- {f['path']}`)")
            continue
        budget -= len(f["patch"])
        parts.append(f"{head}\n```\n{number_patch(f['patch']).rstrip(chr(10))}\n```")
    text = "\n".join(parts) + "\n"
    if args.o:
        os.makedirs(os.path.dirname(os.path.abspath(args.o)), exist_ok=True)
        with open(args.o, "w") as fh:
            fh.write(text)
        print(f"wrote {args.o} ({len(text) // 1024} KB, {len(change.files)} files)")
    else:
        sys.stdout.write(text)


# --- reading ---------------------------------------------------------------

def load_reading(path):
    with open(path) as fh:
        text = fh.read()
    start, end = text.find("{"), text.rfind("}")
    if start < 0 or end < start:
        sys.exit(f"{path}: no JSON object")
    return json.loads(text[start:end + 1])


def validate(change, reading):
    errors = []
    if not isinstance(reading.get("summary"), str):
        errors.append("summary must be a string")
    tier = reading.get("tier", "M")
    if tier not in TIERS:
        errors.append(f"tier must be one of {', '.join(TIERS)}")
    steps = reading.get("steps", []) or []
    if tier != "S" and not steps:
        errors.append(f"tier {tier} needs steps: one per core piece, in the order to read them")
    if tier != "S" and not (isinstance(reading.get("flow"), str) and "==" in reading["flow"]):
        errors.append(f"tier {tier} needs flow: viz source with an == graph section")
    for n, st in enumerate(steps, 1):
        title = st.get("title")
        if not isinstance(title, str) or not title.strip():
            errors.append(f"step {n}: title must be a few words")
        elif len(title.split()) > MAX_TITLE_WORDS:
            errors.append(f"step {n}: title {title!r} is over {MAX_TITLE_WORDS} words")
        if tier != "S" and not (isinstance(st.get("check"), str) and st["check"].strip()):
            errors.append(f"step {n}: check must say what the reader verifies here")
    used = set()
    files = change.by_path()
    for item in reading.get("files", []) or []:
        f = files.get(item.get("path"))
        if not f:
            errors.append(f"{item.get('path')}: not in this change")
            continue
        if item.get("kind") not in KINDS:
            errors.append(f"{item['path']}: kind must be one of {', '.join(KINDS)}")
        if item.get("verdict", "look") not in FILE_VERDICTS:
            errors.append(f"{item['path']}: verdict must be one of {', '.join(FILE_VERDICTS)}")
        for k in item.get("keep", []) or []:
            side = k.get("side", "new")
            if steps:
                st = k.get("step")
                if not (isinstance(st, int) and 1 <= st <= len(steps)):
                    errors.append(f"{item['path']}: keep {k.get('start')}-{k.get('end')} needs step 1-{len(steps)}")
                else:
                    used.add(st)
            limit = len(f["old_lines"] if side == "old" else f["new_lines"])
            s, e = k.get("start"), k.get("end")
            if not (isinstance(s, int) and isinstance(e, int) and 1 <= s <= e):
                errors.append(f"{item['path']}: keep {s}-{e} must be 1 <= start <= end")
                continue
            if e > limit:
                errors.append(f"{item['path']}: {side} {s}-{e} is past line {limit}")
            for fold in k.get("fold", []) or []:
                fs, fe = fold.get("start", 0), fold.get("end", 0)
                if fe <= fs:
                    errors.append(f"{item['path']}: fold {fs}-{fe} must cover at least two lines")
                elif fs < s or fe > e:
                    errors.append(f"{item['path']}: fold {fs}-{fe} is outside its keep range {s}-{e}")
    for i, finding in enumerate(reading.get("findings", []) or []):
        f = files.get(finding.get("file"))
        name = finding.get("id") or f"finding {i + 1}"
        if not f:
            errors.append(f"{name}: {finding.get('file')} is not in this change")
            continue
        side = finding.get("side", "new")
        limit = len(f["old_lines"] if side == "old" else f["new_lines"])
        line, end = finding.get("line"), finding.get("endLine", finding.get("line"))
        if not (isinstance(line, int) and isinstance(end, int) and 1 <= line <= end <= limit):
            errors.append(f"{name}: {side} line {line}-{end} is outside 1-{limit}")
        if finding.get("severity", "note") not in SEVERITIES:
            errors.append(f"{name}: severity must be one of {', '.join(SEVERITIES)}")
        if finding.get("area", "bug") not in AREAS:
            errors.append(f"{name}: area must be one of {', '.join(AREAS)}")
    for t in reading.get("tests", []) or []:
        name = t.get("name") or "test"
        f = files.get(t.get("file"))
        if not f:
            errors.append(f"test {name!r}: {t.get('file')} is not in this change")
            continue
        if not (isinstance(t.get("line"), int) and 1 <= t["line"] <= len(f["new_lines"])):
            errors.append(f"test {name!r}: line {t.get('line')} is outside 1-{len(f['new_lines'])}")
        if t.get("verdict") not in VERDICTS:
            errors.append(f"test {name!r}: verdict must be one of {', '.join(VERDICTS)}")
    for n in range(1, len(steps) + 1):
        if n not in used:
            errors.append(f"step {n}: no kept range points at it (give a keep \"step\": {n})")
    return errors


def check_flow(reading):
    """Parse the flow with viz.py (an error fails the check), then check its @refs (advisory: a removed node's ref
    points at the old file). Without node or the viz skill this is skipped with a note."""
    flow = (reading.get("flow") or "").strip()
    if not flow:
        return []
    if not (shutil.which("node") and os.path.exists(VIZ_PY)):
        print("flow: not parsed (needs node and the viz skill next to this one)")
        return []
    os.makedirs("/tmp/meat-review", exist_ok=True)
    path = "/tmp/meat-review/flow.viz"
    with open(path, "w") as fh:
        fh.write(flow + "\n")
    res = subprocess.run([sys.executable, VIZ_PY, "check", path], capture_output=True, text=True)
    if res.returncode != 0:
        return [f"flow: {l}" for l in (res.stdout + res.stderr).strip().splitlines()] or ["flow: viz.py check failed"]
    refs = subprocess.run([sys.executable, VIZ_PY, "check", "--refs", path], capture_output=True, text=True)
    for line in (refs.stdout + refs.stderr).strip().splitlines():
        print("flow " + line)
    return []


def cmd_triage(change):
    """A small digest for the tier call: per file its status, size, the functions its hunks touch, and the seams it
    crosses. The agent reads this, not the patches, to decide S, M or L before paying for a full reading."""
    seams = [("schema/migration", r"migrat|schema|\.sql$|models?\.py$|prisma"), ("wire/API", r"\.proto$|openapi|graphql|/api/|/routes?[/.]|handlers?[/.]"),
             ("auth/security", r"auth|perm|secret|token|crypt|session"), ("config/flags", r"flag|config|settings|\.env|\.ya?ml$|\.toml$"),
             ("concurrency", r"queue|worker|lock|async|job|cron|retry"), ("deps", r"package\.json$|lock|go\.mod$|requirements|pyproject|Cargo\.toml$")]
    total, hit = 0, {}
    print(f"## Triage: {change.label} ({len(change.files)} files)")
    for f in change.files:
        n = f["added"] + f["removed"]
        total += n
        tags = [name for name, rx in seams if re.search(rx, f["path"], re.I)]
        for t in tags:
            hit.setdefault(t, []).append(f["path"])
        ctx = []
        for m in re.finditer(r"^@@[^@]*@@ ?(.*)$", f["patch"], re.M):
            c = m[1].strip()[:60]
            if c and c not in ctx:
                ctx.append(c)
        gen = " generated?" if not f["binary"] and looks_generated(f) else ""
        print(f"- {f['status']} {f['path']} +{f['added']} -{f['removed']}{gen}" + (f" [{', '.join(tags)}]" if tags else "")
              + (f"\n    touches: {'; '.join(ctx[:6])}" + (f" (+{len(ctx) - 6})" if len(ctx) > 6 else "") if ctx else ""))
    moves = detect_moves(change)
    print(f"\ntotal: {total} changed lines" + (f", {len(moves)} exact moves" if moves else ""))
    print("seams: " + ("; ".join(f"{k} ({len(v)})" for k, v in hit.items()) if hit else "none matched by path (read the touches)"))


def cmd_check(change, reading):
    errors = validate(change, reading) + check_flow(reading)
    if errors:
        print("Reading does not match the change:\n  " + "\n  ".join(errors), file=sys.stderr)
        sys.exit(1)
    covered = {i["path"] for i in reading.get("files", [])}
    missing = [f["path"] for f in change.files if f["path"] not in covered]
    kept = sum(1 for i in reading.get("files", []) if i.get("keep"))
    steps = reading.get("steps") or []
    print(f"ok: tier {reading.get('tier', '?')}, {len(steps) or 'one implicit'} step{'' if len(steps) == 1 else 's'}, {len(covered)} files classified, {kept} with kept ranges" + (f", not covered: {', '.join(missing)}" if missing else ""))
    read, _, _ = ordered(change, reading)
    shown, total = visible_changed(change, read)
    pct = 100 * shown // total if total else 0
    print(f"retention: {shown}/{total} changed lines visible ({pct}%)")
    # meat's retention pressure: advisory, never a quota.
    if total >= 40 and shown >= 20 and (shown >= 80 or shown * 100 >= total * 45):
        print("pressure: high. Reconsider repeated call-site edits after one representative, default context, duplicate test setup "
              "or cases, and long literal tables that could fold. Keep every distinct contract, condition, effect, stimulus and outcome.")
    else:
        print("pressure: acceptable. Keep uncertain behavior.")
    moves = detect_moves(change)
    for m in moves:
        rp, rs, re_, ap, as_, ae = m
        seen_old = any(i["path"] == rp and any(k.get("side") == "old" and k["start"] <= re_ and k["end"] >= rs for k in i.get("keep", [])) for i in reading["files"])
        seen_new = any(i["path"] == ap and any(k.get("side", "new") == "new" and k["start"] <= ae and k["end"] >= as_ for k in i.get("keep", [])) for i in reading["files"])
        if seen_old != seen_new:
            print(f"move shown on one side only: {format_move(m)} (keep both, or say 'moved from …' in the note)")


# --- drawing ---------------------------------------------------------------

def hunks(f):
    """vim.diff-style indices: (a_start, a_count, b_start, b_count), 1-based;
    a zero count starts at the line before."""
    out = []
    for tag, i1, i2, j1, j2 in difflib.SequenceMatcher(None, f["old_lines"], f["new_lines"], autojunk=False).get_opcodes():
        if tag != "equal":
            out.append((i1 + 1 if i2 > i1 else i1, i2 - i1, j1 + 1 if j2 > j1 else j1, j2 - j1))
    return out


def excerpt(f, keep):
    """Rows for one kept range: walk the chosen side, weaving in the other
    side's lines where hunks touch it. Mirrors M.excerpt in kvim."""
    side = keep.get("side", "new")
    here, there = (f["old_lines"], f["new_lines"]) if side == "old" else (f["new_lines"], f["old_lines"])
    s, c, os_, oc = (0, 1, 2, 3) if side == "old" else (2, 3, 0, 1)
    mark, other_mark, other_side = ("-", "+", "new") if side == "old" else ("+", "-", "old")
    hs, rows = f.setdefault("_hunks", hunks(f)), []

    def other(h):
        for n in range(h[os_], h[os_] + h[oc]):
            rows.append({"mark": other_mark, "text": there[n - 1] if n - 1 < len(there) else "", "side": other_side, "line": n})

    start, last = keep["start"], min(keep["end"], len(here))
    for n in range(start, last + 1):
        for h in hs:
            if (h[c] > 0 and h[s] == n) or (h[c] == 0 and h[s] == n - 1 and n == start):
                other(h)
        changed = any(h[c] > 0 and h[s] <= n < h[s] + h[c] for h in hs)
        rows.append({"mark": mark if changed else " ", "text": here[n - 1], "side": side, "line": n})
        for h in hs:
            if h[c] == 0 and h[s] == n:
                other(h)
    return rows


IMPORT_RULES = {
    "py": (r"^(import |from \S+ import )", None),
    "js": (r"^(import\b|export .* from ['\"])", r"(from\s+['\"][^'\"]+['\"]|^import\s+['\"][^'\"]+['\"]);?\s*$"),
    "go": (r"^import\b", None),
    "rs": (r"^(pub )?use |^extern crate ", r";\s*$"),
    "c": (r"^#\s*include\b", None),
    "java": (r"^import ", None),
}
EXT = {"py": "py", "pyi": "py", "js": "js", "jsx": "js", "ts": "js", "tsx": "js", "mjs": "js", "cjs": "js", "go": "go",
       "rs": "rs", "c": "c", "h": "c", "cc": "c", "cpp": "c", "hpp": "c", "java": "java", "kt": "java", "scala": "java"}


def imports(f, side):
    """Line numbers of top-level import statements on one side, as a set."""
    key = "_imports_" + side
    if key in f:
        return f[key]
    lines, found = f["old_lines" if side == "old" else "new_lines"], set()
    rule = IMPORT_RULES.get(EXT.get(f["path"].rsplit(".", 1)[-1].lower(), ""))
    if rule:
        start, end = re.compile(rule[0]), rule[1] and re.compile(rule[1])
        i = 0
        while i < len(lines):
            if start.match(lines[i]):
                j = i
                text = lines[i].rstrip()
                if text.endswith("(") or (EXT.get(f["path"].rsplit(".", 1)[-1]) == "go" and text.endswith("(")):
                    while j + 1 < len(lines) and not lines[j].strip().startswith(")"):
                        j += 1
                elif text.endswith("\\"):
                    while j + 1 < len(lines) and lines[j].rstrip().endswith("\\"):
                        j += 1
                elif end and not end.search(text):
                    while j + 1 < len(lines) and not end.search(lines[j]):
                        j += 1
                found.update(range(i + 1, j + 2))
                i = j + 1
            else:
                i += 1
    f[key] = found
    return found


def blocks(f, keep, show_imports=False):
    """A kept range as rows and hidden runs: [{'row':..}] or [{'hidden': kind, 'count', 'changed', 'rows'}]."""
    side, out, pending = keep.get("side", "new"), [], None
    folds = keep.get("fold", []) or []
    hidden = None
    for row in excerpt(f, keep):
        reason = None
        if row["side"] == side:
            hidden = None
            for fold in folds:
                if fold["start"] <= row["line"] <= fold["end"]:
                    reason = "fold"
                    hidden = "fold" if row["line"] < fold["end"] else None
        else:
            reason = hidden
        if not reason and not show_imports and row["line"] in imports(f, row["side"]):
            reason = "imports"
        if reason:
            if pending and pending["hidden"] != reason:
                out.append(pending)
                pending = None
            pending = pending or {"hidden": reason, "count": 0, "changed": 0, "rows": []}
            pending["count"] += 1
            pending["changed"] += row["mark"] != " "
            pending["rows"].append(row)
        else:
            if pending:
                out.append(pending)
                pending = None
            out.append({"row": row})
    if pending:
        out.append(pending)
    return out


def hidden_label(b):
    what = ("import line" if b["hidden"] == "imports" else "line") + ("" if b["count"] == 1 else "s")
    return f"⋯ {b['count']} {what}" + (f" ({b['changed']} changed)" if b["changed"] else "")


def ordered(change, reading):
    """Files in reading order with ids f1.., plus skimmed and uncovered. With steps, a file is read where its
    first range's step comes; without them, in the order the reading lists it."""
    files = change.by_path()
    read, skimmed = [], []
    for item in reading.get("files", []):
        f = files.get(item["path"])
        if f:
            (read if item.get("keep") else skimmed).append((item, f))
    if reading.get("steps"):
        read.sort(key=lambda p: min(k.get("step", 1e9) for k in p[0]["keep"]))
    for n, (item, _) in enumerate(read, 1):
        item["_id"] = f"f{n}"
    covered = {i["path"] for i in reading.get("files", [])}
    uncovered = [f["path"] for f in change.files if f["path"] not in covered]
    return read, skimmed, uncovered


def steps_of(reading, read):
    """The walkthrough: each step with its kept ranges (item, f, keep), labelled s1.1, s1.2, ...
    A reading without steps (tier S) gets one step per kept file."""
    given = reading.get("steps") or []
    if given:
        out = [{"title": st["title"], "why": st.get("why", ""), "check": st.get("check", ""), "viz": st.get("viz", ""),
                "ranges": [(item, f, k) for item, f in read for k in item["keep"] if k.get("step") == n]}
               for n, st in enumerate(given, 1)]
    else:
        out = [{"title": f["path"].rsplit("/", 1)[-1], "why": item.get("reason", ""), "check": "", "viz": "",
                "ranges": [(item, f, k) for k in item["keep"]]} for item, f in read]
    for n, st in enumerate(out, 1):
        st["n"], st["id"] = n, f"s{n}"
        for i, (_, _, k) in enumerate(st["ranges"], 1):
            k["_label"] = f"s{n}.{i}"
    return out


def step_of_finding(steps, x):
    """The step a finding belongs to: the one whose range holds its line, else the first one showing its file."""
    side, line = x.get("side", "new"), x.get("line", 0)
    for st in steps:
        for item, f, k in st["ranges"]:
            if f["path"] == x["file"] and k.get("side", "new") == side and k["start"] <= line <= k["end"]:
                return st["n"]
    return next((st["n"] for st in steps for _, f, _ in st["ranges"] if f["path"] == x["file"]), 0)


def visible_changed(change, read):
    shown = set()
    for item, f in read:
        for k in item["keep"]:
            for b in blocks(f, k):
                if "row" in b and b["row"]["mark"] != " ":
                    shown.add((f["path"], b["row"]["side"], b["row"]["line"]))
    return len(shown), sum(f["added"] + f["removed"] for f in change.files)


def manifest(change, reading, read):
    shown, total = visible_changed(change, read)
    return f"showing {shown} of {total} changed lines in {len(read)} of {len(change.files)} files"


def findings_sorted(reading, read):
    order = {item["path"]: n for n, (item, _) in enumerate(read)}
    found = list(reading.get("findings", []) or [])
    for n, finding in enumerate(found, 1):
        finding.setdefault("id", f"x{n}")
    return sorted(found, key=lambda x: (order.get(x["file"], 1e9), x["file"], x.get("line", 0)))


SIGN = {"risk": "!", "question": "?", "note": "·"}
# --- markdown (Claude Code, Codex, pi) -------------------------------------

def range_md(f, k):
    body = [f"{b['row']['mark']} {b['row']['text']}" if "row" in b else f"  {hidden_label(b)}" for b in blocks(f, k)]
    head = f"`{k['_label']}` **{f['path']}:{k['start']}-{k['end']}**" + (" (old)" if k.get("side") == "old" else "") + (f" — {k['note']}" if k.get("note") else "")
    return head, body


def finding_md(x):
    where = f"{x['file'].rsplit('/', 1)[-1]}:{x['line']}" + (" (old)" if x.get("side") == "old" else "")
    title = f"**{x['title']}** " if x.get("title") else ""
    return f"- `{x['id']}` {SIGN.get(x.get('severity', 'note'), '·')} {x.get('severity', 'note')} `{where}` {title}{x['text']}"


def cmd_render_md(change, reading, args):
    read, skimmed, uncovered = ordered(change, reading)
    steps = steps_of(reading, read)
    found = findings_sorted(reading, read)
    by_step = {}
    for x in found:
        by_step.setdefault(step_of_finding(steps, x), []).append(x)
    out = [] if args.only else [f"**Reading** · `{change.ref or 'working changes'}` · tier {reading.get('tier', 'M')} · {manifest(change, reading, read)}", "",
                                reading.get("summary", "").strip(), ""]
    # As on the page: every step shows its first range, and the rest share what the budget has left.
    budget, held = args.max_code or 120, []
    budget -= sum(len(range_md(f, k)[1]) for st in steps for _, f, k in st["ranges"][:1])
    for st in steps:
        if args.only and args.only != st["id"] and not any(args.only == k["_label"] for _, _, k in st["ranges"]):
            continue
        if not args.only or args.only == st["id"]:
            out.append(f"### {st['n']} of {len(steps)} · {st['title']}" if len(steps) > 1 else f"### {st['title']}")
            if st["why"]:
                out.append(st["why"])
            if st["check"]:
                out.append(f"**Check:** {st['check']}")
            out += [finding_md(x) for x in by_step.get(st["n"], [])]
            out.append("")
        for n, (item, f, k) in enumerate(st["ranges"]):
            if args.only and args.only not in (st["id"], k["_label"]):
                continue
            head, body = range_md(f, k)
            if n and not args.only:
                if len(body) > budget:
                    held.append((k["_label"], f"- `{k['_label']}` {f['path']}:{k['start']}-{k['end']}" + (f" — {k['note']}" if k.get("note") else "")))
                    continue
                budget -= len(body)
            out += [head, "```diff", *body, "```", ""]
    if args.only:
        print("\n".join(out).rstrip())
        return
    if by_step.get(0):
        out += ["**Other findings**", *[finding_md(x) for x in by_step[0]], ""]
    tests = reading.get("tests", []) or []
    if tests:
        counts = {v: sum(1 for t in tests if t.get("verdict") == v) for v in VERDICTS}
        out.append(f"**Tests** · {counts['real']} real, {counts['weak']} weak, {counts['fake']} fake")
        out += [f"- {t['verdict']} `{t['file'].rsplit('/', 1)[-1]}:{t['line']}` {t.get('name', '')} — {t.get('why', '')}" for t in tests if t.get("verdict") != "real"]
        out.append("")
    if held:
        out += [f"**Not shown** (say `show {held[0][0]}`):", *[h for _, h in held], ""]
    rest = [f"`{f['path']}` {i.get('verdict') or 'skip'}" for i, f in skimmed] + [f"`{p}` not covered" for p in uncovered]
    if rest:
        out += ["**Skimmed:** " + ", ".join(rest), ""]
    print("\n".join(out).rstrip())


# --- html (T3 Code, browser) -----------------------------------------------

def first_sentence(text, limit=110):
    text = re.sub(r"\s+", " ", str(text or "")).strip()
    m = re.match(r"(.+?[.!?])(\s|$)", text)
    s = m[1] if m else text
    return s if len(s) <= limit else s[:limit - 1].rsplit(" ", 1)[0] + "…"


def calls_viz(change, read):
    """calldiff of the core/supporting files as a viz `== diff` section, or ''."""
    paths = [f["path"] for item, f in read if item["kind"] in ("core", "supporting")]
    if not paths or not shutil.which("calldiff") or not os.path.exists(VIZ_PY):
        return ""
    res = subprocess.run([sys.executable, VIZ_PY, "calldiff", *change._range(), "--max-depth", "4", "--", *paths], capture_output=True, text=True)
    return res.stdout.strip() if res.returncode == 0 and "== diff" in res.stdout else ""


CALL = re.compile(r"^([+\-~!? ]?)( *)(.*?) @(\S+?):(\d+)(?:-(\d+))?(?:\s+# (.*))?$")
STATUS = {"+": "Added in this change", "-": "Removed in this change", "~": "Changed in this change", "!": "Fails"}


def annotate_calls(calls, reading, read):
    """Give calldiff nodes plain notes from the reading, and map each node to what it explains:
    a sentence, its file and line, the kept range that shows it, and its changed callees."""
    if not calls:
        return "", {}
    lines = calls.splitlines()
    base = next((l[5:].strip() for l in lines if l.startswith("base ")), "")
    found = reading.get("findings", []) or []
    kept = [(f["path"], k.get("side", "new"), k, f"{item['_id']}.{n}".replace(".", "-")) for item, f in read for n, k in enumerate(item["keep"], 1)]
    nodes, stack, out = [], [], []
    for line in lines:
        m = CALL.match(line)
        if not m or line.startswith(("base ", "== ")):
            out.append(line)
            continue
        mark, indent, label, ref, start, end, note = m.groups()
        mark = mark.strip()
        path, side = base + ref, "old" if mark == "-" else "new"
        start, end = int(start), int(end or start)
        # A block node (a try spanning 80 lines) speaks only for its first line, not for every finding inside it.
        last = end if end - start <= 5 else start
        hit = next((x for x in found if x["file"] == path and x.get("side", "new") == side and x["line"] <= last and x.get("endLine", x["line"]) >= start), None)
        rng = next((r for r in kept if r[0] == path and r[1] == side and r[2]["start"] <= start <= r[2]["end"]), None)
        word = label.split(" ", 1)[0]
        name = f"the `{label[:60]}` branch" if word in ("if", "elif", "else", "try", "except", "for", "while", "with", "match", "case") \
            else "`" + re.sub(r"\(.*$", "", label).replace("new ", "").split(".")[-1] + "`"
        where = f"{path.rsplit('/', 1)[-1]}, line {start}"
        said = None
        if hit:
            said = f"{hit['severity'].capitalize()}: {hit.get('title') or first_sentence(hit['text'])}"
        elif mark and rng and rng[2].get("note"):
            said = first_sentence(rng[2]["note"])
        node = {"label": label, "ref": f"{ref}:{start}" + (f"-{end}" if end != start else ""), "st": mark, "depth": len(indent) // 2,
                "path": path, "side": side, "line": start, "end": end, "range": rng[3] if rng else "", "finding": hit["id"] if hit else "", "told": set(),
                "say": said or (f"{STATUS[mark]}: {name} in {where}." if mark in STATUS else f"{name[0].upper() + name[1:]} in {where}, unchanged."), "kids": []}
        while stack and stack[-1]["depth"] >= node["depth"]:
            stack.pop()
        parent = stack[-1] if stack else None
        if parent:
            parent["kids"].append(node)
        # Calls inside one kept range share its sentence: show it on the first row only, not on every sibling.
        node["shown"] = (parent["shown"] if parent else set()) | ({said} if said else set())
        repeat = said and parent and (said in parent["shown"] or said in parent["told"])
        if parent and said:
            parent["told"].add(said)
        stack.append(node)
        nodes.append(node)
        notes = [n for n in (None if repeat else said, note) if n]
        out.append(f"{mark or ' '}{indent}{label} @{ref}:{start}" + (f"-{end}" if end != start else "") + (f" # {' · '.join(notes)}" if notes else ""))
    changed = lambda n: bool(n["st"]) or any(changed(k) for k in n["kids"])
    info = {}
    for n in nodes:
        info[f"{n['label']}@{n['ref']}"] = {k: n[k] for k in ("say", "st", "path", "side", "line", "end", "depth", "range", "finding")} | {
            "changed": changed(n),
            "kids": [{"label": k["label"], "ref": k["ref"], "st": k["st"]} for k in n["kids"] if changed(k)]}
    return "\n".join(out), info


def counterpart(f, side, line):
    """The other side's line for `line`: its twin when unchanged, else the last line before the change."""
    for tag, i1, i2, j1, j2 in f.setdefault("_ops", difflib.SequenceMatcher(None, f["old_lines"], f["new_lines"], autojunk=False).get_opcodes()):
        lo, hi, other = (i1, i2, j1) if side == "old" else (j1, j2, i1)
        if lo < line <= hi:
            return other + (line - lo) if tag == "equal" else other
    return 0


def page_rows(f, rows):
    """Rows with both line numbers, and the unified hunk header that frames them for the diff renderer."""
    out = []
    for r in rows:
        o = r["line"] if r["side"] == "old" else (counterpart(f, "new", r["line"]) if r["mark"] == " " else None)
        n = r["line"] if r["side"] == "new" else (counterpart(f, "old", r["line"]) if r["mark"] == " " else None)
        out.append([o, n, r["mark"], r["text"], r["side"]])
    olds, news = [r[0] for r in out if r[2] != "+"], [r[1] for r in out if r[2] != "-"]
    first = rows[0]
    os_ = olds[0] if olds else counterpart(f, first["side"], first["line"])
    ns = news[0] if news else counterpart(f, first["side"], first["line"])
    # Rows travel as [old, new, mark, text]; the page derives each row's side from its mark, and an unchanged row's
    # from the block's side, so only a row that disagrees keeps a fifth field.
    side = next((r[4] for r in out if r[2] == " "), "new")
    for r in out:
        if r[4] == ("old" if r[2] == "-" else "new" if r[2] == "+" else side):
            r.pop()
    return {"rows": out, "hunk": [os_, len(olds), ns, len(news)], "side": side}


# --- context around a kept range ------------------------------------------

CONTEXT = {"page": 30, "t3": 8}  # lines of folded context on each side of a kept range


def context_blocks(f, k, kept, span=CONTEXT["page"]):
    """Folded rows just above and below a kept range, up to `span` lines, stopping at the next kept range."""
    side = k.get("side", "new")
    total = len(f["old_lines" if side == "old" else "new_lines"])
    others = [o for o in kept if o is not k and o.get("side", "new") == side]
    lo = max([1, k["start"] - span] + [o["end"] + 1 for o in others if o["end"] < k["start"]])
    hi = min([total, k["end"] + span] + [o["start"] - 1 for o in others if o["start"] > k["end"]])
    out = []
    for a, b, where in ((lo, k["start"] - 1, "above"), (k["end"] + 1, hi, "below")):
        if b < a:
            continue
        rows = [r for r in excerpt(f, {"start": a, "end": b, "side": side}) if not (r["side"] != side and r["line"] in seen_other(f, k))]
        if rows:
            n = b - a + 1
            out.append((where, {"hidden": where, "label": f"{'↑' if where == 'above' else '↓'} {n} more line{'s' if n != 1 else ''} {where}", **page_rows(f, rows)}))
    return out


def seen_other(f, k):
    """Other-side lines the kept range already shows, so context does not repeat them."""
    key = ("_seen", k["start"], k["end"], k.get("side", "new"))
    if key not in f:
        f[key] = {r["line"] for r in excerpt(f, k) if r["side"] != k.get("side", "new")}
    return f[key]


PAGE = os.path.join(HERE, "..", "assets", "page.html")
PAGE_JS = os.path.join(HERE, "..", "assets", "page.js")
PIERRE_DIR = os.path.join(HERE, "..", "assets", "pierre")  # offline @pierre/diffs from build_pierre.mjs
VIZ_JS = os.path.join(HERE, "..", "..", "viz", "assets", "viz.js")  # the sibling viz skill, same file as VIZ_CDN


def viz_script(host):
    """viz.js from the CDN for T3, inline for the standalone page so it draws offline."""
    if host == "t3" or not os.path.exists(VIZ_JS):
        return f'<script src="{VIZ_CDN}"></script>'
    with open(VIZ_JS) as fh:
        return "<script>\n" + fh.read().replace("</script", "<\\/script") + "</script>"


def pierre_scripts(paths):
    """The offline diff renderer for the standalone page: Pierre's core plus the grammar for each language
    the reading's files use, matched by name the way Pierre's getFiletypeFromFileName does. A file in a
    language not shipped renders as plain text."""
    with open(os.path.join(PIERRE_DIR, "langs.json")) as fh:
        names = json.load(fh)
    def lang(path):
        base = os.path.basename(path)
        two = re.search(r"\.([^.]+\.[^.]+)$", base)
        one = re.search(r"\.([^.]+)$", base)
        return names.get(base) or (two and names.get(two[1])) or (one and names.get(one[1]))
    parts = []
    for name in ["core", *sorted({l for l in map(lang, paths) if l})]:
        with open(os.path.join(PIERRE_DIR, name + ".js")) as fh:
            parts.append("<script>\n" + fh.read().replace("</script", "<\\/script") + "</script>")
    return "\n".join(parts)
# A T3 page loads page.js from the CDN rather than carrying 60 KB of it through html_render. The pin is the commit
# that holds the current page.js, and the hash proves the local copy matches it; when they differ (page.js edited
# since the last pin), the page inlines page.js instead. Re-pin with `meat_review.py pin <commit>` after merging.
PAGE_CDN = "https://cdn.jsdelivr.net/gh/Yeshwanthyk/agent-skills@{commit}/skills/meat-review/assets/page.js"
PAGE_PIN = ("", "")  # (commit, sha256 of page.js at that commit)


def range_page(f, k, kept, host):
    """One kept range as page blocks: shown runs, folds, and folded context above and below."""
    out, run = [], []
    for b in blocks(f, k) + [None]:
        if b and "row" in b:
            run.append(b["row"])
            continue
        if run:
            out.append(page_rows(f, run))
            run = []
        if b:
            out.append({"hidden": b["hidden"], "label": hidden_label(b), **page_rows(f, b["rows"])})
    ctx = dict(context_blocks(f, k, kept, CONTEXT[host]))
    out = ([ctx["above"]] if "above" in ctx else []) + out + ([ctx["below"]] if "below" in ctx else [])
    return {"id": k["_label"].replace(".", "-"), "label": k["_label"], "path": f["path"], "kind": "",
            "note": k.get("note", ""), "start": k["start"], "end": k["end"], "side": k.get("side", "new"), "blocks": out}


def page_title(change):
    """A heading a person reads: the commit's subject for one commit, else the ref and its commit count."""
    if not change.target:
        return "Working changes" + (f" on {change.ref}" if change.ref else "")
    n = git("rev-list", "--count", f"{change.base}..{change.target}", check=False).strip()
    if n == "1":
        return git("log", "-1", "--format=%s", change.target, check=False).strip() or change.ref
    return f"{change.ref} · {n} commits" if n.isdigit() else change.ref


def page_data(change, reading, host="page", max_code=None):
    """Everything the page draws: the flow, then the steps with code rows taken from git. The T3 view keeps the
    first `max_code` code rows; later ranges are listed by id."""
    read, skimmed, uncovered = ordered(change, reading)
    steps = steps_of(reading, read)
    tier = reading.get("tier", "M")
    flow = (reading.get("flow") or "").strip()
    if tier == "L":
        calls, _ = annotate_calls(calls_viz(change, read), reading, read)
        if calls:
            flow += "\n\n" + re.sub(r"^== diff.*$", "== diff Call changes", calls, count=1, flags=re.M)
    # Every step keeps its first range whatever the budget, so no step arrives empty; the rest fill in reading
    # order while the budget lasts, and what does not fit is listed by id.
    budget, later, out = max_code, [], []
    built = [[(item, f, k, range_page(f, k, item["keep"], host)) for item, f, k in st["ranges"]] for st in steps]
    size = lambda r: sum(len(b["rows"]) if "hidden" not in b else 1 for b in r["blocks"])
    if budget is not None:
        budget -= sum(size(rs[0][3]) for rs in built if rs)
    for st, rs in zip(steps, built):
        ranges = []
        for n, (item, f, k, r) in enumerate(rs):
            if n and budget is not None:
                if size(r) > budget:
                    later.append({"label": k["_label"], "path": f["path"], "start": k["start"], "end": k["end"], "note": k.get("note", "")})
                    continue
                budget -= size(r)
            r["kind"] = item["kind"]
            ranges.append(r)
        out.append({"id": st["id"], "n": st["n"], "title": st["title"], "why": st["why"], "check": st["check"], "viz": st["viz"], "ranges": ranges})
    found = []
    for x in findings_sorted(reading, read):
        found.append({k: x[k] for k in ("id", "file", "line", "endLine", "side", "severity", "area", "title", "text") if k in x} | {"step": step_of_finding(steps, x)})
    tests = reading.get("tests", []) or []
    return {
        "host": host,
        "title": page_title(change),
        "label": change.label,
        "tier": tier,
        "manifest": manifest(change, reading, read),
        "summary": reading.get("summary", ""),
        "flow": flow,
        "steps": out,
        "findings": found,
        "tests": {"real": sum(1 for t in tests if t.get("verdict") == "real"),
                  "bad": [{k: t.get(k, "") for k in ("file", "line", "name", "verdict", "why")} for t in tests if t.get("verdict") != "real"]},
        "later": later,
        "skimmed": [{"path": f["path"], "verdict": i.get("verdict") or "skip", "reason": i.get("reason", "")} for i, f in skimmed]
                   + [{"path": p, "verdict": "skip", "reason": "not covered by the reading"} for p in uncovered],
    }


def cmd_render_html(change, reading, args, host="page"):
    if reading.get("tier") == "S":
        print("tier S: no page; reply with render --md instead", file=sys.stderr)
    data = page_data(change, reading, host, (args.max_code or 400) if host == "t3" else None)
    out = args.o or os.path.join("/tmp/meat-review", re.sub(r"[^\w.-]+", "_", (change.ref or "changes")) + (".t3" if host == "t3" else "") + ".html")
    if host == "t3":
        data["full"] = re.sub(r"\.t3\.html$", ".html", out) if out.endswith(".t3.html") else ""
    blob = json.dumps(data, ensure_ascii=False).replace("</", "<\\/")
    with open(PAGE_JS, "rb") as fh:
        js = fh.read()
    pinned = PAGE_PIN[0] and hashlib.sha256(js).hexdigest() == PAGE_PIN[1]
    if host == "t3" and pinned:
        script = f'<script src="{PAGE_CDN.format(commit=PAGE_PIN[0])}"></script>'
    else:
        if host == "t3":
            print(f"page.js {'differs from the CDN pin' if PAGE_PIN[0] else 'has no CDN pin'}, so it is inlined (+{len(js) // 1024} KB)", file=sys.stderr)
        script = "<script>\n" + js.decode().replace("</script", "<\\/script") + "\n</script>"
    with open(PAGE) as fh:
        page = fh.read().replace("/*DATA*/", blob, 1).replace("/*PIERRE*/", "" if host == "t3" else pierre_scripts({r["path"] for st in data["steps"] for r in st["ranges"]}), 1).replace("/*PAGE_JS*/", script, 1).replace("/*VIZ*/", viz_script(host), 1)
    os.makedirs(os.path.dirname(os.path.abspath(out)), exist_ok=True)
    with open(out, "w") as fh:
        fh.write(page)
    print(out + (f" ({len(page) // 1024} KB" + (", over html_render's 500 KB: lower --max-code)" if len(page) > 512000 else ")") if host == "t3" else ""))
    if args.open:
        webbrowser.open("file://" + os.path.abspath(out))


# --- kvim ------------------------------------------------------------------

def cmd_publish_kvim(change, reading, args):
    cli = os.environ.get("KVIM_REVIEW") or os.path.expanduser("~/.config/nvim/bin/review")
    if not os.path.exists(cli):
        sys.exit(f"kvim not found at {cli} (set KVIM_REVIEW)")
    scope = ["--mode", "revision", "--ref", change.ref] if change.ref else ["--mode", "changes"]
    if change.only:
        scope += ["--file", change.only]
    # kvim reads summary, files with keep ranges, and tests; a step's title and check become the range's note there.
    steps = reading.get("steps") or []
    body = {k: reading[k] for k in ("summary", "tests") if k in reading}
    body["files"] = []
    for item in reading.get("files", []):
        item = {k: v for k, v in item.items() if not k.startswith("_") and k != "verdict"}
        keep = []
        for k in item.get("keep", []):
            n = k.get("step", 0)
            st = steps[n - 1] if 0 < n <= len(steps) else None
            k = {key: v for key, v in k.items() if not key.startswith("_") and key != "step"}
            if st:
                k["note"] = f"{st['title']}: " + (k.get("note") or st.get("check", ""))
            keep.append(k)
        body["files"].append(item | {"keep": keep})
    res = subprocess.run([cli, "reading", "publish", "--stdin", *scope], input=json.dumps(body), text=True, capture_output=True)
    if res.returncode != 0:
        sys.exit(res.stderr.strip())
    print(res.stdout.strip())
    found = reading.get("findings") or []
    if found:
        payload = {"author": args.author, "findings": [{k: v for k, v in x.items() if k in ("id", "file", "side", "line", "endLine", "severity", "area", "text")}
                                                       | {"id": x.get("id") or f"x{n}"} for n, x in enumerate(found, 1)]}
        res = subprocess.run([cli, "reading", "add", "--stdin", *scope], input=json.dumps(payload), text=True, capture_output=True)
        print(res.stdout.strip() if res.returncode == 0 else "findings not added: " + res.stderr.strip())
    target = f":ReviewOpen {change.ref}" if change.ref else ",gv"
    print(f"open in kvim: {target} then gR")


def cmd_pin(commit):
    """Rewrite PAGE_PIN to COMMIT's page.js, after checking the CDN serves that exact file (it serves only pushed commits of a public repo)."""
    if not commit:
        sys.exit("pin needs COMMIT")
    repo = os.path.dirname(os.path.abspath(__file__))
    run = lambda *a: subprocess.run(["git", "-C", repo, *a], capture_output=True, check=True).stdout
    full = run("rev-parse", commit + "^{commit}").decode().strip()
    if not run("branch", "-r", "--contains", full).strip():
        sys.exit(f"{full[:9]} is not on any pushed branch; push it first")
    top = run("rev-parse", "--show-toplevel").decode().strip()
    rel = os.path.relpath(os.path.abspath(PAGE_JS), top)
    digest = hashlib.sha256(run("show", f"{full}:{rel}")).hexdigest()
    url = PAGE_CDN.format(commit=full)
    try:
        with urllib.request.urlopen(url, timeout=30) as r:
            served = hashlib.sha256(r.read()).hexdigest()
    except OSError as e:
        sys.exit(f"the CDN does not serve {url} ({e}); jsdelivr needs a public repo, so --t3 keeps inlining page.js")
    if served != digest:
        sys.exit(f"the CDN serves a different page.js for {full[:9]}; not pinning")
    me = os.path.abspath(__file__)
    with open(me) as fh:
        src = fh.read()
    src, n = re.subn(r'^PAGE_PIN = .*$', f'PAGE_PIN = ("{full}", "{digest}")  # (commit, sha256 of page.js at that commit)', src, count=1, flags=re.M)
    if n != 1:
        sys.exit("PAGE_PIN line not found")
    with open(me, "w") as fh:
        fh.write(src)
    with open(PAGE_JS, "rb") as fh:
        same = hashlib.sha256(fh.read()).hexdigest() == digest
    print(f"pinned page.js to {full[:9]}" + ("" if same else " (the local page.js differs, so --t3 still inlines it)"))


def main():
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    p.add_argument("cmd", choices=["triage", "prompt", "check", "render", "publish", "taste", "pin"])
    p.add_argument("reading", nargs="?")
    p.add_argument("--ref")
    p.add_argument("--file")
    p.add_argument("--budget", type=int, default=200, help="prompt patch budget in KB (default 200)")
    p.add_argument("-o")
    p.add_argument("--md", action="store_true")
    p.add_argument("--html", action="store_true")
    p.add_argument("--t3", action="store_true", help="compact page for T3 Code's html_render: no sidebar, theme variables, first --max-code rows")
    p.add_argument("--open", action="store_true")
    p.add_argument("--only")
    p.add_argument("--max-code", type=int, help="markdown and --t3: code lines before the rest is listed (default 120 in markdown, 400 on a T3 page)")
    p.add_argument("--max-calls", type=int, default=30, help="markdown: call-change lines shown (default 30)")
    p.add_argument("--kvim", action="store_true")
    p.add_argument("--author", default="meat-review")
    p.add_argument("--section")
    p.add_argument("--text")
    p.add_argument("--repo", action="store_true", help="taste add: write the repository's .meat-review/taste.md")
    args = p.parse_args()
    if args.cmd == "taste":
        if args.repo:
            os.chdir(git("rev-parse", "--show-toplevel").strip())
        return cmd_taste(args)
    if args.cmd == "pin":
        return cmd_pin(args.reading)
    for name in ("o", "reading"):
        value = getattr(args, name)
        if value and not os.path.isabs(value):
            setattr(args, name, os.path.abspath(value))
    change = Change(args.ref, args.file)
    if args.cmd == "triage":
        return cmd_triage(change)
    if args.cmd == "prompt":
        return cmd_prompt(change, args)
    if not args.reading:
        p.error(f"{args.cmd} needs READING.json")
    reading = load_reading(args.reading)
    if args.cmd == "check":
        return cmd_check(change, reading)
    errors = validate(change, reading)
    if errors:
        sys.exit("Reading does not match the change (run check):\n  " + "\n  ".join(errors))
    if args.cmd == "render":
        if args.html or args.t3:
            return cmd_render_html(change, reading, args, "t3" if args.t3 else "page")
        return cmd_render_md(change, reading, args)
    if args.cmd == "publish":
        if not args.kvim:
            p.error("publish needs --kvim")
        return cmd_publish_kvim(change, reading, args)


if __name__ == "__main__":
    main()
