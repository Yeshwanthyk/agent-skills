#!/usr/bin/env python3
"""meat-review: an abridged, annotated reading of a code change, drawn from git.

The agent picks line ranges, folds and findings (references/rubric.md); this
script numbers the diff for it, checks its answer against git, and draws the
kept code from the real files, so shown code is never model output.

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
VIZ_CDN = "https://cdn.jsdelivr.net/gh/Yeshwanthyk/agent-skills@d3a5f3050a2c90cc472be6fb9ab26f34cea59ebd/skills/viz/assets/viz.js"
EMPTY_TREE = "4b825dc642cb6eb9a060e54bf8d69288fbee4904"
KINDS = ("core", "supporting", "tests", "config", "docs", "mechanical", "generated")
SEVERITIES = ("risk", "question", "note")
CARD_KINDS = ("markdown", "viz", "tree")
INVARIANT_STATUS = ("holds", "broken", "unproven")
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
    for n, inv in enumerate(reading.get("invariants", []) or [], 1):
        if not isinstance(inv.get("rule"), str) or not inv["rule"].strip():
            errors.append(f"invariant {n}: rule must be a sentence")
        if inv.get("status", "holds") not in INVARIANT_STATUS:
            errors.append(f"invariant {n}: status must be one of {', '.join(INVARIANT_STATUS)}")
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
HOLDS = {"holds": "✓ holds", "broken": "✗ broken", "unproven": "? unproven"}


def invariants_md(invariants):
    """The invariants as one markdown table: what must stay true, what holds it, how we know."""
    cell = lambda t: str(t or "").replace("|", "\\|").replace("\n", " ")
    rows = ["**What must stay true**", "", "| Must stay true | Held by | Evidence | |", "| --- | --- | --- | --- |"]
    rows += [f"| {cell(i['rule'])} | {cell(i.get('held_by'))} | {cell(i.get('evidence'))} | {HOLDS[i.get('status', 'holds')]} |" for i in invariants]
    return "\n".join(rows)


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
        invariants = reading.get("invariants", []) or []
        if invariants:
            out += [invariants_md(invariants), ""]
        found = findings_sorted(reading, read)
        if found:
            out.append("**Findings**")
            for x in found:
                where = f"{x['file']}:{x['line']}" + (" (old)" if x.get("side") == "old" else "")
                title = f"**{x['title']}** " if x.get("title") else ""
                out.append(f"- `{x['id']}` {SIGN.get(x.get('severity', 'note'), '·')} {x.get('area', 'bug')} `{where}` {title}{x['text']}")
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


# --- semantic changes: what changed, by function ---------------------------

def py_entities(text):
    """Top-level functions and classes, and the methods of classes: {qualified name: (kind, start, end, body)}.
    `body` is the AST with positions and the entity's own name stripped, so a move or a rename compares equal."""
    import ast
    try:
        tree = ast.parse(text or "")
    except (SyntaxError, ValueError):
        return None
    out = {}

    def add(node, name, kind):
        saved = node.name
        node.name = "_"
        body = ast.dump(node, include_attributes=False)
        node.name = saved
        out[name] = (kind, node.lineno, getattr(node, "end_lineno", node.lineno), body)

    for node in tree.body:
        if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef)):
            add(node, node.name, "function")
        elif isinstance(node, ast.ClassDef):
            methods = [n for n in node.body if isinstance(n, (ast.FunctionDef, ast.AsyncFunctionDef))]
            for m in methods:
                add(m, f"{node.name}.{m.name}", "method")
            shell = ast.ClassDef(name=node.name, bases=node.bases, keywords=node.keywords, decorator_list=node.decorator_list,
                                 body=[n for n in node.body if n not in methods] or [ast.Pass()], type_params=getattr(node, "type_params", []))
            shell.lineno, shell.end_lineno = node.lineno, getattr(node, "end_lineno", node.lineno)
            add(shell, node.name, "class")
    return out


