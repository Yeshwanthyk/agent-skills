#!/usr/bin/env python3
"""Build and lint emphasis boards.

  emphasis.py check FILE.emph          lint: unknown pill words, attention pills without an action
  emphasis.py html FILE.emph [-o OUT] [--open] [--t3]
                                       lint, then write a self-contained page (renderer inlined)

The pill words come from the VOCAB block in ../assets/emphasis.js, the single source.
"""
import argparse
import json
import re
import subprocess
import sys
from pathlib import Path

SKILL = Path(__file__).resolve().parent.parent
RENDERER = SKILL / "assets" / "emphasis.js"


def vocab():
    src = RENDERER.read_text()
    block = src.split("/* VOCAB:start */")[1].split("/* VOCAB:end */")[0]
    body = block.split("=", 1)[1].strip().rstrip(";")
    # The block is a JS object literal with bare keys; quote them to read it as JSON.
    body = re.sub(r"(\{|,)\s*([A-Za-z]+):", r'\1 "\2":', body)
    body = re.sub(r",\s*([}\]])", r"\1", body)
    return json.loads(body)


def tone_table(v):
    table = {}
    for tone in ("error", "warning", "success", "danger", "mode", "owner", "context"):
        for w in v[tone]:
            table[w.lower()] = (w, tone)
    for src, dst in v["synonyms"].items():
        table[src.lower()] = table[dst.lower()]
    return table


def parse_pill(raw, table):
    words = raw.strip().split()
    for n in range(min(3, len(words)), 0, -1):
        head = " ".join(words[:n]).rstrip(":").lower()
        if head in table:
            return table[head]
    return None


def check(text):
    v = vocab()
    table = tone_table(v)
    needs = set(v["needsAction"])
    lead = re.compile(r"\*\*(%s):\*\*" % "|".join(v["leadins"]))
    problems = []
    for i, line in enumerate(text.splitlines(), 1):
        if line.lstrip().startswith("#") and "[[" in line:
            problems.append(f"line {i}: pill in a heading; put it on an item line")
        m = re.match(r"^\s*(?:[-*]\s+)?\[\[([^\]]{1,40})\]\]\s*(.*)$", line)
        if not m:
            continue
        hit = parse_pill(m.group(1), table)
        if hit is None:
            problems.append(f'line {i}: unknown pill word "{m.group(1)}"; use a word from references/words.md')
            continue
        word, tone = hit
        if (tone in needs or word in needs) and not lead.search(m.group(2)):
            problems.append(f"line {i}: [[{word}]] needs its action, e.g. **Next:** / **Do:** / **Check:**")
    return problems


def build(text, title, t3=False):
    js = RENDERER.read_text().replace("</script", "<\\/script")
    safe = text.replace("</script", "<\\/script")
    return (
        f'<!doctype html><html{" class=em-t3" if t3 else ""}><meta charset="utf-8"><meta name="viewport" content="width=device-width">'
        f"<title>{title}</title><body>\n<script type=\"text/emphasis\">\n{safe}\n</script>\n<script>{js}</script>\n"
    )


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = ap.add_subparsers(dest="cmd", required=True)
    c = sub.add_parser("check")
    c.add_argument("file")
    h = sub.add_parser("html")
    h.add_argument("file")
    h.add_argument("-o", "--out")
    h.add_argument("--open", action="store_true")
    h.add_argument("--t3", action="store_true", help="for html_render: theme colors, no page background or padding")
    a = ap.parse_args()

    path = Path(a.file)
    text = path.read_text()
    problems = check(text)
    for p in problems:
        print(f"emphasis: {path}: {p}", file=sys.stderr)
    if a.cmd == "check":
        sys.exit(1 if problems else 0)
    if problems:
        sys.exit(1)
    out = Path(a.out) if a.out else path.with_suffix(".html")
    m = re.search(r"^#\s+(.*)$", text, re.M)
    out.write_text(build(text, m.group(1) if m else path.stem, a.t3))
    print(out)
    if a.open:
        subprocess.run(["open", str(out)], check=False)


if __name__ == "__main__":
    main()
