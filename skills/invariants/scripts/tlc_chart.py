#!/usr/bin/env python3
"""Model-check a TLA+ spec with TLC and report the result on the flow's statechart.

  tlc_chart.py run SPEC.tla [--config C.cfg] [--chart ui] [--viz CHART.viz] [--fix FIXED.cfg]
                            [-o OUT.viz] [--jar tla2tools.jar] [--timeout 300] [--graph-limit 20000]
  tlc_chart.py log TRACE.txt [--chart ui]      read a TLC trace printed elsewhere (quint verify --backend tlc)
  tlc_chart.py jar                             print the pinned tla2tools.jar path, downloading it once

`run` checks every rule in the config (the current code): each INVARIANT, deadlock unless the config turns
it off, and each PROPERTY. When a rule breaks it prints the shortest counterexample, drops that rule and
reruns, so one bug does not hide the next. With --fix it checks the fixed config the same way.

With --viz it compares the model with the chart drawn before modeling, on TLC's full state graph: whether
each named story can happen along its drawn path, which steps the model takes that the chart has no arrow
for, which arrows the model never takes, and which nodes it never reaches. It writes OUT.viz, the same
chart with each story marked: plain = works, `!` path = counterexample or undrawn step, `+` = works only
after the fix, `?` on the leaf = never reached along the drawn path.

TLC runs with one worker and a fixed fingerprint seed, so a counterexample is the same on every run.
Exit 0 when every rule of the final model holds, 1 when one breaks, 2 on an error or a rule left unchecked,
3 when Java 11+ or the TLC jar is missing: it prints SETUP NEEDED with the install command for this OS.
Conventions (chart variable, `state:` and `fails:` lines): ../references/model-checkers.md.
"""
import argparse
import collections
import hashlib
import os
import re
import shutil
import subprocess
import sys
import tempfile
import time
import urllib.request

VERSION = "3"  # bump on a behavior change; a verify skill that copies this file records it
TLA_VERSION = "1.7.4"
TLA_SHA256 = "936a262061c914694dfd669a543be24573c45d5aa0ff20a8b96b23d01e050e88"
TLA_URL = f"https://github.com/tlaplus/tlaplus/releases/download/v{TLA_VERSION}/tla2tools.jar"
PINNED = ["-workers", "1", "-fp", "0"]  # one worker, one fingerprint seed: the same trace on every run
HERE = os.path.dirname(os.path.abspath(__file__))
VIZ_PY = os.path.join(HERE, "..", "..", "viz", "scripts", "viz.py")
# tlc2.output.EC.ExitStatus
EXIT = {0: "clean", 10: "assumption violated", 11: "deadlock", 12: "invariant violated",
        13: "temporal property violated", 14: "assertion failed", 75: "spec evaluation failed",
        76: "invariant evaluation failed", 77: "temporal evaluation failed", 150: "spec parse error",
        151: "config parse error", 152: "state space too large", 153: "system error", 255: "error"}
CFG_KEYS = ("CONSTANTS", "CONSTANT", "INIT", "NEXT", "SPECIFICATION", "INVARIANTS", "INVARIANT", "PROPERTIES",
            "PROPERTY", "CONSTRAINTS", "CONSTRAINT", "ACTION_CONSTRAINTS", "ACTION_CONSTRAINT", "SYMMETRY", "VIEW",
            "ALIAS", "POSTCONDITION", "CHECK_DEADLOCK")
RULE_KEYS = ("INVARIANT", "INVARIANTS", "PROPERTY", "PROPERTIES", "CHECK_DEADLOCK")
DEADLOCK = "deadlock"


# ---------- setup ----------

SETUP_EXIT = 3
JAVA_FIX = {"darwin": "brew install --cask temurin   (or the installer from https://adoptium.net)",
            "win32": "winget install EclipseAdoptium.Temurin.21.JRE"}.get(
    sys.platform, "sudo apt-get install -y default-jre-headless   (Fedora: sudo dnf install -y java-21-openjdk-headless)")


def setup_needed(what, fix):
    print(f"SETUP NEEDED: {what}\n  fix: {fix}\n  agent: tell the user what is missing and ask whether to set it up"
          " for them; run the fix only after they say yes, then rerun this command.", file=sys.stderr)
    sys.exit(SETUP_EXIT)


def require_java():
    """Exit 3 unless a Java 11+ runtime answers. macOS ships a /usr/bin/java stub that answers with an error."""
    java = shutil.which("java")
    if not java:
        setup_needed("Java 11+ is not installed; TLC runs on Java.", JAVA_FIX)
    try:
        p = subprocess.run([java, "-version"], capture_output=True, text=True, timeout=60)
        out = p.stdout + p.stderr
    except (OSError, subprocess.TimeoutExpired) as e:
        p, out = None, str(e)
    m = re.search(r'version "(\d+)(?:\.(\d+))?', out)
    if not p or p.returncode or not m:
        setup_needed(f"`{java}` is on PATH but no Java runtime answers ({tail(out, 1) or 'no output'}).", JAVA_FIX)
    major = int(m.group(1)) if m.group(1) != "1" else int(m.group(2) or 0)  # "1.8.0" is Java 8
    if major < 11:
        setup_needed(f"Java {major} found; TLC {TLA_VERSION} needs Java 11+.", JAVA_FIX)


# ---------- jar ----------

