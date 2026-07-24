import cors from "@fastify/cors"
import Fastify, { type FastifyInstance, type FastifyServerOptions } from "fastify"
import type { PrismaClient } from "@prisma/client"
import { ZodError } from "zod"
import { prisma as defaultPrisma } from "./db/prisma.js"
import { BadRequestError, InvalidStateError, NotFoundError } from "./lib/errors.js"
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
  logger?: FastifyServerOptions["logger"]
}

export function buildApp(options: BuildAppOptions = {}): FastifyInstance {
  const app = Fastify({ logger: options.logger ?? false })

  app.decorate("prisma", options.prisma ?? defaultPrisma)
  app.decorate("provider", options.provider ?? new MockProvider())

  app.register(cors, { origin: true })

  app.setErrorHandler((error: Error, request, reply) => {
    if (error instanceof ZodError) {
      request.log.warn({ issues: error.issues }, "rejected invalid request body")
      return reply.code(400).send({
        error: "ValidationError",
        message: "Invalid request body.",
        issues: error.issues,
      })
    }
    if (error instanceof BadRequestError) {
      request.log.warn({ err: error }, error.message)
      return reply.code(400).send({ error: "BadRequest", message: error.message })
    }
    if (error instanceof NotFoundError) {
      request.log.warn({ err: error }, error.message)
      return reply.code(404).send({ error: "NotFound", message: error.message })
    }
    if (error instanceof InvalidStateError) {
      request.log.warn({ err: error, ...(error.details ?? {}) }, error.message)
      return reply.code(409).send({
        error: "InvalidState",
        message: error.message,
        ...(error.details ?? {}),
      })
    }
    // Fastify itself throws for things like malformed JSON bodies, already
    // tagged with a 4xx statusCode - honor that instead of masking it as 500.
    // Distinct error code from BadRequestError so clients (and tests) can
    // tell "your JSON didn't parse" apart from a business-rule rejection.
    const statusCode = (error as { statusCode?: number }).statusCode
    if (typeof statusCode === "number" && statusCode >= 400 && statusCode < 500) {
      request.log.warn({ err: error }, "rejected malformed request")
      return reply.code(statusCode).send({
        error: "MalformedRequest",
        message: "Malformed request.",
      })
    }

    request.log.error({ err: error }, "unhandled error")
    return reply
      .code(500)
      .send({ error: "InternalError", message: "Something went wrong." })
  })

  app.register(sessionRoutes)
  app.register(providerRoutes)

  return app
}
