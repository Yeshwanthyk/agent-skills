#!/usr/bin/env python3
"""Which skills, playbooks, principles, and references a session actually used.

Reads a Claude Code or pi session transcript (JSONL) and reports what was read
(file reads, bash commands naming the files, Skill tool calls, /skill: loads)
next to what the replies claimed on their `Method:` and `Used:` lines.

    powerball_usage.py report <transcript.jsonl> [--json]
    powerball_usage.py status <transcript.jsonl>        # one short line, cached

`status` keeps a per-transcript cache (byte offset + state) under
~/.cache/powerball so a status line can call it on every refresh.
Python 3.9 compatible; stdlib only. Calls made inside codemode scripts in pi
leave no record in the transcript, so reads made that way are not counted.
"""

import hashlib
import json
import os
import re
import sys

MODE = "yesh-router"
# <name>/SKILL.md, yesh-router/playbooks/<x>.md, yesh-router/references/[principles/]<x>.md
PATH_RE = re.compile(
    r"(?:^|[\s'\"=/(<:])"
    r"(?P<name>[a-z][\w-]*)/"
    r"(?:(?P<skill>SKILL\.md)"
    r"|playbooks/(?P<playbook>[\w-]+)\.md"
    r"|references/principles/(?P<principle>[\w-]+)\.md"
    r"|references/(?P<reference>[\w-]+)\.md)"
)
BASE_DIR_RE = re.compile(r"Base directory for this skill: \S*/([\w-]+)")
PI_SKILL_RE = re.compile(r'<skill name="([\w-]+)" location=')
LINE_RE = re.compile(r"^\W*(Method|Used):\**\s*(.+)$", re.M)
KINDS = ("skills", "playbooks", "principles", "references")


def empty_state():
    return {k: [] for k in KINDS} | {"method": [], "used": [], "mode_loads": 0}


def add(state, kind, name):
    if name not in state[kind]:
        state[kind].append(name)


def classify_text(state, text):
    """Record every skill/playbook/principle/reference path named in text."""
    for m in PATH_RE.finditer(text):
        name = m.group("name")
        if m.group("skill"):
            if name == MODE:
                state["mode_loads"] += 1
            else:
                add(state, "skills", name)
        elif name != MODE:
            continue  # playbooks/references outside the router are skill internals
        elif m.group("playbook"):
            add(state, "playbooks", m.group("playbook"))
        elif m.group("principle"):
            add(state, "principles", m.group("principle"))
        elif m.group("reference"):
            add(state, "references", m.group("reference"))


def skill_loaded(state, name):
    if name == MODE:
        state["mode_loads"] += 1
    else:
        add(state, "skills", name)


def _text_of(content):
    if isinstance(content, str):
        return content
    out = []
    for b in content or []:
        if isinstance(b, dict) and b.get("type") == "text":
            out.append(b.get("text", ""))
    return "\n".join(out)


def feed(state, entry):
    """Update state from one transcript entry (Claude Code or pi format)."""
    if entry.get("isSidechain"):
        return
    msg = entry.get("message") if isinstance(entry.get("message"), dict) else None
    if msg is None:
        return
    role = msg.get("role") or entry.get("type")
    content = msg.get("content")
    if role == "user":
        text = _text_of(content)
        for name in BASE_DIR_RE.findall(text):
            skill_loaded(state, name)
        for name in PI_SKILL_RE.findall(text):
            skill_loaded(state, name)
        return
    if role != "assistant" or not isinstance(content, list):
        return
    for b in content:
        if not isinstance(b, dict):
            continue
        t = b.get("type")
        if t == "text":
            for kind, rest in LINE_RE.findall(b.get("text", "")):
                state[kind.lower()].append(rest.strip()[:200])
        elif t in ("tool_use", "toolCall"):
            name = b.get("name", "")
            args = b.get("input") if t == "tool_use" else b.get("arguments")
            args = args if isinstance(args, dict) else {}
            if name == "Skill" and args.get("skill"):
                skill_loaded(state, str(args["skill"]).split(":")[-1])
                continue
            classify_text(state, " " + json.dumps(args))


