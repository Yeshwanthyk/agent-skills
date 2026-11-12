#!/usr/bin/env python3
"""Build the static PR images: one light style (../assets/pr-cards.css), no scripts, no viewer chrome.

  pr_cards.py schema SPEC.json -o OUT.png   schema-diff card; marks computed from base vs head, never written by hand
  pr_cards.py card FRAG.html -o OUT.png     any other card (type card, JSON example, flow) from an HTML fragment

Both write OUT.png at 2x through `viz.py shot` and keep the built page beside it as OUT.page.html.

SPEC.json for `schema`:
  {"base_ref": "master",
   "tables": [{"name": "TransactionPolicy", "pill": "1 live per business",
               "base": {"business": "fk", "is_default": "bool"},            # fields on the base ref; null: new table
               "head": {"business": "fk", "is_default": "bool null"},       # fields on the PR head; null: deleted
               "notes": {"is_default": "deprecated · dropped in #36075"}}]} # optional right-hand note per field
  A field only in head is added (green), only in base removed (red), in both with a different value changed
  (yellow). Equal fields fold into one grey line.

FRAG.html for `card` uses the classes in pr-cards.css. `<pre data-json="factory.json"></pre>` is filled with that
file, pretty-printed and coloured, so a JSON example is a dump of the real factory, never retyped.
Fragments may not carry <script>, <style>, <link>, style= or remote URLs.
"""
import html
import json
import os
import re
import subprocess
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
CSS = os.path.join(HERE, "..", "assets", "pr-cards.css")
VIZ = os.path.join(HERE, "..", "..", "viz", "scripts", "viz.py")
FORBIDDEN = [(r"<script", "a script"), (r"<style", "its own CSS"), (r"<link", "a stylesheet link"),
             (r"\sstyle\s*=", "an inline style"), (r"(src|href)\s*=\s*[\"']?https?:", "a remote URL")]
GREY_MAX = 120  # characters of unchanged field names before the grey line ends in …

esc = html.escape


def shell(body):
    with open(CSS) as f:
        css = f.read()
    return (f"<!doctype html><html><head><meta charset=utf-8><style>{css}</style></head>"
            f"<body><main class=\"sheet\">{body}</main></body></html>\n")


def shoot(body, out):
    out = os.path.abspath(out)
    page = os.path.splitext(out)[0] + ".page.html"
    with open(page, "w") as f:
        f.write(shell(body))
    r = subprocess.run([sys.executable, VIZ, "shot", page, "-o", out])
    if r.returncode:
        sys.exit(r.returncode)


def label(name, typ):
    return esc(f"{name} {typ}".strip())


def schema_card(t):
    base, head, notes = t.get("base"), t.get("head"), t.get("notes", {})
    name = esc(t["name"])
    pill = esc(t.get("pill", ""))
    if head is None:
        hd = f"<div class=\"hd gone\"><span class=\"nm\">{name}</span><span class=\"pill del\">deleted{' · ' + pill if pill else ''}</span></div>"
    elif base is None:
        hd = f"<div class=\"hd new\">+ {name}<span class=\"pill add\">new{' · ' + pill if pill else ''}</span></div>"
    else:
        hd = f"<div class=\"hd\">{name}{'<span class=\"pill\">' + pill + '</span>' if pill else ''}</div>"
    base, head = base or {}, head or {}
    same, rows = [], []
    for k in list(base) + [k for k in head if k not in base]:
        note = notes.get(k, "")
        if k in base and k in head:
            if base[k] == head[k]:
                same.append(k)
                continue
            kind, text, note = "chg", label(k, head[k]), note or f"was {base[k] or '(none)'}"
        elif k in head:
            kind, text = "add", label(k, head[k])
        else:
            kind, text = "rem", label(k, base[k])
        rows.append(f"<div class=\"row {kind}\"><span class=\"n\">{text}</span><span class=\"d\">{esc(note)}</span></div>")
    unknown = set(notes) - set(base) - set(head)
    if unknown:
        sys.exit(f"{t['name']}: notes for fields in neither base nor head: {', '.join(sorted(unknown))}")
    grey = ""
    if same:
        line = ", ".join(same)
        if len(line) > GREY_MAX:
            line = line[:GREY_MAX].rsplit(", ", 1)[0] + ", …"
        grey = f"<div class=\"row base\"><span class=\"n\">{esc(line)}</span></div>"
    return f"<div class=\"card\">{hd}{grey}{''.join(rows)}</div>"


def cmd_schema(spec_path, out):
    with open(spec_path) as f:
        spec = json.load(f)
    ref = spec.get("base_ref")
    if not ref:
        sys.exit("schema: base_ref is required (the PR's base branch, e.g. master); marks are relative to it")
    cards = "".join(schema_card(t) for t in spec["tables"])
    legend = (f"<div class=\"legend\"><b class=\"a\">+ added</b><b class=\"r\">− removed</b><b class=\"c\">~ changed</b>"
              f"<b>vs {esc(ref)} · grey: unchanged</b></div>")
    shoot(f"<div class=\"grid\">{cards}</div>{legend}", out)


def dump(v, ind=0):
    """json.dumps(indent=2), except an object or array of scalars that fits in 80 columns stays on one line."""
    one = json.dumps(v, ensure_ascii=False, separators=(", ", ": "))
    flat = not any(isinstance(x, (dict, list)) for x in (v.values() if isinstance(v, dict) else v if isinstance(v, list) else []))
    if not isinstance(v, (dict, list)) or (flat and ind + len(one) <= 80):
        return one.replace("{", "{ ", 1)[:-1] + " }" if isinstance(v, dict) and v else one
    pad, items = " " * (ind + 2), v.items() if isinstance(v, dict) else enumerate(v)
    body = [pad + (json.dumps(k) + ": " if isinstance(v, dict) else "") + dump(x, ind + 2) for k, x in items]
    o, c = "{}" if isinstance(v, dict) else "[]"
    return o + "\n" + ",\n".join(body) + "\n" + " " * ind + c


def color_json(value):
    text = dump(value)
    tok = re.compile(r'("(?:\\.|[^"\\])*")(\s*:)?|\b(true|false|null)\b|(-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)')

    def sub(m):
        if m.group(1):
            return f"<span class={'k' if m.group(2) else 's'}>{esc(m.group(1))}</span>{m.group(2) or ''}"
        return f"<span class=v>{esc(m.group(0))}</span>"
    out, last = [], 0
    for m in tok.finditer(text):
        out.append(esc(text[last:m.start()]))
        out.append(sub(m))
        last = m.end()
    out.append(esc(text[last:]))
    return "".join(out)


def cmd_card(frag_path, out):
    with open(frag_path) as f:
        frag = f.read()
    for pat, what in FORBIDDEN:
        if re.search(pat, frag, re.I):
            sys.exit(f"{frag_path}: a card may not carry {what}; every card uses pr-cards.css only")
    root = os.path.dirname(os.path.abspath(frag_path))

    def fill(m):
        with open(os.path.join(root, m.group(1))) as f:
            return f"<pre>{color_json(json.load(f))}</pre>"
    frag = re.sub(r"<pre data-json=\"([^\"]+)\"></pre>", fill, frag)
    shoot(frag, out)


def main():
    a = sys.argv[1:]
    if len(a) < 4 or a[2] != "-o" or a[0] not in ("schema", "card"):
        sys.exit(__doc__)
    (cmd_schema if a[0] == "schema" else cmd_card)(a[1], a[3])


if __name__ == "__main__":
    main()
