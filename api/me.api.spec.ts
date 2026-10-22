import {
  expectCatalogJsonResponse,
  expectFieldType,
  expectJsonObject,
  expectUnauthenticatedCatalogGet,
} from './catalog-contract';
import { test } from './fixtures';

const ME_PATH = '/api/v1/me';

test('GET /api/v1/me matches catalog contract @api', async ({ mainApi, unauthenticatedApi }) => {
  const response = await mainApi.get(ME_PATH);
  const body = await expectCatalogJsonResponse(response, 200);
  const record = expectJsonObject(body);

  expectFieldType(record, 'parent', 'object');
  expectFieldType(record, 'family', 'object');
  expectFieldType(record, 'isAdmin', 'boolean');

  await expectUnauthenticatedCatalogGet(() => unauthenticatedApi.get(ME_PATH));
});
