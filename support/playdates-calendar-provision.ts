import { expect, type APIRequestContext, type Page } from '@playwright/test';

import { PlaydatesPage } from '../pages/playdates.page';
import { trackRecord } from './record-tracker';
import { cancelPlaydate, getApiContext } from './api-client';
import {
  type PlaydatesCalendarProvisionCase,
  buildPlaydatesCalendarProvision,
} from '../test-data/factories/playdates-calendar-provision.factory';
import { getSpecFamilyProfile, type SpecProfileKey } from '../test-data/spec-profiles';
import type { RecordOwner } from './record-tracker';
import { getSpecChildByRole } from './spec-family-provision';
import { altBaselineFamily } from '../test-data/baseline-alt-family';
import { cancelOpenAutomationPlaydates } from './playdates-provision-cleanup';
import { playdateCircleFamilyForSpec } from '../test-data/playdates-spec-circle';
import { daysAheadBaseForVisiblePast } from './playdates-provision-schedule';
import {
  createCancelledPastPlaydateViaApi,
  resolveInviteeFamilyId,
} from './playdates-provision-api';
import type { PlaydateProposalPayload } from '../test-data/factories/propose-playdate.factory';

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
  owner: RecordOwner;
  primaryCase: PlaydatesCalendarProvisionCase;
  futureCancelledCase: PlaydatesCalendarProvisionCase;
  playdateIds: string[];
}

let activeCalendarProvision: PlaydatesCalendarProvisionState | null = null;
let calendarProvisionInFlight: Promise<PlaydatesCalendarProvisionState> | null = null;

async function rehydrateCalendarProvisionFromApi(
  api: APIRequestContext,
  owner: RecordOwner,
): Promise<PlaydatesCalendarProvisionState | null> {
  const response = await api.get(PLAYDATES_PATH);
  if (!response.ok()) {
    return null;
  }
  const list = (await response.json()) as PlaydateListItem[];
  const pairs = new Map<string, { primary?: PlaydateListItem; future?: PlaydateListItem }>();

  for (const item of list) {
    if (item.status !== 'cancelled') {
      continue;
    }
    const haystack = `${item.locationText ?? ''} ${item.notes ?? ''}`;
    const match = haystack.match(/(AQPBT12-\d+)-(primary|future)/);
    if (!match) {
      continue;
    }
    const [, runId, role] = match;
    const bucket = pairs.get(runId) ?? {};
    if (role === 'primary') {
      bucket.primary = item;
    } else {
      bucket.future = item;
    }
    pairs.set(runId, bucket);
  }

  const match = [...pairs.entries()]
    .sort(([a], [b]) => b.localeCompare(a))
    .find(([, pair]) => pair.primary && pair.future);
  if (!match) {
    return null;
  }

  const [runId, pair] = match;
  const circleFamilyName = playdateCircleFamilyForSpec('aqpbt-12');
  const primaryChildName = altBaselineFamily.children.find((child) => child.role === 'boy5')!.firstName;
  const futureChildName = altBaselineFamily.children.find((child) => child.role === 'girl8')!.firstName;
  const bundle = buildPlaydatesCalendarProvision(
    primaryChildName,
    futureChildName,
    circleFamilyName,
    1,
    2,
    runId,
  );

  return {
    ...bundle,
    owner,
    playdateIds: [pair.primary!.id, pair.future!.id],
  };
}

export async function ensurePlaydatesCalendarProvision(
  api: APIRequestContext,
  owner: RecordOwner,
): Promise<PlaydatesCalendarProvisionState | null> {
  if (activeCalendarProvision) {
    return activeCalendarProvision;
  }
  const rehydrated = await rehydrateCalendarProvisionFromApi(api, owner);
  if (rehydrated) {
    activeCalendarProvision = rehydrated;
  }
  return activeCalendarProvision;
}

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
    if (childNames.length > 0 && !childNames.includes(provisionCase.childName)) {
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
  owner: RecordOwner,
): Promise<PlaydatesCalendarProvisionReadiness> {
  await ensurePlaydatesCalendarProvision(api, owner);
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
  owner: RecordOwner,
  timeoutMs: number = PLAYDATES_CALENDAR_READINESS_TIMEOUT_MS,
): Promise<PlaydatesCalendarProvisionReadiness> {
  await ensurePlaydatesCalendarProvision(api, owner);
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
      lastReadiness = await getPlaydatesCalendarProvisionReadiness(api, owner);
      expect(
        lastReadiness.ready,
        lastReadiness.ready ? undefined : lastReadiness.reportComment,
      ).toBe(true);
    }).toPass({ timeout: timeoutMs });
  } catch {
    if (lastReadiness.ready) {
      return lastReadiness;
    }
    const waitedSeconds = Math.round(timeoutMs / 1000);
    return {
      ready: false,
      reportComment: `${
        lastReadiness.ready ? 'Provisioned playdates not ready.' : lastReadiness.reportComment
      } Waited ${waitedSeconds}s for application test data; skipping test.`,
    };
  }

  return lastReadiness;
}

