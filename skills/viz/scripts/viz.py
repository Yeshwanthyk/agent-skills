#!/usr/bin/env python3
"""Build and feed viz pages. Grammar: ../references/grammar.md.

  viz.py html IN.viz [-o OUT.html] [--open]   check, then build a standalone page with viz.js inlined
                                              (default OUT: /tmp/viz/<name>.html)
  viz.py t3 IN.viz [--inline]                 the html_render page: CDN script, or the renderer inlined
  viz.py inline PAGE.html                     fill <script data-viz></script> in an existing page with viz.js (rerun to update)
  viz.py check IN.viz                         parse with node and print errors (exit 1 on any)
  viz.py check --refs [--root DIR] IN.viz     also check citations and backtick fragments (warnings exit 0)
  viz.py calldiff [calldiff diff args...]     run `calldiff diff --format json` and print a compact `== diff` section
  viz.py calltree [calldiff tree args...]     same for `calldiff tree`
"""
import html
import json
import os
import re
import subprocess
import sys
import webbrowser

HERE = os.path.dirname(os.path.abspath(__file__))
VIZ_JS = os.path.join(HERE, "..", "assets", "viz.js")
CDN = "https://cdn.jsdelivr.net/gh/Yeshwanthyk/agent-skills@6a1cdc925bbda5d9e0440498a191e8b3af175caf/skills/viz/assets/viz.js"
MARK = {"added": "+", "removed": "-", "changed": "~", "modified": "~"}


def page(viz_text, script_tag, standalone):
    bg = "html{background:#0a0a0a;color:#e9e6e1}body{margin:24px auto;max-width:960px;padding:0 16px}" if standalone else ""
    body = viz_text.replace("</script", "<\\/script")
    return (f"<!doctype html><html><head><meta charset=utf-8><meta name=viewport content=\"width=device-width\">"
            f"<style>{bg}</style></head><body>{script_tag}\n<script type=\"text/viz\">\n{body}\n</script></body></html>\n")


def cmd_html(args):
    src = args[0]
    out = args[args.index("-o") + 1] if "-o" in args else os.path.join("/tmp/viz", os.path.splitext(os.path.basename(src))[0] + ".html")
    os.makedirs(os.path.dirname(os.path.abspath(out)), exist_ok=True)
    check(src)  # errors also show on the page; printing them here saves opening it to find out
    with open(src) as f, open(VIZ_JS) as js:
        text, code = f.read(), js.read()
    with open(out, "w") as f:
        f.write(page(text, f"<script>{code}</script>", standalone=True))
    print(out)
    if "--open" in args:
        webbrowser.open("file://" + os.path.abspath(out))


def cmd_t3(args):
    with open(args[0]) as f, open(VIZ_JS) as js:
        tag = f"<script>{js.read()}</script>" if "--inline" in args else f"<script src=\"{CDN}\"></script>"
        sys.stdout.write(page(f.read(), tag, standalone=False))


CHECK_JS = r'''
global.window = {}; global.document = { readyState: 'loading', addEventListener() {} }; global.matchMedia = () => ({ matches: false });
require(process.argv[1]);
const d = window.Viz.parse(require('fs').readFileSync(process.argv[2], 'utf8'));
for (const e of d.errors) console.log(e);
console.log(d.sections.map((s) => s.kind === 'graph' ? `graph ${s.name} (${s.view}): ${s.nodes.length} nodes, ${s.edges.length} edges, ${s.paths.length} paths, ${s.steps.length} steps${s.cover ? `, cover ${s.cover.rows.length} rows` : ''}` : s.kind === 'tree' ? `tree ${s.name}` : `${s.kind} ${s.name}: ${({ timing: () => `${s.lanes.length} lanes, ${s.marks.length} windows`, gantt: () => `${s.rows.length} rows, ends at ${s.end}${s.cmp ? ` (was ${s.oend})` : ''}${s.crit ? `, ${s.crit.size} on the critical path` : ''}`, causes: () => `${s.fams.length} families, ${s.fams.reduce((a, f) => a + f.causes.length, 0)} causes`, board: () => `${s.cols.length} columns, ${s.cols.reduce((a, c) => a + c.cards.length, 0)} cards`, stock: () => `${s.pts.length} points`, waits: () => `${s.rel.length} holds/waits, ${s.cycles.length} deadlock${s.cycles.length === 1 ? '' : 's'}${s.stuck.length ? `, ${s.stuck.length} stuck` : ''}`, hist: () => `${s.b.length} buckets, ${s.total} samples${s.was ? ', with was' : ''}`, retries: () => `${s.lanes.length} clients, ${s.lanes.reduce((a, l) => a + l.at.length, 0)} attempts${s.policy ? ', with policy' : ''}` })[s.kind]?.() ?? ''}`).join('\n'));
process.exit(d.errors.length ? 1 : 0);
'''


