"""Normalize harness transcripts into one event list.

Every adapter emits the same events, so grading never depends on a harness's
tool names. Skill use is recognized from what the agent actually did: a skill
tool call, a read of a staged skill file (via a read tool or a shell command),
or a delegation brief that names a skill's entrypoint.
"""
from __future__ import annotations

import json
import re
from dataclasses import dataclass, field
from pathlib import Path

# "<name>/<rest>.md" at a path boundary, e.g. ".claude/skills/how/SKILL.md", or
# "how/SKILL.md" after `cd .claude/skills`. Lookahead finds overlapping matches;
# only names of staged skills count. A bare "playbooks/x.md" is the router's.
_SKILL_FILE = re.compile(r"(?=(?:^|[\s/\"'=])([a-z0-9][a-z0-9-]*)/([\w./-]+\.md))")


@dataclass
class Event:
    kind: str  # skill | read | edit | shell | delegate | tool
    name: str  # skill name, skill-root-relative path, file path, or tool name
    via: str = ""  # how a skill or read was reached: tool | read | shell | brief
    detail: str = ""


@dataclass
class Transcript:
    events: list[Event] = field(default_factory=list)
    final_text: str = ""
    discovered_skills: list[str] = field(default_factory=list)
    metrics: dict = field(default_factory=dict)
    error: str = ""

    def skills_used(self) -> set[str]:
        return {e.name for e in self.events if e.kind == "skill"}

    def files_read(self) -> set[str]:
        return {e.name for e in self.events if e.kind == "read"}

    def edits(self) -> set[str]:
        return {e.name for e in self.events if e.kind == "edit"}

    def methods_used(self) -> set[str]:
        """Skills plus router playbooks (reached by reading their file)."""
        playbooks = {Path(r).stem for r in self.files_read() if "/playbooks/" in r}
        return self.skills_used() | playbooks


def _skill_refs(text: str, known: set[str], via: str) -> list[Event]:
    """Reads of staged skill files mentioned in a path, command, or brief."""
    out = []
    for m in _SKILL_FILE.finditer(text):
        name, rest = m.groups()
        parent = re.search(r"([a-z0-9-]+)/$", text[: m.start(1)])
        if parent and parent.group(1) in known:
            continue  # inside "<skill>/...", already counted by the outer match
        if name == "playbooks":
            name, rest = "yesh-router", f"playbooks/{rest}"
        if name not in known and name != "references":
            continue
        out.append(Event("read", f"{name}/{rest}", via))
        if rest == "SKILL.md":
            out.append(Event("skill", name, via))
    return out


_CD = re.compile(r"\bcd\s+[\"']?([^\s;&|\"']+)")
_BARE = re.compile(r"(?<![\w/.-])(SKILL\.md|references/[\w./-]+\.md)")


def _cd_refs(cmd: str, known: set[str]) -> list[Event]:
    """`cd .claude/skills/<name> && cat SKILL.md`: bare files read inside a skill dir."""
    out = []
    cds = list(_CD.finditer(cmd))
    for i, m in enumerate(cds):
        name = m.group(1).rstrip("/").rsplit("/", 1)[-1]
        if name not in known:
            continue
        end = cds[i + 1].start() if i + 1 < len(cds) else len(cmd)
        for f in _BARE.finditer(cmd, m.end(), end):
            out.append(Event("read", f"{name}/{f.group(1)}", "shell"))
            if f.group(1) == "SKILL.md":
                out.append(Event("skill", name, "shell"))
    return out