def jar_path(override=None):
    if override or os.environ.get("TLA2TOOLS"):
        return override or os.environ["TLA2TOOLS"]
    cache = os.path.join(os.environ.get("XDG_CACHE_HOME") or os.path.expanduser("~/.cache"), "tlaplus")
    path = os.path.join(cache, f"tla2tools-{TLA_VERSION}.jar")
    if not os.path.exists(path):
        os.makedirs(cache, exist_ok=True)
        print(f"downloading tla2tools {TLA_VERSION} -> {path}", file=sys.stderr)
        try:
            with urllib.request.urlopen(TLA_URL, timeout=120) as r:
                data = r.read()
        except OSError as e:
            setup_needed(f"cannot download tla2tools.jar ({e}); offline, or GitHub is blocked.",
                         f"download {TLA_URL} where there is network and save it as {path}, "
                         "or set TLA2TOOLS=/path/to/tla2tools.jar")
        if hashlib.sha256(data).hexdigest() != TLA_SHA256:
            sys.exit(f"tla2tools.jar sha256 mismatch for {TLA_URL}")
        with open(path + ".part", "wb") as f:
            f.write(data)
        os.replace(path + ".part", path)
    return path


# ---------- TLA+ values ----------

TOK = re.compile(r'\s*("(?:[^"\\]|\\.)*"|<<|>>|\|->|:>|@@|-?\d+|[A-Za-z_][\w]*|[\[\](){},])')


def parse_value(text):
    toks, pos = [], 0
    while pos < len(text):
        m = TOK.match(text, pos)
        if not m:
            if text[pos:].strip():
                return text.strip()  # a shape this parser does not know; keep the raw text
            break
        toks.append(m.group(1))
        pos = m.end()
    try:
        val, i = _value(toks, 0)
        return val if i == len(toks) else text.strip()
    except (IndexError, ValueError):
        return text.strip()


def _value(t, i):
    x = t[i]
    if x[0] == '"':
        return x[1:-1], i + 1
    if re.fullmatch(r"-?\d+", x):
        return int(x), i + 1
    if x in ("TRUE", "FALSE"):
        return x == "TRUE", i + 1
    if x == "<<":
        items, i = _items(t, i + 1, ">>")
        return tuple(items), i
    if x == "{":
        items, i = _items(t, i + 1, "}")
        return frozenset(items) if all(_hashable(v) for v in items) else tuple(items), i
    if x == "[":  # record [a |-> 1, b |-> 2]
        rec, i = {}, i + 1
        while t[i] != "]":
            k = t[i]
            if t[i + 1] != "|->":
                raise ValueError
            v, i = _value(t, i + 2)
            rec[k] = v
            if t[i] == ",":
                i += 1
        return rec, i + 1
    if x == "(":  # function (k :> v @@ k2 :> v2)
        fn, i = {}, i + 1
        while t[i] != ")":
            k, i = _value(t, i)
            if t[i] != ":>":
                raise ValueError
            v, i = _value(t, i + 1)
            fn[k] = v
            if t[i] == "@@":
                i += 1
        return fn, i + 1
    if re.fullmatch(r"[A-Za-z_]\w*", x):
        return x, i + 1  # model value
    raise ValueError(x)


def _items(t, i, end):
    out = []
    while t[i] != end:
        v, i = _value(t, i)
        out.append(v)
        if t[i] == ",":
            i += 1
    return out, i + 1


def _hashable(v):
    try:
        hash(v)
        return True
    except TypeError:
        return False


def show(v):
    if isinstance(v, str):
        return f'"{v}"'
    if isinstance(v, bool):
        return "TRUE" if v else "FALSE"
    if isinstance(v, dict):
        return "[" + ", ".join(f"{k} |-> {show(x)}" for k, x in v.items()) + "]"
    if isinstance(v, (tuple, frozenset)):
        o, c = ("<<", ">>") if isinstance(v, tuple) else ("{", "}")
        return o + ", ".join(show(x) for x in (v if isinstance(v, tuple) else sorted(v, key=str))) + c
    return str(v)


def canon(v):
    """show() with function and record keys sorted, so two printings of one value compare equal."""
    if isinstance(v, dict):
        return "[" + ", ".join(f"{k} |-> {canon(v[k])}" for k in sorted(v, key=str)) + "]"
    if isinstance(v, (tuple, frozenset)):
        items = [canon(x) for x in v]
        return ("<<" + ", ".join(items) + ">>") if isinstance(v, tuple) else ("{" + ", ".join(sorted(items)) + "}")
    return show(v)


# ---------- TLC output ----------

STATE = re.compile(r"^State (\d+): (.*)$")
BACK = re.compile(r"^(?:State \d+: )?Back to state:? (\d+)(?::\s*(.*))?")
VAR = re.compile(r"^(?:/\\ )?(\w+) = (.*)$")


