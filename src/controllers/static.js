import fastifyStatic from "@fastify/static";

// Get the current directory path in ESM scope
import { fileURLToPath } from "url";
import path from "path";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.resolve(path.dirname(__filename), "../");

/**
 * @param {FastifyInstance} fastify  Encapsulated Fastify Instance
 */
export default async function staticController(fastify) {
  fastify.addHook("preHandler", async (request, reply) => {
    console.log(request.session.authenticated);
    if (
      !request.session.authenticated &&
      request.url !== "/login" &&
      !request.url.startsWith("/images")
    ) {
      reply.redirect("/login");
    }
  });

  fastify.register(fastifyStatic, { root: path.join(__dirname, "www") });
}
