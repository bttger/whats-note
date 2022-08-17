// Require the framework and instantiate it
import Fastify from "fastify";
import fastifyCookie from "@fastify/cookie";
import fastifySession from "@fastify/session";
import staticController from "./controllers/static.js";
import apiController from "./controllers/api.js";
import sqliteDB from "./sqlite-db.js";

const COOKIE_MAX_AGE =
  parseInt(process.env.COOKIE_MAX_AGE) || 60 * 60 * 24 * 30 * 1000; // default 30 days
const SHUTDOWN_TIMEOUT = 10 * 1000; // default 10 secs

// Initialize Fastify server
const server = Fastify({ logger: true });

// Register all plugins
server.register(fastifyCookie);
server.register(fastifySession, {
  secret: process.env.COOKIE_SECRET,
  cookie: {
    maxAge: COOKIE_MAX_AGE,
    httpOnly: true,
    secure: process.env.COOKIE_SECURE === "true",
  },
});
server.register(staticController);
server.register(sqliteDB);
server.register(apiController, {
  prefix: "/api",
  apiEnv: {
    cookieMaxAge: COOKIE_MAX_AGE,
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
