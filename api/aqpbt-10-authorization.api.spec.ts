import { getMe, getPlaydates } from '../support/api-client';
import { expectUnauthenticatedGetRejected } from './authz-probe-helpers';
import { PlaydateCircleFamily } from '../test-data/playdates-propose.enums';
import {
  createTrackedChild,
  createTrackedPlaydate,
  expectFamilyBGetOmitsCreatedChild,
  expectOwnerStillHasChild,
  findPlaydateById,
} from './authorization-helpers';
import { expect, test } from './fixtures';

const PLAYDATES_PATH = '/api/v1/playdates';

test(
  'AQPBT-10: Family B GET /playdates does not include family A child @api',
  { tag: '@api' },
  async ({ mainApi, altApi }) => {
    const childId = await createTrackedChild(mainApi);
    await expectFamilyBGetOmitsCreatedChild(altApi, PLAYDATES_PATH, childId);
    await expectOwnerStillHasChild(mainApi, childId);
  },
);

test(
  'AQPBT-10: Family B cannot cancel family A playdate @api',
  { tag: '@api' },
  async ({ mainApi, altApi }) => {
    const mainChild = (await getMe(mainApi)).family?.children?.[0];
    expect(mainChild?.firstName).toBeTruthy();
    const locationNote = `AQPBT10-authz-${Date.now()} park`;
    const playdateId = await createTrackedPlaydate(mainApi, 'main', {
      circleFamilyName: PlaydateCircleFamily.Nguyens,
      childFirstName: mainChild!.firstName,
      locationNote,
    });

    const altCancelResponse = await altApi.post(`${PLAYDATES_PATH}/${playdateId}/cancel`);
    expect(altCancelResponse.status()).toBeGreaterThanOrEqual(400);

    const list = await getPlaydates(mainApi);
    const ownerRow = findPlaydateById(list, playdateId);
    expect(ownerRow?.status).not.toBe('cancelled');
  },
);

test(
  'AQPBT-10: unauthenticated GET /playdates is rejected @api',
  { tag: '@api' },
  async ({ unauthenticatedApi }) => {
    await expectUnauthenticatedGetRejected(unauthenticatedApi, PLAYDATES_PATH);
  },
);
