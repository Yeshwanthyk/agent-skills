#!/bin/sh
set -eu
dest=$1
variant=${2:-good}
case "$variant" in good|duplicate|stale) ;; *) echo "Unknown checkout variant: $variant" >&2; exit 2 ;; esac
mkdir -p "$dest"
src=$(dirname "$0")/app.py
case "$variant" in
  good) cp "$src" "$dest/app.py" ;;
  # Duplicate only the durable effect; keep the browser receipt byte-for-byte correct.
  duplicate) sed -e '/^            if first:$/i\
            if not first:\
                db.execute("INSERT INTO payments(order_id, amount_cents) VALUES (?, 2500)", (key,))' \
    -e 's/ORDER BY id DESC LIMIT 1/ORDER BY id LIMIT 1/' "$src" > "$dest/app.py" ;;
  stale) sed 's/return self.respond(200, dict(row))/return self.respond(200, dict(row, order_id="previous-order"))/' "$src" > "$dest/app.py" ;;
esac
cp "$(dirname "$0")/checkout.html" "$dest/"
cd "$dest"
printf '*.sqlite*\n__pycache__/\n' > .gitignore
git init -q
git config user.name Fixture
git config user.email fixture@example.test
git add .
GIT_AUTHOR_DATE='2025-01-01T00:00:00Z' GIT_COMMITTER_DATE='2025-01-01T00:00:00Z' git commit -qm 'Checkout with retry and receipts'