def parse_trace(out):
    """TLC's error trace: [{'action': name, 'args': str, 'vars': {name: value}}], plus a lasso target."""
    states, cur, var, buf, loop = [], None, None, [], None

    def flush():
        nonlocal var, buf
        if cur is not None and var:
            cur["vars"][var] = parse_value(" ".join(buf))
        var, buf = None, []

    for line in out.splitlines():
        m, b = STATE.match(line), BACK.match(line)
        if b:
            flush()
            loop = int(b.group(1))
            am = re.match(r"<([\w!]+)(\(.*?\))?", b.group(2) or "")
            if 0 < loop <= len(states):  # the step that closes the lasso, back onto state `loop`
                states.append({"action": am.group(1) if am else "back", "args": (am.group(2) or "").strip("()") if am else "",
                               "vars": dict(states[loop - 1]["vars"])})
            cur = None
            continue
        if m:
            flush()
            head = m.group(2).strip()
            am = re.match(r"<([\w!]+)(\(.*?\))?(?: line .*)?>", head)
            action = "init" if "Initial predicate" in head else am.group(1) if am else head
            cur = {"action": action, "args": (am.group(2) or "").strip("()") if am else "", "vars": {}}
            states.append(cur)
            continue
        if cur is None:
            continue
        vm = VAR.match(line)
        if vm:
            flush()
            var, buf = vm.group(1), [vm.group(2)]
        elif line.strip() and var:
            buf.append(line.strip())
        elif not line.strip():
            flush()
            cur = None
    flush()
    return states, loop


def violated_name(out):
    m = re.search(r"Error: (?:Invariant|Action property|Temporal properties were) (\S+)? ?(?:is )?violated", out)
    if m:
        return m.group(1) or "a temporal property"
    if "Deadlock reached" in out:
        return DEADLOCK
    m = re.search(r"Error: (?:The )?(?:first argument of )?Assert", out)
    return "assert" if m else None


def stats(out):
    g = re.search(r"(\d[\d,]*) states generated, (\d[\d,]*) distinct states found", out)
    d = re.search(r"depth of the complete state graph search is (\d+)", out)
    return (f"{g.group(2)} distinct states" if g else "") + (f", depth {d.group(1)}" if d else "")


def run_tlc(jar, spec, cfg, timeout, extra_lib=None, extra=()):
    """(exit code or None on timeout, output, seconds)"""
    meta = tempfile.mkdtemp(prefix="tlc-meta-")
    lib = os.path.dirname(os.path.abspath(spec))
    cmd = ["java", "-XX:+UseParallelGC", f"-DTLA-Library={extra_lib or lib}", "-cp", jar, "tlc2.TLC",
           "-config", cfg, *PINNED, "-metadir", meta, "-cleanup", *extra, os.path.basename(spec)]  # TLC 1.7.4 misses a config outside the folder of an absolute spec path
    t0 = time.time()
    try:
        p = subprocess.run(cmd, capture_output=True, text=True, cwd=lib, timeout=timeout)
        code, out = p.returncode, p.stdout + p.stderr
    except subprocess.TimeoutExpired as e:
        code, out = None, (e.stdout or b"").decode(errors="replace") if isinstance(e.stdout, bytes) else (e.stdout or "")
    shutil.rmtree(meta, ignore_errors=True)
    return code, out, time.time() - t0


def tail(out, n=25):
    return "\n".join(out.strip().splitlines()[-n:])


# ---------- config ----------

def read_cfg(path):
    text = re.sub(r"\\\*.*", "", open(path).read())
    text = re.sub(r"\(\*.*?\*\)", "", text, flags=re.S)
    parts = re.split(r"\b(" + "|".join(CFG_KEYS) + r")\b", text)
    return [(parts[i], parts[i + 1].strip()) for i in range(1, len(parts) - 1, 2)]


def cfg_rules(sections):
    invs, props, deadlock = [], [], True
    for k, v in sections:
        if k in ("INVARIANT", "INVARIANTS"):
            invs += v.split()
        elif k in ("PROPERTY", "PROPERTIES"):
            props += v.split()
        elif k == "CHECK_DEADLOCK":
            deadlock = v.split()[0] != "FALSE"
    return invs, props, deadlock


def write_cfg(sections, folder, name, invs=(), props=(), deadlock=False, extra=()):
    lines = [f"{k} {v}" for k, v in sections if k not in RULE_KEYS]
    if invs:
        lines.append("INVARIANT " + " ".join(invs))
    if props:
        lines.append("PROPERTY " + " ".join(props))
    lines.append(f"CHECK_DEADLOCK {'TRUE' if deadlock else 'FALSE'}")
    path = os.path.join(folder, name + ".cfg")
    with open(path, "w") as f:
        f.write("\n".join(lines + list(extra)) + "\n")
    return path


# ---------- every rule ----------

