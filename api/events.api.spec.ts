import {
  expectCatalogJsonResponse,
  expectFieldType,
  expectFieldTypeOrNull,
  expectJsonArray,
  expectJsonObject,
  expectUnauthenticatedCatalogGet,
} from './catalog-contract';
import { test } from './fixtures';

const EVENTS_PATH = '/api/v1/events';

function expectCatalogEventItem(record: Record<string, unknown>): void {
  expectFieldType(record, 'id', 'string');
  expectFieldType(record, 'kind', 'string');
  expectFieldType(record, 'title', 'string');
  expectFieldTypeOrNull(record, 'childId', 'string');
  expectFieldTypeOrNull(record, 'childName', 'string');
  expectFieldType(record, 'startsAt', 'string');
  expectFieldTypeOrNull(record, 'endsAt', 'string');
  expectFieldTypeOrNull(record, 'venueText', 'string');
  expectFieldTypeOrNull(record, 'details', 'string');
  expectFieldType(record, 'cardKey', 'string');
  expectFieldType(record, 'status', 'string');
  expectFieldTypeOrNull(record, 'communityId', 'string');
  expectFieldTypeOrNull(record, 'communityName', 'string');
  expectFieldType(record, 'rsvpToken', 'string');
  expectFieldType(record, 'createdAt', 'string');
  expectFieldType(record, 'canManage', 'boolean');

  const counts = expectJsonObject(record.counts);
  expectFieldType(counts, 'yes', 'number');
  expectFieldType(counts, 'no', 'number');
  expectFieldType(counts, 'maybe', 'number');
  expectFieldType(counts, 'guestsComing', 'number');
}

test('GET /api/v1/events matches catalog contract @api', async ({ mainApi, unauthenticatedApi }) => {
  const response = await mainApi.get(EVENTS_PATH);
  const body = await expectCatalogJsonResponse(response, 200);
  const items = expectJsonArray(body);

  for (const item of items) {
    expectCatalogEventItem(expectJsonObject(item));
  }

  await expectUnauthenticatedCatalogGet(() => unauthenticatedApi.get(EVENTS_PATH));
});