def semantic_changes(change, limit=200):
    """Entity-level changes per Python file: added, deleted, changed (logic or formatting only), moved, renamed."""
    sides = {}
    for f in change.files:
        if f["binary"] or not f["path"].endswith((".py", ".pyi")):
            continue
        old, new = py_entities(f["old_text"]), py_entities(f["new_text"])
        if old is None or new is None:
            continue
        sides[f["path"]] = (f, old, new)
    out, gone, born = [], [], []
    for path, (f, old, new) in sides.items():
        for name in new.keys() & old.keys():
            ko, so, eo, bo = old[name]
            kn, sn, en, bn = new[name]
            if kn == "class" and bo == bn:
                continue
            text_old, text_new = f["old_lines"][so - 1:eo], f["new_lines"][sn - 1:en]
            if text_old == text_new:
                continue
            out.append({"file": path, "name": name, "kind": kn, "change": "changed" if bo != bn else "formatting",
                        "line": sn, "end": en, "side": "new"})
        gone += [(path, n, old[n]) for n in old.keys() - new.keys()]
        born += [(path, n, new[n]) for n in new.keys() - old.keys()]
    # A deletion and an addition with the same body is a move (another file) or a rename (same file).
    for g in list(gone):
        twin = next((b for b in born if b[2][3] == g[2][3] and b[2][0] == g[2][0]), None)
        if not twin:
            continue
        gone.remove(g)
        born.remove(twin)
        same_name = g[1].split(".")[-1] == twin[1].split(".")[-1]
        out.append({"file": twin[0], "name": twin[1], "kind": twin[2][0], "change": "moved" if same_name else "renamed",
                    "from": g[1] if not same_name else "", "from_file": g[0] if g[0] != twin[0] else "", "line": twin[2][1], "end": twin[2][2], "side": "new"})
    out += [{"file": p, "name": n, "kind": e[0], "change": "added", "line": e[1], "end": e[2], "side": "new"} for p, n, e in born]
    out += [{"file": p, "name": n, "kind": e[0], "change": "deleted", "line": e[1], "end": e[2], "side": "old"} for p, n, e in gone]
    # Methods of an added or deleted class say nothing the class does not.
    whole = {(c["file"], c["name"], c["change"]) for c in out if c["kind"] == "class" and c["change"] in ("added", "deleted", "moved")}
    out = [c for c in out if not (c["kind"] == "method" and (c["file"], c["name"].split(".")[0], c["change"]) in whole)]
    order = {f["path"]: i for i, f in enumerate(change.files)}
    out.sort(key=lambda c: (order.get(c["file"], 1e9), c["line"]))
    return out[:limit]


def say_entity(c):
    """One plain sentence for one entity change."""
    what = {"function": "function", "method": "method", "class": "class"}[c["kind"]]
    name = f"`{c['name']}`"
    if c["change"] == "added":
        return f"New {what} {name}."
    if c["change"] == "deleted":
        return f"Deleted {what} {name}."
    if c["change"] == "formatting":
        return f"{name} changed only in layout or comments."
    if c["change"] == "moved":
        return f"{name} moved here from {c['from_file'].rsplit('/', 1)[-1]}, unchanged." if c.get("from_file") else f"{name} moved within the file, unchanged."
    if c["change"] == "renamed":
        return f"`{c['from']}` renamed to {name}" + (f", moved from {c['from_file'].rsplit('/', 1)[-1]}." if c.get("from_file") else ".")
    return f"{name} changed its logic."


# --- html (T3 Code, browser) -----------------------------------------------

def md_inline(text):
    """Inline markdown on escaped text: code, bold, italic, links."""
    parts = re.split(r"(`[^`]+`)", text)
    out = []
    for part in parts:
        if part.startswith("`") and part.endswith("`") and len(part) > 1:
            out.append(f"<code>{html.escape(part[1:-1])}</code>")
            continue
        t = html.escape(part, quote=False)
        t = re.sub(r"\*\*(.+?)\*\*", r"<b>\1</b>", t)
        t = re.sub(r"(?<![\w*])\*(?!\s)(.+?)(?<!\s)\*(?![\w*])", r"<i>\1</i>", t)
        t = re.sub(r"\[([^\]]+)\]\((https?://[^)\s]+)\)", r'<a href="\2" target="_blank" rel="noopener">\1</a>', t)
        out.append(t)
    return "".join(out)


