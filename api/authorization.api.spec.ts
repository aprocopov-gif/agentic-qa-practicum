import { expectCatalogJsonResponse, expectJsonObject } from './catalog-contract';
import {
  ALT_DELETE_OTHER_FAMILY_CHILD_STATUS,
  CHILDREN_PATH,
  createTrackedChild,
  familyChildIds,
  ME_PATH,
  UNAUTHENTICATED_DELETE_CHILD_STATUS,
} from './authorization-helpers';
import { expect, test } from './fixtures';

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
