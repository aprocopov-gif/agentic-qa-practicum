#!/usr/bin/env npx tsx
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import {
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from 'node:fs';
import path from 'node:path';

const REPO_ROOT = path.resolve(__dirname, '..');
const RUBRIC_PATH = path.join(REPO_ROOT, 'config', 'evidence-rubric.json');
const GIT_HEAD_PATHS = new Set(['tests/', 'pages/', 'features/']);

const FORBIDDEN_EVIDENCE_KEYS = new Set(['score', 'confidence', 'weight']);

type Side = 'drift' | 'bug';
type Decision = 'act' | 'escalate' | 'inconclusive';

interface RubricRequired {
  id: string;
  kind: string;
  requiredWhenSide?: Side;
}

interface RubricWeighted {
  id: string;
  kind: string;
  side: Side | null;
  weight: number;
  oracle?: boolean;
}

interface Rubric {
  required: RubricRequired[];
  weighted: RubricWeighted[];
  thresholds: {
    act: number;
    escalate: number;
    actRequiresOracleOnSide: boolean;
  };
}

interface EvidenceTest {
  file: string;
  title: string;
}

interface EvidenceItem {
  id: string;
  kind?: string;
  artifact?: string;
  line?: number;
  excerpt?: string;
}

interface EvidenceFile {
  test: EvidenceTest;
  items: EvidenceItem[];
}

interface ScoreResult {
  decisionId: string;
  decision: Decision;
  side: Side | null;
  score: number;
  oracle: boolean;
  verified: string[];
  missing: string[];
  contradictions: string[];
  rule: string;
  allowedActions: string[];
}

interface CliOptions {
  evidencePath: string;
  verifyOnly: boolean;
  rootDir: string;
}

function parseArgs(argv: string[]): CliOptions {
  const positional: string[] = [];
  let verifyOnly = false;
  let rootDir = REPO_ROOT;

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--verify-only') {
      verifyOnly = true;
    } else if (arg === '--root') {
      const next = argv[i + 1];
      if (!next) {
        throw new Error('--root requires a directory path');
      }
      rootDir = path.resolve(next);
      i += 1;
    } else if (arg.startsWith('-')) {
      throw new Error(`Unknown flag: ${arg}`);
    } else {
      positional.push(arg);
    }
  }

  const evidencePath = positional[0];
  if (!evidencePath) {
    throw new Error('Usage: npx tsx scripts/score-evidence.ts <evidence.json> [--verify-only] [--root <dir>]');
  }

  return {
    evidencePath: path.resolve(evidencePath),
    verifyOnly,
    rootDir,
  };
}

function loadRubric(): Rubric {
  const raw = readFileSync(RUBRIC_PATH, 'utf8');
  return JSON.parse(raw) as Rubric;
}

function decisionIdFromEvidenceFile(evidencePath: string): string {
  const bytes = readFileSync(evidencePath);
  return createHash('sha256').update(bytes).digest('hex').slice(0, 12);
}

function hasForbiddenScoreFields(value: unknown): boolean {
  if (value === null || typeof value !== 'object') {
    return false;
  }
  if (Array.isArray(value)) {
    return value.some((entry) => hasForbiddenScoreFields(entry));
  }
  for (const [key, nested] of Object.entries(value as Record<string, unknown>)) {
    if (FORBIDDEN_EVIDENCE_KEYS.has(key)) {
      return true;
    }
    if (hasForbiddenScoreFields(nested)) {
      return true;
    }
  }
  return false;
}

function usesGitHead(artifactPath: string, rootDir: string): boolean {
  if (rootDir !== REPO_ROOT) {
    return false;
  }
  const normalized = artifactPath.replace(/\\/g, '/');
  for (const prefix of GIT_HEAD_PATHS) {
    if (normalized.startsWith(prefix)) {
      return true;
    }
  }
  return false;
}

