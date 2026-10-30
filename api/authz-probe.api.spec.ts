import {
  mergeAuthzReports,
  runTicketAuthzProbe,
  type TicketAuthzProbeResult,
} from './authz-probe-helpers';
import { test } from './fixtures';

const AVAILABILITY_PATH = '/api/v1/availability';
const MATCHES_PATH = '/api/v1/matches';
const PLAYDATES_PATH = '/api/v1/playdates';
const CONNECTIONS_PATH = '/api/v1/connections';

const probeResults: TicketAuthzProbeResult[] = [];

test.describe('P60 ticket authz probes', () => {
  test.describe.configure({ mode: 'serial' });

test('AQPBT-8 authz probe @api', { tag: '@api' }, async ({ mainApi, altApi, unauthenticatedApi }) => {
  probeResults.push(
    await runTicketAuthzProbe(
      { ticket: 'AQPBT-8', getPaths: [AVAILABILITY_PATH] },
      mainApi,
      altApi,
      unauthenticatedApi,
    ),
  );
});

test('AQPBT-9 authz probe @api', { tag: '@api' }, async ({ mainApi, altApi, unauthenticatedApi }) => {
  probeResults.push(
    await runTicketAuthzProbe(
      { ticket: 'AQPBT-9', getPaths: [MATCHES_PATH] },
      mainApi,
      altApi,
      unauthenticatedApi,
    ),
  );
});

test('AQPBT-10 authz probe @api', { tag: '@api' }, async ({ mainApi, altApi, unauthenticatedApi }) => {
  probeResults.push(
    await runTicketAuthzProbe(
      { ticket: 'AQPBT-10', getPaths: [PLAYDATES_PATH] },
      mainApi,
      altApi,
      unauthenticatedApi,
    ),
  );
});

test('AQPBT-11 authz probe @api', { tag: '@api' }, async ({ mainApi, altApi, unauthenticatedApi }) => {
  probeResults.push(
    await runTicketAuthzProbe(
      { ticket: 'AQPBT-11', getPaths: [PLAYDATES_PATH] },
      mainApi,
      altApi,
      unauthenticatedApi,
    ),
  );
});

test('AQPBT-12 authz probe @api', { tag: '@api' }, async ({ mainApi, altApi, unauthenticatedApi }) => {
  probeResults.push(
    await runTicketAuthzProbe(
      { ticket: 'AQPBT-12', getPaths: [PLAYDATES_PATH] },
      mainApi,
      altApi,
      unauthenticatedApi,
    ),
  );
});

test('AQPBT-14 authz probe @api', { tag: '@api' }, async ({ mainApi, altApi, unauthenticatedApi }) => {
  probeResults.push(
    await runTicketAuthzProbe(
      { ticket: 'AQPBT-14', getPaths: [CONNECTIONS_PATH] },
      mainApi,
      altApi,
      unauthenticatedApi,
    ),
  );
});

  test.afterAll(() => {
    if (probeResults.length > 0) {
      mergeAuthzReports(probeResults);
    }
  });
});
