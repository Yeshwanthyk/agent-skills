#!/usr/bin/env python3
"""Check the Yesh router's file graph and routing structure.

This checker deliberately validates structure and paths. It does not claim to
run semantic agent trials or a live classifier.
Retired router paths are rejected rather than aliased.
"""
from __future__ import annotations

import argparse
import os
import re
import sys
from dataclasses import dataclass
from pathlib import Path
from typing import Iterator, Optional
from urllib.parse import unquote, urlsplit


ROUTER_REL = Path("skills/yesh-router")
RETIRED_ROUTER_REL = Path("skills/yesh-mode")
SHARED_REL = Path("skills/references")
PRINCIPLES_REL = SHARED_REL / "principles"
RETIRED_PATH_POLICY = "retired-router-paths-forbidden"

REQUIRED_ROUTER_DOCS = (
    "SKILL.md",
    "methods.md",
    "principle-triggers.md",
    "classifier-contract.md",
)
SHARED_REFERENCES = ("delegation.md", "session-records.md")

# These are lexical and resolved path prefixes. Checking both catches a stale
# spelling even when an old path is temporarily a symlink to its replacement.
LEGACY_PREFIXES = (RETIRED_ROUTER_REL,)
LEGACY_FILES = {
    Path("skills/references/agent-routing.md"),
}

_FENCE_RE = re.compile(r"^\s*(`{3,}|~{3,})")

@dataclass(frozen=True)
class MarkdownLink:
    source: Path
    raw_target: str
    lexical: Path
    resolved: Path


def _source_path(path: Path) -> Path:
    return path.resolve()


class MarkdownSyntaxError(ValueError):
    pass


@dataclass(frozen=True)
class ReferenceDefinition:
    target: str
    line_number: int


def _strip_inline_code(line: str) -> str:
    return re.sub(r"`+[^`\n]*`+", "", line)


def _visible_markdown_lines(source: Path) -> list[tuple[int, str]]:
    visible: list[tuple[int, str]] = []
    in_fence = False
    fence_marker = ""
    for line_number, raw_line in enumerate(source.read_text(encoding="utf-8").splitlines(), 1):
        fence = _FENCE_RE.match(raw_line)
        if fence:
            marker = fence.group(1)[0]
            if not in_fence:
                in_fence = True
                fence_marker = marker
            elif marker == fence_marker:
                in_fence = False
            continue
        if not in_fence:
            visible.append((line_number, _strip_inline_code(raw_line)))
    return visible


def _normalize_reference_label(label: str) -> str:
    return re.sub(r"\s+", " ", label.strip()).casefold()


def _is_escaped(text: str, position: int) -> bool:
    backslashes = 0
    position -= 1
    while position >= 0 and text[position] == "\\":
        backslashes += 1
        position -= 1
    return backslashes % 2 == 1


def _find_unescaped(text: str, character: str, start: int) -> Optional[int]:
    for position in range(start, len(text)):
        if text[position] == character and not _is_escaped(text, position):
            return position
    return None


def _consume_title(text: str, start: int) -> Optional[int]:
    if start >= len(text) or text[start] not in {"'", '"', "("}:
        return None
    opener = text[start]
    if opener in {"'", '"'}:
        for position in range(start + 1, len(text)):
            if text[position] == opener and not _is_escaped(text, position):
                return position + 1
        return None

    depth = 1
    position = start + 1
    while position < len(text):
        if _is_escaped(text, position):
            position += 1
            continue
        if text[position] == "(":
            depth += 1
        elif text[position] == ")":
            depth -= 1
            if depth == 0:
                return position + 1
        position += 1
    return None


