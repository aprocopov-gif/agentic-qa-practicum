#!/usr/bin/env npx tsx
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';

const REPO_ROOT = path.resolve(__dirname, '..');
const CLASSES = ['drift', 'bug', 'ambiguous'] as const;

type AgentClass = (typeof CLASSES)[number];

interface AnswerKeyCase {
  id: string;
  input: unknown;
  expected: AgentClass;
}

interface Prediction {
  id: string;
  predicted: AgentClass;
  evidence: string;
}

interface RunFile {
  model: string;
  startedAt: string;
  finishedAt: string;
  predictions: Prediction[];
}

interface ClassCounts {
  truePositives: number;
  falsePositives: number;
  falseNegatives: number;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isAgentClass(value: unknown): value is AgentClass {
  return value === 'drift' || value === 'bug' || value === 'ambiguous';
}

function emptyCounts(): Record<AgentClass, ClassCounts> {
  return {
    drift: { truePositives: 0, falsePositives: 0, falseNegatives: 0 },
    bug: { truePositives: 0, falsePositives: 0, falseNegatives: 0 },
    ambiguous: { truePositives: 0, falsePositives: 0, falseNegatives: 0 },
  };
}

function parseAgent(argv: string[]): string {
  const agent = argv[0];
  if (!agent || agent.startsWith('-')) {
    throw new Error('Usage: npx tsx evals/score.ts <agent>');
  }
  return agent;
}

function loadAnswerKey(agentDir: string): AnswerKeyCase[] {
  const keyPath = path.join(agentDir, 'answer-key.json');
  if (!existsSync(keyPath)) {
    throw new Error(`Missing answer key: ${path.relative(REPO_ROOT, keyPath)}`);
  }

  const raw: unknown = JSON.parse(readFileSync(keyPath, 'utf8'));
  if (!Array.isArray(raw)) {
    throw new Error(`Answer key must be an array: ${path.relative(REPO_ROOT, keyPath)}`);
  }

  return raw.map((entry, index) => {
    if (!isRecord(entry)) {
      throw new Error(`Answer key case ${index} must be an object`);
    }
    if (typeof entry.id !== 'string' || entry.id.length === 0) {
      throw new Error(`Answer key case ${index} is missing id`);
    }
    if (!isAgentClass(entry.expected)) {
      throw new Error(`Answer key case ${entry.id} has invalid expected: ${String(entry.expected)}`);
    }
    return {
      id: entry.id,
      input: entry.input,
      expected: entry.expected,
    };
  });
}

function parsePrediction(entry: unknown, runLabel: string, index: number): Prediction {
  if (!isRecord(entry)) {
    throw new Error(`${runLabel} prediction ${index} must be an object`);
  }
  if (typeof entry.id !== 'string' || entry.id.length === 0) {
    throw new Error(`${runLabel} prediction ${index} is missing id`);
  }
  if (!isAgentClass(entry.predicted)) {
    throw new Error(`${runLabel} prediction ${entry.id} has invalid predicted: ${String(entry.predicted)}`);
  }
  if (typeof entry.evidence !== 'string') {
    throw new Error(`${runLabel} prediction ${entry.id} is missing evidence`);
  }
  return {
    id: entry.id,
    predicted: entry.predicted,
    evidence: entry.evidence,
  };
}

function parseRunFile(filePath: string): RunFile {
  const label = path.relative(REPO_ROOT, filePath);
  const raw: unknown = JSON.parse(readFileSync(filePath, 'utf8'));
  if (!isRecord(raw)) {
    throw new Error(`Run file must be an object: ${label}`);
  }
  if (typeof raw.model !== 'string') {
    throw new Error(`${label} is missing model`);
  }
  if (typeof raw.startedAt !== 'string') {
    throw new Error(`${label} is missing startedAt`);
  }
  if (typeof raw.finishedAt !== 'string') {
    throw new Error(`${label} is missing finishedAt`);
  }
  if (!Array.isArray(raw.predictions)) {
    throw new Error(`${label} predictions must be an array`);
  }
  return {
    model: raw.model,
    startedAt: raw.startedAt,
    finishedAt: raw.finishedAt,
    predictions: raw.predictions.map((entry, index) => parsePrediction(entry, label, index)),
  };
}

function loadRuns(agentDir: string): RunFile[] {
  const runsDir = path.join(agentDir, 'runs');
  if (!existsSync(runsDir)) {
    return [];
  }

  const names = readdirSync(runsDir)
    .filter((name) => name.endsWith('.json'))
    .sort();

  return names.map((name) => parseRunFile(path.join(runsDir, name)));
}

function unknownIds(key: AnswerKeyCase[], runs: RunFile[]): string[] {
  const known = new Set(key.map((entry) => entry.id));
  const missing = new Set<string>();
  for (const run of runs) {
    for (const prediction of run.predictions) {
      if (!known.has(prediction.id)) {
        missing.add(prediction.id);
      }
    }
  }
  return [...missing].sort();
}

function formatRatio(numerator: number, denominator: number): string {
  if (denominator === 0) {
    return 'n/a';
  }
  return (numerator / denominator).toFixed(3);
}

function score(key: AnswerKeyCase[], runs: RunFile[]): void {
  const expectedById = new Map(key.map((entry) => [entry.id, entry.expected]));
  const counts = emptyCounts();
  let correct = 0;
  let scored = 0;

  for (const run of runs) {
    for (const prediction of run.predictions) {
      const expected = expectedById.get(prediction.id);
      if (!expected) {
        continue;
      }
      scored += 1;
      if (prediction.predicted === expected) {
        correct += 1;
        counts[expected].truePositives += 1;
      } else {
        counts[prediction.predicted].falsePositives += 1;
        counts[expected].falseNegatives += 1;
      }
    }
  }

  const predictionsByCase = new Map<string, AgentClass[]>();
  for (const entry of key) {
    predictionsByCase.set(entry.id, []);
  }
  for (const run of runs) {
    const byId = new Map(run.predictions.map((prediction) => [prediction.id, prediction.predicted]));
    for (const entry of key) {
      const predicted = byId.get(entry.id);
      const collected = predictionsByCase.get(entry.id);
      if (predicted && collected) {
        collected.push(predicted);
      }
    }
  }

  let agreed = 0;
  for (const entry of key) {
    const predicted = predictionsByCase.get(entry.id) ?? [];
    if (predicted.length === runs.length && runs.length > 0 && predicted.every((label) => label === predicted[0])) {
      agreed += 1;
    }
  }

  process.stdout.write(`cases      ${key.length}\n`);
  process.stdout.write(`runs       ${runs.length}\n`);
  process.stdout.write('\n');
  process.stdout.write('class        precision  recall   false_positives\n');
  for (const label of CLASSES) {
    const row = counts[label];
    const precision = formatRatio(row.truePositives, row.truePositives + row.falsePositives);
    const recall = formatRatio(row.truePositives, row.truePositives + row.falseNegatives);
    process.stdout.write(
      `${label.padEnd(12)} ${precision.padEnd(10)} ${recall.padEnd(8)} ${row.falsePositives}\n`,
    );
  }
  process.stdout.write('\n');
  process.stdout.write(`accuracy   ${formatRatio(correct, scored)}\n`);
  process.stdout.write(`agreement  ${formatRatio(agreed, key.length)}\n`);
}

function main(): void {
  const agent = parseAgent(process.argv.slice(2));
  const agentDir = path.join(REPO_ROOT, 'evals', agent);
  const key = loadAnswerKey(agentDir);
  const runs = loadRuns(agentDir);
  const extras = unknownIds(key, runs);
  if (extras.length > 0) {
    process.stderr.write(
      `Unknown prediction id(s) not in answer key: ${extras.join(', ')}\n`,
    );
    process.exitCode = 1;
    return;
  }
  score(key, runs);
}

try {
  main();
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  process.stderr.write(`${message}\n`);
  process.exitCode = 1;
}
