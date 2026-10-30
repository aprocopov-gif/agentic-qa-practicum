import { expectUnauthenticatedGetRejected } from './authz-probe-helpers';
import {
  createTrackedChild,
  expectFamilyBGetOmitsCreatedChild,
  expectOwnerStillHasChild,
} from './authorization-helpers';
import { test } from './fixtures';

const AVAILABILITY_PATH = '/api/v1/availability';

test(
  'AQPBT-8: Family B GET /availability does not include family A child @api',
  { tag: '@api' },
  async ({ mainApi, altApi }) => {
    const childId = await createTrackedChild(mainApi);
    await expectFamilyBGetOmitsCreatedChild(altApi, AVAILABILITY_PATH, childId);
    await expectOwnerStillHasChild(mainApi, childId);
  },
);

test(
  'AQPBT-8: unauthenticated GET /availability is rejected @api',
  { tag: '@api' },
  async ({ unauthenticatedApi }) => {
    await expectUnauthenticatedGetRejected(unauthenticatedApi, AVAILABILITY_PATH);
  },
);
