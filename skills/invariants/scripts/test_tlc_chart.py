#!/usr/bin/env python3
"""Regression check for tlc_chart.py on variants of the gift card example. Needs Java 11+; downloads TLC once.

  python3 test_tlc_chart.py
"""
import os
import re
import shutil
import subprocess
import sys
import tempfile

HERE = os.path.dirname(os.path.abspath(__file__))
SCRIPT = os.path.join(HERE, "tlc_chart.py")
EXAMPLE = os.path.join(HERE, "..", "assets", "tla", "giftcard")


def run(folder, *args):
    p = subprocess.run([sys.executable, SCRIPT, "run", "GiftCard.tla", *args], cwd=folder, capture_output=True, text=True)
    return p.returncode, p.stdout + p.stderr


def variant(edit_spec=None, edit_chart=None, cfg=None):
    d = tempfile.mkdtemp(prefix="tlc-chart-test-")
    for f in os.listdir(EXAMPLE):
        shutil.copy(os.path.join(EXAMPLE, f), d)
    for name, edit in (("GiftCard.tla", edit_spec), ("chart.viz", edit_chart)):
        if edit:
            p = os.path.join(d, name)
            with open(p) as f:
                text = edit(f.read())
            with open(p, "w") as f:
                f.write(text)
    if cfg:
        with open(os.path.join(d, "Test.cfg"), "w") as f:
            f.write(cfg)
    return d


FAILS = []


def expect(label, out, *patterns, absent=()):
    for pat in patterns:
        if not re.search(pat, out, re.M):
            FAILS.append(f"{label}: missing /{pat}/")
    for pat in absent:
        if re.search(pat, out, re.M):
            FAILS.append(f"{label}: unexpected /{pat}/")


def main():
    # 1. The example as shipped: one bug, fixed by the conditional write, one dead arrow.
    d = variant()
    code, out = run(d, "--viz", "chart.viz", "--fix", "GiftCardFixed.cfg")
    chart = open(os.path.join(d, "chart.checked.viz")).read()
    expect("example", out, r"^  NoDoubleCredit: broken, 4 steps", r"^    4\. t2 Answer: checking -> credited",
           r"^  redeem: works", r"^  twotabs: fixed", r"^  dropped: unreached", r"checking -> offline: the model never takes")
    expect("example chart", chart, r"^!twice:", r"^\+both:", r"^\?offline:", r"^!cx_NoDoubleCredit: form > checking > credited => twice",
           r"^dropped: form > checking =\| offline")
    if code != 0:
        FAILS.append(f"example: exit {code}, want 0 (the fix is clean)")

    # 2. Same trace on every run (one worker, fixed fingerprint seed).
    _, again = run(d, "--viz", "chart.viz", "--fix", "GiftCardFixed.cfg")
    if re.findall(r"^    \d\..*$", again, re.M) != re.findall(r"^    \d\..*$", out, re.M):
        FAILS.append("determinism: the counterexample changed between two runs")

    # 3. A stuck end state is a deadlock once Done is gone.
    d = variant(edit_spec=lambda s: s.replace(" \\/ Done", ""))
    code, out = run(d)
    expect("no Done", out, r"^  deadlock: broken")
    if code != 1:
        FAILS.append(f"no Done: exit {code}, want 1")

    # 4. Every rule gets a verdict: two invariants, deadlock, and two properties, one of them a lasso.
    extra = """
Retry(t) == /\\ ui[t] = "rejected" /\\ ui' = [ui EXCEPT ![t] = "form"] /\\ UNCHANGED <<card, credits, seen>>
Next2 == (\\E t \\in Tabs : Press(t) \\/ Answer(t) \\/ Retry(t)) \\/ Done
Spec == Init /\\ [][Next2]_vars /\\ \\A t \\in Tabs : WF_vars(Answer(t))
SeenOK == \\A t \\in Tabs : seen[t] \\in {"none", "unused"}
Answered == \\A t \\in Tabs : (ui[t] = "checking") ~> (ui[t] # "checking")
AllCredited == <>(\\A t \\in Tabs : ui[t] = "credited")
===="""
    d = variant(edit_spec=lambda s: s.replace("====", extra),
                edit_chart=lambda c: re.sub(r"checking -> rejected.*\n|reuse:.*\n", "", c),
                cfg="CONSTANTS Tabs = {t1, t2}\nFix = FALSE\nSPECIFICATION Spec\n"
                    "INVARIANTS NoDoubleCredit SeenOK\nPROPERTIES Answered AllCredited\n")
    code, out = run(d, "--config", "Test.cfg", "--viz", "chart.viz")
    expect("rules", out, r"^  NoDoubleCredit: broken", r"^  SeenOK: broken", r"^  deadlock: holds", r"^  Answered: holds",
           r"^  AllCredited: broken", r"repeat forever", r"checking -> rejected by Answer: no arrow",
           r"rejected -> form by Retry: no arrow")

    # 5. A story the model reaches only by another route than the one drawn.
    d = variant(edit_chart=lambda c: c.replace("reuse: form > checking => rejected", "reuse: form => rejected"))
    _, out = run(d, "--viz", "chart.viz", "--fix", "GiftCardFixed.cfg")
    expect("route", out, r"^  reuse: reached only via form > checking > rejected", r"form -> rejected: the model never takes")

    # 6. Over --graph-limit, stories fall back to witness runs and say so.
    d = variant()
    _, out = run(d, "--viz", "chart.viz", "--fix", "GiftCardFixed.cfg", "--graph-limit", "3")
    expect("fallback", out, r"state graph skipped", r"^  twotabs: fixed", absent=[r"never takes this arrow"])

    for f in FAILS:
        print("FAIL", f)
    print("ok" if not FAILS else f"{len(FAILS)} failed")
    return 1 if FAILS else 0


if __name__ == "__main__":
    sys.exit(main())
