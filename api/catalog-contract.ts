import { type APIResponse, expect } from '@playwright/test';

/** Status returned for catalog GET endpoints when Authorization is omitted (recorded 2026-10-21). */
export const CATALOG_UNAUTHENTICATED_STATUS = 401;

export async function expectCatalogJsonResponse(
  response: APIResponse,
  expectedStatus: number,
): Promise<unknown> {
  expect(response.status()).toBe(expectedStatus);
  const contentType = response.headers()['content-type'] ?? '';
  expect(contentType.toLowerCase()).toContain('application/json');
  return response.json();
}

export function expectJsonArray(body: unknown): unknown[] {
  expect(Array.isArray(body)).toBe(true);
  return body as unknown[];
}

export function expectJsonObject(body: unknown): Record<string, unknown> {
  expect(body).toEqual(expect.any(Object));
  expect(Array.isArray(body)).toBe(false);
  return body as Record<string, unknown>;
}

export function expectFieldType(
  record: Record<string, unknown>,
  key: string,
  kind: 'string' | 'number' | 'boolean' | 'object' | 'array',
): void {
  expect(record, `missing field ${key}`).toHaveProperty(key);
  const value = record[key];
  if (kind === 'array') {
    expect(Array.isArray(value)).toBe(true);
    return;
  }
  if (kind === 'object') {
    expect(value).toEqual(expect.any(Object));
    expect(Array.isArray(value)).toBe(false);
    return;
  }
  expect(typeof value).toBe(kind);
}

/** Catalog fields that may be JSON null on GET list items (observed on `/api/v1/events`). */
export function expectFieldTypeOrNull(
  record: Record<string, unknown>,
  key: string,
  kind: 'string' | 'number' | 'boolean' | 'object' | 'array',
): void {
  expect(record, `missing field ${key}`).toHaveProperty(key);
  if (record[key] === null) {
    return;
  }
  expectFieldType(record, key, kind);
}

export async function expectUnauthenticatedCatalogGet(
  unauthenticatedGet: () => Promise<APIResponse>,
): Promise<void> {
  const response = await unauthenticatedGet();
  await expectCatalogJsonResponse(response, CATALOG_UNAUTHENTICATED_STATUS);
}