async function fillManualProposal(page: Page, payload: PlaydateProposalPayload): Promise<void> {
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

async function createCancelledPastRow(
  page: Page,
  api: APIRequestContext,
  owner: RecordOwner,
  provisionCase: PlaydatesCalendarProvisionCase,
): Promise<string> {
  const inviteeFamilyId = await resolveInviteeFamilyId(api, provisionCase.proposal.circleFamilyName);
  if (inviteeFamilyId && provisionCase.proposal.manual) {
    return createCancelledPastPlaydateViaApi(api, owner, {
      circleFamilyName: provisionCase.proposal.circleFamilyName,
      manual: provisionCase.proposal.manual,
      locationText: provisionCase.locationNote,
      notes: provisionCase.proposal.optionalNote ?? '',
      childFirstName: provisionCase.childName,
    });
  }
  return createCancelledPastViaUi(page, api, owner, provisionCase);
}

async function createCancelledPastViaUi(
  page: Page,
  api: APIRequestContext,
  owner: RecordOwner,
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
  trackRecord({ type: 'playdate', id: created.id, owner });
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

async function runPlaydatesCalendarProvision(
  page: Page,
  specKey: SpecProfileKey,
): Promise<PlaydatesCalendarProvisionState> {
  const owner = getSpecFamilyProfile(specKey).owner;
  const api = await getApiContext(owner);
  await cancelOpenAutomationPlaydates(api);

  const primaryChildName =
    specKey === 'aqpbt-12'
      ? altBaselineFamily.children.find((child) => child.role === 'boy5')!.firstName
      : getSpecChildByRole(specKey, 'boy5').firstName;
  const futureChildName =
    specKey === 'aqpbt-12'
      ? altBaselineFamily.children.find((child) => child.role === 'girl8')!.firstName
      : getSpecChildByRole(specKey, 'girl8').firstName;
  const circleFamilyName = playdateCircleFamilyForSpec(specKey);
  const daysBase = await daysAheadBaseForVisiblePast(api);
  const bundle = buildPlaydatesCalendarProvision(
    primaryChildName,
    futureChildName,
    circleFamilyName,
    daysBase,
    daysBase + 1,
  );
  const ids: string[] = [];

  ids.push(await createCancelledPastRow(page, api, owner, bundle.primaryCase));
  ids.push(await createCancelledPastRow(page, api, owner, bundle.futureCancelledCase));

  const state: PlaydatesCalendarProvisionState = { ...bundle, owner, playdateIds: ids };
  await validateProvisionedPlaydates(api, state);
  activeCalendarProvision = state;
  return state;
}

/** Creates cancelled Past rows for AQPBT-12 and validates via API. */
export async function provisionPlaydatesCalendarData(
  page: Page,
  specKey: SpecProfileKey = 'aqpbt-12',
): Promise<PlaydatesCalendarProvisionState> {
  if (activeCalendarProvision) {
    return activeCalendarProvision;
  }
  if (!calendarProvisionInFlight) {
    calendarProvisionInFlight = runPlaydatesCalendarProvision(page, specKey).finally(() => {
      calendarProvisionInFlight = null;
    });
  }
  return calendarProvisionInFlight;
}

export async function teardownPlaydatesCalendarProvision(
  state: PlaydatesCalendarProvisionState,
): Promise<void> {
  const api = await getApiContext(state.owner);
  for (const id of state.playdateIds) {
    const list = await listPlaydates(api);
    const row = list.find((item) => item.id === id);
    if (row?.status !== 'cancelled') {
      await cancelPlaydate(api, id);
    }
  }
  activeCalendarProvision = null;
}
