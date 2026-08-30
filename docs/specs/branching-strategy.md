---
title: Branching Strategy
status: draft
created: 2026-08-31
updated: 2026-08-31
---

## Why

This repo has no defined branching convention today — everything happens on
`master` by accident rather than by design. `architecture.md` sketches a
branch-naming scheme (`<type>/<issue#>-<kebab-slug>`) as part of a much
larger future GitHub-automation design, but that assumes issue tracking and
collaborators that don't exist yet. Without an explicit, right-sized
convention, future sessions (agent or human) have no rule for when to branch
at all, what to name it, or how to merge it back — leading to either
needless branch ceremony for a solo repo or unreviewable giant commits
straight to master.

## Design

**Model: trunk-based, `master` only, by default.** Almost all work commits
directly to `master` in small atomic commits (per [[atomic-commits]]). There
is no `develop`/stable split — that's LTS machinery (as seen in
`frappe/frappe`'s `develop` + `version-N` + `version-N-hotfix` branches)
built for a product with paying users on old releases, which doesn't apply
to a solo rules/tooling repo. Revisit only if/when another repo starts
pinning to commits in `standards/` and needs a stable line to point at.

**When to branch:** a change that touches **5+ files, or spans more than
one `docs/specs/*.md` feature**. Below that threshold, commit straight to
master. Above it, isolate the work on a branch so master stays green while
the multi-part change is in progress.

**Branch naming:** `<type>/<kebab-slug>` — no issue number, since there's
no issue tracker in active use today. Types: `feat, fix, docs, refactor,
test, chore, ci` (matches `architecture.md` §8's type vocabulary, minus the
issue number). Example: `feat/token-budget-report`.

**Merging back:** squash merge into master as one clean atomic commit
(Conventional Commits style, per [[atomic-commits]]), then delete the
branch immediately. No lingering branches.

**Out of scope** (owned by other draft specs): commit message format
details → [[atomic-commits]]; pre-commit checks → `precommit-hooks.md`.

## Tasks

- [ ] Add a short branching-strategy pointer to `CLAUDE.md` or a `rules/`
      file (whichever stays within the 80-line cap) referencing this spec
- [ ] None else — this spec is a convention, not code; "implementation" is
      following the rule going forward

## Open Questions

- If/when another repo starts pinning to commits in `standards/`, does that
  trigger a `develop`/stable split, or is a tagged commit on `master`
  enough? Deferred until that need actually arises.
