import {
  expectCatalogJsonResponse,
  expectFieldType,
  expectJsonArray,
  expectJsonObject,
  expectUnauthenticatedCatalogGet,
} from './catalog-contract';
import { expect, test } from './fixtures';

const COMMUNITIES_PATH = '/api/v1/communities';

function assertCommunityListItem(record: Record<string, unknown>): void {
  expectFieldType(record, 'id', 'string');
  expectFieldType(record, 'name', 'string');
  expectFieldType(record, 'type', 'string');
  expectFieldType(record, 'description', 'string');
  expectFieldType(record, 'myRole', 'string');
  expectFieldType(record, 'myStatus', 'string');
  expectFieldType(record, 'familiesCount', 'number');
  expectFieldType(record, 'pendingCount', 'number');
  expectFieldType(record, 'createdAt', 'string');
}

test('GET /api/v1/communities matches catalog contract @api', async ({ mainApi, unauthenticatedApi }) => {
  const response = await mainApi.get(COMMUNITIES_PATH);
  const body = await expectCatalogJsonResponse(response, 200);
  const items = expectJsonArray(body);

  const first = items[0];
  if (first !== undefined) {
    assertCommunityListItem(expectJsonObject(first));
  }

  await expectUnauthenticatedCatalogGet(() => unauthenticatedApi.get(COMMUNITIES_PATH));
});

test('GET /api/v1/communities/{id} matches catalog contract @api', async ({ mainApi, unauthenticatedApi }) => {
  const listResponse = await mainApi.get(COMMUNITIES_PATH);
  const listBody = await expectCatalogJsonResponse(listResponse, 200);
  const items = expectJsonArray(listBody);
  const first = items[0];
  expect(first, 'need at least one community from GET /api/v1/communities to exercise detail route').toBeDefined();
  const communityId = expectJsonObject(first).id as string;

  const detailResponse = await mainApi.get(`${COMMUNITIES_PATH}/${communityId}`);
  const detailBody = await expectCatalogJsonResponse(detailResponse, 200);
  const detail = expectJsonObject(detailBody);

  assertCommunityListItem(detail);
  expectFieldType(detail, 'members', 'array');

  await expectUnauthenticatedCatalogGet(() => unauthenticatedApi.get(`${COMMUNITIES_PATH}/${communityId}`));
});
