import { expect, type APIRequestContext, type Page } from '@playwright/test';

import { PlaydatesPage } from '../pages/playdates.page';
import {
  buildPlaydatesPendingProvision,
  type PlaydatesPendingProvisionCase,
} from '../test-data/factories/playdates-pending-provision.factory';
import type { SpecProfileKey } from '../test-data/spec-profiles';
import { cancelPlaydate, getApiContext } from './api-client';
import { getSpecChildByRole } from './spec-family-provision';
import { trackRecord } from './record-tracker';

const PLAYDATES_PATH = '/api/v1/playdates';
const PROVISION_TOKEN_PREFIX = 'AQPBT10-';

export const PLAYDATES_PENDING_TEST_DATA_NOT_READY = 'Test data is not ready';
export const PLAYDATES_PENDING_READINESS_TIMEOUT_MS = 15_000;

interface PlaydateListItem {
  id: string;
  status: string;
  locationText: string | null;
  notes?: string | null;
  children?: Array<{ firstName: string }>;
}

export interface PlaydatesPendingProvisionState {
  runId: string;
  cancelledCase: PlaydatesPendingProvisionCase;
  playdateIds: string[];
}

let activePendingProvision: PlaydatesPendingProvisionState | null = null;

export function getPlaydatesPendingProvision(): PlaydatesPendingProvisionState {
  if (!activePendingProvision) {
    throw new Error('Playdates pending provision has not been created yet');
  }
  return activePendingProvision;
}

async function listPlaydates(api: APIRequestContext): Promise<PlaydateListItem[]> {
  const response = await api.get(PLAYDATES_PATH);
  expect(response.ok()).toBeTruthy();
  return (await response.json()) as PlaydateListItem[];
}

function findByLocationToken(list: PlaydateListItem[], token: string): PlaydateListItem | undefined {
  return list.find(
    (item) => item.locationText?.includes(token) || item.notes?.includes(token),
  );
}

async function waitForPlaydateByToken(api: APIRequestContext, token: string): Promise<PlaydateListItem> {
  let found: PlaydateListItem | undefined;
  await expect(async () => {
    const list = await listPlaydates(api);
    found = findByLocationToken(list, token);
    expect(found).toBeDefined();
  }).toPass({ timeout: 15000 });
  return found!;
}

function collectIssues(list: PlaydateListItem[], state: PlaydatesPendingProvisionState): string[] {
  const issues: string[] = [];
  const row = findByLocationToken(list, state.cancelledCase.locationToken);
  if (!row) {
    issues.push(`Missing provisioned playdate ${state.cancelledCase.locationToken}.`);
    return issues;
  }
  if (row.status !== 'cancelled') {
    issues.push(`Playdate ${state.cancelledCase.locationToken} is ${row.status}, expected cancelled.`);
  }
  return issues;
}

export type PlaydatesPendingProvisionReadiness =
  | { ready: true; state: PlaydatesPendingProvisionState }
  | { ready: false; reportComment: string };

export async function getPlaydatesPendingProvisionReadiness(
  api: APIRequestContext,
): Promise<PlaydatesPendingProvisionReadiness> {
  if (!activePendingProvision) {
    return {
      ready: false,
      reportComment: `${PLAYDATES_PENDING_TEST_DATA_NOT_READY}: AQPBT-10 cancelled Past row was not provisioned.`,
    };
  }
  const listResponse = await api.get(PLAYDATES_PATH);
  if (!listResponse.ok()) {
    return {
      ready: false,
      reportComment: `${PLAYDATES_PENDING_TEST_DATA_NOT_READY}: GET /api/v1/playdates failed.`,
    };
  }
  const list = (await listResponse.json()) as PlaydateListItem[];
  const issues = collectIssues(list, activePendingProvision);
  if (issues.length > 0) {
    return {
      ready: false,
      reportComment: `${PLAYDATES_PENDING_TEST_DATA_NOT_READY}: ${issues.join(' ')}`,
    };
  }
  return { ready: true, state: activePendingProvision };
}

