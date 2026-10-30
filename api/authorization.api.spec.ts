import { type APIRequestContext } from '@playwright/test';

import { buildChildCreatePayload } from '../test-data/factories/child.factory';
import { expectCatalogJsonResponse, expectJsonObject } from './catalog-contract';
import { expect, test, trackRecord } from './fixtures';

const CHILDREN_PATH = '/api/v1/children';
const ME_PATH = '/api/v1/me';
const AVAILABILITY_PATH = '/api/v1/availability';
const PLAYDATES_PATH = '/api/v1/playdates';
const MATCHES_PATH = '/api/v1/matches';
const EVENTS_PATH = '/api/v1/events';

/** Observed in probe run before this spec was written (2026-10-29). */
const ALT_DELETE_OTHER_FAMILY_CHILD_STATUS = 404;
const UNAUTHENTICATED_DELETE_CHILD_STATUS = 401;

interface MeChild {
  id?: string;
}

function familyChildIds(body: Record<string, unknown>): string[] {
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

function jsonContainsExactString(value: unknown, needle: string): boolean {
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

function familyIdFromMe(body: unknown): string | undefined {
  const family = asRecord(asRecord(body)?.family);
  return typeof family?.id === 'string' ? family.id : undefined;
}

async function createTrackedChild(mainApi: APIRequestContext): Promise<string> {
  const payload = buildChildCreatePayload(String(Date.now()));
  const createResponse = await mainApi.post(CHILDREN_PATH, { data: payload });
  const created = expectJsonObject(await expectCatalogJsonResponse(createResponse, 201));
  const childId = created.id as string;
  trackRecord({ type: 'child', id: childId, owner: 'main' });
  return childId;
}

async function expectOwnerStillHasChild(mainApi: APIRequestContext, childId: string): Promise<void> {
  const mainMe = expectJsonObject(await expectCatalogJsonResponse(await mainApi.get(ME_PATH), 200));
  expect(familyChildIds(mainMe)).toContain(childId);
}

async function expectFamilyBGetOmitsCreatedChild(
  altApi: APIRequestContext,
  path: string,
  childId: string,
): Promise<void> {
  const response = await altApi.get(path);
  expect(response.status()).toBe(200);
  expect(jsonContainsExactString(await response.json(), childId)).toBe(false);
}

test(
  'Family B cannot delete family A child @api',
  { tag: '@api' },
  async ({ mainApi, altApi }) => {
    const childId = await createTrackedChild(mainApi);

    const altDeleteResponse = await altApi.delete(`${CHILDREN_PATH}/${childId}`);
    expect(altDeleteResponse.status()).toBe(ALT_DELETE_OTHER_FAMILY_CHILD_STATUS);

    const mainMe = expectJsonObject(await expectCatalogJsonResponse(await mainApi.get(ME_PATH), 200));
    expect(familyChildIds(mainMe)).toContain(childId);

    const altMe = expectJsonObject(await expectCatalogJsonResponse(await altApi.get(ME_PATH), 200));
    expect(familyChildIds(altMe)).not.toContain(childId);
  },
);

test(
  'Unauthenticated client cannot delete family A child @api',
  { tag: '@api' },
  async ({ mainApi, unauthenticatedApi }) => {
    const childId = await createTrackedChild(mainApi);

    const anonymousDeleteResponse = await unauthenticatedApi.delete(`${CHILDREN_PATH}/${childId}`);
    expect(anonymousDeleteResponse.status()).toBe(UNAUTHENTICATED_DELETE_CHILD_STATUS);

    const mainMe = expectJsonObject(await expectCatalogJsonResponse(await mainApi.get(ME_PATH), 200));
    expect(familyChildIds(mainMe)).toContain(childId);
  },
);

test(
  'Family B GET /me does not include family A @api',
  { tag: '@api' },
  async ({ mainApi, altApi }) => {
    const childId = await createTrackedChild(mainApi);

    const familyAMe = expectJsonObject(await expectCatalogJsonResponse(await mainApi.get(ME_PATH), 200));
    const familyAId = familyIdFromMe(familyAMe);
    expect(familyAId).toBeDefined();
    expect(familyChildIds(familyAMe)).toContain(childId);

    const altMeResponse = await altApi.get(ME_PATH);
    expect(altMeResponse.status()).toBe(200);
    const altMeBody: unknown = await altMeResponse.json();
    expect(familyIdFromMe(altMeBody)).toBeDefined();
    expect(familyIdFromMe(altMeBody)).not.toBe(familyAId);
    expect(jsonContainsExactString(altMeBody, childId)).toBe(false);

    await expectOwnerStillHasChild(mainApi, childId);
  },
);

test(
  'Family B GET /availability does not include family A child @api',
  { tag: '@api' },
  async ({ mainApi, altApi }) => {
    const childId = await createTrackedChild(mainApi);
    await expectFamilyBGetOmitsCreatedChild(altApi, AVAILABILITY_PATH, childId);
    await expectOwnerStillHasChild(mainApi, childId);
  },
);

test(
  'Family B GET /playdates does not include family A child @api',
  { tag: '@api' },
  async ({ mainApi, altApi }) => {
    const childId = await createTrackedChild(mainApi);
    await expectFamilyBGetOmitsCreatedChild(altApi, PLAYDATES_PATH, childId);
    await expectOwnerStillHasChild(mainApi, childId);
  },
);

test(
  'Family B GET /matches does not include family A child @api',
  { tag: '@api' },
  async ({ mainApi, altApi }) => {
    const childId = await createTrackedChild(mainApi);
    await expectFamilyBGetOmitsCreatedChild(altApi, MATCHES_PATH, childId);
    await expectOwnerStillHasChild(mainApi, childId);
  },
);

test(
  'Family B GET /events does not include family A child @api',
  { tag: '@api' },
  async ({ mainApi, altApi }) => {
    const childId = await createTrackedChild(mainApi);
    await expectFamilyBGetOmitsCreatedChild(altApi, EVENTS_PATH, childId);
    await expectOwnerStillHasChild(mainApi, childId);
  },
);
