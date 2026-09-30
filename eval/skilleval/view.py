"""Render saved runs as one local HTML page: per trial, the prompt, the methods
picked, the tool timeline, the checks, and the final answer."""
from __future__ import annotations

import html
import json
from pathlib import Path

from .events import PARSERS, staged_skill_names
from .run import ROUTER_PREFIX, load_cases

_KIND = {"skill": "load", "read": "read", "edit": "edit", "shell": "sh", "delegate": "agent", "tool": "tool"}


def _trial(r: dict, meta: dict, run_dir: Path, prompts: dict, known: set[str]) -> str:
    e = html.escape
    transcript = run_dir / r["id"] / "transcript.jsonl"
    events = PARSERS[meta["harness"]](transcript.read_text(), known).events if transcript.exists() else []
    steps = []
    for ev in events:
        text = ev.detail if ev.kind in ("shell", "delegate", "tool") and ev.detail else ev.name
        steps.append(f'<li class="k-{ev.kind}"><b>{_KIND.get(ev.kind, ev.kind)}</b> <code>{e(text[:240])}</code></li>')
    checks = "".join(f'<li class="{"ok" if c["passed"] else "bad"}">{e(c["name"])}: {e(c["detail"] or "ok")}</li>'
                     for c in r.get("checks", []))
    m = r.get("metrics") or {}
    methods = [s for s in r.get("skills_used", []) if s != "yesh-router"]
    methods += [Path(f).stem for f in r.get("skill_files_read", []) if "/playbooks/" in f]
    state = "infra" if r.get("infra") else "pass" if r["passed"] else "fail"
    prompt = (ROUTER_PREFIX if r.get("activation") == "router" else "") + prompts.get(r["id"].split("#")[0], "")
    answer = r.get("final_text") or ("(stopped at the routing turn cap before a final answer)" if r.get("tier") == "route" else "")
    return f'''<details class="t {state}" data-state="{state}" data-q="{e((r["id"] + " " + prompt + " " + " ".join(methods)).lower())}">
<summary><span class="badge {state}">{state.upper()}</span> <b>{e(r["id"])}</b>
<span class="picked">{e(", ".join(methods) or "no method")}</span>
<span class="meta">{m.get("duration_s", "?")}s · ${(m.get("cost_usd") or 0):.2f} · {len(events)} events · {e(run_dir.name.split("-", 2)[-1])}</span></summary>
<p class="prompt">{e(prompt)}</p>
<div class="cols"><div><h4>Timeline</h4><ol class="steps">{"".join(steps) or "<li>no transcript</li>"}</ol></div>
<div><h4>Checks</h4><ul class="checks">{checks}</ul>
<h4>Edits</h4><p>{e(", ".join(r.get("edits", [])) or "none")}</p>
<h4>Final answer</h4><pre>{e(answer)}</pre></div></div></details>'''


def render(run_dirs: list[Path], out: Path) -> Path:
    prompts = {c.id: c.prompt for c in load_cases()}
    parts, total, passed, infra = [], 0, 0, 0
    for run_dir in run_dirs:
        meta = json.loads((run_dir / "meta.json").read_text())
        known = staged_skill_names(Path(meta["skills_source"]))
        results = [json.loads(f.read_text()) for f in sorted(run_dir.glob("*/result.json"))]
        for r in sorted(results, key=lambda r: (r.get("file", ""), r["id"])):
            infra += bool(r.get("infra"))
            total += not r.get("infra")
            passed += bool(r["passed"]) and not r.get("infra")
            parts.append(_trial(r, meta, run_dir, prompts, known))
    title = ", ".join(d.name for d in run_dirs)
    out.write_text(_PAGE.replace("{{TITLE}}", html.escape(title))
                   .replace("{{SUMMARY}}", f"{passed}/{total} passed" + (f" · {infra} infra errors" if infra else ""))
                   .replace("{{TRIALS}}", "\n".join(parts)))
    return out


_PAGE = """<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1"><title>skilleval runs</title><style>
:root{--bg:#f7f6f3;--panel:#fff;--ink:#1d1d1b;--muted:#6b6a65;--line:#e4e2dc;--ok:#2b8a3e;--bad:#c92a2a;--warn:#b35c00;--acc:#3b5bdb;--pb:#7048e8}
@media (prefers-color-scheme: dark){:root{--bg:#141413;--panel:#1d1d1b;--ink:#ecebe6;--muted:#9c9a92;--line:#2f2e2b;--ok:#69db7c;--bad:#ff8787;--warn:#ffb057;--acc:#7c9bff;--pb:#b197fc}}
body{margin:0;background:var(--bg);color:var(--ink);font:14px/1.5 system-ui,sans-serif}
.wrap{max-width:1100px;margin:0 auto;padding:20px 16px}
.bar{display:flex;gap:8px;flex-wrap:wrap;margin:12px 0}
input,button{font:inherit;padding:6px 10px;border:1px solid var(--line);border-radius:6px;background:var(--panel);color:var(--ink)}
button[aria-pressed=true]{border-color:var(--acc)}
.t{background:var(--panel);border:1px solid var(--line);border-radius:8px;margin:6px 0}
summary{padding:8px 12px;cursor:pointer;display:flex;gap:10px;flex-wrap:wrap;align-items:baseline}
.badge{font-size:11px;font-weight:700;padding:1px 6px;border-radius:4px;color:#fff}
.badge.pass{background:var(--ok)}.badge.fail{background:var(--bad)}.badge.infra{background:var(--warn)}
.picked{color:var(--acc)}.meta{color:var(--muted);font-size:12px;margin-left:auto}
.prompt{margin:0 12px 8px;font-style:italic}
.cols{display:grid;grid-template-columns:minmax(0,1.3fr) minmax(0,1fr);gap:16px;padding:0 12px 12px}
@media (max-width:760px){.cols{grid-template-columns:1fr}}
h4{margin:8px 0 4px;font-size:12px;text-transform:uppercase;color:var(--muted)}
.steps{margin:0;padding-left:22px;font-size:12.5px}.steps li{margin:2px 0;word-break:break-word}
.k-skill b{color:var(--acc)}.k-read b{color:var(--pb)}.k-edit b{color:var(--bad)}
code{font-size:12px}pre{white-space:pre-wrap;font-size:12.5px;background:var(--bg);padding:8px;border-radius:6px;max-height:320px;overflow:auto}
.checks{padding-left:18px;margin:0}.checks .ok{color:var(--ok)}.checks .bad{color:var(--bad)}
</style></head><body><div class="wrap"><h1>skilleval runs</h1><p>{{TITLE}}<br><b>{{SUMMARY}}</b></p>
<div class="bar"><input id="q" placeholder="filter by case, prompt, or method"><button data-f="all" aria-pressed="true">All</button>
<button data-f="fail" aria-pressed="false">Failures</button><button data-f="infra" aria-pressed="false">Infra</button></div>
<div id="list">{{TRIALS}}</div></div><script>
let f="all";const q=document.getElementById("q");
function apply(){const s=q.value.toLowerCase();document.querySelectorAll(".t").forEach(t=>{t.hidden=(f!=="all"&&t.dataset.state!==f)||(s&&!t.dataset.q.includes(s))})}
document.querySelectorAll("button[data-f]").forEach(b=>b.onclick=()=>{f=b.dataset.f;document.querySelectorAll("button[data-f]").forEach(x=>x.setAttribute("aria-pressed",x===b));apply()});
q.oninput=apply;
</script></body></html>"""
