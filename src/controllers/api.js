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

  fastify.get("/messages", async (request) => {
    let from =
      messages.length - options.apiEnv.pageSizeMessages > 0
        ? messages.length - options.apiEnv.pageSizeMessages
        : 0;
    let until = messages.length;
    // Pages range from 1 to n
    if (request.query.page) {
      const fromCache =
        messages.length -
        parseInt(request.query.page) * options.apiEnv.pageSizeMessages;
      from = fromCache > 0 ? fromCache : 0;
      const untilCache =
        messages.length -
        (parseInt(request.query.page) - 1) * options.apiEnv.pageSizeMessages;
      until = untilCache > 0 ? untilCache : 0;
    }
    return messages.slice(from, until);
  });

  fastify.post("/messages", async (request) => {
    messages.push(request.body);
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

  fastify.get("/notes/:id", async (request) => {
    const { id } = request.params;
    return notes[id] || "";
  });

  fastify.put("/notes/:id", async (request) => {
    const { id } = request.params;
    notes[id] = request.body;
  });
}
