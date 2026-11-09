#!/usr/bin/env bash
# Create the agent-inbox vault, and optionally one project folder, if missing.
# Idempotent: never overwrites an existing file. Prints the vault path.
# Usage: ensure-vault.sh [project-slug]
set -euo pipefail

vault="${AGENT_INBOX:-$HOME/agent-inbox}"
here="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
project="${1:-}"

mkdir -p "$vault"/{inbox,daily,projects,archive}
[ -f "$vault/AGENTS.md" ] || cp "$here/assets/vault-AGENTS.md" "$vault/AGENTS.md"
for d in inbox daily archive; do
  [ -n "$(ls -A "$vault/$d")" ] || touch "$vault/$d/.gitkeep"
done

if [ -n "$project" ]; then
  case "$project" in
    *[!a-z0-9-]*|-*|"") echo "project slug must be lowercase letters, digits, dashes: $project" >&2; exit 2 ;;
  esac
  p="$vault/projects/$project"
  mkdir -p "$p/sessions"
  [ -n "$(ls -A "$p/sessions")" ] || touch "$p/sessions/.gitkeep"
  [ -f "$p/overview.md" ] || printf -- '---\nproject: %s\nstatus: active\n---\n\n# %s\n\n## Goal\n\n## Where it stands\n\n## Open threads\n' "$project" "$project" > "$p/overview.md"
  [ -f "$p/decisions.md" ] || printf -- '# %s decisions\n\nNewest first. Each entry: date, decision, why, source.\n' "$project" > "$p/decisions.md"
fi

if [ ! -d "$vault/.git" ]; then
  git -C "$vault" init -q
  git -C "$vault" add -A
  git -C "$vault" commit -qm "agent-inbox: create vault" || true
fi

echo "$vault"
