import { type ConnectionRow, connectionFamilyNames } from '../support/api-client';
import { PlaydateCircleFamily } from '../test-data/playdates-propose.enums';
import { expectCatalogJsonResponse, expectJsonObject } from './catalog-contract';
import {
  CONNECTIONS_PATH,
  createTrackedChild,
  expectOwnerStillHasChild,
  familyIdFromMe,
  jsonContainsExactString,
  ME_PATH,
} from './authorization-helpers';
import { expect, test } from './fixtures';

test(
  'AQPBT-14: Family A circle list and Family B /me omit family A child @api',
  { tag: '@api' },
  async ({ mainApi, altApi }) => {
    const childId = await createTrackedChild(mainApi);

    const familyAMe = expectJsonObject(await expectCatalogJsonResponse(await mainApi.get(ME_PATH), 200));
    const familyAId = familyIdFromMe(familyAMe);
    expect(familyAId).toBeDefined();

    const mainConnectionsResponse = await mainApi.get(CONNECTIONS_PATH);
    expect(mainConnectionsResponse.status()).toBe(200);
    const mainConnections = (await mainConnectionsResponse.json()) as ConnectionRow[];
    expect(connectionFamilyNames(mainConnections)).toEqual(
      expect.arrayContaining([PlaydateCircleFamily.Nguyens, PlaydateCircleFamily.Petrovs]),
    );
    expect(jsonContainsExactString(mainConnections, childId)).toBe(false);

    const altConnectionsResponse = await altApi.get(CONNECTIONS_PATH);
    expect(altConnectionsResponse.status()).toBe(200);
    const altConnections = (await altConnectionsResponse.json()) as ConnectionRow[];
    expect(connectionFamilyNames(altConnections)).toContain(PlaydateCircleFamily.Gorfels);

    const altMeResponse = await altApi.get(ME_PATH);
    expect(altMeResponse.status()).toBe(200);
    const altMeBody: unknown = await altMeResponse.json();
    expect(familyIdFromMe(altMeBody)).not.toBe(familyAId);
    expect(jsonContainsExactString(altMeBody, childId)).toBe(false);

    await expectOwnerStillHasChild(mainApi, childId);
  },
);
