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
    const account = fastify.db
      .prepare("SELECT * FROM accounts WHERE email = ?")
      .get(request.body.email);

    try {
      if (await argon2.verify(account.pw_hash, request.body.password)) {
        request.session.authenticated = true;
        request.session.issuedAt = Date.now();
        request.session.accountId = account.id;
        reply.code(201).send({
          email: account.email,
          registeredAt: account.registered_at,
        });
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

    fastify.post("/event", async (request, reply) => {
      if (request.body.type === "editNote") {
        fastify.db
          .prepare(
            `INSERT INTO notes (id, last_edit, received_at, data, from_account)
            VALUES (?, ?, ?, ?, ?)
            ON CONFLICT DO UPDATE SET
                data = excluded.data,
                last_edit = excluded.last_edit,
                received_at = excluded.received_at
            WHERE id = excluded.id AND from_account = excluded.from_account`
          )
          .run(
            request.body.id,
            request.body.sentAt,
            Date.now(),
            request.body.data,
            request.session.accountId
          );
      } else {
        try {
          fastify.db
            .prepare(
              `INSERT INTO message_events (message_id, sent_at, received_at, type, data, from_account)
                VALUES (?, ?, ?, ?, ?, ?)`
            )
            .run(
              request.body.id,
              request.body.sentAt,
              Date.now(),
              request.body.type,
              request.body.data,
              request.session.accountId
            );
        } catch (error) {
          reply.code(400).send(new Error("Invalid request body"));
        }
      }
    });

    fastify.get("/sync", async (request) => {
      const notesToSync = fastify.db
        .prepare(
          `SELECT * FROM notes WHERE from_account = ? AND received_at >= ?`
        )
        .all(request.session.accountId, request.query.lastSync);

      const messageEventsToSync = fastify.db
        .prepare(
          `SELECT * FROM message_events WHERE from_account = ? AND received_at >= ?`
        )
        .all(request.session.accountId, request.query.lastSync);

      return { notes: notesToSync, messages: messageEventsToSync };
    });

    fastify.get("/listen", async (request) => {
      // TODO
    });
  });
}
