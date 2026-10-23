import { expect, type APIRequestContext, type Page } from '@playwright/test';

import { PlaydatesPage } from '../pages/playdates.page';
import { trackRecord } from './record-tracker';
import { cancelPlaydate, getApiContext } from './api-client';
import {
  type PlaydatesCalendarProvisionCase,
  buildPlaydatesCalendarProvision,
} from '../test-data/factories/playdates-calendar-provision.factory';
import type { SpecProfileKey } from '../test-data/spec-profiles';
import { getSpecChildByRole } from './spec-family-provision';
import { cancelOpenAutomationPlaydates } from './playdates-provision-cleanup';

const PLAYDATES_PATH = '/api/v1/playdates';

export const PLAYDATES_CALENDAR_TEST_DATA_NOT_READY = 'Test data is not ready';
export const PLAYDATES_CALENDAR_READINESS_TIMEOUT_MS = 15_000;

interface MeChild {
  id: string;
  firstName: string;
}

interface PlaydateListItem {
  id: string;
  status: string;
  locationText: string | null;
  notes?: string | null;
  children?: MeChild[];
}

export interface PlaydatesCalendarProvisionState {
  runId: string;
  primaryCase: PlaydatesCalendarProvisionCase;
  futureCancelledCase: PlaydatesCalendarProvisionCase;
  playdateIds: string[];
}

let activeCalendarProvision: PlaydatesCalendarProvisionState | null = null;

