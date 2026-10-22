import {
  expectCatalogJsonResponse,
  expectFieldType,
  expectJsonArray,
  expectJsonObject,
  expectUnauthenticatedCatalogGet,
} from './catalog-contract';
import { test } from './fixtures';

const EVENTS_PATH = '/api/v1/events';

test('GET /api/v1/events matches catalog contract @api', async ({ mainApi, unauthenticatedApi }) => {
  const response = await mainApi.get(EVENTS_PATH);
  const body = await expectCatalogJsonResponse(response, 200);
  const items = expectJsonArray(body);

  const first = items[0];
  if (first !== undefined) {
    const record = expectJsonObject(first);
    expectFieldType(record, 'id', 'string');
    expectFieldType(record, 'kind', 'string');
    expectFieldType(record, 'title', 'string');
    expectFieldType(record, 'childId', 'object');
    expectFieldType(record, 'childName', 'object');
    expectFieldType(record, 'startsAt', 'string');
    expectFieldType(record, 'endsAt', 'object');
    expectFieldType(record, 'venueText', 'string');
    expectFieldType(record, 'details', 'string');
    expectFieldType(record, 'cardKey', 'string');
  }

  await expectUnauthenticatedCatalogGet(() => unauthenticatedApi.get(EVENTS_PATH));
});
