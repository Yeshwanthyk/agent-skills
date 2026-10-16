#!/usr/bin/env python3
"""Build and feed viz pages. Grammar: ../references/grammar.md.

  viz.py html IN.viz [-o OUT.html] [--open]   check, then build a standalone page with viz.js inlined
                                              (default OUT: /tmp/viz/<name>.html)
  viz.py t3 IN.viz [--inline]                 the html_render page: CDN script, or the renderer inlined
  viz.py inline PAGE.html                     fill <script data-viz></script> in an existing page with viz.js (rerun to update)
  viz.py check IN.viz                         parse with node and print errors (exit 1 on any)
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
CDN = "https://cdn.jsdelivr.net/gh/Yeshwanthyk/agent-skills@dc75a053f09455964a53772d7a89649163ed872a/skills/viz/assets/viz.min.js"
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
console.log(d.sections.map((s) => s.kind === 'graph' ? `graph ${s.name} (${s.view}): ${s.nodes.length} nodes, ${s.edges.length} edges, ${s.paths.length} paths, ${s.steps.length} steps${s.cover ? `, cover ${s.cover.rows.length} rows` : ''}` : `tree ${s.name}`).join('\n'));
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


def cmd_check(args):
    sys.exit(check(args[0]))


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
