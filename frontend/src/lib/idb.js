import * as idb from "idb";
import fuzzysearch from "fuzzysearch";

export async function openDB() {
  return await idb.openDB("whats-note", 1, {
    upgrade(db) {
      /**
       * interface Event {
       *   id: string; // 12 characters, generated by nanoid
       *   itemId: string; // Either the message or note ID that the event relates to
       *   emittedAt: number;
       *   type: "editNote" | "postMsg" | "deleteMsg" | "checkMsg" | "uncheckMsg" | "editMsg";
       *   data: string; // JSON stringified event data, e.g. MessageData or NoteData
       * }
       */
      db.createObjectStore("unsyncedEvents", {
        keyPath: "id",
      });

      /**
       * interface Message {
       *   id: string; // 10 characters, generated by nanoid
       *   sentAt: number; // Unix milliseconds
       *   data: MessageData;
       * }
       *
       * interface MessageData {
       *   text: string;
       *   tag: Tag;
       *   checked: boolean;
       * }
       *
       * interface Tag {
       *   id: number;
       *   name: string;
       *   color: string;
       * }
       */
      const messages = db.createObjectStore("messages", {
        keyPath: "id",
      });
      messages.createIndex("sentAt", "sentAt");
      messages.createIndex("unchecked", ["unchecked", "sentAt"]);

      /**
       * interface Note {
       *   id: number;
       *   lastEdit: number; // Unix milliseconds
       *   data: NoteData;
       * }
       *
       * interface NoteData {
       *   text: string;
       * }
       */
      db.createObjectStore("notes", {
        keyPath: "id",
      });
    },
  });
}

export async function selectUnsyncedEvents(db) {
  return await db.getAll("unsyncedEvents");
}

export async function insertUnsyncedEvent(db, chatEvent) {
  await db.put("unsyncedEvents", chatEvent);
}

export async function deleteUnsyncedEvent(db, chatEventId) {
  await db.delete("unsyncedEvents", chatEventId);
}

export async function selectMessages(db, count, filter) {
  const messages = [];

  const unsyncedEvents = await db.getAll("unsyncedEvents");

  let cursor = await db
    .transaction("messages", "readonly")
    .store.index(filter.hideChecked ? "unchecked" : "sentAt")
    .openCursor(null, "prev");

  while (cursor && count > messages.length) {
    // TODO check if it is more performant to use an index on "itemId" and
    //  making an idb request for each message instead of iterating through the list
    if (unsyncedEvents.some((e) => e.itemId === cursor.value.id)) {
      cursor.value.unsynced = true;
    }

    let add = true;
    if (filter.tagId) {
      if (filter.tagId === "undefined" && cursor.value.data.tag) {
        add = false;
      }
      if (
        filter.tagId !== "undefined" &&
        (!cursor.value.data.tag || cursor.value.data.tag.id !== filter.tagId)
      ) {
        add = false;
      }
    }

    if (
      add &&
      filter.search &&
      !fuzzysearch(filter.search, cursor.value.data.text)
    ) {
      add = false;
    }

    if (add) {
      messages.unshift(cursor.value);
    }

    cursor = await cursor.continue();
  }

  return messages;
}

async function updateMessage(db, id, partialMessageDataObj) {
  let message = await db.get("messages", id);
  if (!message) {
    console.log(
      "[idb.js:updateMessage] Could not update message: message not found",
      id,
      partialMessageDataObj
    );
    return;
  }
  message.data = { ...message.data, ...partialMessageDataObj };
  if (message.data.checked) {
    delete message.unchecked;
  } else {
    message.unchecked = 1;
  }
  await db.put("messages", message);
}

export async function applyEvents(db, chatEvents) {
  for (const e of chatEvents) {
    const data = e.data ? JSON.parse(e.data) : null;
    switch (e.type) {
      case "editNote":
        db.put("notes", {
          id: parseInt(e.itemId),
          lastEdit: e.emittedAt,
          data,
        });
        break;
      case "postMsg":
        await db.put("messages", {
          id: e.itemId,
          sentAt: e.emittedAt,
          data: {
            text: data.text,
            tag: data.tag,
            checked: false,
          },
          unchecked: 1, // solely for indexing purposes since IndexedDB doesn't support boolean values
        });
        break;
      case "editMsg":
        await updateMessage(db, e.itemId, data);
        break;
      case "checkMsg":
        await updateMessage(db, e.itemId, { checked: true });
        break;
      case "uncheckMsg":
        await updateMessage(db, e.itemId, { checked: false });
        break;
      case "deleteMsg":
        await db.delete("messages", e.itemId);
        break;
    }
  }
}

export async function selectNote(db, id) {
  return (
    (await db.get("notes", id)) || {
      id,
      data: { text: "" },
      lastEdit: Date.now(),
    }
  );
}
