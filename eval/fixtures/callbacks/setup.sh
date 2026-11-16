#!/bin/sh
set -eu
dest=$1
mkdir -p "$dest"
cp "$(dirname "$0")"/project/*.py "$dest/"
cd "$dest"
printf '__pycache__/\n.claude/\n' > .gitignore
git init -q
git config user.name Fixture
git config user.email fixture@example.test
git add .
git commit -qm 'Callback collection with synchronous and delayed delivery'