def _parse_destination(text: str, start: int, closing: Optional[str]) -> tuple[str, int]:
    position = start
    while position < len(text) and text[position].isspace():
        position += 1
    if position >= len(text):
        raise MarkdownSyntaxError("link destination is missing")

    if text[position] == "<":
        end = _find_unescaped(text, ">", position + 1)
        if end is None:
            raise MarkdownSyntaxError("angle-bracket link destination is not closed")
        target = text[position + 1 : end]
        position = end + 1
    else:
        target_start = position
        parenthesis_depth = 0
        while position < len(text):
            character = text[position]
            if character == "\\" and position + 1 < len(text):
                position += 2
                continue
            if character == "(":
                parenthesis_depth += 1
            elif character == ")":
                if parenthesis_depth == 0:
                    break
                parenthesis_depth -= 1
            elif character.isspace() and parenthesis_depth == 0:
                break
            position += 1
        if parenthesis_depth:
            raise MarkdownSyntaxError("link destination has unbalanced parentheses")
        if position == target_start:
            raise MarkdownSyntaxError("link destination is empty")
        target = text[target_start:position]

    while position < len(text) and text[position].isspace():
        position += 1
    if closing is None:
        if position == len(text):
            return target, position
        title_end = _consume_title(text, position)
        if title_end is None:
            raise MarkdownSyntaxError(
                "unsupported link suffix; use a title or angle brackets for spaces"
            )
        position = title_end
        while position < len(text) and text[position].isspace():
            position += 1
        if position != len(text):
            raise MarkdownSyntaxError("unexpected text after link title")
        return target, position

    if position < len(text) and text[position] == closing:
        return target, position + 1
    title_end = _consume_title(text, position)
    if title_end is None:
        raise MarkdownSyntaxError(
            "unsupported link suffix; use a title or angle brackets for spaces"
        )
    position = title_end
    while position < len(text) and text[position].isspace():
        position += 1
    if position >= len(text) or text[position] != closing:
        raise MarkdownSyntaxError("link is missing its closing parenthesis")
    return target, position + 1


def _local_link_target(source: Path, raw_target: str) -> Optional[MarkdownLink]:
    raw_target = raw_target.strip()
    if not raw_target or raw_target.startswith("#") or raw_target.startswith("/"):
        return None

    parsed = urlsplit(raw_target)
    if parsed.scheme or raw_target.startswith("//"):
        return None
    target_text = unquote(parsed.path)
    if not target_text:
        return None

    source = _source_path(source)
    lexical = Path(os.path.abspath(os.path.normpath(str(source.parent / target_text))))
    return MarkdownLink(
        source=source,
        raw_target=raw_target,
        lexical=lexical,
        resolved=lexical.resolve(),
    )


_REFERENCE_DEFINITION_RE = re.compile(r"^\s{0,3}\[(?P<label>[^\]\n]+)\]:\s*(?P<target>.*)$")


def _parse_markdown_links(path: Path) -> tuple[list[MarkdownLink], list[str]]:
    source = _source_path(path)
    lines = _visible_markdown_lines(source)
    definitions: dict[str, ReferenceDefinition] = {}
    definition_lines: set[int] = set()
    issues: list[str] = []

    for line_number, line in lines:
        definition = _REFERENCE_DEFINITION_RE.match(line)
        if not definition:
            continue
        definition_lines.add(line_number)
        try:
            target, _ = _parse_destination(definition.group("target"), 0, None)
        except MarkdownSyntaxError as exc:
            issues.append(f"line {line_number}: invalid reference definition: {exc}")
            continue
        definitions[_normalize_reference_label(definition.group("label"))] = ReferenceDefinition(
            target=target,
            line_number=line_number,
        )

    links: list[MarkdownLink] = []
    for line_number, line in lines:
        if line_number in definition_lines:
            continue
        position = 0
        while position < len(line):
            opening = line.find("[", position)
            if opening < 0:
                break
            if opening > 0 and line[opening - 1] == "!":
                position = opening + 1
                continue
            closing = _find_unescaped(line, "]", opening + 1)
            if closing is None:
                position = opening + 1
                continue
            label = line[opening + 1 : closing]
            after_label = closing + 1
            if after_label < len(line) and line[after_label] == "(":
                try:
                    target, end = _parse_destination(line, after_label + 1, ")")
                except MarkdownSyntaxError as exc:
                    issues.append(f"line {line_number}: invalid inline link: {exc}")
                    position = after_label + 1
                    continue
                link = _local_link_target(source, target)
                if link is not None:
                    links.append(link)
                position = end
                continue

            reference_label = label
            end = after_label
            if after_label < len(line) and line[after_label] == "[":
                reference_end = _find_unescaped(line, "]", after_label + 1)
                if reference_end is None:
                    issues.append(f"line {line_number}: unresolved Markdown reference link")
                    position = after_label + 1
                    continue
                reference_label = line[after_label + 1 : reference_end] or label
                end = reference_end + 1

            definition = definitions.get(_normalize_reference_label(reference_label))
            if definition is not None:
                link = _local_link_target(source, definition.target)
                if link is not None:
                    links.append(link)
            elif end != after_label or _normalize_reference_label(label) in definitions:
                issues.append(
                    f"line {line_number}: unresolved Markdown reference link "
                    f"[{reference_label}]"
                )
            position = end if end > closing else closing + 1
    return links, issues


