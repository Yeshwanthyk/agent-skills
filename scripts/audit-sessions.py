#!/usr/bin/env python3
"""Audit powerball pickup across recent Claude Code and pi sessions.

For each session: whether the router/mode left a trace (loaded, quoted, or a
Method line; transcripts do not record the system prompt), Method/Used line counts, what was
actually read (skills, playbooks, principles), what the last Used line claimed
but never read, todo-tool use, spawns, and text diagrams (box or arrow art in a fenced block). Prints a table and totals.

    audit-sessions.py [--days N] [--json] [--claude DIR] [--pi DIR]

Python 3.9 compatible; stdlib only. Skips subagent sidechains, T3 title and
skilltest sessions. Reads made inside pi codemode scripts are not recorded in
transcripts, so they are not counted.
"""

import argparse
import glob
import importlib.util
import json
import os
import re
import sys
import time

HERE = os.path.dirname(os.path.abspath(__file__))
_spec = importlib.util.spec_from_file_location(
    "powerball_usage", os.path.join(HERE, "..", "skills", "yesh-router", "scripts", "powerball_usage.py"))
usage = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(usage)

TODO_TOOLS = {"TodoWrite", "TaskCreate", "TaskUpdate", "todo"}
SPAWN_TOOLS = {"Agent", "Task", "subagent_spawn", "delegate_task", "mcp__t3-code__t3_thread_launch",
               "mcp__t3-code__delegate_task"}
SKIP = ("skilltest", "t3code-claude-title", "/subagents/")


def extra_counts(path):
    todo = spawns = 0
    mode_on = False
    with open(path, "rb") as f:
        for raw in f:
            if b"Powerball mode is ON" in raw or b"<powerball>" in raw:
                mode_on = True
            if b"tool_use" not in raw and b"toolCall" not in raw:
                continue
            try:
                e = json.loads(raw)
            except ValueError:
                continue
            if e.get("isSidechain"):
                continue
            msg = e.get("message") if isinstance(e.get("message"), dict) else {}
            for b in msg.get("content") or []:
                if isinstance(b, dict) and b.get("type") in ("tool_use", "toolCall"):
                    n = b.get("name", "")
                    todo += n in TODO_TOOLS
                    spawns += n in SPAWN_TOOLS
    return todo, spawns, mode_on


DIAGRAM = re.compile(r"[─│┌┐└┘├┤┬┴┼▶◀▼▲→←↓↑]|-->|<--")
FENCE = re.compile(r"```(\w*)\n(.*?)```", re.S)
CODE_LANGS = {"python", "py", "ts", "tsx", "js", "javascript", "bash", "sh", "zsh", "json", "sql", "diff",
              "rust", "go", "yaml", "toml", "mermaid", "viz"}


def text_diagrams(path):
    """Fenced blocks in assistant replies drawn with box or arrow characters on 3+ lines.

    In T3 Code these render as plain text; diagrams belong in viz through html_render.
    """
    n = 0
    with open(path, "rb") as f:
        for raw in f:
            if b"```" not in raw:
                continue
            try:
                e = json.loads(raw)
            except ValueError:
                continue
            if e.get("isSidechain") or e.get("type") != "assistant":
                continue
            msg = e.get("message") if isinstance(e.get("message"), dict) else {}
            for b in msg.get("content") or []:
                if isinstance(b, dict) and b.get("type") == "text":
                    for lang, body in FENCE.findall(b.get("text", "")):
                        if lang.lower() not in CODE_LANGS and sum(
                                1 for line in body.splitlines() if DIAGRAM.search(line)) >= 3:
                            n += 1
    return n


NOT_USER = ("<task-notification", "This session is being continued", "<command-", "[SYSTEM NOTIFICATION",
            "<local-command", "Caveat:")
OLD_ROUTER = b"Activation is explicit and sticky"


def _user_text(msg):
    c = msg.get("content")
    if isinstance(c, str):
        return c
    if isinstance(c, list) and not any(isinstance(b, dict) and b.get("type") == "tool_result" for b in c):
        return " ".join(b.get("text", "") for b in c if isinstance(b, dict) and b.get("type") == "text")
    return ""


