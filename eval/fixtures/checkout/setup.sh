#!/bin/sh
set -eu
dest=$1
mkdir -p "$dest"
cp "$(dirname "$0")/app.py" "$(dirname "$0")/checkout.html" "$dest/"
cd "$dest"
printf '*.sqlite*\n__pycache__/\n' > .gitignore
git init -q
git config user.name Fixture
git config user.email fixture@example.test
git add .
GIT_AUTHOR_DATE='2025-01-01T00:00:00Z' GIT_COMMITTER_DATE='2025-01-01T00:00:00Z' git commit -qm 'Checkout with retry and receipts'
