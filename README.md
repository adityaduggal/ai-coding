# ai-coding

Central repo for the rules and conventions that govern how AI coding agents
(Claude, Codex, etc.) work across my projects — token-saving practices,
CLAUDE.md/AGENTS.md conventions, and reusable templates.

## Layout

- `CLAUDE.md` — root-level rules that apply to this repo itself.
- `rules/` — topic-specific rule files (token savings, review conventions,
  commit style, etc.), one file per topic.
- `templates/` — starter CLAUDE.md/AGENTS.md snippets meant to be copied
  into other repos as a baseline.

## Usage

Pull a template from `templates/` into a new project's `CLAUDE.md`, then
trim it to that project's needs. Shared rules that should apply everywhere
live in `rules/` and get referenced from each project's own CLAUDE.md.