def check_rules(jar, spec, cfg, a):
    """Each rule -> {'outcome': holds | broken | not checked, ...}. A broken rule is dropped and TLC reruns, so
    every rule gets a verdict. Invariants and deadlock share runs; each PROPERTY gets its own run."""
    sections = read_cfg(cfg)
    invs, props, dl = cfg_rules(sections)
    tmp = tempfile.mkdtemp(prefix="tlc-rules-")
    verdicts, runs, space, stop = {}, 0, None, None
    pending, check_dl = list(invs), dl
    batches = [("safety", None)] + [("property", p) for p in props]
    for kind, prop in batches:
        while True:
            names = ([*pending] + ([DEADLOCK] if check_dl else [])) if kind == "safety" else [prop]
            if not names or stop:
                break
            runs += 1
            c = write_cfg(sections, tmp, f"run{runs}", pending if kind == "safety" else (),
                          [prop] if prop else (), check_dl if kind == "safety" else False)
            code, out, secs = run_tlc(jar, spec, c, a.timeout)
            if code is None:
                for n in names:
                    verdicts[n] = {"outcome": "not checked", "why": f"no result in {a.timeout}s (--timeout)"}
                break
            if code == 0:
                space = space or stats(out)
                for n in names:
                    verdicts[n] = {"outcome": "holds", "secs": secs}
                break
            name = violated_name(out)
            if code in (11, 12, 13) and name:
                name = prop if code == 13 else name
                states, loop = parse_trace(out)
                verdicts[name] = {"outcome": "broken", "states": states, "loop": loop,
                                  "steps": walk(states, a.chart), "secs": secs}
                if kind == "property":
                    break
                if name == DEADLOCK:
                    check_dl = False
                else:
                    pending.remove(name)
                continue
            stop = f"{EXIT.get(code, f'exit {code}')}:\n{tail(out)}"
            for n in names:
                verdicts[n] = {"outcome": "not checked", "why": EXIT.get(code, f"exit {code}")}
            break
    for n in [*invs, *([DEADLOCK] if dl else []), *props]:
        verdicts.setdefault(n, {"outcome": "not checked", "why": "an earlier run stopped"})
    shutil.rmtree(tmp, ignore_errors=True)
    return {"rules": verdicts, "order": [*invs, *([DEADLOCK] if dl else []), *props], "space": space, "stop": stop}


def report_rules(label, cfg, res):
    v = res["rules"]
    broken = [n for n in res["order"] if v[n]["outcome"] == "broken"]
    unchecked = [n for n in res["order"] if v[n]["outcome"] == "not checked"]
    head = "every rule holds" if not broken and not unchecked else \
        ", ".join(x for x in (f"{len(broken)} broken" if broken else "", f"{len(unchecked)} not checked" if unchecked else "") if x)
    print(f"{label} ({os.path.basename(cfg)}): {head} · {res['space'] or 'state space not completed'} · "
          f"TLC {TLA_VERSION}, {' '.join(PINNED)}")
    for n in res["order"]:
        r = v[n]
        if r["outcome"] == "broken":
            print(f"  {n}: broken, {len(r['steps'])} steps")
            print_steps(r["steps"], r["loop"], indent="    ")
        elif r["outcome"] == "not checked":
            print(f"  {n}: not checked ({r['why']})")
        else:
            print(f"  {n}: holds")
    if res["stop"]:
        print(res["stop"])


def final_code(res):
    outs = [r["outcome"] for r in res["rules"].values()]
    return 1 if "broken" in outs else 2 if "not checked" in outs or res["stop"] else 0


# ---------- chart paths ----------

def chart_var(names, chart):
    names = list(names)
    exact = [v for v in names if v == chart]
    return (exact or [v for v in names if v.endswith("_" + chart)] or [None])[0]


def positions(vars_, cv):
    v = vars_.get(cv)
    if isinstance(v, dict):
        return {str(k): str(x) for k, x in v.items()}
    return {"user": str(v)} if v is not None else {}


def walk(states, chart):
    """Per step: who moved, what it did, which node it left and reached, and what else changed."""
    cv = chart_var(states[0]["vars"] if states else [], chart)
    prefix = cv[: -len(chart)] if cv and cv != chart else ""
    steps, prev = [], None
    for s in states:
        pos = positions(s["vars"], cv)
        if prev is None:
            prev = s
            continue
        ppos = positions(prev["vars"], cv)
        movers = [a for a in pos if pos.get(a) != ppos.get(a)]
        actor = (movers[0] if movers else s["args"].strip('"') or "-")
        changed = []
        for k, v in s["vars"].items():
            if k == cv or prev["vars"].get(k) == v:
                continue
            old = prev["vars"].get(k)
            if isinstance(v, dict) and isinstance(old, dict):
                changed += [f"{k[len(prefix):]}[{i}] = {show(x)}" for i, x in v.items() if old.get(i) != x]
            else:
                changed.append(f"{k[len(prefix):]} = {show(v)}")
        steps.append({"actor": actor, "action": s["action"][len(prefix):] if s["action"].startswith(prefix) else s["action"],
                      "src": ppos.get(actor), "dst": pos.get(actor), "changed": changed})
        prev = s
    return steps


def actor_path(states, chart, actor):
    cv = chart_var(states[0]["vars"] if states else [], chart)
    seq = []
    for s in states:
        n = positions(s["vars"], cv).get(actor)
        if n and (not seq or seq[-1] != n):
            seq.append(n)
    return seq


def print_steps(steps, loop=None, indent="  "):
    for i, s in enumerate(steps, 1):
        move = f"{s['src']} -> {s['dst']}" if s["src"] != s["dst"] else f"stays on {s['dst']}"
        extra = f"   ({'; '.join(s['changed'])})" if s["changed"] else ""
        print(f"{indent}{i}. {s['actor']} {s['action']}: {move}{extra}")
    if loop:
        print(f"{indent}... and from there the last {len(steps) - loop + 1} steps repeat forever")


# ---------- the chart (.viz) ----------

ID = r"[\w.$-]+"
PATH = re.compile(rf"^([+\-~!*?]?)(?:({ID}):\s+)?({ID}(?:\s*>\s*{ID})*)\s*(?:(=>|=\|)\s*({ID}))?\s*(\|.*)?$")
EDGE = re.compile(rf"^({ID}(?:\s*,\s*{ID})*|\[\*\])\s*(?:->|~>)\s*({ID}(?:\s*,\s*{ID})*)\s*(?::.*)?$")


