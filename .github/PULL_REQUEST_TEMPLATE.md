## Summary

<!-- What does this PR change, and why? -->

## Type of change

- [ ] New agent(s)
- [ ] New skill(s)
- [ ] Edit to existing agent/skill
- [ ] Lint suite / CI / tooling change
- [ ] Documentation only

## Checklist

- [ ] `npm run lint` passes locally
- [ ] New/edited agents live under `.claude/agents/engineering/` or
      `.claude/agents/testing/` (or a clearly-named new division folder),
      and their frontmatter (`name`, `description`) is filled in
- [ ] New/edited agents follow the existing section structure (Identity &
      Memory, Core Mission, Critical Rules, Deliverables, Communication
      Style, Learning & Memory, Success Metrics, Advanced Capabilities)
- [ ] New/edited skills were installed via `npx skills add <owner/repo>
      -a claude-code -y`, not hand-copied, and `skills-lock.json` is
      updated accordingly
- [ ] Commit messages follow [Conventional
      Commits](https://www.conventionalcommits.org/) (see
      [CONTRIBUTING.md](../CONTRIBUTING.md))
- [ ] No unrelated/unintended files included in the diff

## Notes for reviewer

<!-- Anything that needs manual verification, e.g. behavior only observable when Claude Code loads this agent/skill -->
