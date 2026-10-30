import fs from 'node:fs';
import path from 'node:path';

import { type APIRequestContext, expect } from '@playwright/test';

import { CATALOG_UNAUTHENTICATED_STATUS, expectCatalogJsonResponse } from './catalog-contract';
import {
  createTrackedChild,
  expectOwnerStillHasChild,
  jsonContainsExactString,
} from './authorization-helpers';

export type AuthzWho = 'familyB' | 'anonymous';
export type AuthzOutcome = 'HELD' | 'BREACHED' | 'undocumented';

export interface AuthzProbeAttempt {
  ticket: string;
  endpoint: string;
  who: AuthzWho;
  status: number | null;
  outcome: AuthzOutcome;
  evidence: string;
}

export interface TicketAuthzProbeConfig {
  ticket: string;
  getPaths: readonly string[];
}

export interface TicketAuthzProbeResult {
  ticket: string;
  requestCount: number;
  stoppedOn5xx: boolean;
  ownerChildStillPresent: boolean;
  attempts: AuthzProbeAttempt[];
}

const REPORT_DIR = path.join(process.cwd(), 'qa-run', 'authz-reports');

export async function runTicketAuthzProbe(
  config: TicketAuthzProbeConfig,
  mainApi: APIRequestContext,
  altApi: APIRequestContext,
  unauthenticatedApi: APIRequestContext,
): Promise<TicketAuthzProbeResult> {
  let requestCount = 0;
  let stoppedOn5xx = false;
  const attempts: AuthzProbeAttempt[] = [];
  const childId = await createTrackedChild(mainApi);
  requestCount += 1;

  const sendGet = async (
    client: APIRequestContext,
    who: AuthzWho,
    endpointPath: string,
  ): Promise<{ status: number | null; json: unknown }> => {
    if (stoppedOn5xx) {
      return { status: null, json: null };
    }
    requestCount += 1;
    const response = await client.get(endpointPath);
    const status = response.status();
    let json: unknown = null;
    try {
      json = await response.json();
    } catch {
      json = null;
    }
    if (status >= 500) {
      stoppedOn5xx = true;
    }
    return { status, json };
  };

  for (const endpointPath of config.getPaths) {
    const endpoint = `GET ${endpointPath}`;
    const altResult = await sendGet(altApi, 'familyB', endpointPath);
    if (altResult.status !== null && altResult.status >= 500) {
      attempts.push({
        ticket: config.ticket,
        endpoint,
        who: 'familyB',
        status: altResult.status,
        outcome: 'undocumented',
        evidence: `5xx on ${endpoint} as familyB`,
      });
      break;
    }
    const altSawChild =
      altResult.status === 200 && jsonContainsExactString(altResult.json, childId);
    const connectionsCircleShare =
      endpointPath.includes('/connections') && altSawChild;
    attempts.push({
      ticket: config.ticket,
      endpoint,
      who: 'familyB',
      status: altResult.status,
      outcome: connectionsCircleShare
        ? 'undocumented'
        : altSawChild
          ? 'BREACHED'
          : altResult.status === 200
            ? 'HELD'
            : 'undocumented',
      evidence: connectionsCircleShare
        ? 'Family B GET /connections included the created child id; catalog does not define circle child sharing'
        : altSawChild
          ? `Family B body included Family A child id on ${endpoint}`
          : `Family B ${endpoint} status ${altResult.status}; child id absent when 200`,
    });

    const anonResult = await sendGet(unauthenticatedApi, 'anonymous', endpointPath);
    if (anonResult.status !== null && anonResult.status >= 500) {
      attempts.push({
        ticket: config.ticket,
        endpoint,
        who: 'anonymous',
        status: anonResult.status,
        outcome: 'undocumented',
        evidence: `5xx on ${endpoint} as anonymous`,
      });
      break;
    }
    const anonSawChild =
      anonResult.status === 200 && jsonContainsExactString(anonResult.json, childId);
    const anonHeld =
      anonResult.status === CATALOG_UNAUTHENTICATED_STATUS &&
      !anonSawChild;
    attempts.push({
      ticket: config.ticket,
      endpoint,
      who: 'anonymous',
      status: anonResult.status,
      outcome: anonSawChild
        ? 'BREACHED'
        : anonHeld
          ? 'HELD'
          : 'undocumented',
      evidence: anonSawChild
        ? `Anonymous body included child id on ${endpoint}`
        : `Anonymous ${endpoint} status ${anonResult.status}`,
    });
  }

  await expectOwnerStillHasChild(mainApi, childId);
  const ownerChildStillPresent = true;

  const result: TicketAuthzProbeResult = {
    ticket: config.ticket,
    requestCount,
    stoppedOn5xx,
    ownerChildStillPresent,
    attempts,
  };

  fs.mkdirSync(REPORT_DIR, { recursive: true });
  fs.writeFileSync(
    path.join(REPORT_DIR, `${config.ticket}.json`),
    `${JSON.stringify(result, null, 2)}\n`,
  );

  expect(stoppedOn5xx, 'probe stopped on 5xx').toBe(false);
  const breaches = attempts.filter((attempt) => attempt.outcome === 'BREACHED');
  expect(breaches, breaches.map((attempt) => attempt.evidence).join('; ')).toEqual([]);

  return result;
}

export function mergeAuthzReports(results: TicketAuthzProbeResult[]): void {
  const merged = {
    generatedAt: new Date().toISOString(),
    tickets: results.map((result) => result.ticket),
    requestCount: results.reduce((sum, result) => sum + result.requestCount, 0),
    attempts: results.flatMap((result) => result.attempts),
  };
  fs.mkdirSync(path.join(process.cwd(), 'qa-run'), { recursive: true });
  fs.writeFileSync(
    path.join(process.cwd(), 'qa-run', 'authz-report.json'),
    `${JSON.stringify(merged, null, 2)}\n`,
  );
}

/** Permanent spec helper after probe confirms anonymous 401. */
export async function expectUnauthenticatedGetRejected(
  unauthenticatedApi: APIRequestContext,
  path: string,
): Promise<void> {
  await expectCatalogJsonResponse(await unauthenticatedApi.get(path), CATALOG_UNAUTHENTICATED_STATUS);
}
