import argon2 from "argon2";

/**
 * @param {FastifyInstance} fastify  Encapsulated Fastify Instance
 * @param {Object} options plugin options, refer to https://www.fastify.io/docs/latest/Reference/Plugins/#plugin-options
 */
export default async function apiController(fastify, options) {
  fastify.post("/register", async (request, reply) => {
    const registeredAt = Date.now();
    try {
      fastify.db
        .prepare(
          "INSERT INTO accounts (email, pw_hash, registered_at) VALUES (?, ?, ?)"
        )
        .run(
          request.body.email,
          await argon2.hash(request.body.password, { type: argon2.argon2i }),
          registeredAt
        );
    } catch (error) {
      reply.code(409).send(new Error("Email not available"));
    }
    reply.code(201).send({ email: request.body.email, registeredAt });
  });

  fastify.get("/logout", async (request, reply) => {
    await request.session.destroy();
    reply.redirect("/");
  });

  fastify.post("/login", async (request, reply) => {
    const pw_hash = fastify.db
      .prepare("SELECT pw_hash FROM accounts WHERE email = ?")
      .pluck()
      .get(request.body.email);

    try {
      if (await argon2.verify(pw_hash, request.body.password)) {
        request.session.authenticated = true;
        request.session.issuedAt = Date.now();
        reply.code(201).send({ email: request.body.email });
      } else {
        await request.session.destroy();
        reply.code(401).send(new Error("Invalid password"));
      }
    } catch (error) {
      await request.session.destroy();
      reply.code(500).send(new Error("Could not verify password"));
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
