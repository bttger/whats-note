import argon2 from "argon2";
import { EventEmitter } from "node:events";

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

  fastify.get("/logout", async (request) => {
    await request.session.destroy();
  });

  fastify.post("/login", async (request, reply) => {
    const account = fastify.db
      .prepare("SELECT * FROM accounts WHERE email = ?")
      .get(request.body.email);

    try {
      if (
        account &&
        (await argon2.verify(account.pw_hash, request.body.password))
      ) {
        request.session.authenticated = true;
        request.session.issuedAt = Date.now();
        request.session.accountId = account.id;
        reply.code(201).send({
          email: account.email,
          registeredAt: account.registered_at,
        });
      } else {
        await request.session.destroy();
        reply.code(401).send(new Error("Invalid credentials"));
      }
    } catch (error) {
      await request.session.destroy();
      reply.code(500).send(new Error("Could not verify password"));
    }
  });

  fastify.register(authenticatedEndpoints, {
    apiEnv: { cookieMaxAge: options.apiEnv.cookieMaxAge },
  });
}

/**
 * @param {FastifyInstance} fastify  Encapsulated Fastify Instance
 * @param {Object} options plugin options, refer to https://www.fastify.io/docs/latest/Reference/Plugins/#plugin-options
 */
async function authenticatedEndpoints(fastify, options) {
  const sseEvents = new EventEmitter();
  // Account IDs mapped to IDs of connected clients
  const clients = new Map();

  // Ensure streams get closed gracefully
  // See: https://github.com/fastify/fastify-websocket/issues/45
  const signals = ["SIGINT", "SIGTERM"];
  signals.forEach((signal) => {
    process.once(signal, () => {
      fastify.log.info(
        { signal: signal },
        "received termination signal and close streams"
      );

      clients.forEach((v) => {
        v.forEach((clientId) => {
          sseEvents.emit(clientId, "close");
        });
      });
    });
  });

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

  fastify.post("/events", async (request, reply) => {
    const insertNewEvent = (body) => {
      try {
        if (body.type === "editNote") {
          // Some note related event
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
              body.id,
              body.sentAt,
              Date.now(),
              body.data,
              request.session.accountId
            );
        } else {
          // Some chat related event
          fastify.db
            .prepare(
              `INSERT INTO chat_events (message_id, sent_at, received_at, type, data, from_account)
                VALUES (?, ?, ?, ?, ?, ?)`
            )
            .run(
              body.id,
              body.sentAt,
              Date.now(),
              body.type,
              body.data,
              request.session.accountId
            );
        }

        // Emit SSE event
        const connectedClients = clients.get(request.session.accountId);
        if (Array.isArray(connectedClients) && connectedClients.length) {
          connectedClients.forEach((clientId) => {
            sseEvents.emit(clientId, body);
          });
        }
      } catch (error) {
        reply.code(400).send(new Error("Invalid request body"));
      }
    };

    if (Array.isArray(request.body)) {
      request.body.forEach((e) => insertNewEvent(e));
    } else {
      insertNewEvent(request.body);
    }
  });

  fastify.get("/sync", async (request) => {
    const notesToSync = fastify.db
      .prepare(
        `SELECT id, last_edit AS lastEdit, data
          FROM notes
          WHERE from_account = ? AND received_at >= ?`
      )
      .all(request.session.accountId, request.query.lastSync);

    const chatEventsToSync = fastify.db
      .prepare(
        `SELECT message_id AS messageId, sent_at AS sentAt, type, data
          FROM chat_events
          WHERE from_account = ? AND received_at >= ?
          ORDER BY sent_at`
      )
      .all(request.session.accountId, request.query.lastSync);

    return { notes: notesToSync, chatEvents: chatEventsToSync };
  });

  fastify.get("/listen", async (request, reply) => {
    reply.raw.setHeader("Content-Type", "text/event-stream");
    reply.raw.setHeader("Connection", "keep-alive");
    reply.raw.setHeader("Cache-Control", "no-cache,no-transform");
    reply.raw.setHeader("x-no-compression", 1);
    reply.raw.write("retry: 5000\n\n");

    // Send keep-alive event every 30 seconds
    const intervalHandler = setInterval(
      () => reply.raw.write(`: ${Date.now()}\n\n`),
      30000
    );

    // Add the client to the connected clients list
    const clientId = request.id;
    const accountId = request.session.accountId;
    let connectedClients = clients.get(accountId);
    if (Array.isArray(connectedClients) && connectedClients.length) {
      connectedClients.push(clientId);
    } else {
      clients.set(accountId, [clientId]);
    }
    const removeClient = () => {
      clients.set(
        accountId,
        clients.get(accountId).filter((presentId) => presentId !== clientId)
      );
    };

    // Listen for new events
    const listener = (data) => {
      if (data === "close") {
        reply.raw.end();
      } else {
        reply.raw.write(`data: ${JSON.stringify(data)}\n\n`);
      }
    };
    sseEvents.on(clientId, listener);

    // Clean up the connection
    reply.raw.on("close", () => {
      sseEvents.removeListener(clientId, listener);
      clearInterval(intervalHandler);
      removeClient();
      fastify.log.info({ clientId }, "cleaned up SSE connection");
    });
  });
}
