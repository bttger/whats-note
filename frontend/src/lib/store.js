import { writable } from "svelte/store";
import {
  applyChatEvents,
  openDB,
  selectMessages,
  selectNote,
  selectUnsyncedEvents,
} from "./idb.js";

function createClientDataStore() {
  const { subscribe, update } = writable({
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
  }

  return {
    subscribe,
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
    addUnsyncedChatEvent: async (chatEvent) => {
      // wenn der client eine neue msg sendet, ruft er sync und dann add auf
      // dann wird getUnsyncedEvents aufgerufen, um die events zu posten
      // wenn erfolgreich, werden die bestimmten events aus der db gelöscht
    },
    loadShownMessages: async (count) => {
      update(async (store) => {
        if (store.messageCount !== count) {
          store.messageCount = count;
          store.shownMessages = await selectMessages(await getDB(), count);
        }
        return store;
      });
    },
    getUnsyncedEvents: async () => selectUnsyncedEvents(await getDB()),
  };
}

export const store = createClientDataStore();