def markdown_links(path: Path) -> Iterator[MarkdownLink]:
    """Yield local Markdown links, excluding inline and fenced code."""
    links, _ = _parse_markdown_links(path)
    yield from links


def _relative(path: Path, root: Path) -> Optional[Path]:
    try:
        return path.relative_to(root)
    except ValueError:
        return None


def _display(path: Path, root: Path) -> str:
    relative = _relative(path, root)
    return str(relative) if relative is not None else str(path)


def _legacy_reason(root: Path, link: MarkdownLink) -> Optional[str]:
    for candidate in (link.lexical, link.resolved):
        relative = _relative(candidate, root)
        if relative is None:
            continue
        if relative in LEGACY_FILES:
            if relative.name == "agent-routing.md":
                return "agent-routing.md was replaced by references/delegation.md"
            return "session-records.md must live in shared references"
        for prefix in LEGACY_PREFIXES:
            if relative == prefix or prefix in relative.parents:
                return f"moved content remains under {prefix}"
    return None


def _markdown_files(root: Path) -> list[Path]:
    candidates: list[Path] = []
    readme = root / "README.md"
    if readme.is_file():
        candidates.append(readme)
    skills = root / "skills"
    if skills.is_dir():
        candidates.extend(sorted(path for path in skills.rglob("*.md") if path.is_file()))
    return candidates


def _required_skill_paths(root: Path) -> list[Path]:
    skills = root / "skills"
    if not skills.is_dir():
        return []
    return sorted(
        path
        for path in skills.glob("*/SKILL.md")
        if path.is_file() and path.parent.name != "yesh-router"
    )


def _actual_playbook_paths(root: Path) -> list[Path]:
    playbook_dir = root / ROUTER_REL / "playbooks"
    if not playbook_dir.is_dir():
        return []
    return sorted(path for path in playbook_dir.glob("*.md") if path.is_file())


def _actual_principle_paths(root: Path) -> list[Path]:
    principle_dir = root / PRINCIPLES_REL
    if not principle_dir.is_dir():
        return []
    return sorted(path for path in principle_dir.glob("*.md") if path.is_file())


def _require_file(errors: list[str], root: Path, path: Path, label: str) -> None:
    if not path.is_file():
        errors.append(f"Missing {label}: {_display(path, root)}")


def _check_layout(root: Path, errors: list[str]) -> None:
    router = root / ROUTER_REL
    for name in REQUIRED_ROUTER_DOCS:
        _require_file(errors, root, router / name, f"router document {name}")

    playbook_dir = router / "playbooks"
    if not playbook_dir.is_dir():
        errors.append(f"Missing router playbooks directory: {_display(playbook_dir, root)}")


    principles = root / PRINCIPLES_REL
    if not principles.is_dir():
        errors.append(f"Missing shared principles directory: {_display(principles, root)}")

    for name in SHARED_REFERENCES:
        _require_file(errors, root, root / SHARED_REL / name, "shared reference")

    retired_router = root / RETIRED_ROUTER_REL
    if retired_router.exists() or retired_router.is_symlink():
        errors.append(
            f"Retired router path exists under policy {RETIRED_PATH_POLICY}: "
            f"{_display(retired_router, root)}"
        )
    for relative in sorted(LEGACY_FILES):
        path = root / relative
        if path.exists() or path.is_symlink():
            errors.append(
                f"Legacy path exists under policy {RETIRED_PATH_POLICY}: "
                f"{_display(path, root)}"
            )


