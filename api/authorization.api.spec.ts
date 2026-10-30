import { type APIRequestContext } from '@playwright/test';

import { buildChildCreatePayload } from '../test-data/factories/child.factory';
import { expectCatalogJsonResponse, expectJsonObject } from './catalog-contract';
import { expect, test, trackRecord } from './fixtures';

const CHILDREN_PATH = '/api/v1/children';
const ME_PATH = '/api/v1/me';

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

async function createTrackedChild(mainApi: APIRequestContext): Promise<string> {
  const payload = buildChildCreatePayload(String(Date.now()));
  const createResponse = await mainApi.post(CHILDREN_PATH, { data: payload });
  const created = expectJsonObject(await expectCatalogJsonResponse(createResponse, 201));
  const childId = created.id as string;
  trackRecord({ type: 'child', id: childId, owner: 'main' });
  return childId;
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
