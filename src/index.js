// Require the framework and instantiate it
import Fastify from "fastify";
import fastifyStatic from "@fastify/static";
import fastifyCookie from "@fastify/cookie";
import fastifySession from "@fastify/session";
import apiRoutes from "./controllers/api.js";

// Get the current directory path in ESM scope
import { fileURLToPath } from "url";
import path from "path";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
server.register(fastifyStatic, { root: path.join(__dirname, "www") });
server.register(apiRoutes, { prefix: "/api" });

const start = async () => {
  try {
    await server.listen({ port: 3000, host: "0.0.0.0" });
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

start();
