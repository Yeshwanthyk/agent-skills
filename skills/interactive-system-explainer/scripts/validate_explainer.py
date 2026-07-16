#!/usr/bin/env python3
"""Validate the structural contract of a self-contained interactive explainer."""

from __future__ import annotations

import re
import sys
from html.parser import HTMLParser
from pathlib import Path


class ExplainerParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.tags: dict[str, int] = {}
        self.ids: set[str] = set()
        self.duplicate_ids: set[str] = set()
        self.controls: list[str] = []
        self.interactive_count = 0
        self.external_assets: list[str] = []

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        self.tags[tag] = self.tags.get(tag, 0) + 1
        values = dict(attrs)

        element_id = values.get("id")
        if element_id:
            if element_id in self.ids:
                self.duplicate_ids.add(element_id)
            self.ids.add(element_id)

        controlled_id = values.get("aria-controls")
        if controlled_id:
            self.controls.extend(controlled_id.split())

        if tag in {"button", "input", "select", "textarea", "summary"}:
            self.interactive_count += 1

        src = values.get("src")
        if src and re.match(r"^(?:https?:)?//", src):
            self.external_assets.append(f"<{tag} src={src!r}>")

        href = values.get("href")
        if tag == "link" and href and re.match(r"^(?:https?:)?//", href):
            self.external_assets.append(f"<link href={href!r}>")


def validate(path: Path) -> list[str]:
    html = path.read_text(encoding="utf-8")
    lower = html.lower()
    parser = ExplainerParser()
    parser.feed(html)

    errors: list[str] = []
    if "<!doctype html>" not in lower:
        errors.append("missing <!doctype html>")

    for tag in ("html", "head", "title", "body", "style", "script"):
        if parser.tags.get(tag, 0) == 0:
            errors.append(f"missing <{tag}>")

    if parser.interactive_count == 0:
        errors.append("missing a semantic interactive control")

    for controlled_id in parser.controls:
        if controlled_id not in parser.ids:
            errors.append(f"aria-controls target #{controlled_id} is missing")

    for duplicate_id in sorted(parser.duplicate_ids):
        errors.append(f"duplicate id #{duplicate_id}")

    for asset in parser.external_assets:
        errors.append(f"external asset {asset}")

    if re.search(r"@import\s+url|url\(\s*['\"]?(?:https?:)?//", html, re.IGNORECASE):
        errors.append("external CSS asset")

    if re.search(r"\b(?:fetch|XMLHttpRequest|WebSocket)\s*\(?", html):
        errors.append("runtime network dependency")

    return errors


def main() -> int:
    if len(sys.argv) != 2:
        print("usage: validate_explainer.py <path-to-html>", file=sys.stderr)
        return 2

    path = Path(sys.argv[1]).expanduser().resolve()
    if not path.is_file():
        print(f"ERROR: file does not exist: {path}", file=sys.stderr)
        return 2

    errors = validate(path)
    if errors:
        for error in errors:
            print(f"ERROR: {error}", file=sys.stderr)
        return 1

    print(f"OK: {path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
