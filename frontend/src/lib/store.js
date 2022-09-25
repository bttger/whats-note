import { writable } from "svelte/store";
import {
  applyChatEvents,
  insertUnsyncedChatEvent,
  openDB,
  selectMessages,
  selectNote,
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
    syncNotes: async (notes) => {
      for (const note of notes) {
        // TODO check if the lastEdit is behind the client's value and block tx
        if (typeof note.data === "string") {
          note.data = JSON.parse(note.data);
        }
        await (await getDB()).put("notes", note);
      }
    },
    syncChatEvents: async (chatEvents) => {
      await applyChatEvents(await getDB(), chatEvents);
    },
    async sendChatEvent(chatEvent) {
      await this.syncChatEvents([chatEvent]);
      await insertUnsyncedChatEvent(await getDB(), chatEvent);
      const unsyncedEvents = await this.getUnsyncedEvents();
      store.update((s) => {
        s.unsyncedEvents = unsyncedEvents;
      });
      // wenn der client eine neue msg sendet, ruft er sync und dann add auf
      // dann wird getUnsyncedEvents aufgerufen, um die events zu posten
      // wenn erfolgreich, werden die bestimmten events aus der db gelöscht
    },
    loadShownMessages: async (count) => {
      const loadedMessages = await selectMessages(await getDB(), count);
      store.update((s) => {
        if (s.messageCount !== count) {
          s.messageCount = count;
          s.shownMessages = loadedMessages;
        }
        return s;
      });
    },
    getUnsyncedEvents: async () => selectUnsyncedEvents(await getDB()),
  };
}

export const store = createClientDataStore();
