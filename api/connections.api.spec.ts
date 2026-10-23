import {
  expectCatalogJsonResponse,
  expectFieldType,
  expectJsonArray,
  expectJsonObject,
  expectUnauthenticatedCatalogGet,
} from './catalog-contract';
import { test } from './fixtures';

const CONNECTIONS_PATH = '/api/v1/connections';

/** Top-level list item fields from api/CATALOG.md (executed 2026-10-21); nested `family` not expanded. */
function expectCatalogConnectionItem(record: Record<string, unknown>): void {
  expectFieldType(record, 'id', 'string');
  expectFieldType(record, 'family', 'object');
  expectFieldType(record, 'children', 'array');
  expectFieldType(record, 'communities', 'array');
  expectFieldType(record, 'since', 'string');
  expectFieldType(record, 'status', 'string');
  expectFieldType(record, 'blockedByMe', 'boolean');
}

test('GET /api/v1/connections matches catalog contract @api', async ({ mainApi, unauthenticatedApi }) => {
  const response = await mainApi.get(CONNECTIONS_PATH);
  const body = await expectCatalogJsonResponse(response, 200);
  const items = expectJsonArray(body);

  for (const item of items) {
    expectCatalogConnectionItem(expectJsonObject(item));
  }

  await expectUnauthenticatedCatalogGet(() => unauthenticatedApi.get(CONNECTIONS_PATH));
});
