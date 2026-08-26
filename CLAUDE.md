# CLAUDE.md

Rules for working in this repo (ai-coding).

## Scope

- This repo holds *rules and templates*, not application code. Keep changes
  scoped to `rules/`, `templates/`, and top-level docs.
- One topic per file in `rules/`. Don't let files grow into catch-alls.
- Templates in `templates/` should be copy-paste-ready — no placeholders
  left unexplained.
- Prefer editing existing rule/template files over adding new ones unless
  a change is genuinely a new topic.

## Token usage (default posture for every project using this repo)

- Read only the file ranges you need; don't re-read a file right after
  writing/editing it — a successful Edit/Write already confirms the change.
- Prefer targeted `Grep`/search over broad directory dumps.
- Delegate large, throwaway exploration to a subagent/fork; bring back a
  summary, not the raw output.
- Keep responses proportional to the task — no restating the request, no
  running commentary, no unrequested summaries.
- Batch independent tool calls in parallel instead of serial round-trips.

Full detail: see `rules/token-savings.md`.

## CLAUDE.md itself

- 80-line hard cap, enforced by `scripts/claude-md-lint.py` in CI. Pointers
  only — never paste rule bodies in here. See
  `standards/CLAUDE-MD-STANDARD.md`.
