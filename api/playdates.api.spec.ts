import {
  expectCatalogJsonResponse,
  expectFieldType,
  expectJsonArray,
  expectJsonObject,
  expectUnauthenticatedCatalogGet,
} from './catalog-contract';
import { test } from './fixtures';

const PLAYDATES_PATH = '/api/v1/playdates';

test('GET /api/v1/playdates matches catalog contract @api', async ({ mainApi, unauthenticatedApi }) => {
  const response = await mainApi.get(PLAYDATES_PATH);
  const body = await expectCatalogJsonResponse(response, 200);
  const items = expectJsonArray(body);

  const first = items[0];
  if (first !== undefined) {
    const record = expectJsonObject(first);
    expectFieldType(record, 'id', 'string');
    expectFieldType(record, 'status', 'string');
    expectFieldType(record, 'startsAt', 'string');
    expectFieldType(record, 'endsAt', 'string');
    expectFieldType(record, 'locationKind', 'string');
    expectFieldType(record, 'locationText', 'object');
    expectFieldType(record, 'notes', 'string');
    expectFieldType(record, 'proposerFamily', 'object');
    expectFieldType(record, 'inviteeFamily', 'object');
    expectFieldType(record, 'otherFamily', 'object');
    expectFieldType(record, 'hostFamily', 'object');
    expectFieldType(record, 'children', 'array');
    expectFieldType(record, 'proposedBy', 'object');
    expectFieldType(record, 'respondedAt', 'string');
    expectFieldType(record, 'cancelledAt', 'string');
    expectFieldType(record, 'googleCalendarUrl', 'string');
    expectFieldType(record, 'icsUrl', 'string');
    expectFieldType(record, 'canRespond', 'boolean');
    expectFieldType(record, 'canCancel', 'boolean');
  }

  await expectUnauthenticatedCatalogGet(() => unauthenticatedApi.get(PLAYDATES_PATH));
});
