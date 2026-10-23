import { deleteTrackedRecord, disposeApiContexts, getApiContext } from './api-client';
import { getTrackedRecords, initTracker } from './record-tracker';

/** Deletes all tracked records via API, logs outcomes, then clears the tracker. */
export async function cleanupCreatedRecords(): Promise<void> {
  const records = getTrackedRecords();
  if (records.length === 0) {
    initTracker();
    await disposeApiContexts();
    return;
  }

  try {
    for (const record of records) {
      const apiContext = await getApiContext(record.owner);
      const result = await deleteTrackedRecord(apiContext, record);

      if (result.ok) {
        if (result.status === 404) {
          console.log(`Already removed ${result.type} ${result.id}`);
        } else {
          console.log(`Deleted ${result.type} ${result.id}`);
        }
      } else {
        console.warn(
          `Failed to delete ${result.type} ${result.id}: HTTP ${result.status}${result.message ? ` — ${result.message}` : ''}`,
        );
      }
    }
  } finally {
    initTracker();
    await disposeApiContexts();
  }
}
