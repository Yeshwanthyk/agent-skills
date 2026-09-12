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
        self.scripts: list[str] = []
        self.styles: list[str] = []
        self.body_kind: str | None = None

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        self.tags[tag] = self.tags.get(tag, 0) + 1
        values = dict(attrs)
        if tag == "script":
            script_type = (values.get("type") or "").lower().split(";")[0].strip()
            self.body_kind = "script" if script_type in {"", "module", "text/javascript", "application/javascript"} else None
        elif tag == "style":
            self.body_kind = "style"
        for key, value in attrs:
            if value and key.startswith("on"):
                self.scripts.append(value)
        if values.get("style"):
            self.styles.append(values["style"])

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
        if src and not embedded(src):
            self.external_assets.append(f"<{tag} src={src!r}>")

        href = values.get("href")
        if tag == "link" and href and not embedded(href):
            self.external_assets.append(f"<link href={href!r}>")

    def handle_endtag(self, tag: str) -> None:
        if tag in {"script", "style"}:
            self.body_kind = None

    def handle_data(self, data: str) -> None:
        if self.body_kind == "script":
            self.scripts.append(data)
        elif self.body_kind == "style":
            self.styles.append(data)


def embedded(value: str) -> bool:
    return value.strip().lower().startswith(("data:", "#"))


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

    for css in parser.styles:
        css = re.sub(r"/\*.*?\*/", "", css, flags=re.DOTALL)
        urls = re.findall(r"url\(\s*([^)]*)\)", css, re.IGNORECASE)
        imports = re.findall(r"@import\s+['\"]([^'\"]+)['\"]", css, re.IGNORECASE)
        if any(not embedded(url.strip().strip("\"'")) for url in urls + imports):
            errors.append("external CSS asset")
            break

    # A static heuristic, not a JavaScript parser or network sandbox.
    javascript = "\n".join(parser.scripts)
    javascript = re.sub(r"'([^'\\]|\\.)*'|\"([^\"\\]|\\.)*\"|//[^\n]*|/\*.*?\*/", " ", javascript, flags=re.DOTALL)
    if re.search(r"\b(?:fetch|XMLHttpRequest|WebSocket|EventSource)\s*\(", javascript):
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
