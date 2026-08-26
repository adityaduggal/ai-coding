# `adityaduggal/ai-coding` — Repo Design

**One-line goal:** a single repo you `git clone` (or add as a plugin marketplace) that gives any coding agent your standards, workflows, agents and doc-generation rules — while loading the *fewest possible tokens* into context.

---

## 1. The token model (read this first — everything else follows from it)

Four things burn context. The whole design is a countermeasure to each.

| Leak | Countermeasure in this repo |
|---|---|
| Big `CLAUDE.md` loaded every session | Hard cap **80 lines**. It contains *pointers*, never content. CI fails the build if it grows. |
| Skills loaded in full | **Progressive disclosure.** Only `name` + `description` of each SKILL.md sits in context (~30 tokens each). Body loads only when triggered. Body capped at 500 lines; anything longer moves to `references/`. |
| Exploration noise (file reads, greps, failed tests) | **Sub-agent isolation.** Recon, test runs and reviews happen in a sub-agent; only a ≤300-word summary returns to the main thread. |
| Context rot on long sessions | **Disk is the memory.** Plans, decisions and state live in `.planning/*.md`, not in the transcript. After a compaction the agent re-reads one file instead of losing everything. |
| Verbose CLI output (test logs, `git status`, `ls`, build spew) | **RTK** as a Bash-level output filter — see §1a. |

Two more rules that save more tokens than anything else:

- **Prefer a script to a paragraph.** If a step is deterministic (lint, scaffold, changelog, link-check), ship a `scripts/*.sh` and have the skill say "run `scripts/x.sh`". 20 tokens instead of 2,000, and it can't be got wrong.
- **Prefer a hook to an instruction.** A `PostToolUse` hook that auto-runs the formatter costs zero tokens forever. A CLAUDE.md line saying "always format" costs tokens every session and is obeyed ~80% of the time.

---

## 1a. RTK (Rust Token Killer) — the Bash output filter

**What it is:** a CLI proxy that filters and compresses command output before it reaches the model — a single Rust binary with zero dependencies. It installs a PreToolUse hook into Claude Code's settings so every Bash call is rewritten automatically. The idea: most CLI output sent to the LLM is noise — passing tests, verbose logs, progress bars, redundant formatting — so strip it before it hits the context window.

**Install (goes in `scripts/install.sh`):**
```bash
rtk init -g              # installs the hook + RTK.md for Claude Code
rtk init -g --auto-patch # non-interactive, for CI
rtk init --show          # verify
rtk gain                 # savings dashboard
rtk discover             # find commands you're not yet proxying
```

**Where it genuinely helps.** Reported command-level reductions: cargo test ~92%, git status ~81%, find ~78%, grep ~50%. In this repo that maps onto:
- the `test-runner` agent (long failing-test logs → the failing lines only)
- `bench` output in `frappe-skills` (extremely verbose, near-zero signal on success)
- git/`gh` output in `github-ops`
- any build or migrate step

**Set expectations honestly.** The headline "60-90%" is a measure of *bash output bytes removed*, not of your bill. Two caveats worth knowing before you promise savings to anyone:

1. The hook only covers Bash tool calls — Claude Code's built-in Read, Grep and Glob bypass it entirely, and those are where most context actually goes on real coding work.
2. An independent A/B benchmark found the real-world result well short of the pitch: measured on real agent work it came out 7.6% *more* expensive at low reasoning effort (p=0.004) and ±0% at high effort, with task quality unchanged. The counterfactual is inflated because RTK counts full raw output as the baseline even though Claude Code truncates huge tool results anyway, and it estimates tokens as chars÷4 while most session cost is cached re-reads billed at a tenth of the price.

**Verdict for this repo:** install it, but treat it as *one* lever, not the strategy. The structural moves in §1 (progressive disclosure, sub-agent isolation, disk-as-memory) are worth an order of magnitude more. RTK's real value here is that `rtk gain --format json` gives you a measurement surface — wire it into `/budget` and let your own numbers, not the README's, decide whether it stays.

**Design rule:** never let a skill instruct the agent to type `rtk ...`. The PreToolUse hook rewrites commands transparently at zero token cost; writing `rtk` into prose costs tokens every session and breaks for anyone who hasn't installed it.

---

## 2. Repo structure

