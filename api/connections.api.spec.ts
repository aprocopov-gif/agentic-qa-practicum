import {
  expectCatalogJsonResponse,
  expectFieldType,
  expectJsonArray,
  expectJsonObject,
  expectUnauthenticatedCatalogGet,
} from './catalog-contract';
import { test } from './fixtures';

const CONNECTIONS_PATH = '/api/v1/connections';

test('GET /api/v1/connections matches catalog contract @api', async ({ mainApi, unauthenticatedApi }) => {
  const response = await mainApi.get(CONNECTIONS_PATH);
  const body = await expectCatalogJsonResponse(response, 200);
  const items = expectJsonArray(body);

  const first = items[0];
  if (first !== undefined) {
    const record = expectJsonObject(first);
    expectFieldType(record, 'id', 'string');
    expectFieldType(record, 'family', 'object');
    expectFieldType(record, 'children', 'array');
    expectFieldType(record, 'communities', 'array');
    expectFieldType(record, 'since', 'string');
    expectFieldType(record, 'status', 'string');
    expectFieldType(record, 'blockedByMe', 'boolean');
  }

  await expectUnauthenticatedCatalogGet(() => unauthenticatedApi.get(CONNECTIONS_PATH));
});
