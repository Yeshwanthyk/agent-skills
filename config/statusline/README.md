# Claude Code status line: powerball segment

`powerball-segment.sh` is the block added to `~/.claude/statusline.sh`. It needs two more `jq` fields in that script's input parse:

    @sh "style=\(.output_style.name // "")",
    @sh "transcript=\(.transcript_path // "")"

and `${pb}` appended to the final `printf`. It shows `pb●` while the powerball output style is on, followed by what the session actually read, from `skills/yesh-router/scripts/powerball_usage.py status <transcript>`: skills, `pb <playbooks>`, principle count, and `!unread …` when the last `Used:` line names a file never read. The script caches its parse offset under `~/.cache/powerball`, so it is cheap on every refresh.
