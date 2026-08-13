# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository purpose

This repository holds Claude Code configuration only — there is no application source code. It exists to organize custom subagent definitions and Claude Code skills used for AI-assisted coding, including Frappe/ERPNext custom app development. A small lint suite (Markdown, frontmatter, JSON) keeps that configuration clean, enforced in CI.

## Structure

- `.claude/settings.json` — enables the `superpowers@claude-plugins-official` plugin.
- `.claude/agents/` — 38 custom subagent definitions, organized into division subfolders. Claude Code scans `.claude/agents/` recursively — a subagent's invocable identity comes from its frontmatter `name` field, not its file path, so the subfolder is purely organizational:
  - `engineering/` (30 agents) — architecture, backend/frontend, devops, data engineering, and several narrow domain specialists (e.g. `feishu-integration-developer`, `wechat-mini-program-developer`, `solidity-smart-contract-engineer`).
  - `testing/` (8 agents) — QA-focused roles (accessibility, API testing, performance, evidence collection, etc.).
- `.claude/skills/frappe-*/` — the `lubusIN/frappe-skills` library (see [Skills](#skills) below).
- `skills-lock.json` — manifest written by the `skills` CLI, tracking each installed skill's upstream source and content hash.
- `package.json`, `.markdownlint-cli2.jsonc`, `scripts/` — the lint suite (see [Linting & CI](#linting--ci)).
- `.github/workflows/` — CI (see [Linting & CI](#linting--ci)).

## Subagent file format

Each file in `.claude/agents/` is a standard Claude Code subagent definition:

```yaml
---
name: <Display Name>
description: <when/why this agent should be invoked>
color: <ui color>
emoji: <ui emoji>
vibe: <one-line personality summary>
---
```

followed by a Markdown body with a consistent section pattern: Identity & Memory, Core Mission, Critical Rules, Deliverables (often with example code/config blocks), Communication Style, Learning & Memory, Success Metrics, and Advanced Capabilities. When adding or editing an agent, match this existing section structure and frontmatter shape rather than inventing a new format, and place it under the matching `engineering/` or `testing/` subfolder (or a new division subfolder if it doesn't fit either).

## Skills

`.claude/skills/` holds the [lubusIN/frappe-skills](https://github.com/lubusIN/frappe-skills) library — 14 Agent Skills (`SKILL.md` + optional `references/`) giving Claude Code up-to-date, procedural knowledge of the Frappe framework, installed via the [`skills` CLI](https://github.com/vercel-labs/skills).

**Naming:** each skill directory is prefixed `frappe-` (e.g. `.claude/skills/frappe-router/`). This is deliberate, not what the CLI does by default: `.claude/skills/` is *not* recursively scanned the way `.claude/agents/` is — each skill must be a direct child of a `.claude/skills/` directory (`.claude/skills/<skill-name>/SKILL.md`), so a `frappe/` subfolder would make them invisible to Claude Code. The `frappe-` prefix keeps them flat and discoverable while namespacing them for when a non-Frappe skill source gets added later.

Requirement (source of truth for reinstall/CI):
```
npx skills add lubusIN/frappe-skills -a claude-code -y
```
Run from the repo root. The `skills` CLI has no project manifest of its own — `skills-lock.json` only records provenance/hashes, not install destinations — so this command, not a lockfile, is the recorded requirement. The CLI installs each skill under its *unprefixed* upstream name (`.claude/skills/router/`, not `frappe-router/`).

**Tradeoff:** renaming the installed folders to add the `frappe-` prefix (and editing `skills-lock.json` keys to match) is enough for Claude Code to discover and run the skills, but the `skills` CLI itself stops recognizing the renamed folders as tracked installs — `npx skills list` shows them with `Source: local` instead of `lubusIN/frappe-skills`, so `npx skills update` won't pull upstream changes for them. To actually refresh content from upstream: rename the `frappe-*` directories back to their plain names, restore the matching `skills-lock.json` keys, run `npx skills update`, then re-apply the `frappe-` rename and lock-key edit. `npx skills list` shows what's currently installed. The CLI requires Node 18+ (this machine's default Node via nvm is v14, pinned for the separate Frappe bench in WSL — install/update commands need a newer Node, e.g. `nvm use 22`, without changing that default).

Installed skills by category (per upstream README):
- **Core**: `frappe-router` (task dispatch), `frappe-project-triage` (detect project type/version/tooling)
- **Development**: `frappe-app-development`, `frappe-doctype-development`, `frappe-api-development`
- **UI & Frontend**: `frappe-desk-customization`, `frappe-frontend-development`, `frappe-ui-patterns`, `frappe-printing-templates`, `frappe-reports`, `frappe-web-forms`
- **Testing & Infrastructure**: `frappe-testing`, `frappe-manager`
- **Best Practices**: `frappe-enterprise-patterns`

To add another skill source later, follow the same pattern: `npx skills add <owner/repo> -a claude-code -y`, apply the naming prefix if you want one, update `skills-lock.json` keys to match, then record the command here.

## How skills and agents combine

`.claude/skills/` and `.claude/agents/` are complementary, not redundant: skills carry Frappe-specific procedural knowledge (when to act, step-by-step how), while agents carry role/persona framing for delegating a task to a particular kind of specialist. In practice, start from the `frappe-router` skill to identify the right Frappe procedure, then hand the work to a matching agent (e.g. `engineering/backend-architect` for `frappe-api-development`/`frappe-doctype-development` work, `engineering/frontend-developer` for `frappe-frontend-development`/`frappe-ui-patterns`, `testing/*` agents for the `frappe-testing` skill).

## Linting & CI

Run `npm run lint` (needs `npm install` first) to check everything at once, or individually:
- `npm run lint:md` — [markdownlint-cli2](https://github.com/DavidAnson/markdownlint-cli2) over `.claude/agents/**/*.md` and `.claude/skills/**/SKILL.md`, config in `.markdownlint-cli2.jsonc`. Scoped down from the default ruleset (which fires ~1000 style findings against this repo's prose-heavy, pre-existing agent/skill content) to structural checks only: trailing whitespace, tabs, missing final newline, malformed tables.
- `npm run lint:frontmatter` — `scripts/validate-frontmatter.mjs` confirms every agent file has `name` + `description` frontmatter, and every `SKILL.md` has `description`.
- `npm run lint:json` — `scripts/lint-json.mjs` confirms every tracked `.json` file parses.

`.github/workflows/lint.yml` runs `npm run lint` on push/PR. `.github/workflows/claude.yml` wires up `anthropics/claude-code-action` to respond to `@claude` mentions in issues/PR comments, with this repo's full agent and skill roster available to it; it requires an `ANTHROPIC_API_KEY` repository secret to be added manually (Settings → Secrets and variables → Actions).

## Working in this repo

Changes here are Markdown/JSON config edits, not application code. When adding new agents, keep the existing naming convention and place the file under the matching `.claude/agents/<division>/` subfolder. When adding new skills, install them via the `skills` CLI as above rather than hand-copying files, so `.claude/skills/` stays traceable to an upstream source. Run `npm run lint` before committing.

<!-- rtk-instructions v2 -->
# RTK (Rust Token Killer) - Token-Optimized Commands

## Golden Rule

**Always prefix commands with `rtk`**. If RTK has a dedicated filter, it uses it. If not, it passes through unchanged. This means RTK is always safe to use.

**Important**: Even in command chains with `&&`, use `rtk`:
```bash
# ❌ Wrong
git add . && git commit -m "msg" && git push

# ✅ Correct
rtk git add . && rtk git commit -m "msg" && rtk git push
```

## RTK Commands by Workflow

### Build & Compile (80-90% savings)
```bash
rtk cargo build         # Cargo build output
rtk cargo check         # Cargo check output
rtk cargo clippy        # Clippy warnings grouped by file (80%)
rtk tsc                 # TypeScript errors grouped by file/code (83%)
rtk lint                # ESLint/Biome violations grouped (84%)
rtk prettier --check    # Files needing format only (70%)
rtk next build          # Next.js build with route metrics (87%)
```

### Test (60-99% savings)
```bash
rtk cargo test          # Cargo test failures only (90%)
rtk go test             # Go test failures only (90%)
rtk jest                # Jest failures only (99.5%)
rtk vitest              # Vitest failures only (99.5%)
rtk playwright test     # Playwright failures only (94%)
rtk pytest              # Python test failures only (90%)
rtk rake test           # Ruby test failures only (90%)
rtk rspec               # RSpec test failures only (60%)
rtk test <cmd>          # Generic test wrapper - failures only
```

### Git (59-80% savings)
```bash
rtk git status          # Compact status
rtk git log             # Compact log (works with all git flags)
rtk git diff            # Compact diff (80%)
rtk git show            # Compact show (80%)
rtk git add             # Ultra-compact confirmations (59%)
rtk git commit          # Ultra-compact confirmations (59%)
rtk git push            # Ultra-compact confirmations
rtk git pull            # Ultra-compact confirmations
rtk git branch          # Compact branch list
rtk git fetch           # Compact fetch
rtk git stash           # Compact stash
rtk git worktree        # Compact worktree
```

Note: Git passthrough works for ALL subcommands, even those not explicitly listed.

### GitHub (26-87% savings)
```bash
rtk gh pr view <num>    # Compact PR view (87%)
rtk gh pr checks        # Compact PR checks (79%)
rtk gh run list         # Compact workflow runs (82%)
rtk gh issue list       # Compact issue list (80%)
rtk gh api              # Compact API responses (26%)
```

### JavaScript/TypeScript Tooling (70-90% savings)
```bash
rtk pnpm list           # Compact dependency tree (70%)
rtk pnpm outdated       # Compact outdated packages (80%)
rtk pnpm install        # Compact install output (90%)
rtk npm run <script>    # Compact npm script output
rtk npx <cmd>           # Compact npx command output
rtk prisma              # Prisma without ASCII art (88%)
rtk uv run <cmd>        # Compact uv project command output
```

### Files & Search (60-75% savings)
```bash
rtk ls <path>           # Tree format, compact (65%)
rtk read <file>         # Code reading with filtering (60%)
rtk grep <pattern>      # Search grouped by file (75%). Format flags (-c, -l, -L, -o, -Z) run raw.
rtk find <pattern>      # Find grouped by directory (70%)
```

### Analysis & Debug (70-90% savings)
```bash
rtk err <cmd>           # Filter errors only from any command
rtk log <file>          # Deduplicated logs with counts
rtk json <file>         # JSON structure without values
rtk deps                # Dependency overview
rtk env                 # Environment variables compact
rtk summary <cmd>       # Smart summary of command output
rtk diff                # Ultra-compact diffs
```

### Infrastructure (85% savings)
```bash
rtk docker ps           # Compact container list
rtk docker images       # Compact image list
rtk docker logs <c>     # Deduplicated logs
rtk kubectl get         # Compact resource list
rtk kubectl logs        # Deduplicated pod logs
```

### Network (65-70% savings)
```bash
rtk curl <url>          # Compact HTTP responses (70%)
rtk wget <url>          # Compact download output (65%)
```

### Meta Commands
```bash
rtk gain                # View token savings statistics
rtk gain --history      # View command history with savings
rtk discover            # Analyze Claude Code sessions for missed RTK usage
rtk proxy <cmd>         # Run command without filtering (for debugging)
rtk init                # Add RTK instructions to CLAUDE.md
rtk init --global       # Add RTK to ~/.claude/CLAUDE.md
```

## Token Savings Overview

| Category | Commands | Typical Savings |
|----------|----------|-----------------|
| Tests | vitest, playwright, cargo test | 90-99% |
| Build | next, tsc, lint, prettier | 70-87% |
| Git | status, log, diff, add, commit | 59-80% |
| GitHub | gh pr, gh run, gh issue | 26-87% |
| Package Managers | pnpm, npm, npx | 70-90% |
| Files | ls, read, grep, find | 60-75% |
| Infrastructure | docker, kubectl | 85% |
| Network | curl, wget | 65-70% |

Overall average: **60-90% token reduction** on common development operations.
<!-- /rtk-instructions -->