REFS_JS = r'''
global.window = {}; global.document = { readyState: 'loading', addEventListener() {} }; global.matchMedia = () => ({ matches: false });
require(process.argv[1]);
const d = window.Viz.parse(require('fs').readFileSync(process.argv[2], 'utf8'));
const refs = [];
function collect(o, kind, section, id) {
  for (const ref of [...new Set([o.ref, ...(o.refs || []).map((r) => r[0])].filter(Boolean))])
    refs.push({ kind, section, id, n: o.n, st: o.st, ref, details: Object.values(o.info || {}) });
}
for (const s of d.sections) {
  if (s.kind === 'graph') {
    for (const n of s.nodes) collect(n, 'node', s.name, n.id);
    for (const e of s.edges) collect(e, 'edge', s.name, `${e.from} -> ${e.to}`);
  } else if (s.kind === 'tree') {
    const walk = (n) => { collect(n, 'node', s.name, n.label); for (const k of n.kids) walk(k); };
    for (const n of s.root.kids) walk(n);
  }
}
console.log(JSON.stringify({ base: d.base, errors: d.errors, refs }));
process.exit(d.errors.length ? 1 : 0);
'''


def cmd_inline(args):
    with open(args[0]) as f, open(VIZ_JS) as js:
        text, code = f.read(), js.read()
    tag = re.compile(r"<script data-viz>.*?</script>", re.S)
    if not tag.search(text):
        sys.exit(f"{args[0]}: no <script data-viz></script> placeholder")
    with open(args[0], "w") as f:
        f.write(tag.sub(lambda _: f"<script data-viz>{code}</script>", text, count=1))
    print(args[0])


def check(src):
    return subprocess.run(["node", "-e", CHECK_JS, VIZ_JS, src]).returncode


def check_refs(src, root):
    res = subprocess.run(["node", "-e", REFS_JS, VIZ_JS, src], capture_output=True, text=True)
    if res.stderr:
        sys.stderr.write(res.stderr)
    if not res.stdout:
        return res.returncode or 1
    doc = json.loads(res.stdout)
    for error in doc["errors"]:
        print(error)
    errors, warnings = len(doc["errors"]), 0
    uncertain = set()

    # Port of thimble's deterministic evidence check (safety-research/thimble,
    # Apache-2.0): quote/whitespace-insensitive holds and SHIFT_MAX = 5.
    def normalized(text):
        return re.sub(r'["`‘’“”]', "'", re.sub(r"\s+", "", text))

    for ref in doc["refs"]:
        label = f'{ref["kind"]} {ref["id"]} ({ref["section"]})'
        match = re.fullmatch(r"(.+?)(?::(\d+)(?:-(\d+))?)?", ref["ref"])
        path, start, end = match.groups()
        path = os.path.realpath(os.path.join(root, doc["base"] + path))
        failed = False
        try:
            if os.path.commonpath([path, os.path.realpath(root)]) != os.path.realpath(root):
                raise PermissionError("outside --root")
            with open(path, newline="") as f:
                lines = f.read().replace("\r\n", "\n").split("\n")
                if lines and lines[-1] == "":
                    lines.pop()
        except (OSError, UnicodeError) as error:
            reason = "file missing" if isinstance(error, FileNotFoundError) else "outside --root" if isinstance(error, PermissionError) and str(error) == "outside --root" else "cannot read file"
            print(f'error: {label}: @{ref["ref"]}: {reason}: {path}')
            errors += 1
            failed = True
        else:
            start, end = (int(start), int(end or start)) if start else (None, None)
            if start is not None and (start < 1 or end < start or end > len(lines)):
                reason = f"line {end} beyond file length {len(lines)}" if end > len(lines) else "invalid line range"
                print(f'error: {label}: @{ref["ref"]}: {reason}')
                errors += 1
                failed = True
            else:
                cited = lines if start is None else lines[max(0, start - 1 - 5):min(len(lines), end + 5)]
                haystack = normalized("\n".join(cited))
                for detail in ref["details"]:
                    for fragment in re.findall(r"`([^`]+)`", detail):
                        if normalized(fragment) not in haystack:
                            print(f'warning: {label}: @{ref["ref"]}: missing fragment `{fragment}`')
                            warnings += 1
                            failed = True
        key = (ref["section"], ref["id"], ref["n"])
        if failed and ref["kind"] == "node" and ref["st"] != "unk" and key not in uncertain:
            print(f'warning: {label}: should be ?')
            uncertain.add(key)
    print(f'refs: {len(doc["refs"])} checked, {errors} errors, {warnings} fragment warnings')
    return 1 if errors or res.returncode else 0


