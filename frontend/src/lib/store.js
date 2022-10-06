import { get, writable } from "svelte/store";
import {
  applyEvents,
  deleteUnsyncedEvent,
  deleteUnsyncedPropFromMessage,
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
    syncEventsInClientDb: async (chatEvents, fromServer = false) => {
      await applyEvents(await getDB(), chatEvents, fromServer);
    },
    async sendEvent(event) {
      await this.syncEventsInClientDb([event]);
      if (event.type === "postMsg") {
        store.update((s) => {
          s.messageCount = s.messageCount + 1;
          return s;
        });
        await this.loadShownMessages(get(store).messageCount);
      }
      await insertUnsyncedEvent(await getDB(), event);
      window.dispatchEvent(new Event("send-event"));
    },
    async finishSendingEvents(events) {
      for (const e of events) {
        await deleteUnsyncedEvent(await getDB(), e.id);
        if (e.type === "postMsg") {
          await deleteUnsyncedPropFromMessage(await getDB(), e.itemId);
          await this.loadShownMessages(get(store).messageCount);
        }
      }
    },
    loadShownMessages: async (count) => {
      const loadedMessages = await selectMessages(await getDB(), count);
      store.update((s) => {
        s.messageCount = count;
        s.shownMessages = loadedMessages;
        return s;
      });
    },
  };
}

export const store = createClientDataStore();
