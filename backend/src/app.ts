import cors from "@fastify/cors"
import Fastify, { type FastifyInstance } from "fastify"
import type { PrismaClient } from "@prisma/client"
import { ZodError } from "zod"
import { prisma as defaultPrisma } from "./db/prisma.js"
import { BadRequestError, InvalidStateError } from "./lib/errors.js"
import { MockProvider } from "./provider/mockProvider.js"
import type { Provider } from "./provider/types.js"
import { providerRoutes } from "./routes/provider.js"
import { sessionRoutes } from "./routes/session.js"

declare module "fastify" {
  interface FastifyInstance {
    prisma: PrismaClient
    provider: Provider
  }
}

export interface BuildAppOptions {
  prisma?: PrismaClient
  provider?: Provider
  logger?: boolean
}

export function buildApp(options: BuildAppOptions = {}): FastifyInstance {
  const app = Fastify({ logger: options.logger ?? false })

  app.decorate("prisma", options.prisma ?? defaultPrisma)
  app.decorate("provider", options.provider ?? new MockProvider())

  app.register(cors, { origin: true })

  app.setErrorHandler((error: Error, request, reply) => {
    if (error instanceof ZodError) {
      return reply.code(400).send({
        error: "ValidationError",
        message: "Invalid request body.",
        issues: error.issues,
      })
    }
    if (error instanceof BadRequestError) {
      return reply.code(400).send({ error: "BadRequest", message: error.message })
    }
    if (error instanceof InvalidStateError) {
      return reply.code(409).send({
        error: "InvalidState",
        message: error.message,
        ...(error.details ?? {}),
      })
    }
    request.log.error(error)
    return reply
      .code(500)
      .send({ error: "InternalError", message: "Something went wrong." })
  })

  app.register(sessionRoutes)
  app.register(providerRoutes)

  return app
}
