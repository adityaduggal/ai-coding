# Token savings

Rules aimed at keeping AI-coding sessions cheap without losing correctness.

## Reading

- Read only the file ranges you need; avoid re-reading files you just wrote
  or edited (the tool result already confirms the change).
- Prefer targeted `Grep`/search over dumping whole directories into context.
- Don't re-read a file just to "confirm" an Edit/Write succeeded — a
  successful tool call already guarantees the change happened.
- For large or unfamiliar codebases, search/grep for the specific symbol or
  string first, then read only the surrounding lines — not the whole file.

## Delegation

- Delegate large, throwaway exploration (broad searches, multi-file surveys,
  research that produces a lot of raw output you won't need again) to a
  subagent/fork so the raw output doesn't sit in the main context.
- Bring back a synthesized answer from delegated work, not the raw transcript.

## Working memory

- Summarize findings before acting on them instead of carrying full tool
  output forward turn after turn.
- Don't restate context that's already in the conversation (recent file
  contents, prior command output) — refer to it instead of re-fetching it.
- Avoid speculative re-verification of things the harness already guarantees.

## Output

- Keep responses proportional to the task: a one-line question gets a
  one-line answer, not a report.
- Don't narrate every intermediate step; state results and decisions, not
  a running commentary.
- Avoid restating the user's request back to them before answering it.

## Tool calls

- Batch independent tool calls in parallel rather than issuing them one at a
  time across multiple turns.
- Use the narrowest tool for the job (e.g. `Grep` for a symbol lookup, not a
  full-file `Read`, not a subagent).