def _check_links(root: Path, errors: list[str]) -> None:
    for source in _markdown_files(root):
        links, syntax_errors = _parse_markdown_links(source)
        for syntax_error in syntax_errors:
            errors.append(f"{_display(source, root)}: {syntax_error}")
        for link in links:
            legacy_reason = _legacy_reason(root, link)
            if legacy_reason:
                errors.append(
                    f"{_display(source, root)}: stale moved path {link.raw_target} ({legacy_reason})"
                )
            if _relative(link.lexical, root) is None:
                errors.append(
                    f"{_display(source, root)}: local link escapes checkout: {link.raw_target}"
                )
                continue
            if _relative(link.resolved, root) is None:
                errors.append(
                    f"{_display(source, root)}: link resolves outside checkout: {link.raw_target}"
                )
                continue
            if not link.resolved.exists():
                errors.append(
                    f"{_display(source, root)}: missing target {link.raw_target} "
                    f"({_display(link.resolved, root)})"
                )


def _targets(path: Path) -> list[Path]:
    return [link.resolved for link in _parse_markdown_links(path)[0]] if path.is_file() else []


def _check_router_entry(root: Path, errors: list[str]) -> None:
    entry = root / ROUTER_REL / "SKILL.md"
    if not entry.is_file():
        return
    targets = set(_targets(entry))
    for name in ("methods.md", "principle-triggers.md"):
        expected = (root / ROUTER_REL / name).resolve()
        if expected not in targets:
            errors.append(
                f"{_display(entry, root)} does not point to "
                f"{_display(expected, root)}"
            )


def _check_method_catalog(root: Path, errors: list[str]) -> None:
    catalog = root / ROUTER_REL / "methods.md"
    if not catalog.is_file():
        return

    expected = [*(path.resolve() for path in _required_skill_paths(root)), *(
        path.resolve() for path in _actual_playbook_paths(root)
    )]
    targets = _targets(catalog)
    for target in expected:
        count = targets.count(target)
        if count == 0:
            errors.append(
                f"Method catalog omits actual target: {_display(target, root)}"
            )
        elif count > 1:
            errors.append(
                f"Method catalog lists target more than once: {_display(target, root)}"
            )

    classifier = (root / ROUTER_REL / "classifier-contract.md").resolve()
    if classifier in targets:
        errors.append(
            f"{_display(catalog, root)} treats docs-only classifier-contract.md as a method"
        )

    all_top_level_skills = {
        path.resolve()
        for path in (root / "skills").glob("*/SKILL.md")
        if path.is_file()
    }
    expected_set = set(expected)
    for target in targets:
        if target in all_top_level_skills and target not in expected_set:
            errors.append(
                f"Method catalog points at non-catalog skill: {_display(target, root)}"
            )
        if target.parent == (root / ROUTER_REL / "playbooks").resolve() and target not in expected_set:
            errors.append(
                f"Method catalog points at unexpected playbook: {_display(target, root)}"
            )


def _check_principle_triggers(root: Path, errors: list[str]) -> None:
    triggers = root / ROUTER_REL / "principle-triggers.md"
    if not triggers.is_file():
        return

    expected = [path.resolve() for path in _actual_principle_paths(root)]
    targets = _targets(triggers)
    for target in expected:
        count = targets.count(target)
        if count == 0:
            errors.append(
                f"Principle trigger map omits shared principle: {_display(target, root)}"
            )
        elif count > 1:
            errors.append(
                f"Principle trigger map lists principle more than once: {_display(target, root)}"
            )


def collect_errors(root: Path) -> list[str]:
    root = Path(root).resolve()
    errors: list[str] = []
    if not root.is_dir():
        return [f"Root is not a directory: {root}"]
    _check_layout(root, errors)
    _check_links(root, errors)
    _check_router_entry(root, errors)
    _check_method_catalog(root, errors)
    _check_principle_triggers(root, errors)

    unique: list[str] = []
    seen: set[str] = set()
    for error in errors:
        if error not in seen:
            seen.add(error)
            unique.append(error)
    return unique


def check(root: Path) -> int:
    errors = collect_errors(root)
    if errors:
        print("\n".join(errors), file=sys.stderr)
        return 1
    resolved_root = Path(root).resolve()
    print(
        f"PASS: {len(_required_skill_paths(resolved_root)) + len(_actual_playbook_paths(resolved_root))} "
        f"catalog entries, {len(_actual_principle_paths(resolved_root))} shared principles, and local Markdown references"
    )
    return 0


def main(argv: Optional[list[str]] = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("root", nargs="?", type=Path, default=Path(__file__).resolve().parents[1])
    args = parser.parse_args(argv)
    return check(args.root)


if __name__ == "__main__":
    sys.exit(main())