def md_html(text):
    """Enough markdown for outline cards: headings, paragraphs, lists, tables, fenced code, quotes."""
    lines, out, i = text.split("\n"), [], 0
    cells = lambda l: [c.strip() for c in re.split(r"(?<!\\)\|", l.strip().strip("|"))]
    while i < len(lines):
        line = lines[i]
        if line.startswith("```"):
            j = i + 1
            while j < len(lines) and not lines[j].startswith("```"):
                j += 1
            out.append(f"<pre><code>{html.escape(chr(10).join(lines[i + 1:j]))}</code></pre>")
            i = j + 1
        elif "|" in line and i + 1 < len(lines) and re.match(r"^\s*\|?\s*:?-{3,}", lines[i + 1]):
            head, rows, j = cells(line), [], i + 2
            while j < len(lines) and "|" in lines[j] and lines[j].strip():
                rows.append(cells(lines[j]))
                j += 1
            th = "".join(f"<th>{md_inline(c)}</th>" for c in head)
            tb = "".join("<tr>" + "".join(f"<td>{md_inline(c.replace(chr(92) + '|', '|'))}</td>" for c in r) + "</tr>" for r in rows)
            out.append(f"<table><thead><tr>{th}</tr></thead><tbody>{tb}</tbody></table>")
            i = j
        elif m := re.match(r"^(#{1,4})\s+(.*)", line):
            out.append(f"<h4>{md_inline(m[2])}</h4>")
            i += 1
        elif re.match(r"^\s*([-*]|\d+\.)\s+", line):
            tag = "ol" if re.match(r"^\s*\d+\.", line) else "ul"
            items, j = [], i
            while j < len(lines) and re.match(r"^\s*([-*]|\d+\.)\s+", lines[j]):
                items.append(re.sub(r"^\s*([-*]|\d+\.)\s+", "", lines[j]))
                j += 1
            out.append(f"<{tag}>" + "".join(f"<li>{md_inline(t)}</li>" for t in items) + f"</{tag}>")
            i = j
        elif line.startswith(">"):
            j = i
            while j < len(lines) and lines[j].startswith(">"):
                j += 1
            out.append(f"<blockquote>{md_inline(' '.join(l.lstrip('> ') for l in lines[i:j]))}</blockquote>")
            i = j
        elif not line.strip():
            i += 1
        elif re.search(r"[├└│]|^ {2,}\S", line):
            # A text tree or aligned block: keep its layout.
            j = i
            while j < len(lines) and lines[j].strip() and not lines[j].startswith("```"):
                j += 1
            out.append(f"<pre>{html.escape(chr(10).join(lines[i:j]))}</pre>")
            i = j
        else:
            j = i
            while j < len(lines) and lines[j].strip() and not re.match(r"^(#{1,4}\s|```|>|\s*([-*]|\d+\.)\s)", lines[j]) and not ("|" in lines[j] and j + 1 < len(lines) and re.match(r"^\s*\|?\s*:?-{3,}", lines[j + 1])):
                j += 1
            out.append(f"<p>{md_inline(' '.join(lines[i:j]))}</p>")
            i = j
    return "\n".join(out)


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


def call_summary(calls, callmap):
    """One plain sentence for the call changes: how many calls moved, where, and from which entry points."""
    nodes = list(callmap.values())
    if not nodes:
        return ""
    marks = [m[1].strip() for m in map(CALL.match, calls.splitlines()) if m]
    count = {m: marks.count(m) for m in "+-~"}
    files = {n["path"] for n in nodes if n["st"]}
    entries = [n for n in nodes if n["depth"] == 0 and n["changed"]]
    names = [".".join(re.sub(r"\(.*$", "", k.split("@")[0]).replace("new ", "").split(".")[-2:]) for k, n in callmap.items() if n in entries]
    parts = [f"{v} {w}" for v, w in ((count["+"], "added"), (count["-"], "removed"), (count["~"], "changed")) if v]
    if not parts:
        return "No calls were added or removed."
    calls = "call" if sum(count.values()) == 1 else "calls"
    head = f"{', '.join(parts[:-1]) + ' and ' + parts[-1] if len(parts) > 1 else parts[0]} {calls}, in {len(files)} file{'s' if len(files) != 1 else ''}"
    shown = ", ".join(f"`{x}`" for x in names[:4]) + (f" and {len(names) - 4} more" if len(names) > 4 else "")
    return f"{head[0].upper() + head[1:]}, reached from {len(entries)} entry point{'s' if len(entries) != 1 else ''}: {shown}." if entries else head + "."


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


# --- context outside the diff: nearby lines, definitions, callers -----------

