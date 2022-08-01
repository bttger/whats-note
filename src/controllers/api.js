/**
 * @param {FastifyInstance} fastify  Encapsulated Fastify Instance
 * @param {Object} options plugin options, refer to https://www.fastify.io/docs/latest/Reference/Plugins/#plugin-options
 */
export default async function apiController(fastify, options) {
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
}
