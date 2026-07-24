import type { FastifyInstance } from "fastify"
import { detailsBodySchema } from "../schemas/details.js"
import { validateBodySchema } from "../schemas/validate.js"
import { SessionService } from "../services/sessionService.js"

export async function sessionRoutes(app: FastifyInstance): Promise<void> {
  const service = new SessionService(app.prisma, app.provider)

  app.get("/api/session", async (_request, reply) => {
    const result = await service.getOrCreateSession()
    return reply.code(200).send(result)
  })

  app.patch("/api/session/details", async (request, reply) => {
    const body = detailsBodySchema.parse(request.body)
    const result = await service.saveDetails(body)
    return reply.code(200).send(result)
  })

  app.post("/api/session/validate", async (request, reply) => {
    const body = validateBodySchema.parse(request.body ?? {})
    const result = await service.validateSession(body)
    return reply.code(200).send(result)
  })

  app.post("/api/session/go-live", async (_request, reply) => {
    const result = await service.goLive()
    return reply.code(200).send(result)
  })

  app.post<{ Params: { itemId: string } }>(
    "/api/session/validate/items/:itemId/retry",
    async (request, reply) => {
      const result = await service.retryItem(request.params.itemId)
      return reply.code(200).send(result)
    }
  )
}
