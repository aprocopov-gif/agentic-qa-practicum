import {
  createTrackedChild,
  expectFamilyBGetOmitsCreatedChild,
  expectOwnerStillHasChild,
} from './authorization-helpers';
import { test } from './fixtures';

const MATCHES_PATH = '/api/v1/matches';

test(
  'AQPBT-9: Family B GET /matches does not include family A child @api',
  { tag: '@api' },
  async ({ mainApi, altApi }) => {
    const childId = await createTrackedChild(mainApi);
    await expectFamilyBGetOmitsCreatedChild(altApi, MATCHES_PATH, childId);
    await expectOwnerStillHasChild(mainApi, childId);
  },
);
