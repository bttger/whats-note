/**
 * @param {FastifyInstance} fastify  Encapsulated Fastify Instance
 * @param {Object} options plugin options, refer to https://www.fastify.io/docs/latest/Reference/Plugins/#plugin-options
 */
export default async function routes(fastify) {
  fastify.get("/", async (request, reply) => {
    request.session.authenticated = true;
    reply.send({ hello: "world" });
  });
}
