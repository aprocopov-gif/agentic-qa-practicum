import {
  expectCatalogJsonResponse,
  expectFieldType,
  expectJsonArray,
  expectJsonObject,
  expectUnauthenticatedCatalogGet,
} from './catalog-contract';
import { test } from './fixtures';

const MATCHES_PATH = '/api/v1/matches';

test('GET /api/v1/matches matches catalog contract @api', async ({ mainApi, unauthenticatedApi }) => {
  const response = await mainApi.get(MATCHES_PATH);
  const body = await expectCatalogJsonResponse(response, 200);
  const items = expectJsonArray(body);

  const first = items[0];
  if (first !== undefined) {
    const record = expectJsonObject(first);
    expectFieldType(record, 'date', 'string');
    expectFieldType(record, 'startMin', 'number');
    expectFieldType(record, 'endMin', 'number');
    expectFieldType(record, 'startsAt', 'string');
    expectFieldType(record, 'endsAt', 'string');
    expectFieldType(record, 'family', 'object');
    expectFieldType(record, 'suggestedHost', 'object');
    expectFieldType(record, 'locationKind', 'string');
  }

  await expectUnauthenticatedCatalogGet(() => unauthenticatedApi.get(MATCHES_PATH));
});
