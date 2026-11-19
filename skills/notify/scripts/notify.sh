#!/usr/bin/env bash
# Alert yesh on this Mac: a Notification Center banner with a chime, plus a
# dialog that stays on screen until dismissed (banners can land silently in
# the sidebar). Returns at once; the dialog runs detached.
#
#   notify.sh [--quiet] TITLE MESSAGE
#
# --quiet sends only the banner, for a test or a low-stakes ping.
set -euo pipefail

quiet=0
if [ "${1:-}" = "--quiet" ]; then quiet=1; shift; fi
if [ $# -ne 2 ]; then
  echo "usage: notify.sh [--quiet] TITLE MESSAGE" >&2
  exit 2
fi
if [ "$(uname)" != "Darwin" ]; then
  echo "notify.sh: macOS only; not alerted: $1: $2" >&2
  exit 1
fi

title=$1 message=$2
osascript - "$title" "$message" <<'APPLESCRIPT'
on run argv
  display notification (item 2 of argv) with title (item 1 of argv) sound name "Glass"
end run
APPLESCRIPT

if [ "$quiet" = 0 ]; then
  nohup osascript - "$title" "$message" >/dev/null 2>&1 <<'APPLESCRIPT' &
on run argv
  display dialog (item 2 of argv) with title (item 1 of argv) buttons {"OK"} default button "OK" giving up after 3600
end run
APPLESCRIPT
  disown
fi
echo "alerted: $title: $message"