export async function waitForPlaydatesPendingProvisionReadiness(
  api: APIRequestContext,
  timeoutMs: number = PLAYDATES_PENDING_READINESS_TIMEOUT_MS,
): Promise<PlaydatesPendingProvisionReadiness> {
  if (!activePendingProvision) {
    return {
      ready: false,
      reportComment: `${PLAYDATES_PENDING_TEST_DATA_NOT_READY}: AQPBT-10 cancelled Past row was not provisioned.`,
    };
  }
  let lastReadiness: PlaydatesPendingProvisionReadiness = {
    ready: false,
    reportComment: `${PLAYDATES_PENDING_TEST_DATA_NOT_READY}: Provisioned playdate not yet visible in the application.`,
  };
  try {
    await expect(async () => {
      lastReadiness = await getPlaydatesPendingProvisionReadiness(api);
      expect(lastReadiness.ready, lastReadiness.reportComment).toBe(true);
    }).toPass({ timeout: timeoutMs });
  } catch {
    if (lastReadiness.ready) {
      return lastReadiness;
    }
    const waitedSeconds = Math.round(timeoutMs / 1000);
    return {
      ready: false,
      reportComment: `${lastReadiness.reportComment} Waited ${waitedSeconds}s for application test data; skipping test.`,
    };
  }
  return lastReadiness;
}

async function fillManualProposal(page: Page, provisionCase: PlaydatesPendingProvisionCase): Promise<void> {
  const playdates = new PlaydatesPage(page);
  const form = playdates.proposePlaydateForm;
  await playdates.goto();
  await form.selectFamily(provisionCase.proposal.circleFamilyName);
  if (provisionCase.proposal.manual) {
    await form.fillManualTime(
      provisionCase.proposal.manual.date,
      provisionCase.proposal.manual.startTime,
      provisionCase.proposal.manual.endTime,
    );
  }
  await form.selectPlace(provisionCase.proposal.place);
  await form.fillNotes(provisionCase.proposal.locationNote, provisionCase.proposal.optionalNote);
  await form.selectOnlyChildren(provisionCase.proposal.children);
  await form.submit();
}

async function createCancelledPastViaUi(
  page: Page,
  api: APIRequestContext,
  provisionCase: PlaydatesPendingProvisionCase,
): Promise<string> {
  await fillManualProposal(page, provisionCase);
  let created = await waitForPlaydateByToken(api, provisionCase.locationToken);
  if (created.status !== 'cancelled') {
    const cancelResult = await cancelPlaydate(api, created.id);
    expect(cancelResult.ok, cancelResult.message).toBe(true);
  }
  trackRecord({ type: 'playdate', id: created.id, owner: 'main' });
  return created.id;
}

async function cancelOpenProvisionPlaydates(api: APIRequestContext): Promise<void> {
  const list = await listPlaydates(api);
  for (const item of list) {
    const haystack = `${item.locationText ?? ''} ${item.notes ?? ''}`;
    if (!haystack.includes(PROVISION_TOKEN_PREFIX) || item.status === 'cancelled') {
      continue;
    }
    await cancelPlaydate(api, item.id);
  }
}

export async function provisionPlaydatesPendingData(
  page: Page,
  specKey: SpecProfileKey = 'aqpbt-10',
): Promise<PlaydatesPendingProvisionState> {
  const api = await getApiContext('main');
  await cancelOpenProvisionPlaydates(api);
  const child = getSpecChildByRole(specKey, 'boy10');
  const state = buildPlaydatesPendingProvision(child.firstName);
  const id = await createCancelledPastViaUi(page, api, state.cancelledCase);
  state.playdateIds = [id];
  activePendingProvision = state;
  const readiness = await getPlaydatesPendingProvisionReadiness(api);
  expect(readiness.ready, readiness.ready ? '' : readiness.reportComment).toBe(true);
  return state;
}

export async function teardownPlaydatesPendingProvision(state: PlaydatesPendingProvisionState): Promise<void> {
  const api = await getApiContext('main');
  for (const id of state.playdateIds) {
    await cancelPlaydate(api, id);
  }
  activePendingProvision = null;
}
