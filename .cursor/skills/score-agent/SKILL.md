---
name: score-agent
description: Scores an agent against an answer key and appends the result to eval-report.md. Use when the user asks how accurate an agent is, wants to score triage, self-heal, or test generation, or after cases are added to an evals/*/answer-key.json.
---

# Score agent

## Steps

1. Run the agent once per case without showing it the answer key; write one run file to `evals/<agent>/runs/<YYYY-MM-DD>-<n>.json`; repeat N times (default 3).
2. Run `npx tsx evals/score.ts <agent>`.
3. Append a dated "Agent accuracy" section to `eval-report.md` with the numbers and how they were measured.

## Rule

The agent under test never reads `answer-key.json` during a run.