CONTEXT = {"page": 30, "t3": 8}  # lines of folded context on each side of a kept range
BUILTINS = set(dir(__import__("builtins")))


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


class Lookup:
    """Definitions and callers read from git at the change's target, for code the diff does not show."""

    def __init__(self, change):
        self.change, self.by_path, self.ents, self.found = change, change.by_path(), {}, {}

    def text(self, path, side="new"):
        f = self.by_path.get(path)
        if f:
            return f["old_text" if side == "old" else "new_text"] or ""
        ref = self.change.base if side == "old" else self.change.target
        return (self.change._blob(ref, path) if ref else self.change._worktree(path)) or ""

    def entities(self, path, side="new"):
        if (path, side) not in self.ents:
            self.ents[path, side] = py_entities(self.text(path, side)) or {} if path.endswith(".py") else {}
        return self.ents[path, side]

    def grep(self, *args):
        ref = self.change.target if self.change.target else None
        res = subprocess.run(["git", "grep", "-n", "-I", *args, *([ref] if ref else []), "--", "*.py"], capture_output=True, text=True)
        out = []
        for line in res.stdout.splitlines():
            parts = line.split(":", 3) if ref else [None] + line.split(":", 2)
            if len(parts) == 4:
                out.append((parts[1], int(parts[2]), parts[3]))
        return out

    def prime(self, labels, names):
        """One grep for every definition and one for every caller the page will ask about."""
        bare = {re.sub(r"\(.*$", "", l).replace("new ", "").strip() for l in labels}
        words = {w for n in bare if re.fullmatch(r"[A-Za-z_][\w.]*", n) and n not in BUILTINS for w in n.split(".")}
        self.defs = {}
        if words:
            alt = "|".join(sorted(map(re.escape, words)))
            for p, line, t in self.grep("-E", rf"^\s*(async\s+)?(def|class)\s+({alt})\b"):
                self.defs.setdefault(re.match(r"\s*(?:async\s+)?(?:def|class)\s+(\w+)", t)[1], []).append((p, line))
        self.generic = lambda n: len(n) < 8 and n.isalpha() and n.islower()
        shorts = {n.rsplit(".", 1)[-1] for n in names} - {n for n in map(lambda x: x.rsplit(".", 1)[-1], names) if self.generic(n)}
        self.calls = self.grep("-E", rf"({'|'.join(sorted(map(re.escape, shorts)))})\(") if shorts else []

    def define(self, label, path, side):
        """Where a called name is defined: this file first, then the files in the change, then the repo."""
        name = re.sub(r"\(.*$", "", label).replace("new ", "").strip()
        if not re.fullmatch(r"[A-Za-z_][\w.]*", name) or name in BUILTINS:
            return None
        if (name, side) in self.found:
            return self.found[name, side]
        cls, _, meth = name.rpartition(".")
        hit = None
        for p in [path] + [f["path"] for f in self.change.files if f["path"] != path]:
            e = self.entities(p, side)
            if name in e:
                hit = (p, e[name])
                break
        if not hit and "." not in name:
            for p, line in self.defs.get(name, [])[:3]:
                e = self.entities(p, "new")
                if name in e:
                    hit = (p, e[name])
                    break
        if not hit and cls and "." not in cls:
            for p, line in self.defs.get(cls, [])[:3]:
                e = self.entities(p, "new")
                if name in e:
                    hit = (p, e[name])
                    break
        self.found[name, side] = hit and {"path": hit[0], "line": hit[1][1], "end": hit[1][2], "name": name}
        return self.found[name, side]

    def callers(self, name, limit=8, common=25):
        """Lines in the repo that call `name`, other than its own definition."""
        short = name.rsplit(".", 1)[-1]
        if self.generic(short):
            return {"total": None, "list": []}
        pat = rf"\.{re.escape(short)}\(" if "." in name else rf"(^|[^\w.]){re.escape(short)}\("
        hits = [h for h in self.calls if re.search(pat, h[2]) and not re.match(rf"\s*(async\s+)?(def|class)\s+{re.escape(short)}\b", h[2])]
        return {"total": len(hits), "list": [{"path": p, "line": n, "text": t.strip()[:160]} for p, n, t in hits[:limit]] if len(hits) <= common else []}


