import type { FastifyInstance } from "fastify"
import { ProviderUnavailableError } from "../provider/types.js"

interface ProviderValidateBody {
  accountId: string
  apiKey: string
}

/**
 * Mirrors the literal mock Provider HTTP contract (200/200/200/503) for
 * documentation and contract-testing purposes. The session flow itself
 * calls the Provider interface in-process (see sessionService) and never
 * hits this route over HTTP.
 */
export async function providerRoutes(app: FastifyInstance): Promise<void> {
  app.post<{ Body: ProviderValidateBody }>(
    "/provider/validate",
    async (request, reply) => {
      try {
        const result = await app.provider.validate(
          request.body.accountId,
          request.body.apiKey
        )
        return reply.code(200).send(result)
      } catch (err) {
        if (err instanceof ProviderUnavailableError) {
          return reply.code(503).send({ status: "unavailable", reason: err.message })
        }
        throw err
      }
    }
  )
}
