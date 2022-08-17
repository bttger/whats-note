// Require the framework and instantiate it
import Fastify from "fastify";
import fastifyCookie from "@fastify/cookie";
import fastifySession from "@fastify/session";
import staticController from "./controllers/static.js";
import apiController from "./controllers/api.js";

// Initialize Fastify server
const server = Fastify({ logger: true });

// Register all plugins
server.register(fastifyCookie);
server.register(fastifySession, {
  secret: process.env.COOKIE_SECRET,
  cookie: {
    maxAge: 60 * 60 * 24 * 30 * 1000, // 30 days
    httpOnly: true,
    secure: process.env.COOKIE_SECURE === "true",
  },
});
server.register(staticController);
server.register(apiController, {
  prefix: "/api",
  apiEnv: {
    password: process.env.PASSWORD,
    maxMessagesToSync: process.env.MAX_MESSAGES_TO_SYNC || 20,
    dbFileName: process.env.DB_FILE_NAME || "whatsnote_db.json",
    numberOfNotes: 5,
  },
});

// Ensure graceful shutdown
const signals = ["SIGINT", "SIGTERM"];
signals.forEach((signal) => {
  process.once(signal, () => {
    server.log.info({ signal: signal }, "received termination signal");

    // Make sure server terminates after timeout
    setTimeout(() => {
      server.log.error(
        { signal: signal, timeout: SHUTDOWN_TIMEOUT },
        "terminate process after timeout"
      );
      process.exit(1);
    }, SHUTDOWN_TIMEOUT).unref();

    server.close();
  });
});

const start = async () => {
  try {
    await server.listen({ port: 3000, host: "0.0.0.0" });
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

start();
