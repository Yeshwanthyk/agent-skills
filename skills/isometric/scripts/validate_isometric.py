#!/usr/bin/env python3
"""Validate a finished interactive isometric codebase-map HTML artifact."""

from __future__ import annotations

import argparse
import re
import sys
from pathlib import Path


def section(source: str, name: str) -> str:
    match = re.search(
        rf"const\s+{re.escape(name)}\s*=\s*\[(.*?)\n\s*\];",
        source,
        flags=re.DOTALL,
    )
    return match.group(1) if match else ""


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Check map completeness, portability, references, and share safety."
    )
    parser.add_argument("html", type=Path, help="Finished isometric-map HTML file")
    parser.add_argument(
        "--forbid-prefix",
        action="append",
        default=[],
        metavar="PREFIX",
        help="Company or infrastructure prefix that must not appear (repeatable)",
    )
    args = parser.parse_args()

    if not args.html.is_file():
        print(f"ERROR: file not found: {args.html}")
        return 2

    source = args.html.read_text(encoding="utf-8")
    errors: list[str] = []
    warnings: list[str] = []

    def require(condition: bool, message: str) -> None:
        if not condition:
            errors.append(message)

    require(
        bool(re.search(r"const\s+SAMPLE_DATA\s*=\s*false\s*;", source)),
        "SAMPLE_DATA must be false after replacing every sample value.",
    )
    for token in (
        "const GROUPS = [",
        "const STRUCTURES = [",
        "const EDGES = [",
        "const EXTERNALS = [",
        "const TRACE = [",
        "const OVERVIEW_WHAT =",
        "const OVERVIEW_HOW =",
        "window.__isometricReady",
    ):
        require(token in source, f"Missing required template token: {token}")

    require(
        bool(re.search(r"<meta[^>]+Content-Security-Policy", source, re.I)),
        "Missing Content-Security-Policy meta tag.",
    )
    require(
        bool(re.search(r"<link[^>]+rel=[\"']icon[\"']", source, re.I)),
        "Missing stable map favicon.",
    )

    remote_patterns = {
        "remote script": r"<script\b[^>]*\bsrc\s*=",
        "remote stylesheet": r"<link\b[^>]*\brel\s*=\s*[\"']stylesheet[\"']",
        "remote media": r"<(?:img|audio|video|source)\b[^>]*\bsrc\s*=\s*[\"']https?://",
        "CSS import": r"@import\b",
        "remote CSS URL": r"url\(\s*[\"']?https?://",
        "embedded frame": r"<iframe\b",
    }
    for label, pattern in remote_patterns.items():
        if re.search(pattern, source, re.I):
            errors.append(f"Self-contained artifact contains a {label}.")

    unsafe_script_patterns = {
        "eval": r"\beval\s*\(",
        "dynamic Function": r"\bnew\s+Function\s*\(",
        "inline event handler": r"\son[a-z]+\s*=\s*[\"']",
    }
    for label, pattern in unsafe_script_patterns.items():
        if re.search(pattern, source, re.I):
            errors.append(f"CSP safety check found {label}.")

    structures_text = section(source, "STRUCTURES")
    edges_text = section(source, "EDGES")
    trace_text = section(source, "TRACE")
    require(bool(structures_text), "Could not parse STRUCTURES array.")
    require(bool(edges_text), "Could not parse EDGES array.")
    require(bool(trace_text), "Could not parse TRACE array.")

    structure_ids = re.findall(r"\bid\s*:\s*[\"']([a-z0-9-]+)[\"']", structures_text)
    require(
        15 <= len(structure_ids) <= 35,
        f"Expected 15-35 structures, found {len(structure_ids)}.",
    )
    require(
        len(structure_ids) == len(set(structure_ids)),
        "STRUCTURES contains duplicate IDs.",
    )
    ids = set(structure_ids)

    edge_refs = re.findall(
        r"\bf\s*:\s*[\"']([^\"']+)[\"']\s*,\s*t\s*:\s*[\"']([^\"']+)[\"']",
        edges_text,
    )
    for origin, target in edge_refs:
        if origin not in ids:
            errors.append(f"Edge origin does not resolve: {origin}")
        if target not in ids:
            errors.append(f"Edge target does not resolve: {target}")

    talk_refs = re.findall(r"\btalks\s*:\s*\[([^\]]*)\]", structures_text)
    for raw_refs in talk_refs:
        for target in re.findall(r"[\"']([^\"']+)[\"']", raw_refs):
            if target not in ids:
                errors.append(f"talks reference does not resolve: {target}")

    trace_refs = re.findall(r"\[\s*[\"']([^\"']+)[\"']\s*,", trace_text)
    require(
        10 <= len(trace_refs) <= 14,
        f"Expected 10-14 trace steps, found {len(trace_refs)}.",
    )
    for target in trace_refs:
        if target not in ids:
            errors.append(f"Trace reference does not resolve: {target}")

    for field in ("code", "name", "group", "loc", "gx", "gy", "w", "d", "h", "what", "how", "talks"):
        count = len(re.findall(rf"\b{field}\s*:", structures_text))
        if count < len(structure_ids):
            errors.append(
                f"STRUCTURES field '{field}' appears {count} times for {len(structure_ids)} structures."
            )

    sample_markers = (
        "Isometric Template",
        "Replace this sample",
        "12,345",
        "Sample repository",
    )
    for marker in sample_markers:
        if marker.casefold() in source.casefold():
            errors.append(f"Sample marker remains: {marker}")

    safety_patterns = {
        "an at-sign": r"@",
        "credential-related wording": r"\bsecret(?:s|[-_][a-z0-9_-]+)?\b",
        "a common API key prefix": r"\b(?:sk-|xox[baprs]-|gh[pousr]_)[A-Za-z0-9_-]*",
        "an AWS access-key shape": r"\bAKIA[A-Z0-9]{8,}\b",
        "a cloud resource identifier": r"\b(?:arn:aws|projects/[a-z0-9-]+|subscriptions/[0-9a-f-]+)\b",
        "a mount path": r"(?:/mnt/|/mount/|/Volumes/|/var/run/secrets/)",
        "an endpoint-like path": r"[\"'`](?:/(?:api|internal|admin|v[0-9]+)(?:/[^\"'`\s?#]+)+)[\"'`]",
        "an absolute network URL": r"https?://",
    }
    for label, pattern in safety_patterns.items():
        match = re.search(pattern, source, re.I)
        if match:
            snippet = match.group(0)[:80]
            errors.append(f"Share-safety check found {label}: {snippet!r}")

    for prefix in args.forbid_prefix:
        if prefix and prefix.casefold() in source.casefold():
            errors.append(f"Forbidden company/infrastructure prefix remains: {prefix!r}")

    if len(edge_refs) < max(1, len(structure_ids) - 4):
        warnings.append(
            f"Only {len(edge_refs)} edges for {len(structure_ids)} structures; review isolated blocks."
        )
    if "#inside=" not in source or "#trace=" not in source:
        errors.append("Missing documented URL-hash debug hooks for inside or trace views.")

    for warning in warnings:
        print(f"WARNING: {warning}")
    if errors:
        for error in errors:
            print(f"ERROR: {error}")
        print(f"FAILED: {len(errors)} error(s), {len(warnings)} warning(s)")
        return 1

    print(
        f"OK: {args.html} has {len(structure_ids)} structures, "
        f"{len(edge_refs)} edges, and {len(trace_refs)} trace steps."
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