function readArtifactLines(artifactPath: string, rootDir: string): string[] | null {
  const relative = artifactPath.replace(/^\.\//, '');
  if (usesGitHead(relative, rootDir)) {
    try {
      const content = execFileSync('git', ['show', `HEAD:${relative}`], {
        cwd: REPO_ROOT,
        encoding: 'utf8',
      });
      return content.split(/\r?\n/);
    } catch {
      return null;
    }
  }

  const absolute = path.isAbsolute(relative)
    ? relative
    : path.join(rootDir, relative);
  if (!existsSync(absolute)) {
    return null;
  }
  return readFileSync(absolute, 'utf8').split(/\r?\n/);
}

function excerptValid(excerpt: string | undefined): excerpt is string {
  return typeof excerpt === 'string' && excerpt.length >= 8;
}

function verifyLineCitation(
  artifactPath: string,
  line: number | undefined,
  excerpt: string | undefined,
  rootDir: string,
): boolean {
  if (line === undefined || !excerptValid(excerpt)) {
    return false;
  }
  const lines = readArtifactLines(artifactPath, rootDir);
  if (!lines || line < 1 || line > lines.length) {
    return false;
  }
  return lines[line - 1].includes(excerpt);
}

function weightedById(rubric: Rubric): Map<string, RubricWeighted> {
  return new Map(rubric.weighted.map((entry) => [entry.id, entry]));
}

function requiredById(rubric: Rubric): Map<string, RubricRequired> {
  return new Map(rubric.required.map((entry) => [entry.id, entry]));
}

function itemById(items: EvidenceItem[]): Map<string, EvidenceItem> {
  return new Map(items.map((item) => [item.id, item]));
}

function driftWeightedPresent(items: EvidenceItem[], rubric: Rubric): boolean {
  const weighted = weightedById(rubric);
  return items.some((item) => {
    const entry = weighted.get(item.id);
    return entry?.side === 'drift';
  });
}

function requiredIdsForEvidence(items: EvidenceItem[], rubric: Rubric): string[] {
  const ids = ['R1', 'R2', 'R4'];
  if (driftWeightedPresent(items, rubric)) {
    ids.push('R3');
  }
  return ids;
}

function verifyRequiredItems(
  items: EvidenceItem[],
  rubric: Rubric,
  rootDir: string,
): { verified: string[]; missing: string[] } {
  const byId = itemById(items);
  const requiredIds = requiredIdsForEvidence(items, rubric);
  const verified: string[] = [];
  const missing: string[] = [];

  for (const reqId of requiredIds) {
    if (reqId === 'R4') {
      if (byId.has('R4')) {
        continue;
      }
      missing.push('R4');
      continue;
    }
    const item = byId.get(reqId);
    if (!item?.artifact) {
      missing.push(reqId);
      continue;
    }
    if (verifyLineCitation(item.artifact, item.line, item.excerpt, rootDir)) {
      verified.push(reqId);
    } else {
      missing.push(reqId);
    }
  }

  return { verified, missing };
}

function verifyWeightedItems(
  items: EvidenceItem[],
  rubric: Rubric,
  rootDir: string,
): string[] {
  const weighted = weightedById(rubric);
  const verified: string[] = [];

  for (const item of items) {
    const entry = weighted.get(item.id);
    if (!entry) {
      continue;
    }
    if (!item.artifact) {
      continue;
    }
    if (entry.weight === 0) {
      if (verifyLineCitation(item.artifact, item.line, item.excerpt, rootDir)) {
        verified.push(item.id);
      }
      continue;
    }
    if (verifyLineCitation(item.artifact, item.line, item.excerpt, rootDir)) {
      verified.push(item.id);
    }
  }

  return verified;
}

interface PlaywrightJsonReport {
  suites?: PlaywrightSuite[];
}

interface PlaywrightSuite {
  suites?: PlaywrightSuite[];
  specs?: PlaywrightSpec[];
}

interface PlaywrightSpec {
  title: string;
  tests?: PlaywrightTest[];
}

interface PlaywrightTest {
  results?: PlaywrightResult[];
}

interface PlaywrightResult {
  status?: string;
  errors?: { message?: string }[];
  error?: { message?: string };
}

function errorFromSpec(spec: PlaywrightSpec): string | null {
  const results = spec.tests?.[0]?.results;
  if (!results) {
    return null;
  }
  for (const result of results) {
    const messages: string[] = [];
    if (result.error?.message) {
      messages.push(result.error.message);
    }
    if (result.errors) {
      for (const entry of result.errors) {
        if (entry.message) {
          messages.push(entry.message);
        }
      }
    }
    for (const message of messages) {
      const firstLine = message.trim().split('\n')[0]?.trim();
      if (firstLine) {
        return firstLine;
      }
    }
  }
  return null;
}

function firstErrorLineFromReport(report: PlaywrightJsonReport): string | null {
  const walkSuite = (suite: PlaywrightSuite): string | null => {
    if (suite.specs) {
      for (const spec of suite.specs) {
        const fromSpec = errorFromSpec(spec);
        if (fromSpec) {
          return fromSpec;
        }
      }
    }
    if (suite.suites) {
      for (const nested of suite.suites) {
        const fromNested = walkSuite(nested);
        if (fromNested) {
          return fromNested;
        }
      }
    }
    return null;
  };

  if (!report.suites) {
    return null;
  }
  for (const suite of report.suites) {
    const line = walkSuite(suite);
    if (line) {
      return line;
    }
  }
  return null;
}

function reportHasPassingRun(report: PlaywrightJsonReport, title: string): boolean {
  const walkSuite = (suite: PlaywrightSuite): boolean | null => {
    if (suite.specs) {
      for (const spec of suite.specs) {
        if (spec.title !== title) {
          continue;
        }
        const status = spec.tests?.[0]?.results?.[0]?.status;
        if (status === 'passed' || status === 'expected') {
          return true;
        }
        if (status === 'failed' || status === 'unexpected') {
          return false;
        }
      }
    }
    if (suite.suites) {
      for (const nested of suite.suites) {
        const nestedResult = walkSuite(nested);
        if (nestedResult !== null) {
          return nestedResult;
        }
      }
    }
    return null;
  };

  if (!report.suites) {
    return false;
  }
  for (const suite of report.suites) {
    const result = walkSuite(suite);
    if (result !== null) {
      return result;
    }
  }
  return false;
}

function rerunReportPath(decisionId: string): string {
  return path.join(REPO_ROOT, '.test-artifacts', 'reruns', `${decisionId}.json`);
}

function runPlaywrightRerun(testFile: string, title: string, decisionId: string): PlaywrightJsonReport {
  const outPath = rerunReportPath(decisionId);
  mkdirSync(path.dirname(outPath), { recursive: true });
  const relativeTest = path.isAbsolute(testFile)
    ? path.relative(REPO_ROOT, testFile)
    : testFile;
  const stdout = execFileSync(
    'npx',
    ['playwright', 'test', relativeTest, '-g', title, '--reporter=json'],
    {
      cwd: REPO_ROOT,
      encoding: 'utf8',
      maxBuffer: 20 * 1024 * 1024,
    },
  );
  writeFileSync(outPath, stdout, 'utf8');
  return JSON.parse(stdout) as PlaywrightJsonReport;
}

function loadRerunReport(decisionId: string): PlaywrightJsonReport {
  const outPath = rerunReportPath(decisionId);
  if (!existsSync(outPath)) {
    throw new Error(`Missing rerun report: ${outPath}`);
  }
  return JSON.parse(readFileSync(outPath, 'utf8')) as PlaywrightJsonReport;
}

function r1Excerpt(items: EvidenceItem[]): string | null {
  const r1 = items.find((item) => item.id === 'R1');
  if (!r1 || !excerptValid(r1.excerpt)) {
    return null;
  }
  return r1.excerpt;
}

function rerunMatchesR1(report: PlaywrightJsonReport, r1: string): boolean {
  const firstLine = firstErrorLineFromReport(report);
  if (!firstLine) {
    return false;
  }
  const normalizedFirst = firstLine.trim().split('\n')[0].trim();
  return normalizedFirst.includes(r1) || r1.includes(normalizedFirst);
}

function sidesFromVerifiedWeighted(
  verifiedWeightedIds: string[],
  rubric: Rubric,
): { drift: boolean; bug: boolean } {
  const weighted = weightedById(rubric);
  let drift = false;
  let bug = false;
  for (const id of verifiedWeightedIds) {
    const entry = weighted.get(id);
    if (!entry || entry.weight === 0) {
      continue;
    }
    if (entry.side === 'drift') {
      drift = true;
    }
    if (entry.side === 'bug') {
      bug = true;
    }
  }
  return { drift, bug };
}

function sumScoreForSide(
  verifiedWeightedIds: string[],
  rubric: Rubric,
  side: Side,
): number {
  const weighted = weightedById(rubric);
  let total = 0;
  for (const id of verifiedWeightedIds) {
    const entry = weighted.get(id);
    if (entry && entry.side === side) {
      total += entry.weight;
    }
  }
  return total;
}

function hasOracleOnSide(
  verifiedWeightedIds: string[],
  rubric: Rubric,
  side: Side,
): boolean {
  const weighted = weightedById(rubric);
  return verifiedWeightedIds.some((id) => {
    const entry = weighted.get(id);
    return entry?.side === side && entry.oracle === true;
  });
}

function allowedActionsFor(decision: Decision, side: Side | null): string[] {
  if (decision === 'act' && side === 'drift') {
    return ['self-heal', 'open-repair-pr'];
  }
  if (decision === 'act' && side === 'bug') {
    return ['bug-reporter', 'file-jira-bug'];
  }
  if (decision === 'escalate') {
    return ['escalate-human', 'gather-evidence'];
  }
  return ['gather-evidence', 're-run-triage'];
}

function buildInconclusive(
  decisionId: string,
  rule: string,
  verified: string[],
  missing: string[],
  contradictions: string[],
  score = 0,
  side: Side | null = null,
  oracle = false,
): ScoreResult {
  return {
    decisionId,
    decision: 'inconclusive',
    side,
    score,
    oracle,
    verified,
    missing,
    contradictions,
    rule,
    allowedActions: allowedActionsFor('inconclusive', side),
  };
}

function scoreEvidence(
  evidence: EvidenceFile,
  rubric: Rubric,
  options: CliOptions,
  decisionId: string,
): ScoreResult {
  const verifiedRequired = verifyRequiredItems(evidence.items, rubric, options.rootDir);
  const verifiedWeighted = verifyWeightedItems(evidence.items, rubric, options.rootDir);
  const verified = [...new Set([...verifiedRequired.verified, ...verifiedWeighted])];
  const missing = verifiedRequired.missing;

  if (hasForbiddenScoreFields(evidence)) {
    return buildInconclusive(decisionId, 'rule:1', verified, missing, []);
  }

  const r1 = r1Excerpt(evidence.items);
  if (!r1) {
    return buildInconclusive(decisionId, 'rule:2', verified, ['R1'], []);
  }

  if (missing.length > 0) {
    return buildInconclusive(decisionId, 'rule:2', verified, missing, []);
  }

  let rerunReport: PlaywrightJsonReport;
  try {
    rerunReport = options.verifyOnly
      ? loadRerunReport(decisionId)
      : runPlaywrightRerun(
          path.join(options.rootDir, evidence.test.file),
          evidence.test.title,
          decisionId,
        );
  } catch {
    return buildInconclusive(decisionId, 'rule:2', verified, ['R4'], []);
  }

  if (reportHasPassingRun(rerunReport, evidence.test.title)) {
    return buildInconclusive(decisionId, 'rule:3', verified, [], []);
  }

  if (!rerunMatchesR1(rerunReport, r1)) {
    return buildInconclusive(decisionId, 'rule:2', verified, ['R4'], []);
  }

  if (!verified.includes('R4')) {
    verified.push('R4');
  }

  const { drift, bug } = sidesFromVerifiedWeighted(verifiedWeighted, rubric);
  if (drift && bug) {
    return buildInconclusive(decisionId, 'rule:4', verified, [], ['drift-and-bug']);
  }

  let side: Side | null = null;
  if (drift) {
    side = 'drift';
  } else if (bug) {
    side = 'bug';
  }

  if (!side) {
    return buildInconclusive(decisionId, 'rule:5', verified, [], []);
  }

  const score = sumScoreForSide(verifiedWeighted, rubric, side);
  const oracle = hasOracleOnSide(verifiedWeighted, rubric, side);

  if (score === 0) {
    return buildInconclusive(decisionId, 'rule:5', verified, [], [], score, side, oracle);
  }

  if (
    score >= rubric.thresholds.act &&
    (!rubric.thresholds.actRequiresOracleOnSide || oracle)
  ) {
    return {
      decisionId,
      decision: 'act',
      side,
      score,
      oracle,
      verified,
      missing: [],
      contradictions: [],
      rule: 'rule:6',
      allowedActions: allowedActionsFor('act', side),
    };
  }

  if (score >= rubric.thresholds.escalate) {
    return {
      decisionId,
      decision: 'escalate',
      side,
      score,
      oracle,
      verified,
      missing: [],
      contradictions: [],
      rule: 'rule:7',
      allowedActions: allowedActionsFor('escalate', side),
    };
  }

  return buildInconclusive(decisionId, 'rule:8', verified, [], [], score, side, oracle);
}

function writeDecisionOutput(result: ScoreResult): void {
  const outDir = path.join(REPO_ROOT, '.test-artifacts', 'decisions');
  mkdirSync(outDir, { recursive: true });
  const outPath = path.join(outDir, `${result.decisionId}.json`);
  writeFileSync(outPath, `${JSON.stringify(result, null, 2)}\n`, 'utf8');
}

function main(): void {
  const options = parseArgs(process.argv.slice(2));
  const rubric = loadRubric();
  const decisionId = decisionIdFromEvidenceFile(options.evidencePath);
  const evidence = JSON.parse(readFileSync(options.evidencePath, 'utf8')) as EvidenceFile;
  const result = scoreEvidence(evidence, rubric, options, decisionId);
  writeDecisionOutput(result);
  process.stdout.write(`${JSON.stringify(result)}\n`);
}

export {
  scoreEvidence,
  decisionIdFromEvidenceFile,
  loadRubric,
  type ScoreResult,
  type EvidenceFile,
  REPO_ROOT,
};

if (require.main === module) {
  main();
}
