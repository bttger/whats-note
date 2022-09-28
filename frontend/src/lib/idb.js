import * as idb from "idb";

export async function openDB() {
  return await idb.openDB("whats-note", 1, {
    upgrade(db) {
      /**
       * interface Event {
       *   id: string;
       *   itemId: string; // Either the message or note ID that the event relates to
       *   emittedAt: number;
       *   type: "editNote" | "postMsg" | "deleteMsg" | "checkMsg" | "uncheckMsg" | "editMsg";
       *   data: string; // JSON stringified event data, e.g. MessageData or NoteData
       *   isSyncing?: boolean;
       * }
       */
      const unsyncedEvents = db.createObjectStore("unsyncedEvents", {
        keyPath: "id",
      });
      unsyncedEvents.createIndex("isSyncing", "isSyncing");

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
  const events = await db.getAll("unsyncedChatEvents");
  const unsyncedNotes = await db.getAllFromIndex("notes", "unsynced");
  events.concat(
    unsyncedNotes.map((n) => ({
      type: "editNote",
      id: n.id,
      sentAt: n.lastEdit,
      data: n.data,
    }))
  );
  return events;
}

export async function insertUnsyncedChatEvent(db, chatEvent) {
  await db.put("unsyncedChatEvents", chatEvent);
}

export async function selectMessages(db, count) {
  const messages = [];

  let cursor = await db
    .transaction("messages", "readonly")
    .store.index("sentAt")
    .openCursor(null, "prev");

  while (cursor && count > messages.length) {
    messages.unshift(cursor.value);
    cursor = await cursor.continue();
  }

  return messages;
}

async function updateMessage(db, id, partialMessageObj) {
  let message = await db.get("messages", id);
  message = { ...message, ...partialMessageObj };
  await db.put("messages", message);
}

export async function applyChatEvents(db, chatEvents) {
  for (const e of chatEvents) {
    const data = e.data ? JSON.parse(e.data) : null;
    switch (e.type) {
      case "postMsg":
        await db.put("messages", {
          id: e.id,
          sentAt: e.sentAt,
          text: data.text,
          tag: data.tag,
          checked: data.checked,
        });
        break;
      case "editMsg":
        await updateMessage(db, e.id, JSON.parse(e.data));
        break;
      case "checkMsg":
        await updateMessage(db, e.id, { checked: true });
        break;
      case "uncheckMsg":
        await updateMessage(db, e.id, { checked: false });
        break;
      case "deleteMsg":
        await db.delete("messages", e.id);
        break;
    }
  }
}

export async function selectNote(db, id) {
  return (
    (await db.get("notes", id)) || {
      id,
      text: "",
      lastEdit: Date.now(),
      unsynced: 0,
    }
  );
}

export async function selectNotes(db) {
  return await db.getAll("notes");
}

export async function startUpdateNote(db, id, text) {
  const note = await selectNote(db, id);
  note.text = text;
  note.lastEdit = Date.now();
  note.isSyncing = 1;
  note.unsynced = 1;
  await db.put("notes", note);
  return note;
}

export async function finishUpdateNote(db, id, error = false) {
  const note = await selectNote(db, id);
  note.isSyncing = 0;
  note.unsynced = error ? 1 : 0;
  note.lastSync = error ? note.lastSync : Date.now();
  await db.put("notes", note);
  return note;
}
