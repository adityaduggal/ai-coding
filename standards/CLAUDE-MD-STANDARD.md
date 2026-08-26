# CLAUDE.md standard

The single highest-leverage token rule, because CLAUDE.md loads into every
session on every project, whether it's needed that turn or not. See
`docs/developer/architecture.md` §1 for the full token model this sits in.

## Rule 1 — 80-line hard cap

`CLAUDE.md` must be **80 lines or fewer**. Enforced by `scripts/claude-md-lint.py`
in CI (see §"Enforcement" below) — this is not a guideline, it's a build gate.

### Why 80

Every line in CLAUDE.md is paid for on every session, whether that turn needs
it or not. A project with real complexity still fits its *pointers* in 80
lines; it just can't fit its *content* there. That's the point.

### What belongs in CLAUDE.md

- Pointers to other files (`rules/`, `standards/`, `docs/`), not the rule
  content itself.
- Project-specific facts an agent can't derive by reading the code: test
  command, lint command, what's off-limits, commit style.
- Nothing that's already discoverable from the repo (file layout, language,
  framework — an agent can `ls`/`grep` for those).

### What doesn't

- Full rule bodies — link to them instead (`rules/token-savings.md`, not a
  copy of its contents).
- Anything that changes per-feature or per-branch — that belongs in a plan
  file on disk, not in the always-loaded file.
- Duplicated content that also lives in `standards/` or `docs/` — one source
  of truth, referenced, not repeated.

## Enforcement

`scripts/claude-md-lint.py` checks `CLAUDE.md` in the current repo (or a
given path) against the line cap and exits non-zero if it's over. It has no
dependencies beyond Python 3, so it can be copied into any project's
`scripts/` and wired into CI:

```yaml
# .github/workflows/ci.yml
- run: python3 scripts/claude-md-lint.py
```

Or run locally:

```bash
python3 scripts/claude-md-lint.py            # lints ./CLAUDE.md
python3 scripts/claude-md-lint.py path/to/CLAUDE.md
python3 scripts/claude-md-lint.py --max-lines 100 path/to/CLAUDE.md
```

This is the first rule from `docs/developer/architecture.md` to move from
"documented" to "enforced." The rest of the standards in that doc follow the
same pattern: write the rule in `standards/`, ship the checker in `scripts/`,
wire it into CI — never leave a rule as prose alone if a script can hold the
line instead.
