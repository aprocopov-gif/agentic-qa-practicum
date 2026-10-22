# Agent scoring

`evals/<agent>/answer-key.json` holds cases `{ id, input, expected }` (`drift` | `bug` | `ambiguous`); the human fills it and agents never read it.
Each pass writes `evals/<agent>/runs/<YYYY-MM-DD>-<n>.json` with `model`, `startedAt`, `finishedAt`, and `predictions` (`id`, `predicted`, `evidence`).
`npx tsx evals/score.ts <agent>` reads the key and every run, then prints per-class precision and recall, overall accuracy, false positives per class, and cross-run agreement.
The command exits non-zero if a run cites an `id` that is not in the key.
The `score-agent` skill runs the agent once per case (N times, default 3), writes one run file each time, scores, and appends a dated Agent accuracy section to `eval-report.md`.