def read_chart(path):
    """Nodes with their `state:` predicate and `fails:` invariant, the drawn arrows, and the named story paths."""
    lines = open(path).read().splitlines()
    nodes, stories, edges, starts, cur = {}, [], set(), set(), None
    for i, raw in enumerate(lines):
        t = raw.strip()
        d = re.match(r"^\s+(state|fails):\s*(.*)$", raw)
        if d and cur:
            nodes[cur][d.group(1)] = d.group(2).strip()
            continue
        if not t or t.startswith(("//", "==", "view:", "ranks:", "title ", "sub ", "base ", "tone ", "group ", "theme ",
                                  "meter:")) or re.match(r"^\s", raw):
            continue
        cur = None
        e = EDGE.match(t)
        if e:
            dsts = re.split(r"\s*,\s*", e.group(2))
            if e.group(1) == "[*]":
                starts.update(dsts)
            else:
                edges.update((s, x) for s in re.split(r"\s*,\s*", e.group(1)) for x in dsts)
            continue
        p = PATH.match(t)
        if p and (p.group(4) or p.group(6) or ">" in p.group(3)):
            ids = re.split(r"\s*>\s*", p.group(3)) + ([p.group(5)] if p.group(5) else [])
            edges.update((x, y) for x, y in zip(ids, ids[1:]) if x != y)
            if p.group(2) and p.group(4):
                stories.append({"name": p.group(2), "ids": ids, "line": i})
            continue
        n = re.match(rf"^([+\-~!*?]?)({ID}):\s*(.*)$", t)
        if n:
            cur = n.group(2)
            nodes[cur] = {"line": i, "state": None, "fails": None}
    return lines, nodes, stories, edges, starts


def mark_node(lines, nodes, nid, mark):
    i = nodes[nid]["line"]
    lines[i] = re.sub(r"^(\s*)[+\-~!*?]?", lambda m: m.group(1) + mark, lines[i], count=1)


# ---------- the state graph ----------

def unescape_dot(s):
    out, i = [], 0
    while i < len(s):
        if s[i] == "\\" and i + 1 < len(s):
            out.append("\n" if s[i + 1] == "n" else s[i + 1])
            i += 2
        else:
            out.append(s[i])
            i += 1
    return "".join(out)


def label_vars(label):
    vars_, var, buf = {}, None, []
    for line in label.split("\n"):
        vm = VAR.match(line)
        if vm:
            if var:
                vars_[var] = parse_value(" ".join(buf))
            var, buf = vm.group(1), [vm.group(2)]
        elif var and line.strip():
            buf.append(line.strip())
    if var:
        vars_[var] = parse_value(" ".join(buf))
    return vars_


def read_dot(path):
    nodes, init, edges = {}, [], []
    node = re.compile(r'^(-?\d+) \[label="((?:[^"\\]|\\.)*)"(.*)\]')
    edge = re.compile(r'^(-?\d+) -> (-?\d+)(?: \[label="((?:[^"\\]|\\.)*)")?')
    for line in open(path):
        m = edge.match(line)
        if m:
            edges.append((m.group(1), m.group(2), unescape_dot(m.group(3) or "")))
            continue
        m = node.match(line)
        if m:
            nodes[m.group(1)] = label_vars(unescape_dot(m.group(2)))
            if "filled" in m.group(3):
                init.append(m.group(1))
    return nodes, init, edges


class Graph:
    def __init__(self, nodes, init, edges, marks, cv):
        self.nodes, self.init, self.edges, self.marks, self.cv = nodes, init, edges, marks, cv
        self.succ = collections.defaultdict(list)
        for s, t, act in edges:
            if s != t:
                self.succ[s].append((t, act))
        self.pos = {fp: positions(v, cv) for fp, v in nodes.items()}

    def hops(self):
        """(from node, to node) -> actions: each step of the model, seen as one actor moving on the chart."""
        out = collections.defaultdict(set)
        for s, t, act in self.edges:
            for actor, n in self.pos[t].items():
                if self.pos[s].get(actor) != n:
                    out[(self.pos[s].get(actor), n)].add(act or "?")
        return out

    def trace(self, path):
        """A BFS path of (fp, action) as parse_trace-shaped states, so walk() can narrate it."""
        return [{"action": act or "init", "args": "", "vars": self.nodes[fp]} for fp, act in path]

    def bfs(self, starts, step, goal):
        """Shortest path over (state, tag) pairs. starts: [(fp, tag)]; step(fp, tag, t) -> tag; goal(fp, tag)."""
        prev, q = {}, collections.deque()
        for st in starts:
            if st not in prev:
                prev[st] = None
                q.append(st)
        while q:
            cur = q.popleft()
            if goal(*cur):
                path, x = [], cur
                while x is not None:
                    back = prev[x]
                    path.append((x[0], back[1] if back else None))
                    x = back[0] if back else None
                return path[::-1]
            for t, act in self.succ[cur[0]]:
                nxt = (t, step(cur[0], cur[1], t))
                if nxt not in prev:
                    prev[nxt] = (cur, act)
                    q.append(nxt)
        return None


