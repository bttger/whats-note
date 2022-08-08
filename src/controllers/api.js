/**
 * @param {FastifyInstance} fastify  Encapsulated Fastify Instance
 * @param {Object} options plugin options, refer to https://www.fastify.io/docs/latest/Reference/Plugins/#plugin-options
 */
export default async function apiController(fastify, options) {
  let messages = [];
  const notes = {};

  fastify.addHook("preHandler", async (request, reply) => {
    if (
      !request.session.authenticated &&
      request.url !== "/api/logout" &&
      request.url !== "/api/login"
    ) {
      reply.code(401).send(new Error("Please log in"));
    }
  });

  fastify.get("/logout", async (request, reply) => {
    await request.session.destroy();
    reply.redirect("/login");
  });

  fastify.post("/login", async (request, reply) => {
    if (request.body.password === options.apiEnv.password) {
      request.session.authenticated = true;
    } else {
      reply.code(401).send(new Error("Invalid password"));
    }
  });

  fastify.post("/messages", async (request) => {
    if (!Array.isArray(request.body)) {
      request.body = [request.body];
    }
    messages.push(...request.body);
  });

  fastify.delete("/messages/:id", async (request) => {
    const { id } = request.params;
    messages = messages.filter((m) => m.id !== id);
  });

  fastify.patch("/messages/:id", async (request) => {
    const { id } = request.params;
    const index = messages.findIndex((m) => m.id === id);
    messages[index] = { ...messages[index], ...request.body };
  });

  fastify.put("/notes/:id", async (request) => {
    const { id } = request.params;
    notes[id] = request.body;
  });

  fastify.get("/sync", async (request) => {
    const response = {};

    // Object with the note IDs as keys and their lastSync as value
    const notesLastSync = JSON.parse(request.query.notes);
    for (const id of Array.from(
      { length: options.apiEnv.numberOfNotes },
      (_, i) => i + 1
    )) {
      if (!notesLastSync[id] || notes[id]?.lastEdit > notesLastSync[id]) {
        if (!response.notes && notes[id]) response.notes = {};
        if (notes[id]) response.notes[id] = notes[id];
      }
    }

    // cyrb53 hash value
    const lastMessagesHash = request.query.messages;
    const from =
      messages.length - options.apiEnv.maxMessagesToSync > 0
        ? messages.length - options.apiEnv.maxMessagesToSync
        : 0;
    const lastMessages = messages
      .sort((m1, m2) => (m1.sentAt > m2.sentAt ? 1 : -1))
      .slice(from, messages.length);
    const lastMessagesIds = lastMessages.map((m) => m.id);
    const actualLastMessagesHash = cyrb53(
      JSON.stringify(lastMessagesIds)
    ).toString();
    if (lastMessagesHash !== actualLastMessagesHash) {
      response.messages = lastMessages;
    }

    return response;
  });
}

/*
    cyrb53 (c) 2018 bryc (github.com/bryc)
    A fast and simple hash function with decent collision resistance.
    Largely inspired by MurmurHash2/3, but with a focus on speed/simplicity.
    Public domain. Attribution appreciated.
*/
const cyrb53 = function (str, seed = 0) {
  let h1 = 0xdeadbeef ^ seed,
    h2 = 0x41c6ce57 ^ seed;
  for (let i = 0, ch; i < str.length; i++) {
    ch = str.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 =
    Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^
    Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 =
    Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^
    Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return 4294967296 * (2097151 & h2) + (h1 >>> 0);
};
