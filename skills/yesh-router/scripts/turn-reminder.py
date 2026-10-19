#!/usr/bin/env python3
"""UserPromptSubmit hook: re-anchor the powerball header on each real user message.

It does not pick a method; the model matches Triggers itself. It only reminds the
model to do so, because the router text loses salience deep into long threads.
Claude Code records the line as hook_additional_context in the session jsonl, so the
session audit can tell hook-on turns apart. scripts/build-mode.py installs it.
"""
import json, sys

REMINDER = ("powerball: if this message is a new ask (a task, bug, status, PR, research), "
            "open the matching method file, then start with `Method:` and `Plan: … · ends:`; "
            "otherwise continue the current Plan.")
SKIP = ("<task-notification", "This session is being continued", "<command-")

try:
    prompt = json.load(sys.stdin).get("prompt", "")
except Exception:
    sys.exit(0)
if not prompt.strip() or prompt.lstrip().startswith(SKIP):
    sys.exit(0)
print(json.dumps({"hookSpecificOutput": {"hookEventName": "UserPromptSubmit",
                                         "additionalContext": REMINDER}}))
