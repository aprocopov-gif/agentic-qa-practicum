import {
  expectCatalogJsonResponse,
  expectFieldType,
  expectJsonObject,
  expectUnauthenticatedCatalogGet,
} from './catalog-contract';
import { test } from './fixtures';

const AVAILABILITY_PATH = '/api/v1/availability';

test('GET /api/v1/availability matches catalog contract @api', async ({ mainApi, unauthenticatedApi }) => {
  const response = await mainApi.get(AVAILABILITY_PATH);
  const body = await expectCatalogJsonResponse(response, 200);
  const record = expectJsonObject(body);

  expectFieldType(record, 'rules', 'array');
  expectFieldType(record, 'exceptions', 'array');

  await expectUnauthenticatedCatalogGet(() => unauthenticatedApi.get(AVAILABILITY_PATH));
});
