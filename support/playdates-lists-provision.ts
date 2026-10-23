import { expect, type APIRequestContext, type Page } from '@playwright/test';

import { PlaydatesPage } from '../pages/playdates.page';
import { trackRecord } from './record-tracker';
import { cancelPlaydate, getApiContext } from './api-client';
import {
  type PlaydatesListsProvisionCase,
  buildPlaydatesListsProvision,
} from '../test-data/factories/playdates-lists-provision.factory';
import { getSpecFamilyProfile, type SpecProfileKey } from '../test-data/spec-profiles';
import type { RecordOwner } from './record-tracker';
import { getSpecChildByRole } from './spec-family-provision';
import type { PlaydateProposalPayload } from '../test-data/factories/propose-playdate.factory';
import { cancelOpenAutomationPlaydates } from './playdates-provision-cleanup';
import { playdateCircleFamilyForSpec } from '../test-data/playdates-spec-circle';
import { daysAheadBaseForVisiblePast } from './playdates-provision-schedule';
import {
  createCancelledPastPlaydateViaApi,
  resolveInviteeFamilyId,
} from './playdates-provision-api';

const PLAYDATES_PATH = '/api/v1/playdates';

/** Shown in Playwright reports when step 2 validation fails and tests are skipped. */
export const PLAYDATES_LISTS_TEST_DATA_NOT_READY = 'Test data is not ready';

/** Max time to wait for Mia/Maria provision rows in the app before skipping a test. */
export const PLAYDATES_LISTS_READINESS_TIMEOUT_MS = 15_000;

interface MeChild {
  id: string;
  firstName: string;
}

interface PlaydateListItem {
  id: string;
  status: string;
  startsAt?: string;
  locationText: string | null;
  notes?: string | null;
  children?: MeChild[];
}

export interface PlaydatesListsProvisionState {
  runId: string;
  owner: RecordOwner;
  miaCase: PlaydatesListsProvisionCase;
  mariaCase: PlaydatesListsProvisionCase;
  playdateIds: string[];
}

let activeProvision: PlaydatesListsProvisionState | null = null;
let listsProvisionInFlight: Promise<PlaydatesListsProvisionState> | null = null;