def state_graph(jar, spec, cfg, a, preds):
    """TLC's full state graph for cfg, with the states where each `state:` predicate holds; or (None, why)."""
    sections = read_cfg(cfg)
    tmp = tempfile.mkdtemp(prefix="tlc-graph-")
    try:
        c = write_cfg(sections, tmp, "graph")
        code, out, _ = run_tlc(jar, spec, c, a.timeout, extra=["-dump", "dot,actionlabels", os.path.join(tmp, "graph")])
        dot = os.path.join(tmp, "graph.dot")
        if code != 0 or not os.path.exists(dot):
            return None, "no result in time" if code is None else f"{EXIT.get(code, code)}: {tail(out, 5)}"
        nodes, init, edges = read_dot(dot)
        if len(nodes) > a.graph_limit:
            return None, f"{len(nodes)} states, over --graph-limit {a.graph_limit}"
        names = list(next(iter(nodes.values())).keys()) if nodes else []
        cv = chart_var(names, a.chart)
        marks = {nid: set() for nid in preds}
        if preds and nodes:
            marks = mark_states(jar, spec, sections, tmp, a, preds, names, nodes)
        return Graph(nodes, init, edges, marks, cv), None
    finally:
        shutil.rmtree(tmp, ignore_errors=True)


def mark_states(jar, spec, sections, tmp, a, preds, names, nodes):
    """Run TLC once with an invariant that prints each state where a chart predicate holds."""
    name = os.path.splitext(os.path.basename(spec))[0]
    tag = "chartmark" + hashlib.sha1(spec.encode()).hexdigest()[:8]
    mod = f"ChartMark_{name}"
    vals = ", ".join(names)
    body = "\n".join(f'  /\\ (({p}) => PrintT(<<"{tag}", "{nid}", {vals}>>))' for nid, p in preds.items())
    with open(os.path.join(tmp, mod + ".tla"), "w") as f:
        f.write(f"---- MODULE {mod} ----\nEXTENDS {name}, TLC\nChartMark ==\n{body}\n====\n")
    c = write_cfg(sections, tmp, mod, invs=["ChartMark"])
    lib = os.path.dirname(os.path.abspath(spec))
    code, out, _ = run_tlc(jar, os.path.join(tmp, mod + ".tla"), c, a.timeout, extra_lib=lib)
    if code != 0:
        sys.exit(f"chart predicates failed to evaluate ({EXIT.get(code, code)}):\n{tail(out)}")
    by_value = {tuple(canon(v.get(n)) for n in names): fp for fp, v in nodes.items()}
    marks, buf = {nid: set() for nid in preds}, []
    for line in out.splitlines():
        if not buf and not (line.lstrip().startswith("<<") and tag in line):
            continue
        buf.append(line)
        v = parse_value(" ".join(buf))
        if isinstance(v, tuple) and len(v) == len(names) + 2 and v[0] == tag:
            fp = by_value.get(tuple(canon(x) for x in v[2:]))
            if fp:
                marks[v[1]].add(fp)
            buf = []
        elif len(buf) > 500:
            buf = []
    return marks


def story_path(g, ids, end_pred):
    """Shortest behavior in which one actor walks the drawn ids in order (consecutive chart nodes), ending on
    the last id, or for an outcome node (end_pred), with its predicate holding once the actor walked the rest."""
    want = ids[:-1] if end_pred else ids
    k = len(want)

    def adv(p, v):  # longest prefix of `want` that ends the walk so far
        seq = want[:p] + [v]
        for n in range(min(len(seq), k), 0, -1):
            if seq[-n:] == want[:n]:
                return n
        return 0

    best = None
    actors = sorted({x for fp in g.init for x in g.pos[fp]})
    for actor in actors:
        def step(s, p, t, actor=actor):
            v, before = g.pos[t].get(actor), g.pos[s].get(actor)
            if p == k and end_pred:
                return p
            return p if v == before else adv(p, v)

        def goal(s, p):
            return p == k and (not end_pred or s in end_pred)

        path = g.bfs([(fp, adv(0, g.pos[fp].get(actor))) for fp in g.init], step, goal)
        if path and (best is None or len(path) < len(best[1])):
            best = (actor, path)
    return best


def any_path(g, end, end_pred):
    """Shortest behavior reaching the end node by any route: (actor, path)."""
    goal = (lambda s, _: s in end_pred) if end_pred else (lambda s, _: end in g.pos[s].values())
    path = g.bfs([(fp, 0) for fp in g.init], lambda s, p, t: 0, goal)
    if not path:
        return None
    last = path[-1][0]
    actor = next((x for x, n in g.pos[last].items() if n == end), None)
    if actor is None:
        steps = walk(g.trace(path), g.cv)
        actor = steps[-1]["actor"] if steps else next(iter(g.pos[last]), "user")
    return actor, path


def judge_stories(g, nodes, stories):
    """story name -> (verdict: works | other route | unreached, actor path the model took or None)"""
    res = {}
    for st in stories:
        end = st["ids"][-1]
        if end not in nodes or nodes[end]["fails"]:
            continue
        pred = g.marks.get(end) if nodes[end]["state"] else None
        hit = story_path(g, st["ids"], pred)
        if hit:
            res[st["name"]] = ("works", actor_path(g.trace(hit[1]), g.cv, hit[0]))
            continue
        alt = any_path(g, end, pred)
        res[st["name"]] = ("other route", actor_path(g.trace(alt[1]), g.cv, alt[0])) if alt else ("unreached", None)
    return res


