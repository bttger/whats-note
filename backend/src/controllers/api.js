/**
 * @param {FastifyInstance} fastify  Encapsulated Fastify Instance
 * @param {Object} options plugin options, refer to https://www.fastify.io/docs/latest/Reference/Plugins/#plugin-options
 */
export default async function apiController(fastify, options) {
  fastify.post("/register", async (request, reply) => {
    // TODO
  });

  fastify.get("/logout", async (request, reply) => {
    await request.session.destroy();
    reply.redirect("/");
  });

  fastify.post("/login", async (request, reply) => {
    if (request.body.password === options.apiEnv.password) {
      request.session.authenticated = true;
      request.session.issuedAt = Date.now();
    } else {
      reply.code(401).send(new Error("Invalid password"));
    }
  });

  /**
   * Authenticated endpoints
   */
  fastify.register(async (fastify) => {
    /**
     * Check if user is logged in and if the cookie needs to be renewed
     */
    fastify.addHook("preHandler", async (request, reply) => {
      if (!request.session.authenticated) {
        reply.code(401).send(new Error("Please log in"));
      } else if (
        request.session.issuedAt + options.apiEnv.cookieMaxAge / 2 >
        Date.now()
      ) {
        // Renew the cookie's `expires` value
        request.session.touch();
      }
    });

    fastify.post("/event", async (request) => {
      // TODO
    });

    fastify.get("/sync", async (request) => {
      // TODO
    });

    fastify.get("/listen", async (request) => {
      // TODO
    });
  });
}
