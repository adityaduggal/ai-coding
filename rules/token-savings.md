# Token savings

Rules aimed at keeping AI-coding sessions cheap without losing correctness.

- Read only the file ranges you need; avoid re-reading files you just wrote
  or edited (the tool result already confirms the change).
- Prefer targeted `Grep`/search over dumping whole directories into context.
- Delegate large, throwaway exploration (broad searches, multi-file surveys)
  to a subagent/fork so the raw output doesn't sit in the main context.
- Summarize findings before acting on them instead of carrying full tool
  output forward turn after turn.
- Avoid speculative re-verification of things the harness already guarantees
  (e.g. a successful Edit/Write means the file changed — don't re-read to check).