```
ai-coding/
├── README.md                       # what this is, 60-second install
├── CLAUDE.md                       # ≤80 lines, pointers only
├── .claude-plugin/
│   └── marketplace.json            # makes the repo installable: /plugin marketplace add adityaduggal/ai-coding
│
├── plugins/
│   ├── core-workflow/              # plan → build → verify → ship
│   │   ├── .claude-plugin/plugin.json
│   │   ├── skills/
│   │   │   ├── ROUTER.md           # thin intent→skill index (the only always-on skill)
│   │   │   ├── planning/SKILL.md
│   │   │   ├── tdd/SKILL.md
│   │   │   ├── verify-before-claim/SKILL.md
│   │   │   ├── debugging/SKILL.md
│   │   │   └── context-budget/SKILL.md
│   │   ├── agents/                 # sub-agent definitions (see §4)
│   │   ├── commands/               # slash commands (see §5)
│   │   └── hooks/hooks.json
│   │
│   ├── docs-engine/                # document generation + link graph
│   │   ├── skills/
│   │   │   ├── doc-authoring/SKILL.md
│   │   │   ├── doc-linking/SKILL.md
│   │   │   └── diataxis/SKILL.md
│   │   ├── templates/              # front-matter templates per doc type
│   │   └── scripts/
│   │       ├── new-doc.py          # scaffolds a doc with valid front-matter + id
│   │       ├── link-graph.py       # builds backlinks, writes docs/_index.json
│   │       └── link-lint.py        # CI gate: no orphans, no broken links
│   │
│   └── github-ops/                 # issues, branches, commits, PRs, releases
│       ├── skills/
│       │   ├── conventional-commits/SKILL.md
│       │   ├── branch-and-issue/SKILL.md
│       │   └── pr-review/SKILL.md
│       └── scripts/gh-*.sh
│
├── standards/                      # ← SINGLE SOURCE OF TRUTH, consumed by other repos
│   ├── CODING-STANDARDS.md
│   ├── GIT-STANDARDS.md
│   ├── DOC-STANDARDS.md
│   └── VERSION                     # bumped on any standards change
│
├── docs/
│   ├── user/                       # for people who install this
│   │   ├── quickstart.md
│   │   ├── commands.md
│   │   ├── recipes.md
│   │   └── faq.md
│   └── developer/                  # for people who extend this
│       ├── architecture.md
│       ├── writing-a-skill.md
│       ├── writing-an-agent.md
│       ├── token-budget.md
│       └── adr/0001-*.md
│
├── scripts/
│   ├── install.sh
│   ├── skill-lint.py               # frontmatter valid, ≤500 lines, description quality
│   └── token-report.py             # prints always-on token cost of the repo
│
└── .github/
    ├── ISSUE_TEMPLATE/{bug,feature,skill-request}.yml
    ├── pull_request_template.md
    └── workflows/{ci,docs,release}.yml
```

### Why `standards/` is separate from `plugins/`
`frappe-skills` (and every future repo) points at `standards/` by URL + pinned commit. Skills change often; standards change rarely. Keeping them apart means downstream repos don't re-vendor a whole plugin to pick up a one-line rule change.

---

## 3. What to reuse instead of building

Don't write from scratch what already exists. Vendor as **git submodules pinned to a tag**, never copy-paste (copies rot silently).

| Need | Use | Note |
|---|---|---|
| Core methodology (TDD, debugging, brainstorm→plan→execute, verify-before-claim) | `obra/superpowers` — a skills framework and software development methodology, with a `/brainstorm`, `/write-plan`, `/execute-plan` command set and a skills-search tool | The single highest-value dependency. Install first, build only what it lacks. |
| Opinionated review/ship gates | `garrytan/gstack` — CEO/eng plan review, `/review`, `/qa`, `/ship`, `/retro`. `Ahacad/gstack` wraps it as a proper Claude Code plugin instead of manual symlinks | Take the *gates*, skip the browser tooling unless you need it. |
| Plugin authoring reference | `obra/superpowers-developing-for-claude-code` — plugin dev workflows plus a bundled set of official-docs reference files | Saves you re-deriving the manifest format. |
| Git/GitHub workflow skills | `fvadicamo/dev-agent-skills` — Conventional Commits, PR creation/validation, merge checklist, review-comment handling | Good starting point for `github-ops`. |
| Session memory across compactions | `obra/episodic-memory` — semantic search over past Claude Code conversations | Optional; helps most on multi-week projects. |
| **Spec-driven phase workflow / context-rot defence** | **GSD (Get Shit Done)** — `gsd-build/get-shit-done`, or `jnuyens/gsd-plugin` for a proper plugin packaging | See §3a. This becomes your planning layer. |
| Bash output compression | `rtk-ai/rtk` | See §1a. Install, but measure before believing. |

