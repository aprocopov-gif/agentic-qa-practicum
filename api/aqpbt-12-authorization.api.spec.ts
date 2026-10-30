import {
  createTrackedChild,
  expectFamilyBGetOmitsCreatedChild,
  expectOwnerStillHasChild,
} from './authorization-helpers';
import { test } from './fixtures';

const PLAYDATES_PATH = '/api/v1/playdates';

test(
  'AQPBT-12: Family B alt GET /playdates does not include family A child @api',
  { tag: '@api' },
  async ({ mainApi, altApi }) => {
    const childId = await createTrackedChild(mainApi);
    await expectFamilyBGetOmitsCreatedChild(altApi, PLAYDATES_PATH, childId);
    await expectOwnerStillHasChild(mainApi, childId);
  },
);
