import { expectUnauthenticatedGetRejected } from './authz-probe-helpers';
import {
  createTrackedChild,
  expectFamilyBGetOmitsCreatedChild,
  expectOwnerStillHasChild,
} from './authorization-helpers';
import { test } from './fixtures';

const PLAYDATES_PATH = '/api/v1/playdates';

test(
  'AQPBT-11: Family B GET /playdates does not include family A child @api',
  { tag: '@api' },
  async ({ mainApi, altApi }) => {
    const childId = await createTrackedChild(mainApi);
    await expectFamilyBGetOmitsCreatedChild(altApi, PLAYDATES_PATH, childId);
    await expectOwnerStillHasChild(mainApi, childId);
  },
);

test(
  'AQPBT-11: unauthenticated GET /playdates is rejected @api',
  { tag: '@api' },
  async ({ unauthenticatedApi }) => {
    await expectUnauthenticatedGetRejected(unauthenticatedApi, PLAYDATES_PATH);
  },
);