def cmd_check(args):
    if not [a for a in args if not a.startswith("--")]:
        sys.exit("usage: viz.py check <file.viz> [--refs [--root DIR]]")
    if "--refs" not in args:
        sys.exit(check(args[0]))
    args = [a for a in args if a != "--refs"]
    root = os.getcwd()
    if "--root" in args:
        i = args.index("--root")
        if i + 1 >= len(args):
            sys.exit("check --refs: --root needs a directory")
        root = args[i + 1]
        del args[i:i + 2]
    if len(args) != 1 or args[0].startswith("--"):
        sys.exit("usage: viz.py check --refs [--root DIR] IN.viz")
    sys.exit(check_refs(args[0], root))


def common_base(paths):
    parts = [p.split("/")[:-1] for p in paths if p]
    if not parts:
        return ""
    base = os.path.commonprefix(parts)
    return "/".join(base) + "/" if base else ""


def cmd_calldiff(sub, args):
    res = subprocess.run(["calldiff", sub, *args, "--locs", "--format", "json"], capture_output=True, text=True)
    if res.returncode != 0:
        sys.exit(res.stderr or res.stdout)
    data = json.loads(res.stdout)
    trees = [t["tree"] for t in data.get("trees", [])]
    files = []

    def collect(n):
        files.append(n.get("file", ""))
        for c in n.get("children", []):
            collect(c)

    for t in trees:
        collect(t)
    base = common_base(files)

    def changed(n):
        return n.get("status", "same") != "same" or any(changed(c) for c in n.get("children", []))

    out = []

    def emit(n, depth):
        # Unchanged subtrees collapse to their root, so a diff carries only the changed paths and their callers.
        st = MARK.get(n.get("status", "same"), "")
        loc = ""
        if n.get("file"):
            f = n["file"][len(base):] if n["file"].startswith(base) else n["file"]
            line = n.get("line", "")
            end = n.get("endLine")
            loc = f" @{f}:{line}" + (f"-{end}" if end and end != line else "")
        out.append(f"{st or ' '} {'  ' * depth}{n.get('label', n.get('key', '?'))}{loc}" if sub == "diff" else f"{'  ' * depth}{n.get('label')}{loc}")
        kids = n.get("children", [])
        if sub == "diff" and not changed(n):
            if kids:
                out[-1] += f"  # {len(kids)} unchanged calls hidden"
            return
        for c in kids:
            emit(c, depth + 1)

    for t in trees:
        if sub == "tree" or changed(t):
            emit(t, 0)
    frm, to = data.get("from", ""), data.get("to", "")
    head = f"== diff {frm}..{to or 'worktree'}" if sub == "diff" else "== tree " + (args[0] if args else "calls")
    print(f"base {base}" if base else "", head, *out, sep="\n")


def main():
    if len(sys.argv) < 2 or sys.argv[1] in ("-h", "--help"):
        sys.exit(__doc__)
    cmd, args = sys.argv[1], sys.argv[2:]
    if cmd == "html":
        cmd_html(args)
    elif cmd == "inline":
        cmd_inline(args)
    elif cmd == "check":
        cmd_check(args)
    elif cmd == "t3":
        cmd_t3(args)
    elif cmd in ("calldiff", "calltree"):
        cmd_calldiff("diff" if cmd == "calldiff" else "tree", args)
    else:
        sys.exit(__doc__)


if __name__ == "__main__":
    main()
