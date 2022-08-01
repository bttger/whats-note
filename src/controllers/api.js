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
    let skip = 0;
    if (request.query.page) {
      skip = parseInt(request.query.page) * options.apiEnv.pageSizeMessages;
    }
    return messages.slice(skip, options.apiEnv.pageSizeMessages);
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