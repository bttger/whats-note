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
    numberOfNotes: 5,
  },
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
