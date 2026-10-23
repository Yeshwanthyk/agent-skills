#!/usr/bin/env python3
"""meat-review: an abridged, annotated reading of a code change, drawn from git.

The agent picks line ranges, folds and findings (references/rubric.md); this
script numbers the diff for it, checks its answer against git, and draws the
kept code from the real files, so shown code is never model output.

  meat_review.py prompt  [SCOPE] [--budget KB] [-o FILE]   rubric + numbered diff for the reader
  meat_review.py check   READING.json [SCOPE]              validate against the change (exit 1 on errors)
  meat_review.py render  READING.json [SCOPE] --md [--only ID] [--max-code N] [--max-calls N]
  meat_review.py render  READING.json [SCOPE] --html [-o FILE] [--open]
  meat_review.py publish READING.json [SCOPE] --kvim [--author NAME]
  meat_review.py taste show                                merged taste: shipped, yours, this repo's
  meat_review.py taste add --section S --text RULE [--repo]   append a rule (to yours, or the repo's)

SCOPE: --ref REF and --file PATH. No --ref reviews HEAD -> working tree,
untracked files included. REF is SHA^! (one commit), A...B (branch against
merge base), A..B, or a single ref (that ref -> working tree).
"""
import argparse
import difflib
import html
import json
import os
import re
import shutil
import subprocess
import sys
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
VIZ_CDN = "https://cdn.jsdelivr.net/gh/Yeshwanthyk/agent-skills@cc880f002cdd9c3d9f0b1337433aec3b3b799dbb/skills/viz/assets/viz.js"
EMPTY_TREE = "4b825dc642cb6eb9a060e54bf8d69288fbee4904"
KINDS = ("core", "supporting", "tests", "config", "docs", "mechanical", "generated")
SEVERITIES = ("risk", "question", "note")
CARD_KINDS = ("markdown", "viz", "tree")
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
    for card in reading.get("outline", []) or []:
        if card.get("kind", "markdown") not in CARD_KINDS:
            errors.append(f"outline card {card.get('title')!r}: kind must be one of {', '.join(CARD_KINDS)}")
    files = change.by_path()
    for item in reading.get("files", []) or []:
        f = files.get(item.get("path"))
        if not f:
            errors.append(f"{item.get('path')}: not in this change")
            continue
        if item.get("kind") not in KINDS:
            errors.append(f"{item['path']}: kind must be one of {', '.join(KINDS)}")
        for k in item.get("keep", []) or []:
            side = k.get("side", "new")
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
    return errors


def cmd_check(change, reading):
    errors = validate(change, reading)
    if errors:
        print("Reading does not match the change:\n  " + "\n  ".join(errors), file=sys.stderr)
        sys.exit(1)
    covered = {i["path"] for i in reading.get("files", [])}
    missing = [f["path"] for f in change.files if f["path"] not in covered]
    kept = sum(1 for i in reading.get("files", []) if i.get("keep"))
    print(f"ok: {len(covered)} files classified, {kept} with kept ranges" + (f", not covered: {', '.join(missing)}" if missing else ""))
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
    """Files in reading order with ids f1.., kept ranges f1.1.., plus skipped and uncovered."""
    files = change.by_path()
    read, skimmed = [], []
    for item in reading.get("files", []):
        f = files.get(item["path"])
        if f:
            (read if item.get("keep") else skimmed).append((item, f))
    for n, (item, _) in enumerate(read, 1):
        item["_id"] = f"f{n}"
    covered = {i["path"] for i in reading.get("files", [])}
    uncovered = [f["path"] for f in change.files if f["path"] not in covered]
    return read, skimmed, uncovered


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

def tree_text(body):
    return "\n".join(l for l in body.splitlines())


