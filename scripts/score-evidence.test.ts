import assert from 'node:assert/strict';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { test } from 'node:test';

import {
  decisionIdFromEvidenceFile,
  loadRubric,
  scoreEvidence,
  type EvidenceFile,
  REPO_ROOT,
} from './score-evidence';

const FIXTURES_ROOT = path.join(REPO_ROOT, 'scripts', 'evidence-fixtures');
const RERUNS_DIR = path.join(REPO_ROOT, '.test-artifacts', 'reruns');

interface PlaywrightJsonReport {
  suites: {
    specs?: {
      title: string;
      tests?: { results?: { status?: string; errors?: { message?: string }[] }[] }[];
    }[];
    suites?: PlaywrightJsonReport['suites'];
  }[];
}

function failedRerunReport(title: string, firstErrorLine: string): PlaywrightJsonReport {
  return {
    suites: [
      {
        specs: [
          {
            title,
            tests: [
              {
                results: [
                  {
                    status: 'failed',
                    errors: [{ message: `${firstErrorLine}\n    at fixture.spec.ts:5:5` }],
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
  };
}

function passedRerunReport(title: string): PlaywrightJsonReport {
  return {
    suites: [
      {
        specs: [
          {
            title,
            tests: [
              {
                results: [{ status: 'passed' }],
              },
            ],
          },
        ],
      },
    ],
  };
}

function loadEvidence(caseName: string): { evidencePath: string; evidence: EvidenceFile; rootDir: string } {
  const rootDir = path.join(FIXTURES_ROOT, caseName);
  const evidencePath = path.join(rootDir, 'evidence.json');
  const evidence = JSON.parse(readFileSync(evidencePath, 'utf8')) as EvidenceFile;
  return { evidencePath, evidence, rootDir };
}

function stageRerunReport(decisionId: string, report: PlaywrightJsonReport): void {
  mkdirSync(RERUNS_DIR, { recursive: true });
  writeFileSync(path.join(RERUNS_DIR, `${decisionId}.json`), `${JSON.stringify(report)}\n`, 'utf8');
}

function scoreCase(caseName: string, rerun: PlaywrightJsonReport) {
  const rubric = loadRubric();
  const { evidencePath, evidence, rootDir } = loadEvidence(caseName);
  const decisionId = decisionIdFromEvidenceFile(evidencePath);
  stageRerunReport(decisionId, rerun);
  return scoreEvidence(evidence, rubric, { evidencePath, verifyOnly: true, rootDir }, decisionId);
}

test('min-act-drift: R1–R4, D1 + D2 → drift 60, act (rule 6)', () => {
  const { evidence } = loadEvidence('min-act-drift');
  const result = scoreCase(
    'min-act-drift',
    failedRerunReport(evidence.test.title, 'Expected locator to be visible'),
  );
  assert.equal(result.decision, 'act');
  assert.equal(result.side, 'drift');
  assert.equal(result.score, 60);
  assert.equal(result.oracle, true);
  assert.equal(result.rule, 'rule:6');
});

test('min-act-bug: R1, R2, R4, B1 + B3 → bug 60, act (rule 6)', () => {
  const { evidence } = loadEvidence('min-act-bug');
  const result = scoreCase(
    'min-act-bug',
    failedRerunReport(evidence.test.title, 'Expected locator to be visible'),
  );
  assert.equal(result.decision, 'act');
  assert.equal(result.side, 'bug');
  assert.equal(result.score, 60);
  assert.equal(result.oracle, true);
  assert.equal(result.rule, 'rule:6');
});

test('min-escalate: R1–R4, D1 → drift 40, escalate (rule 7)', () => {
  const { evidence } = loadEvidence('min-escalate');
  const result = scoreCase(
    'min-escalate',
    failedRerunReport(evidence.test.title, 'Expected locator to be visible'),
  );
  assert.equal(result.decision, 'escalate');
  assert.equal(result.side, 'drift');
  assert.equal(result.score, 40);
  assert.equal(result.rule, 'rule:7');
});

test('missing-required: no R4, D1 + D4 → inconclusive (rule 2)', () => {
  const { evidencePath, evidence, rootDir } = loadEvidence('missing-required');
  const rubric = loadRubric();
  const decisionId = decisionIdFromEvidenceFile(evidencePath);
  const result = scoreEvidence(
    evidence,
    rubric,
    { evidencePath, verifyOnly: true, rootDir },
    decisionId,
  );
  assert.equal(result.decision, 'inconclusive');
  assert.equal(result.rule, 'rule:2');
  assert.ok(result.missing.includes('R4'));
});

test('contradiction: R1–R4, D1 + B2 → inconclusive (rule 4)', () => {
  const { evidence } = loadEvidence('contradiction');
  const result = scoreCase(
    'contradiction',
    failedRerunReport(evidence.test.title, 'Expected locator to be visible'),
  );
  assert.equal(result.decision, 'inconclusive');
  assert.equal(result.rule, 'rule:4');
  assert.deepEqual(result.contradictions, ['drift-and-bug']);
});

test('neutral-oracle: R1–R4, N + D2 + D3 → drift 35, no oracle, escalate (rule 7)', () => {
  const { evidence } = loadEvidence('neutral-oracle');
  const result = scoreCase(
    'neutral-oracle',
    failedRerunReport(evidence.test.title, 'Expected locator to be visible'),
  );
  assert.equal(result.decision, 'escalate');
  assert.equal(result.side, 'drift');
  assert.equal(result.score, 35);
  assert.equal(result.oracle, false);
  assert.equal(result.rule, 'rule:7');
});

test('flaky: saved re-run passed → inconclusive (rule 3)', () => {
  const { evidence } = loadEvidence('flaky');
  const result = scoreCase('flaky', passedRerunReport(evidence.test.title));
  assert.equal(result.decision, 'inconclusive');
  assert.equal(result.rule, 'rule:3');
});

test('model-score: evidence has confidence field → inconclusive (rule 1)', () => {
  const { evidencePath, evidence, rootDir } = loadEvidence('model-score');
  const rubric = loadRubric();
  const decisionId = decisionIdFromEvidenceFile(evidencePath);
  stageRerunReport(
    decisionId,
    failedRerunReport(evidence.test.title, 'Expected locator to be visible'),
  );
  const result = scoreEvidence(
    evidence,
    rubric,
    { evidencePath, verifyOnly: true, rootDir },
    decisionId,
  );
  assert.equal(result.decision, 'inconclusive');
  assert.equal(result.rule, 'rule:1');
});
