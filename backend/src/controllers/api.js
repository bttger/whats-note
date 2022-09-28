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

  fastify.post("/events", async (request) => {
    const insertNewEvent = (body) => {
      fastify.db
        .prepare(
          `INSERT INTO events (id, item_id, emitted_at, type, data, received_at, from_account)
            VALUES (?, ?, ?, ?, ?, ?, ?)`
        )
        .run(
          body.id,
          body.itemId,
          body.sentAt,
          body.type,
          body.data,
          Date.now(),
          request.session.accountId
        );

      // Emit SSE event
      const connectedClients = clients.get(request.session.accountId);
      if (Array.isArray(connectedClients) && connectedClients.length) {
        connectedClients.forEach((clientId) => {
          sseEvents.emit(clientId, body);
        });
      }
    };

    if (Array.isArray(request.body)) {
      request.body.forEach((e) => insertNewEvent(e));
    } else {
      insertNewEvent(request.body);
    }
  });

  fastify.get("/sync", async (request) => {
    return fastify.db
      .prepare(
        `SELECT id, item_id AS itemId, emitted_at AS emittedAt, type, data
          FROM events
          WHERE from_account = ? AND received_at >= ?
          ORDER BY emitted_at ASC`
      )
      .all(request.session.accountId, request.query.lastSync);
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