def cmd_render_md(change, reading, args):
    read, skimmed, uncovered = ordered(change, reading)
    out = [f"**Reading** · `{change.ref or 'working changes'}` · {manifest(change, reading, read)}", "", reading.get("summary", "").strip(), ""]
    if not args.only:
        for card in reading.get("outline", []) or []:
            out.append(f"**{card['title']}**")
            kind = card.get("kind", "markdown")
            out += ["```text" if kind != "markdown" else "", card["body"].rstrip(), "```" if kind != "markdown" else "", ""]
        found = findings_sorted(reading, read)
        if found:
            out.append("**Findings**")
            for x in found:
                where = f"{x['file']}:{x['line']}" + (" (old)" if x.get("side") == "old" else "")
                out.append(f"- `{x['id']}` {SIGN.get(x.get('severity', 'note'), '·')} {x.get('area', 'bug')} `{where}` {x['text']}")
            out.append("")
        tests = reading.get("tests", []) or []
        if tests:
            counts = {v: sum(1 for t in tests if t.get("verdict") == v) for v in VERDICTS}
            out.append(f"**Tests** · {len(tests)} cases: {counts['real']} real, {counts['weak']} weak, {counts['fake']} fake")
            mark = {"real": "✓", "weak": "~", "fake": "✗"}
            for t in tests:
                out.append(f"- {mark.get(t.get('verdict'), '?')} **{t.get('verdict')}** `{t['file'].split('/')[-1]}:{t['line']}` {t.get('name', '')} — {t.get('proves', '')}" + (f" · {t['why']}" if t.get("why") else ""))
            out.append("")
        calls = calls_viz(change, read)
        if calls:
            lines = [l for l in calls.splitlines() if not l.startswith(("base ", "== "))]
            out += ["**Call changes** (calldiff; `+` added, `-` removed)", "```diff", *lines[:args.max_calls],
                    *([f"… {len(lines) - args.max_calls} more lines (render --html shows all)"] if len(lines) > args.max_calls else []), "```", ""]
        out.append("**Reading order**")
        for item, f in read:
            out.append(f"- `{item['_id']}` `{f['path']}` {item['kind']} · {item.get('reason', '')}")
        for item, f in skimmed:
            out.append(f"- `{f['path']}` {item['kind']} · {item.get('reason', '')} (nothing kept)")
        for p in uncovered:
            out.append(f"- `{p}` not covered")
        out.append("")
    budget = args.max_code
    held = []
    for item, f in read:
        for n, k in enumerate(item["keep"], 1):
            rid = f"{item['_id']}.{n}"
            if args.only and args.only not in (item["_id"], rid):
                continue
            body = []
            for b in blocks(f, k):
                if "row" in b:
                    body.append(f"{b['row']['mark']} {b['row']['text']}")
                else:
                    body.append(f"  {hidden_label(b)}")
            head = f"`{rid}` **{f['path']}:{k['start']}-{k['end']}**" + (f" — {k['note']}" if k.get("note") else "")
            if budget is not None and len(body) > budget and not args.only:
                held.append(f"- `{rid}` {f['path']}:{k['start']}-{k['end']}" + (f" — {k['note']}" if k.get("note") else ""))
                continue
            if budget is not None:
                budget -= len(body)
            out += [head, "```diff", *body, "```", ""]
    if held:
        out += ["**Not shown here** (say `show f2.1`):", *held, ""]
    print("\n".join(out).rstrip())


# --- html (T3 Code, browser) -----------------------------------------------

LANG = {"py": "python", "js": "javascript", "jsx": "javascript", "ts": "typescript", "tsx": "typescript", "go": "go", "rs": "rust",
        "rb": "ruby", "java": "java", "kt": "kotlin", "lua": "lua", "sh": "bash", "sql": "sql", "yaml": "yaml", "yml": "yaml", "json": "json",
        "c": "c", "h": "c", "cpp": "cpp", "css": "css", "html": "xml", "md": "markdown", "toml": "ini"}


def calls_viz(change, read):
    """calldiff of the core/supporting files as a viz `== diff` section, or ''."""
    paths = [f["path"] for item, f in read if item["kind"] in ("core", "supporting")]
    if not paths or not shutil.which("calldiff") or not os.path.exists(VIZ_PY):
        return ""
    res = subprocess.run([sys.executable, VIZ_PY, "calldiff", *change._range(), "--max-depth", "4", "--", *paths], capture_output=True, text=True)
    return res.stdout.strip() if res.returncode == 0 and "== diff" in res.stdout else ""


