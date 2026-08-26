#!/usr/bin/env python3
"""Enforce the CLAUDE.md line-count cap (standards/CLAUDE-MD-STANDARD.md).

No third-party dependencies — copy this file into any project's scripts/
and wire it into CI as-is:

    python3 scripts/claude-md-lint.py

Exits 0 if CLAUDE.md is within the cap (or absent), 1 if it's over, 2 on
usage error.
"""

import argparse
import sys
from pathlib import Path

DEFAULT_MAX_LINES = 80


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "path",
        nargs="?",
        default="CLAUDE.md",
        help="path to CLAUDE.md (default: ./CLAUDE.md)",
    )
    parser.add_argument(
        "--max-lines",
        type=int,
        default=DEFAULT_MAX_LINES,
        help=f"line cap (default: {DEFAULT_MAX_LINES})",
    )
    args = parser.parse_args()

    target = Path(args.path)
    if not target.exists():
        print(f"claude-md-lint: no {target} found — nothing to check")
        return 0

    line_count = sum(1 for _ in target.open(encoding="utf-8"))

    if line_count > args.max_lines:
        print(
            f"claude-md-lint: {target} is {line_count} lines, "
            f"cap is {args.max_lines}"
        )
        print(
            "Move content out to rules/, standards/, or docs/ and leave a "
            "pointer instead — see standards/CLAUDE-MD-STANDARD.md"
        )
        return 1

    print(f"claude-md-lint: {target} is {line_count}/{args.max_lines} lines — OK")
    return 0


if __name__ == "__main__":
    sys.exit(main())