### 3a. GSD — the planning layer

GSD is the piece that does what §1's "disk is the memory" rule describes, already built. It's a meta-prompting, context-engineering and spec-driven development system that attacks context rot with structured workflows, parallel subagents, XML-formatted plans, atomic git commits, and a fresh context window per task — a discuss → plan → execute → verify loop per phase, with multi-agent orchestration for research, planning, execution and verification. Two non-obvious parts worth stealing even if you don't install it: the discuss phase that locks product decisions before planning begins, and a validation layer that checks you have a working test feedback loop before any code is written.

The plugin packaging is the more relevant one operationally: `jnuyens/gsd-plugin` ships slash commands, agent definitions, workflow bodies that skills delegate to by path, an MCP server exposing project state as queryable resources, and — most valuable — auto-resume across `/compact`: a PreCompact hook writes `.planning/HANDOFF.json` and the next SessionStart resumes at the same phase, plan and task with no manual intervention.

**Decisions this forces on your design:**
- **Drop your custom `/plan` and `/build`.** Use `/gsd:new-project`, `/gsd:plan-phase`, `/gsd:execute-phase`. Wrap them in thin aliases if you want your own namespace, but don't reimplement.
- **`.planning/` becomes GSD's directory, not yours.** Your `docs-engine` reads from it (specs → docs) but never writes to it.
- **Keep your own `/review`, `/ship`, `/doc`, `/retro`.** GSD covers plan/execute/verify; gstack's gates and your doc engine sit on either side of it.
- **Watch for install collisions.** There are several forks and renames in circulation (get-shit-done-cc, get-shit-done-redux, buildomator), and a globally installed `gsd-sdk` binary on `$PATH` can shadow a plugin's bundled wrapper and make workflows silently degrade. Pin one distribution in `install.sh` and document it; don't let team members mix.
- **Budget it.** GSD is large — 82 slash commands and 33 agent definitions in the plugin packaging. Run `/budget` before and after installing and record the delta. If the always-on cost blows your 5k ceiling, install a trimmed subset rather than the full set.

**Resulting stack — GSD and gstack are chained, not duplicated.** They overlap only in name ("plan", "review"); the actual jobs differ, so split responsibilities instead of running both in full:

| Layer | Owns | Don't duplicate |
|---|---|---|
| **GSD** | Phase state machine: discuss → plan → execute → verify. Fresh context per task, atomic commits, PreCompact auto-resume. | Don't also run gstack's `/plan-ceo-review` + `/plan-eng-review` as a separate full planning pass — same job twice. |
| **gstack** | The taste/quality gates GSD doesn't have: CEO/design/eng review of a plan, `/qa` (real browser testing), `/ship`, `/retro`. | Don't let it re-plan from scratch — point it at the plan file GSD already wrote. |

Chain, don't parallel-run:

```
/gsd:plan-phase      → writes .planning/phase-N-plan.md
/plan-eng-review     → gstack reviews that one file (cheap: reads a plan, not the repo)
/gsd:execute-phase   → does the work, fresh context, atomic commits
/review              → gstack code review of the diff
/qa                  → gstack browser verification
/ship                → gstack changelog + release
```

**Token cost of gstack is unmeasured — don't assume it.** Unlike RTK, there's no independent benchmark of gstack's context cost available. Structurally it depends on whether its review gates (`/plan-ceo-review`, `/plan-eng-review`, `/review`, `/qa`) run as sub-agents (fresh context, isolated cost — cheap) or inline in the main thread (each one re-reads the diff/codebase into the running conversation — expensive, and it compounds over a session). Check this empirically before committing to the full gate sequence on every phase: run `/budget` before and after adding gstack, over a week of real use, chained as above. If one specific gate turns out to be the expensive one, swap just that command for a GSD-native equivalent rather than dropping gstack entirely.

Full stack: GSD for plan/execute/verify → superpowers for engineering discipline (TDD, verify-before-claim, debugging) → gstack for review/ship gates, chained onto GSD's plan file rather than re-planning → your `docs-engine` + `github-ops` → RTK underneath filtering all Bash output.

**Warning on mega-bundles:** repos advertising 300+ skills look attractive and are the single worst thing you can do to your token budget — every description is always-on. Install narrow plugins, not catalogues.

---

## 4. Agents (sub-agents = your main token lever)

Each agent runs in its own context window. The main thread pays only for the summary. Define them in `plugins/core-workflow/agents/*.md`.