PAGE = os.path.join(HERE, "..", "assets", "page.html")


def page_data(change, reading):
    """Everything the page draws, with code rows taken from git."""
    read, skimmed, uncovered = ordered(change, reading)
    files = []
    for item, f in read:
        ranges = []
        for n, k in enumerate(item["keep"], 1):
            out = []
            for b in blocks(f, k):
                row = lambda r: {"l": r["line"], "m": r["mark"], "t": r["text"], "s": r["side"]}
                if "row" in b:
                    if out and "hidden" not in out[-1]:
                        out[-1]["rows"].append(row(b["row"]))
                    else:
                        out.append({"rows": [row(b["row"])]})
                else:
                    out.append({"hidden": b["hidden"], "label": hidden_label(b), "rows": [row(r) for r in b["rows"]]})
            ranges.append({"id": f"{item['_id']}.{n}".replace(".", "-"), "label": f"{item['_id']}.{n}", "note": k.get("note", ""),
                           "start": k["start"], "end": k["end"], "side": k.get("side", "new"), "blocks": out})
        files.append({"id": item["_id"], "path": f["path"], "kind": item["kind"], "reason": item.get("reason", ""),
                      "lang": LANG.get(f["path"].rsplit(".", 1)[-1].lower(), ""), "ranges": ranges})
    return {
        "key": f"{change.base}:{change.target or 'worktree'}:{change.only or ''}",
        "title": change.ref or "working changes",
        "label": change.label,
        "manifest": manifest(change, reading, read),
        "summary": reading.get("summary", ""),
        "outline": reading.get("outline", []) or [],
        "calls": calls_viz(change, read),
        "findings": [{k: x[k] for k in ("id", "file", "line", "side", "severity", "area", "text", "author") if k in x} for x in findings_sorted(reading, read)],
        "tests": reading.get("tests", []) or [],
        "files": files,
        "skimmed": [{"path": f["path"], "kind": i["kind"], "reason": i.get("reason", "")} for i, f in skimmed],
        "uncovered": uncovered,
    }


def cmd_render_html(change, reading, args):
    data = json.dumps(page_data(change, reading), ensure_ascii=False).replace("</", "<\\/")
    with open(PAGE) as fh:
        page = fh.read().replace("/*DATA*/", data, 1).replace("/*VIZ_CDN*/", VIZ_CDN, 1)
    out = args.o or os.path.join("/tmp/meat-review", re.sub(r"[^\w.-]+", "_", (change.ref or "changes")) + ".html")
    os.makedirs(os.path.dirname(os.path.abspath(out)), exist_ok=True)
    with open(out, "w") as fh:
        fh.write(page)
    print(out)
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
    body = {k: reading[k] for k in ("summary", "outline", "files", "tests") if k in reading}
    for item in body.get("files", []):
        for key in [k for k in item if k.startswith("_")]:
            del item[key]
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


def main():
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    p.add_argument("cmd", choices=["prompt", "check", "render", "publish", "taste"])
    p.add_argument("reading", nargs="?")
    p.add_argument("--ref")
    p.add_argument("--file")
    p.add_argument("--budget", type=int, default=200, help="prompt patch budget in KB (default 200)")
    p.add_argument("-o")
    p.add_argument("--md", action="store_true")
    p.add_argument("--html", action="store_true")
    p.add_argument("--open", action="store_true")
    p.add_argument("--only")
    p.add_argument("--max-code", type=int, default=120, help="markdown: code lines before the rest is listed (default 120)")
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
    for name in ("o", "reading"):
        value = getattr(args, name)
        if value and not os.path.isabs(value):
            setattr(args, name, os.path.abspath(value))
    change = Change(args.ref, args.file)
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
        if args.html:
            return cmd_render_html(change, reading, args)
        return cmd_render_md(change, reading, args)
    if args.cmd == "publish":
        if not args.kvim:
            p.error("publish needs --kvim")
        return cmd_publish_kvim(change, reading, args)


if __name__ == "__main__":
    main()
