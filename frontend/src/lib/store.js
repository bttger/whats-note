import {
  applyEvents,
  deleteUnsyncedEvent,
  insertUnsyncedEvent,
  openDB,
  selectMessages,
  selectNote,
  selectUnsyncedEvents,
} from "./idb.js";

function createClientStore() {
  let db;
  async function getDB() {
    if (db) {
      return db;
    }
    db = await openDB();
    return db;
  }

  return {
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
      if (!chatEvents.length) {
        return;
      }
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
    getNote: async (id) => {
      return await selectNote(await getDB(), id);
    },
  };
}

export const store = createClientStore();
