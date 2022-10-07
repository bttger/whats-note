import { writable } from "svelte/store";
import {
  applyEvents,
  deleteUnsyncedEvent,
  insertUnsyncedEvent,
  openDB,
  selectMessages,
  selectUnsyncedEvents,
} from "./idb.js";

function createClientDataStore() {
  const store = writable({
    shownMessages: [],
    shownNote: null,
    messageCount: 0,
  });

  let db;
  async function getDB() {
    if (db) {
      return db;
    }
    db = await openDB();
    return db;
  }

  return {
    ...store,
    getLastSync: () => {
      let lastSync = parseInt(window.localStorage.getItem("lastSync"));
      if (!lastSync) {
        window.localStorage.setItem("lastSync", "0");
        lastSync = 0;
      }
      return lastSync;
    },
    finishSync: () => {
      window.localStorage.setItem("lastSync", Date.now().toString());
    },
    getUnsyncedEvents: async () => selectUnsyncedEvents(await getDB()),
    async syncEventsInClientDb(chatEvents) {
      await applyEvents(await getDB(), chatEvents);
      window.dispatchEvent(new Event("messages-updated"));
    },
    async sendEvent(event) {
      await insertUnsyncedEvent(await getDB(), event);
      await this.syncEventsInClientDb([event]);
      window.dispatchEvent(new Event("unsynced-event-pushed"));
    },
    async finishSendingEvents(events) {
      for (const e of events) {
        await deleteUnsyncedEvent(await getDB(), e.id);
      }
      // A "synced" status may be updated, so we need to let the listeners know
      window.dispatchEvent(new Event("messages-updated"));
    },
    getLastMessages: async (count) => {
      return await selectMessages(await getDB(), count);
    },
  };
}

export const store = createClientDataStore();