def _tool_events(tool: str, inp: dict, known: set[str]) -> list[Event]:
    t = tool.lower()
    if t == "skill":
        name = str(inp.get("skill") or inp.get("name") or "").split(":")[-1]
        return [Event("skill", name, "tool")]
    if t in ("read", "view"):
        path = str(inp.get("file_path") or inp.get("path") or "")
        return _skill_refs(path, known, "read") or [Event("tool", tool, detail=path)]
    if t in ("edit", "write", "multiedit", "notebookedit"):
        return [Event("edit", str(inp.get("file_path") or inp.get("path") or ""))]
    if t == "bash":
        cmd = str(inp.get("command") or "")
        return [Event("shell", "bash", detail=cmd[:300])] + _skill_refs(cmd, known, "shell") + _cd_refs(cmd, known)
    if t in ("agent", "task", "subagent"):
        brief = str(inp.get("prompt") or inp.get("task") or "")
        refs = [Event(e.kind, e.name, "brief") for e in _skill_refs(brief, known, "brief")]
        return [Event("delegate", tool, detail=brief[:300])] + refs
    return [Event("tool", tool, detail=json.dumps(inp)[:200])]


def parse_claude(stream: str, known: set[str]) -> Transcript:
    """Claude Code `-p --output-format stream-json --verbose`."""
    tr = Transcript()
    for line in stream.splitlines():
        try:
            msg = json.loads(line)
        except json.JSONDecodeError:
            continue
        kind = msg.get("type")
        if kind == "system" and msg.get("subtype") == "init":
            tr.discovered_skills = list(msg.get("skills") or [])
            tr.metrics["model"] = msg.get("model", "")
        elif kind == "assistant":
            for item in msg.get("message", {}).get("content", []):
                if item.get("type") == "tool_use":
                    tr.events += _tool_events(item.get("name", ""), item.get("input") or {}, known)
                elif item.get("type") == "text" and not msg.get("parent_tool_use_id"):
                    tr.final_text = item.get("text", "")
        elif kind == "result":
            tr.final_text = msg.get("result") or tr.final_text
            tr.metrics.update(
                cost_usd=msg.get("total_cost_usd"),
                turns=msg.get("num_turns"),
                duration_s=round((msg.get("duration_ms") or 0) / 1000, 1),
                stop=msg.get("subtype"),
            )
            if msg.get("is_error"):
                tr.error = str(msg.get("result") or msg.get("subtype"))
    return tr


def parse_pi(stream: str, known: set[str]) -> Transcript:
    """pi `-p --mode json`: one JSON event per line."""
    tr = Transcript(discovered_skills=sorted(known))
    seen: set[str] = set()
    for line in stream.splitlines():
        try:
            msg = json.loads(line)
        except json.JSONDecodeError:
            continue
        # Tool calls appear as tool_execution_start events; fall back to
        # assistant message content blocks for older builds.
        if msg.get("type") == "tool_execution_start":
            call_id = msg.get("toolCallId", "")
            if call_id not in seen:
                seen.add(call_id)
                tr.events += _tool_events(msg.get("toolName", ""), msg.get("args") or {}, known)
        elif msg.get("type") == "message_end":
            m = msg.get("message") or {}
            if m.get("role") != "assistant":
                continue
            texts = []
            for item in m.get("content") or []:
                if item.get("type") == "toolCall" and item.get("id") not in seen:
                    seen.add(item.get("id", ""))
                    tr.events += _tool_events(item.get("name", ""), item.get("arguments") or {}, known)
                elif item.get("type") == "text":
                    texts.append(item.get("text", ""))
            if texts:
                tr.final_text = "\n".join(texts)
            usage = m.get("usage") or {}
            cost = (usage.get("cost") or {}).get("total")
            if cost:
                tr.metrics["cost_usd"] = round((tr.metrics.get("cost_usd") or 0) + cost, 4)
            tr.metrics["turns"] = tr.metrics.get("turns", 0) + 1
            tr.metrics["model"] = m.get("model", "")
            if m.get("stopReason") == "error":
                tr.error = m.get("errorMessage", "error")
    return tr


PARSERS = {"claude": parse_claude, "pi": parse_pi}


def staged_skill_names(root: Path) -> set[str]:
    return {p.parent.name for p in root.glob("*/SKILL.md")}