export function getPlaydatesListsProvision(): PlaydatesListsProvisionState {
  if (!activeProvision) {
    throw new Error('Playdates lists provision has not been created yet');
  }
  return activeProvision;
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

/** Mia row should be more recent than Maria for the same provision run. */
export async function expectProvisionedPastNewestFirst(
  api: APIRequestContext,
  state: PlaydatesListsProvisionState,
): Promise<void> {
  const list = await listPlaydates(api);
  const mia = findByLocationToken(list, state.miaCase.locationToken);
  const maria = findByLocationToken(list, state.mariaCase.locationToken);
  expect(mia?.startsAt, `Missing startsAt for ${state.miaCase.locationToken}`).toBeTruthy();
  expect(maria?.startsAt, `Missing startsAt for ${state.mariaCase.locationToken}`).toBeTruthy();
  expect(new Date(mia!.startsAt!).getTime()).toBeGreaterThan(new Date(maria!.startsAt!).getTime());
}

function collectProvisionRowIssues(
  list: PlaydateListItem[],
  state: PlaydatesListsProvisionState,
): string[] {
  const issues: string[] = [];
  for (const provisionCase of [state.miaCase, state.mariaCase]) {
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

export type ProvisionedPlaydatesReadiness =
  | { ready: true; state: PlaydatesListsProvisionState }
  | { ready: false; reportComment: string };

/** Step 2: non-throwing check used to skip tests when playdate provision is missing. */
export async function getProvisionedPlaydatesReadiness(
  api: APIRequestContext,
): Promise<ProvisionedPlaydatesReadiness> {
  if (!activeProvision) {
    return {
      ready: false,
      reportComment: `${PLAYDATES_LISTS_TEST_DATA_NOT_READY}: cancelled Past rows were not provisioned.`,
    };
  }

  const listResponse = await api.get(PLAYDATES_PATH);
  if (!listResponse.ok()) {
    return {
      ready: false,
      reportComment: `${PLAYDATES_LISTS_TEST_DATA_NOT_READY}: GET /api/v1/playdates failed.`,
    };
  }
  const list = (await listResponse.json()) as PlaydateListItem[];
  const rowIssues = collectProvisionRowIssues(list, activeProvision);
  if (rowIssues.length > 0) {
    return {
      ready: false,
      reportComment: `${PLAYDATES_LISTS_TEST_DATA_NOT_READY}: ${rowIssues.join(' ')}`,
    };
  }

  return { ready: true, state: activeProvision };
}

/**
 * Step 2 with timeout: polls the application until provision data is ready or {@link PLAYDATES_LISTS_READINESS_TIMEOUT_MS} elapses.
 */
export async function waitForProvisionedPlaydatesReadiness(
  api: APIRequestContext,
  timeoutMs: number = PLAYDATES_LISTS_READINESS_TIMEOUT_MS,
): Promise<ProvisionedPlaydatesReadiness> {
  if (!activeProvision) {
    return {
      ready: false,
      reportComment: `${PLAYDATES_LISTS_TEST_DATA_NOT_READY}: cancelled Past rows were not provisioned.`,
    };
  }

  let lastReadiness: ProvisionedPlaydatesReadiness = {
    ready: false,
    reportComment: `${PLAYDATES_LISTS_TEST_DATA_NOT_READY}: Provisioned playdates not yet visible in the application.`,
  };

  try {
    await expect(async () => {
      lastReadiness = await getProvisionedPlaydatesReadiness(api);
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

export async function validateProvisionedPlaydates(api: APIRequestContext, state: PlaydatesListsProvisionState): Promise<void> {
  const list = await listPlaydates(api);
  const issues = collectProvisionRowIssues(list, state);
  expect(issues, issues.join(' ')).toEqual([]);
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
  provisionCase: PlaydatesListsProvisionCase,
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
  provisionCase: PlaydatesListsProvisionCase,
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

async function runPlaydatesListsProvision(
  page: Page,
  specKey: SpecProfileKey,
): Promise<PlaydatesListsProvisionState> {
  const owner = getSpecFamilyProfile(specKey).owner;
  const api = await getApiContext(owner);
  await cancelOpenAutomationPlaydates(api);

  const primaryChild = getSpecChildByRole(specKey, 'girl10');
  const secondaryChild = getSpecChildByRole(specKey, 'girl7');
  const circleFamilyName = playdateCircleFamilyForSpec(specKey);
  const daysBase = await daysAheadBaseForVisiblePast(api);
  const bundle = buildPlaydatesListsProvision(
    primaryChild.firstName,
    secondaryChild.firstName,
    circleFamilyName,
    daysBase + 1,
    daysBase,
  );
  const ids: string[] = [];

  ids.push(await createCancelledPastRow(page, api, owner, bundle.miaCase));
  ids.push(await createCancelledPastRow(page, api, owner, bundle.mariaCase));

  const state: PlaydatesListsProvisionState = { ...bundle, owner, playdateIds: ids };
  await validateProvisionedPlaydates(api, state);
  activeProvision = state;
  return state;
}

/** Creates Mia and Maria cancelled Past rows, validates, and stores locators for specs. */
export async function provisionPlaydatesListsData(
  page: Page,
  specKey: SpecProfileKey = 'aqpbt-11',
): Promise<PlaydatesListsProvisionState> {
  if (activeProvision) {
    return activeProvision;
  }
  if (!listsProvisionInFlight) {
    listsProvisionInFlight = runPlaydatesListsProvision(page, specKey).finally(() => {
      listsProvisionInFlight = null;
    });
  }
  return listsProvisionInFlight;
}

/** Best-effort cancel for tracked provision ids (already-cancelled rows may no-op). */
export async function teardownProvisionedPlaydates(state: PlaydatesListsProvisionState): Promise<void> {
  const api = await getApiContext(state.owner);
  for (const id of state.playdateIds) {
    const list = await listPlaydates(api);
    const row = list.find((item) => item.id === id);
    if (row?.status !== 'cancelled') {
      await cancelPlaydate(api, id);
    }
  }
  activeProvision = null;
}
