# Contributing

This repository holds Claude Code configuration only (subagents, skills, and
the lint suite that checks them) — see [CLAUDE.md](CLAUDE.md) for the full
structure. This file covers the mechanics of contributing a change.

## Setup

```bash
npm install
```

This also installs the [Husky](https://typicode.github.io/husky/) git hook
that runs the lint suite before each commit (see [Pre-commit hook](#pre-commit-hook)).

## Adding or editing an agent

Add new agent files under `.claude/agents/engineering/` or
`.claude/agents/testing/` (or a new division subfolder if the agent doesn't
fit either). Match the existing frontmatter shape (`name`, `description`,
`color`, `emoji`, `vibe`) and section structure (Identity & Memory, Core
Mission, Critical Rules, Deliverables, Communication Style, Learning &
Memory, Success Metrics, Advanced Capabilities). See the
[Subagent file format](CLAUDE.md#subagent-file-format) section of CLAUDE.md
for the full spec. A subagent's invocable name comes from its frontmatter
`name` field, not the file path, so pick a `name` that doesn't collide with
an existing agent.

## Adding a skill

Install skills via the [`skills` CLI](https://github.com/vercel-labs/skills)
rather than hand-copying files, so `.claude/skills/` and `skills-lock.json`
stay traceable to an upstream source:

```bash
npx skills add <owner/repo> -a claude-code -y
```

See the [Skills](CLAUDE.md#skills) section of CLAUDE.md for the
`frappe-` prefixing convention this repo uses on top of the CLI's default
install layout, and the tradeoff that renaming creates with `npx skills
update`.

## Commit message conventions

This repo follows [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<optional scope>): <short summary>

<optional body>
```

Common types used here:

- `feat:` — a new agent, skill, or capability
- `fix:` — correcting an existing agent/skill/script
- `docs:` — CLAUDE.md, CONTRIBUTING.md, or other documentation-only changes
- `chore:` — dependency bumps, lockfile updates, tooling/CI config
- `refactor:` — restructuring without changing behavior (e.g. moving an
  agent between division subfolders)
- `test:` — changes to `scripts/` lint checks

Keep commits atomic — a single agent addition, a single skill update, a
single lint-config tweak — so each one can be reverted independently.

## Branch naming

Short-lived branches, named by type:

- `feat/<short-description>` — new agent or skill
- `fix/<short-description>` — correction to an existing agent/skill/script
- `docs/<short-description>` — documentation-only
- `chore/<short-description>` — tooling, CI, dependency changes

The default branch is `master`. Branch from the latest `master` and rebase
onto it before opening a PR.

## Before committing / opening a PR

Run the full lint suite:

```bash
npm run lint
```

This runs three checks (see [Linting & CI](CLAUDE.md#linting--ci) in
CLAUDE.md for what each one does):

- `npm run lint:md` — markdownlint over agent and skill Markdown
- `npm run lint:frontmatter` — required frontmatter fields present
- `npm run lint:json` — every tracked `.json` file parses

The pre-commit hook runs this automatically, but `npm run lint` is also
what CI (`.github/workflows/lint.yml`) runs on every push and PR — fixing
failures locally first is faster than round-tripping through CI.

## Pre-commit hook

`npm install` wires up a Husky pre-commit hook (`.husky/pre-commit`) that
runs `npm run lint` before every commit and blocks the commit on failure.
To bypass it in an emergency, use `git commit --no-verify` — but a red CI
run is worse than a slightly-delayed commit, so treat this as a last
resort.

## Opening a pull request

Fill out the PR template checklist
(`.github/PULL_REQUEST_TEMPLATE.md`). At minimum:

- `npm run lint` passes
- New agents/skills are in the correct subfolder
- Skills were installed via the `skills` CLI, not hand-copied

Mentioning `@claude` in a PR or issue comment invokes this repo's
`claude.yml` GitHub Action, which responds using the full agent and skill
roster checked into this repo.

## Reviewing / merging

This is a small, mostly-solo repository. For a solo change, a passing CI
run is sufficient before merging. For an external PR, review against the
checklist above and squash-merge to keep `master` history linear.