def turns(path):
    """Real user turns in a Claude transcript: [{prompt, hook, work, header}].

    hook: the per-turn reminder was injected. work: the reply used a tool (a one-line
    answer needs no header). header: the reply has a Method: line. Repeated prompts
    (T3 resends) count once.
    """
    out, cur, seen = [], None, set()
    with open(path, "rb") as f:
        for raw in f:
            try:
                e = json.loads(raw)
            except ValueError:
                continue
            if e.get("isSidechain"):
                continue
            if e.get("type") == "attachment" and (e.get("attachment") or {}).get("type") == "hook_additional_context":
                if cur:
                    cur["hook"] = True
                continue
            msg = e.get("message") if isinstance(e.get("message"), dict) else {}
            if e.get("type") == "user":
                text = _user_text(msg).strip()
                if not text or text.startswith(NOT_USER):
                    continue
                cur = None
                if text[:300] in seen:
                    continue
                seen.add(text[:300])
                cur = {"prompt": text[:300], "hook": False, "work": False, "header": False}
                out.append(cur)
            elif e.get("type") == "assistant" and cur:
                for b in msg.get("content") or []:
                    if not isinstance(b, dict):
                        continue
                    if b.get("type") == "tool_use":
                        cur["work"] = True
                    elif b.get("type") == "text" and usage.LINE_RE.search(b.get("text", "")):
                        if any(m.group(1) == "Method" for m in usage.LINE_RE.finditer(b["text"])):
                            cur["header"] = True
    return out


def sessions(roots, days):
    cutoff = time.time() - days * 86400
    for host, root in roots:
        for path in glob.glob(os.path.join(os.path.expanduser(root), "**", "*.jsonl"), recursive=True):
            if any(s in path for s in SKIP) or os.path.getmtime(path) < cutoff:
                continue
            yield host, path


def main(argv=None):
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument("--days", type=float, default=7)
    ap.add_argument("--json", action="store_true")
    ap.add_argument("--claude", default="~/.claude/projects")
    ap.add_argument("--pi", default="~/.pi/agent/sessions")
    args = ap.parse_args(argv)

    rows, firsts = [], set()
    for host, path in sessions([("claude", args.claude), ("pi", args.pi)], args.days):
        state, _ = usage.parse(path)
        todo, spawns, mode_on = extra_counts(path)
        ts = turns(path) if host == "claude" else []
        if ts:  # a T3 fork or continuation repeats the parent's opening turns
            key = ts[0]["prompt"]
            if key in firsts:
                continue
            firsts.add(key)
        with open(path, "rb") as f:
            old_router = OLD_ROUTER in f.read()
        rows.append({
            "host": host, "session": os.path.basename(path)[:-6].split("_")[-1], "path": path,
            "mtime": os.path.getmtime(path),
            # Transcripts do not record the system prompt, so "on" means the router text was
            # loaded or quoted, or a Method line appeared (the output style leaves no other trace).
            "mode_on": mode_on or state["mode_loads"] > 0 or bool(state["method"]),
            "method_lines": len(state["method"]), "used_lines": len(state["used"]),
            "skills": state["skills"], "playbooks": state["playbooks"],
            "principles": state["principles"], "unread_claims": usage.unread_claims(state),
            "todo_calls": todo, "spawns": spawns, "old_router": old_router,
            "text_diagrams": text_diagrams(path),
            "turns": [{k: t[k] for k in ("hook", "work", "header")} for t in ts],
        })
    rows.sort(key=lambda r: r["mtime"])
    if args.json:
        print(json.dumps(rows, indent=2))
        return 0

    print("%-6s %-10s %-4s %4s %4s %4s %5s %4s  %-40s %s" % (
        "host", "session", "mode", "Meth", "Used", "todo", "spawn", "txtd", "read (skills | playbooks | principles)", "claimed, unread"))
    for r in rows:
        read = "%s | %s | %s" % (",".join(r["skills"]) or "-", ",".join(r["playbooks"]) or "-",
                                  len(r["principles"]))
        print("%-6s %-10s %-4s %4d %4d %4d %5d %4d  %-40s %s" % (
            r["host"], r["session"][:10], "on" if r["mode_on"] else "-", r["method_lines"], r["used_lines"],
            r["todo_calls"], r["spawns"], r["text_diagrams"], read[:40], ",".join(r["unread_claims"]) or ""))
    on = [r for r in rows if r["mode_on"]]
    def share(rs, key):
        return "%d/%d" % (sum(1 for r in rs if r[key]), len(rs))
    print("\nsessions %d, mode on %d" % (len(rows), len(on)))
    print("with mode on: Method line %s · Used line %s · read a skill %s · read a playbook %s · "
          "read a principle %s · used todo %s · claimed-unread %s" % (
              share(on, "method_lines"), share(on, "used_lines"), share(on, "skills"),
              share(on, "playbooks"), share(on, "principles"), share(on, "todo_calls"),
              share(on, "unread_claims")))
    print("text diagrams (box/arrow art in a fenced block; viz belongs in T3): %d in %s sessions" % (
        sum(r["text_diagrams"] for r in rows), share(rows, "text_diagrams")))
    work = [t for r in on if not r["old_router"] for t in r["turns"] if t["work"]]
    for label, hook in (("with reminder", True), ("without reminder", False)):
        ws = [t for t in work if t["hook"] is hook]
        print("work turns %s: header %d/%d" % (label, sum(t["header"] for t in ws), len(ws)))
    return 0


if __name__ == "__main__":
    sys.exit(main())
