import {
  applyEvents,
  deleteUnsyncedEvent,
  insertUnsyncedEvent,
  openDB,
  selectMessages,
  selectNote,
  selectUnsyncedEvents,
} from "./idb.js";

const DEFAULT_TAGS = [
  { id: 1, name: "To do", color: "#881337" },
  { id: 2, name: "Read", color: "#713f12" },
  { id: 3, name: "Work", color: "#4c1d95" },
  { id: 4, name: "Remember", color: "#1e3a8a" },
  { id: 5, name: "Buy", color: "#14532d" },
];

const DEFAULT_TABS = [0, 1, 2, 3, 4];

function createClientStore() {
  let tags;
  let tabs;

  let db;
  async function getDB() {
    if (db) {
      return db;
    }
    db = await openDB();
    return db;
  }

  return {
    getTags() {
      if (!tags) {
        let lsTags = window.localStorage.getItem("tags");
        if (!lsTags) {
          this.setTags(DEFAULT_TAGS);
        } else {
          tags = JSON.parse(lsTags);
        }
      }
      return tags;
    },
    setTags: (updatedTags) => {
      window.localStorage.setItem("tags", JSON.stringify(updatedTags));
      tags = updatedTags;
    },
    getTabs() {
      if (!tabs) {
        let lsTabs = window.localStorage.getItem("tabs");
        if (!lsTabs) {
          this.setTabs(DEFAULT_TABS);
        } else {
          tabs = JSON.parse(lsTabs);
        }
      }
      return tabs;
    },
    setTabs: (updatedTabs) => {
      window.localStorage.setItem("tabs", JSON.stringify(updatedTabs));
      tabs = updatedTabs;
    },
    getLastSync: () => {
      let lastSync = parseInt(window.localStorage.getItem("lastSync"));
      if (!lastSync) {
        window.localStorage.setItem("lastSync", "0");
        lastSync = 0;
      }
      return lastSync;
    },
    finishSync: (timestamp) => {
      window.localStorage.setItem(
        "lastSync",
        timestamp ? timestamp : Date.now().toString()
      );
    },
    getUnsyncedEvents: async () => selectUnsyncedEvents(await getDB()),
    async syncEventsInClientDb(chatEvents) {
      if (!chatEvents.length) {
        return;
      }
      await applyEvents(await getDB(), chatEvents);
      window.dispatchEvent(new Event("messages-updated"));
      window.dispatchEvent(new Event("note-updated"));
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
    getLastMessages: async (count, filter) => {
      return await selectMessages(await getDB(), count, filter);
    },
    getNote: async (id) => {
      return await selectNote(await getDB(), id);
    },
  };
}

export const store = createClientStore();
