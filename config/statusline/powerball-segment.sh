# Powerball: mode marker plus skills/playbooks/principles actually read this session
pb=""
if [ "$style" = "powerball" ]; then
  pb_used=""
  usage=~/.claude/skills/yesh-router/scripts/powerball_usage.py
  [ -n "$transcript" ] && [ -f "$usage" ] && pb_used=$(/usr/bin/python3 "$usage" status "$transcript" 2>/dev/null)
  pb="${sep}${YELLOW}pb●${RESET}${pb_used:+ ${pb_used}}"
fi