# ---------- witness fallback, for a graph over --graph-limit ----------

def witness(jar, spec, cfg, pred, a):
    """TLC finds a behavior reaching a state where pred holds, by checking ~pred as an invariant."""
    name = os.path.splitext(os.path.basename(spec))[0]
    tmp = tempfile.mkdtemp(prefix="tlc-witness-")
    mod = f"Witness_{name}"
    with open(os.path.join(tmp, mod + ".tla"), "w") as f:
        f.write(f"---- MODULE {mod} ----\nEXTENDS {name}\nWitnessNotReached == ~({pred})\n====\n")
    c = write_cfg(read_cfg(cfg), tmp, mod, invs=["WitnessNotReached"])
    lib = os.path.dirname(os.path.abspath(spec))
    code, out, _ = run_tlc(jar, os.path.join(tmp, mod + ".tla"), c, a.timeout, extra_lib=lib)
    shutil.rmtree(tmp, ignore_errors=True)
    if code == 12:
        return parse_trace(out)[0]
    if code == 0:
        return None
    sys.exit(f"witness check failed ({EXIT.get(code, code)}) for: {pred}\n{tail(out)}")


def witness_stories(jar, spec, cfg, nodes, stories, a):
    res = {}
    for st in stories:
        end = st["ids"][-1]
        if end not in nodes or nodes[end]["fails"]:
            continue
        pred = nodes[end]["state"] or f'\\E x \\in DOMAIN {a.chart} : {a.chart}[x] = "{end}"'
        tr = witness(jar, spec, cfg, pred, a)
        if tr is None:
            res[st["name"]] = ("unreached", None)
            continue
        steps = walk(tr, a.chart)
        path = actor_path(tr, a.chart, steps[-1]["actor"] if steps else "user")
        drawn = st["ids"][:-1] if nodes[end]["state"] else st["ids"]
        along = any(path[i:i + len(drawn)] == drawn for i in range(len(path)))
        res[st["name"]] = ("works" if along else "other route", path)  # only the shortest witness is checked
    return res


# ---------- commands ----------

def cmd_run(a):
    require_java()
    jar = jar_path(a.jar)
    spec = os.path.abspath(a.spec)
    cfg = os.path.abspath(a.config or os.path.splitext(spec)[0] + ".cfg")
    now = check_rules(jar, spec, cfg, a)
    report_rules("current", cfg, now)
    after = None
    if a.fix:
        fcfg = os.path.abspath(a.fix)
        after = check_rules(jar, spec, fcfg, a)
        report_rules("fixed", fcfg, after)
    if a.viz:
        write_chart(a, jar, spec, cfg, now, after)
    return final_code(after or now)


def compare(a, jar, spec, cfg, nodes, stories, edges, starts):
    """Stories and the chart-versus-model diff for one config."""
    preds = {nid: n["state"] for nid, n in nodes.items() if n["state"]}
    g, why = state_graph(jar, spec, cfg, a, preds)
    if g is None:
        print(f"  ({os.path.basename(cfg)}: state graph skipped, {why}; stories by witness, no arrow check)")
        return witness_stories(jar, spec, cfg, nodes, stories, a), None
    return judge_stories(g, nodes, stories), g


