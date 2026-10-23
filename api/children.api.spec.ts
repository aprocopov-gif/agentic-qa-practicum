import { deleteChild } from '../support/api-client';
import { buildChildFirstName } from '../test-data/factories/child.factory';
import { expectCatalogJsonResponse, expectFieldType, expectJsonObject } from './catalog-contract';
import { expect, test } from './fixtures';

const CHILDREN_PATH = '/api/v1/children';
const ME_PATH = '/api/v1/me';

interface CreateChildBody {
  firstName: string;
  birthYear: number;
  birthMonth: number;
  avatarKey: string;
  interests: string[];
}

interface ChildRecord {
  id: string;
  firstName: string;
}

test('creates a child, finds them on GET /api/v1/me, and deletes them @api', async ({ mainApi }) => {
  const firstName = buildChildFirstName(String(Date.now()));
  const createBody: CreateChildBody = {
    firstName,
    birthYear: 2018,
    birthMonth: 6,
    avatarKey: 'fox',
    interests: [],
  };

  const createResponse = await mainApi.post(CHILDREN_PATH, { data: createBody });
  const created = expectJsonObject(await expectCatalogJsonResponse(createResponse, 201));
  expectFieldType(created, 'id', 'string');
  expectFieldType(created, 'firstName', 'string');
  expectFieldType(created, 'birthYear', 'number');
  expectFieldType(created, 'birthMonth', 'number');
  expectFieldType(created, 'age', 'number');
  expect(created).toHaveProperty('gender');
  expectFieldType(created, 'interests', 'array');
  expectFieldType(created, 'avatarKey', 'string');

  const childId = created.id as string;

  const meResponse = await mainApi.get(ME_PATH);
  const meBody = expectJsonObject(await expectCatalogJsonResponse(meResponse, 200));
  const family = expectJsonObject(meBody.family);
  const children = family.children;
  expect(Array.isArray(children)).toBe(true);
  const match = (children as ChildRecord[]).find((child) => child.id === childId && child.firstName === firstName);
  expect(match).toBeDefined();

  const deleteResult = await deleteChild(mainApi, childId);
  expect(deleteResult.ok).toBe(true);
  expect(deleteResult.status).toBe(204);
});