PAGE = os.path.join(HERE, "..", "assets", "page.html")
PAGE_JS = os.path.join(HERE, "..", "assets", "page.js")
# A T3 page loads page.js from the CDN rather than carrying 60 KB of it through html_render. The pin is the commit
# that holds the current page.js, and the hash proves the local copy matches it; when they differ (page.js edited
# since the last pin), the page inlines page.js instead. Re-pin with `meat_review.py pin <commit>` after merging.
PAGE_CDN = "https://cdn.jsdelivr.net/gh/Yeshwanthyk/agent-skills@{commit}/skills/meat-review/assets/page.js"
PAGE_PIN = ("", "")  # (commit, sha256 of page.js at that commit)


def pack_callmap(callmap):
    """The call tree's per-node detail, without what the page can rebuild: a node that is unchanged, outside the
    reading and has no definition to show is left out (its tree row already says where it is); default fields are
    dropped; paths go through one table; children are indexes into the node order. The page's unpack mirrors this."""
    paths, out = [], {}
    def pid(p):
        if p not in paths:
            paths.append(p)
        return paths.index(p)
    for key, n in callmap.items():
        if not (n["changed"] or n["range"] or n["finding"] or n.get("def")):
            continue
        m = {"p": pid(n["path"]), "line": n["line"]}
        if not (n["st"] == "" and n["say"].endswith(", unchanged.")):
            m["say"] = n["say"]
        for k, default in (("st", ""), ("side", "new"), ("range", ""), ("finding", ""), ("code", None), ("def", None)):
            if n.get(k, default) != default:
                m[k] = n[k]
        if n["end"] != n["line"]:
            m["end"] = n["end"]
        if n["kids"]:
            m["kids"] = [f"{k['label']}@{k['ref']}" for k in n["kids"]]
        out[key] = m
    order = {k: i for i, k in enumerate(out)}
    for m in out.values():
        if "kids" in m:
            m["kids"] = [order[k] for k in m["kids"] if k in order]
    return {"callmap": out, "paths": paths}