def write_chart(a, jar, spec, cfg, now, after):
    lines, nodes, stories, edges, starts = read_chart(a.viz)
    print("stories:")
    r_now, g_now = compare(a, jar, spec, cfg, nodes, stories, edges, starts)
    r_fix, g_fix = compare(a, jar, spec, os.path.abspath(a.fix), nodes, stories, edges, starts) if a.fix else (r_now, g_now)
    add = []
    for st in stories:
        if st["name"] not in r_now:
            continue
        (v0, p0), (v1, p1) = r_now[st["name"]], r_fix[st["name"]]
        end = st["ids"][-1]
        if v0 == "works" and v1 == "works":
            verdict = "works"
        elif v1 == "works":
            verdict = "fixed"
            lines[st["line"]] = "+" + lines[st["line"]].lstrip("+-!?")
            mark_node(lines, nodes, end, "+")
        else:
            if v0 == "works":
                verdict = "broken by the fix"
            else:
                verdict = "unreached" if v1 == "unreached" else f"reached only via {' > '.join(p1 or p0)}, not the drawn path"
            mark_node(lines, nodes, end, "?")
            lines[st["line"]] = re.sub(r"=>(\s*[\w.$-]+)", r"=|\1", lines[st["line"]], count=1)  # stopped before its end
        print(f"  {st['name']}: {verdict}")

    # The chart is the intent and the model is the code: any difference between them is a finding.
    positions_ = {nid for nid, n in nodes.items() if not n["state"] and not n["fails"]}
    graphs = [(lbl, g) for lbl, g in (("current", g_now), ("fixed", g_fix if a.fix else None)) if g]
    seen_undrawn = set()
    for lbl, g in graphs:
        hops = g.hops()
        undrawn = {h: acts for h, acts in hops.items() if h not in edges and h not in seen_undrawn}
        off_chart = sorted({n for p in g.pos.values() for n in p.values()} - set(nodes))
        start_now = {n for fp in g.init for n in g.pos[fp].values()}
        if undrawn or off_chart or (starts and start_now - starts):
            print(f"model ({lbl}) does what the chart does not draw:")
        for n in off_chart:
            print(f"  {a.chart} = \"{n}\" is not a node on the chart")
        for n in sorted(start_now - starts) if starts else []:
            print(f"  starts on {n}, the chart starts on {', '.join(sorted(starts))}")
        for (s, t), acts in sorted(undrawn.items(), key=str):
            seen_undrawn.add((s, t))
            print(f"  {s} -> {t} by {', '.join(sorted(acts))}: no arrow on the chart")
            name = "undrawn_" + re.sub(r"\W", "_", f"{s}_{t}")
            add.append(f"!{name}: {s} > {t} | {', '.join(sorted(acts))} | The {lbl} model takes this step and "
                       f"the chart has no arrow for it: draw it, or find why the code allows it.")
    if graphs:
        taken = set().union(*(g.hops().keys() for _, g in graphs))
        reached = set().union(*({n for p in g.pos.values() for n in p.values()} for _, g in graphs))
        dead = sorted(e for e in edges if e[0] in positions_ and e[1] in positions_ and e[0] != e[1] and e not in taken)
        never = sorted(positions_ - reached)
        if dead or never:
            print("chart draws what the model never does:")
        for s, t in dead:
            print(f"  {s} -> {t}: the model never takes this arrow")
        for n in never:
            print(f"  {n}: the model never reaches this node")

    final = after or now
    for nid, n in nodes.items():
        if n["fails"] and n["fails"] not in final["order"] and n["fails"] not in now["order"]:
            print(f"  {nid}: fails: {n['fails']} names no rule in the config")
    for label, res in (("current", now), ("fixed", after)):
        if not res:
            continue
        for rule in res["order"]:
            r = res["rules"][rule]
            if r["outcome"] != "broken":
                continue
            harm = next((nid for nid, n in nodes.items() if n["fails"] == rule), None)
            if harm:
                mark_node(lines, nodes, harm, "!")
            else:
                harm = "violated_" + re.sub(r"\W", "_", rule)
                add.append(f"!{harm}: Stuck: no step out [state]" if rule == DEADLOCK else f"!{harm}: {rule} fails [state]")
            last = r["steps"][-1]["actor"] if r["steps"] else "user"
            path = actor_path(r["states"], a.chart, last) or [harm]
            for s in r["steps"]:
                hop = f"{s['src']} > {s['dst']}" if s["src"] and s["dst"] and s["src"] != s["dst"] else (s["dst"] or harm)
                note = f"{s['action']}" + (f": {'; '.join(s['changed'])}" if s["changed"] else "")
                add.append(f"!{hop} | {s['actor']} | {note}")
            story = ", then ".join(f"{s['actor']} {s['action']}" for s in r["steps"])
            loop = " The last steps repeat forever." if r["loop"] else ""
            cx = ("cx_fixed_" if label == "fixed" else "cx_") + re.sub(r"\W", "_", rule)
            chain = " > ".join(path) if path != [harm] else path[0]
            add.append(f"!{cx}: {chain} => {harm} | {label} counterexample | {story}: {rule} fails.{loop}")
    for nid, n in nodes.items():
        if n["fails"] and final["rules"].get(n["fails"], {}).get("outcome") == "holds" \
                and now["rules"].get(n["fails"], {}).get("outcome") != "broken":
            print(f"  {nid}: never reached ({n['fails']} holds)")
    out = a.o or os.path.splitext(a.viz)[0] + ".checked.viz"
    with open(out, "w") as f:
        f.write("\n".join(lines + add) + "\n")
    print(f"chart: {out}")
    if os.path.exists(VIZ_PY):
        subprocess.run([sys.executable, VIZ_PY, "check", out])


def cmd_log(a):
    out = sys.stdin.read() if a.trace == "-" else open(a.trace).read()
    states, loop = parse_trace(out)
    if not states:
        print("no trace in the log")
        return 0
    steps = walk(states, a.chart)
    print(f"counterexample for {violated_name(out) or '?'}, {len(steps)} steps:")
    print_steps(steps, loop)
    return 1


def main():
    sys.stdout.reconfigure(line_buffering=True)
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    ap.add_argument("--version", action="version", version=f"tlc_chart {VERSION} (TLC {TLA_VERSION})")
    sub = ap.add_subparsers(dest="cmd", required=True)
    r = sub.add_parser("run")
    r.add_argument("spec")
    r.add_argument("--config")
    r.add_argument("--chart", default="ui", help="variable mapping each actor to its statechart node (default ui)")
    r.add_argument("--viz", help="the statechart drawn before modeling")
    r.add_argument("--fix", help="config of the fixed model, same spec")
    r.add_argument("-o", help="output chart (default CHART.checked.viz)")
    r.add_argument("--jar")
    r.add_argument("--timeout", type=int, default=300, help="seconds per TLC run before its rules count as not checked")
    r.add_argument("--graph-limit", type=int, default=20000, help="largest state graph compared with the chart")
    lg = sub.add_parser("log")
    lg.add_argument("trace")
    lg.add_argument("--chart", default="ui")
    sub.add_parser("jar")
    a = ap.parse_args()
    if a.cmd == "jar":
        print(jar_path())
        return 0
    return cmd_run(a) if a.cmd == "run" else cmd_log(a)


if __name__ == "__main__":
    sys.exit(main())
