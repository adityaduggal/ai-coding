# Specs

Design docs for features/changes to this repo. One file per feature, written
via the `superpowers:brainstorming` skill (architectural path) instead of its
default `docs/superpowers/specs/` location.

## Format

Each spec is `docs/specs/<slug>.md` with YAML front matter:

```yaml
---
title: Feature Name
status: draft   # draft | in-progress | done | superseded
created: YYYY-MM-DD
updated: YYYY-MM-DD
---
```

followed by:

- `## Why` — problem/motivation
- `## Design` — the validated design
- `## Tasks` — markdown checklist; this is the task breakdown for
  implementation, checked off as work lands. No separate plan file.
- `## Open Questions` — anything still undecided

## Workflow

1. Brainstorm the feature with `superpowers:brainstorming`, writing the
   result to `docs/specs/<slug>.md` (`status: draft`).
2. Fill in `## Tasks` as part of the design — this doubles as the
   implementation plan.
3. Flip `status` to `in-progress` when work starts, check off tasks as they
   land, flip to `done` when the checklist is complete. `superseded` if a
   later spec replaces it.
4. Update `updated` on any change to the file.

Progress on any feature is visible by reading its spec file — no separate
tracking index.