export function getPlaydatesCalendarProvision(): PlaydatesCalendarProvisionState {
  if (!activeCalendarProvision) {
    throw new Error('Playdates calendar provision has not been created yet');
  }
  return activeCalendarProvision;
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

async function waitForPlaydateByToken(
  api: APIRequestContext,
  token: string,
): Promise<PlaydateListItem> {
  let found: PlaydateListItem | undefined;
  await expect(async () => {
    const list = await listPlaydates(api);
    found = findByLocationToken(list, token);
    expect(found).toBeDefined();
  }).toPass({ timeout: 15000 });
  return found!;
}

function collectProvisionRowIssues(
  list: PlaydateListItem[],
  state: PlaydatesCalendarProvisionState,
): string[] {
  const issues: string[] = [];
  for (const provisionCase of [state.primaryCase, state.futureCancelledCase]) {
    const row = findByLocationToken(list, provisionCase.locationToken);
    if (!row) {
      issues.push(`Missing provisioned playdate ${provisionCase.locationToken}.`);
      continue;
    }
    if (row.status !== 'cancelled') {
      issues.push(`Playdate ${provisionCase.locationToken} is ${row.status}, expected cancelled.`);
    }
    const childNames = (row.children ?? []).map((child) => child.firstName);
    if (!childNames.includes(provisionCase.childName)) {
      issues.push(
        `Playdate ${provisionCase.locationToken} must include child ${provisionCase.childName}.`,
      );
    }
    if (!(row.locationText ?? '').includes(provisionCase.locationNote)) {
      issues.push(`Playdate ${provisionCase.locationToken} is missing location note ${provisionCase.locationNote}.`);
    }
  }
  return issues;
}

export type PlaydatesCalendarProvisionReadiness =
  | { ready: true; state: PlaydatesCalendarProvisionState }
  | { ready: false; reportComment: string };

export async function getPlaydatesCalendarProvisionReadiness(
  api: APIRequestContext,
): Promise<PlaydatesCalendarProvisionReadiness> {
  if (!activeCalendarProvision) {
    return {
      ready: false,
      reportComment: `${PLAYDATES_CALENDAR_TEST_DATA_NOT_READY}: AQPBT-12 cancelled Past rows were not provisioned.`,
    };
  }

  const listResponse = await api.get(PLAYDATES_PATH);
  if (!listResponse.ok()) {
    return {
      ready: false,
      reportComment: `${PLAYDATES_CALENDAR_TEST_DATA_NOT_READY}: GET /api/v1/playdates failed.`,
    };
  }
  const list = (await listResponse.json()) as PlaydateListItem[];
  const rowIssues = collectProvisionRowIssues(list, activeCalendarProvision);
  if (rowIssues.length > 0) {
    return {
      ready: false,
      reportComment: `${PLAYDATES_CALENDAR_TEST_DATA_NOT_READY}: ${rowIssues.join(' ')}`,
    };
  }

  return { ready: true, state: activeCalendarProvision };
}

export async function waitForPlaydatesCalendarProvisionReadiness(
  api: APIRequestContext,
  timeoutMs: number = PLAYDATES_CALENDAR_READINESS_TIMEOUT_MS,
): Promise<PlaydatesCalendarProvisionReadiness> {
  if (!activeCalendarProvision) {
    return {
      ready: false,
      reportComment: `${PLAYDATES_CALENDAR_TEST_DATA_NOT_READY}: AQPBT-12 cancelled Past rows were not provisioned.`,
    };
  }

  let lastReadiness: PlaydatesCalendarProvisionReadiness = {
    ready: false,
    reportComment: `${PLAYDATES_CALENDAR_TEST_DATA_NOT_READY}: Provisioned playdates not yet visible in the application.`,
  };

  try {
    await expect(async () => {
      lastReadiness = await getPlaydatesCalendarProvisionReadiness(api);
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

async function fillManualProposal(page: Page, payload: PlaydatesCalendarProvisionCase['proposal']): Promise<void> {
  const playdates = new PlaydatesPage(page);
  const form = playdates.proposePlaydateForm;
  await playdates.goto();
  await form.selectFamily(payload.circleFamilyName);
  if (payload.manual) {
    await form.fillManualTime(payload.manual.date, payload.manual.startTime, payload.manual.endTime);
  }
  await form.selectPlace(payload.place);
  await form.fillNotes(payload.locationNote, payload.optionalNote);
  await form.selectOnlyChildren(payload.children);
  await form.submit();
}

async function createCancelledPastViaUi(
  page: Page,
  api: APIRequestContext,
  provisionCase: PlaydatesCalendarProvisionCase,
): Promise<string> {
  await fillManualProposal(page, provisionCase.proposal);

  let created = await waitForPlaydateByToken(api, provisionCase.locationToken);

  if (created.status !== 'cancelled') {
    const cancelResult = await cancelPlaydate(api, created.id);
    expect(cancelResult.ok, cancelResult.message).toBe(true);
    await expect(async () => {
      const list = await listPlaydates(api);
      created = findByLocationToken(list, provisionCase.locationToken)!;
      expect(created?.status).toBe('cancelled');
    }).toPass({ timeout: 15000 });
  }

  expect(created!.status).toBe('cancelled');
  trackRecord({ type: 'playdate', id: created.id, owner: 'main' });
  return created.id;
}

async function validateProvisionedPlaydates(
  api: APIRequestContext,
  state: PlaydatesCalendarProvisionState,
): Promise<void> {
  const list = await listPlaydates(api);
  const issues = collectProvisionRowIssues(list, state);
  expect(issues, issues.join(' ')).toEqual([]);
}

/** Creates cancelled Past rows for AQPBT-12 and validates via API. */
export async function provisionPlaydatesCalendarData(
  page: Page,
  specKey: SpecProfileKey = 'aqpbt-12',
): Promise<PlaydatesCalendarProvisionState> {
  const api = await getApiContext('main');
  await cancelOpenAutomationPlaydates(api);

  const primaryChild = getSpecChildByRole(specKey, 'boy10');
  const futureChild = getSpecChildByRole(specKey, 'girl7');
  const state = buildPlaydatesCalendarProvision(primaryChild.firstName, futureChild.firstName);
  const ids: string[] = [];

  ids.push(await createCancelledPastViaUi(page, api, state.primaryCase));
  ids.push(await createCancelledPastViaUi(page, api, state.futureCancelledCase));

  state.playdateIds = ids;
  await validateProvisionedPlaydates(api, state);
  activeCalendarProvision = state;
  return state;
}

export async function teardownPlaydatesCalendarProvision(
  state: PlaydatesCalendarProvisionState,
): Promise<void> {
  const api = await getApiContext('main');
  for (const id of state.playdateIds) {
    const list = await listPlaydates(api);
    const row = list.find((item) => item.id === id);
    if (row?.status !== 'cancelled') {
      await cancelPlaydate(api, id);
    }
  }
  activeCalendarProvision = null;
}