def parse(path, state=None, offset=0):
    state = state or empty_state()
    with open(path, "rb") as f:
        f.seek(offset)
        while True:
            line = f.readline()
            if not line:
                break
            if not line.endswith(b"\n"):
                break  # partial line still being written; reread next time
            offset += len(line)
            try:
                feed(state, json.loads(line))
            except ValueError:
                continue
    return state, offset


def claims(state):
    """Skills, playbooks and principles named on the last Used: line."""
    if not state["used"]:
        return None
    parts = [p.strip() for p in state["used"][-1].split("·")]
    out = {"skills": [], "playbooks": [], "principles": []}
    for i, p in enumerate(parts):
        key, colon, val = p.partition(":")
        key = key.strip().lower()
        if not colon:
            if i == 0:
                val, key = p, "skills"
            else:
                continue  # e.g. "steps 4/5"
        names = [n.strip(" `*") for n in re.split(r"[,+]", val) if n.strip(" `*—-")]
        if key == "skills" or i == 0:
            out["skills"] += names
        elif key.startswith("playbook"):
            out["playbooks"] += names
        elif key.startswith("principle"):
            out["principles"] += names
    return out


def unread_claims(state):
    c = claims(state)
    if not c:
        return []
    miss = []
    for kind in ("skills", "playbooks", "principles"):
        for n in c[kind]:
            if n.lower() not in ("direct", "none") and n not in state[kind]:
                miss.append(kind[:-1] + ":" + n)
    return miss


def status_line(state):
    bits = []
    if state["skills"]:
        bits.append("·".join(state["skills"][-4:]))
    if state["playbooks"]:
        bits.append("pb " + "·".join(state["playbooks"][-2:]))
    if state["principles"]:
        bits.append("%dp" % len(state["principles"]))
    miss = unread_claims(state)
    if miss:
        bits.append("!unread " + ",".join(miss[:2]))
    return " │ ".join(bits)


def cached_status(path):
    cache_dir = os.path.expanduser("~/.cache/powerball")
    os.makedirs(cache_dir, exist_ok=True)
    key = hashlib.sha1(os.path.abspath(path).encode()).hexdigest()[:16]
    cache = os.path.join(cache_dir, key + ".json")
    state, offset = None, 0
    try:
        with open(cache) as f:
            saved = json.load(f)
        if saved.get("offset", 0) <= os.path.getsize(path):
            state, offset = saved["state"], saved["offset"]
    except (OSError, ValueError, KeyError):
        pass
    state, offset = parse(path, state, offset)
    tmp = cache + ".tmp"
    with open(tmp, "w") as f:
        json.dump({"offset": offset, "state": state}, f)
    os.replace(tmp, cache)
    return status_line(state)


def main(argv):
    if len(argv) < 2 or argv[0] not in ("report", "status"):
        print(__doc__.strip().splitlines()[0], file=sys.stderr)
        print("usage: powerball_usage.py report|status <transcript.jsonl> [--json]", file=sys.stderr)
        return 2
    path = os.path.expanduser(argv[1])
    if not os.path.isfile(path):
        return 0 if argv[0] == "status" else 1
    if argv[0] == "status":
        print(cached_status(path))
        return 0
    state, _ = parse(path)
    state["claimed"] = claims(state)
    state["unread_claims"] = unread_claims(state)
    if "--json" in argv:
        print(json.dumps(state, indent=2))
        return 0
    for k in KINDS:
        print("%-11s %s" % (k + ":", ", ".join(state[k]) or "—"))
    print("mode loads: %d · Method lines: %d · Used lines: %d"
          % (state["mode_loads"], len(state["method"]), len(state["used"])))
    if state["method"]:
        print("last Method: " + state["method"][-1])
    if state["used"]:
        print("last Used:   " + state["used"][-1])
    if state["unread_claims"]:
        print("claimed but never read: " + ", ".join(state["unread_claims"]))
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