| Agent | Model | Tools | Returns to main thread |
|---|---|---|---|
| `scout` | haiku | Read, Grep, Glob (read-only) | ≤300-word repo map: relevant files, entry points, existing patterns. Replaces 30 exploratory reads. |
| `planner` | opus | Read, Write(`.planning/`) | Path to `.planning/NNN-plan.md`. Nothing else. |
| `implementer` | sonnet | Read, Edit, Write, Bash | Diff summary + tests-passing evidence. |
| `reviewer` | opus | Read, Grep, Bash(read-only) | Findings list, severity-ranked. Runs adversarially — its job is to find the bug, not approve. |
| `test-runner` | haiku | Bash | Pass/fail + only the failing output. Never the full log. |
| `doc-writer` | sonnet | Read, Write(`docs/`), Bash | Files written + link-lint result. |

Rules baked into every agent file:
1. **Read-only unless it needs to write.** Cheaper and safer.
2. **Cheapest model that can do the job.** `scout` and `test-runner` on Haiku cuts real cost noticeably.
3. **Output contract stated in the agent prompt** ("return at most N words, in this shape"). Without this, sub-agents dump their whole context back and you've saved nothing.

---

## 5. Commands (the workflow)

Own only what GSD and gstack don't already provide, and chain rather than duplicate — see §3a for why `/plan-eng-review` and `/gsd:plan-phase` are not doing the same job.

```
# planning + execution — GSD, do not reimplement
/gsd:new-project   /gsd:plan-phase   /gsd:execute-phase   /gsd:resume-work

# gates — gstack, chained onto the GSD plan/diff, not re-planning from scratch
/plan-eng-review   /review   /qa   /ship

# yours
/scout        → dispatch scout agent, write .planning/context.md
/doc          → generate/update docs + rebuild link graph
/retro        → append lessons to .planning/lessons.md → promote to a skill if recurring
/budget       → scripts/token-report.py + `rtk gain --format json`, one combined report
```

The loop that matters: **plan on disk (GSD) → gate the plan (gstack) → small step → commit → gate the diff (gstack) → next**. A crashed or compacted session resumes from the plan file at near-zero cost — GSD's PreCompact handoff automates this.

---

## 6. Hooks (free enforcement)

`plugins/core-workflow/hooks/hooks.json`:

- **SessionStart** — inject ≤150 tokens: current branch, uncommitted-file count, and `.planning/` active plan path. Not the plan itself.
- **PreToolUse (Bash)** — block destructive commands (`rm -rf`, force-push to main, `bench --force`).
- **PreToolUse (Write|Edit)** — block writes to `main`-protected paths and to any vendored submodule.
- **PostToolUse (Write|Edit)** — auto-run formatter + linter. Silent on success, so it costs nothing.
- **Stop** — run `skill-lint.py` and `link-lint.py`; if either fails, the agent gets one line telling it what to fix.

**Ordering matters.** RTK installs its own PreToolUse(Bash) hook that rewrites commands. Your destructive-command guard must run *before* it, or you'll be pattern-matching against a rewritten string and your `rm -rf` block will silently stop working. Register the guard first in `settings.json` and add a test for it. Similarly, GSD registers PreCompact and SessionStart hooks — keep your SessionStart injection under 150 tokens so the two together don't blow the budget.

---

## 7. Document generation: linking and backlinking rules

Every generated doc carries YAML front-matter. This is what makes the graph machine-checkable rather than aspirational.

```yaml
---
id: DOC-0042                  # immutable, assigned by new-doc.py, never reused
title: Sales Invoice Hooks
type: reference               # tutorial | how-to | reference | explanation | adr | spec
status: draft                 # draft | active | deprecated | superseded
owner: adityaduggal
source_of_truth: code         # code | human | external — resolves conflicts
links:
  implements: [SPEC-0007]
  depends_on: [DOC-0011]
  see_also: [DOC-0031]
supersedes: []
updated: 2026-08-23
---
```

**Rules:**
1. **Forward links are authored; backlinks are generated.** You never hand-write "referenced by". `link-graph.py` derives them into `docs/_index.json` and appends a `## Referenced by` block. Hand-written backlinks always drift.
2. **Typed edges only.** `implements`, `depends_on`, `supersedes`, `see_also`. An untyped link is a CI failure — typed edges let the agent traverse *just* the relevant subgraph instead of reading the docs folder.
3. **No orphans.** Every doc except the four Diátaxis roots must have ≥1 inbound edge. CI fails otherwise.
4. **One concept, one doc.** Duplication is what makes an agent read five files to answer one question.
5. **Deprecation is a link, not a delete.** `status: superseded` + `supersedes` preserves the trail.
6. **Docs are diffed against code in CI.** If a doc's `depends_on` file changed and the doc didn't, open an auto-issue labelled `docs-drift`.
7. **Agent reads the index, not the docs.** `docs/_index.json` is a ~2KB map of id/title/type/edges. The agent greps that, then opens the one or two files it needs. This is the single biggest doc-side token saving.

