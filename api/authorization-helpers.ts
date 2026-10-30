import { type APIRequestContext, expect } from '@playwright/test';

import { buildChildCreatePayload } from '../test-data/factories/child.factory';
import {
  createPlaydate,
  getMe,
  getPlaydates,
  type PlaydateListItem,
} from '../support/api-client';
import {
  manualTimeToIsoRange,
  resolveInviteeFamilyId,
} from '../support/playdates-provision-api';
import type { RecordOwner } from '../support/record-tracker';
import { PlaydateCircleFamily } from '../test-data/playdates-propose.enums';
import { expectCatalogJsonResponse, expectJsonObject } from './catalog-contract';
import { trackRecord } from './fixtures';

export const ME_PATH = '/api/v1/me';
export const CHILDREN_PATH = '/api/v1/children';
export const CONNECTIONS_PATH = '/api/v1/connections';

export const ALT_DELETE_OTHER_FAMILY_CHILD_STATUS = 404;
export const UNAUTHENTICATED_DELETE_CHILD_STATUS = 401;

interface MeChild {
  id?: string;
}

export function familyChildIds(body: Record<string, unknown>): string[] {
  const family = expectJsonObject(body.family);
  const children = family.children;
  expect(Array.isArray(children)).toBe(true);
  return (children as MeChild[]).map((child) => child.id).filter((id): id is string => typeof id === 'string');
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return null;
}

export function jsonContainsExactString(value: unknown, needle: string): boolean {
  if (typeof value === 'string') {
    return value === needle;
  }
  if (Array.isArray(value)) {
    return value.some((item) => jsonContainsExactString(item, needle));
  }
  const record = asRecord(value);
  if (record) {
    return Object.values(record).some((item) => jsonContainsExactString(item, needle));
  }
  return false;
}

export function familyIdFromMe(body: unknown): string | undefined {
  const family = asRecord(asRecord(body)?.family);
  return typeof family?.id === 'string' ? family.id : undefined;
}

export async function createTrackedChild(mainApi: APIRequestContext): Promise<string> {
  const payload = buildChildCreatePayload(String(Date.now()));
  const createResponse = await mainApi.post(CHILDREN_PATH, { data: payload });
  const created = expectJsonObject(await expectCatalogJsonResponse(createResponse, 201));
  const childId = created.id as string;
  trackRecord({ type: 'child', id: childId, owner: 'main' });
  return childId;
}

export async function expectOwnerStillHasChild(mainApi: APIRequestContext, childId: string): Promise<void> {
  const mainMe = expectJsonObject(await expectCatalogJsonResponse(await mainApi.get(ME_PATH), 200));
  expect(familyChildIds(mainMe)).toContain(childId);
}

export async function expectFamilyBGetOmitsCreatedChild(
  altApi: APIRequestContext,
  path: string,
  childId: string,
): Promise<void> {
  const response = await altApi.get(path);
  expect(response.status()).toBe(200);
  expect(jsonContainsExactString(await response.json(), childId)).toBe(false);
}

function manualTimeDaysAhead(daysAhead: number): { date: string; startTime: string; endTime: string } {
  const start = new Date();
  start.setDate(start.getDate() + daysAhead);
  start.setHours(15, 0, 0, 0);
  const end = new Date(start);
  end.setHours(18, 0, 0, 0);
  return {
    date: start.toISOString().slice(0, 10),
    startTime: '15:00',
    endTime: '18:00',
  };
}

/** Creates a tracked playdate proposal as the given owner (teardown via cancel). */
export async function createTrackedPlaydate(
  api: APIRequestContext,
  owner: RecordOwner,
  input: {
    circleFamilyName: string;
    childFirstName: string;
    locationNote: string;
    daysAhead?: number;
  },
): Promise<string> {
  const inviteeFamilyId = await resolveInviteeFamilyId(api, input.circleFamilyName);
  expect(inviteeFamilyId, `No connection to ${input.circleFamilyName}`).toBeTruthy();

  const me = await getMe(api);
  const child = me.family?.children?.find((row) => row.firstName === input.childFirstName);
  expect(child?.id, `Child ${input.childFirstName} missing on GET /me`).toBeTruthy();

  const manual = manualTimeDaysAhead(input.daysAhead ?? 30);
  const { startsAt, endsAt } = manualTimeToIsoRange(manual);
  const created = await createPlaydate(api, {
    inviteeFamilyId: inviteeFamilyId!,
    startsAt,
    endsAt,
    locationKind: 'out',
    hostFamilyId: null,
    locationText: input.locationNote,
    childIds: [child!.id!],
    notes: input.locationNote,
  });
  expect(created.ok, created.message).toBe(true);
  trackRecord({ type: 'playdate', id: created.id, owner });
  return created.id;
}

export function findPlaydateById(list: PlaydateListItem[], id: string): PlaydateListItem | undefined {
  return list.find((item) => item.id === id);
}
