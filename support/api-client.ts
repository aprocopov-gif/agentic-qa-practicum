import fs from 'node:fs';
import path from 'node:path';

import { type APIRequestContext, type APIResponse, request } from '@playwright/test';

import { AUTH_FILE, ALT_AUTH_FILE } from './auth.constants';
import type { RecordOwner, TrackedRecord, TrackedRecordType } from './record-tracker';

const AVAILABILITY_EXCEPTIONS_PATH = '/api/v1/availability/exceptions';
const CHILDREN_PATH = '/api/v1/children';
const PLAYDATES_PATH = '/api/v1/playdates';

export interface DeleteRecordResult {
  type: TrackedRecordType;
  id: string;
  ok: boolean;
  status: number;
  message: string;
}

function resolveStorageStatePath(owner: RecordOwner): string {
  return owner === 'main' ? AUTH_FILE : ALT_AUTH_FILE;
}

function bearerFromStorageState(storageStatePath: string): string {
  const absolute = path.isAbsolute(storageStatePath)
    ? storageStatePath
    : path.join(process.cwd(), storageStatePath);
  const raw = JSON.parse(fs.readFileSync(absolute, 'utf8')) as {
    origins?: Array<{ localStorage?: Array<{ name: string; value: string }> }>;
  };

  for (const origin of raw.origins ?? []) {
    const entry = origin.localStorage?.find((item) => item.name === 'bt_token');
    if (entry?.value) {
      return entry.value;
    }
  }

  throw new Error(`bt_token not found in storage state at ${storageStatePath}`);
}

function requireAppUrl(): string {
  const baseURL = process.env.APP_URL;
  if (!baseURL) {
    throw new Error('APP_URL must be set for API cleanup');
  }
  return baseURL;
}

const contextByOwner = new Map<RecordOwner, APIRequestContext>();

/** Playwright request context for the given family (cached until dispose). */
export async function createApiContextForOwner(owner: RecordOwner): Promise<APIRequestContext> {
  return getApiContext(owner);
}

/** Playwright request context for the given family (cached until dispose). */
export async function getApiContext(owner: RecordOwner): Promise<APIRequestContext> {
  const existing = contextByOwner.get(owner);
  if (existing) {
    return existing;
  }

  const storageState = resolveStorageStatePath(owner);
  const token = bearerFromStorageState(storageState);
  const apiContext = await request.newContext({
    baseURL: requireAppUrl(),
    storageState,
    extraHTTPHeaders: {
      Authorization: `Bearer ${token}`,
    },
  });

  contextByOwner.set(owner, apiContext);
  return apiContext;
}

export async function disposeApiContexts(): Promise<void> {
  await Promise.all([...contextByOwner.values()].map((ctx) => ctx.dispose()));
  contextByOwner.clear();
}

async function readErrorMessage(response: APIResponse): Promise<string> {
  try {
    const text = await response.text();
    return text.trim() || response.statusText();
  } catch {
    return response.statusText();
  }
}

export interface CreateChildPayload {
  firstName: string;
  birthYear: number;
  birthMonth: number;
  avatarKey: string;
  interests: string[];
  gender?: string;
}

export interface CreateChildResult {
  id: string;
  firstName: string;
  ok: boolean;
  status: number;
  message: string;
}

/** Creates one child (discovery: POST /api/v1/children). */
export async function createChild(
  apiContext: APIRequestContext,
  payload: CreateChildPayload,
): Promise<CreateChildResult> {
  const response = await apiContext.post(CHILDREN_PATH, { data: payload });
  const ok = response.ok();
  const message = ok ? '' : await readErrorMessage(response);
  if (!ok) {
    return { id: '', firstName: payload.firstName, ok, status: response.status(), message };
  }
  const body = (await response.json()) as { id: string; firstName: string };
  return {
    id: body.id,
    firstName: body.firstName,
    ok,
    status: response.status(),
    message,
  };
}

/** Deletes one child (discovery: DELETE /api/v1/children/{id}). */
export async function deleteChild(apiContext: APIRequestContext, id: string): Promise<DeleteRecordResult> {
  const response = await apiContext.delete(`${CHILDREN_PATH}/${id}`);
  const ok = response.ok() || response.status() === 204;
  const message = ok ? '' : await readErrorMessage(response);

  return {
    type: 'child',
    id,
    ok,
    status: response.status(),
    message,
  };
}

/** Deletes one availability exception (discovery: DELETE /api/v1/availability/exceptions/{id}). */
export async function deleteAvailabilityException(
  apiContext: APIRequestContext,
  id: string,
): Promise<DeleteRecordResult> {
  const response = await apiContext.delete(`${AVAILABILITY_EXCEPTIONS_PATH}/${id}`);
  const ok = response.ok() || response.status() === 204;
  const message = ok ? '' : await readErrorMessage(response);

  return {
    type: 'availability_exception',
    id,
    ok,
    status: response.status(),
    message,
  };
}

/** Cancels one playdate (discovery: POST /api/v1/playdates/{id}/cancel). */
export async function cancelPlaydate(apiContext: APIRequestContext, id: string): Promise<DeleteRecordResult> {
  const response = await apiContext.post(`${PLAYDATES_PATH}/${id}/cancel`);
  const message = response.ok() ? '' : await readErrorMessage(response);
  const ok =
    response.ok() ||
    (response.status() === 400 && message.includes('cannot be cancelled'));

  return {
    type: 'playdate',
    id,
    ok,
    status: response.status(),
    message,
  };
}

/** Deletes a tracked record using the appropriate API for its type. */
export async function deleteTrackedRecord(
  apiContext: APIRequestContext,
  record: TrackedRecord,
): Promise<DeleteRecordResult> {
  if (record.type === 'availability_exception') {
    return deleteAvailabilityException(apiContext, record.id);
  }
  if (record.type === 'child') {
    return deleteChild(apiContext, record.id);
  }
  if (record.type === 'playdate') {
    return cancelPlaydate(apiContext, record.id);
  }

  const unknownType: never = record.type;
  return {
    type: unknownType,
    id: record.id,
    ok: false,
    status: 0,
    message: `No delete handler for record type ${String(unknownType)}`,
  };
}