Structure `docs/` by **Diátaxis** (tutorial / how-to / reference / explanation) — it gives the agent an unambiguous rule for where a new doc goes, which stops it inventing folders.

---

## 8. GitHub automation rules

**Branches:** `<type>/<issue#>-<kebab-slug>` → `feat/142-sales-invoice-hook`. Types: `feat, fix, docs, refactor, test, chore, ci`.

**Commits:** Conventional Commits, one logical change each.
`feat(sales): add validate hook for invoice discount (#142)`
Body answers *why*, never *what* — the diff already says what.

**Issues:** three templates (`bug`, `feature`, `skill-request`). Every issue gets `type:*`, `area:*`, `size:*` labels. The `skill-request` template is the intake for "the agent got this wrong repeatedly" → becomes a new skill.

**PRs:** template requires linked issue, test evidence, doc-impact checkbox. Squash-merge only; PR title is the changelog line.

**Releases:** semantic-release from commit types. `standards/VERSION` bumps independently and triggers a notification issue in `frappe-skills`.

**CI (`.github/workflows/ci.yml`):**
```
skill-lint      → frontmatter valid, SKILL.md ≤500 lines, description has explicit triggers
token-report    → fail if always-on context > 5,000 tokens
link-lint       → no orphans, no broken/untyped links
docs-drift      → open issue if code changed without doc update
markdownlint + shellcheck
```

---

## 9. Implementation steps

**Phase 0 — baseline (½ day).** Install `superpowers`, GSD and gstack in your existing environment, plus `rtk init -g`, and use them for a week *before* writing anything — chained as in §3a (GSD plans, gstack gates the plan/diff, never both re-planning). Record the always-on token cost, a `rtk gain` reading, and a manual before/after count around each gstack gate at the start. You'll discover which 20% you actually need, and skip building the other 80%.

**Phase 1 — skeleton (1 day).** Create the repo, `marketplace.json`, `plugins/core-workflow` with an empty skills dir, `CLAUDE.md` at ≤80 lines, `scripts/skill-lint.py`, CI green.

**Phase 2 — standards (1 day).** Write `standards/*.md`. These are prose you write once by hand; don't generate them. They're the contract everything downstream cites.

**Phase 3 — agents + hooks (1-2 days).** Add the six agents with explicit output contracts. Add hooks. Measure: run `/budget` and record the always-on token cost as your baseline.

**Phase 4 — docs-engine (2 days).** `new-doc.py`, `link-graph.py`, `link-lint.py`, templates, then generate `docs/user/` and `docs/developer/` *using the engine itself* — dogfooding surfaces the rule gaps immediately.

**Phase 5 — github-ops (1 day).** Templates, workflows, semantic-release.

**Phase 6 — harden (ongoing).** Every `/retro` lesson that recurs three times becomes a skill. Every skill that stops being triggered gets deleted. Prune quarterly — an unused skill is pure tax.

**Definition of done for v1.0:** a fresh machine runs one install command, opens an agent in an empty project, types `/plan`, and gets a plan file on disk that follows your standards — with under 5k tokens of always-on context.

---

## 10. Measure it

Add `docs/developer/token-budget.md` with a table you update each release:

| Component | Always-on tokens | Budget |
|---|---|---|
| CLAUDE.md | ? | 1,000 |
| Skill descriptions (× N) | ? | 2,500 |
| SessionStart hook | ? | 150 |
| Agent descriptions | ? | 800 |
| GSD commands + agents | ? | 1,500 |
| **Total** | ? | **5,000** |

Track output-side savings separately, since they're a different quantity and shouldn't be added to the table above:

| Metric | Source | Note |
|---|---|---|
| Bash bytes filtered | `rtk gain --format json` | RTK's own estimate; treat as directional |
| gstack gate cost (in-thread vs sub-agent) | manual: token count before/after each of `/plan-eng-review`, `/review`, `/qa`, `/ship` for one week | no independent benchmark exists; measure your own setup before trusting the gates by default |
| Actual session cost | your API/plan usage | the only number that settles the argument |

If you don't measure this, it will be 40k within three months. Every repo in this space ends up there by default.