def page_data(change, reading, host="page", max_code=None):
    """Everything the page draws, with code rows taken from git. The T3 view keeps the first
    `max_code` code rows of kept ranges; the rest are listed for the full page."""
    read, skimmed, uncovered = ordered(change, reading)
    files, budget, later = [], max_code, []
    for item, f in read:
        ranges = []
        for n, k in enumerate(item["keep"], 1):
            label, out = f"{item['_id']}.{n}", []
            bs = blocks(f, k)
            size = sum(1 for b in bs if "row" in b) + sum(1 for b in bs if "hidden" in b)
            if budget is not None and size > budget and ranges + files:
                later.append({"label": label, "path": f["path"], "start": k["start"], "end": k["end"], "note": k.get("note", "")})
                continue
            if budget is not None:
                budget -= size
            run = []
            for b in bs + [None]:
                if b and "row" in b:
                    run.append(b["row"])
                    continue
                if run:
                    out.append(page_rows(f, run))
                    run = []
                if b:
                    out.append({"hidden": b["hidden"], "label": hidden_label(b), **page_rows(f, b["rows"])})
            ctx = dict(context_blocks(f, k, item["keep"], CONTEXT[host]))
            out = ([ctx["above"]] if "above" in ctx else []) + out + ([ctx["below"]] if "below" in ctx else [])
            ranges.append({"id": label.replace(".", "-"), "label": label, "note": k.get("note", ""),
                           "start": k["start"], "end": k["end"], "side": k.get("side", "new"), "blocks": out})
        files.append({"id": item["_id"], "path": f["path"], "kind": item["kind"], "reason": item.get("reason", ""),
                      "added": f["added"], "removed": f["removed"], "ranges": ranges})
    calls, callmap = annotate_calls(calls_viz(change, read), reading, read)
    by_path = {f["path"]: f for f in change.files}
    for n in callmap.values():
        f = by_path.get(n["path"])
        if n["st"] and f:
            lines = f["old_lines" if n["side"] == "old" else "new_lines"]
            n["code"] = lines[n["line"] - 1:min(n["end"], n["line"] + (4 if host == "t3" else 7))]
    look, defs = Lookup(change), {}
    look.prime([k.split("@")[0] for k in callmap], [e["name"] for e in semantic_changes(change)])
    span = 12 if host == "t3" else 40
    for key, n in callmap.items():
        d = look.define(key.split("@")[0], n["path"], n["side"])
        if not d:
            continue
        dk = f"{d['path']}:{d['line']}"
        if dk not in defs:
            lines = look.text(d["path"], n["side"] if d["path"] in by_path else "new").splitlines()
            f = by_path.get(d["path"])
            changed = bool(f) and any(h[3] and h[2] <= d["end"] and h[2] + h[3] > d["line"] for h in f.setdefault("_hunks", hunks(f)))
            # On T3 a changed definition is already in the diff; carry only the ones the reader cannot see.
            defs[dk] = None if host == "t3" and changed else d | {"code": lines[d["line"] - 1:min(d["end"], d["line"] + span - 1)], "more": max(0, d["end"] - d["line"] + 1 - span), "changed": changed}
        if defs[dk]:
            n["def"] = dk
    found = reading.get("findings", []) or []
    kept = [(f["path"], f"{item['_id']}-{n}", k) for item, f in read for n, k in enumerate(item["keep"], 1) if k.get("side", "new") == "new"]
    entities = []
    for e in semantic_changes(change):
        hit = next((x for x in found if x["file"] == e["file"] and x.get("side", "new") == e["side"] and e["line"] <= x["line"] <= e["end"]), None)
        rng = next((r[1] for r in kept if r[0] == e["file"] and e["side"] == "new" and r[2]["start"] <= e["end"] and r[2]["end"] >= e["line"]), "")
        who = look.callers(e["name"], limit=4 if host == "t3" else 8) if e["change"] != "formatting" and not re.search(r"(^|/)tests?/|test_[^/]*$", e["file"]) else None
        if who:
            for c in who["list"]:
                f = by_path.get(c["path"])
                c["new"] = bool(f) and any(h[3] and h[2] <= c["line"] < h[2] + h[3] for h in f.setdefault("_hunks", hunks(f)))
        entities.append(e | {"say": say_entity(e), "range": rng, "finding": hit["id"] if hit else "", "callers": who})
    outline = []
    for c in reading.get("outline", []) or []:
        kind = c.get("kind", "markdown")
        outline.append({"title": c.get("title", ""), "kind": kind, "body": c.get("body", "")} | ({"html": md_html(c.get("body", ""))} if kind == "markdown" else {}))
    return {
        "host": host,
        "key": f"{change.base}:{change.target or 'worktree'}:{change.only or ''}",
        "title": change.ref or "working changes",
        "label": change.label,
        "manifest": manifest(change, reading, read),
        "summary": reading.get("summary", ""),
        "outline": outline,
        "invariants": reading.get("invariants", []) or [],
        "calls": calls,
        "callsum": call_summary(calls, callmap),
        **pack_callmap(callmap),
        "entities": entities,
        "defs": {k: v for k, v in defs.items() if v},
        "findings": [{k: x[k] for k in ("id", "file", "line", "endLine", "side", "severity", "area", "title", "text", "author") if k in x} for x in findings_sorted(reading, read)],
        "tests": reading.get("tests", []) or [],
        "files": [f for f in files if f["ranges"]] if host == "t3" else files,
        "later": later,
        "skimmed": [{"path": f["path"], "kind": i["kind"], "reason": i.get("reason", "")} for i, f in skimmed],
        "uncovered": uncovered,
    }


def cmd_render_html(change, reading, args, host="page"):
    data = page_data(change, reading, host, args.max_code if host == "t3" else None)
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
            print(f"page.js differs from the CDN pin, so it is inlined (+{len(js) // 1024} KB)", file=sys.stderr)
        script = "<script>\n" + js.decode().replace("</script", "<\\/script") + "\n</script>"
    with open(PAGE) as fh:
        page = fh.read().replace("/*DATA*/", blob, 1).replace("/*PAGE_JS*/", script, 1).replace("/*VIZ_CDN*/", VIZ_CDN, 1)
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
    body = {k: reading[k] for k in ("summary", "outline", "files", "tests") if k in reading}
    if reading.get("invariants"):
        table = invariants_md(reading["invariants"]).split("\n", 2)[2]
        body["outline"] = list(body.get("outline", [])) + [{"title": "What must stay true", "kind": "markdown", "body": table}]
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
    p.add_argument("cmd", choices=["prompt", "check", "render", "publish", "taste", "pin"])
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
    p.add_argument("--max-code", type=int, default=120, help="markdown and --t3: code lines before the rest is listed (default 120)")
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
