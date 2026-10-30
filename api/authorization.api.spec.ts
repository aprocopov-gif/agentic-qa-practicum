import { expectCatalogJsonResponse, expectJsonObject } from './catalog-contract';
import {
  ALT_DELETE_OTHER_FAMILY_CHILD_STATUS,
  CHILDREN_PATH,
  CONNECTIONS_PATH,
  createTrackedChild,
  expectFamilyBGetOmitsCreatedChild,
  expectOwnerStillHasChild,
  expectUnauthenticatedGetRejected,
  familyChildIds,
  ME_PATH,
  UNAUTHENTICATED_DELETE_CHILD_STATUS,
} from './authorization-helpers';
import { expect, test } from './fixtures';

const AVAILABILITY_PATH = '/api/v1/availability';
const MATCHES_PATH = '/api/v1/matches';
const PLAYDATES_PATH = '/api/v1/playdates';

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
  'Family B GET /availability does not include family A child @api',
  { tag: '@api' },
  async ({ mainApi, altApi }) => {
    const childId = await createTrackedChild(mainApi);
    await expectFamilyBGetOmitsCreatedChild(altApi, AVAILABILITY_PATH, childId);
    await expectOwnerStillHasChild(mainApi, childId);
  },
);

test(
  'Unauthenticated GET /availability is rejected @api',
  { tag: '@api' },
  async ({ unauthenticatedApi }) => {
    await expectUnauthenticatedGetRejected(unauthenticatedApi, AVAILABILITY_PATH);
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
  'Unauthenticated GET /matches is rejected @api',
  { tag: '@api' },
  async ({ unauthenticatedApi }) => {
    await expectUnauthenticatedGetRejected(unauthenticatedApi, MATCHES_PATH);
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
  'Unauthenticated GET /playdates is rejected @api',
  { tag: '@api' },
  async ({ unauthenticatedApi }) => {
    await expectUnauthenticatedGetRejected(unauthenticatedApi, PLAYDATES_PATH);
  },
);

test(
  'Unauthenticated GET /connections is rejected @api',
  { tag: '@api' },
  async ({ unauthenticatedApi }) => {
    await expectUnauthenticatedGetRejected(unauthenticatedApi, CONNECTIONS_PATH);
  },
);
